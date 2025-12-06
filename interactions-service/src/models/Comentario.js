import prisma from "../database/connection.js";

const Comentario = {
    // Criar comentário
    async create(data) {
        const { texto, reclamacaoId, autorId, universidadeId } = data;
        
        return await prisma.comentario.create({
            data: {
                texto,
                reclamacaoId: parseInt(reclamacaoId),
                autorId: autorId ? parseInt(autorId) : null,
                universidadeId: universidadeId ? parseInt(universidadeId) : null
            },
            include: {
                autor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                universidade: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                reclamacao: {
                    select: {
                        id: true,
                        titulo: true,
                        alunoId: true
                    }
                }
            }
        });
    },

    // Buscar comentários por reclamação
    async findByReclamacao(reclamacaoId) {
        return await prisma.comentario.findMany({
            where: {
                reclamacaoId: parseInt(reclamacaoId)
            },
            include: {
                autor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                universidade: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    },

    // Buscar comentário por ID
    async findById(id) {
        return await prisma.comentario.findUnique({
            where: { id: parseInt(id) },
            include: {
                autor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                universidade: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                reclamacao: true
            }
        });
    },

    // Atualizar comentário
    async update(id, data) {
        return await prisma.comentario.update({
            where: { id: parseInt(id) },
            data: {
                texto: data.texto
            },
            include: {
                autor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                universidade: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });
    },

    // Deletar comentário
    async delete(id) {
        return await prisma.comentario.delete({
            where: { id: parseInt(id) }
        });
    }
};

export default Comentario;
