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