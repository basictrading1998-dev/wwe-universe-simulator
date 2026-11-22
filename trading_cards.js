(function () {
    'use strict';

    const DATABASE_NAME = 'WWEUniverseTradingCards';
    const STORE_NAME = 'card_renders';
    const PHOTO_DATABASE_NAME = 'wwe_fighter_photos';
    const PHOTO_STORE_NAME = 'photos';
    const state = {
        fighters: [],
        ranks: new Map(),
        renders: new Map(),
        renderLookups: new Map(),
        crop: null,
        objectUrls: new Set()
    };
    let cardsDatabasePromise = null;
    let portraitDatabasePromise = null;
    let renderObserver = null;
    let rosterReadError = false;

    const grid = document.getElementById('tradingCardGrid');
    const pageStatus = document.getElementById('pageStatus');
    const searchInput = document.getElementById('fighterSearch');
    const genderFilter = document.getElementById('genderFilter');
    const rankFilter = document.getElementById('rankFilter');
    const foilFilter = document.getElementById('foilFilter');
    const imageInput = document.getElementById('torsoImageInput');
    const cropModal = document.getElementById('cropperModal');
    const cropViewport = document.getElementById('cropViewport');
    const cropImage = document.getElementById('cropImage');
    const cropZoom = document.getElementById('cropZoom');
    const cropperStatus = document.getElementById('cropperStatus');
    const saveCropButton = document.getElementById('saveCrop');
    const cancelCropButton = document.getElementById('cancelCrop');
    const visibleCount = document.getElementById('visibleCount');
    const collectionCount = document.getElementById('collectionCount');

    function normalizeLookupKey(value) {
        return (value || '').toString()
            .normalize('NFC')
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
            .replace(/[\u2010-\u2015]/g, '-')
            .replace(/\u00A0/g, ' ')
            .replace(/\s*['’]\s*(?:[0-9]{2}|[0-9]{4})\b/g, '')
            .replace(/\s*["“”][^"“”]*["“”]\s*/g, ' ')
            .replace(/\b(?:64|32)-Bit\b/gi, '')
            .replace(/\b(?:PS[ -]?5|PS[ -]?4|Xbox(?:\s*One)?|Switch|Steam|PC|64-Bit|32-Bit|GameCube|Dreamcast|N64|Genesis)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function numberOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function readStorageArray(key, fallbackKey) {
        let raw;
        try {
            raw = localStorage.getItem(key);
            if (raw === null && fallbackKey) raw = localStorage.getItem(fallbackKey);
            if (raw === null) return [];
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            throw new Error(key + ' must contain an array.');
        } catch (error) {
            console.error('Unable to read ' + key + ' for Trading Cards.', error);
            rosterReadError = true;
            pageStatus.textContent = 'Could not read the roster data. See the browser console for details.';
            pageStatus.classList.add('status-error');
            return [];
        }
    }

    function loadFighters() {
        rosterReadError = false;
        return readStorageArray('wwe_fighters', 'fighters')
            .filter(fighter => fighter && typeof fighter === 'object' && fighter.retired !== true && fighter.name)
            .map(fighter => ({
                ...fighter,
                name: String(fighter.name),
                wins: numberOrZero(fighter.wins),
                losses: numberOrZero(fighter.losses),
                gender: String(fighter.gender || 'male').toLowerCase(),
                division: String(fighter.division || fighter.weightClass || 'Heavyweight')
            }));
    }

    function getRank(fighter) {
        return state.ranks.get(normalizeLookupKey(fighter.name)) || null;
    }

    function getWinStreak(fighter) {
        const savedStreak = Number(fighter.win_streak);
        if (Number.isFinite(savedStreak) && savedStreak > 0) return Math.floor(savedStreak);
        if (fighter.losses === 0 && fighter.wins > 0) return Math.floor(fighter.wins);
        const history = fighter.compiled_history_deck || fighter.history_deck || fighter.history || [];
        if (!Array.isArray(history) || history.length === 0) return 0;
        let streak = 0;
        for (let index = history.length - 1; index >= 0; index--) {
            if (String(history[index] && history[index].outcome || '').toLowerCase() !== 'win') break;
            streak++;
        }
        return streak;
    }

    function getActiveStreakLabel(fighter) {
        const history = fighter.compiled_history_deck || fighter.history_deck || fighter.history || [];
        const winStreak = getWinStreak(fighter);
        if (winStreak > 0) return winStreak + ' Win' + (winStreak === 1 ? '' : 's');
        if (!Array.isArray(history) || history.length === 0) return 'None';
        const lastOutcome = String(history[history.length - 1] && history[history.length - 1].outcome || '').toLowerCase();
        if (lastOutcome !== 'loss') return 'None';
        let losses = 0;
        for (let index = history.length - 1; index >= 0; index--) {
            if (String(history[index] && history[index].outcome || '').toLowerCase() !== 'loss') break;
            losses++;
        }
        return losses + ' Loss' + (losses === 1 ? '' : 'es');
    }

    function getStyle(fighter) {
        const pin = Math.max(0, numberOrZero(fighter.win_pinfall) || numberOrZero(fighter.pin_wins));
        const ko = Math.max(0, numberOrZero(fighter.win_ko) || numberOrZero(fighter.ko_wins));
        const sub = Math.max(0, numberOrZero(fighter.win_submission) || numberOrZero(fighter.sub_wins));
        if (ko > pin && ko >= sub) return { code: 'KO', icon: '💥' };
        if (sub > pin && sub > ko) return { code: 'SUB', icon: '🔒' };
        return { code: 'PIN', icon: '🎯' };
    }

    function getRarity(fighter) {
        const rank = getRank(fighter);
        if (rank && rank.rank === 'C') return 'champion';
        if (getWinStreak(fighter) >= 26) return 'mythic';
        if (rank && rank.rankNumber >= 1 && rank.rankNumber <= 15) return 'contender';
        return 'standard';
    }

    function getPortraitValue(fighter) {
        const key = normalizeLookupKey(fighter.name);
        const portraitMap = window.wwe2k24PortraitMapNormalized || {};
        return fighter.photo || fighter.image || fighter.profile_pic || portraitMap[key] || '';
    }

    function getFallbackInitials(name) {
        const cleanedName = String(name || '').trim().replace(/^[\s"'“”‘’]+/, '');
        const parts = cleanedName.split(/\s+/).filter(Boolean);
        const initials = parts.length > 1
            ? parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
            : (parts[0] || '?').charAt(0);
        return initials.toUpperCase();
    }

    function setArtFallbackVisible(image, visible) {
        const fallback = image && image.parentElement && image.parentElement.querySelector('.art-fallback');
        if (!fallback) return;
        fallback.hidden = !visible;
        fallback.style.display = visible ? 'grid' : 'none';
    }

    function createImageUrl(value) {
        if (value instanceof Blob) {
            const url = URL.createObjectURL(value);
            state.objectUrls.add(url);
            return url;
        }
        return typeof value === 'string' ? value : '';
    }

    function cardStats(fighter) {
        const pin = numberOrZero(fighter.win_pinfall ?? fighter.pin_wins);
        const ko = numberOrZero(fighter.win_ko ?? fighter.ko_wins);
        const sub = numberOrZero(fighter.win_submission ?? fighter.sub_wins);
        const titleFights = numberOrZero(fighter.total_title_fights ?? fighter.title_fights);
        const defenses = numberOrZero(fighter.lifetime_defenses);
        return [
            ['Wins', fighter.wins],
            ['Losses', fighter.losses],
            ['Active Streak', getActiveStreakLabel(fighter)],
            ['PIN Wins', pin],
            ['KO Wins', ko],
            ['SUB Wins', sub],
            ['Total Title Fights', titleFights],
            ['Lifetime Title Defenses', defenses]
        ];
    }

    function renderCard(fighter) {
        const key = normalizeLookupKey(fighter.name);
        const rank = getRank(fighter);
        const rankLabel = rank ? rank.rank : 'NR';
        const rankClass = rank && rank.rank === 'C' ? 'is-champion' : rank ? 'is-contender' : '';
        const style = getStyle(fighter);
        const rarity = getRarity(fighter);
        const giantKills = Math.max(0, Math.floor(numberOrZero(fighter.giant_kills)));
        const giantKillerBadgeMarkup = giantKills > 0
            ? `<span class="giant-killer-badge">⚔️ GIANT KILLER${giantKills > 1 ? ` (${giantKills}x)` : ''}</span>`
            : '';
        const customRender = state.renders.get(key);
        const imageSource = customRender ? createImageUrl(customRender.image) : createImageUrl(getPortraitValue(fighter));
        const statsMarkup = cardStats(fighter).map(([label, value]) =>
            `<div class="stat-cell"><span class="stat-label">${escapeHtml(label)}</span><strong class="stat-value">${escapeHtml(value)}</strong></div>`
        ).join('');
        const imageMarkup = `<img data-card-image data-render-key="${escapeHtml(key)}" data-fighter-name="${escapeHtml(fighter.name)}"${imageSource ? ` src="${escapeHtml(imageSource)}"` : ''} alt="${escapeHtml(fighter.name)} portrait" loading="lazy">`;
        const artFallback = `<span class="art-fallback"${imageSource ? ' hidden style="display:none"' : ''} aria-hidden="true">${escapeHtml(getFallbackInitials(fighter.name))}</span>`;

        return `<article class="trading-card foil-${rarity}" data-fighter-key="${escapeHtml(key)}" data-fighter-name="${escapeHtml(fighter.name)}" tabindex="0" role="group" aria-label="${escapeHtml(fighter.name)} trading card. Press Enter to flip for stats.">
            <div class="card-inner">
                <div class="card-face card-front">
                    <div class="card-badges">
                        <span class="rank-badge ${rankClass}">${escapeHtml(rankLabel)}</span>
                        <span class="style-badge"><span aria-hidden="true">${style.icon}</span>${style.code}</span>
                    </div>
                    <div class="card-art">${imageMarkup}${artFallback}</div>
                    <div class="card-nameplate">
                        <div class="fighter-copy">
                            <strong class="fighter-name" title="${escapeHtml(fighter.name)}">${escapeHtml(fighter.name)}</strong>
                            <span class="fighter-division">${escapeHtml(fighter.division)} · ${fighter.gender === 'female' ? 'Women' : 'Men'}</span>
                            <span class="fighter-record">${fighter.wins} W - ${fighter.losses} L</span>
                        </div>
                        <button class="upload-button" type="button" data-upload-key="${escapeHtml(key)}" data-fighter-name="${escapeHtml(fighter.name)}">📸 Upload Torso Render</button>
                    </div>
                </div>
                <div class="card-face card-back">
                    <h3 class="back-heading">${escapeHtml(fighter.name)}</h3>
                    <p class="back-subheading">Career Stat Sheet · ${escapeHtml(rankLabel)} · ${escapeHtml(rarity)} foil</p>
                    <div class="back-achievement-row">
                        <span class="back-style-badge"><span aria-hidden="true">${style.icon}</span>${escapeHtml(style.code)} ARTIST</span>
                        ${giantKillerBadgeMarkup}
                    </div>
                    <div class="stat-sheet">${statsMarkup}</div>
                </div>
            </div>
        </article>`;
    }

    function updateVisibleCards() {
        const query = searchInput.value.trim().toLowerCase();
        const gender = genderFilter.value;
        const rankedOnly = rankFilter.value === 'ranked';
        const foilOnly = foilFilter.value === 'foil';
        const filtered = state.fighters.filter(fighter => {
            const rank = getRank(fighter);
            const fighterGender = /^(f|female|w|woman|women)/.test(fighter.gender) ? 'women' : 'men';
            const rarity = getRarity(fighter);
            return (!query || fighter.name.toLowerCase().includes(query)) &&
                (gender === 'all' || fighterGender === gender) &&
                (!rankedOnly || Boolean(rank)) &&
                (!foilOnly || rarity === 'champion' || rarity === 'mythic');
        });
        state.objectUrls.forEach(url => URL.revokeObjectURL(url));
        state.objectUrls.clear();
        state.renderLookups.clear();
        if (renderObserver) renderObserver.disconnect();
        grid.innerHTML = filtered.length
            ? filtered.map(renderCard).join('')
            : '<p class="empty-state">No fighters match these filters.</p>';
        visibleCount.textContent = filtered.length + ' shown';
        collectionCount.textContent = state.fighters.length + ' active fighters';
        grid.querySelectorAll('[data-card-image]').forEach(image => {
            image.addEventListener('load', () => {
                setArtFallbackVisible(image, false);
            }, { once: true });
            image.addEventListener('error', () => {
                image.hidden = true;
                setArtFallbackVisible(image, true);
            }, { once: true });
            if (image.complete) {
                if (image.naturalWidth > 0) {
                    setArtFallbackVisible(image, false);
                } else if (image.currentSrc) {
                    image.hidden = true;
                    setArtFallbackVisible(image, true);
                }
            }
        });
        if ('IntersectionObserver' in window) {
            renderObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    renderObserver.unobserve(entry.target);
                    loadCardImages(entry.target);
                });
            }, { rootMargin: '200px' });
            grid.querySelectorAll('.trading-card').forEach(card => renderObserver.observe(card));
        } else {
            grid.querySelectorAll('.trading-card').forEach(loadCardImages);
        }
    }

    function getDatabase() {
        if (!cardsDatabasePromise) {
            cardsDatabasePromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DATABASE_NAME, 1);
                request.onupgradeneeded = () => {
                    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    }
                };
                request.onsuccess = () => {
                    request.result.onversionchange = () => {
                        request.result.close();
                        cardsDatabasePromise = null;
                    };
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error || new Error('Unable to open Trading Cards IndexedDB.'));
                request.onblocked = () => reject(new Error('Trading Cards IndexedDB is blocked by another open tab.'));
            });
        }
        return cardsDatabasePromise;
    }

    function saveRender(key, name, image) {
        return getDatabase().then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).put({
                key,
                name,
                image,
                updatedAt: new Date().toISOString()
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error || new Error('Unable to save the torso render.'));
            transaction.onabort = () => reject(transaction.error || new Error('Saving the torso render was aborted.'));
        }));
    }

    function openExistingPortraitDatabase() {
        return new Promise(resolve => {
            let createdByThisOpen = false;
            const request = indexedDB.open(PHOTO_DATABASE_NAME);
            request.onupgradeneeded = () => {
                createdByThisOpen = true;
                request.transaction.abort();
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                if (createdByThisOpen && request.error && request.error.name === 'AbortError') {
                    resolve(null);
                    return;
                }
                console.error('Unable to open the existing roster portrait database.', request.error);
                resolve(null);
            };
        });
    }

    function getPortraitDatabase() {
        if (!portraitDatabasePromise) portraitDatabasePromise = openExistingPortraitDatabase();
        return portraitDatabasePromise;
    }

    function readRosterPortrait(photoKey) {
        return getPortraitDatabase().then(db => {
            if (!db || !db.objectStoreNames.contains(PHOTO_STORE_NAME)) return null;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(PHOTO_STORE_NAME, 'readonly');
                const request = transaction.objectStore(PHOTO_STORE_NAME).get(photoKey);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error || new Error('Unable to read a Master Roster portrait.'));
                transaction.onabort = () => reject(transaction.error || new Error('Reading a Master Roster portrait was aborted.'));
            });
        });
    }

    function setCardImage(image, value) {
        if (!image || !value || !image.isConnected) return;
        image.hidden = false;
        image.src = createImageUrl(value);
        setArtFallbackVisible(image, false);
    }

    function loadCardImages(card) {
        const image = card.querySelector('[data-card-image]');
        if (!image) return;
        const key = image.dataset.renderKey;
        const fighterName = image.dataset.fighterName;
        const fighter = state.fighters.find(item => item.name === fighterName);
        if (!fighter) return;
        const savedRender = state.renders.get(key);
        if (savedRender) {
            setCardImage(image, savedRender.image);
            return;
        }
        let renderRequest = state.renderLookups.get(key);
        if (!renderRequest) {
            renderRequest = getDatabase().then(db => new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const request = transaction.objectStore(STORE_NAME).get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error || new Error('Unable to read a saved torso render.'));
                transaction.onabort = () => reject(transaction.error || new Error('Reading a saved torso render was aborted.'));
            }));
            state.renderLookups.set(key, renderRequest);
        }
        renderRequest.then(async render => {
            if (render) {
                state.renders.set(key, render);
                setCardImage(image, render.image);
                return;
            }
            if (getPortraitValue(fighter)) return;
            const photoKey = fighter.photo_key || fighter.photoKey || ('wwe2k24-' + key);
            const portrait = await readRosterPortrait(String(photoKey));
            if (portrait) setCardImage(image, portrait);
        }).catch(error => {
            console.error('Unable to load a Trading Card portrait.', error);
        });
    }

    function getCropGeometry() {
        const rect = cropViewport.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const baseScale = Math.max(width / state.crop.width, height / state.crop.height);
        const scale = baseScale * state.crop.zoom;
        const displayWidth = state.crop.width * scale;
        const displayHeight = state.crop.height * scale;
        return { width, height, scale, displayWidth, displayHeight };
    }

    function clampCropPosition() {
        const geometry = getCropGeometry();
        state.crop.x = Math.min(0, Math.max(geometry.width - geometry.displayWidth, state.crop.x));
        state.crop.y = Math.min(0, Math.max(geometry.height - geometry.displayHeight, state.crop.y));
        cropImage.style.width = geometry.displayWidth + 'px';
        cropImage.style.height = geometry.displayHeight + 'px';
        cropImage.style.left = state.crop.x + 'px';
        cropImage.style.top = state.crop.y + 'px';
    }

    function openCropper(file, fighter) {
        if (!file || !file.type.startsWith('image/')) {
            cropperStatus.textContent = 'Choose a supported image file.';
            return;
        }
        if (state.crop && state.crop.objectUrl) URL.revokeObjectURL(state.crop.objectUrl);
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            state.crop = {
                fighter,
                objectUrl,
                width: image.naturalWidth,
                height: image.naturalHeight,
                zoom: 1,
                x: 0,
                y: 0
            };
            cropImage.src = objectUrl;
            cropImage.onload = () => {
                const geometry = getCropGeometry();
                state.crop.x = (geometry.width - geometry.displayWidth) / 2;
                state.crop.y = (geometry.height - geometry.displayHeight) / 2;
                clampCropPosition();
            };
            cropperStatus.textContent = '';
            saveCropButton.disabled = false;
            cropZoom.value = '1';
            cropModal.hidden = false;
            document.getElementById('cancelCrop').focus();
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            cropperStatus.textContent = 'The selected image could not be opened.';
        };
        image.src = objectUrl;
    }

    function closeCropper() {
        if (saveCropButton.disabled) return;
        cropModal.hidden = true;
        cropImage.removeAttribute('src');
        if (state.crop && state.crop.objectUrl) URL.revokeObjectURL(state.crop.objectUrl);
        state.crop = null;
        imageInput.value = '';
    }

    function saveCroppedRender() {
        if (!state.crop) return;
        const geometry = getCropGeometry();
        const sourceX = -state.crop.x / geometry.scale;
        const sourceY = -state.crop.y / geometry.scale;
        const sourceWidth = geometry.width / geometry.scale;
        const sourceHeight = geometry.height / geometry.scale;
        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 1200;
        const context = canvas.getContext('2d');
        if (!context) {
            cropperStatus.textContent = 'Your browser could not create the cropped image.';
            return;
        }
        context.drawImage(cropImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        saveCropButton.disabled = true;
        cancelCropButton.disabled = true;
        cropperStatus.textContent = 'Saving render to IndexedDB…';
        canvas.toBlob(async blob => {
            if (!blob) {
                saveCropButton.disabled = false;
                cancelCropButton.disabled = false;
                cropperStatus.textContent = 'The cropped image could not be encoded.';
                return;
            }
            const fighter = state.crop.fighter;
            const key = normalizeLookupKey(fighter.name);
            try {
                await saveRender(key, fighter.name, blob);
                state.renders.set(key, { key, name: fighter.name, image: blob });
                saveCropButton.disabled = false;
                cancelCropButton.disabled = false;
                closeCropper();
                pageStatus.textContent = fighter.name + ' torso render saved in IndexedDB.';
                pageStatus.classList.remove('status-error');
                updateVisibleCards();
            } catch (error) {
                console.error('Unable to save the Trading Card render.', error);
                saveCropButton.disabled = false;
                cancelCropButton.disabled = false;
                cropperStatus.textContent = 'Save failed: ' + error.message;
            }
        }, 'image/jpeg', 0.9);
    }

    function flipCard(card) {
        const flipped = card.classList.toggle('is-flipped');
        card.setAttribute('aria-label', card.dataset.fighterName + ' trading card. ' + (flipped ? 'Showing stats. Press Enter to flip back.' : 'Press Enter to flip for stats.'));
    }

    grid.addEventListener('click', event => {
        const uploadButton = event.target.closest('[data-upload-key]');
        if (uploadButton) {
            event.stopPropagation();
            const fighter = state.fighters.find(item => item.name === uploadButton.dataset.fighterName);
            if (fighter) {
                imageInput.dataset.fighterName = uploadButton.dataset.fighterName;
                imageInput.click();
            }
            return;
        }
        const card = event.target.closest('.trading-card');
        if (card) flipCard(card);
    });

    grid.addEventListener('keydown', event => {
        if (event.target.closest('[data-upload-key]')) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const card = event.target.closest('.trading-card');
        if (!card) return;
        event.preventDefault();
        flipCard(card);
    });

    imageInput.addEventListener('change', () => {
        const fighter = state.fighters.find(item => item.name === imageInput.dataset.fighterName);
        if (fighter && imageInput.files && imageInput.files[0]) openCropper(imageInput.files[0], fighter);
    });

    searchInput.addEventListener('input', updateVisibleCards);
    genderFilter.addEventListener('change', updateVisibleCards);
    rankFilter.addEventListener('change', updateVisibleCards);
    foilFilter.addEventListener('change', updateVisibleCards);
    cancelCropButton.addEventListener('click', closeCropper);
    saveCropButton.addEventListener('click', saveCroppedRender);
    cropZoom.addEventListener('input', () => {
        if (!state.crop) return;
        const geometry = getCropGeometry();
        const sourceCenterX = (geometry.width / 2 - state.crop.x) / geometry.scale;
        const sourceCenterY = (geometry.height / 2 - state.crop.y) / geometry.scale;
        state.crop.zoom = Number(cropZoom.value);
        const nextGeometry = getCropGeometry();
        state.crop.x = nextGeometry.width / 2 - sourceCenterX * nextGeometry.scale;
        state.crop.y = nextGeometry.height / 2 - sourceCenterY * nextGeometry.scale;
        clampCropPosition();
    });

    let pointerDrag = null;
    cropViewport.addEventListener('pointerdown', event => {
        if (!state.crop) return;
        pointerDrag = { x: event.clientX, y: event.clientY, cropX: state.crop.x, cropY: state.crop.y };
        cropViewport.setPointerCapture(event.pointerId);
    });
    cropViewport.addEventListener('pointermove', event => {
        if (!pointerDrag || !state.crop) return;
        state.crop.x = pointerDrag.cropX + event.clientX - pointerDrag.x;
        state.crop.y = pointerDrag.cropY + event.clientY - pointerDrag.y;
        clampCropPosition();
    });
    cropViewport.addEventListener('pointerup', () => { pointerDrag = null; });
    cropViewport.addEventListener('pointercancel', () => { pointerDrag = null; });
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !cropModal.hidden && !saveCropButton.disabled) closeCropper();
    });

    window.addEventListener('storage', event => {
        if (event.key === 'wwe_fighters' || event.key === 'fighters' || event.key === 'wwe_titles') {
            initializeCollection().catch(error => {
                console.error('Unable to refresh Trading Cards.', error);
                pageStatus.textContent = 'Could not refresh the collection. See the browser console for details.';
                pageStatus.classList.add('status-error');
            });
        }
    });

    window.addEventListener('wwe_fighters:changed', () => {
        initializeCollection().catch(error => {
            console.error('Unable to refresh Trading Cards.', error);
            pageStatus.textContent = 'Could not refresh the collection. See the browser console for details.';
            pageStatus.classList.add('status-error');
        });
    });

    async function initializeCollection() {
        state.fighters = loadFighters();
        state.ranks.clear();
        if (typeof window.getDivisionRankings === 'function') {
            window.getDivisionRankings().forEach(group => {
                group.rankings.forEach(entry => {
                    state.ranks.set(normalizeLookupKey(entry.fighter.name), entry);
                });
            });
        }
        await getDatabase();
        updateVisibleCards();
        pageStatus.textContent = rosterReadError
            ? 'Roster data could not be read; see the browser console.'
            : state.fighters.length ? '' : 'No active fighters found in the Master Roster.';
        pageStatus.classList.toggle('status-error', rosterReadError);
    }

    (async function initialize() {
        try {
            await getDatabase();
            state.fighters = loadFighters();
            if (typeof window.getDivisionRankings === 'function') {
                window.getDivisionRankings().forEach(group => {
                    group.rankings.forEach(entry => state.ranks.set(normalizeLookupKey(entry.fighter.name), entry));
                });
            }
            updateVisibleCards();
            pageStatus.textContent = rosterReadError
                ? 'Roster data could not be read; see the browser console.'
                : state.fighters.length ? '' : 'No active fighters found in the Master Roster.';
            pageStatus.classList.toggle('status-error', rosterReadError);
        } catch (error) {
            console.error('Unable to initialize the Trading Cards collection.', error);
            pageStatus.textContent = 'Trading Cards could not load: ' + error.message;
            pageStatus.classList.add('status-error');
        }
    })();
})();
