import prisma from "../database/connection.js";

const Notificacao = {
    // Criar notificação
    async create(data) {
        const { mensagem, tipo, reclamacaoId, usuarioId, universidadeId } = data;
        
        return await prisma.notificacao.create({
            data: {
                mensagem,
                tipo,
                reclamacaoId: reclamacaoId ? parseInt(reclamacaoId) : null,
                usuarioId: usuarioId ? parseInt(usuarioId) : null,
                universidadeId: universidadeId ? parseInt(universidadeId) : null,
                lida: false
            },
            include: {
                reclamacao: {
                    select: {
                        id: true,
                        titulo: true
                    }
                },
                usuario: {
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

    // Buscar notificações de um usuário
    async findByUsuario(usuarioId, { limit = 20, offset = 0, lida = null }) {
        const where = {
            usuarioId: parseInt(usuarioId)
        };
        
        if (lida !== null) {
            where.lida = lida === 'true' || lida === true;
        }

        return await prisma.notificacao.findMany({
            where,
            include: {
                reclamacao: {
                    select: {
                        id: true,
                        titulo: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    },

    // Buscar notificações de uma universidade
    async findByUniversidade(universidadeId, { limit = 20, offset = 0, lida = null }) {
        const where = {
            universidadeId: parseInt(universidadeId)
        };
        
        if (lida !== null) {
            where.lida = lida === 'true' || lida === true;
        }

        return await prisma.notificacao.findMany({
            where,
            include: {
                reclamacao: {
                    select: {
                        id: true,
                        titulo: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    },

    // Marcar notificação como lida
    async markAsRead(id) {
        return await prisma.notificacao.update({
            where: { id: parseInt(id) },
            data: { lida: true }
        });
    },

    // Marcar todas as notificações de um usuário como lidas
    async markAllAsReadByUsuario(usuarioId) {
        return await prisma.notificacao.updateMany({
            where: {
                usuarioId: parseInt(usuarioId),
                lida: false
            },
            data: { lida: true }
        });
    },

    // Marcar todas as notificações de uma universidade como lidas
    async markAllAsReadByUniversidade(universidadeId) {
        return await prisma.notificacao.updateMany({
            where: {
                universidadeId: parseInt(universidadeId),
                lida: false
            },
            data: { lida: true }
        });
    },

    // Contar notificações não lidas de um usuário
    async countUnreadByUsuario(usuarioId) {
        return await prisma.notificacao.count({
            where: {
                usuarioId: parseInt(usuarioId),
                lida: false
            }
        });
    },

    // Contar notificações não lidas de uma universidade
    async countUnreadByUniversidade(universidadeId) {
        return await prisma.notificacao.count({
            where: {
                universidadeId: parseInt(universidadeId),
                lida: false
            }
        });
    },

    // Deletar notificação
    async delete(id) {
        return await prisma.notificacao.delete({
            where: { id: parseInt(id) }
        });
    }
};

export default Notificacao;
