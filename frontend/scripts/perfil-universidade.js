document.addEventListener('DOMContentLoaded', async () => {
    // Obter ID da universidade da URL
    const urlParams = new URLSearchParams(window.location.search);
    const universidadeId = urlParams.get('id');

    if (!universidadeId) {
        alert('ID da universidade não fornecido.');
        window.location.href = 'buscar-universidade.html';
        return;
    }

    let currentUser = null;
    if (window.isAuthenticated && window.isAuthenticated()) {
        currentUser = window.getCurrentUser();
    }

    // 1. Buscar dados da universidade
    try {
        const response = await fetch(`${window.API_BASE_URL}/universidades/${universidadeId}`);
        
        if (!response.ok) {
            throw new Error('Universidade não encontrada');
        }

        const universidade = await response.json();
        
        document.getElementById('universidade-nome').textContent = universidade.nome;
        document.getElementById('campus').textContent = universidade.campus || 'Campus não informado';
        document.getElementById('sigla').textContent = universidade.sigla || '-';
    } catch (error) {
        console.error('Erro ao buscar universidade:', error);
        alert('Erro ao carregar dados da universidade.');
        window.location.href = 'buscar-universidade.html';
        return;
    }

    // 2. Buscar avaliação média
    async function carregarAvaliacaoMedia() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/avaliacoes/universidade/${universidadeId}/media`);
            
            if (response.ok) {
                const data = await response.json();
                const media = data.media || 0;
                const total = data.total || 0;

                // Renderizar estrelas da média
                renderizarEstrelas('estrelas-avaliacao-media', media, false);
                
                document.getElementById('valor-avaliacao').textContent = 
                    total > 0 
                        ? `Média: ${media.toFixed(1)} / 5.0 (Baseado em ${total} avaliação${total !== 1 ? 'ões' : ''})`
                        : 'Ainda não há avaliações para esta universidade.';
            }
        } catch (error) {
            console.error('Erro ao buscar avaliação média:', error);
        }
    }

    // 3. Carregar avaliação do usuário (se logado)
    async function carregarAvaliacaoUsuario() {
        if (!currentUser) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_BASE_URL}/avaliacoes/universidade/${universidadeId}/usuario`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const notaUsuario = data.nota;

                if (notaUsuario !== null) {
                    renderizarEstrelas('estrelas-avaliacao-usuario', notaUsuario, true);
                    document.getElementById('mensagem-avaliacao').textContent = `Você avaliou com ${notaUsuario} estrela${notaUsuario !== 1 ? 's' : ''}.`;
                } else {
                    renderizarEstrelas('estrelas-avaliacao-usuario', 0, true);
                    document.getElementById('mensagem-avaliacao').textContent = 'Clique nas estrelas para avaliar.';
                }

                document.getElementById('secao-avaliar-usuario').style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao buscar avaliação do usuário:', error);
        }
    }

    // 4. Função para renderizar estrelas
    function renderizarEstrelas(containerId, rating, interativa) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const estrela = document.createElement('span');
            estrela.classList.add('estrela');
            
            if (i <= rating) {
                estrela.classList.add('filled');
            } else {
                estrela.classList.add('empty');
            }

            if (interativa) {
                estrela.style.cursor = 'pointer';
                estrela.addEventListener('click', () => avaliarUniversidade(i));
                estrela.addEventListener('mouseenter', () => {
                    if (interativa) {
                        highlightEstrelas(containerId, i);
                    }
                });
            }

            container.appendChild(estrela);
        }
    }

    // 5. Função para destacar estrelas no hover
    function highlightEstrelas(containerId, rating) {
        const container = document.getElementById(containerId);
        const estrelas = container.querySelectorAll('.estrela');
        
        estrelas.forEach((estrela, index) => {
            if (index + 1 <= rating) {
                estrela.classList.add('filled');
                estrela.classList.remove('empty');
            } else {
                estrela.classList.add('empty');
                estrela.classList.remove('filled');
            }
        });
    }

    // 6. Função para avaliar universidade
    async function avaliarUniversidade(nota) {
        if (!currentUser) {
            alert('Você precisa estar logado para avaliar.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_BASE_URL}/avaliacoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    universidadeId: parseInt(universidadeId),
                    nota: nota
                })
            });

            if (response.ok) {
                document.getElementById('mensagem-avaliacao').textContent = 
                    `Você avaliou com ${nota} estrela${nota !== 1 ? 's' : ''}. Obrigado!`;
                
                // Recarregar média
                await carregarAvaliacaoMedia();
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao salvar avaliação.');
            }
        } catch (error) {
            console.error('Erro ao avaliar:', error);
            alert('Erro ao salvar avaliação. Tente novamente.');
        }
    }

    // 7. Carregar reclamações da universidade
    async function carregarReclamacoes() {
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(
                `${window.API_BASE_URL}/complaints/feed?page=1&limit=20&universityId=${universidadeId}`,
                { headers }
            );

            if (response.ok) {
                const result = await response.json();
                const complaints = result.data || [];
                const container = document.getElementById('reclamacoes-container');

                if (complaints.length === 0) {
                    container.innerHTML = '<p>Esta universidade ainda não possui reclamações.</p>';
                    return;
                }

                container.innerHTML = complaints.map(complaint => `
                    <div class="reclamacao-card">
                        <h4>${complaint.titulo}</h4>
                        <p>${complaint.descricao}</p>
                        <div class="reclamacao-info">
                            <span>Categoria: ${complaint.categoria}</span>
                            <span>❤️ ${complaint.likes_count || 0}</span>
                            <span>💬 ${complaint.comentarios_count || 0}</span>
                            <a href="telacomentarios.html?id=${complaint.id}">Ver detalhes</a>
                        </div>
                    </div>
                `).join('');
            } else {
                document.getElementById('reclamacoes-container').innerHTML = 
                    '<p>Erro ao carregar reclamações.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar reclamações:', error);
            document.getElementById('reclamacoes-container').innerHTML = 
                '<p>Erro ao carregar reclamações.</p>';
        }
    }

    // Carregar todos os dados
    await carregarAvaliacaoMedia();
    await carregarAvaliacaoUsuario();
    await carregarReclamacoes();
});
