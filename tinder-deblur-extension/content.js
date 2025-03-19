// Tinder Deblur - Content Script
// Este script é injetado em tinder.com para desembaçar as imagens

// Configuração da extensão
const CONFIG = {
  // Seletores CSS importantes
  seletores: {
    containerPreviewCurtidas: '.Expand.enterAnimationContainer > div:nth-child(1)' // Seletor das imagens embaçadas
  },
  // Tempos de espera para diversas operações
  atrasos: {
    carregamentoPagina: 2000, // 2 segundos após carregamento da página
    tentativaDesembacar: 1500, // 1,5 segundos entre tentativas
    verificacaoDOM: 1000 // 1 segundo para verificar mudanças na URL
  }
};

// Rastreador de elementos já processados
const processados = new Set();

// Utilitários para log e manipulação de elementos
const util = {
  log: (mensagem) => {
    console.log(`[Tinder Deblur] ${mensagem}`);
  },
  erro: (mensagem) => {
    console.error(`[Tinder Deblur] ${mensagem}`);
  },
  mostrarStatus: (mensagem, tipo = 'info') => {
    let statusEl = document.getElementById('tinder-deblur-status');

    // Criar elemento de status se não existir
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'tinder-deblur-status';
      statusEl.className = 'tinder-deblur-status';
      document.body.appendChild(statusEl);
    }

    // Definir cor com base no tipo
    if (tipo === 'success') {
      statusEl.style.backgroundColor = 'rgba(0, 150, 0, 0.7)';
    } else if (tipo === 'error') {
      statusEl.style.backgroundColor = 'rgba(200, 0, 0, 0.7)';
    } else {
      statusEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    }

    // Mostrar mensagem
    statusEl.textContent = mensagem;
    statusEl.classList.add('visible');

    // Esconder após 3 segundos
    setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 3000);
  },
  // Verifica se um elemento já foi processado
  foiProcessado: (elemento) => {
    // Criar um ID único baseado na posição do elemento e outras propriedades
    const id = elemento.offsetTop + '_' + elemento.offsetLeft + '_' +
               (elemento.getAttribute('data-user-id') || '') + '_' +
               (elemento.style.backgroundImage || '');

    // Verificar se este ID já está no conjunto de elementos processados
    if (processados.has(id)) {
      return true;
    }

    // Marcar como processado
    processados.add(id);
    return false;
  },
  // Limpar elementos processados para evitar vazamento de memória
  limparProcessados: () => {
    // Limitar o tamanho do conjunto para evitar vazamento de memória
    if (processados.size > 1000) {
      processados.clear();
    }
  }
};

