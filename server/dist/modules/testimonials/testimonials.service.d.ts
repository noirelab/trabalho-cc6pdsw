import { CreateTestimonialInput, UpdateTestimonialInput } from "./testimonials.schema";
import { PaginatedResult } from "../../lib/pagination";
export declare function listTestimonials(): Promise<{
    id: number;
    role: string;
    name: string;
    createdAt: Date;
    text: string;
}[]>;
export declare function listTestimonialsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>>;
export declare function createTestimonial(data: CreateTestimonialInput): Promise<{
    id: number;
    role: string;
    name: string;
    createdAt: Date;
    text: string;
}>;
export declare function updateTestimonial(id: number, data: UpdateTestimonialInput): Promise<{
    id: number;
    role: string;
    name: string;
    createdAt: Date;
    text: string;
}>;
export declare function deleteTestimonial(id: number): Promise<void>;
//# sourceMappingURL=testimonials.service.d.ts.map