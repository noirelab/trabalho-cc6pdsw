"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContacts = listContacts;
exports.listContactsPaginated = listContactsPaginated;
exports.createContact = createContact;
exports.updateContact = updateContact;
exports.deleteContact = deleteContact;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const errors_1 = require("../../lib/errors");
const pagination_1 = require("../../lib/pagination");
async function listContacts() {
    return prisma_1.default.contact.findMany({
        orderBy: { createdAt: "desc" },
    });
}
async function listContactsPaginated(query) {
    const { page, limit, sort, order, search } = (0, pagination_1.parsePagination)(query, "contacts");
    const where = (0, pagination_1.buildSearchFilter)(search, ["name", "email", "message"]);
    const [data, total] = await Promise.all([
        prisma_1.default.contact.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
        prisma_1.default.contact.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function createContact(data) {
    return prisma_1.default.contact.create({ data });
}
async function updateContact(id, data) {
    const contact = await prisma_1.default.contact.findUnique({ where: { id } });
    if (!contact)
        throw new errors_1.NotFoundError("Contato não encontrado");
    return prisma_1.default.contact.update({ where: { id }, data });
}
async function deleteContact(id) {
    const contact = await prisma_1.default.contact.findUnique({ where: { id } });
    if (!contact)
        throw new errors_1.NotFoundError("Contato não encontrado");
    await prisma_1.default.contact.delete({ where: { id } });
}
//# sourceMappingURL=contacts.service.js.map