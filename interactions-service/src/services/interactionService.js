import Comentario from "../models/Comentario.js";
import Like from "../models/Like.js";
// Notificacao removido temporariamente - tabela não existe no schema atual

export default {
    // ========== COMENTÁRIOS ==========
    
    async createComentario(data) {
        try {
            const comentario = await Comentario.create(data);
            
            // Notificações podem ser implementadas no futuro quando a tabela for criada
            // Por enquanto, apenas criar o comentário sem notificações
            
            
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
            const isAutor = comentario.autorId === userId;
            
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
            const isAutor = comentario.autorId === userId;
            
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

    // ========== NOTIFICAÇÕES ==========
    
    async getNotificacoesByUsuario(usuarioId, query) {
        // Notificações desabilitadas temporariamente - tabela não existe no schema atual
        return {
            status: 501,
            message: "Notificações não implementadas ainda.",
            data: [],
            meta: {
                unreadCount: 0
            }
        };
    },

    async getNotificacoesByUniversidade(universidadeId, query) {
        // Notificações desabilitadas temporariamente - tabela não existe no schema atual
        return {
            status: 501,
            message: "Notificações não implementadas ainda.",
            data: [],
            meta: {
                unreadCount: 0
            }
        };
    },

    async markNotificacaoAsRead(id, userId, userTipo) {
        // Notificações desabilitadas temporariamente - tabela não existe no schema atual
        return {
            status: 501,
            message: "Notificações não implementadas ainda."
        };
    },

    async markAllNotificacoesAsRead(userId, userTipo) {
        // Notificações desabilitadas temporariamente - tabela não existe no schema atual
        return {
            status: 501,
            message: "Notificações não implementadas ainda."
        };
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
