const API_BASE_URL = "http://localhost:3000"; // Assumindo que o Gateway está na porta 3000
const feedContainer = document.querySelector("main.container");
const statusGeralElement = document.querySelector(".status-geral");

function voltarPagina() {
  window.location.href = "telaprincipal.html";
}

async function updateTotalComplaints() {
  if (!statusGeralElement) return;
  
  try {
    // Buscar o feed sem filtros para obter o total de reclamações
    const response = await fetch(`${API_BASE_URL}/complaints/feed?page=1&limit=1`);
    const result = await response.json();
    
    if (response.ok && result.meta && result.meta.total !== undefined) {
      const total = result.meta.total;
      statusGeralElement.textContent = `Plataforma ativa · ${total} reclamação${total !== 1 ? 'ões' : ''} pública${total !== 1 ? 's' : ''}`;
    } else {
      // Fallback caso não consiga obter o total
      statusGeralElement.textContent = "Plataforma ativa · Carregando...";
    }
  } catch (error) {
    console.error("Erro ao carregar total de reclamações:", error);
    statusGeralElement.textContent = "Plataforma ativa · Carregando...";
  }
}

async function loadUniversidadesForFilter() {
  const selectUniversidade = document.getElementById("universidade");
  const selectCampus = document.getElementById("campus");
  if (!selectUniversidade || !selectCampus) return;

  try {
    const response = await fetch(`${API_BASE_URL}/universidades`);
    const universidades = await response.json();

    // Limpar opções existentes (exceto "Todas")
    selectUniversidade.innerHTML = '<option value="Todas" selected>Todas</option>';

    // Adicionar universidades do banco
    universidades.forEach(univ => {
      const option = document.createElement("option");
      option.value = univ.sigla;
      option.textContent = `${univ.sigla} - ${univ.nome}`;
      option.dataset.campus = univ.campus || '';
      selectUniversidade.appendChild(option);
    });
    
    // Carregar todos os campus únicos
    const campusUnicos = [...new Set(universidades.map(u => u.campus).filter(c => c))];
    selectCampus.innerHTML = '<option value="Todos" selected>Todos</option>';
    campusUnicos.forEach(campus => {
      const option = document.createElement("option");
      option.value = campus;
      option.textContent = campus;
      selectCampus.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar universidades para filtro:", error);
    // Manter opções padrão se falhar
  }
}

function createComplaintCard(complaint) {
  const card = document.createElement("div");
  card.className = "card p-3 mb-3";
  card.setAttribute("data-categoria", complaint.categoria);
  // Usar o nome da universidade se disponível, senão usar o ID
  const universidadeDisplay = complaint.universidade_nome || `@${complaint.universidade_id}`;
  card.setAttribute("data-universidade", `@${complaint.universidade_id}`);
  const campus = complaint.campus || '';
  if (campus) {
    card.setAttribute("data-campus", campus);
  }

  const date = new Date(complaint.data_criacao).toLocaleDateString('pt-BR');
  const comentariosCount = complaint.comentarios_count || 0;

  const alunoNome = complaint.aluno_nome || 'Usuário';
  const likesCount = complaint.likes_count || 0;
  const userLiked = complaint.user_liked || false;

  card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h5 class="mb-1">${complaint.titulo}</h5>
                <small class="text-muted">Por: <strong>${alunoNome}</strong></small><br>
                <span class="categoria">${complaint.categoria}</span> ·
                <span class="universidade">${universidadeDisplay}</span>${campus ? ` · <span class="campus">${campus}</span>` : ''}
            </div>
            <small class="text-muted">${date}</small>
        </div>
        <p class="mt-2 mb-2">${complaint.descricao}</p>
        <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
            <div class="d-flex align-items-center">
                <button class="btn-like btn-icon ${userLiked ? 'liked' : ''}" data-complaint-id="${complaint.id}" data-liked="${userLiked}">
                    ${userLiked ? '❤️' : '🤍'}
                </button>
                <span class="likes-count">${likesCount}</span>
            </div>
            <a href="telacomentarios.html?id=${complaint.id}" class="comentarios">💬 ${comentariosCount} comentário${comentariosCount !== 1 ? 's' : ''}</a>
        </div>
    `;
  return card;
}

async function loadFeed(filters = {}) {
  // Verificar se o container existe
  if (!feedContainer) {
    console.error("Container do feed não encontrado");
    return;
  }

  // Remove todos os elementos dinâmicos (cards, mensagens, títulos de categoria)
  // Mantém apenas os elementos de filtro e o botão de voltar
  const elementsToRemove = feedContainer.querySelectorAll(
    ".card, .categoria-titulo, .no-data-message"
  );
  elementsToRemove.forEach(el => {
    // Verificar se não está dentro da área de filtros antes de remover
    if (!el.closest(".filtro-area")) {
      el.remove();
    }
  });
  
  // Também remover qualquer parágrafo que seja mensagem de "sem dados"
  const allParagraphs = feedContainer.querySelectorAll("p");
  allParagraphs.forEach(p => {
    if (p.classList.contains("no-data-message") || 
        (p.textContent.includes("Nenhuma reclamação") && !p.closest(".filtro-area"))) {
      p.remove();
    }
  });

  const { category, universityId, campus, page = 1, limit = 10 } = filters;

  let url = `${API_BASE_URL}/complaints/feed?page=${page}&limit=${limit}`;
  if (category && category !== "Todos") {
    url += `&category=${category}`;
  }
  if (universityId && universityId !== "Todas") {
    // Se for um número (ID), usar diretamente, senão remover @ e enviar sigla
    const universityIdClean = universityId.toString().replace('@', '');
    url += `&universityId=${universityIdClean}`;
  }
  if (campus && campus !== "Todos") {
    url += `&campus=${encodeURIComponent(campus)}`;
  }

  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    const result = await response.json();

    if (response.ok && result.data) {
      const complaints = result.data;
      if (complaints.length === 0) {
        // Remover qualquer mensagem anterior antes de adicionar nova
        const existingMessages = feedContainer.querySelectorAll(".no-data-message");
        existingMessages.forEach(msg => msg.remove());
        
        const noData = document.createElement("p");
        noData.className = "no-data-message";
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
      console.error("Erro ao carregar feed:", result.message || result.error || "Erro desconhecido");
      console.error("Resposta completa:", result);
      alert(`Erro ao carregar o feed de reclamações: ${result.message || result.error || "Erro desconhecido"}`);
    }
  } catch (error) {
    console.error("Erro de rede ao carregar feed:", error);
    alert("Erro de conexão com o servidor ao carregar o feed.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Atualizar contagem total de reclamações
  await updateTotalComplaints();
  
  // Carregar universidades para o filtro
  await loadUniversidadesForFilter();
  
  // Limpar elementos estáticos do HTML antes de carregar o feed
  const staticElements = feedContainer.querySelectorAll(".card, .categoria-titulo");
  staticElements.forEach(el => {
    if (!el.closest(".filtro-area")) {
      el.remove();
    }
  });
  
  // Carrega o feed inicial
  loadFeed();

  // Event listener para o botão de filtro
  const btnFiltrar = document.getElementById("btn-filtrar");
  if (btnFiltrar) {
    btnFiltrar.addEventListener("click", function () {
      const categoriaFiltro = document.getElementById("categoria")?.value || "Todos";
      const universidadeFiltro = document.getElementById("universidade")?.value || "Todas";
      const campusFiltro = document.getElementById("campus")?.value || "Todos";

      loadFeed({
        category: categoriaFiltro,
        universityId: universidadeFiltro,
        campus: campusFiltro
      });
    });
  }

  // Event listener para likes em reclamações
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-like") || e.target.closest(".btn-like")) {
      const button = e.target.classList.contains("btn-like") ? e.target : e.target.closest(".btn-like");
      const complaintId = button.getAttribute("data-complaint-id");
      const token = localStorage.getItem('token');

      if (!token) {
        alert("Você precisa estar logado para dar like.");
        return;
      }

      if (!complaintId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/interactions/likes/reclamacao`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ reclamacaoId: parseInt(complaintId) })
        });

        const result = await response.json();

        if (response.ok) {
          // Atualizar UI
          const likesCountSpan = button.nextElementSibling;
          if (likesCountSpan && likesCountSpan.classList.contains("likes-count")) {
            likesCountSpan.textContent = result.data.count;
          }

          // Atualizar botão
          const isLiked = result.data.liked;
          button.setAttribute("data-liked", isLiked);
          if (isLiked) {
            button.innerHTML = '❤️';
            button.classList.add("liked");
          } else {
            button.innerHTML = '🤍';
            button.classList.remove("liked");
          }
        } else {
          alert(result.message || "Erro ao dar like.");
        }
      } catch (error) {
        console.error("Erro ao dar like:", error);
        alert("Erro de conexão com o servidor.");
      }
    }
  });
});