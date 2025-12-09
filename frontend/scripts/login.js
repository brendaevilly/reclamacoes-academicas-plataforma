const API_BASE_URL = "http://localhost:3000"; // Gateway URL

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value.trim();

        if (!email || !senha) {
            alert('Por favor, preencha o email e a senha.');
            return;
        }

        const dadosLogin = { email, senha };

        try {
            // Tentar login como aluno
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosLogin)
            });

            const data = await response.json();

            console.log(response);
            console.log(data)

            if (!response.ok) {
                alert(data.error || 'Email ou senha incorretos.');
                return; // interrompe a execução
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userType', 'aluno');
            
            alert('Login realizado com sucesso!');
            window.location.href = 'telafeed.html';
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    });
});
