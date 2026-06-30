import { z } from "zod";
export declare const createTestimonialSchema: z.ZodObject<{
    name: z.ZodString;
    role: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: string;
    name: string;
    text: string;
}, {
    role: string;
    name: string;
    text: string;
}>;
export declare const updateTestimonialSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role?: string | undefined;
    name?: string | undefined;
    text?: string | undefined;
}, {
    role?: string | undefined;
    name?: string | undefined;
    text?: string | undefined;
}>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
//# sourceMappingURL=testimonials.schema.d.ts.map