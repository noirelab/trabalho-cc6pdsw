import { z } from "zod";
export declare const createContactSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    name: string;
    email: string;
}, {
    message: string;
    name: string;
    email: string;
}>;
export declare const updateContactSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
}, {
    message?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
}>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
//# sourceMappingURL=contacts.schema.d.ts.map