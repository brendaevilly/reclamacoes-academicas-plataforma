import complaintService from "../services/complaintService.js";

export default {
    // 1. CREATE (POST /complaints)
    async create(req, res) {
        // O aluno_id é obtido do token JWT, garantindo que a reclamação seja associada ao usuário logado
        const aluno_id = req.user.id;
        const { titulo, descricao, categoria, universidade_id } = req.body;

        // Validação básica
        if (!titulo || !descricao || !universidade_id) {
            return res.status(400).json({ message: "Título, descrição e ID da universidade são obrigatórios." });
        }

        const data = { titulo, descricao, categoria, universidade_id, aluno_id };
        const result = await complaintService.create(data);
        res.status(result.status).json(result);
    },

    // 2. READ (GET /complaints/feed) - Feed principal
    async list(req, res) {
        const result = await complaintService.list(req.query);
        res.status(result.status).json(result);
    },

    // 3. READ (GET /complaints/:id) - Visualização específica
    async findById(req, res) {
        const { id } = req.params;
        const result = await complaintService.findById(id);
        res.status(result.status).json(result);
    },

    // 4. UPDATE (PUT /complaints/:id)
    async update(req, res) {
        const { id } = req.params;
        const aluno_id = req.user.id; // Para verificação de autorização (não implementada aqui, mas importante)
        const data = req.body;

        // Implementar lógica de autorização: verificar se req.user.id é o mesmo que complaint.aluno_id
        // Por enquanto, apenas atualiza
        const result = await complaintService.update(id, data);
        res.status(result.status).json(result);
    },

    // 5. DELETE (DELETE /complaints/:id)
    async delete(req, res) {
        const { id } = req.params;
        const aluno_id = req.user.id; // Para verificação de autorização

        // Implementar lógica de autorização
        const result = await complaintService.delete(id);
        res.status(result.status).json(result);
    },
};