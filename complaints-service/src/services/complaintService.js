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
    async list(query) {
        // Garantir que page e limit sejam números
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const { category, universityId } = query;
        const offset = (page - 1) * limit;

        try {
            const complaints = await Complaint.findAll({ limit, offset, category, universityId });
            const totalCount = await Complaint.countAll({ category, universityId });
            const totalPages = Math.ceil(totalCount / limit);

            return {
                status: 200,
                message: "Lista de reclamações recuperada com sucesso.",
                data: complaints,
                meta: {
                    total: totalCount,
                    page: page,
                    limit: limit,
                    totalPages: totalPages,
                }
            };
        } catch (error) {
            console.error("Erro ao listar reclamações:", error);
            return {
                status: 500,
                message: "Erro interno do servidor ao listar reclamações.",
            };
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
};