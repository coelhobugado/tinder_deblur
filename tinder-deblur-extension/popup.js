// Popup.js - Script para o popup da extensão Tinder Deblur

document.addEventListener('DOMContentLoaded', function() {
  const desembacarBtn = document.getElementById('btn-desembacar');
  const statusEl = document.getElementById('status');

  // Verificar se já está na página do Tinder
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tabUrl = tabs[0].url;
    const isTinder = tabUrl && tabUrl.includes('tinder.com');

    if (!isTinder) {
      desembacarBtn.disabled = true;
      statusEl.textContent = 'Abra o Tinder primeiro!';
      statusEl.style.color = '#ffcc00';
      return;
    }

    // Verificar se está na página de curtidas
    const isLikesPage = tabUrl.includes('/app/likes-you') || tabUrl.includes('/app/gold-home');
    if (!isLikesPage) {
      statusEl.textContent = 'Vá para a página de curtidas!';
      statusEl.style.color = '#ffcc00';
    }
  });

  // Quando o usuário clicar no botão de desembaçar
  desembacarBtn.addEventListener('click', function() {
    desembacarBtn.disabled = true;
    statusEl.textContent = 'Desembaçando...';

    // Enviar mensagem para o content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'desembacar' },
        function(response) {
          if (response && response.success) {
            statusEl.textContent = `Sucesso! ${response.count} imagens desembaçadas`;
            statusEl.style.color = '#00ff88';
          } else {
            statusEl.textContent = 'Falha ao desembaçar';
            statusEl.style.color = '#ff6666';
          }

          // Reativar o botão após 2 segundos
          setTimeout(() => {
            desembacarBtn.disabled = false;
          }, 2000);
        }
      );
    });
  });
});
