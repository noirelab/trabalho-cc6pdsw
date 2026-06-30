export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const VALID_SORT_FIELDS: Record<string, string[]> = {
  users: ["id", "username", "name", "createdAt"],
  services: ["id", "title", "createdAt", "updatedAt"],
  contacts: ["id", "name", "email", "createdAt"],
  projects: ["id", "title", "createdAt", "updatedAt"],
  testimonials: ["id", "name", "role", "createdAt"],
  proposals: ["id", "title", "clientName", "status", "total", "createdAt", "updatedAt"],
};

export function parsePagination(
  query: Record<string, unknown>,
  moduleName: string
): PaginationParams {
  const allowedSorts = VALID_SORT_FIELDS[moduleName] || VALID_SORT_FIELDS.services;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const sort = String(query.sort || "createdAt");
  const order = (String(query.order || "desc") === "asc" ? "asc" : "desc") as "asc" | "desc";
  const search = String(query.search || "").trim();

  return {
    page,
    limit,
    sort: allowedSorts.includes(sort) ? sort : "createdAt",
    order,
    search,
  };
}

export function buildSearchFilter(search: string, fields: string[]) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search },
    })),
  };
}
