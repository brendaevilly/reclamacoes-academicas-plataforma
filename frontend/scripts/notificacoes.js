/**
 * TB3: Visualização de notificações no frontend.
 *
 * Faz uso do gateway autenticado (cookie HttpOnly) para:
 *   - GET  /interactions/notificacoes               (lista)
 *   - GET  /interactions/notificacoes/unread-count  (badge)
 *   - PUT  /interactions/notificacoes/:id/read      (marcar uma como lida)
 *   - PUT  /interactions/notificacoes/read-all      (marcar todas)
 */

let filtroAtual = "todas";
let notificacoesCache = [];

document.addEventListener("DOMContentLoaded", async () => {
    if (!(await window.isAuthenticated())) {
        alert("Você precisa estar logado para ver suas notificações.");
        window.location.href = "login.html";
        return;
    }

    await carregarNotificacoes();

    document.querySelectorAll(".filtro-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            filtroAtual = btn.dataset.filtro;
            renderizarNotificacoes();
        });
    });

    document.getElementById("btn-marcar-todas").addEventListener("click", marcarTodasComoLidas);
});

async function carregarNotificacoes() {
    const container = document.getElementById("notif-container");
    container.innerHTML = '<div class="loading">Carregando notificações...</div>';

    try {
        const res = await window.fetchWithAuth(
            `${window.API_BASE_URL}/interactions/notificacoes?limit=50`
        );

        if (!res.ok) {
            container.innerHTML = '<div class="notif-empty"><div class="icone">!</div><p>Erro ao carregar notificações.</p></div>';
            return;
        }

        const json = await res.json();
        notificacoesCache = Array.isArray(json.data) ? json.data : [];
        atualizarContador(json.meta?.unreadCount ?? 0);
        renderizarNotificacoes();
    } catch (err) {
        console.error("Erro ao carregar notificações:", err);
        container.innerHTML = '<div class="notif-empty"><div class="icone">!</div><p>Erro de conexão com o servidor.</p></div>';
    }
}

function renderizarNotificacoes() {
    const container = document.getElementById("notif-container");

    let lista = notificacoesCache;
    if (filtroAtual === "nao-lidas") lista = lista.filter((n) => !n.lida);
    if (filtroAtual === "lidas") lista = lista.filter((n) => n.lida);

    if (lista.length === 0) {
        const mensagem = filtroAtual === "nao-lidas"
            ? "Nenhuma notificação não lida."
            : filtroAtual === "lidas"
            ? "Nenhuma notificação lida."
            : "Você ainda não tem notificações.";
        container.innerHTML = `
            <div class="notif-empty">
                <div class="icone">🔔</div>
                <p>${mensagem}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    for (const notif of lista) {
        container.appendChild(criarCardNotificacao(notif));
    }
}

function criarCardNotificacao(notif) {
    const div = document.createElement("div");
    div.className = `notificacao ${notif.lida ? "" : "nao-lida"}`;
    div.dataset.id = notif.id;

    const tipoLabel = formatarTipo(notif.tipo);
    const tempo = formatarTempo(notif.createdAt);
    const titulo = formatarTituloPorTipo(notif.tipo);

    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <span class="tipo-label ${notif.tipo}">${tipoLabel}</span>
                ${notif.lida ? "" : '<span class="badge-novo ms-2">novo</span>'}
                <h6>${escapeHtml(titulo)}</h6>
                <p>${escapeHtml(notif.mensagem)}</p>
                <small>${tempo}</small>
            </div>
        </div>
    `;

    div.addEventListener("click", async () => {
        if (!notif.lida) {
            await marcarComoLida(notif.id);
        }
        if (notif.reclamacaoId) {
            window.location.href = `telacomentarios.html?id=${notif.reclamacaoId}`;
        }
    });

    return div;
}

function formatarTituloPorTipo(tipo) {
    switch (tipo) {
        case "novo_comentario":
            return "Novo comentário em uma reclamação";
        case "resposta_universidade":
            return "Resposta oficial da universidade";
        case "nova_reclamacao":
            return "Nova reclamação registrada";
        default:
            return "Notificação";
    }
}

function formatarTipo(tipo) {
    return (tipo || "").replace(/_/g, " ");
}

function formatarTempo(iso) {
    if (!iso) return "";
    const data = new Date(iso);
    const diffMs = Date.now() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `Há ${diffMin} minuto${diffMin !== 1 ? "s" : ""}`;
    if (diffHoras < 24) return `Há ${diffHoras} hora${diffHoras !== 1 ? "s" : ""}`;
    if (diffDias < 7) return `Há ${diffDias} dia${diffDias !== 1 ? "s" : ""}`;
    return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function marcarComoLida(id) {
    try {
        const res = await window.fetchWithAuth(
            `${window.API_BASE_URL}/interactions/notificacoes/${id}/read`,
            { method: "PUT" }
        );
        if (res.ok) {
            const notif = notificacoesCache.find((n) => n.id === id);
            if (notif) notif.lida = true;
            atualizarContador((notificacoesCache.filter((n) => !n.lida)).length);
        }
    } catch (err) {
        console.error("Erro ao marcar como lida:", err);
    }
}

async function marcarTodasComoLidas() {
    const btn = document.getElementById("btn-marcar-todas");
    btn.disabled = true;
    btn.textContent = "Marcando...";

    try {
        const res = await window.fetchWithAuth(
            `${window.API_BASE_URL}/interactions/notificacoes/read-all`,
            { method: "PUT" }
        );
        if (res.ok) {
            notificacoesCache.forEach((n) => (n.lida = true));
            atualizarContador(0);
            renderizarNotificacoes();
        } else {
            alert("Erro ao marcar todas as notificações.");
        }
    } catch (err) {
        console.error("Erro ao marcar todas:", err);
        alert("Erro de conexão com o servidor.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Marcar todas como lidas";
    }
}

function atualizarContador(unread) {
    const counter = document.getElementById("notif-counter");
    if (!counter) return;
    counter.textContent = unread;
    counter.classList.toggle("bg-danger", unread > 0);
    counter.classList.toggle("bg-secondary", unread === 0);
}

function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * API pública para outras telas atualizarem o badge do header
 * (usado em telaprincipal.html, telafeed.html, etc).
 */
window.fetchUnreadNotificationsCount = async function () {
    try {
        const res = await window.fetchWithAuth(
            `${window.API_BASE_URL}/interactions/notificacoes/unread-count`
        );
        if (!res.ok) return 0;
        const json = await res.json();
        return json?.data?.unreadCount ?? 0;
    } catch (e) {
        return 0;
    }
};
