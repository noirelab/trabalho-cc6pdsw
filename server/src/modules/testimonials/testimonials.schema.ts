import { z } from "zod";

export const createTestimonialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().min(1, "Cargo é obrigatório"),
  text: z.string().min(1, "Depoimento é obrigatório"),
});

export const updateTestimonialSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
