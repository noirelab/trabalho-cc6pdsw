"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjects = listProjects;
exports.listProjectsPaginated = listProjectsPaginated;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const errors_1 = require("../../lib/errors");
const pagination_1 = require("../../lib/pagination");
async function listProjects() {
    return prisma_1.default.project.findMany({
        orderBy: { createdAt: "desc" },
    });
}
async function listProjectsPaginated(query) {
    const { page, limit, sort, order, search } = (0, pagination_1.parsePagination)(query, "projects");
    const where = (0, pagination_1.buildSearchFilter)(search, ["title", "description"]);
    const [data, total] = await Promise.all([
        prisma_1.default.project.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
        prisma_1.default.project.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function createProject(data) {
    return prisma_1.default.project.create({ data });
}
async function updateProject(id, data) {
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project)
        throw new errors_1.NotFoundError("Projeto não encontrado");
    return prisma_1.default.project.update({ where: { id }, data });
}
async function deleteProject(id) {
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project)
        throw new errors_1.NotFoundError("Projeto não encontrado");
    await prisma_1.default.project.delete({ where: { id } });
}
//# sourceMappingURL=projects.service.js.map