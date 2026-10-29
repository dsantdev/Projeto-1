// ============================================================
// Gerenciador de Tarefas
// Ciclo principal: alterar o array -> salvar -> redesenhar a tela
// ============================================================

// ---------- Constantes ----------
const CHAVE_STORAGE = "gerenciador-tarefas";

// ---------- Elementos da página ----------
const formTarefa = document.getElementById("form-tarefa");
const campoDescricao = document.getElementById("descricao");
const campoCategoria = document.getElementById("categoria");
const campoPrioridade = document.getElementById("prioridade");
const campoData = document.getElementById("data");
const mensagemErro = document.getElementById("mensagem-erro");

const totalTarefas = document.getElementById("total-tarefas");
const totalPendentes = document.getElementById("total-pendentes");
const totalConcluidas = document.getElementById("total-concluidas");

const filtroSituacao = document.getElementById("filtro-situacao");
const filtroCategoria = document.getElementById("filtro-categoria");

const listaTarefas = document.getElementById("lista-tarefas");

// ---------- Dados ----------
// Cada tarefa: { id, descricao, categoria, prioridade, data, concluida }
let tarefas = [];

// ============================================================
// Armazenamento (localStorage)
// ============================================================

// Salva o array no navegador, convertido em texto (JSON)
function salvarTarefas() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(tarefas));
}

// Lê o texto salvo e converte de volta para array
function carregarTarefas() {
  const textoSalvo = localStorage.getItem(CHAVE_STORAGE);

  if (!textoSalvo) {
    return [];
  }

  try {
    return JSON.parse(textoSalvo);
  } catch (erro) {
    // Se o conteúdo estiver corrompido, começa do zero
    return [];
  }
}

// ============================================================
// Validação
// ============================================================

// Retorna uma mensagem de erro ou, se estiver tudo certo, uma string vazia
function validarFormulario() {
  if (campoDescricao.value.trim() === "") {
    return "Informe a descrição da tarefa.";
  }
  if (campoCategoria.value === "") {
    return "Selecione uma categoria.";
  }
  if (campoPrioridade.value === "") {
    return "Selecione uma prioridade.";
  }
  if (campoData.value === "") {
    return "Informe a data de conclusão.";
  }
  return "";
}

// ============================================================
// Ações sobre as tarefas
// ============================================================

function adicionarTarefa() {
  const novaTarefa = {
    id: Date.now(), // número único para identificar a tarefa
    descricao: campoDescricao.value.trim(),
    categoria: campoCategoria.value,
    prioridade: campoPrioridade.value,
    data: campoData.value, // formato AAAA-MM-DD
    concluida: false // toda tarefa nova começa pendente
  };

  tarefas.push(novaTarefa);
  atualizarTela();
}

function alternarConclusao(id) {
  for (const tarefa of tarefas) {
    if (tarefa.id === id) {
      tarefa.concluida = !tarefa.concluida;
    }
  }
  atualizarTela();
}

function excluirTarefa(id) {
  const confirmou = confirm("Deseja realmente excluir esta tarefa?");

  if (!confirmou) {
    return;
  }

  tarefas = tarefas.filter(function (tarefa) {
    return tarefa.id !== id;
  });
  atualizarTela();
}

// ============================================================
// Filtros (afetam só a visualização, nunca o array original)
// ============================================================

function filtrarTarefas() {
  const situacao = filtroSituacao.value;
  const categoria = filtroCategoria.value;

  return tarefas.filter(function (tarefa) {
    const passaSituacao =
      situacao === "todas" ||
      (situacao === "pendentes" && !tarefa.concluida) ||
      (situacao === "concluidas" && tarefa.concluida);

    const passaCategoria =
      categoria === "todas" || tarefa.categoria === categoria;

    return passaSituacao && passaCategoria;
  });
}

// ============================================================
// Exibição
// ============================================================

// Converte AAAA-MM-DD em DD/MM/AAAA
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return dia + "/" + mes + "/" + ano;
}

// Cria um elemento com texto e classe (evita repetição)
function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  if (classe) {
    elemento.className = classe;
  }
  return elemento;
}