// Função principal para desembaçar imagens
const desembacarImagens = async () => {
  try {
    util.log('Iniciando processo de desembaçamento...');
    util.mostrarStatus('Desembaçando fotos...', 'info');

    // Obter token de autenticação do localStorage
    const token = localStorage.getItem('TinderWeb/APIToken');
    if (!token) {
      const erro = 'Token de autenticação não encontrado. Por favor, faça login no Tinder.';
      util.erro(erro);
      util.mostrarStatus(erro, 'error');
      return { success: false, message: erro };
    }

    // Fazer requisição para obter os dados dos teasers (perfis que curtiram)
    const resposta = await fetch('https://api.gotinder.com/v2/fast-match/teasers', {
      headers: {
        'X-Auth-Token': token,
        'platform': 'android', // Importante para obter dados não filtrados
        'Content-Type': 'application/json'
      }
    });

    if (!resposta.ok) {
      const erro = `Erro na requisição: ${resposta.status} ${resposta.statusText}`;
      util.erro(erro);
      util.mostrarStatus(erro, 'error');
      return { success: false, message: erro };
    }

    const dados = await resposta.json();

    if (!dados || !dados.data || !dados.data.results || !Array.isArray(dados.data.results)) {
      const erro = 'Formato de dados inválido na resposta da API';
      util.erro(erro);
      util.mostrarStatus(erro, 'error');
      return { success: false, message: erro };
    }

    const teasers = dados.data.results;
    util.log(`Obtidos ${teasers.length} teasers da API`);

    // Esperar um momento para garantir que elementos DOM estejam prontos
    await new Promise(resolve => setTimeout(resolve, 500));

    // Buscar elementos DOM que contêm as imagens embaçadas
    const teaserEls = document.querySelectorAll(CONFIG.seletores.containerPreviewCurtidas);

    if (!teaserEls || teaserEls.length === 0) {
      const erro = 'Nenhum elemento encontrado para desembaçar. Verifique se você está na página de curtidas.';
      util.erro(erro);
      util.mostrarStatus(erro, 'error');
      return { success: false, message: erro };
    }

    util.log(`Encontrados ${teaserEls.length} elementos para desembaçar`);

    // Substituir imagens embaçadas pelas originais
    let contagemSucesso = 0;
    let contagemJaProcessados = 0;

    // Desembaçar apenas até o mínimo entre a quantidade de elementos DOM e de dados da API
    const qtdProcessar = Math.min(teaserEls.length, teasers.length);

    for (let i = 0; i < qtdProcessar; i++) {
      const teaser = teasers[i];
      const elemento = teaserEls[i];

      // Verificar se este elemento já foi processado
      if (util.foiProcessado(elemento)) {
        contagemJaProcessados++;
        util.log(`Elemento ${i} já foi processado anteriormente, pulando...`);
        continue;
      }

      // Verificar se já tem uma imagem não-embaçada
      const urlAtual = elemento.style.backgroundImage || '';
      if (urlAtual.includes('original_') && !urlAtual.includes('blur')) {
        util.log(`Elemento ${i} já tem imagem original, pulando...`);
        contagemJaProcessados++;
        continue;
      }

      // Verificando se tem dados de usuário válidos
      if (teaser && teaser.user && teaser.user._id && teaser.user.photos && teaser.user.photos.length > 0) {
        const userId = teaser.user._id;
        const photoId = teaser.user.photos[0].id;

        // Definir um atributo para rastrear o usuário
        elemento.setAttribute('data-user-id', userId);

        // Construir URL da imagem original
        const urlImagemOriginal = `https://preview.gotinder.com/${userId}/original_${photoId}.jpeg`;

        // Aplicar imagem original e remover filtro
        elemento.style.backgroundImage = `url("${urlImagemOriginal}")`;
        elemento.style.filter = 'none';
        contagemSucesso++;

        // Adicionar atributos com dados do usuário (opcional)
        if (teaser.user.name) {
          elemento.setAttribute('data-nome', teaser.user.name);
          // Adicionar tooltip com o nome do usuário
          elemento.title = teaser.user.name;
        }
      }
    }

    // Limpar conjunto de elementos processados periodicamente
    util.limparProcessados();

    let mensagemSucesso = '';
    if (contagemSucesso > 0) {
      mensagemSucesso = `Desembaçadas ${contagemSucesso} imagens com sucesso!`;
      util.log(mensagemSucesso);
      util.mostrarStatus(mensagemSucesso, 'success');
    } else if (contagemJaProcessados > 0) {
      mensagemSucesso = `Todas as ${contagemJaProcessados} imagens já estavam desembaçadas!`;
      util.log(mensagemSucesso);
      util.mostrarStatus(mensagemSucesso, 'success');
    } else {
      mensagemSucesso = 'Nenhuma nova imagem para desembaçar.';
      util.log(mensagemSucesso);
      util.mostrarStatus(mensagemSucesso, 'info');
    }

    return {
      success: true,
      count: contagemSucesso,
      alreadyProcessed: contagemJaProcessados,
      message: mensagemSucesso
    };
  } catch (erro) {
    const mensagemErro = `Erro ao desembaçar imagens: ${erro.message || erro}`;
    util.erro(mensagemErro);
    util.mostrarStatus(mensagemErro, 'error');
    return { success: false, message: mensagemErro };
  }
};

// Verificar se estamos na página de curtidas
const estaNaPaginaCurtidas = () => {
  const caminho = window.location.pathname;
  return caminho.includes('/app/likes-you') || caminho.includes('/app/gold-home');
};

// Criar botão flutuante na interface
const criarBotaoDesembacar = () => {
  // Verificar se o botão já existe
  if (document.getElementById('botao-desembacar-tinder')) {
    return document.getElementById('botao-desembacar-tinder');
  }

  const botao = document.createElement('button');
  botao.textContent = 'Desembaçar Fotos';
  botao.id = 'botao-desembacar-tinder';
  document.body.appendChild(botao);

  // Adicionar evento de clique
  botao.addEventListener('click', async () => {
    botao.textContent = 'Desembaçando...';
    botao.disabled = true;

    const resultado = await desembacarImagens();

    if (resultado.success) {
      botao.textContent = 'Sucesso!';
      setTimeout(() => {
        botao.textContent = 'Desembaçar Fotos';
        botao.disabled = false;
      }, 2000);
    } else {
      botao.textContent = 'Falhou!';
      setTimeout(() => {
        botao.textContent = 'Tentar Novamente';
        botao.disabled = false;
      }, 2000);
    }
  });

  return botao;
};

