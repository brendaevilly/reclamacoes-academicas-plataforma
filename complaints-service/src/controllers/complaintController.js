import complaintService from "../services/complaintService.js";
import prisma from "../database/connection.js";

export default {
    // 1. CREATE (POST /complaints)
    async create(req, res) {
        // O aluno_id é obtido do token JWT, garantindo que a reclamação seja associada ao usuário logado
        const aluno_id = req.user.id;
        
        // Verificar se o usuário existe no banco de dados
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { id: parseInt(aluno_id) },
                select: { id: true }
            });
            
            if (!usuario) {
                return res.status(404).json({ 
                    message: "Usuário não encontrado. Por favor, faça login novamente." 
                });
            }
        } catch (error) {
            console.error("Erro ao verificar usuário:", error);
            return res.status(500).json({ 
                message: "Erro ao validar usuário." 
            });
        }
        
        // Aceitar tanto universidadeId quanto universidade_id do frontend
        const { titulo, descricao, categoriaId, categoria, universidadeId, universidade_id } = req.body;

        // Usar universidadeId se fornecido, senão usar universidade_id
        const universidade_id_final = universidadeId || universidade_id;
        
        // Converter categoriaId (nome em minúsculas) para o nome correto da categoria
        let categoria_nome = categoria;
        if (categoriaId && !categoria) {
            // Mapear os valores do frontend para os nomes corretos das categorias
            const categoriaMap = {
                'infraestrutura': 'Infraestrutura',
                'atendimento': 'Atendimento',
                'ensino': 'Ensino',
                'alimentacao': 'Alimentação',
                'seguranca': 'Segurança'
            };
            categoria_nome = categoriaMap[categoriaId] || categoriaId;
        }

        // Validação básica
        if (!titulo || !descricao || !universidade_id_final) {
            return res.status(400).json({ message: "Título, descrição e ID da universidade são obrigatórios." });
        }

        const data = { titulo, descricao, categoria: categoria_nome, universidade_id: universidade_id_final, aluno_id };
        const result = await complaintService.create(data);
        res.status(result.status).json(result);
    },

    // 2. READ (GET /complaints/feed) - Feed principal
    async list(req, res) {
        // Adicionar userId se o usuário estiver autenticado (opcional)
        const query = { ...req.query };
        
        // Garantir que category seja uma string (não array)
        if (Array.isArray(query.category)) {
            query.category = query.category[0];
        }
        
        // Garantir que universityId seja uma string (não array) e limpar valores duplicados
        if (query.universityId) {
            if (Array.isArray(query.universityId)) {
                query.universityId = query.universityId[0];
            }
            // Limpar valores duplicados como "1,1" ou "1,1,1"
            const universityIdStr = String(query.universityId);
            query.universityId = universityIdStr.split(',')[0].trim();
        }
        
        // Garantir que campus seja uma string (não array)
        if (query.campus) {
            if (Array.isArray(query.campus)) {
                query.campus = query.campus[0];
            }
        }
        
        // Processar alunoId da query string (se fornecido diretamente)
        if (query.alunoId) {
            if (Array.isArray(query.alunoId)) {
                query.alunoId = query.alunoId[0];
            }
            query.alunoId = Number(query.alunoId);
        }
        
        // Tentar obter userId do token se disponível (sem falhar se não houver)
        try {
            if (req.user && req.user.id) {
                query.userId = req.user.id;
                // Se houver um parâmetro específico para buscar reclamações do usuário
                if (query.myComplaints === 'true' || query.userComplaints === 'true') {
                    query.alunoId = req.user.id;
                }
            }
        } catch (e) {
            // Ignorar erro se não houver token
        }
        const result = await complaintService.list(query);
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