// Monta o elemento HTML de uma tarefa
function criarElementoTarefa(tarefa) {
  const item = document.createElement("article");
  item.className = "tarefa";

  // Classes que o CSS pode usar para estilizar
  item.classList.add("prioridade-" + semAcento(tarefa.prioridade));
  if (tarefa.concluida) {
    item.classList.add("concluida");
  }

  item.appendChild(criarElemento("h3", tarefa.descricao, "tarefa-descricao"));
  item.appendChild(criarElemento("p", tarefa.categoria, "tarefa-categoria"));
  item.appendChild(
    criarElemento("p", "Prioridade: " + tarefa.prioridade, "tarefa-prioridade")
  );
  item.appendChild(
    criarElemento("p", "Prazo: " + formatarData(tarefa.data), "tarefa-data")
  );
  item.appendChild(
    criarElemento(
      "p",
      tarefa.concluida ? "Concluída" : "Pendente",
      "tarefa-situacao"
    )
  );

  // Botões (o data-id e o data-acao dizem ao evento o que fazer)
  const botaoConcluir = criarElemento(
    "button",
    tarefa.concluida ? "Desfazer" : "Concluir",
    "botao-concluir"
  );
  botaoConcluir.type = "button";
  botaoConcluir.dataset.acao = "concluir";
  botaoConcluir.dataset.id = tarefa.id;

  const botaoExcluir = criarElemento("button", "Excluir", "botao-excluir");
  botaoExcluir.type = "button";
  botaoExcluir.dataset.acao = "excluir";
  botaoExcluir.dataset.id = tarefa.id;

  item.appendChild(botaoConcluir);
  item.appendChild(botaoExcluir);

  return item;
}

// Remove acentos para gerar nomes de classe (Média -> media)
function semAcento(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Desenha a lista de tarefas na tela
function exibirTarefas() {
  listaTarefas.innerHTML = "";

  // Nenhuma tarefa cadastrada
  if (tarefas.length === 0) {
    listaTarefas.appendChild(
      criarElemento(
        "p",
        "Nenhuma tarefa cadastrada. Adicione uma tarefa para começar!",
        "mensagem-vazia"
      )
    );
    return;
  }

  const tarefasFiltradas = filtrarTarefas();

  // Existem tarefas, mas nenhuma passa pelos filtros
  if (tarefasFiltradas.length === 0) {
    listaTarefas.appendChild(
      criarElemento(
        "p",
        "Nenhuma tarefa encontrada com os filtros selecionados.",
        "mensagem-vazia"
      )
    );
    return;
  }

  for (const tarefa of tarefasFiltradas) {
    listaTarefas.appendChild(criarElementoTarefa(tarefa));
  }
}

// Os indicadores sempre contam o array completo, sem considerar filtros
function atualizarIndicadores() {
  const concluidas = tarefas.filter(function (tarefa) {
    return tarefa.concluida;
  }).length;

  totalTarefas.textContent = tarefas.length;
  totalConcluidas.textContent = concluidas;
  totalPendentes.textContent = tarefas.length - concluidas;
}

// Reúne tudo o que muda após uma alteração nos dados
function atualizarTela() {
  salvarTarefas();
  exibirTarefas();
  atualizarIndicadores();
}

// ============================================================
// Eventos
// ============================================================

// Envio do formulário
formTarefa.addEventListener("submit", function (evento) {
  evento.preventDefault(); // impede o recarregamento da página

  const erro = validarFormulario();

  if (erro !== "") {
    mensagemErro.textContent = erro;
    return;
  }

  mensagemErro.textContent = "";
  adicionarTarefa();
  formTarefa.reset();
});

// Limpa a mensagem de erro quando o usuário corrige algum campo
formTarefa.addEventListener("input", function () {
  mensagemErro.textContent = "";
});

// Cliques nos botões de cada tarefa (um único evento na lista inteira)
listaTarefas.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button");

  if (!botao) {
    return;
  }

  const id = Number(botao.dataset.id);

  if (botao.dataset.acao === "concluir") {
    alternarConclusao(id);
  } else if (botao.dataset.acao === "excluir") {
    excluirTarefa(id);
  }
});

// Mudança nos filtros: só redesenha a lista
filtroSituacao.addEventListener("change", exibirTarefas);
filtroCategoria.addEventListener("change", exibirTarefas);

// ============================================================
// Inicialização
// ============================================================

tarefas = carregarTarefas();
exibirTarefas();
atualizarIndicadores();