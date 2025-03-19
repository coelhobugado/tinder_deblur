# Tinder Deblur - Extensão para Chrome

Esta extensão permite desembaçar as fotos de quem já curtiu você no Tinder Gold, permitindo ver os perfis completos antes de dar match.

## Como funciona?

A extensão funciona obtendo os dados originais das imagens embaçadas diretamente da API do Tinder. Quando você visita a página de "Curtidas" do Tinder, a extensão automaticamente tenta desembaçar as fotos.

## Funcionalidades

- Botão flutuante na interface do Tinder para desembaçar fotos
- Desembaçamento automático quando você acessa a página de curtida- Detecção inteligente para evitar processamento repetido de imagens já desembaçadas
- Popup com informações de status e botão para desembaçar manualmente
- Compatível com a versão web do Tinder

## Versões

- **1.0.1**: Corrigido problema de loop infinito ao tentar desembaçar repetidamente as mesmas imagens; melhorias no ícone da extensão
- **1.0.0**: Versão inicial

## Como instalar

1. Faça o download do arquivo `tinder-deblur-extension.tar.gz`
2. Extraia o arquivo para uma pasta no seu computador
3. Abra o Chrome e vá para `chrome://extensions/`
4. Ative o "Modo do desenvolvedor" (botão no canto superior direito)
5. Clique em "Carregar sem compactação"
6. Selecione a pasta `tinder-deblur-extension` que você extraiu

## Como usar

1. Faça login no Tinder através do site `https://tinder.com`
2. Navegue até a seção "Curtidas" ou "Tinder Gold"
3. Um botão "Desembaçar Fotos" aparecerá no canto superior direito
4. Clique no botão para desembaçar as fotos
5. Alternativamente, clique no ícone da extensão na barra de ferramentas do Chrome para desembaçar as fotos

## Observações importantes

- Esta extensão funciona apenas com a versão web do Tinder (tinder.com)
- É necessário estar logado no Tinder para a extensão funcionar
- O desembaçamento só funciona na página de "Curtidas" ou "Tinder Gold"
- Esta extensão não altera permanentemente o comportamento do Tinder
- O Tinder pode atualizar sua interface ou API a qualquer momento, o que pode fazer com que a extensão pare de funcionar

## Segurança e Privacidade

- Esta extensão não coleta nem envia seus dados para servidores externos
- Todo o processamento acontece localmente no seu navegador
- A extensão acessa apenas a API oficial do Tinder para obter as imagens originais
- Seu token de autenticação é usado apenas para fazer requisições à API do Tinder

## Resolução de problemas

Se a extensão não estiver funcionando:

1. Verifique se você está na página correta do Tinder (seção de Curtidas)
2. Tente recarregar a página
3. Verifique se você está logado corretamente no Tinder
4. Reinicie o navegador Chrome
5. Se a página de curtidas mudou e os seletores não funcionam mais, aguarde por uma atualização da extensão

## Limitações

- O desembaçamento funciona apenas para os perfis mostrados na interface
- Alguns perfis podem não ser desembaçados se o Tinder alterar a estrutura dos dados
- A extensão pode parar de funcionar se o Tinder alterar sua API ou interface

## Aviso Legal

Esta extensão é fornecida "como está", sem garantias. Não somos afiliados ao Tinder e não podemos garantir que a extensão continuará funcionando em versões futuras do site. Use por sua conta e risco.
