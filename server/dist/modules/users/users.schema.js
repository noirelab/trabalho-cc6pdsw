"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
    password: zod_1.z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
});
exports.updateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).optional(),
    password: zod_1.z.string().min(6).optional(),
    name: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=users.schema.js.map