// Variável para controlar as tentativas de desembaçamento
let desembacarAgendado = false;

// Observar mudanças na URL para ativar o desembaçamento quando necessário
const observarMudancasURL = () => {
  let ultimoPathname = window.location.pathname;

  // Verificar mudanças na URL periodicamente
  setInterval(() => {
    const caminhoAtual = window.location.pathname;
    if (caminhoAtual !== ultimoPathname) {
      ultimoPathname = caminhoAtual;
      // Resetar processados quando mudar de página
      processados.clear();

      if (estaNaPaginaCurtidas()) {
        util.log('Detectada página de curtidas, desembaçando automaticamente...');

        // Adicionar botão se ele não existir
        if (!document.getElementById('botao-desembacar-tinder')) {
          criarBotaoDesembacar();
        }

        // Evitar agendamentos múltiplos
        if (!desembacarAgendado) {
          desembacarAgendado = true;
          // Atraso para garantir que o DOM esteja carregado após mudança de página
          setTimeout(() => {
            desembacarImagens().finally(() => {
              desembacarAgendado = false;
            });
          }, CONFIG.atrasos.tentativaDesembacar);
        }
      } else {
        // Remover botão se não estiver na página de curtidas
        const botao = document.getElementById('botao-desembacar-tinder');
        if (botao) {
          botao.remove();
        }
      }
    }
  }, CONFIG.atrasos.verificacaoDOM);
};

// Variável para controlar tentativas de desembaçamento via MutationObserver
let mutationDesembacarAgendado = false;

// Configurar observador de mutações para detectar quando novos elementos são adicionados
const configurarObservadorDOM = () => {
  // Verificar se MutationObserver está disponível
  if (!window.MutationObserver) {
    util.erro('MutationObserver não suportado neste navegador');
    return;
  }

  const observer = new MutationObserver((mutacoes) => {
    // Verificar se estamos na página de curtidas
    if (!estaNaPaginaCurtidas()) return;

    // Verificar se novas curtidas foram carregadas
    let novoElementoDetectado = false;
    for (const mutacao of mutacoes) {
      if (mutacao.type === 'childList' && mutacao.addedNodes.length > 0) {
        const elementosPreview = document.querySelectorAll(CONFIG.seletores.containerPreviewCurtidas);

        // Se encontramos elementos que podem ser desembaçados, tente desembaçar
        if (elementosPreview && elementosPreview.length > 0) {
          novoElementoDetectado = true;
          // Adicionar botão se ele não existir
          if (!document.getElementById('botao-desembacar-tinder')) {
            criarBotaoDesembacar();
          }
          break; // Sair do loop se encontramos elementos
        }
      }
    }

    // Se detectou novos elementos e não está agendado, agendar desembaçamento
    if (novoElementoDetectado && !mutationDesembacarAgendado) {
      mutationDesembacarAgendado = true;
      // Adicionar atraso para garantir que o conteúdo esteja completamente carregado
      setTimeout(() => {
        desembacarImagens().finally(() => {
          mutationDesembacarAgendado = false;
        });
      }, CONFIG.atrasos.tentativaDesembacar);
    }
  });

  // Observar o corpo da página para quaisquer alterações
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
};

// Inicializar o script
const inicializar = () => {
  util.log('Inicializando extensão Tinder Deblur...');

  // Limpar qualquer estado anterior
  processados.clear();
  desembacarAgendado = false;
  mutationDesembacarAgendado = false;

  // Se já estiver na página de curtidas, criar botão
  if (estaNaPaginaCurtidas()) {
    util.log('Página de curtidas detectada, criando botão...');
    criarBotaoDesembacar();

    // Tentar desembaçar após carregamento completo
    desembacarAgendado = true;
    setTimeout(() => {
      desembacarImagens().finally(() => {
        desembacarAgendado = false;
      });
    }, CONFIG.atrasos.carregamentoPagina);
  }

  // Configurar observadores para mudanças na página
  observarMudancasURL();
  configurarObservadorDOM();

  // Configurar listener para mensagens do popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'desembacar') {
      desembacarImagens().then(resultado => {
        sendResponse(resultado);
      });
      return true; // Indica que a resposta será assíncrona
    }
  });

  util.log('Extensão inicializada com sucesso!');
};

// Iniciar script quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
