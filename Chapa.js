const formulario = document.getElementById("formulario");
const campoNome = document.getElementById("nomeEstudante");
const campoCodigo = document.getElementById("codigoEleitor");
const campoNumero = document.getElementById("numeroCandidato");
const mensagem = document.getElementById("mensagem");
const erroNome = document.getElementById("erroNome");
const erroCodigo = document.getElementById("erroCodigo");
const erroChapa = document.getElementById("erroChapa");
const erroGeral = document.getElementById("erroGeral");
const etapaIdentificacao = document.getElementById("etapaIdentificacao");
const etapaEscolha = document.getElementById("etapaEscolha");
const botaoContinuar = document.getElementById("continuarVotacao");
const botaoVoltar = document.getElementById("voltarIdentificacao");
const revisaoVoto = document.getElementById("revisaoVoto");
const nomeEstudanteEscolhido = document.getElementById("nomeEstudanteEscolhido");
const codigoEstudanteEscolhido = document.getElementById("codigoEstudanteEscolhido");
const chapaEscolhida = document.getElementById("chapaEscolhida");
const confirmacaoDados = document.getElementById("confirmacaoDados");
const botaoConfirmar = document.getElementById("confirmarVoto");
const botaoCorrigirIdentificacao = document.getElementById("corrigirIdentificacao");
const botaoAlterar = document.getElementById("alterarVoto");

const chapas = {
  "10": { nome: "Inovação" },
  "20": { nome: "Futuro" },
  "30": { nome: "Transformação" }
};

const chaveArmazenamento = "urnaEscolar.estado.v1";
const numerosChapas = Object.keys(chapas);
const estado = {
  votos: Object.fromEntries(numerosChapas.map((numero) => [numero, 0])),
  totalVotos: 0,
  codigosEleitores: [],
  registrosVotacao: []
};
let votoPendente = null;
let codigoEleitorPendente = null;
let nomeEstudantePendente = null;
let sistemaDisponivel = true;

function limparErroCampo(campo, elementoErro) {
  campo.removeAttribute("aria-invalid");
  elementoErro.textContent = "";
  elementoErro.hidden = true;
  erroGeral.textContent = "";
}

function mostrarErroCampo(campo, elementoErro, texto) {
  campo.setAttribute("aria-invalid", "true");
  elementoErro.textContent = texto;
  elementoErro.hidden = false;
  campo.focus();
}

function estadoValido(dados) {
  const codigosEleitores = dados?.codigosEleitores ?? dados?.alunosQueVotaram;
  const registrosVotacao = dados?.registrosVotacao ?? [];
  if (!dados || typeof dados !== "object" || !dados.votos ||
      !Number.isSafeInteger(dados.totalVotos) || dados.totalVotos < 0 ||
      !Array.isArray(codigosEleitores) || !Array.isArray(registrosVotacao)) {
    return false;
  }

  const chavesVotos = Object.keys(dados.votos);
  const votosValidos = chavesVotos.length === numerosChapas.length &&
    numerosChapas.every((numero) =>
      Number.isSafeInteger(dados.votos[numero]) && dados.votos[numero] >= 0
    );
  const somaVotos = votosValidos
    ? numerosChapas.reduce((total, numero) => total + dados.votos[numero], 0)
    : -1;
  const codigosUnicos = new Set(codigosEleitores);
  const codigosComRegistro = new Set();
  const registrosValidos = registrosVotacao.every((registro) => {
    if (!registro || typeof registro.codigo !== "string" ||
        !/^[A-Z0-9]{7}$/.test(registro.codigo) ||
        typeof registro.nome !== "string" || !registro.nome.trim() ||
        !chapas[registro.candidato] ||
        registro.confirmado !== true || codigosComRegistro.has(registro.codigo)) {
      return false;
    }

    codigosComRegistro.add(registro.codigo);
    return codigosEleitores.includes(registro.codigo);
  });

  return votosValidos &&
    somaVotos === dados.totalVotos &&
    codigosEleitores.length === dados.totalVotos &&
    codigosEleitores.every((codigo) => typeof codigo === "string" && codigo.length > 0) &&
    codigosUnicos.size === codigosEleitores.length &&
    registrosValidos;
}

