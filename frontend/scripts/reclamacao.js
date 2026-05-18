const API_BASE_URL = "http://localhost:3000"; // Gateway

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("form");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Você precisa estar logado para adicionar uma reclamação.");
        window.location.href = "login.html";
        return;
    }

    const selectUniversidade = document.getElementById("universidade");
    const selectCategoria = document.getElementById("categoria");
    const selectCampus = document.getElementById("campus");
    let universidadesData = [];

    // Carregar universidades do backend
    try {
        const response = await fetch(`${API_BASE_URL}/universidades`);
        universidadesData = await response.json();

        selectUniversidade.innerHTML = '<option selected disabled>Selecione a instituição</option>';

        // Agrupar universidades por sigla/nome para evitar duplicatas na lista
        const universidadesAgrupadas = {};
        universidadesData.forEach(univ => {
            const key = `${univ.sigla} - ${univ.nome}`;
            if (!universidadesAgrupadas[key]) {
                universidadesAgrupadas[key] = univ;
            }
        });

        // Adicionar universidades agrupadas ao select
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
        selectUniversidade.innerHTML = '<option disabled>Erro ao carregar instituições</option>';
    }

    // Atualizar campus quando universidade for selecionada
    selectUniversidade.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        const selectedUniv = universidadesData.find(u => u.id == selectedId);
        
        if (selectedUniv) {
            // Buscar todos os campus disponíveis para universidades com a mesma sigla/nome
            const siglaOuNome = selectedUniv.sigla || selectedUniv.nome;
            const campusDisponiveis = universidadesData
                .filter(u => (u.sigla === siglaOuNome || u.nome === selectedUniv.nome) && u.campus)
                .map(u => u.campus)
                .filter((campus, index, self) => self.indexOf(campus) === index); // Remover duplicatas
            
            if (campusDisponiveis.length > 0) {
                selectCampus.disabled = false;
                selectCampus.innerHTML = '<option selected disabled>Selecione o campus</option>';
                
                campusDisponiveis.forEach(campus => {
                    const option = document.createElement("option");
                    option.value = campus;
                    option.textContent = campus;
                    // Selecionar o campus da universidade selecionada por padrão
                    if (campus === selectedUniv.campus) {
                        option.selected = true;
                    }
                    selectCampus.appendChild(option);
                });
            } else {
                selectCampus.disabled = true;
                selectCampus.innerHTML = '<option selected disabled>Nenhum campus disponível</option>';
            }
        } else {
            selectCampus.disabled = true;
            selectCampus.innerHTML = '<option selected disabled>Selecione primeiro a instituição</option>';
        }
    });

    // Enviar reclamação
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const titulo = document.getElementById("titulo").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const categoriaId = selectCategoria.value;
        const universidadeId = selectUniversidade.value;
        const campus = selectCampus.value;

        if (!categoriaId || categoriaId === "Selecione a categoria") {
            alert("Por favor, selecione uma categoria.");
            return;
        }

        if (!universidadeId) {
            alert("Por favor, selecione uma instituição.");
            return;
        }

        if (!campus || selectCampus.disabled || campus === "Selecione o campus") {
            alert("Por favor, selecione um campus.");
            return;
        }

        // Encontrar a universidade correta com o campus selecionado
        const selectedUniv = universidadesData.find(u => u.id == universidadeId);
        let universidadeIdFinal = Number(universidadeId);
        
        if (selectedUniv) {
            // Se o campus selecionado for diferente do campus da universidade selecionada,
            // buscar a universidade com o campus correto
            if (selectedUniv.campus !== campus) {
                const siglaOuNome = selectedUniv.sigla || selectedUniv.nome;
                const universidadeComCampus = universidadesData.find(u => 
                    (u.sigla === siglaOuNome || u.nome === selectedUniv.nome) && 
                    u.campus === campus
                );
                if (universidadeComCampus) {
                    universidadeIdFinal = universidadeComCampus.id;
                }
            }
        }

        const complaintData = {
            titulo,
            descricao,
            categoriaId: categoriaId, // Enviar como string (nome da categoria)
            universidadeId: universidadeIdFinal,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/complaints`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(complaintData),
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
        }
    });
});