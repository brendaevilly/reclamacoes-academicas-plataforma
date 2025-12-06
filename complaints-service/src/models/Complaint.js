
import prisma from "../database/connection.js";

const Complaint = {
    // CRUD Básico usando Prisma
    async create(data) {
        const { titulo, descricao, categoria, universidade_id, aluno_id } = data;

        // Buscar categoria pelo nome
        let categoriaObj = await prisma.categoria.findUnique({
            where: { nome: categoria }
        });

        // Se não existir, criar categoria
        if (!categoriaObj) {
            categoriaObj = await prisma.categoria.create({
                data: { nome: categoria }
            });
        }

        return await prisma.reclamacao.create({
            data: {
                titulo,
                descricao,
                categoriaId: categoriaObj.id,
                universidadeId: universidade_id,
                alunoId: aluno_id,
                status: 'Pendente'
            },
            include: {
                categoria: true,
                universidade: true,
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                }
            }
        });
    },

    async findById(id) {
        return await prisma.reclamacao.findUnique({
            where: { id: parseInt(id) },
            include: {
                categoria: true,
                universidade: true,
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                comentarios: {
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
                }
            }
        });
    },

    async findAll({ limit = 10, offset = 0, category, universityId }) {
        // Garantir que limit e offset sejam números
        const parsedLimit = parseInt(limit) || 10;
        const parsedOffset = parseInt(offset) || 0;

        const where = {};

        if (category && category !== "Todos") {
            const categorias = Array.isArray(category)
                ? [...new Set(category)] // remove duplicados
                : [category];

            const categoriasObj = await prisma.categoria.findMany({
                where: {
                    nome: {
                        in: categorias
                    }
                },
                select: { id: true }
            });

            if (categoriasObj.length > 0) {
                where.categoriaId = {
                    in: categoriasObj.map(c => c.id)
                };
            }
        }


        if (universityId) {
            where.universidadeId = parseInt(universityId);
        }

        return await prisma.reclamacao.findMany({
            where,
            include: {
                categoria: true,
                universidade: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        comentarios: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parsedLimit,
            skip: parsedOffset
        });
    },

    async update(id, data) {
        const { titulo, descricao, categoria, status } = data;
        const updateData = {};

        if (titulo) updateData.titulo = titulo;
        if (descricao) updateData.descricao = descricao;
        if (status) updateData.status = status;

        if (categoria) {
            let categoriaObj = await prisma.categoria.findUnique({
                where: { nome: categoria }
            });

            if (!categoriaObj) {
                categoriaObj = await prisma.categoria.create({
                    data: { nome: categoria }
                });
            }

            updateData.categoriaId = categoriaObj.id;
        }

        return await prisma.reclamacao.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                categoria: true,
                universidade: true,
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                }
            }
        });
    },

    async delete(id) {
        return await prisma.reclamacao.delete({
            where: { id: parseInt(id) }
        });
    },

    async countAll({ category, universityId }) {
        const where = {};

        if (category && category !== 'Todos') {
            const categoriaObj = await prisma.categoria.findUnique({
                where: { nome: category }
            });
            if (categoriaObj) {
                where.categoriaId = categoriaObj.id;
            }
        }

        if (universityId) {
            where.universidadeId = parseInt(universityId);
        }

        return await prisma.reclamacao.count({ where });
    },

    async findByStudentId(alunoId, { limit = 10, offset = 0 }) {
        const parsedLimit = parseInt(limit) || 10;
        const parsedOffset = parseInt(offset) || 0;

        return await prisma.reclamacao.findMany({
            where: {
                alunoId: parseInt(alunoId)
            },
            include: {
                categoria: true,
                universidade: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                _count: {
                    select: {
                        comentarios: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parsedLimit,
            skip: parsedOffset
        });
    },

    async countByStudentId(alunoId) {
        return await prisma.reclamacao.count({
            where: {
                alunoId: parseInt(alunoId)
            }
        });
    }
};

export default Complaint;
