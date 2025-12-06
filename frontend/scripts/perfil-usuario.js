
const API_BASE_URL = "http://localhost:3000";

ocument.addEventListener('DOMContentLoaded', async () => {
    const postsHistoricoContainer = document.getElementById('historico-posts');
    const loadingMessage = document.getElementById('carregando-msg');

    // 1. Verificar autenticação
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
        alert('Você precisa fazer login primeiro!');
        window.location.href = 'login.html';
        return;
    }

    // 2. Pegar dados do usuário
    const usuario = JSON.parse(userString);
    console.log('Dados do usuário:', usuario);

    // 3. Atualizar informações na tela
    document.getElementById('nome-usuario').textContent = usuario.nome || 'Nome não disponível';
    document.getElementById('usuario-email').textContent = usuario.email || 'Email não disponível';

    try {
        // 4. Buscar reclamações do usuário
        const response = await fetch(`${API_BASE_URL}/api/complaints/student/${usuario.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Remove mensagem de carregamento
        if (loadingMessage) {
            loadingMessage.remove();
        }

        if (response.ok) {
            const resultado = await response.json();
            console.log('Resposta completa da API:', resultado);

            const posts = resultado.data || [];

            // 5.  posts
            if (Array.isArray(posts) && posts.length > 0) {
                posts.forEach(post => {
                    postsHistoricoContainer.appendChild(renderPostCard(post));
                });
            } else {
                postsHistoricoContainer.innerHTML = `
          <div class="alert alert-info text-center">
            <p class="mb-0">Você ainda não registrou nenhuma reclamação.</p>
            <a href="reclamacao.html" class="btn btn-primary mt-3">Criar Primeira Reclamação</a>
          </div>
        `;
            }
        } else if (response.status === 403) {
            postsHistoricoContainer.innerHTML = `
        <div class="alert alert-danger text-center">
          Você não tem permissão para ver essas reclamações.
        </div>
      `;
        } else if (response.status === 404) {
            postsHistoricoContainer.innerHTML = `
        <div class="alert alert-info text-center">
          <p class="mb-0">Você ainda não registrou nenhuma reclamação.</p>
          <a href="reclamacao.html" class="btn btn-primary mt-3">Criar Primeira Reclamação</a>
        </div>
      `;
        } else {
            console.error('Erro ao buscar posts:', response.status);
            postsHistoricoContainer.innerHTML = `
        <div class="alert alert-danger text-center">
          Erro ao carregar suas reclamações. Tente novamente mais tarde.
        </div>
      `;
        }

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        if (loadingMessage) {
            loadingMessage.remove();
        }
        postsHistoricoContainer.innerHTML = `
      <div class="alert alert-danger text-center">
        Erro ao conectar com o servidor. Tente novamente mais tarde.
      </div>
    `;
    }
});