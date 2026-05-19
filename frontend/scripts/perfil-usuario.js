document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se o usuário está logado
    if (!window.isAuthenticated || !window.isAuthenticated()) {
        alert('Você precisa estar logado para acessar o perfil.');
        window.location.href = 'login.html';
        return;
    }

    const currentUser = window.getCurrentUser();
    if (!currentUser) {
        alert('Erro ao carregar dados do usuário. Por favor, faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    const postsHistoricoContainer = document.getElementById('posts-historico-container');
    const loadingMessage = document.getElementById('carregando-msg');
    const editPerfilBtn = document.getElementById('edit-perfil-btn');

    // 1. Buscar dados atualizados do usuário da API
    try {
        const token = localStorage.getItem('token');
        const userResponse = await window.fetchWithAuth(`${window.API_BASE_URL}/auth/${currentUser.id}`, {
            method: 'GET'
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            // Atualizar informações do usuário na tela
            document.getElementById('nome-usuario').textContent = userData.nome || currentUser.nome;
            document.getElementById('usuario-email').textContent = userData.email || currentUser.email;
        } else {
            // Se falhar, usar dados do localStorage
            document.getElementById('nome-usuario').textContent = currentUser.nome;
            document.getElementById('usuario-email').textContent = currentUser.email;
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        // Usar dados do localStorage como fallback
        document.getElementById('nome-usuario').textContent = currentUser.nome;
        document.getElementById('usuario-email').textContent = currentUser.email;
    }

    // 2. Buscar histórico de reclamações do usuário
    try {
        const token = localStorage.getItem('token');
        const complaintsResponse = await fetch(`${window.API_BASE_URL}/complaints/feed?page=1&limit=100&alunoId=${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (complaintsResponse.ok) {
            const result = await complaintsResponse.json();
            const complaints = result.data || [];

            // Remover o post de exemplo e a mensagem de carregamento
            const examploPost = document.querySelector('.examplo-post');
            if (examploPost) {
                examploPost.remove();
            }
            if (loadingMessage) {
                loadingMessage.remove();
            }

            // Função para renderizar um card de post
            const renderPostCard = (complaint) => {
                const card = document.createElement('div');
                card.classList.add('post-card');
                
                // Mapear status (se houver) ou usar categoria
                const status = complaint.status || complaint.categoria || 'Ativa';
                const supports = complaint.likes_count || 0;
                const comentariosCount = complaint.comentarios_count || 0;
                
                card.innerHTML = `
                    <h4>${complaint.titulo}</h4>
                    <p>Status: <strong>${status}</strong> | Apoios: ${supports} | Comentários: ${comentariosCount}</p>
                    <a href="telacomentarios.html?id=${complaint.id}">Ver Detalhes</a>
                `;
                postsHistoricoContainer.appendChild(card);
            };

            // Renderizar o histórico de posts
            if (complaints.length > 0) {
                complaints.forEach(renderPostCard);
            } else {
                postsHistoricoContainer.innerHTML = '<p>Você ainda não registrou nenhuma reclamação.</p>';
            }
        } else {
            console.error('Erro ao buscar reclamações:', await complaintsResponse.text());
            if (loadingMessage) {
                loadingMessage.textContent = 'Erro ao carregar histórico de reclamações.';
            }
        }
    } catch (error) {
        console.error('Erro ao buscar histórico de reclamações:', error);
        if (loadingMessage) {
            loadingMessage.textContent = 'Erro ao carregar histórico de reclamações.';
        }
    }

    // 3. Conectar botão de editar perfil
    if (editPerfilBtn) {
        editPerfilBtn.addEventListener('click', () => {
            window.location.href = 'config.html';
        });
    }
});
