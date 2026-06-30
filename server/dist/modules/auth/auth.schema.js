"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Usuário é obrigatório"),
    password: zod_1.z.string().min(1, "Senha é obrigatória"),
});
//# sourceMappingURL=auth.schema.js.map