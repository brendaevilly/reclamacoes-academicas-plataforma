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

        selectUniversidade.innerHTML = '<option value="">Selecione a instituição</option>';

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
        selectUniversidade.innerHTML = '<option value="">Erro ao carregar instituições</option>';
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
                selectCampus.disabled = false;
                selectCampus.innerHTML = '<option value="">Selecione o campus</option>';

                campusDisponiveis.forEach(campus => {
                    const option = document.createElement("option");
                    option.value = campus;
                    option.textContent = campus;
                    if (campus === selectedUniv.campus) option.selected = true;
                    selectCampus.appendChild(option);
                });
            } else {
                selectCampus.disabled = true;
                selectCampus.innerHTML = '<option value="">Nenhum campus disponível</option>';
            }
        } else {
            selectCampus.disabled = true;
            selectCampus.innerHTML = '<option value="">Selecione primeiro a instituição</option>';
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
