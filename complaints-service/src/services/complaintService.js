import Complaint from "../models/Complaint.js";

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
            return {
                status: 500,
                message: "Erro interno do servidor ao registrar reclamação.",
            };
        }
    },

    // 2. READ (Listar - será o feed)
    async list(req, res) {
        try {
            let { page = 1, limit = 10, category, universityId } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);

            // NORMALIZAÇÃO DE MULTIPLOS PARAMS
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
                meta: { page, limit }
            });

        } catch (error) {
            console.error("Erro interno ao listar reclamações:", error);
            return res.status(500).json({
                message: "Erro interno do servidor ao listar reclamações."
            });
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
};
