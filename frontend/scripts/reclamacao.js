const API_BASE_URL = "http://localhost:3000"; // Assumindo que o Gateway está na porta 3000

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const token = localStorage.getItem("token"); // Assumindo que o token JWT está armazenado no localStorage

    if (!token) {
        alert("Você precisa estar logado para adicionar uma reclamação.");
        window.location.href = "login.html"; // Redireciona para login
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const titulo = document.getElementById("titulo").value;
        const categoria = document.getElementById("categoria").value;
        const descricao = document.getElementById("descricao").value;

        // **IMPORTANTE**: O ID da universidade deve ser obtido de alguma forma (e.g., do perfil do usuário logado ou de um campo de seleção)
        // Para fins de demonstração, usaremos um valor fixo.
        const universidade_id = 1;

        if (categoria === "Selecione a categoria") {
            alert("Por favor, selecione uma categoria.");
            return;
        }

        const complaintData = {
            titulo,
            descricao,
            categoria,
            universidade_id,
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
                window.location.href = "telafeed.html"; // Redireciona para o feed
            } else {
                alert(`Erro ao adicionar reclamação: ${result.message || response.statusText}`);
            }
        } catch (error) {
            console.error("Erro de rede:", error);
            alert("Erro de conexão com o servidor.");
        }
    });
});