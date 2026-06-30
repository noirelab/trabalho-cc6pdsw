import prisma from "../../lib/prisma";
import { CreateContactInput, UpdateContactInput } from "./contacts.schema";
import { NotFoundError } from "../../lib/errors";

export async function listContacts() {
  return prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createContact(data: CreateContactInput) {
  return prisma.contact.create({ data });
}

export async function updateContact(id: number, data: UpdateContactInput) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new NotFoundError("Contato não encontrado");
  return prisma.contact.update({ where: { id }, data });
}

export async function deleteContact(id: number) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new NotFoundError("Contato não encontrado");
  await prisma.contact.delete({ where: { id } });
}
