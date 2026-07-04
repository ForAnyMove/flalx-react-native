// src/auth/auth.controller.ts
//
// Thin HTTP layer: parse the request, extract the app-session token
// (Bearer or cookie), call AuthService, translate the returned session
// directive into cookie ops, send the DTO. Never touches Supabase; never sees
// provider tokens. Returns `sessionToken` in the body for mobile clients and
// sets the HttpOnly cookie for web.

import type { Request, Response } from 'express';
import { AuthService, ServiceResult, SessionMeta } from './auth.service';
import { AuthError } from './utils/auth-errors';
import { clearSessionCookie, setSessionCookie } from './utils/auth-cookies';
import { getSessionTokenFromRequest } from './session/get-session-token';

const { error: logError } = require('../utils/log_util.js');

const authService = new AuthService();

function sessionMeta(req: Request): SessionMeta {
    const ua = req.headers['user-agent'];
    return {
        userAgent: typeof ua === 'string' ? ua.slice(0, 512) : null,
        ipAddress: req.ip || null,
    };
}

function send(res: Response, result: ServiceResult, successStatus = 200): void {
    if (result.session?.action === 'set') {
        setSessionCookie(res, result.session.token);
    } else if (result.session?.action === 'clear') {
        clearSessionCookie(res);
    }
    res.status(successStatus).json(result.body);
}

function handle(
    fn: (req: Request, res: Response) => Promise<void>
): (req: Request, res: Response) => void {
    return (req, res) => {
        fn(req, res).catch((err: any) => {
            if (err instanceof AuthError) {
                res.status(err.statusCode).json({ code: err.code, message: err.message, messageMeaning: err.reason });
                return;
            }
            // Log server-side only; never echo provider internals to the client.
            logError('Auth error:', err?.message || err);
            res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Authentication failed', messageMeaning: 'internal_error' });
        });
    };
}

// ── registration ────────────────────────────────────────────────────────────

export const registerEmail = handle(async (req, res) => {
    send(res, await authService.registerWithEmail(req.body, sessionMeta(req)), 201);
});

export const registerPhoneStart = handle(async (req, res) => {
    send(res, await authService.startPhoneRegistration(req.body));
});

export const registerPhoneVerify = handle(async (req, res) => {
    send(res, await authService.verifyPhoneRegistration(req.body, sessionMeta(req)), 201);
});

// ── login ────────────────────────────────────────────────────────────────────

export const loginEmail = handle(async (req, res) => {
    send(res, await authService.loginWithEmail(req.body, sessionMeta(req)));
});

export const loginPhoneStart = handle(async (req, res) => {
    send(res, await authService.startPhoneLogin(req.body));
});

export const loginPhoneVerify = handle(async (req, res) => {
    send(res, await authService.verifyPhoneLogin(req.body, sessionMeta(req)));
});

// ── MFA ────────────────────────────────────────────────────────────────────────

export const mfaEnroll = handle(async (req, res) => {
    send(res, await authService.enrollMfa(getSessionTokenFromRequest(req), req.body));
});

export const mfaChallenge = handle(async (req, res) => {
    send(res, await authService.challengeMfa(getSessionTokenFromRequest(req), req.body));
});

export const mfaVerify = handle(async (req, res) => {
    send(res, await authService.verifyMfa(getSessionTokenFromRequest(req), req.body));
});

export const mfaUnenroll = handle(async (req, res) => {
    send(res, await authService.unenrollMfa(getSessionTokenFromRequest(req), req.body));
});

export const mfaFactors = handle(async (req, res) => {
    send(res, await authService.listMfaFactors(getSessionTokenFromRequest(req)));
});

// ── change email / phone / password ──────────────────────────────────────────

export const changeEmailStart = handle(async (req, res) => {
    send(res, await authService.startEmailChange(getSessionTokenFromRequest(req), req.body));
});

export const changePhoneStart = handle(async (req, res) => {
    send(res, await authService.startPhoneChange(getSessionTokenFromRequest(req), req.body));
});

export const changePhoneVerify = handle(async (req, res) => {
    send(res, await authService.verifyPhoneChange(getSessionTokenFromRequest(req), req.body));
});

export const changePassword = handle(async (req, res) => {
    send(res, await authService.changePassword(getSessionTokenFromRequest(req), req.body));
});

// ── forgot / reset password ──────────────────────────────────────────────────

export const forgotPassword = handle(async (req, res) => {
    send(res, await authService.forgotPassword(req.body));
});

export const resetPassword = handle(async (req, res) => {
    send(res, await authService.resetPassword(req.body));
});

// ── logout ────────────────────────────────────────────────────────────────────

export const logout = handle(async (req, res) => {
    send(res, await authService.logout(getSessionTokenFromRequest(req)));
});

export const logoutAll = handle(async (req, res) => {
    send(res, await authService.logoutAll(getSessionTokenFromRequest(req)));
});

// ── me ────────────────────────────────────────────────────────────────────────
// Mounted behind requireAuth, so req.auth is populated (works for both the
// Bearer and cookie transports). Returns 401 upstream if the session is invalid.
export const me = handle(async (req, res) => {
    res.status(200).json({ user: req.auth?.user ?? null });
});
