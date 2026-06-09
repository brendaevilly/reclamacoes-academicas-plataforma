const API_BASE_URL = "http://localhost:3000"; // Gateway URL

document.addEventListener('DOMContentLoaded', () => {
  const ehAnonimoCheckbox = document.getElementById('eh-anonimo');
  const nomeGrupo = document.getElementById('nome-grupo');
  const nomeInput = document.getElementById('nome');

  // Construir configuração de validação dinamicamente
  // (campo "nome" só é obrigatório quando o cadastro NÃO é anônimo)
  const fieldsConfig = {
    nome: {
      label: "Nome completo",
      required: !ehAnonimoCheckbox.checked,
      minLength: 2,
      maxLength: 120
    },
    email: {
      label: "E-mail",
      required: true,
      email: true
    },
    senha: {
      label: "Senha",
      required: true,
      strongPassword: true
    }
  };

  // Toggle de "anônimo": ajusta visualmente e tira o required
  const ajustarNome = () => {
    if (ehAnonimoCheckbox.checked) {
      nomeGrupo.style.display = 'none';
      nomeInput.removeAttribute('required');
      nomeInput.value = '';
      fieldsConfig.nome.required = false;
    } else {
      nomeGrupo.style.display = 'block';
      nomeInput.setAttribute('required', 'required');
      fieldsConfig.nome.required = true;
    }
  };

  ajustarNome();
  ehAnonimoCheckbox.addEventListener('change', ajustarNome);

  // TB4: validação visual
  window.FormValidator.attach('#form-cadastro', {
    fields: fieldsConfig,

    // Padrão 1 — Requisição que bloqueia a UI intencionalmente (feedback ao usuário) (async/await)
    onSubmit: async (values) => {
      const ehAnonimo = ehAnonimoCheckbox.checked;
      const dadosUsuario = {
        nome: ehAnonimo ? 'Anônimo' : values.nome.trim(),
        email: values.email.trim(),
        senha: values.senha
      };

      const submitBtn = document.querySelector('#form-cadastro button[type="submit"]');
      const oldText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cadastrando...';

      try {
        const response = await fetch(`${API_BASE_URL}/auth/cadastro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
      }
    }
  });
});
