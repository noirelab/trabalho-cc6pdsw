import prisma from "../../lib/prisma";
import { NotFoundError, ValidationError, ForbiddenError } from "../../lib/errors";
import { parsePagination, PaginatedResult } from "../../lib/pagination";
import {
  CreateProposalInput,
  UpdateProposalInput,
  StatusTransitionInput,
  AddItemInput,
  UpdateItemInput,
} from "./proposal.schema";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected"],
};

function validateTransition(current: string, next: string) {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new ValidationError(
      `Transição inválida: ${current} → ${next}`
    );
  }
}

async function recalcProposal(proposalId: number) {
  const items = await prisma.proposalItem.findMany({ where: { proposalId } });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return;

  const total = Math.max(0, subtotal - proposal.discount);

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { subtotal, total },
  });
}

export async function listProposalsPaginated(query: Record<string, unknown>): Promise<PaginatedResult<unknown>> {
  const { page, limit, sort, order, search } = parsePagination(query, "proposals");
  const status = query.status as string | undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { clientName: { contains: search } },
      { clientEmail: { contains: search } },
    ];
  }
  if (status && ["draft", "sent", "accepted", "rejected", "expired"].includes(status)) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.proposal.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
    prisma.proposal.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProposalById(id: number) {
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      items: { include: { service: true } },
      history: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  return proposal;
}

export async function createProposal(data: CreateProposalInput, userId: number) {
  const { items, discount, ...proposalData } = data;

  const serviceIds = items.map((i) => i.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });

  if (services.length !== serviceIds.length) {
    throw new ValidationError("Um ou mais serviços não foram encontrados");
  }

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const proposal = await prisma.$transaction(async (tx) => {
    const p = await tx.proposal.create({
      data: {
        ...proposalData,
        clientEmail: proposalData.clientEmail.trim().toLowerCase(),
        discount: discount ?? 0,
      },
    });

    for (const item of items) {
      const service = serviceMap.get(item.serviceId)!;
      await tx.proposalItem.create({
        data: {
          proposalId: p.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: service.price,
          subtotal: item.quantity * service.price,
        },
      });
    }

    await tx.proposalHistory.create({
      data: {
        proposalId: p.id,
        userId,
        field: "status",
        oldValue: null,
        newValue: "draft",
      },
    });

    return p;
  });

  await recalcProposal(proposal.id);
  return getProposalById(proposal.id);
}

export async function updateProposal(id: number, data: UpdateProposalInput) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");

  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const updateData: any = { ...data };
  if (data.clientEmail) {
    updateData.clientEmail = data.clientEmail.trim().toLowerCase();
  }

  await prisma.proposal.update({ where: { id }, data: updateData });

  if (data.discount !== undefined) {
    await recalcProposal(id);
  }

  return getProposalById(id);
}

export async function transitionStatus(id: number, input: StatusTransitionInput, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");

  validateTransition(proposal.status, input.status);

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: { id },
      data: { status: input.status },
    });

    await tx.proposalHistory.create({
      data: {
        proposalId: id,
        userId,
        field: "status",
        oldValue: proposal.status,
        newValue: input.status,
      },
    });
  });

  return getProposalById(id);
}

export async function addItem(proposalId: number, data: AddItemInput, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service) throw new NotFoundError("Serviço não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.proposalItem.create({
      data: {
        proposalId,
        serviceId: data.serviceId,
        quantity: data.quantity,
        unitPrice: service.price,
        subtotal: data.quantity * service.price,
      },
    });

    await tx.proposalHistory.create({
      data: {
        proposalId,
        userId,
        field: "items",
        oldValue: null,
        newValue: `Adicionado serviço #${data.serviceId} (qty: ${data.quantity})`,
      },
    });
  });

  await recalcProposal(proposalId);
  return getProposalById(proposalId);
}

export async function updateItem(proposalId: number, itemId: number, data: UpdateItemInput, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const item = await prisma.proposalItem.findUnique({ where: { id: itemId } });
  if (!item || item.proposalId !== proposalId) throw new NotFoundError("Item não encontrado");

  const newSubtotal = data.quantity * item.unitPrice;

  await prisma.$transaction(async (tx) => {
    await tx.proposalItem.update({
      where: { id: itemId },
      data: { quantity: data.quantity, subtotal: newSubtotal },
    });

    await tx.proposalHistory.create({
      data: {
        proposalId,
        userId,
        field: "items",
        oldValue: `Serviço #${item.serviceId} qty: ${item.quantity}`,
        newValue: `Serviço #${item.serviceId} qty: ${data.quantity}`,
      },
    });
  });

  await recalcProposal(proposalId);
  return getProposalById(proposalId);
}

export async function deleteItem(proposalId: number, itemId: number, userId: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new ForbiddenError("Apenas propostas em rascunho podem ser editadas");
  }

  const item = await prisma.proposalItem.findUnique({ where: { id: itemId } });
  if (!item || item.proposalId !== proposalId) throw new NotFoundError("Item não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.proposalItem.delete({ where: { id: itemId } });

    await tx.proposalHistory.create({
      data: {
        proposalId,
        userId,
        field: "items",
        oldValue: `Serviço #${item.serviceId} (qty: ${item.quantity})`,
        newValue: "Removido",
      },
    });
  });

  await recalcProposal(proposalId);
  return getProposalById(proposalId);
}

export async function deleteProposal(id: number) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new NotFoundError("Proposta não encontrada");
  await prisma.proposal.delete({ where: { id } });
}

export async function getReports() {
  const proposals = await prisma.proposal.findMany();

  const byStatus: Record<string, number> = { draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0 };
  let totalRevenue = 0;

  for (const p of proposals) {
    byStatus[p.status]++;
    if (p.status === "accepted") {
      totalRevenue += p.total;
    }
  }

  const resolved = byStatus.accepted + byStatus.rejected;
  const conversionRate = resolved > 0 ? byStatus.accepted / resolved : 0;

  return {
    totalProposals: proposals.length,
    byStatus,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

export async function expireOverdue() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const updated = await prisma.proposal.updateMany({
    where: {
      status: "sent",
      updatedAt: { lt: sevenDaysAgo },
    },
    data: { status: "expired" },
  });

  return updated.count;
}
