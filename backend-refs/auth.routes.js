// src/auth/auth.routes.js
//
// Explicit endpoints (no generic register(type, payload)). Mounted at /auth
// from src/index.js. Controllers do the work; routes only wire URLs + light
// rate limiting on the sensitive surfaces.

require('ts-node/register/transpile-only');

const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('./auth.controller.ts');
const { requireAuth } = require('./middleware/require-auth.ts');

const router = express.Router();

// Rate limiters for the abuse-prone surfaces (login / OTP / password reset).
// Provider (Supabase) enforces its own limits too; this is defense in depth.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

// ── registration ────────────────────────────────────────────────────────────
router.post('/register/email', authLimiter, controller.registerEmail);
router.post('/register/phone/start', otpLimiter, controller.registerPhoneStart);
router.post('/register/phone/verify', otpLimiter, controller.registerPhoneVerify);

// ── login ────────────────────────────────────────────────────────────────────
router.post('/login/email', authLimiter, controller.loginEmail);
router.post('/login/phone/start', otpLimiter, controller.loginPhoneStart);
router.post('/login/phone/verify', otpLimiter, controller.loginPhoneVerify);

// ── MFA ────────────────────────────────────────────────────────────────────────
router.post('/mfa/enroll', controller.mfaEnroll);
router.post('/mfa/challenge', controller.mfaChallenge);
router.post('/mfa/verify', controller.mfaVerify);
router.post('/mfa/unenroll', controller.mfaUnenroll);
router.get('/mfa/factors', controller.mfaFactors);

// ── change email / phone / password ──────────────────────────────────────────
router.post('/change-email/start', controller.changeEmailStart);
router.post('/change-phone/start', otpLimiter, controller.changePhoneStart);
router.post('/change-phone/verify', otpLimiter, controller.changePhoneVerify);
router.post('/change-password', controller.changePassword);

// ── forgot / reset password ──────────────────────────────────────────────────
router.post('/forgot-password', authLimiter, controller.forgotPassword);
router.post('/reset-password', authLimiter, controller.resetPassword);

// ── logout ────────────────────────────────────────────────────────────────────
router.post('/logout', controller.logout);
router.post('/logout-all', controller.logoutAll);

// ── me ────────────────────────────────────────────────────────────────────────
// Works for both web (cookie) and Expo (Bearer); 401 if the session is invalid.
router.get('/me', requireAuth, controller.me);

module.exports = router;
