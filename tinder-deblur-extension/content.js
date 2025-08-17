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
  // Obsolete functions util.foiProcessado and util.limparProcessados were here.
  // The logic for preventing reprocessing is now handled by the 'data-deblurred' attribute.
  /**
   * Calculates age based on a birth date string.
   * @param {string} birthDateString - The date of birth as a string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ"), typically sourced from the 'data-birth-date' attribute on a DOM element.
   * @returns {number|null} The calculated age as a number, or null if the date string is invalid or missing.
   */
  calculateAge: (birthDateString) => {
    if (!birthDateString) return null;
    try {
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      console.error("[Tinder Deblur] Error parsing birth date:", e);
      return null;
    }
  }
  // util.formatBirthDate function was fully removed previously.
};

// Tooltip Management Functions
/**
 * Creates and displays a tooltip with profile information for a given element.
 * The tooltip is appended as a child to the element and a reference is stored in element.tooltipElement.
 * Displays Name, Age (calculated from 'data-birth-date'), Distance, Activity, and Verification status.
 * The birth date itself is not displayed.
 * @param {HTMLElement} element - The DOM element to which the tooltip will be attached.
 */
const createTooltip = (element) => {
  // Prevent multiple tooltips on the same element
  if (element.tooltipElement) {
    return;
  }

  // Retrieve profile data from element's data attributes
  const name = element.getAttribute('data-name');
  const birthDateString = element.getAttribute('data-birth-date'); // Used for age calculation, not direct display
  const distanceMi = element.getAttribute('data-distance-mi');
  const recentlyActive = element.getAttribute('data-recently-active');
  const isVerified = element.getAttribute('data-is-verified');

  // Construct tooltip HTML content in Portuguese.
  // Includes Name, Age, Distance, Activity, and Verification status.
  // birthDateString is used to calculate age but is not displayed directly.
  let contentParts = [];
  if (name) {
    contentParts.push(`<div>👤 Nome: <strong>${name}</strong></div>`);
  }

  const age = util.calculateAge(birthDateString);
  if (age !== null) {
    contentParts.push(`<div>🎂 Idade: ${age}</div>`);
  }

  // Formatted birth date display removed
  // const formattedBirthDate = util.formatBirthDate(birthDateString); // Removed
  // if (formattedBirthDate) { // Removed
  //   contentParts.push(`<div>🎂 Data de Nascimento: ${formattedBirthDate}</div>`); // Removed
  // } // Removed

  if (distanceMi !== null) {
    contentParts.push(`<div>📍 Distância: ${distanceMi} mi</div>`);
  }

  if (recentlyActive !== null) {
    contentParts.push(`<div>${recentlyActive === 'true' ? '🟢 Ativo Recentemente' : '⚪️ Inativo'}</div>`);
  }

  if (isVerified !== null) {
    contentParts.push(`<div>${isVerified === 'true' ? '✔️ Verificado' : '❌ Não Verificado'}</div>`);
  }

  // Do not show tooltip if there's no content to display
  if (contentParts.length === 0) {
    return;
  }

  // Create and style the tooltip element
  const tooltipDiv = document.createElement('div');
  tooltipDiv.className = 'profile-tooltip'; // Styling is handled by CSS
  tooltipDiv.innerHTML = contentParts.join('');

  // Ensure parent element has relative or absolute positioning for correct tooltip placement.
  // This is one of the few style manipulations kept in JS due to its dynamic nature.
  const parentPosition = window.getComputedStyle(element).position;
  if (parentPosition !== 'relative' && parentPosition !== 'absolute') {
    element.style.position = 'relative';
  }

  // Append tooltip to the element and store a reference
  element.appendChild(tooltipDiv);
  element.tooltipElement = tooltipDiv;
};

/**
 * Removes the profile information tooltip from the given element.
 * @param {HTMLElement} element - The DOM element from which the tooltip will be removed.
 */
