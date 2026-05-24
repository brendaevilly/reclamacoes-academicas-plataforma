document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("form-reclamacao");

    const authOk = await window.isAuthenticated();
    if (!authOk) {
        const currentUser = window.getCurrentUser();
        if (!currentUser) {
            alert("Você precisa estar logado para adicionar uma reclamação.");
            window.location.href = "login.html";
            return;
        }
    }

    const selectUniversidade = document.getElementById("universidade");
    const selectCategoria = document.getElementById("categoria");
    const selectCampus = document.getElementById("campus");
    let universidadesData = [];

    // Carregar universidades do backend
    try {
        const response = await fetch(`${window.API_BASE_URL}/universidades`, {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        universidadesData = await response.json();

        // Limpamos via .remove() em vez de .innerHTML = "..." porque
        // sobrescrever innerHTML de um <select> renderizado quebra o popup
        // nativo do dropdown no Firefox (e em alguns Chrome Linux): o campo
        // fica focável mas o menu suspenso nunca abre.
        while (selectUniversidade.options.length > 0) selectUniversidade.remove(0);

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Selecione a instituição";
        selectUniversidade.appendChild(placeholder);

        const universidadesAgrupadas = {};
        universidadesData.forEach(univ => {
            const key = `${univ.sigla} - ${univ.nome}`;
            if (!universidadesAgrupadas[key]) universidadesAgrupadas[key] = univ;
        });

        Object.values(universidadesAgrupadas).forEach(univ => {
            const option = document.createElement("option");
            option.value = univ.id;
            option.textContent = `${univ.sigla} - ${univ.nome}`;
            option.dataset.sigla = univ.sigla || '';
            option.dataset.nome = univ.nome || '';
            selectUniversidade.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar universidades:", error);
        while (selectUniversidade.options.length > 0) selectUniversidade.remove(0);
        const errOpt = document.createElement("option");
        errOpt.value = "";
        errOpt.textContent = "Erro ao carregar instituições";
        selectUniversidade.appendChild(errOpt);
    }

    // Helper local para repopular o select de campus sem usar innerHTML
    // (mesmo motivo: preservar o popup nativo do dropdown).
    function setCampusOptions(placeholderText, items, enabled) {
        while (selectCampus.options.length > 0) selectCampus.remove(0);

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = placeholderText;
        selectCampus.appendChild(placeholder);

        for (const item of items) {
            const opt = document.createElement("option");
            opt.value = item.value;
            opt.textContent = item.text;
            if (item.selected) opt.selected = true;
            selectCampus.appendChild(opt);
        }
        selectCampus.disabled = !enabled;
    }

    selectUniversidade.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        const selectedUniv = universidadesData.find(u => u.id == selectedId);

        if (selectedUniv) {
            const siglaOuNome = selectedUniv.sigla || selectedUniv.nome;
            const campusDisponiveis = universidadesData
                .filter(u => (u.sigla === siglaOuNome || u.nome === selectedUniv.nome) && u.campus)
                .map(u => u.campus)
                .filter((campus, index, self) => self.indexOf(campus) === index);

            if (campusDisponiveis.length > 0) {
                setCampusOptions(
                    "Selecione o campus",
                    campusDisponiveis.map(c => ({
                        value: c, text: c, selected: c === selectedUniv.campus
                    })),
                    true
                );
            } else {
                setCampusOptions("Nenhum campus disponível", [], false);
            }
        } else {
            setCampusOptions("Selecione primeiro a instituição", [], false);
        }
    });

    // TB4: validação visual
    window.FormValidator.attach('#form-reclamacao', {
        fields: {
            titulo: { label: 'Título', required: true, minLength: 5, maxLength: 150 },
            categoria: { label: 'Categoria', required: true },
            universidade: { label: 'Instituição', required: true },
            campus: {
                label: 'Campus',
                required: true,
                custom: (v) => (!v ? 'Selecione um campus.' : null)
            },
            descricao: {
                label: 'Descrição',
                required: true,
                minLength: 20,
                maxLength: 2000
            }
        },
        onSubmit: async (values) => {
            const titulo = values.titulo.trim();
            const descricao = values.descricao.trim();
            const categoriaId = values.categoria;
            const universidadeId = values.universidade;
            const campus = values.campus;

            // Resolver universidade com campus correto (caso seja universidade
            // multi-campus na lista)
            const selectedUniv = universidadesData.find(u => u.id == universidadeId);
            let universidadeIdFinal = Number(universidadeId);
            if (selectedUniv && selectedUniv.campus !== campus) {
                const siglaOuNome = selectedUniv.sigla || selectedUniv.nome;
                const universidadeComCampus = universidadesData.find(u =>
                    (u.sigla === siglaOuNome || u.nome === selectedUniv.nome) &&
                    u.campus === campus
                );
                if (universidadeComCampus) universidadeIdFinal = universidadeComCampus.id;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const oldText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                const response = await window.fetchWithAuth(`${window.API_BASE_URL}/complaints`, {
                    method: "POST",
                    body: JSON.stringify({
                        titulo,
                        descricao,
                        categoriaId,
                        universidadeId: universidadeIdFinal
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Reclamação adicionada com sucesso!");
                    window.location.href = "telafeed.html";
                } else {
                    alert(`Erro ao adicionar reclamação: ${result.error || result.message || response.statusText}`);
                }

            } catch (error) {
                console.error("Erro de rede:", error);
                alert("Erro de conexão com o servidor.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = oldText;
            }
        }
    });
});
