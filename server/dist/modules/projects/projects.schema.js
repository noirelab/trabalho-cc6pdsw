"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Título é obrigatório"),
    description: zod_1.z.string().min(1, "Descrição é obrigatória"),
    imageUrl: zod_1.z.string().optional(),
});
exports.updateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    imageUrl: zod_1.z.string().optional(),
});
//# sourceMappingURL=projects.schema.js.map