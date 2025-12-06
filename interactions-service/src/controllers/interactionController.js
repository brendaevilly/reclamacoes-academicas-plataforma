import interactionService from "../services/interactionService.js";

export default {
    // ========== COMENTÁRIOS ==========
    
    async createComentario(req, res) {
        const { texto, reclamacaoId } = req.body;
        const userId = req.user.id;
        const userTipo = req.user.tipo || 'aluno';
        
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
        const result = await interactionService.getComentariosByReclamacao(reclamacaoId);
        res.status(result.status).json(result);
    },

    async updateComentario(req, res) {
        const { id } = req.params;
        const { texto } = req.body;
        const userId = req.user.id;
        const userTipo = req.user.tipo || 'aluno';
        
        if (!texto) {
            return res.status(400).json({ message: "Texto é obrigatório." });
        }
        
        const result = await interactionService.updateComentario(id, { texto }, userId, userTipo);
        res.status(result.status).json(result);
    },

    async deleteComentario(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        const userTipo = req.user.tipo || 'aluno';
        
        const result = await interactionService.deleteComentario(id, userId, userTipo);
        res.status(result.status).json(result);
    },

    // ========== NOTIFICAÇÕES ==========
    
    async getNotificacoes(req, res) {
        const userId = req.user.id;
        const userTipo = req.user.tipo || 'aluno';
        
        let result;
        if (userTipo === 'universidade') {
            result = await interactionService.getNotificacoesByUniversidade(userId, req.query);
        } else {
            result = await interactionService.getNotificacoesByUsuario(userId, req.query);
        }
        
        res.status(result.status).json(result);
    },

    async markNotificacaoAsRead(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        const userTipo = req.user.tipo || 'aluno';
        
        const result = await interactionService.markNotificacaoAsRead(id, userId, userTipo);
        res.status(result.status).json(result);
    },

    async markAllNotificacoesAsRead(req, res) {
        const userId = req.user.id;
        const userTipo = req.user.tipo || 'aluno';
        
        const result = await interactionService.markAllNotificacoesAsRead(userId, userTipo);
        res.status(result.status).json(result);
    }
};