try {
  const dadosSalvos = localStorage.getItem(chaveArmazenamento);
  if (dadosSalvos !== null) {
    const estadoSalvo = JSON.parse(dadosSalvos);
    if (!estadoValido(estadoSalvo)) {
      throw new Error("Os dados salvos da votação são inválidos.");
    }

    estado.votos = estadoSalvo.votos;
    estado.totalVotos = estadoSalvo.totalVotos;
    estado.codigosEleitores = estadoSalvo.codigosEleitores ?? estadoSalvo.alunosQueVotaram;
    estado.registrosVotacao = estadoSalvo.registrosVotacao ?? [];
  }
} catch (erro) {
  sistemaDisponivel = false;
  formulario.hidden = true;
  revisaoVoto.hidden = true;
  erroGeral.textContent = "Não foi possível carregar os votos salvos. A votação foi bloqueada para evitar perda de dados; peça ajuda ao responsável.";
  console.error("Falha ao carregar os dados da votação.", erro);
}

campoNome.addEventListener("input", () => limparErroCampo(campoNome, erroNome));
campoCodigo.addEventListener("input", () => limparErroCampo(campoCodigo, erroCodigo));
campoNumero.addEventListener("change", () => limparErroCampo(campoNumero, erroChapa));
confirmacaoDados.addEventListener("change", () => {
  confirmacaoDados.removeAttribute("aria-invalid");
  erroGeral.textContent = "";
});

botaoContinuar.addEventListener("click", () => {
  if (!sistemaDisponivel) {
    return;
  }

  const nomeEstudante = campoNome.value.trim().replace(/\s+/g, " ");
  if (!nomeEstudante) {
    mostrarErroCampo(campoNome, erroNome, "Digite o nome do estudante para continuar.");
    return;
  }

  const codigoEleitor = campoCodigo.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{7}$/.test(codigoEleitor)) {
    mostrarErroCampo(
      campoCodigo,
      erroCodigo,
      "Código inválido. Digite exatamente 7 caracteres usando somente letras e números, sem espaços ou símbolos."
    );
    return;
  }

  if (estado.codigosEleitores.includes(codigoEleitor)) {
    mostrarErroCampo(
      campoCodigo,
      erroCodigo,
      "Este código já foi usado para votar neste navegador. Confira se digitou o código correto; se precisar, peça ajuda ao responsável pela votação."
    );
    return;
  }

  limparErroCampo(campoNome, erroNome);
  limparErroCampo(campoCodigo, erroCodigo);
  nomeEstudantePendente = nomeEstudante;
  codigoEleitorPendente = codigoEleitor;
  campoNome.disabled = true;
  campoCodigo.disabled = true;
  campoNumero.disabled = false;
  etapaIdentificacao.hidden = true;
  etapaEscolha.hidden = false;
  mensagem.textContent = "Etapa 2 de 2: selecione a chapa em que deseja votar.";
  campoNumero.focus();
});

botaoVoltar.addEventListener("click", () => {
  codigoEleitorPendente = null;
  etapaEscolha.hidden = true;
  etapaIdentificacao.hidden = false;
  campoNome.disabled = false;
  campoCodigo.disabled = false;
  campoNumero.disabled = true;
  mensagem.textContent = "Etapa 1 de 2: confira seu código de estudante.";
  campoCodigo.focus();
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!sistemaDisponivel) {
    return;
  }

  if (!codigoEleitorPendente || !nomeEstudantePendente) {
    etapaEscolha.hidden = true;
    etapaIdentificacao.hidden = false;
    campoNome.disabled = false;
    campoCodigo.disabled = false;
    campoNumero.disabled = true;
    mensagem.textContent = "Informe seu código de estudante para continuar.";
    campoCodigo.focus();
    return;
  }

  const numero = campoNumero.value;
  const chapa = chapas[numero];

  if (!chapa) {
    mostrarErroCampo(campoNumero, erroChapa, "Selecione uma das chapas listadas: Inovação (10), Futuro (20) ou Transformação (30).");
    return;
  }

  limparErroCampo(campoCodigo, erroCodigo);
  limparErroCampo(campoNumero, erroChapa);
  votoPendente = {
    numero,
    codigo: codigoEleitorPendente,
    nome: nomeEstudantePendente
  };
  nomeEstudanteEscolhido.textContent = nomeEstudantePendente;
  codigoEstudanteEscolhido.textContent = codigoEleitorPendente;
  chapaEscolhida.textContent = `${chapa.nome} (${numero})`;
  confirmacaoDados.checked = false;
  confirmacaoDados.removeAttribute("aria-invalid");
  formulario.hidden = true;
  revisaoVoto.hidden = false;
  mensagem.textContent = "Confira seu nome, seu código e a chapa. Marque a confirmação para registrar o voto.";
  botaoConfirmar.focus();
});

