import { CreateUserInput, UpdateUserInput } from "./users.schema";
import { PaginatedResult } from "../../lib/pagination";
export declare function listUsers(): Promise<{
    username: string;
    id: number;
    name: string;
    createdAt: Date;
}[]>;
export declare function listUsersPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>>;
export declare function createUser(data: CreateUserInput): Promise<{
    username: string;
    id: number;
    name: string;
    createdAt: Date;
}>;
export declare function updateUser(id: number, data: UpdateUserInput): Promise<{
    username: string;
    id: number;
    name: string;
    createdAt: Date;
}>;
export declare function deleteUser(id: number): Promise<void>;
//# sourceMappingURL=users.service.d.ts.map