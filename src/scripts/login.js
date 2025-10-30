document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Captura os valores dos inputs
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value.trim();

        // Validação simples
        if (!email || !senha) {
            alert('Por favor, preencha o email e a senha.');
            return;
        }

        // Dados que seriam enviados para a API
        const dadosLogin = { email, senha };

        console.log('Dados de login a serem enviados:', dadosLogin);

        // Simulação de resposta da API
        alert(`Simulação de login:
Email: ${email}
Senha: [oculta]

Login simulado com sucesso! O próximo passo seria receber o token e redirecionar para o feed.`);
        
        // Aqui você poderia redirecionar, por exemplo:
        // window.location.href = 'feed.html';
    });
});
