document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se o usuário está logado
    if (!window.isAuthenticated || !window.isAuthenticated()) {
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

    // Elementos do formulário
    const nomeInput = document.getElementById('nome-completo');
    const emailInput = document.getElementById('email-usuario');
    const universidadeInput = document.getElementById('universidade-usuario');
    const senhaAtualInput = document.getElementById('senha-atual');
    const novaSenhaInput = document.getElementById('nova-senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const btnSalvar = document.getElementById('btn-salvar');

    // Carregar dados do usuário
    try {
        const userResponse = await window.fetchWithAuth(`${window.API_BASE_URL}/auth/${currentUser.id}`, {
            method: 'GET'
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            nomeInput.value = userData.nome || '';
            emailInput.value = userData.email || '';
            // A universidade não está no modelo de usuário atual, então deixamos vazio
            universidadeInput.value = '';
        } else {
            // Usar dados do localStorage como fallback
            nomeInput.value = currentUser.nome || '';
            emailInput.value = currentUser.email || '';
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Usar dados do localStorage como fallback
        nomeInput.value = currentUser.nome || '';
        emailInput.value = currentUser.email || '';
    }

    // Event listener para salvar alterações
    btnSalvar.addEventListener('click', async () => {
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senhaAtual = senhaAtualInput.value;
        const novaSenha = novaSenhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;

        // Validações básicas
        if (!nome) {
            alert('Por favor, preencha o nome completo.');
            return;
        }

        if (!email) {
            alert('Por favor, preencha o e-mail.');
            return;
        }

        // Validação de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Por favor, insira um e-mail válido.');
            return;
        }

        // Se o usuário preencheu campos de senha, validar
        if (senhaAtual || novaSenha || confirmarSenha) {
            if (!senhaAtual) {
                alert('Por favor, informe a senha atual para alterar a senha.');
                return;
            }

            if (!novaSenha) {
                alert('Por favor, informe a nova senha.');
                return;
            }

            if (novaSenha.length < 6) {
                alert('A nova senha deve ter pelo menos 6 caracteres.');
                return;
            }

            if (novaSenha !== confirmarSenha) {
                alert('As senhas não coincidem.');
                return;
            }
        }

        // Preparar dados para atualização
        const updateData = {
            nome,
            email
        };

        // Se houver nova senha, adicionar ao objeto de atualização
        // Nota: A validação da senha atual deve ser feita no backend
        if (novaSenha) {
            updateData.senha = novaSenha;
        }

        try {
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';

            const response = await window.fetchWithAuth(`${window.API_BASE_URL}/auth/${currentUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                
                // Atualizar localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                alert('Dados atualizados com sucesso!');
                
                // Limpar campos de senha
                senhaAtualInput.value = '';
                novaSenhaInput.value = '';
                confirmarSenhaInput.value = '';
                
                // Opcional: redirecionar para o perfil
                // window.location.href = 'perfil-usuario.html';
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Erro ao atualizar dados. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            alert('Erro de conexão com o servidor. Por favor, tente novamente.');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Alterações';
        }
    });
});

