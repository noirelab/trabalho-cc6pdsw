import { CreateContactInput, UpdateContactInput } from "./contacts.schema";
import { PaginatedResult } from "../../lib/pagination";
export declare function listContacts(): Promise<{
    message: string;
    id: number;
    name: string;
    createdAt: Date;
    email: string;
}[]>;
export declare function listContactsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>>;
export declare function createContact(data: CreateContactInput): Promise<{
    message: string;
    id: number;
    name: string;
    createdAt: Date;
    email: string;
}>;
export declare function updateContact(id: number, data: UpdateContactInput): Promise<{
    message: string;
    id: number;
    name: string;
    createdAt: Date;
    email: string;
}>;
export declare function deleteContact(id: number): Promise<void>;
//# sourceMappingURL=contacts.service.d.ts.map