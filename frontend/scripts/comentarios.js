document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reclamacaoId = urlParams.get("id");
    // Token is stored in HttpOnly cookie; use isAuthenticated() to check session

    if (!reclamacaoId) {
        alert("ID da reclamação não fornecido.");
        window.location.href = "telafeed.html";
        return;
    }

    // Carregar dados da reclamação
    await loadReclamacao(reclamacaoId);

    // Carregar comentários
    await loadComentarios(reclamacaoId);

    // Configurar formulário de novo comentário com validação visual (TB4)
    const formComentario = document.getElementById("form-comentario");
    if (formComentario && window.FormValidator) {
        window.FormValidator.attach('#form-comentario', {
            fields: {
                'texto-comentario': {
                    label: 'Comentário',
                    required: true,
                    minLength: 2,
                    maxLength: 1000
                }
            },
            onSubmit: async (values) => {
                const userStr = sessionStorage.getItem("user");
                if (!userStr) {
                    alert("Você precisa estar logado para comentar.");
                    window.location.href = "login.html";
                    return;
                }

                const submitBtn = formComentario.querySelector('button[type="submit"]');
                const oldText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';

                try {
                    const response = await window.fetchWithAuth(`${window.API_BASE_URL}/interactions/comentarios`, {
                        method: "POST",
                        body: JSON.stringify({
                            texto: values['texto-comentario'].trim(),
                            reclamacaoId: parseInt(reclamacaoId)
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        document.getElementById("texto-comentario").value = "";
                        document.getElementById("texto-comentario").classList.remove('is-valid', 'is-invalid');
                        setTimeout(async () => {
                            try {
                                await loadComentarios(reclamacaoId);
                            } catch (reloadError) {
                                console.error("Erro ao recarregar comentários:", reloadError);
                            }
                        }, 300);
                    } else {
                        alert(result.message || "Erro ao criar comentário.");
                    }
                } catch (error) {
                    console.error("Erro ao criar comentário:", error);
                    alert("Erro de conexão com o servidor.");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = oldText;
                }
            }
        });
    }

    // Event listener para likes em comentários e botão de excluir
    document.addEventListener("click", async (e) => {
        // Like em comentário
        if (e.target.classList.contains("btn-like-comentario") || e.target.closest(".btn-like-comentario")) {
            const button = e.target.classList.contains("btn-like-comentario") ? e.target : e.target.closest(".btn-like-comentario");
            const comentarioId = button.getAttribute("data-comentario-id");

            if (!(await window.isAuthenticated())) {
                alert("Você precisa estar logado para dar like.");
                return;
            }

            if (!comentarioId) return;

            try {
                const response = await window.fetchWithAuth(`${window.API_BASE_URL}/interactions/likes/comentario`, {
                    method: "POST",
                    body: JSON.stringify({ comentarioId: parseInt(comentarioId) })
                });

                const result = await response.json();

                if (response.ok) {
                    const likesCountSpan = button.nextElementSibling;
                    if (likesCountSpan && likesCountSpan.classList.contains("likes-count-comentario")) {
                        likesCountSpan.textContent = result.data.count;
                    }

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

        // Excluir comentário
        if (e.target.classList.contains("btn-excluir-comentario")) {
            const comentarioId = e.target.getAttribute("data-comentario-id");

            if (!confirm("Tem certeza que deseja excluir este comentário?")) {
                return;
            }

            if (!(await window.isAuthenticated())) {
                alert("Você precisa estar logado.");
                return;
            }

            try {
                const response = await window.fetchWithAuth(`${window.API_BASE_URL}/interactions/comentarios/${comentarioId}`, {
                    method: "DELETE"
                });

                const result = await response.json();

                if (response.ok) {
                    // Recarregar comentários após excluir
                    setTimeout(async () => {
                        try {
                            await loadComentarios(reclamacaoId);
                        } catch (e) {
                            console.error("Erro ao recarregar após excluir:", e);
                        }
                    }, 300);
                } else {
                    alert(result.message || "Erro ao excluir comentário.");
                }
            } catch (error) {
                console.error("Erro ao excluir comentário:", error);
                alert("Erro de conexão com o servidor.");
            }
        }
    });
});

async function loadReclamacao(id) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/complaints/${id}`);
        const result = await response.json();

        if (response.ok && result.data) {
            const reclamacao = result.data;
            const reclamacaoArea = document.querySelector(".comentario-area");

            if (reclamacaoArea) {
                reclamacaoArea.innerHTML = `
                    <h4>${reclamacao.titulo}</h4>
                    <p class="text-muted">${reclamacao.descricao}</p>
                    <small class="text-muted">Por: <strong>${reclamacao.aluno?.nome || 'Usuário'}</strong></small>
                `;
            }

            // Ocultar botão de nova reclamação e form de comentário se universidade
            const userType = sessionStorage.getItem('userType');
            if (userType === 'universidade') {
                const areaNovaReclamacao = document.getElementById('area-nova-reclamacao');
                if (areaNovaReclamacao) areaNovaReclamacao.style.display = 'none';

                const userStr = sessionStorage.getItem('user');
                let userId = null;
                if (userStr) {
                    try {
                        const userObj = JSON.parse(userStr);
                        userId = userObj.id;
                    } catch (e) { }
                }

                const univIdDaReclamacao = reclamacao.universidadeId || reclamacao.universidade_id;

                if (userId !== univIdDaReclamacao) {
                    const areaAddComentario = document.getElementById('area-adicionar-comentario');
                    if (areaAddComentario) areaAddComentario.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error("Erro ao carregar reclamação:", error);
    }
}

async function loadComentarios(reclamacaoId) {
    const user = getCurrentUser();
    const currentUserId = user ? user.id : null;

    try {
        const response = await fetch(`${window.API_BASE_URL}/interactions/comentarios/reclamacao/${reclamacaoId}`, {
            credentials: "include"
        });
        const result = await response.json();

        const comentariosContainer = document.getElementById("comentarios-container");
        if (!comentariosContainer) {
            console.error("Container de comentários não encontrado");
            return;
        }

        if (response.ok && result.data) {
            comentariosContainer.innerHTML = "";

            if (result.data.length === 0) {
                comentariosContainer.innerHTML = "<p class='text-muted'>Nenhum comentário ainda. Seja o primeiro a comentar!</p>";
                return;
            }

            // Ordenar comentários por data (mais recentes primeiro)
            const comentariosOrdenados = [...result.data].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            comentariosOrdenados.forEach(comentario => {
                const comentarioDiv = document.createElement("div");
                comentarioDiv.className = "comentario";

                const date = new Date(comentario.createdAt).toLocaleDateString('pt-BR');
                let autorNome = 'Anônimo';
                if (comentario.autor) {
                    autorNome = comentario.autor.nome;
                } else if (comentario.universidade) {
                    autorNome = `${comentario.universidade.nome} (${comentario.universidade.sigla}) - Resposta Oficial`;
                }

                const userType = sessionStorage.getItem('userType') || 'aluno';
                const isAutor = currentUserId && (
                    (userType === 'aluno' && comentario.autorId === currentUserId) ||
                    (userType === 'universidade' && comentario.universidadeId === currentUserId)
                );

                const likesCount = comentario.likesCount || 0;
                const userLiked = comentario.userLiked || false;

                comentarioDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <span class="autor">${autorNome}</span>
                            <span class="data">${date}</span>
                            <p class="conteudo mt-2">${comentario.texto}</p>
                        </div>
                        ${isAutor ? `<button class="btn btn-sm btn-danger btn-excluir-comentario" data-comentario-id="${comentario.id}">Excluir</button>` : ''}
                    </div>
                    <div class="d-flex align-items-center mt-2">
                        <button class="btn-like-comentario btn-icon ${userLiked ? 'liked' : ''}" 
                                data-comentario-id="${comentario.id}" 
                                data-liked="${userLiked}">
                            ${userLiked ? '❤️' : '🤍'}
                        </button>
                        <span class="likes-count-comentario ms-1">${likesCount}</span>
                    </div>
                `;
                comentariosContainer.appendChild(comentarioDiv);
            });
        } else {
            comentariosContainer.innerHTML = "<p class='text-muted'>Erro ao carregar comentários.</p>";
        }
    } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        const comentariosContainer = document.getElementById("comentarios-container");
        if (comentariosContainer) {
            comentariosContainer.innerHTML = "<p class='text-muted'>Erro de conexão com o servidor.</p>";
        }
    }
}