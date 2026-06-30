"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_schema_1 = require("./auth.schema");
const authService = __importStar(require("./auth.service"));
const auth_1 = require("../../plugins/auth");
const rate_limit_1 = require("../../plugins/rate-limit");
async function authRoutes(app) {
    app.post("/api/auth/login", { preHandler: rate_limit_1.loginRateLimit }, async (request, reply) => {
        const parsed = auth_schema_1.loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const result = await authService.login(parsed.data.username, parsed.data.password);
        reply.setCookie("auth-token", result.token, {
            httpOnly: true,
            maxAge: 86400,
            path: "/",
            sameSite: "lax",
        });
        (0, rate_limit_1.clearRateLimit)(request.ip);
        return reply.send({ user: result.user });
    });
    app.get("/api/auth/me", { preHandler: auth_1.authMiddleware }, async (request, reply) => {
        const user = await authService.getUser(request.user.userId);
        return reply.send({ user });
    });
    app.post("/api/auth/logout", { preHandler: auth_1.authMiddleware }, async (_request, reply) => {
        reply.clearCookie("auth-token", { path: "/" });
        return reply.send({ message: "Logout realizado" });
    });
}
//# sourceMappingURL=auth.routes.js.map