botaoConfirmar.addEventListener("click", () => {
  if (!sistemaDisponivel || !votoPendente) {
    return;
  }

  if (!confirmacaoDados.checked) {
    confirmacaoDados.setAttribute("aria-invalid", "true");
    erroGeral.textContent = "Confira o nome e o código exibidos e marque a confirmação antes de registrar o voto.";
    confirmacaoDados.focus();
    return;
  }

  const { numero, codigo, nome } = votoPendente;
  const chapa = chapas[numero];
  const registroVotacao = { codigo, nome, candidato: numero, confirmado: true };
  const novoEstado = {
    votos: { ...estado.votos, [numero]: estado.votos[numero] + 1 },
    totalVotos: estado.totalVotos + 1,
    codigosEleitores: [...estado.codigosEleitores, codigo],
    registrosVotacao: [...estado.registrosVotacao, registroVotacao]
  };

  try {
    localStorage.setItem(chaveArmazenamento, JSON.stringify(novoEstado));
  } catch (erro) {
    erroGeral.textContent = "Não foi possível salvar o voto, então ele não foi registrado. Sua escolha continua na revisão; tente confirmar novamente ou peça ajuda ao responsável.";
    console.error("Falha ao salvar o voto.", erro);
    return;
  }

  erroGeral.textContent = "";
  estado.votos = novoEstado.votos;
  estado.totalVotos = novoEstado.totalVotos;
  estado.codigosEleitores = novoEstado.codigosEleitores;
  estado.registrosVotacao = novoEstado.registrosVotacao;
  mensagem.textContent = `Voto registrado para ${chapa.nome} e salvo neste navegador. FIM DE VOTAÇÃO.`;

  votoPendente = null;
  codigoEleitorPendente = null;
  nomeEstudantePendente = null;
  revisaoVoto.hidden = true;
  formulario.hidden = false;
  etapaEscolha.hidden = true;
  etapaIdentificacao.hidden = false;
  campoNome.disabled = false;
  campoCodigo.disabled = false;
  campoNumero.disabled = true;
  formulario.reset();
  campoCodigo.focus();
});

botaoAlterar.addEventListener("click", () => {
  votoPendente = null;
  confirmacaoDados.checked = false;
  erroGeral.textContent = "";
  etapaEscolha.hidden = false;
  revisaoVoto.hidden = true;
  formulario.hidden = false;
  mensagem.textContent = "Altere sua escolha e confirme novamente.";
  campoNumero.focus();
});

botaoCorrigirIdentificacao.addEventListener("click", () => {
  votoPendente = null;
  codigoEleitorPendente = null;
  nomeEstudantePendente = null;
  confirmacaoDados.checked = false;
  erroGeral.textContent = "";
  revisaoVoto.hidden = true;
  formulario.hidden = false;
  etapaEscolha.hidden = true;
  etapaIdentificacao.hidden = false;
  campoNome.disabled = false;
  campoCodigo.disabled = false;
  campoNumero.disabled = true;
  mensagem.textContent = "Corrija seu nome ou código de estudante antes de continuar.";
  campoNome.focus();
});
