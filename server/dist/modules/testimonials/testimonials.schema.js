"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTestimonialSchema = exports.createTestimonialSchema = void 0;
const zod_1 = require("zod");
exports.createTestimonialSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    role: zod_1.z.string().min(1, "Cargo é obrigatório"),
    text: zod_1.z.string().min(1, "Depoimento é obrigatório"),
});
exports.updateTestimonialSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    role: zod_1.z.string().min(1).optional(),
    text: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=testimonials.schema.js.map