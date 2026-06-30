"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactSchema = exports.createContactSchema = void 0;
const zod_1 = require("zod");
exports.createContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    email: zod_1.z.string().email("Email inválido"),
    message: zod_1.z.string().min(1, "Mensagem é obrigatória"),
});
exports.updateContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email("Email inválido").optional(),
    message: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=contacts.schema.js.map