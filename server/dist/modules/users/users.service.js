"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.listUsersPaginated = listUsersPaginated;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const errors_1 = require("../../lib/errors");
const pagination_1 = require("../../lib/pagination");
async function listUsers() {
    return prisma_1.default.user.findMany({
        select: { id: true, username: true, name: true, createdAt: true },
    });
}
async function listUsersPaginated(query) {
    const { page, limit, sort, order, search } = (0, pagination_1.parsePagination)(query, "users");
    const where = (0, pagination_1.buildSearchFilter)(search, ["username", "name"]);
    const [data, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            select: { id: true, username: true, name: true, role: true, createdAt: true },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sort]: order },
        }),
        prisma_1.default.user.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function createUser(data) {
    const existing = await prisma_1.default.user.findUnique({
        where: { username: data.username },
    });
    if (existing) {
        throw new errors_1.ValidationError("Usuário já existe");
    }
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    return prisma_1.default.user.create({
        data: { ...data, password: hashedPassword },
        select: { id: true, username: true, name: true, createdAt: true },
    });
}
async function updateUser(id, data) {
    const user = await prisma_1.default.user.findUnique({ where: { id } });
    if (!user)
        throw new errors_1.NotFoundError("Usuário não encontrado");
    const updateData = { ...data };
    if (data.password) {
        updateData.password = await bcryptjs_1.default.hash(data.password, 10);
    }
    return prisma_1.default.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, name: true, createdAt: true },
    });
}
async function deleteUser(id) {
    const user = await prisma_1.default.user.findUnique({ where: { id } });
    if (!user)
        throw new errors_1.NotFoundError("Usuário não encontrado");
    await prisma_1.default.user.delete({ where: { id } });
}
//# sourceMappingURL=users.service.js.map