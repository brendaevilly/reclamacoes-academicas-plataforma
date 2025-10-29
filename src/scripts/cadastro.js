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
        }else{
            nomeGrupo.style.display = 'block';
            nomeInput.setAttribute('required', 'required');
        }
    };

    mudaVisibilidadeNome();

    ehAnonimoCheckbox.addEventListener('change', mudaVisibilidadeNome);

    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ehAnonimo = ehAnonimoCheckbox.checked;
        const nome = ehAnonimo?null:nomeInput.value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        if(!email || !senha || (!ehAnonimo && !nome)){
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Simulação de envio para api

        const dadosUsuario = {
            nome: nome,
            email: email,
            senha: senha,
            ehAnonimo: ehAnonimo
        };

        console.log('Dados a serem enviados: ', dadosUsuario);

        // Aqui seria  achamada para a api

        // Simulação de sucesso para demonstração

        alert(`Simulação de cadastro:
            Anônimo: ${ehAnonimo}
            Nome: ${nome} || 'N/A'
            Email: ${email}
            Senha: [oculta]
            
            A lógica de alternancia de campos está funcional`);
    });
});