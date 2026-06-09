document.addEventListener('DOMContentLoaded', async () => {
    if (!window.isAuthenticated || !(await window.isAuthenticated())) {
        alert('Você precisa estar logado para acessar as configurações.');
        window.location.href = 'login.html';
        return;
    }

    const currentUser = window.getCurrentUser();
    if (!currentUser) {
        alert('Erro ao carregar dados do usuário. Por favor, faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    const nomeInput = document.getElementById('nome-completo');
    const emailInput = document.getElementById('email-usuario');
    const universidadeInput = document.getElementById('universidade-usuario');
    const senhaAtualInput = document.getElementById('senha-atual');
    const novaSenhaInput = document.getElementById('nova-senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');

    try {
        const userResponse = await window.fetchWithAuth(`${window.API_BASE_URL}/auth/${currentUser.id}`, {
            method: 'GET'
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            nomeInput.value = userData.nome || '';
            emailInput.value = userData.email || '';
            universidadeInput.value = '';
        } else {
            nomeInput.value = currentUser.nome || '';
            emailInput.value = currentUser.email || '';
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        nomeInput.value = currentUser.nome || '';
        emailInput.value = currentUser.email || '';
    }

    // TB4: validação visual
    // OBS: campos de senha são "opcionais" no schema. A validação é dinâmica:
    // se o usuário começou a preencher qualquer um deles, todos viram obrigatórios.
    const fv = window.FormValidator.attach('#form-config', {
        fields: {
            'nome-completo': {
                label: 'Nome completo',
                required: true,
                minLength: 2,
                maxLength: 120
            },
            'email-usuario': {
                label: 'E-mail',
                required: true,
                email: true
            },
            'senha-atual': {
                label: 'Senha atual',
                custom: (v) => {
                    const querTrocar = novaSenhaInput.value || confirmarSenhaInput.value || v;
                    if (querTrocar && !v) return 'Informe a senha atual para alterar a senha.';
                    return null;
                }
            },
            'nova-senha': {
                label: 'Nova senha',
                custom: (v, all) => {
                    const querTrocar = senhaAtualInput.value || confirmarSenhaInput.value || v;
                    if (!querTrocar) return null;
                    if (!v) return 'Informe a nova senha.';
                    if (v.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.';
                    if (!/[A-Z]/.test(v)) return 'A nova senha precisa de uma letra maiúscula.';
                    if (!/[a-z]/.test(v)) return 'A nova senha precisa de uma letra minúscula.';
                    if (!/[0-9]/.test(v)) return 'A nova senha precisa de um número.';
                    if (!/[\W_]/.test(v)) return 'A nova senha precisa de um caractere especial.';
                    return null;
                }
            },
            'confirmar-senha': {
                label: 'Confirmar nova senha',
                custom: (v) => {
                    if (!novaSenhaInput.value && !v) return null;
                    if (!v) return 'Confirme a nova senha.';
                    if (v !== novaSenhaInput.value) return 'As senhas não coincidem.';
                    return null;
                }
            }
        },

        // Padrão 1 — Requisição que bloqueia a UI intencionalmente (feedback ao usuário) (async/await)
        onSubmit: async (values) => {
            const btnSalvar = document.getElementById('btn-salvar');
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';

            const nome = values['nome-completo'].trim();
            const email = values['email-usuario'].trim();
            const senhaAtual = values['senha-atual'];
            const novaSenha = values['nova-senha'];

            // Padrão 3 — Múltiplas requisições encadeadas (sequencial assíncrono) (async/await)
            try {
                const updateResponse = await window.fetchWithAuth(
                    `${window.API_BASE_URL}/auth/${currentUser.id}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({ nome, email })
                    }
                );

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    alert(errorData.error || 'Erro ao atualizar dados.');
                    return;
                }

                const updatedUser = await updateResponse.json();
                sessionStorage.setItem('user', JSON.stringify(updatedUser));

                if (senhaAtual && novaSenha) {
                    const senhaResponse = await window.fetchWithAuth(
                        `${window.API_BASE_URL}/auth/${currentUser.id}/senha`,
                        {
                            method: 'PUT',
                            body: JSON.stringify({ senhaAtual, novaSenha })
                        }
                    );

                    if (!senhaResponse.ok) {
                        const errorData = await senhaResponse.json();
                        // Erro de servidor — exibir abaixo do campo de senha atual
                        fv.setServerError('senha-atual', errorData.error || 'Erro ao alterar senha.');
                        return;
                    }
                }

                alert('Dados atualizados com sucesso!');
                senhaAtualInput.value = '';
                novaSenhaInput.value = '';
                confirmarSenhaInput.value = '';
            } catch (error) {
                console.error('Erro ao atualizar dados:', error);
                alert('Erro de conexão com o servidor. Por favor, tente novamente.');
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Alterações';
            }
        }
    });

    // Revalidar campos de senha quando qualquer um deles muda (dependência cruzada)
    [senhaAtualInput, novaSenhaInput, confirmarSenhaInput].forEach((el) => {
        el.addEventListener('input', () => {
            fv.validateField('senha-atual');
            fv.validateField('nova-senha');
            fv.validateField('confirmar-senha');
        });
    });
});
