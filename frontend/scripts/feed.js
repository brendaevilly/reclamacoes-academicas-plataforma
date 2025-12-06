const API_BASE_URL = "http://localhost:3000"; // Assumindo que o Gateway está na porta 3000
const feedContainer = document.querySelector("main.container");

function voltarPagina() {
  window.location.href = "telaprincipal.html";
}

function createComplaintCard(complaint) {
  const card = document.createElement("div");
  card.className = "card p-3 mb-3";
  card.setAttribute("data-categoria", complaint.categoria);
  // Assumindo que o nome da universidade será buscado ou já estará no objeto
  card.setAttribute("data-universidade", `@${complaint.universidade_id}`);

  const date = new Date(complaint.data_criacao).toLocaleDateString('pt-BR');
  const statusClass = complaint.status.toLowerCase().replace(' ', '-');

  card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h5 class="mb-1">${complaint.titulo}</h5>
                <span class="categoria">${complaint.categoria}</span> ·
                <span class="universidade">@${complaint.universidade_id}</span>
            </div>
            <small class="text-muted">${date}</small>
        </div>
        <p class="mt-2 mb-2">${complaint.descricao}</p>
        <span class="status ${statusClass}">${complaint.status}</span>
        <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
            <div class="d-flex align-items-center">
                <button class="btn-icon" data-id="${complaint.id}">↑</button>
                <span class="contador">0</span> <!-- Contador de votos/apoios -->
                <button class="btn-icon ms-2">↻</button>
            </div>
            <a href="telacomentarios.html?id=${complaint.id}" class="comentarios">💬 0 comentários</a>
        </div>
    `;
  return card;
}

async function loadFeed(filters = {}) {
  // Remove os cards existentes (exceto os elementos de filtro)
  document.querySelectorAll("main.container > .card").forEach(card => card.remove());
  document.querySelectorAll("main.container > .categoria-titulo").forEach(title => title.remove());

  const { category, universityId, page = 1, limit = 10 } = filters;

  let url = `${API_BASE_URL}/complaints/feed?page=${page}&limit=${limit}`;
  if (category && category !== "Todos") {
    url += `&category=${category}`;
  }
  if (universityId && universityId !== "Todas") {
    url += `&universityId=${universityId.replace('@', '')}`; // Remove o @ para enviar o ID
  }

  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    const result = await response.json();

    if (response.ok) {
      const complaints = result.data;
      if (complaints.length === 0) {
        const noData = document.createElement("p");
        noData.textContent = "Nenhuma reclamação encontrada com os filtros selecionados.";
        feedContainer.appendChild(noData);
        return;
      }

      complaints.forEach(complaint => {
        feedContainer.appendChild(createComplaintCard(complaint));
      });

      // Aqui você pode adicionar a lógica de paginação (botões Próximo/Anterior)
      // usando result.meta.totalPages e result.meta.page

    } else {
      console.error("Erro ao carregar feed:", result.message);
      alert("Erro ao carregar o feed de reclamações.");
    }
  } catch (error) {
    console.error("Erro de rede ao carregar feed:", error);
    alert("Erro de conexão com o servidor ao carregar o feed.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Carrega o feed inicial
  loadFeed();

  // Event listener para o botão de filtro
  document.getElementById("btn-filtrar").addEventListener("click", function () {
    const categoriaFiltro = document.getElementById("categoria").value;
    const universidadeFiltro = document.getElementById("universidade").value;

    loadFeed({
      category: categoriaFiltro,
      universityId: universidadeFiltro
    });
  });

  // Event listener para os botões de interação (Upvote/Apoio)
  // Este código é mantido, mas a lógica de persistência deve ser implementada no backend
  document.querySelectorAll(".btn-icon").forEach(button => {
    button.addEventListener("click", () => {
      // Seleciona o contador relacionado (próximo elemento com a classe .contador)
      const contador = button.nextElementSibling;
      let valorAtual = parseInt(contador.textContent);
      contador.textContent = valorAtual + 1;

      // Animação de clique
      button.style.transform = "scale(1.5)";
      button.style.transition = "transform 0.2s";

      setTimeout(() => {
        button.style.transform = "scale(1.2)"; // retorna para tamanho normal
      }, 200);

      // Opcional: marca o botão como já clicado
      button.disabled = true;
      button.style.cursor = "not-allowed";
      button.style.color = "#007b8a"; // muda cor para indicar ação
    });
  });
});