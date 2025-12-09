import { prisma } from "../database/connection.js";

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );

export const Universidade = {
  create: async (data) =>
    prisma.universidade.create({
      data: clean(data)
    }),

  findByCampus: async (campus) => {
    const where = clean({ campus });
    if (!where.campus) return null;
    return prisma.universidade.findUnique({
      where,
      select: {
        id: true,
        nome: true,
        sigla: true,
        campus: true
      }
    });
  },

  findAll: async () =>
    prisma.universidade.findMany({
      select: {
        id: true,
        nome: true,
        sigla: true,
        campus: true
      }
    }),

  findById: async (id) => {
    const where = clean({ id });
    if (!where.id) return null;
    return prisma.universidade.findUnique({
      where,
      select: {
        id: true,
        nome: true,
        sigla: true,
        campus: true,
        _count: {
          select: {
            reclamacoes: true
          }
        }
      }
    });
  },

  update: async (id, data) => {
    const where = clean({ id });
    if (!where.id) return null;
    return prisma.universidade.update({
      where,
      data: clean(data),
      select: {
        id: true,
        nome: true,
        sigla: true,
        campus: true
      }
    });
  },

  delete: async (id) => {
    const where = clean({ id });
    if (!where.id) return null;
    return prisma.universidade.delete({ where });
  }
};