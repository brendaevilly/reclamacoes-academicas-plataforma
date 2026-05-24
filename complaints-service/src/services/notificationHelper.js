import prisma from "../database/connection.js";

/**
 * TB2: Helper de notificações para o complaints-service.
 *
 * Como todos os microserviços compartilham o mesmo banco, é seguro
 * escrever direto na tabela `notificacoes` (gerenciada pelo schema
 * do interactions-service). O Prisma Client do complaints-service
 * conhece o model Notificacao porque ele também está declarado no
 * schema.prisma local.
 *
 * Falhas aqui NUNCA podem derrubar a operação principal (criação
 * de reclamação) — por isso o try/catch silencioso.
 */

export const complaintNotifications = {
    /**
     * Nova reclamação criada por um aluno -> notifica a universidade alvo.
     */
    async onNovaReclamacao({ reclamacaoId, titulo, universidadeId, autorNome }) {
        if (!universidadeId) return;
        try {
            await prisma.notificacao.create({
                data: {
                    mensagem: `${autorNome || "Um aluno"} registrou uma nova reclamação: "${titulo}".`,
                    tipo: "nova_reclamacao",
                    reclamacaoId: Number(reclamacaoId),
                    universidadeId: Number(universidadeId)
                }
            });
        } catch (err) {
            console.error("[Notificações] Falha ao criar notificação de nova reclamação:", err.message);
        }
    }
};

export default complaintNotifications;
