// Configuração centralizada da API
const API_BASE_URL = "http://localhost:3000"; // Gateway URL

// Função auxiliar para fazer requisições autenticadas
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

// Função para verificar se o usuário está logado
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Função para obter dados do usuário logado
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Função para obter tipo do usuário
function getUserType() {
    return localStorage.getItem('userType') || 'aluno';
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = 'login.html';
}

// Exportar para uso global
window.API_BASE_URL = API_BASE_URL;
window.fetchWithAuth = fetchWithAuth;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getUserType = getUserType;
window.logout = logout;
