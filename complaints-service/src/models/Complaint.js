import prisma from "../database/connection.js";

const Complaint = {

    // ============================
    // CREATE
    // ============================
    async create(data) {
        const { titulo, descricao, categoria, universidade_id, aluno_id } = data;

        // Verificar usuário
        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(aluno_id) },
            select: { id: true }
        });
        if (!usuario) throw new Error(`Usuário com ID ${aluno_id} não encontrado.`);

        // Verificar universidade
        const universidade = await prisma.universidade.findUnique({
            where: { id: Number(universidade_id) },
            select: { id: true }
        });
        if (!universidade) throw new Error(`Universidade com ID ${universidade_id} não encontrada.`);

        // Categoria
        let categoriaObj = await prisma.categoria.findUnique({ where: { nome: categoria } });
        if (!categoriaObj) {
            categoriaObj = await prisma.categoria.create({ data: { nome: categoria } });
        }

        return prisma.reclamacao.create({
            data: {
                titulo,
                descricao,
                categoriaId: categoriaObj.id,
                universidadeId: universidade_id,
                alunoId: aluno_id
            },
            include: {
                categoria: true,
                universidade: true,
                aluno: { select: { id: true, nome: true, email: true } }
            }
        });
    },

    // ============================
    // FIND BY ID
    // ============================
    async findById(id) {
        return prisma.reclamacao.findUnique({
            where: { id: Number(id) },
            include: {
                categoria: true,
                universidade: true,
                aluno: { select: { id: true, nome: true, email: true } },
                comentarios: {
                    include: {
                        autor: { select: { id: true, nome: true, email: true } }
                    }
                }
            }
        });
    },

    // ============================
    // FIND ALL (FEED)
    // ============================
    async findAll({ limit = 10, offset = 0, category, universityId, campus, alunoId }) {

        const where = {};

        // ----------------------------
        // FILTRO: ALUNO/USUÁRIO
        // ----------------------------
        if (alunoId) {
            where.alunoId = Number(alunoId);
        }

        // ----------------------------
        // FILTRO: CATEGORIA
        // ----------------------------
        if (category && category !== "Todos") {
            const categoriaObj = await prisma.categoria.findUnique({
                where: { nome: category }
            });
            if (!categoriaObj) return [];
            where.categoriaId = categoriaObj.id;
        }

        // ----------------------------
        // FILTRO: UNIVERSIDADE (CORRIGIDO)
        // Aceita múltiplas universidades com a mesma sigla
        // ----------------------------
        let universidadeIds = null;

        if (universityId && universityId !== "Todas") {
            let clean = String(universityId).replace("@", "").trim();

            // Se for número → usa direto
            if (!isNaN(clean)) {
                universidadeIds = [Number(clean)];
            } else {
                // Buscar TODAS as universidades com essa sigla/nome
                const universidades = await prisma.universidade.findMany({
                    where: {
                        OR: [
                            { sigla: clean },
                            { nome: clean }
                        ]
                    },
                    select: { id: true }
                });

                if (universidades.length === 0) return [];

                universidadeIds = universidades.map(u => u.id);
            }

            where.universidadeId = { in: universidadeIds };
        }

        // ----------------------------
        // FILTRO: CAMPUS (FUNCIONANDO COM MÚLTIPLAS UNIVERSIDADES)
        // ----------------------------
        if (campus && campus !== "Todos") {
            const universidadesComCampus = await prisma.universidade.findMany({
                where: { campus },
                select: { id: true }
            });

            if (universidadesComCampus.length === 0) return [];

            const campusIds = universidadesComCampus.map(u => u.id);

            if (universidadeIds) {
                // Interseção entre universidade + campus
                const intersecao = universidadeIds.filter(id => campusIds.includes(id));
                if (intersecao.length === 0) return [];
                where.universidadeId = { in: intersecao };
            } else {
                where.universidadeId = { in: campusIds };
            }
        }

        // ----------------------------
        // CONSULTA FINAL
        // ----------------------------
        return prisma.reclamacao.findMany({
            where,
            include: {
                categoria: true,
                universidade: { select: { id: true, nome: true, sigla: true, campus: true } },
                aluno: { select: { id: true, nome: true, email: true } },
                _count: { select: { comentarios: true } }
            },
            orderBy: { createdAt: "desc" },
            take: Number(limit),
            skip: Number(offset)
        });
    },

    // ============================
    // UPDATE
    // ============================
    async update(id, data) {
        const updateData = {};

        if (data.titulo) updateData.titulo = data.titulo;
        if (data.descricao) updateData.descricao = data.descricao;

        if (data.categoria) {
            let categoriaObj = await prisma.categoria.findUnique({
                where: { nome: data.categoria }
            });
            if (!categoriaObj) {
                categoriaObj = await prisma.categoria.create({ data: { nome: data.categoria } });
            }
            updateData.categoriaId = categoriaObj.id;
        }

        return prisma.reclamacao.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                categoria: true,
                universidade: true,
                aluno: { select: { id: true, nome: true, email: true } }
            }
        });
    },

    // ============================
    // DELETE
    // ============================
    async delete(id) {
        return prisma.reclamacao.delete({
            where: { id: Number(id) }
        });
    },

    // ============================
    // COUNT ALL (PARA PAGINAÇÃO)
    // ============================
    async countAll({ category, universityId, campus, alunoId }) {

        const where = {};
        let universidadeIds = null;

        // Filtro por aluno
        if (alunoId) {
            where.alunoId = Number(alunoId);
        }

        // Categoria
        if (category && category !== "Todos") {
            const categoriaObj = await prisma.categoria.findUnique({
                where: { nome: category }
            });
            if (!categoriaObj) return 0;
            where.categoriaId = categoriaObj.id;
        }

        // Universidade (corrigido)
        if (universityId && universityId !== "Todas") {
            let clean = String(universityId).replace("@", "").trim();

            if (!isNaN(clean)) {
                universidadeIds = [Number(clean)];
            } else {
                const universidades = await prisma.universidade.findMany({
                    where: {
                        OR: [
                            { sigla: clean },
                            { nome: clean }
                        ]
                    },
                    select: { id: true }
                });
                if (universidades.length === 0) return 0;
                universidadeIds = universidades.map(u => u.id);
            }

            where.universidadeId = { in: universidadeIds };
        }

        // Campus
        if (campus && campus !== "Todos") {
            const universidadesComCampus = await prisma.universidade.findMany({
                where: { campus },
                select: { id: true }
            });

            if (universidadesComCampus.length === 0) return 0;

            const campusIds = universidadesComCampus.map(u => u.id);

            if (universidadeIds) {
                const intersecao = universidadeIds.filter(id => campusIds.includes(id));
                if (intersecao.length === 0) return 0;
                where.universidadeId = { in: intersecao };
            } else {
                where.universidadeId = { in: campusIds };
            }
        }

        return prisma.reclamacao.count({ where });
    }
};

export default Complaint;