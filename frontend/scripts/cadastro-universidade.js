const API_BASE_URL = "http://localhost:3000"; // Gateway URL

document.addEventListener('DOMContentLoaded', () => {
    // TB4: validação visual
    window.FormValidator.attach('#form-universidade', {
        fields: {
            nome: {
                label: 'Nome da universidade',
                required: true,
                minLength: 3,
                maxLength: 150
            },
            sigla: {
                label: 'Sigla',
                required: true,
                minLength: 2,
                maxLength: 15,
                pattern: /^[A-Za-zÀ-ÿ0-9.\-]+$/,
                patternMessage: 'Sigla inválida. Use apenas letras, números e ".-".'
            },
            campus: {
                label: 'Campus',
                required: true,
                minLength: 2,
                maxLength: 100
            },
            email: {
                label: 'E-mail institucional',
                required: true,
                email: true
            },
            senha: {
                label: 'Senha',
                required: true,
                strongPassword: true
            }
        },
        onSubmit: async (values) => {
            const submitBtn = document.querySelector('#form-universidade button[type="submit"]');
            const oldText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cadastrando...';

            try {
                const response = await fetch(`${API_BASE_URL}/universidades/cadastro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome: values.nome.trim(),
                        sigla: values.sigla.trim().toUpperCase(),
                        campus: values.campus.trim(),
                        email: values.email.trim(),
                        senha: values.senha
                    })
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
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = oldText;
            }
        }
    });
});
