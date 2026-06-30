import { CreateProjectInput, UpdateProjectInput } from "./projects.schema";
import { PaginatedResult } from "../../lib/pagination";
export declare function listProjects(): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
    imageUrl: string;
}[]>;
export declare function listProjectsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>>;
export declare function createProject(data: CreateProjectInput): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
    imageUrl: string;
}>;
export declare function updateProject(id: number, data: UpdateProjectInput): Promise<{
    id: number;
    createdAt: Date;
    title: string;
    updatedAt: Date;
    description: string;
    imageUrl: string;
}>;
export declare function deleteProject(id: number): Promise<void>;
//# sourceMappingURL=projects.service.d.ts.map