import { prisma } from "../database/connection.js";
import bcrypt from "bcryptjs";

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );

export const User = {
  create: async (data) =>
    prisma.usuario.create({
      data: clean(data)
    }),

  findByEmail: async (email) => {
    const where = clean({ email });

    if (!where.email) return null; 
    return prisma.usuario.findUnique({ 
    where,
    // Incluir explicitamente a senha para a verificação de login
    select: {
      id: true,
      nome: true,
      email: true,
      senha: true,
    }
  });
  },

  findAll: async () =>
    prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true
      }
    }),

  findById: async (id) => {
    const where = clean({ id });

    if (!where.id) return null; 
    return prisma.usuario.findUnique({
      where,
      select: {
        id: true,
        nome: true,
        email: true
      }
    });
  },

  update: async (id, data) => {
    const where = clean({ id });
    if (!where.id) return null;

    const updateData = clean(data);
    
    // Se houver senha, fazer hash
    if (updateData.senha) {
      updateData.senha = await bcrypt.hash(updateData.senha, 10);
    }

    return prisma.usuario.update({
      where,
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true
      }
    });
  },

  delete: async (id) => {
    const where = clean({ id });

    if (!where.id) return null; 
    return prisma.usuario.delete({ where });
  }
};