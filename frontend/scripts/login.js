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

            if (response.ok) {
                const data = await response.json();
                console.log("Resposta do login (aluno):", data);

                // Verificar se o token existe
                if (!data.token) {
                    alert('Erro: Token não recebido do servidor.');
                    return;
                }

                // Salvar token e dados do usuário
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userType', 'aluno');

                // Verificar se salvou corretamente
                console.log('Token salvo:', localStorage.getItem('token'));

                alert('Login realizado com sucesso!');
                window.location.href = 'telaprincipal.html';
                return; // IMPORTANTE: Sair da função aqui
            }

            alert('Email ou senha incorretos.');

        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    });
});