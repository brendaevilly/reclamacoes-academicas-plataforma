import Complaint from "../models/Complaint.js";
import prisma from "../database/connection.js";

export default {
    // 1. CREATE
    async create(data) {
        try {
            // data deve incluir: titulo, descricao, categoria, universidade_id, aluno_id
            const newComplaint = await Complaint.create(data);
            return {
                status: 201,
                message: "Reclamação registrada com sucesso.",
                data: newComplaint,
            };
        } catch (error) {
            console.error("Erro ao criar reclamação:", error);
            
            // Mensagens de erro mais específicas
            if (error.message && error.message.includes("não encontrado")) {
                return {
                    status: 404,
                    message: error.message,
                };
            }
            
            if (error.code === 'P2003') {
                return {
                    status: 400,
                    message: "Erro de referência: usuário ou universidade não encontrados. Por favor, faça login novamente.",
                };
            }
            
            return {
                status: 500,
                message: "Erro interno do servidor ao registrar reclamação.",
            };
        }
    },

    // 2. READ (Listar - será o feed)
    async list(query) {
        // Garantir que page e limit sejam números
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const { category, universityId, campus, alunoId, userId } = query;
        const offset = (page - 1) * limit;

        // Se userId estiver presente, usar como alunoId (para compatibilidade)
        const alunoIdFinal = alunoId || userId;

        try {
            const complaints = await Complaint.findAll({ limit, offset, category, universityId, campus, alunoId: alunoIdFinal });
            const totalCount = await Complaint.countAll({ category, universityId, campus, alunoId: alunoIdFinal });
            const totalPages = Math.ceil(totalCount / limit);

            // Buscar informações de likes para cada reclamação
            // Nota: Assumindo que o banco é compartilhado entre serviços
            const formattedComplaints = await Promise.all(complaints.map(async (complaint) => {
                // Contar likes da reclamação (com tratamento de erro caso a tabela não exista)
                let likesCount = 0;
                let userLiked = false;
                
                try {
                    likesCount = await prisma.like.count({
                        where: {
                            reclamacaoId: complaint.id
                        }
                    });

                    // Verificar se o usuário logado deu like (se houver userId na query)
                    if (query.userId) {
                        const userLike = await prisma.like.findFirst({
                            where: {
                                usuarioId: parseInt(query.userId),
                                reclamacaoId: complaint.id
                            }
                        });
                        userLiked = !!userLike;
                    }
                } catch (error) {
                    // Se a tabela likes não existir ainda ou Prisma Client não foi regenerado, usar valores padrão
                    if (error.message && error.message.includes('like')) {
                        console.warn("Erro ao buscar likes. Certifique-se de que o Prisma Client foi regenerado após adicionar a tabela Like ao schema.");
                    }
                    likesCount = 0;
                    userLiked = false;
                }

                return {
                    id: complaint.id,
                    titulo: complaint.titulo,
                    descricao: complaint.descricao,
                    categoria: complaint.categoria?.nome || 'Sem categoria',
                    universidade_id: complaint.universidade?.id || complaint.universidadeId,
                    universidade_nome: complaint.universidade?.nome || 'Universidade desconhecida',
                    universidade_sigla: complaint.universidade?.sigla || '',
                    campus: complaint.universidade?.campus || 'Campus não informado',
                    aluno_id: complaint.aluno?.id || complaint.alunoId,
                    aluno_nome: complaint.aluno?.nome || 'Usuário',
                    data_criacao: complaint.createdAt,
                    comentarios_count: complaint._count?.comentarios || 0,
                    likes_count: likesCount,
                    user_liked: userLiked
                };
            }));

            return {
                status: 200,
                message: "Lista de reclamações recuperada com sucesso.",
                data: formattedComplaints,
                meta: {
                    total: totalCount,
                    page: page,
                    limit: limit,
                    totalPages: totalPages,
                }
            };
        } catch (error) {
            console.error("Erro ao listar reclamações:", error);
            return {
                status: 500,
                message: "Erro interno do servidor ao listar reclamações.",
            };
        }
    },

    // 3. READ (Visualizar por ID)
    async findById(id) {
        try {
            const complaint = await Complaint.findById(id);
            if (!complaint) {
                return {
                    status: 404,
                    message: "Reclamação não encontrada.",
                };
            }
            return {
                status: 200,
                message: "Reclamação recuperada com sucesso.",
                data: complaint,
            };
        } catch (error) {
            console.error("Erro ao buscar reclamação por ID:", error);
            return {
                status: 500,
                message: "Erro interno do servidor ao buscar reclamação.",
            };
        }
    },

    // 4. UPDATE
    async update(id, data) {
        try {
            const updatedComplaint = await Complaint.update(id, data);
            if (!updatedComplaint) {
                return {
                    status: 404,
                    message: "Reclamação não encontrada para atualização.",
                };
            }
            return {
                status: 200,
                message: "Reclamação atualizada com sucesso.",
                data: updatedComplaint,
            };
        } catch (error) {
            console.error("Erro ao atualizar reclamação:", error);
            return {
                status: 500,
                message: "Erro interno do servidor ao atualizar reclamação.",
            };
        }
    },

    // 5. DELETE
    async delete(id) {
        try {
            const deletedComplaint = await Complaint.delete(id);
            if (!deletedComplaint) {
                return {
                    status: 404,
                    message: "Reclamação não encontrada para exclusão.",
                };
            }
            return {
                status: 200,
                message: "Reclamação excluída com sucesso.",
                data: deletedComplaint,
            };
        } catch (error) {
            console.error("Erro ao excluir reclamação:", error);
            return {
                status: 500,
                message: "Erro interno do servidor ao excluir reclamação.",
            };
        }
    },
};