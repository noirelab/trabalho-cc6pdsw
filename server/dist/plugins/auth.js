"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAdmin = requireAdmin;
exports.signToken = signToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../lib/errors");
const JWT_SECRET = process.env.JWT_SECRET || "unobtainium-super-secret";
async function authMiddleware(request, _reply) {
    const token = request.cookies["auth-token"];
    if (!token) {
        throw new errors_1.UnauthorizedError("Não autenticado");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        request.user = payload;
    }
    catch {
        throw new errors_1.UnauthorizedError("Token inválido ou expirado");
    }
}
async function requireAdmin(request, _reply) {
    if (!request.user || request.user.role !== "admin") {
        throw new errors_1.ForbiddenError("Acesso restrito a administradores");
    }
}
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}
//# sourceMappingURL=auth.js.map