const removeTooltip = (element) => {
  if (element.tooltipElement) {
    element.tooltipElement.remove();
    element.tooltipElement = null; // Clear the reference
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

      // Skip if element has already been deblurred (marked with 'data-deblurred="true"')
      if (elemento.getAttribute('data-deblurred') === 'true') {
        contagemJaProcessados++;
        util.log(`Elemento ${i} já foi desembaçado (data-deblurred=true), pulando...`);
        continue;
      }

      // Check if teaser data is valid (user, _id, photos) before proceeding
      if (teaser && teaser.user && teaser.user._id && teaser.user.photos && teaser.user.photos.length > 0) {
        const userId = teaser.user._id;
        const photoId = teaser.user.photos[0].id;

        // Definir um atributo para rastrear o usuário
        elemento.setAttribute('data-user-id', userId);

        // Extract and set various data attributes from the teaser object to the DOM element.
        // These attributes are later used by the tooltip creation function.
        if (teaser.user.name) {
          elemento.setAttribute('data-name', teaser.user.name);
          // Set the main browser tooltip to the user's name for basic hover info,
          // supplements the custom tooltip.
          elemento.title = teaser.user.name;
        }
        if (teaser.user.birth_date) { // Reinstate data-birth-date setting for age calculation
          elemento.setAttribute('data-birth-date', teaser.user.birth_date);
        }
        if (typeof teaser.distance_mi !== 'undefined') { // Check for undefined as distance can be 0
          elemento.setAttribute('data-distance-mi', teaser.distance_mi);
        }
        if (typeof teaser.user.recently_active !== 'undefined') {
          elemento.setAttribute('data-recently-active', teaser.user.recently_active);
        }
        // Check for verification badge
        if (teaser.user.badges && Array.isArray(teaser.user.badges)) {
          const isVerified = teaser.user.badges.some(badge => badge.type === 'selfie_verified');
          elemento.setAttribute('data-is-verified', isVerified ? 'true' : 'false');
        } else {
          elemento.setAttribute('data-is-verified', 'false'); // Default if no badges array
        }

        // Construir URL da imagem original
        const urlImagemOriginal = `https://preview.gotinder.com/${userId}/original_${photoId}.jpeg`;

        // Aplicar imagem original e remover filtro
        elemento.style.backgroundImage = `url("${urlImagemOriginal}")`;
        elemento.style.filter = 'none';
        elemento.setAttribute('data-deblurred', 'true'); // Mark as deblurred to prevent reprocessing in future runs.
        contagemSucesso++;

        // NOTE: User data attributes (like data-name, data-birth-date, etc.) are set above.
        // and the tooltip (elemento.title) are set above.
        // The main user name tooltip (elemento.title) is set when 'data-name' is set.

        // Add event listeners for hover tooltips to show custom profile information.
        // It's important to remove any potentially existing listeners first to prevent duplicates,
        // especially if an element could somehow be processed multiple times (though `util.foiProcessado` aims to prevent this).
        elemento.removeEventListener('mouseenter', createTooltip); // Use function reference for removal
        elemento.removeEventListener('mouseleave', removeTooltip); // Use function reference for removal

        elemento.addEventListener('mouseenter', () => createTooltip(elemento));
        elemento.addEventListener('mouseleave', () => removeTooltip(elemento));
      }
    }

    // Obsolete util.limparProcessados() call was here.

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

// As funções de observação automática (observarMudancasURL, configurarObservadorDOM)
// e suas variáveis de controle foram removidas para desativar o comportamento automático.

// Inicializar o script
const inicializar = () => {
  util.log('Inicializando extensão Tinder Deblur...');

  // Cria o botão na página se o usuário estiver na página de curtidas.
  // O desembaçamento agora só ocorre por ação manual (clique no botão da página ou do popup).
  if (estaNaPaginaCurtidas()) {
    criarBotaoDesembacar();
  }

  // Configura o listener para receber a mensagem do popup da extensão.
  // Este é um dos gatilhos manuais para o desembaçamento.
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'desembacar') {
      desembacarImagens().then(resultado => {
        sendResponse(resultado);
      });
      return true; // Indica que a resposta será assíncrona
    }
  });

  util.log('Extensão inicializada. O desembaçamento agora é manual.');
};

// Iniciar script quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
