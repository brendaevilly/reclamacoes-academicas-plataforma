const API_BASE_URL = "http://localhost:3000"; // Gateway URL

document.addEventListener('DOMContentLoaded', () => {
    const formUniversidade = document.getElementById('form-universidade');

    formUniversidade.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const sigla = document.getElementById('sigla').value;
        const campus = document.getElementById('campus').value;

        const dadosUniversidade = {
            nome,
            sigla,
            campus
        };

        try {
            const response = await fetch(`${API_BASE_URL}/universidades/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosUniversidade)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Universidade cadastrada com sucesso!');
                window.location.href = 'telafeed.html';
            } else {
                alert(data.error || 'Erro ao cadastrar universidade. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao cadastrar universidade:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    });
});
