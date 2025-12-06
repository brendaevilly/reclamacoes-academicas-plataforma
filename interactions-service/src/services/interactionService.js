import Comentario from "../models/Comentario.js";
import Notificacao from "../models/Notificacao.js";

export default {
    // ========== COMENTÁRIOS ==========
    
    async createComentario(data) {
        try {
            const comentario = await Comentario.create(data);
            
            // Criar notificação para o autor da reclamação (se não for ele mesmo comentando)
            if (comentario.reclamacao.alunoId !== data.autorId) {
                await Notificacao.create({
                    mensagem: `Novo comentário na sua reclamação: ${comentario.reclamacao.titulo}`,
                    tipo: 'comentario',
                    reclamacaoId: comentario.reclamacaoId,
                    usuarioId: comentario.reclamacao.alunoId
                });
            }
            
            // Se for comentário de universidade, notificar o aluno
            if (data.universidadeId) {
                await Notificacao.create({
                    mensagem: `A universidade respondeu sua reclamação: ${comentario.reclamacao.titulo}`,
                    tipo: 'resposta',
                    reclamacaoId: comentario.reclamacaoId,
                    usuarioId: comentario.reclamacao.alunoId
                });
            }
            
            return {
                status: 201,
                message: "Comentário criado com sucesso.",
                data: comentario
            };
        } catch (error) {
            console.error("Erro ao criar comentário:", error);
            return {
                status: 500,
                message: "Erro interno ao criar comentário."
            };
        }
    },

    async getComentariosByReclamacao(reclamacaoId) {
        try {
            const comentarios = await Comentario.findByReclamacao(reclamacaoId);
            return {
                status: 200,
                message: "Comentários recuperados com sucesso.",
                data: comentarios
            };
        } catch (error) {
            console.error("Erro ao buscar comentários:", error);
            return {
                status: 500,
                message: "Erro interno ao buscar comentários."
            };
        }
    },

    async updateComentario(id, data, userId, userTipo) {
        try {
            const comentario = await Comentario.findById(id);
            
            if (!comentario) {
                return {
                    status: 404,
                    message: "Comentário não encontrado."
                };
            }
            
            // Verificar autorização
            const isAutor = comentario.autorId === userId;
            const isUniversidade = userTipo === 'universidade' && comentario.universidadeId === userId;
            
            if (!isAutor && !isUniversidade) {
                return {
                    status: 403,
                    message: "Você não tem permissão para editar este comentário."
                };
            }
            
            const updated = await Comentario.update(id, data);
            return {
                status: 200,
                message: "Comentário atualizado com sucesso.",
                data: updated
            };
        } catch (error) {
            console.error("Erro ao atualizar comentário:", error);
            return {
                status: 500,
                message: "Erro interno ao atualizar comentário."
            };
        }
    },

    async deleteComentario(id, userId, userTipo) {
        try {
            const comentario = await Comentario.findById(id);
            
            if (!comentario) {
                return {
                    status: 404,
                    message: "Comentário não encontrado."
                };
            }
            
            // Verificar autorização
            const isAutor = comentario.autorId === userId;
            const isUniversidade = userTipo === 'universidade' && comentario.universidadeId === userId;
            
            if (!isAutor && !isUniversidade) {
                return {
                    status: 403,
                    message: "Você não tem permissão para deletar este comentário."
                };
            }
            
            await Comentario.delete(id);
            return {
                status: 200,
                message: "Comentário deletado com sucesso."
            };
        } catch (error) {
            console.error("Erro ao deletar comentário:", error);
            return {
                status: 500,
                message: "Erro interno ao deletar comentário."
            };
        }
    },

    // ========== NOTIFICAÇÕES ==========
    
    async getNotificacoesByUsuario(usuarioId, query) {
        try {
            const { limit = 20, offset = 0, lida } = query;
            const notificacoes = await Notificacao.findByUsuario(usuarioId, { limit, offset, lida });
            const unreadCount = await Notificacao.countUnreadByUsuario(usuarioId);
            
            return {
                status: 200,
                message: "Notificações recuperadas com sucesso.",
                data: notificacoes,
                meta: {
                    unreadCount
                }
            };
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
            return {
                status: 500,
                message: "Erro interno ao buscar notificações."
            };
        }
    },

    async getNotificacoesByUniversidade(universidadeId, query) {
        try {
            const { limit = 20, offset = 0, lida } = query;
            const notificacoes = await Notificacao.findByUniversidade(universidadeId, { limit, offset, lida });
            const unreadCount = await Notificacao.countUnreadByUniversidade(universidadeId);
            
            return {
                status: 200,
                message: "Notificações recuperadas com sucesso.",
                data: notificacoes,
                meta: {
                    unreadCount
                }
            };
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
            return {
                status: 500,
                message: "Erro interno ao buscar notificações."
            };
        }
    },

    async markNotificacaoAsRead(id, userId, userTipo) {
        try {
            const notificacao = await prisma.notificacao.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!notificacao) {
                return {
                    status: 404,
                    message: "Notificação não encontrada."
                };
            }
            
            // Verificar autorização
            const isOwner = (notificacao.usuarioId === userId) || 
                           (userTipo === 'universidade' && notificacao.universidadeId === userId);
            
            if (!isOwner) {
                return {
                    status: 403,
                    message: "Você não tem permissão para marcar esta notificação."
                };
            }
            
            const updated = await Notificacao.markAsRead(id);
            return {
                status: 200,
                message: "Notificação marcada como lida.",
                data: updated
            };
        } catch (error) {
            console.error("Erro ao marcar notificação:", error);
            return {
                status: 500,
                message: "Erro interno ao marcar notificação."
            };
        }
    },

    async markAllNotificacoesAsRead(userId, userTipo) {
        try {
            if (userTipo === 'universidade') {
                await Notificacao.markAllAsReadByUniversidade(userId);
            } else {
                await Notificacao.markAllAsReadByUsuario(userId);
            }
            
            return {
                status: 200,
                message: "Todas as notificações foram marcadas como lidas."
            };
        } catch (error) {
            console.error("Erro ao marcar todas notificações:", error);
            return {
                status: 500,
                message: "Erro interno ao marcar notificações."
            };
        }
    }
};
