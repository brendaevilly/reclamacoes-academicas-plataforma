import Notificacao from "../models/Notificacao.js";

/**
 * TB2: Helper centralizado para geração de notificações.
 *
 * Toda a criação de notificação deve passar por estas funções,
 * para que o disparo permaneça "fire-and-forget" e nunca derrube
 * a operação principal (criar comentário, criar reclamação etc.).
 */

async function safeCreate(payload) {
    try {
        await Notificacao.create(payload);
    } catch (err) {
        // Falha silenciosa: notificação nunca pode quebrar o fluxo principal.
        console.error("[Notificações] Falha ao criar notificação:", err.message);
    }
}

export const notificationHelper = {
    /**
     * Aluno comentou em uma reclamação:
     *  - notifica o dono da reclamação (aluno)
     *  - notifica a universidade alvo
     */
    async onNovoComentarioDeAluno({ comentario }) {
        const reclamacao = comentario.reclamacao;
        if (!reclamacao) return;

        const autorNome = comentario.autor?.nome || "Um usuário";

        // 1) Notifica o dono da reclamação (se não for ele mesmo comentando)
        if (reclamacao.alunoId && reclamacao.alunoId !== comentario.autorId) {
            await safeCreate({
                mensagem: `${autorNome} comentou na sua reclamação "${reclamacao.titulo}".`,
                tipo: "novo_comentario",
                reclamacaoId: reclamacao.id,
                usuarioId: reclamacao.alunoId
            });
        }

        // 2) Notifica a universidade da reclamação
        if (reclamacao.universidadeId) {
            await safeCreate({
                mensagem: `Novo comentário em "${reclamacao.titulo}".`,
                tipo: "novo_comentario",
                reclamacaoId: reclamacao.id,
                universidadeId: reclamacao.universidadeId
            });
        }
    },

    /**
     * Universidade respondeu uma reclamação:
     *  - notifica o aluno autor da reclamação
     */
    async onRespostaDeUniversidade({ comentario }) {
        const reclamacao = comentario.reclamacao;
        if (!reclamacao || !reclamacao.alunoId) return;

        const univNome = comentario.universidade?.nome || "A universidade";

        await safeCreate({
            mensagem: `${univNome} respondeu à sua reclamação "${reclamacao.titulo}".`,
            tipo: "resposta_universidade",
            reclamacaoId: reclamacao.id,
            usuarioId: reclamacao.alunoId
        });
    },

    /**
     * Reclamação criada por um aluno:
     *  - notifica a universidade alvo
     *  Usado pelo complaints-service via chamada HTTP interna.
     */
    async onNovaReclamacao({ reclamacaoId, titulo, universidadeId, autorNome }) {
        if (!universidadeId) return;
        const nome = autorNome || "Um aluno";

        await safeCreate({
            mensagem: `${nome} registrou uma nova reclamação: "${titulo}".`,
            tipo: "nova_reclamacao",
            reclamacaoId,
            universidadeId
        });
    }
};

export default notificationHelper;
