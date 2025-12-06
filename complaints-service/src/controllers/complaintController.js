import complaintService from "../services/complaintService.js";
import Complaint from "../models/Complaint.js";


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
        try {
            let { page = 1, limit = 10, category, universityId } = req.query;

            // Correção: normaliza page e limit
            page = parseInt(page);
            limit = parseInt(limit);

            // Correção: evita arrays enviados pelo navegador
            if (Array.isArray(category)) category = category[0];
            if (Array.isArray(universityId)) universityId = universityId[0];

            const offset = (page - 1) * limit;

            const data = await Complaint.findAll({
                limit,
                offset,
                category,
                universityId
            });

            return res.json({
                data,
                meta: {
                    page,
                    limit
                }
            });

        } catch (error) {
            console.error("Erro interno ao listar reclamações:", error);
            return res.status(500).json({
                message: "Erro interno do servidor ao listar reclamações."
            });
        }
    },



    // 3. READ (GET /complaints/:id) - Visualização específica
    async findById(req, res) {
        const { id } = req.params;
        const result = await complaintService.findById(id);
        res.status(result.status).json(result);
    },

    async findByStudentId(alunoId, query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        try {
            const complaints = await Complaint.findByStudentId(alunoId, { limit, offset });
            const totalCount = await Complaint.countByStudentId(alunoId);
            const totalPages = Math.ceil(totalCount / limit);

            return {
                status: 200,
                message: "Reclamações do aluno recuperadas com sucesso.",
                data: complaints,
                meta: {
                    total: totalCount,
                    page: page,
                    limit: limit,
                    totalPages: totalPages,
                }
            };
        } catch (error) {
            console.error("Erro ao buscar reclamações do aluno:", error);
            return {
                status: 500,
                message: "Erro interno do servidor ao buscar reclamações do aluno.",
            };
        }
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