import Comentario from "../models/Comentario.js";
import Like from "../models/Like.js";
import Notificacao from "../models/Notificacao.js";
import { notificationHelper } from "./notificationHelper.js";

export default {
    // ========== COMENTÁRIOS ==========

    async createComentario(data) {
        try {
            const comentario = await Comentario.create(data);

            // TB2: Disparo de notificações em paralelo (não bloqueia a resposta).
            // Se o autor for um aluno -> notifica dono da reclamação + universidade.
            // Se o autor for uma universidade -> notifica o dono da reclamação.
            if (comentario.autorId) {
                notificationHelper.onNovoComentarioDeAluno({ comentario }).catch(() => {});
            } else if (comentario.universidadeId) {
                notificationHelper.onRespostaDeUniversidade({ comentario }).catch(() => {});
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

    async getComentariosByReclamacao(reclamacaoId, userId = null) {
        try {
            const comentarios = await Comentario.findByReclamacao(reclamacaoId);

            // Adicionar informações de likes para cada comentário
            const comentariosComLikes = await Promise.all(comentarios.map(async (comentario) => {
                const likesCount = await Like.countByComentario(comentario.id);
                let userLiked = false;

                if (userId) {
                    userLiked = await Like.userLikedComentario(userId, comentario.id);
                }

                return {
                    ...comentario,
                    likesCount,
                    userLiked
                };
            }));

            return {
                status: 200,
                message: "Comentários recuperados com sucesso.",
                data: comentariosComLikes
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
            const isAutor = (userTipo === 'aluno' && comentario.autorId === userId) ||
                            (userTipo === 'universidade' && comentario.universidadeId === userId);

            if (!isAutor) {
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
            const isAutor = (userTipo === 'aluno' && comentario.autorId === userId) ||
                            (userTipo === 'universidade' && comentario.universidadeId === userId);

            if (!isAutor) {
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

    // ========== NOTIFICAÇÕES (TB2 + TB3) ==========

    async getNotificacoesByUsuario(usuarioId, query = {}) {
        try {
            const limit = Math.min(parseInt(query.limit) || 20, 100);
            const offset = parseInt(query.offset) || 0;
            const lida = query.lida !== undefined ? query.lida : null;

            const notificacoes = await Notificacao.findByUsuario(usuarioId, { limit, offset, lida });
            const unreadCount = await Notificacao.countUnreadByUsuario(usuarioId);

            return {
                status: 200,
                message: "Notificações recuperadas com sucesso.",
                data: notificacoes,
                meta: { unreadCount }
            };
        } catch (error) {
            console.error("Erro ao buscar notificações (usuário):", error);
            return {
                status: 500,
                message: "Erro interno ao buscar notificações.",
                data: [],
                meta: { unreadCount: 0 }
            };
        }
    },

    async getNotificacoesByUniversidade(universidadeId, query = {}) {
        try {
            const limit = Math.min(parseInt(query.limit) || 20, 100);
            const offset = parseInt(query.offset) || 0;
            const lida = query.lida !== undefined ? query.lida : null;

            const notificacoes = await Notificacao.findByUniversidade(universidadeId, { limit, offset, lida });
            const unreadCount = await Notificacao.countUnreadByUniversidade(universidadeId);

            return {
                status: 200,
                message: "Notificações recuperadas com sucesso.",
                data: notificacoes,
                meta: { unreadCount }
            };
        } catch (error) {
            console.error("Erro ao buscar notificações (universidade):", error);
            return {
                status: 500,
                message: "Erro interno ao buscar notificações.",
                data: [],
                meta: { unreadCount: 0 }
            };
        }
    },

    async getUnreadCount(userId, userTipo) {
        try {
            const count = userTipo === 'universidade'
                ? await Notificacao.countUnreadByUniversidade(userId)
                : await Notificacao.countUnreadByUsuario(userId);

            return {
                status: 200,
                data: { unreadCount: count }
            };
        } catch (error) {
            console.error("Erro ao contar notificações não lidas:", error);
            return {
                status: 500,
                message: "Erro ao contar notificações.",
                data: { unreadCount: 0 }
            };
        }
    },

    async markNotificacaoAsRead(id, userId, userTipo) {
        try {
            // Verifica dono da notificação para evitar marcar de outro usuário (RNF1.3)
            const notif = await Notificacao.findById(id);
            if (!notif) {
                return { status: 404, message: "Notificação não encontrada." };
            }

            const ownsAsUsuario = userTipo === 'aluno' && notif.usuarioId === userId;
            const ownsAsUniv = userTipo === 'universidade' && notif.universidadeId === userId;
            if (!ownsAsUsuario && !ownsAsUniv) {
                return { status: 403, message: "Você não tem permissão para alterar esta notificação." };
            }

            const updated = await Notificacao.markAsRead(id);
            return {
                status: 200,
                message: "Notificação marcada como lida.",
                data: updated
            };
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
            return { status: 500, message: "Erro interno ao marcar notificação." };
        }
    },

    async markAllNotificacoesAsRead(userId, userTipo) {
        try {
            if (userTipo === 'universidade') {
                await Notificacao.markAllAsReadByUniversidade(userId);
            } else {
                await Notificacao.markAllAsReadByUsuario(userId);
            }
            return { status: 200, message: "Todas as notificações foram marcadas como lidas." };
        } catch (error) {
            console.error("Erro ao marcar todas as notificações como lidas:", error);
            return { status: 500, message: "Erro interno ao marcar notificações." };
        }
    },

    /**
     * TB2: Endpoint interno para o complaints-service avisar que houve
     * uma nova reclamação e gerar a notificação para a universidade.
     */
    async createNotificacaoNovaReclamacao(payload) {
        try {
            await notificationHelper.onNovaReclamacao(payload);
            return { status: 201, message: "Notificação registrada." };
        } catch (error) {
            console.error("Erro ao criar notificação de nova reclamação:", error);
            return { status: 500, message: "Erro ao criar notificação." };
        }
    },

    // ========== LIKES ==========

    async toggleLikeReclamacao(usuarioId, reclamacaoId) {
        try {
            const result = await Like.toggle({
                usuarioId,
                reclamacaoId
            });

            const count = await Like.countByReclamacao(reclamacaoId);

            return {
                status: 200,
                message: result.liked ? "Like adicionado com sucesso." : "Like removido com sucesso.",
                data: {
                    liked: result.liked,
                    count
                }
            };
        } catch (error) {
            console.error("Erro ao alternar like:", error);
            return {
                status: 500,
                message: "Erro interno ao alternar like."
            };
        }
    },

    async toggleLikeComentario(usuarioId, comentarioId) {
        try {
            const result = await Like.toggle({
                usuarioId,
                comentarioId
            });

            const count = await Like.countByComentario(comentarioId);

            return {
                status: 200,
                message: result.liked ? "Like adicionado com sucesso." : "Like removido com sucesso.",
                data: {
                    liked: result.liked,
                    count
                }
            };
        } catch (error) {
            console.error("Erro ao alternar like:", error);
            return {
                status: 500,
                message: "Erro interno ao alternar like."
            };
        }
    },

    async getLikesCountReclamacao(reclamacaoId) {
        try {
            const count = await Like.countByReclamacao(reclamacaoId);
            return {
                status: 200,
                data: { count }
            };
        } catch (error) {
            console.error("Erro ao contar likes:", error);
            return {
                status: 500,
                message: "Erro interno ao contar likes."
            };
        }
    },

    async getLikesCountComentario(comentarioId) {
        try {
            const count = await Like.countByComentario(comentarioId);
            return {
                status: 200,
                data: { count }
            };
        } catch (error) {
            console.error("Erro ao contar likes:", error);
            return {
                status: 500,
                message: "Erro interno ao contar likes."
            };
        }
    },

    async checkUserLikedReclamacao(usuarioId, reclamacaoId) {
        try {
            const liked = await Like.userLikedReclamacao(usuarioId, reclamacaoId);
            return {
                status: 200,
                data: { liked }
            };
        } catch (error) {
            console.error("Erro ao verificar like:", error);
            return {
                status: 500,
                message: "Erro interno ao verificar like."
            };
        }
    },

    async checkUserLikedComentario(usuarioId, comentarioId) {
        try {
            const liked = await Like.userLikedComentario(usuarioId, comentarioId);
            return {
                status: 200,
                data: { liked }
            };
        } catch (error) {
            console.error("Erro ao verificar like:", error);
            return {
                status: 500,
                message: "Erro interno ao verificar like."
            };
        }
    }
};
