"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimit = loginRateLimit;
exports.clearRateLimit = clearRateLimit;
const errors_1 = require("../lib/errors");
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
async function loginRateLimit(request, _reply) {
    const ip = request.ip;
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry) {
        attempts.set(ip, { count: 1, firstAttempt: now });
        return;
    }
    if (now - entry.firstAttempt > WINDOW_MS) {
        attempts.set(ip, { count: 1, firstAttempt: now });
        return;
    }
    if (entry.count >= MAX_ATTEMPTS) {
        throw new errors_1.RateLimitError();
    }
    entry.count++;
}
function clearRateLimit(ip) {
    attempts.delete(ip);
}
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of attempts) {
        if (now - entry.firstAttempt > WINDOW_MS) {
            attempts.delete(ip);
        }
    }
}, 5 * 60 * 1000);
//# sourceMappingURL=rate-limit.js.map