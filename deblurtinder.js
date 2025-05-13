// ==UserScript==
// @name         Persistent Tinder Deblur & Info (v1.4 Visual Restore)
// @namespace    https://github.com/coelhobugado/tinder_deblur
// @version      1.4.1
// @description  Unblurs photos, shows extra info on hover. Remembers processed likes and restores visuals on page load. Works only on likes-you page.
// @author       CoelhoBugado (enhanced by AI)
// @match        https://tinder.com/app/likes-you*
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        selectors: {
            likedPreviewContainer: '.Expand.enterAnimationContainer > div:nth-child(1)'
        },
        delays: {
            pageLoad: 1500,
            deblurAttempt: 1500,
            domCheck: 1000,
            observerDebounce: 1200
        },
        storageKey: 'tinderDeblurProcessedUserIds_v2'
    };

    let processedUserIds = new Set();
    let deblurringInProgress = false;
    let observerDebounceTimeout = null;
    let deblurButton = null;

    const util = {
        log: (message) => console.log(`[Tinder Deblur v1.4.1] ${message}`),
        error: (message, ...optionalParams) => console.error(`[Tinder Deblur v1.4.1] ${message}`, ...optionalParams),
        addStyle: (css) => {
            const styleId = 'tinder-deblur-styles';
            let style = document.getElementById(styleId);
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                style.textContent = css;
                document.head.appendChild(style);
            }
        }
    };

    const infoHelper = {
        calculateAge: (birthDateString) => {
            if (!birthDateString) return null;
            const birthDate = new Date(birthDateString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        },
        addOrUpdateInfo: (parentElement, text, className, icon = '', customStyles = {}) => {
            const mainOverlayClass = 'tinder-info-overlay-container';
            let mainOverlay = parentElement.querySelector(`.${mainOverlayClass}`);

            if (className === mainOverlayClass) {
                if (!mainOverlay) {
                    mainOverlay = document.createElement('div');
                    mainOverlay.className = mainOverlayClass;
                    Object.assign(mainOverlay.style, {
                        position: 'absolute', bottom: '5px', left: '5px', right: '5px',
                        backgroundColor: 'rgba(0, 0, 0, 0.85)', color: 'white', padding: '5px 7px',
                        borderRadius: '6px', fontSize: '11px', lineHeight: '1.4',
                        textAlign: 'left', zIndex: '10', display: 'none',
                        flexDirection: 'column', gap: '3px', pointerEvents: 'none',
                        boxSizing: 'border-box'
                    });
                    if (getComputedStyle(parentElement).position === 'static') {
                        parentElement.style.position = 'relative';
                    }
                    parentElement.appendChild(mainOverlay);
                }
                Object.assign(mainOverlay.style, customStyles);
                return;
            }
            if (!mainOverlay) return;
            let infoElement = mainOverlay.querySelector(`.${className.replace(/\s+/g, '-')}`);
            if (!infoElement) {
                infoElement = document.createElement('div');
                infoElement.className = className.replace(/\s+/g, '-');
                mainOverlay.appendChild(infoElement);
            }
            infoElement.innerHTML = `${icon} ${text}`;
            Object.assign(infoElement.style, customStyles);
        },
        clearPreviousInfo: (parentElement) => {
            const mainOverlay = parentElement.querySelector('.tinder-info-overlay-container');
            if (mainOverlay) mainOverlay.remove();
        }
    };

    async function loadProcessedIds() {
        const storedData = await GM_getValue(CONFIG.storageKey, JSON.stringify([]));
        try {
            processedUserIds = new Set(JSON.parse(storedData));
            util.log(`Loaded ${processedUserIds.size} processed user IDs from storage.`);
        } catch (e) {
            util.error("Error parsing stored data, starting fresh.", e);
            processedUserIds = new Set();
        }
    }

    async function saveProcessedId(userId) {
        if (userId && !processedUserIds.has(userId)) {
            processedUserIds.add(userId);
            try {
                await GM_setValue(CONFIG.storageKey, JSON.stringify(Array.from(processedUserIds)));
            } catch (e) {
                util.error("Error saving processed ID to storage.", e);
            }
        }
    }

    async function resetProcessedIds() {
        processedUserIds.clear();
        try {
            await GM_setValue(CONFIG.storageKey, JSON.stringify([]));
            util.log("Cleared processed user IDs from storage.");
        } catch (e) { util.error("Error clearing processed IDs from storage.", e); }

        const teaserEls = document.querySelectorAll(`${CONFIG.selectors.likedPreviewContainer}[data-tinder-script-processed="true"]`);
        teaserEls.forEach(el => {
            delete el.dataset.tinderScriptProcessed;
            infoHelper.clearPreviousInfo(el);
            el.style.backgroundImage = '';
            el.style.filter = '';
        });
        util.log("Visual markers and styles on DOM elements reset.");
    }

    const deblurImagesAndAddInfo = async () => {
        if (deblurringInProgress) return false;

        deblurringInProgress = true;
        util.log('Starting/Updating visual processing...');

        try {
            const token = localStorage.getItem('TinderWeb/APIToken');
            if (!token) { util.error('Authentication token not found.'); deblurringInProgress = false; return false; }

            const response = await fetch('https://api.gotinder.com/v2/fast-match/teasers', {
                headers: { 'X-Auth-Token': token, 'platform': 'android', 'Content-Type': 'application/json' }
            });

            if (!response.ok) { util.error(`API Request error: ${response.status} ${response.statusText}`); deblurringInProgress = false; return false; }
            const data = await response.json();
            if (!data || !data.data || !data.data.results || !Array.isArray(data.data.results)) { util.error('Invalid API data format'); deblurringInProgress = false; return false; }

            const teasersFromApi = data.data.results;
            if (teasersFromApi.length === 0) { util.log('No teasers returned from API.'); deblurringInProgress = false; return true; }
            util.log(`Fetched ${teasersFromApi.length} teasers from API.`);

            await new Promise(resolve => setTimeout(resolve, 200));
            const teaserEls = document.querySelectorAll(CONFIG.selectors.likedPreviewContainer);
            if (!teaserEls || teaserEls.length === 0) { util.error('No DOM elements found for teasers.'); deblurringInProgress = false; return false; }

            let newUsersProcessedCount = 0;
            let knownUsersUpdatedCount = 0;
            const processCount = Math.min(teaserEls.length, teasersFromApi.length);

            for (let i = 0; i < processCount; i++) {
                const element = teaserEls[i];
                const apiTeaserData = teasersFromApi[i];

                if (!apiTeaserData || !apiTeaserData.user || !apiTeaserData.user._id) continue;
                const userId = apiTeaserData.user._id;

                const isNewUser = !processedUserIds.has(userId);
                const alreadyMarkedInDOM = element.dataset.tinderScriptProcessed === 'true';

                if (isNewUser || !alreadyMarkedInDOM) {
                    infoHelper.clearPreviousInfo(element);
                    infoHelper.addOrUpdateInfo(element, '', 'tinder-info-overlay-container', '', { display: 'none' });

                    if (apiTeaserData.user.photos && apiTeaserData.user.photos.length > 0) {
                        const photoId = apiTeaserData.user.photos[0].id;
                        if (photoId) {
                            const originalImageUrl = `https://preview.gotinder.com/${userId}/original_${photoId}.jpeg`;
                            element.style.backgroundImage = `url("${originalImageUrl}")`;
                            element.style.filter = 'none';
                        } else {
                            util.error(`Photo ID missing for user ${userId}. Using small image.`);
                            element.style.backgroundImage = `url("${apiTeaserData.user.photos[0].url}")`;
                            element.style.filter = 'none';
                        }
                    } else { util.error(`No photos array for user ${userId}.`); }

                    const userData = apiTeaserData.user;
                    if (userData.birth_date) {
                        const age = infoHelper.calculateAge(userData.birth_date);
                        if (age !== null) infoHelper.addOrUpdateInfo(element, `Idade: ${age}`, 'info-age', '🎂');
                    }
                    if (apiTeaserData.distance_mi !== undefined) {
                        infoHelper.addOrUpdateInfo(element, `Distância: ${apiTeaserData.distance_mi} mi`, 'info-distance', '📍');
                    }
                    if (userData.recently_active !== undefined) {
                        infoHelper.addOrUpdateInfo(element, userData.recently_active ? "Ativo" : "Inativo", 'info-activity', userData.recently_active ? "🟢" : "⚪️");
                    }
                    if (userData.badges && userData.badges.some(b => b.type === 'selfie_verified')) {
                        infoHelper.addOrUpdateInfo(element, "Verificado", 'info-verified', '✔️');
                    }
                    if (userData.name) {
                        element.setAttribute('data-name', userData.name);
                        infoHelper.addOrUpdateInfo(element, `Nome: ${userData.name}`, 'info-name', '👤');
                    } else if (userData.name_length) {
                        infoHelper.addOrUpdateInfo(element, `Nome (${userData.name_length} letras)`, 'info-name-length', '👤');
                    }

                    element.removeEventListener('mouseenter', showInfo);
                    element.removeEventListener('mouseleave', hideInfo);
                    element.addEventListener('mouseenter', showInfo);
                    element.addEventListener('mouseleave', hideInfo);

                    element.dataset.tinderScriptProcessed = 'true';

                    if (isNewUser) {
                        await saveProcessedId(userId);
                        newUsersProcessedCount++;
                    } else {
                        knownUsersUpdatedCount++;
                    }
                }
            }
            util.log(`Finished. New: ${newUsersProcessedCount}. Updated visuals for known: ${knownUsersUpdatedCount}.`);
            deblurringInProgress = false;
            return true;
        } catch (error) {
            util.error(`Critical error: ${error.message || error}`, error.stack);
            deblurringInProgress = false;
            return false;
        }
    };

    function showInfo(event) {
        const infoContainer = event.currentTarget.querySelector('.tinder-info-overlay-container');
        if (infoContainer) infoContainer.style.display = 'flex';
    }

    function hideInfo(event) {
        const infoContainer = event.currentTarget.querySelector('.tinder-info-overlay-container');
        if (infoContainer) infoContainer.style.display = 'none';
    }

    const isOnLikesPage = () => window.location.pathname === '/app/likes-you';

    const createDeblurButton = () => {
        if (document.getElementById('tinder-deblur-button')) {
            deblurButton = document.getElementById('tinder-deblur-button'); // Re-atribuir se já existe
            return;
        }
        deblurButton = document.createElement('button');
        deblurButton.textContent = 'Revelar & Info';
        deblurButton.id = 'tinder-deblur-button';
        util.addStyle(`
            #tinder-deblur-button {
                position: fixed; top: 15px; right: 15px; z-index: 10001;
                background-color: #FD3A73; color: white; border: none;
                border-radius: 22px; padding: 10px 18px; font-weight: bold;
                cursor: pointer; box-shadow: 0 3px 9px rgba(0,0,0,0.15);
                transition: background-color 0.2s ease-out, transform 0.1s ease-out;
                align-items: center; justify-content: center;
            }
            #tinder-deblur-button:hover { background-color: #E22C60; }
            #tinder-deblur-button:active { transform: scale(0.97); }
            #tinder-deblur-button:disabled { background-color: #B0B0B0; cursor: not-allowed; opacity: 0.7; }
        `);
        document.body.appendChild(deblurButton);

        deblurButton.addEventListener('click', async () => {
            const originalText = deblurButton.textContent;
            deblurButton.textContent = 'Processando...';
            deblurButton.disabled = true;
            await resetProcessedIds();
            await deblurImagesAndAddInfo();
            deblurButton.textContent = 'Concluído!';
            setTimeout(() => {
                deblurButton.textContent = originalText;
                deblurButton.disabled = false;
            }, 1500);
        });
    };

    let urlCheckInterval;
    const observeUrlChanges = () => {
        let lastPathname = window.location.pathname;
        if (urlCheckInterval) clearInterval(urlCheckInterval);
        urlCheckInterval = setInterval(() => {
            if (!document.body.contains(deblurButton)) {
                createDeblurButton();
            }
            const currentPath = window.location.pathname;
            if (currentPath !== lastPathname) {
                lastPathname = currentPath;
                if (isOnLikesPage() && !deblurringInProgress) {
                    util.log('URL may have changed within Likes page (or to it), auto-processing...');
                    setTimeout(deblurImagesAndAddInfo, CONFIG.delays.deblurAttempt);
                }
            }
        }, CONFIG.delays.domCheck);
    };

    let domObserver;
    const setupDomObserver = () => {
        if (!window.MutationObserver) return;
        if (domObserver) domObserver.disconnect();

        domObserver = new MutationObserver(() => {
            if (deblurringInProgress) return;
            clearTimeout(observerDebounceTimeout);
            observerDebounceTimeout = setTimeout(async () => {
                const unprocessedElements = document.querySelectorAll(`${CONFIG.selectors.likedPreviewContainer}:not([data-tinder-script-processed="true"])`);
                if (unprocessedElements.length > 0) {
                    util.log('Observer detected potential new/unprocessed elements. Re-processing...');
                    await deblurImagesAndAddInfo();
                }
            }, CONFIG.delays.observerDebounce);
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    };

    const initialize = async () => {
        util.log('Initializing script...');
        await loadProcessedIds();
        createDeblurButton();
        observeUrlChanges();
        setupDomObserver();
        if (isOnLikesPage()) {
            setTimeout(deblurImagesAndAddInfo, CONFIG.delays.pageLoad);
        }
        util.log('Script initialized. Active on /app/likes-you.');
    };

    if (typeof window.tinderDeblurInitialized === 'undefined') {
        window.tinderDeblurInitialized = true;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            initialize();
        }
    } else {
        util.log("Script was already initialized. Ensuring components are active.");
        if (!document.getElementById('tinder-deblur-button')) createDeblurButton();
        // Observadores já devem estar ativos ou serão recriados na próxima inicialização se houver falha
    }
})();
