import prisma from "../../lib/prisma";
import { CreateContactInput } from "./contacts.schema";

export async function listContacts() {
  return prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createContact(data: CreateContactInput) {
  return prisma.contact.create({ data });
}

export async function deleteContact(id: number) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new Error("Contato não encontrado");
  await prisma.contact.delete({ where: { id } });
}
