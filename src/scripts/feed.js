

function voltarPagina() {
   window.location.href = "telaprincipal.html";;
}



document.getElementById("btn-filtrar").addEventListener("click", function () {
  const categoriaFiltro = document.getElementById("categoria").value;
  const universidadeFiltro = document.getElementById("universidade").value;

  const cards = document.querySelectorAll("main .card");

  cards.forEach(card => {
    const categoria = card.getAttribute("data-categoria");
    const universidade = card.getAttribute("data-universidade");

    let mostrar = true;

    if (categoriaFiltro !== "Todos" && categoria !== categoriaFiltro) {
      mostrar = false;
    }

    if (universidadeFiltro !== "Todas" && universidade !== universidadeFiltro) {
      mostrar = false;
    }

    card.style.display = mostrar ? "block" : "none";
  });
});

// ========= AUMENTAR SETA E CONTADOR =========
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
