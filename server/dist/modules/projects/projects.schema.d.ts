import { z } from "zod";
export declare const createProjectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    imageUrl?: string | undefined;
}, {
    title: string;
    description: string;
    imageUrl?: string | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | undefined;
}>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
//# sourceMappingURL=projects.schema.d.ts.map