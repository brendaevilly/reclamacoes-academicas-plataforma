import interactionService from "../services/interactionService.js";

export default {
    // ========== COMENTÁRIOS ==========

    async createComentario(req, res) {
        const { texto, reclamacaoId } = req.body;
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        if (!texto || !reclamacaoId) {
            return res.status(400).json({ message: "Texto e ID da reclamação são obrigatórios." });
        }

        const data = {
            texto,
            reclamacaoId,
            autorId: userTipo === 'aluno' ? userId : null,
            universidadeId: userTipo === 'universidade' ? userId : null
        };

        const result = await interactionService.createComentario(data);
        res.status(result.status).json(result);
    },

    async getComentariosByReclamacao(req, res) {
        const { reclamacaoId } = req.params;
        const userId = req.user?.id || null;
        const result = await interactionService.getComentariosByReclamacao(reclamacaoId, userId);
        res.status(result.status).json(result);
    },

    async updateComentario(req, res) {
        const { id } = req.params;
        const { texto } = req.body;
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        if (!texto) {
            return res.status(400).json({ message: "Texto é obrigatório." });
        }

        const result = await interactionService.updateComentario(id, { texto }, userId, userTipo);
        res.status(result.status).json(result);
    },

    async deleteComentario(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        const result = await interactionService.deleteComentario(id, userId, userTipo);
        res.status(result.status).json(result);
    },

    // ========== NOTIFICAÇÕES (TB2 + TB3) ==========

    async getNotificacoes(req, res) {
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        let result;
        if (userTipo === 'universidade') {
            result = await interactionService.getNotificacoesByUniversidade(userId, req.query);
        } else {
            result = await interactionService.getNotificacoesByUsuario(userId, req.query);
        }

        res.status(result.status).json(result);
    },

    async getUnreadCount(req, res) {
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        const result = await interactionService.getUnreadCount(userId, userTipo);
        res.status(result.status).json(result);
    },

    async markNotificacaoAsRead(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        const result = await interactionService.markNotificacaoAsRead(id, userId, userTipo);
        res.status(result.status).json(result);
    },

    async markAllNotificacoesAsRead(req, res) {
        const userId = req.user.id;
        const userTipo = req.user.type || req.user.tipo || 'aluno';

        const result = await interactionService.markAllNotificacoesAsRead(userId, userTipo);
        res.status(result.status).json(result);
    },

    /**
     * Endpoint INTERNO chamado pelo complaints-service para emitir
     * uma notificação de nova reclamação para a universidade.
     * Validado via header `x-internal-key` (mesmo JWT_SECRET).
     */
    async createNotificacaoInterna(req, res) {
        const internalKey = req.headers["x-internal-key"];
        if (!internalKey || internalKey !== process.env.JWT_SECRET) {
            return res.status(401).json({ message: "Chave interna inválida." });
        }

        const result = await interactionService.createNotificacaoNovaReclamacao(req.body);
        res.status(result.status).json(result);
    },

    // ========== LIKES ==========

    async toggleLikeReclamacao(req, res) {
        const userId = req.user.id;
        const { reclamacaoId } = req.body;

        if (!reclamacaoId) {
            return res.status(400).json({ message: "ID da reclamação é obrigatório." });
        }

        const result = await interactionService.toggleLikeReclamacao(userId, reclamacaoId);
        res.status(result.status).json(result);
    },

    async toggleLikeComentario(req, res) {
        const userId = req.user.id;
        const { comentarioId } = req.body;

        if (!comentarioId) {
            return res.status(400).json({ message: "ID do comentário é obrigatório." });
        }

        const result = await interactionService.toggleLikeComentario(userId, comentarioId);
        res.status(result.status).json(result);
    }
};
