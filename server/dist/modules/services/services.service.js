"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = listServices;
exports.listServicesPaginated = listServicesPaginated;
exports.getServiceById = getServiceById;
exports.createService = createService;
exports.updateService = updateService;
exports.deleteService = deleteService;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const errors_1 = require("../../lib/errors");
const pagination_1 = require("../../lib/pagination");
async function listServices() {
    return prisma_1.default.service.findMany({
        orderBy: { createdAt: "asc" },
    });
}
async function listServicesPaginated(query) {
    const { page, limit, sort, order, search } = (0, pagination_1.parsePagination)(query, "services");
    const where = (0, pagination_1.buildSearchFilter)(search, ["title", "description"]);
    const [data, total] = await Promise.all([
        prisma_1.default.service.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
        prisma_1.default.service.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function getServiceById(id) {
    const service = await prisma_1.default.service.findUnique({ where: { id } });
    if (!service)
        throw new errors_1.NotFoundError("Serviço não encontrado");
    return service;
}
async function createService(data) {
    return prisma_1.default.service.create({ data });
}
async function updateService(id, data) {
    const service = await prisma_1.default.service.findUnique({ where: { id } });
    if (!service)
        throw new errors_1.NotFoundError("Serviço não encontrado");
    return prisma_1.default.service.update({ where: { id }, data });
}
async function deleteService(id) {
    const service = await prisma_1.default.service.findUnique({ where: { id } });
    if (!service)
        throw new errors_1.NotFoundError("Serviço não encontrado");
    await prisma_1.default.service.delete({ where: { id } });
}
//# sourceMappingURL=services.service.js.map