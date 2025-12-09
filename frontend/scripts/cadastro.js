const API_BASE_URL = "http://localhost:3000"; // Gateway URL

// Função para validar se a senha atende aos requisitos de segurança do backend
function validarSenhaForte(senha) {
    if (senha.length < 8) {
        return "A senha deve ter pelo menos 8 caracteres.";
    }
    if (!/[0-9]/.test(senha)) {
        return "A senha deve conter pelo menos um número.";
    }
    if (!/[A-Z]/.test(senha)) {
        return "A senha deve conter pelo menos uma letra maiúscula.";
    }
    if (!/[a-z]/.test(senha)) {
        return "A senha deve conter pelo menos uma letra minúscula.";
    }
    if (!/[\W_]/.test(senha)) {
        return "A senha deve conter pelo menos um caractere especial.";
    }
    return null; // Senha válida
}

document.addEventListener('DOMContentLoaded', () => {
  const ehAnonimoCheckbox = document.getElementById('eh-anonimo');
  const nomeGrupo = document.getElementById('nome-grupo');
  const nomeInput = document.getElementById('nome');
  const formCadastro = document.getElementById('form-cadastro');

  const mudaVisibilidadeNome = () => {
    if(ehAnonimoCheckbox.checked){
      nomeGrupo.style.display = 'none';
      nomeInput.removeAttribute('required');
      nomeInput.value = '';
    } else {
      nomeGrupo.style.display = 'block';
      nomeInput.setAttribute('required', 'required');
    }
  };

  mudaVisibilidadeNome();
  ehAnonimoCheckbox.addEventListener('change', mudaVisibilidadeNome);

  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ehAnonimo = ehAnonimoCheckbox.checked;
    const nome = ehAnonimo ? 'Anônimo' : nomeInput.value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if(!email || !senha || (!ehAnonimo && !nome)){
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validação de senha forte
    const erroSenha = validarSenhaForte(senha);
    if (erroSenha) {
        alert('A senha não atende aos requisitos de segurança:\n' + erroSenha);
        return;
    }

    const dadosUsuario = { nome, email, senha };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/cadastro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosUsuario)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        window.location.href = 'login.html';
      } else {
        alert(data.error || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      alert('Erro ao conectar com o servidor. Tente novamente.');
    }
  });
});