document.addEventListener('DOMContentLoaded', () => {
    // Verificar se a API está configurada
    if (!window.API_BASE_URL) {
        console.error('API_BASE_URL não está definida. Verifique se api-config.js foi carregado.');
        document.getElementById('results-container').innerHTML = 
            '<p class="no-results" style="color: red;">Erro: Configuração da API não encontrada.</p>';
        return;
    }

    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    let searchTimeout;

    // Função para buscar universidades
    async function buscarUniversidades(query) {
        if (!query || query.trim().length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Digite algo para buscar universidades...</p>';
            return;
        }

        // Mostrar indicador de carregamento
        resultsContainer.innerHTML = '<p class="no-results">Buscando...</p>';

        try {
            const url = `${window.API_BASE_URL}/universidades?search=${encodeURIComponent(query.trim())}`;
            console.log('Buscando em:', url);
            
            const response = await fetch(url);
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                throw new Error(`Erro ao buscar universidades: ${response.status}`);
            }

            const universidades = await response.json();
            console.log('Universidades encontradas:', universidades);

            if (!Array.isArray(universidades)) {
                throw new Error('Resposta inválida do servidor');
            }

            if (universidades.length === 0) {
                resultsContainer.innerHTML = '<p class="no-results">Nenhuma universidade encontrada com esse termo.</p>';
                return;
            }

            // Renderizar resultados
            resultsContainer.innerHTML = universidades.map(uni => `
                <div class="university-card" onclick="window.location.href='perfil-universidade.html?id=${uni.id}'">
                    <h5>${uni.nome || 'Nome não informado'}</h5>
                    <p><strong>Sigla:</strong> ${uni.sigla || '-'}</p>
                    <p><strong>Campus:</strong> ${uni.campus || '-'}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erro ao buscar universidades:', error);
            resultsContainer.innerHTML = `<p class="no-results">Erro ao buscar universidades: ${error.message}. Verifique o console para mais detalhes.</p>`;
        }
    }

    // Event listener para o input de busca
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        // Debounce: aguardar 300ms após o usuário parar de digitar
        searchTimeout = setTimeout(() => {
            if (query.length === 0) {
                // Se o campo estiver vazio, mostrar todas as universidades
                buscarTodasUniversidades();
            } else {
                buscarUniversidades(query);
            }
        }, 300);
    });

    // Função para buscar todas as universidades
    async function buscarTodasUniversidades() {
        resultsContainer.innerHTML = '<p class="no-results">Carregando todas as universidades...</p>';
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/universidades`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar universidades');
            }

            const universidades = await response.json();

            if (!Array.isArray(universidades)) {
                throw new Error('Resposta inválida do servidor');
            }

            if (universidades.length === 0) {
                resultsContainer.innerHTML = '<p class="no-results">Nenhuma universidade cadastrada.</p>';
                return;
            }

            // Renderizar resultados
            resultsContainer.innerHTML = universidades.map(uni => `
                <div class="university-card" onclick="window.location.href='perfil-universidade.html?id=${uni.id}'">
                    <h5>${uni.nome || 'Nome não informado'}</h5>
                    <p><strong>Sigla:</strong> ${uni.sigla || '-'}</p>
                    <p><strong>Campus:</strong> ${uni.campus || '-'}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erro ao buscar universidades:', error);
            resultsContainer.innerHTML = `<p class="no-results">Erro ao buscar universidades: ${error.message}</p>`;
        }
    }

    // Carregar todas as universidades ao iniciar
    buscarTodasUniversidades();
});

