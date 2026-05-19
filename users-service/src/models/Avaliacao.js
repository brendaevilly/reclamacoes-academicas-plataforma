import { prisma } from "../database/connection.js";

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );

export const Avaliacao = {
  createOrUpdate: async (data) => {
    const { universidadeId, usuarioId, nota } = clean(data);

    // Validar nota (0 a 5)
    if (nota < 0 || nota > 5) {
      throw new Error("A nota deve estar entre 0 e 5.");
    }

    return prisma.avaliacao.upsert({
      where: {
        universidadeId_usuarioId: {
          universidadeId: Number(universidadeId),
          usuarioId: Number(usuarioId)
        }
      },
      update: {
        nota: Number(nota)
      },
      create: {
        universidadeId: Number(universidadeId),
        usuarioId: Number(usuarioId),
        nota: Number(nota)
      }
    });
  },

  findByUniversidade: async (universidadeId) => {
    return prisma.avaliacao.findMany({
      where: {
        universidadeId: Number(universidadeId)
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  getAverageRating: async (universidadeId) => {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        universidadeId: Number(universidadeId)
      },
      select: {
        nota: true
      }
    });

    if (avaliacoes.length === 0) {
      return {
        media: 0,
        total: 0
      };
    }

    const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    const media = soma / avaliacoes.length;

    return {
      media: Number(media.toFixed(1)),
      total: avaliacoes.length
    };
  },

  findByUsuarioAndUniversidade: async (usuarioId, universidadeId) => {
    return prisma.avaliacao.findUnique({
      where: {
        universidadeId_usuarioId: {
          universidadeId: Number(universidadeId),
          usuarioId: Number(usuarioId)
        }
      }
    });
  }
};

