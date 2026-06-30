"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getUser = getUser;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../../plugins/auth");
const errors_1 = require("../../lib/errors");
async function login(username, password) {
    const user = await prisma_1.default.user.findUnique({ where: { username } });
    if (!user) {
        throw new errors_1.UnauthorizedError("Credenciais inválidas");
    }
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid) {
        throw new errors_1.UnauthorizedError("Credenciais inválidas");
    }
    const payload = { userId: user.id, username: user.username, role: user.role };
    const token = (0, auth_1.signToken)(payload);
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
        },
    };
}
async function getUser(userId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, name: true, createdAt: true },
    });
    if (!user) {
        throw new errors_1.NotFoundError("Usuário não encontrado");
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map