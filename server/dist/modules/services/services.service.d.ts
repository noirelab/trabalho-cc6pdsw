import { CreateServiceInput, UpdateServiceInput } from "./services.schema";
import { PaginatedResult } from "../../lib/pagination";
export declare function listServices(): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
}[]>;
export declare function listServicesPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>>;
export declare function getServiceById(id: number): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
}>;
export declare function createService(data: CreateServiceInput): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
}>;
export declare function updateService(id: number, data: UpdateServiceInput): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
}>;
export declare function deleteService(id: number): Promise<void>;
//# sourceMappingURL=services.service.d.ts.map