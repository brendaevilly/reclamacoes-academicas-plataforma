document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    formLogin.addEventListener('submit', async (e) =>{
        e.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        if(!email || ! senha){
            alert('Por favor, preencha o email e a senha.');
            return;
        }

        // Simulação de envio para api

        const dadosLogin = {
            email: email,
            senha: senha
        };

        console.log('Dados de login a serem enviados: ', dadosLogin);

        // Aqui seria a chamada real da api

        // Simulação de sucesso para fins de demonstração

        alert(`Simulação de login:
            Email: ${email}
            Senha: [oculta]
            
            Login simulado com sucesso, o próximo passo seria receber o token e redicionar para o feed.`);
    });
});