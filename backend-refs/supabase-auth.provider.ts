// src/auth/providers/supabase-auth.provider.ts
//
// The ONLY file in the codebase's auth module that imports the Supabase SDK.
// It maps Supabase requests/responses to/from our own AuthUser / AuthLoginResult
// / ProviderTokens types. Raw Supabase user/session objects never leave here.
//
// All user-facing messages (email confirmation, SMS OTP, MFA challenge, reset
// email) are delivered by Supabase Auth itself — this backend never sends its
// own SMS/email and never generates OTP codes.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    AuthProvider,
    ChallengeMfaInput,
    ChangePasswordInput,
    EnrollMfaInput,
    LoginWithEmailInput,
    LogoutAllInput,
    LogoutInput,
    ProviderSessionInput,
    RefreshProviderSessionInput,
    RegisterWithEmailInput,
    ResetPasswordInput,
    StartEmailChangeInput,
    StartPasswordResetInput,
    StartPhoneChangeInput,
    StartPhoneLoginInput,
    StartPhoneRegistrationInput,
    UnenrollMfaInput,
    VerifyMfaInput,
    VerifyPhoneOtpInput,
} from '../interfaces/auth-provider.interface';
import {
    AuthActionResult,
    AuthLoginResult,
    AuthProviderName,
    AuthStartResult,
    AuthUser,
    MfaChallengeResult,
    MfaEnrollResult,
    MfaFactorListResult,
    MfaFactorSummary,
    OtpStartResult,
    ProviderSessionResult,
    ProviderTokens,
} from '../types/auth.types';
import { AuthError, mapSupabaseError } from '../utils/auth-errors';

// shared service-role client (persistSession:false) — used for unauthenticated
// flows (sign up / sign in / OTP start / password reset email).
const adminClient: SupabaseClient = require('../../supabaseClient.js');

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const KNOWN_PROVIDERS: AuthProviderName[] = ['email', 'phone', 'google', 'saml', 'custom'];

// Singleton client for STATELESS calls only — currently just getUser(jwt).
// Safe to share across concurrent requests for different users because
// passing the JWT as an argument bypasses auth-js's internal _useSession()
// entirely (confirmed against @supabase/auth-js source: the jwt-argument
// branch of _getUser does a direct fetch, no session read/write). NEVER call
// setSession()/signInWith*()/refreshSession() on this instance — those DO
// mutate shared client-side session state and would race across requests.
const verifierClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Reads the `aal` claim straight out of the (already-trusted, backend-held)
 * access token — the same thing auth-js's getAuthenticatorAssuranceLevel()
 * does internally (decodeJWT(session.access_token).payload.aal), just without
 * needing a client with live session state to call it on.
 */
function decodeAalFromToken(accessToken: string): 'aal1' | 'aal2' {
    try {
        const payload = accessToken.split('.')[1];
        const json = Buffer.from(payload, 'base64url').toString('utf8');
        const claims = JSON.parse(json);
        return claims?.aal === 'aal2' ? 'aal2' : 'aal1';
    } catch {
        return 'aal1';
    }
}

