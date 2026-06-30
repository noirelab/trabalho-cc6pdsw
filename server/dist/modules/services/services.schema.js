"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceSchema = exports.createServiceSchema = void 0;
const zod_1 = require("zod");
exports.createServiceSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Título é obrigatório"),
    description: zod_1.z.string().min(1, "Descrição é obrigatória"),
});
exports.updateServiceSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=services.schema.js.map