// ==UserScript==
// @name         Simplified Tinder Deblur
// @namespace    https://github.com/coelhobugado/tinder_deblur
// @version      1.0
// @description  Simple script to unblur photos of people who liked you on Tinder
// @author       CoelhoBugado
// @match        https://tinder.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Basic configuration
    const CONFIG = {
        // Important selectors
        selectors: {
            likedPreviewContainer: '.Expand.enterAnimationContainer > div:nth-child(1)' // Selector for blurred images
        },
        // Delays to ensure elements are ready
        delays: {
            pageLoad: 2000, // 2 seconds after page load
            deblurAttempt: 1500, // 1.5 seconds between attempts
            domCheck: 1000 // 1 second to check for URL changes
        }
    };

    // Utility functions
    const util = {
        log: (message) => {
            console.log(`[Tinder Deblur] ${message}`);
        },
        error: (message) => {
            console.error(`[Tinder Deblur] ${message}`);
        },
        addStyle: (css) => {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }
    };

    // Main function to deblur images
    const deblurImages = async () => {
        try {
            util.log('Starting deblurring process...');

            // Get authentication token
            const token = localStorage.getItem('TinderWeb/APIToken');
            if (!token) {
                util.error('Authentication token not found. Please log in to Tinder.');
                return false;
            }

            // Fetch data from Tinder API
            const response = await fetch('https://api.gotinder.com/v2/fast-match/teasers', {
                headers: {
                    'X-Auth-Token': token,
                    'platform': 'android', // Important for retrieving unfiltered data
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                util.error(`Request error: ${response.status} ${response.statusText}`);
                return false;
            }

            const data = await response.json();

            if (!data || !data.data || !data.data.results || !Array.isArray(data.data.results)) {
                util.error('Invalid data format in API response');
                return false;
            }

            const teasers = data.data.results;
            util.log(`Retrieved ${teasers.length} teasers from API`);

            // Wait to ensure DOM elements are ready
            await new Promise(resolve => setTimeout(resolve, 500));

            // Select DOM elements
            const teaserEls = document.querySelectorAll(CONFIG.selectors.likedPreviewContainer);

            if (!teaserEls || teaserEls.length === 0) {
                util.error('No elements found to deblur. Selectors might be outdated?');
                return false;
            }

            util.log(`Found ${teaserEls.length} elements to deblur`);

            // Replace blurred images with original ones
            let successCount = 0;

            // Deblur only up to the minimum between DOM elements and API data count
            const processCount = Math.min(teaserEls.length, teasers.length);

            for (let i = 0; i < processCount; i++) {
                const teaser = teasers[i];
                const element = teaserEls[i];

                if (teaser && teaser.user && teaser.user._id && teaser.user.photos && teaser.user.photos.length > 0) {
                    const userId = teaser.user._id;
                    const photoId = teaser.user.photos[0].id;

                    // Construct original image URL
                    const originalImageUrl = `https://preview.gotinder.com/${userId}/original_${photoId}.jpeg`;

                    // Apply original image and remove filter
                    element.style.backgroundImage = `url("${originalImageUrl}")`;
                    element.style.filter = 'none';
                    successCount++;

                    // Add attributes with user data (optional)
                    if (teaser.user.name) {
                        element.setAttribute('data-name', teaser.user.name);
                    }
                }
            }

            util.log(`Successfully deblurred ${successCount} images!`);
            return successCount > 0;
        } catch (error) {
            util.error(`Error deblurring images: ${error.message || error}`);
            return false;
        }
    };

    // Check if the user is on the "Likes You" page
    const isOnLikesPage = () => {
        const path = window.location.pathname;
        return path.includes('/app/likes-you') || path.includes('/app/gold-home');
    };

    // Create floating button
    const createDeblurButton = () => {
        const button = document.createElement('button');
        button.textContent = 'Deblur Photos';
        button.id = 'tinder-deblur-button';
        document.body.appendChild(button);

        // Add button styles
        util.addStyle(`
            #tinder-deblur-button {
                position: fixed;
                top: 15px;
                right: 15px;
                z-index: 9999;
                background-color: #FE3C72;
                color: white;
                border: none;
                border-radius: 20px;
                padding: 8px 16px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                transition: background-color 0.3s;
            }
            #tinder-deblur-button:hover {
                background-color: #FF6B81;
            }
            #tinder-deblur-button:active {
                transform: scale(0.98);
            }
        `);

        // Add click event
        button.addEventListener('click', async () => {
            button.textContent = 'Deblurring...';
            button.disabled = true;

            const success = await deblurImages();

            if (success) {
                button.textContent = 'Success!';
                setTimeout(() => {
                    button.textContent = 'Deblur Photos';
                    button.disabled = false;
                }, 2000);
            } else {
                button.textContent = 'Failed!';
                setTimeout(() => {
                    button.textContent = 'Try Again';
                    button.disabled = false;
                }, 2000);
            }
        });

        return button;
    };

    // Observe URL changes to trigger deblurring
    const observeUrlChanges = () => {
        let lastPathname = window.location.pathname;

        setInterval(() => {
            const currentPath = window.location.pathname;
            if (currentPath !== lastPathname) {
                lastPathname = currentPath;

                if (isOnLikesPage()) {
                    util.log('Detected Likes page, automatically deblurring...');
                    setTimeout(() => {
                        deblurImages();
                    }, CONFIG.delays.deblurAttempt);
                }
            }
        }, CONFIG.delays.domCheck);
    };

    // Set up mutation observer to detect new elements
    const setupDomObserver = () => {
        if (!window.MutationObserver) {
            util.error('MutationObserver is not supported in this browser');
            return;
        }

        const observer = new MutationObserver((mutations) => {
            if (!isOnLikesPage()) return;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const previewElements = document.querySelectorAll(CONFIG.selectors.likedPreviewContainer);

                    if (previewElements && previewElements.length > 0) {
                        setTimeout(() => {
                            deblurImages();
                        }, CONFIG.delays.deblurAttempt);
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    };

    // Initialize script
    const initialize = () => {
        util.log('Initializing Simplified Tinder Deblur script...');

        createDeblurButton();
        observeUrlChanges();
        setupDomObserver();

        if (isOnLikesPage()) {
            util.log('Likes page detected, automatically deblurring...');
            setTimeout(() => {
                deblurImages();
            }, CONFIG.delays.pageLoad);
        }

        util.log('Script initialized successfully!');
    };

    // Start script when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
