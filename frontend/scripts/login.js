const API_BASE_URL = "http://localhost:3000"; // Gateway URL

document.addEventListener('DOMContentLoaded', () => {
    // TB4: validação visual
    window.FormValidator.attach('#form-login', {
        fields: {
            email: { label: 'E-mail', required: true, email: true },
            senha: { label: 'Senha', required: true, minLength: 1 }
        },

        // Padrão 1 — Requisição que bloqueia a UI intencionalmente (feedback ao usuário) (async/await)

        onSubmit: async (values) => {
            const submitBtn = document.querySelector('#form-login button[type="submit"]');
            const oldText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Entrando...';

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: values.email.trim(), senha: values.senha })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error || 'Email ou senha incorretos.');
                    return;
                }

                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('userType', 'aluno');

                alert('Login realizado com sucesso!');
                window.location.href = 'telafeed.html';
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                alert('Erro ao conectar com o servidor. Tente novamente.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = oldText;
            }
        }
    });
});
