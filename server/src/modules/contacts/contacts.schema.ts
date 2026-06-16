import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  message: z.string().min(1, "Mensagem é obrigatória"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
