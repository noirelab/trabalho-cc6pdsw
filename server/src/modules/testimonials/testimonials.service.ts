import prisma from "../../lib/prisma";
import {
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from "./testimonials.schema";
import { NotFoundError } from "../../lib/errors";
import { parsePagination, buildSearchFilter, PaginatedResult } from "../../lib/pagination";

export async function listTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listTestimonialsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "testimonials");
  const where = buildSearchFilter(search, ["name", "role", "text"]);

  const [data, total] = await Promise.all([
    prisma.testimonial.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.testimonial.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createTestimonial(data: CreateTestimonialInput) {
  return prisma.testimonial.create({ data });
}

export async function updateTestimonial(
  id: number,
  data: UpdateTestimonialInput
) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) throw new NotFoundError("Depoimento não encontrado");
  return prisma.testimonial.update({ where: { id }, data });
}

export async function deleteTestimonial(id: number) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) throw new NotFoundError("Depoimento não encontrado");
  await prisma.testimonial.delete({ where: { id } });
}
