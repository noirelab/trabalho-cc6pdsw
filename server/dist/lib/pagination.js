"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildSearchFilter = buildSearchFilter;
const VALID_SORT_FIELDS = {
    users: ["id", "username", "name", "createdAt"],
    services: ["id", "title", "createdAt", "updatedAt"],
    contacts: ["id", "name", "email", "createdAt"],
    projects: ["id", "title", "createdAt", "updatedAt"],
    testimonials: ["id", "name", "role", "createdAt"],
    proposals: ["id", "title", "clientName", "status", "total", "createdAt", "updatedAt"],
};
function parsePagination(query, moduleName) {
    const allowedSorts = VALID_SORT_FIELDS[moduleName] || VALID_SORT_FIELDS.services;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const sort = String(query.sort || "createdAt");
    const order = (String(query.order || "desc") === "asc" ? "asc" : "desc");
    const search = String(query.search || "").trim();
    return {
        page,
        limit,
        sort: allowedSorts.includes(sort) ? sort : "createdAt",
        order,
        search,
    };
}
function buildSearchFilter(search, fields) {
    if (!search)
        return {};
    return {
        OR: fields.map((field) => ({
            [field]: { contains: search },
        })),
    };
}
//# sourceMappingURL=pagination.js.map