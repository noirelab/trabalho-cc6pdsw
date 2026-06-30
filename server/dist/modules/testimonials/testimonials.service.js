"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTestimonials = listTestimonials;
exports.listTestimonialsPaginated = listTestimonialsPaginated;
exports.createTestimonial = createTestimonial;
exports.updateTestimonial = updateTestimonial;
exports.deleteTestimonial = deleteTestimonial;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const errors_1 = require("../../lib/errors");
const pagination_1 = require("../../lib/pagination");
async function listTestimonials() {
    return prisma_1.default.testimonial.findMany({
        orderBy: { createdAt: "desc" },
    });
}
async function listTestimonialsPaginated(query) {
    const { page, limit, sort, order, search } = (0, pagination_1.parsePagination)(query, "testimonials");
    const where = (0, pagination_1.buildSearchFilter)(search, ["name", "role", "text"]);
    const [data, total] = await Promise.all([
        prisma_1.default.testimonial.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
        prisma_1.default.testimonial.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function createTestimonial(data) {
    return prisma_1.default.testimonial.create({ data });
}
async function updateTestimonial(id, data) {
    const testimonial = await prisma_1.default.testimonial.findUnique({ where: { id } });
    if (!testimonial)
        throw new errors_1.NotFoundError("Depoimento não encontrado");
    return prisma_1.default.testimonial.update({ where: { id }, data });
}
async function deleteTestimonial(id) {
    const testimonial = await prisma_1.default.testimonial.findUnique({ where: { id } });
    if (!testimonial)
        throw new errors_1.NotFoundError("Depoimento não encontrado");
    await prisma_1.default.testimonial.delete({ where: { id } });
}
//# sourceMappingURL=testimonials.service.js.map