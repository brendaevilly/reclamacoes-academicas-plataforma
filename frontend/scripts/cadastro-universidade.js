const API_BASE_URL = "http://localhost:3000"; // Gateway URL

document.addEventListener('DOMContentLoaded', () => {
    const formUniversidade = document.getElementById('form-universidade');

    formUniversidade.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const sigla = document.getElementById('sigla').value;
        const campus = document.getElementById('campus').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        const dadosUniversidade = {
            nome,
            sigla,
            campus,
            email,
            senha
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
                window.location.href = 'login-universidade.html';
            } else {
                alert(data.error || 'Erro ao cadastrar universidade. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao cadastrar universidade:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const formUniversidade = document.getElementById('form-universidade');

    formUniversidade.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const sigla = document.getElementById('sigla').value;
        const campus = document.getElementById('campus').value;

        const dadosUniversidade = {
            nome: nome,
            sigla: sigla,
            campus: campus,
        };

        console.log('Dados da Universidade a serem enviados:', dadosUniversidade);

        // Simulação de sucesso
        alert(`Simulação de Cadastro de Universidade:
        Nome: ${nome}
        Sigla: ${sigla}
        Campus: ${campus}
        
        Universidade cadastrada com sucesso!`);
        
        // Redirecionar para a página de perfil da universidade recém-criada
    });
});