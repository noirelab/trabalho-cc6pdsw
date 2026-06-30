import { z } from "zod";

export const createProposalSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  notes: z.string().optional(),
  discount: z.number().min(0).optional(),
  items: z.array(
    z.object({
      serviceId: z.number().int().positive(),
      quantity: z.number().int().min(1).default(1),
    })
  ).min(1, "Adicione pelo menos um serviço"),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email("Email inválido").optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).optional(),
});

export const statusTransitionSchema = z.object({
  status: z.enum(["sent", "accepted", "rejected"]),
});

export const addItemSchema = z.object({
  serviceId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
