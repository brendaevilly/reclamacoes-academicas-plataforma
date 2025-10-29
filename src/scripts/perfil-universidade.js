document.addEventListener('DOMContentLoaded', () => {
    // Simulação de dados recebidos do backend via api
    const dadosDeUniversidadeSimulados = {
        nome: "Universidade Federal do Piauí",
        campus: "Senador Helvídio Nunes de Barros",
        sigla: "UFPI",
        valor_avaliacao: 3.0,
        total_reviews: 120
    };

    const { nome, campus, sigla, valor_avaliacao, total_reviews } = dadosDeUniversidadeSimulados;

    document.getElementById('universidade-nome').textContent = nome;
    document.getElementById('campus').textContent = campus;
    document.getElementById('sigla').textContent = sigla;
    document.getElementById('valor-avaliacao').textContent = `Média: ${valor_avaliacao.toFixed(1)} / 5.0 (Baseado em ${total_reviews} avaliações)`;

    const boxEstrelas = document.getElementById('estrelas-avaliacao');

    const renderizarEstrelas = (rating) => {
        boxEstrelas.innerHTML = ''; // Limpa o container
        const maxEstrelas = 5;
        
        for (let i = 1; i <= maxEstrelas; i++) {
            const estrela = document.createElement('span');
            estrela.classList.add('estrela');

            if (i <= Math.floor(rating)) {
                estrela.classList.add('filled');
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                estrela.classList.add('filled'); 
            } else {
                estrela.classList.add('empty');
            }
            
            boxEstrelas.appendChild(estrela);
        }
    };

    renderizarEstrelas(valor_avaliacao);

    // NOTA: A lógica de cálculo da nota seria no Backend.
    // O Frontend apenas consumiria a nota média já calculada.
});