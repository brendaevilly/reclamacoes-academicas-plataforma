import prisma from "../database/connection.js";

const Like = {
    // Criar ou remover like (toggle)
    async toggle(data) {
        const { usuarioId, reclamacaoId, comentarioId } = data;
        
        // Verificar se já existe
        const where = {
            usuarioId: parseInt(usuarioId)
        };
        
        if (reclamacaoId) {
            where.reclamacaoId = parseInt(reclamacaoId);
        } else if (comentarioId) {
            where.comentarioId = parseInt(comentarioId);
        }
        
        const existingLike = await prisma.like.findFirst({
            where
        });
        
        if (existingLike) {
            // Remover like
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return { liked: false, like: null };
        } else {
            // Criar like
            const like = await prisma.like.create({
                data: {
                    usuarioId: parseInt(usuarioId),
                    reclamacaoId: reclamacaoId ? parseInt(reclamacaoId) : null,
                    comentarioId: comentarioId ? parseInt(comentarioId) : null
                }
            });
            return { liked: true, like };
        }
    },

    // Contar likes de uma reclamação
    async countByReclamacao(reclamacaoId) {
        return await prisma.like.count({
            where: {
                reclamacaoId: parseInt(reclamacaoId)
            }
        });
    },

    // Contar likes de um comentário
    async countByComentario(comentarioId) {
        return await prisma.like.count({
            where: {
                comentarioId: parseInt(comentarioId)
            }
        });
    },

    // Verificar se usuário deu like em uma reclamação
    async userLikedReclamacao(usuarioId, reclamacaoId) {
        const like = await prisma.like.findFirst({
            where: {
                usuarioId: parseInt(usuarioId),
                reclamacaoId: parseInt(reclamacaoId)
            }
        });
        return !!like;
    },

    // Verificar se usuário deu like em um comentário
    async userLikedComentario(usuarioId, comentarioId) {
        const like = await prisma.like.findFirst({
            where: {
                usuarioId: parseInt(usuarioId),
                comentarioId: parseInt(comentarioId)
            }
        });
        return !!like;
    }
};

export default Like;

