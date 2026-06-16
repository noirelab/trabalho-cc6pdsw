import prisma from "../../lib/prisma";
import {
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from "./testimonials.schema";

export async function listTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createTestimonial(data: CreateTestimonialInput) {
  return prisma.testimonial.create({ data });
}

export async function updateTestimonial(
  id: number,
  data: UpdateTestimonialInput
) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) throw new Error("Depoimento não encontrado");
  return prisma.testimonial.update({ where: { id }, data });
}

export async function deleteTestimonial(id: number) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) throw new Error("Depoimento não encontrado");
  await prisma.testimonial.delete({ where: { id } });
}
