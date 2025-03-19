# Tinder Deblur

<div align="center">
  
![Tinder Deblur Logo](https://placehold.co/600x200/f9a8d4/333333.png?text=Tinder+Deblur&font=montserrat)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/yourusername/tinder-deblur)

*Remove o desfoque das fotos de pessoas que curtiram você no Tinder | Disponível como UserScript e Extensão Chrome*

[English](#english) | [Português](#português)

</div>

---

## English

### 📋 Overview
Tinder Deblur is a powerful tool available as both a userscript and Chrome extension that automatically removes the blur effect from photos in the "Likes You" section on Tinder, allowing you to see who liked your profile without purchasing Tinder Gold or Platinum.

### ✨ Features
- **Automatic Deblurring**: Instantly removes blur from photos in the "Likes You" section
- **Manual Control**: Provides a convenient floating button for on-demand deblurring
- **API Integration**: Utilizes Tinder's own API to retrieve the original, high-quality images
- **Real-time Updates**: Automatically detects and deblurs new likes as they appear
- **Simple UI**: Clean interface that integrates seamlessly with Tinder's design
- **Privacy Focused**: Runs entirely in your browser with no data sent to third parties
- **Multiple Formats**: Available as both a UserScript and a Chrome Extension

### 🛠️ Installation

#### Prerequisites
- An active Tinder account
- A modern web browser (Chrome, Firefox, Edge, or Safari)

#### Option 1: Chrome Extension
For Chrome users, a dedicated extension is available for easier installation:

1. **Install from Chrome Web Store**:
   - Visit the [Chrome Web Store page](#) (coming soon)
   - Click "Add to Chrome" and confirm the installation

   **OR**

2. **Manual installation**:
   - Download the extension from [GitHub](https://github.com/coelhobugado/tinder_deblur/tree/main/tinder-deblur-extension)  
   - Go to `chrome://extensions/` in your Chrome browser
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked" and select the downloaded extension folder

#### Option 2: UserScript Installation
For users of other browsers or those who prefer UserScripts:

1. **Install a UserScript manager**:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (Firefox only)

2. **Install Tinder Deblur script**:
   - Click on this [installation link](#) (or visit the repository and click "Raw" on the script file)
   - Your UserScript manager will prompt you to install the script
   - Click "Install" or "OK" to confirm

3. **Usage**:
   - Log in to [Tinder Web](https://tinder.com/)
   - Navigate to the "Likes You" section
   - The script will automatically deblur photos, or you can click the "Deblur Photos" button

### 💻 Technical Details
The script works by intercepting network requests to Tinder's API and extracting the original image URLs from the response data. It then replaces the blurred images with their unblurred counterparts without affecting other functionality.

### ⚠️ Disclaimer
This script is provided for educational purposes only. Using this script may violate Tinder's Terms of Service. Use at your own risk. The authors are not responsible for any account suspension or other consequences that may result from using this script.

---

## Português

### 📋 Visão Geral
Tinder Deblur é uma poderosa ferramenta disponível como userscript e extensão para Chrome que remove automaticamente o efeito de desfoque das fotos na seção "Likes You" do Tinder, permitindo que você veja quem curtiu seu perfil sem precisar comprar o Tinder Gold ou Platinum.

### ✨ Funcionalidades
- **Remoção Automática do Desfoque**: Remove instantaneamente o desfoque das fotos na seção "Likes You"
- **Controle Manual**: Oferece um botão flutuante conveniente para remoção do desfoque sob demanda
- **Integração com API**: Utiliza a própria API do Tinder para recuperar as imagens originais de alta qualidade
- **Atualizações em Tempo Real**: Detecta e remove automaticamente o desfoque de novos likes à medida que aparecem
- **Interface Simples**: Interface limpa que se integra perfeitamente ao design do Tinder
- **Focado em Privacidade**: Executado inteiramente no seu navegador, sem envio de dados para terceiros
- **Múltiplos Formatos**: Disponível como UserScript e como Extensão para Chrome

### 🛠️ Instalação

#### Pré-requisitos
- Uma conta ativa no Tinder
- Um navegador web moderno (Chrome, Firefox, Edge ou Safari)

#### Opção 1: Extensão para Chrome
Para usuários do Chrome, uma extensão dedicada está disponível para facilitar a instalação:

1. **Instalar da Chrome Web Store**:
   - Visite a [página da Chrome Web Store](#) (em breve)
   - Clique em "Adicionar ao Chrome" e confirme a instalação

   **OU**

2. **Instalação manual**:
   - Baixe a extensão do [GitHub](https://github.com/coelhobugado/tinder_deblur/tree/main/tinder-deblur-extension)
   - Acesse `chrome://extensions/` no seu navegador Chrome
   - Ative o "Modo desenvolvedor" (botão no canto superior direito)
   - Clique em "Carregar sem compactação" e selecione a pasta da extensão baixada

#### Opção 2: Instalação como UserScript
Para usuários de outros navegadores ou que preferem UserScripts:

1. **Instale um gerenciador de UserScripts**:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recomendado)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://addons.mozilla.org/pt-BR/firefox/addon/greasemonkey/) (Apenas Firefox)

2. **Instale o script Tinder Deblur**:
   - Clique neste [link de instalação](#) (ou visite o repositório e clique em "Raw" no arquivo do script)
   - Seu gerenciador de UserScripts solicitará a instalação do script
   - Clique em "Instalar" ou "OK" para confirmar

3. **Uso**:
   - Faça login no [Tinder Web](https://tinder.com/)
   - Navegue até a seção "Likes You"
   - O script removerá automaticamente o desfoque das fotos, ou você pode clicar no botão "Deblur Photos"

### 💻 Detalhes Técnicos
O script funciona interceptando requisições de rede para a API do Tinder e extraindo as URLs das imagens originais dos dados de resposta. Em seguida, substitui as imagens desfocadas por suas versões nítidas correspondentes sem afetar outras funcionalidades.

### ⚠️ Aviso Legal
Este script é fornecido apenas para fins educacionais. O uso deste script pode violar os Termos de Serviço do Tinder. Use por sua própria conta e risco. Os autores não são responsáveis por qualquer suspensão de conta ou outras consequências que possam resultar do uso deste script.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support
If you encounter any issues or have questions, please open an issue in the GitHub repository.
