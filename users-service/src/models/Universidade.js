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

  findByEmail: async (email) => {
    const where = clean({ email });
    if (!where.email) return null;
    return prisma.universidade.findUnique({
      where,
      // Incluir explicitamente a senha para a verificação de login
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        cnpj: true,
        descricao: true
      }
    });
  },

  findByCnpj: async (cnpj) => {
    const where = clean({ cnpj });
    if (!where.cnpj) return null;
    return prisma.universidade.findUnique({ where });
  },

  findAll: async () =>
    prisma.universidade.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cnpj: true,
        descricao: true
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
        email: true,
        cnpj: true,
        descricao: true,
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
        email: true,
        cnpj: true,
        descricao: true
      }
    });
  },

  delete: async (id) => {
    const where = clean({ id });
    if (!where.id) return null;
    return prisma.universidade.delete({ where });
  }
};