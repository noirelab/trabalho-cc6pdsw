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
export declare function parsePagination(query: Record<string, unknown>, moduleName: string): PaginationParams;
export declare function buildSearchFilter(search: string, fields: string[]): {
    OR?: undefined;
} | {
    OR: {
        [x: string]: {
            contains: string;
        };
    }[];
};
//# sourceMappingURL=pagination.d.ts.map