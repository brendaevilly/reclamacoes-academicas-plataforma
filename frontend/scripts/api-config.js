// Configuração centralizada da API
const API_BASE_URL = "http://localhost:3000"; // Gateway URL

// Função auxiliar para fazer requisições autenticadas
async function fetchWithAuth(url, options = {}) {
    // Não ler token no frontend quando cookie HttpOnly é usado.
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    return fetch(url, {
        ...options,
        headers,
        credentials: "include"
    });
}

// Função para verificar se o usuário está logado
async function isAuthenticated() {
    try {
        // Usar cookie HttpOnly (enviado por fetch com credentials)
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: "include"
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Função para obter dados do usuário logado
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Função para obter tipo do usuário
function getUserType() {
    return sessionStorage.getItem("userType") || "aluno";
}

// Função para fazer logout
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

    } catch (e) {
        console.error("Erro ao chamar logout:", e);
    } finally {
        // token em cookie HttpOnly é limpo pelo backend via /auth/logout
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userType");
        window.location.href = "login.html";
    }
}

// Exportar para uso global
window.API_BASE_URL = API_BASE_URL;
window.fetchWithAuth = fetchWithAuth;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getUserType = getUserType;
window.logout = logout;
