document.addEventListener('DOMContentLoaded', () => {
    const postsHistoricoContainer = document.getElementById('historico-posts');
    const loadingMessage = document.getElementById('carregando-msg');
    
    // 1. Simulação de dados do usuário (API: GET /api/users/me)
    const simulacaoDadosUsuario = {
        nome: "Ana Carolina Silva",
        email: "ana.carolina@universidade.edu.br",
    };

    // 2. Simulação de dados do histórico de posts (API: GET /api/users/{id}/complaints)
    const simulacaoPosts = [
        { id: 101, title: "Falta de iluminação no Bloco B", status: "Resolvido", supports: 55 },
        { id: 102, title: "Lentidão na rede Wi-Fi da Biblioteca", status: "Em Análise", supports: 120 },
        { id: 103, title: "Problema com bebedouro do Laboratório 3", status: "Rejeitado", supports: 5 }
    ];

    // Atualiza as informações do usuário
    document.getElementById('nome-usuario').textContent = simulacaoDadosUsuario.nome;
    document.getElementById('usuario-email').textContent = simulacaoDadosUsuario.email;

    // Remove o post de exemplo e a mensagem de carregamento
    const examploPost = document.querySelector('.examplo-post');
    if (examploPost) {
        examploPost.remove();
    }
    if (loadingMessage) {
        loadingMessage.remove();
    }

    // Função para renderizar um card de post
    const renderPostCard = (post) => {
        const card = document.createElement('div');
        card.classList.add('post-card');
        card.innerHTML = `
            <h4>${post.title}</h4>
            <p>Status: <strong>${post.status}</strong> | Apoios: ${post.supports}</p>
            <a href="detail.html?id=${post.id}">Ver Detalhes</a>
        `;
        postsHistoricoContainer.appendChild(card);
    };

    // Renderiza o histórico de posts
    if (simulacaoPosts.length > 0) {
        simulacaoPosts.forEach(renderPostCard);
    } else {
        postsHistoricoContainer.innerHTML = '<p>Você ainda não registrou nenhuma reclamação.</p>';
    }
});