export class SupabaseAuthProvider implements AuthProvider {

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * Builds a request-scoped client bound to a user's session. Used for every
     * operation that must run in the user's own security context (getUser,
     * updateUser, MFA). autoRefreshToken:false — we manage refresh explicitly.
     */
    private async userClient(tokens: ProviderTokens): Promise<SupabaseClient> {
        const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { error } = await client.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });
        if (error) throw mapSupabaseError(error);
        return client;
    }

    private extractTokens(session: any): ProviderTokens {
        if (!session?.access_token || !session?.refresh_token) {
            throw new AuthError('PROVIDER_ERROR', 'Provider did not return a session', 502, 'provider_incomplete_session');
        }
        let expiresAt: string | undefined;
        if (typeof session.expires_at === 'number') {
            expiresAt = new Date(session.expires_at * 1000).toISOString();
        } else if (typeof session.expires_in === 'number') {
            expiresAt = new Date(Date.now() + session.expires_in * 1000).toISOString();
        }
        return {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            accessTokenExpiresAt: expiresAt,
        };
    }

    private mapProviders(user: any): AuthProviderName[] {
        const raw: string[] =
            user?.app_metadata?.providers ||
            (user?.app_metadata?.provider ? [user.app_metadata.provider] : []) ||
            (Array.isArray(user?.identities) ? user.identities.map((i: any) => i.provider) : []);
        const mapped = (raw || []).map((p: string) =>
            (KNOWN_PROVIDERS.includes(p as AuthProviderName) ? p : 'custom') as AuthProviderName
        );
        return Array.from(new Set(mapped));
    }

    private verifiedFactors(user: any): any[] {
        const factors = Array.isArray(user?.factors) ? user.factors : [];
        return factors.filter((f: any) => f?.status === 'verified');
    }

    private mapUser(user: any, authLevel: 'aal1' | 'aal2' = 'aal1'): AuthUser {
        return {
            id: user.id,
            email: user.email ?? null,
            phone: user.phone ?? null,
            emailVerified: !!(user.email_confirmed_at || user.confirmed_at),
            phoneVerified: !!user.phone_confirmed_at,
            mfaEnabled: this.verifiedFactors(user).length > 0,
            authLevel,
            providers: this.mapProviders(user),
        };
    }

    /**
     * Inspects the user's assurance level. Returns whether a second factor is
     * still required plus the list of factors the client can use to satisfy it.
     * Fails soft: if the MFA API is unavailable, treats the session as complete.
     */
    private async assessMfa(client: SupabaseClient): Promise<{
        required: boolean;
        currentLevel: 'aal1' | 'aal2';
        factors: MfaFactorSummary[];
    }> {
        try {
            const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
            const currentLevel = (aal?.currentLevel as 'aal1' | 'aal2') || 'aal1';
            const nextLevel = aal?.nextLevel as 'aal1' | 'aal2' | null;
            const required = !!nextLevel && nextLevel === 'aal2' && currentLevel !== 'aal2';

            let factors: MfaFactorSummary[] = [];
            if (required) {
                const { data: list } = await client.auth.mfa.listFactors();
                const all: any[] = (list as any)?.all ||
                    [...((list as any)?.totp || []), ...((list as any)?.phone || [])];
                factors = all
                    .filter((f) => f?.status === 'verified')
                    .map((f) => ({
                        id: f.id,
                        type: (f.factor_type === 'phone' ? 'phone' : 'totp') as 'totp' | 'phone',
                        phone: f.phone || undefined,
                    }));
            }
            return { required, currentLevel, factors };
        } catch {
            return { required: false, currentLevel: 'aal1', factors: [] };
        }
    }

    /** Shared post-primary-auth mapping for password/OTP verification results. */
    private async buildLoginResult(session: any, user: any): Promise<AuthLoginResult> {
        const tokens = this.extractTokens(session);
        const client = await this.userClient(tokens);
        const mfa = await this.assessMfa(client);

        if (mfa.required) {
            return {
                status: 'mfa_required',
                authLevel: 'aal1',
                user: this.mapUser(user, 'aal1'),
                mfa: { availableFactors: mfa.factors },
                tokens,
            };
        }
        return {
            status: 'authenticated',
            authLevel: mfa.currentLevel,
            user: this.mapUser(user, mfa.currentLevel),
            tokens,
        };
    }

    // ── registration ────────────────────────────────────────────────────────────

    async registerWithEmail(input: RegisterWithEmailInput): Promise<AuthStartResult> {
        const { data, error } = await adminClient.auth.signUp({
            email: input.email,
            password: input.password,
        });

        if (error) throw mapSupabaseError(error);

        // Supabase creates a session immediately only when email confirmation is
        // disabled for the project. Otherwise the user must confirm by email.
        if (data.session) {
            return {
                status: 'authenticated',
                user: this.mapUser(data.user, 'aal1'),
                tokens: this.extractTokens(data.session),
            };
        }
        return {
            status: 'email_confirmation_required',
            user: data.user ? this.mapUser(data.user, 'aal1') : undefined,
        };
    }

    async startPhoneRegistration(input: StartPhoneRegistrationInput): Promise<OtpStartResult> {
        const { error } = await adminClient.auth.signInWithOtp({
            phone: input.phone,
            options: { shouldCreateUser: true },
        });

        if (error) throw mapSupabaseError(error);
        return { status: 'otp_sent' };
    }

    async verifyPhoneRegistration(input: VerifyPhoneOtpInput): Promise<AuthLoginResult> {
        const { data, error } = await adminClient.auth.verifyOtp({
            phone: input.phone,
            token: input.code,
            type: 'sms',
        });
        if (error) throw mapSupabaseError(error);
        if (!data.session || !data.user) {
            throw new AuthError('OTP_INVALID', 'Verification failed', 400, 'otp_invalid');
        }
        return this.buildLoginResult(data.session, data.user);
    }

    // ── login ────────────────────────────────────────────────────────────────────

    async loginWithEmail(input: LoginWithEmailInput): Promise<AuthLoginResult> {
        const { data, error } = await adminClient.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        });
        if (error) throw mapSupabaseError(error);
        if (!data.session || !data.user) {
            throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401, 'invalid_credentials');
        }
        return this.buildLoginResult(data.session, data.user);
    }

    async startPhoneLogin(input: StartPhoneLoginInput): Promise<OtpStartResult> {
        const { error } = await adminClient.auth.signInWithOtp({
            phone: input.phone,
            options: { shouldCreateUser: true },
        });

        if (error) throw mapSupabaseError(error);
        return { status: 'otp_sent' };
    }

    async verifyPhoneLogin(input: VerifyPhoneOtpInput): Promise<AuthLoginResult> {
        const { data, error } = await adminClient.auth.verifyOtp({
            phone: input.phone,
            token: input.code,
            type: 'sms',
        });

        if (error) throw mapSupabaseError(error);
        if (!data.session || !data.user) {
            throw new AuthError('OTP_INVALID', 'Verification failed', 400, 'otp_invalid');
        }
        return this.buildLoginResult(data.session, data.user);
    }

    // ── session ──────────────────────────────────────────────────────────────────

    async getUserByProviderSession(input: ProviderSessionInput): Promise<AuthUser | null> {
        // Stateless call on the shared singleton — ONE network round trip,
        // no per-request createClient()/setSession() overhead. This is the
        // hot path (runs on every "fresh" auth check), so the earlier
        // userClient()+setSession()+getUser() pattern (2 round trips, plus a
        // fresh client every time) was the main source of its latency.
        const { data, error } = await verifierClient.auth.getUser(input.tokens.accessToken);
        if (error || !data?.user) return null;

        const level = decodeAalFromToken(input.tokens.accessToken);
        return this.mapUser(data.user, level);
    }

    async refreshProviderSession(input: RefreshProviderSessionInput): Promise<ProviderSessionResult> {
        // refreshSession() mutates the client's internal session state, so
        // this must NOT run on the shared verifierClient — a per-call client
        // is required for correctness under concurrent requests. This is fine:
        // refresh only fires when the access token is close to expiry (see
        // maybeRefreshProviderSession's margin check), so it's not a hot path.
        const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await client.auth.refreshSession({
            refresh_token: input.refreshToken,
        });
        if (error || !data.session || !data.user) {
            throw new AuthError('SESSION_EXPIRED', 'Provider session could not be refreshed', 401, 'provider_session_refresh_failed');
        }
        const tokens = this.extractTokens(data.session);
        const level = decodeAalFromToken(tokens.accessToken);
        return { user: this.mapUser(data.user, level), tokens };
    }

    // ── MFA ────────────────────────────────────────────────────────────────────

    async enrollMfa(input: EnrollMfaInput): Promise<MfaEnrollResult> {
        const client = await this.userClient(input.tokens);
        const factorType = input.type || 'totp';
        const params: any = { factorType, friendlyName: input.friendlyName };
        if (factorType === 'phone') params.phone = input.phone;

        const { data, error } = await client.auth.mfa.enroll(params);
        if (error) throw mapSupabaseError(error);

        return {
            factorId: data.id,
            type: factorType,
            qrCode: (data as any)?.totp?.qr_code,
            secret: (data as any)?.totp?.secret,
            uri: (data as any)?.totp?.uri,
        };
    }

    async challengeMfa(input: ChallengeMfaInput): Promise<MfaChallengeResult> {
        const client = await this.userClient(input.tokens);
        const { data, error } = await client.auth.mfa.challenge({ factorId: input.factorId });
        if (error) throw mapSupabaseError(error);
        return { challengeId: data.id, factorId: input.factorId };
    }

    async verifyMfa(input: VerifyMfaInput): Promise<AuthLoginResult> {
        const client = await this.userClient(input.tokens);
        const { data, error } = await client.auth.mfa.verify({
            factorId: input.factorId,
            challengeId: input.challengeId,
            code: input.code,
        });
        if (error) throw mapSupabaseError(error);

        // verify returns a fresh aal2 session
        const tokens = this.extractTokens(data);
        const { data: userData } = await client.auth.getUser(tokens.accessToken);
        return {
            status: 'authenticated',
            authLevel: 'aal2',
            user: userData?.user ? this.mapUser(userData.user, 'aal2') : undefined,
            tokens,
        };
    }

    async unenrollMfa(input: UnenrollMfaInput): Promise<void> {
        const client = await this.userClient(input.tokens);
        const { error } = await client.auth.mfa.unenroll({ factorId: input.factorId });
        if (error) throw mapSupabaseError(error);
    }

    async listMfaFactors(input: ProviderSessionInput): Promise<MfaFactorListResult> {
        const client = await this.userClient(input.tokens);
        const { data, error } = await client.auth.mfa.listFactors();
        if (error) throw mapSupabaseError(error);

        const all: any[] = data?.all || [];
        return {
            factors: all.map((f) => ({
                id: f.id,
                type: (f.factor_type === 'phone' ? 'phone' : 'totp') as 'totp' | 'phone',
                status: f.status,
                phone: f.phone || undefined,
                friendlyName: f.friendly_name || undefined,
                createdAt: f.created_at,
            })),
        };
    }

    // ── change email / phone / password ──────────────────────────────────────────

    async startEmailChange(input: StartEmailChangeInput): Promise<AuthActionResult> {
        const client = await this.userClient(input.tokens);
        const { data, error } = await client.auth.updateUser({ email: input.newEmail });
        if (error) throw mapSupabaseError(error);

        // If the project has "Secure email change" disabled, Supabase applies
        // the new email immediately with no confirmation step — reflect that
        // instead of unconditionally claiming confirmation is still pending.
        if (data?.user?.email === input.newEmail) {
            return { status: 'ok' };
        }
        // Otherwise Supabase emailed a confirmation link to the new address;
        // we have no callback for that today (see verifyPhoneChange for the
        // phone equivalent) — the local users profile catches up on the next
        // GET /me sensitive check.
        return { status: 'email_confirmation_required' };
    }

    async startPhoneChange(input: StartPhoneChangeInput): Promise<OtpStartResult> {
        const client = await this.userClient(input.tokens);
        const { error } = await client.auth.updateUser({ phone: input.newPhone });
        if (error) throw mapSupabaseError(error);
        // Supabase sends an SMS OTP to the new number.
        return { status: 'otp_sent' };
    }

    async verifyPhoneChange(input: VerifyPhoneOtpInput): Promise<AuthActionResult> {
        // phone_change verification is unauthenticated w.r.t. the OTP itself.
        const { error } = await adminClient.auth.verifyOtp({
            phone: input.phone,
            token: input.code,
            type: 'phone_change',
        });
        if (error) throw mapSupabaseError(error);
        return { status: 'ok' };
    }

    async changePassword(input: ChangePasswordInput): Promise<AuthActionResult> {
        const client = await this.userClient(input.tokens);
        const { error } = await client.auth.updateUser({ password: input.newPassword });
        if (error) throw mapSupabaseError(error);
        return { status: 'ok' };
    }

    // ── forgot / reset password ──────────────────────────────────────────────────

    async startPasswordReset(input: StartPasswordResetInput): Promise<AuthActionResult> {
        const redirectTo = process.env.AUTH_PASSWORD_RESET_REDIRECT_URL || undefined;
        const { error } = await adminClient.auth.resetPasswordForEmail(input.email, { redirectTo });
        if (error) throw mapSupabaseError(error);
        return { status: 'ok' };
    }

    async resetPassword(input: ResetPasswordInput): Promise<AuthActionResult> {
        if (!input.accessToken || !input.refreshToken) {
            throw new AuthError('VALIDATION_ERROR', 'A valid recovery session is required', 400, 'recovery_session_required');
        }
        const client = await this.userClient({
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
        });
        const { error } = await client.auth.updateUser({ password: input.newPassword });
        if (error) throw mapSupabaseError(error);
        return { status: 'ok' };
    }

    // ── logout ────────────────────────────────────────────────────────────────────

    async logout(input: LogoutInput): Promise<void> {
        try {
            const client = await this.userClient(input.tokens);
            await client.auth.signOut({ scope: 'local' });
        } catch {
            // best-effort — our app session is revoked regardless
        }
    }

    async logoutAll(input: LogoutAllInput): Promise<void> {
        try {
            const client = await this.userClient(input.tokens);
            await client.auth.signOut({ scope: 'global' });
        } catch {
            // best-effort
        }
    }
}
