(() => {
    'use strict';

    const STAGED_FIGHTERS_KEY = 'wwe_staged_fighters';
    const ROSTER_KEY = 'wwe_fighters';
    const LEGACY_ROSTER_KEY = 'fighters';
    const form = document.getElementById('stagedFighterForm');
    const grid = document.getElementById('stagedFighterGrid');
    const count = document.getElementById('stagedFighterCount');
    const status = document.getElementById('stagingStatus');
    const photoInput = document.getElementById('stagedFighterPhotoFile');
    const photoPreview = document.getElementById('stagedFighterPhotoPreview');
    const photoStatus = document.getElementById('stagedFighterPhotoStatus');
    let stagedPhoto = '';

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function parseArray(raw, key) {
        if (raw === null) return [];
        let value;
        try {
            value = JSON.parse(raw);
        } catch (error) {
            console.error(`Unable to read ${key}; no staging changes were made.`, error);
            throw new Error(`Saved ${key} data is invalid. No changes were made.`);
        }
        if (!Array.isArray(value)) {
            console.error(`Saved ${key} data is not an array; no staging changes were made.`);
            throw new Error(`Saved ${key} data has an unexpected format. No changes were made.`);
        }
        return value;
    }

    function readStagedFighters() {
        const stagedFighters = parseArray(localStorage.getItem(STAGED_FIGHTERS_KEY), STAGED_FIGHTERS_KEY);
        if (stagedFighters.some(fighter => !fighter || typeof fighter !== 'object' || Array.isArray(fighter))) {
            throw new Error('Saved staging pool contains an invalid entry. No changes were made.');
        }
        return stagedFighters;
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function renderStagedFighters() {
        try {
            const stagedFighters = readStagedFighters();
            count.textContent = `${stagedFighters.length} ${stagedFighters.length === 1 ? 'fighter' : 'fighters'}`;
            grid.replaceChildren();

            if (stagedFighters.length === 0) {
                grid.appendChild(makeElement('p', 'empty-state', 'No future talent staged yet. Use the form above to add a fighter.'));
                return;
            }

            stagedFighters.forEach(fighter => {
                const card = makeElement('article', 'talent-card');
                const photo = makeElement('div', 'talent-photo');
                const name = String(fighter.name || 'Unnamed Fighter');
                const photoUrl = typeof fighter.photo === 'string' ? fighter.photo.trim() : '';

                if (photoUrl) {
                    const image = document.createElement('img');
                    image.src = photoUrl;
                    image.alt = `${name} profile`;
                    image.referrerPolicy = 'no-referrer';
                    image.addEventListener('error', () => {
                        photo.replaceChildren(document.createTextNode(name.charAt(0).toUpperCase() || '?'));
                    }, { once: true });
                    photo.appendChild(image);
                } else {
                    photo.textContent = name.charAt(0).toUpperCase() || '?';
                }

                card.append(
                    photo,
                    makeElement('h4', 'talent-name', name),
                    makeElement('span', 'talent-meta', `${String(fighter.division || 'Unassigned')} · ${String(fighter.gender || 'Unspecified')}`)
                );

                const graduateButton = makeElement('button', 'graduate-button', '🚀 Move to Main Roster');
                graduateButton.type = 'button';
                graduateButton.addEventListener('click', () => graduateFighter(fighter.id));
                card.appendChild(graduateButton);
                grid.appendChild(card);
            });
        } catch (error) {
            grid.replaceChildren(makeElement('p', 'empty-state', error.message));
            count.textContent = 'Unavailable';
            showStatus(error.message, true);
        }
    }

    function makeFighterId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `f-${crypto.randomUUID()}`;
        }
        return `f-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizePhotoUrl(value) {
        const url = String(value || '').trim();
        if (!url) return '';
        if (/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(url)) return url;
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Profile image URL must use HTTP or HTTPS.');
        }
        return parsed.href;
    }

    function openStagedPhotoCropDialog(imageSrc) {
        document.getElementById('photoCropDialog')?.remove();

        const dialog = document.createElement('div');
        dialog.id = 'photoCropDialog';
        dialog.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:5000; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
        dialog.innerHTML = `
            <div style="background:white; border-radius:12px; padding:20px; max-width:500px; width:90%; max-height:95vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 16px 0; color:#0f172a; font-weight:800;">Crop Fighter Photo</h3>
                <div style="position:relative; width:100%; height:300px; background:#f1f5f9; border-radius:8px; overflow:hidden; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
                    <img id="cropImagePreview" style="max-width:100%; max-height:100%; cursor:grab; user-select:none; object-fit:contain;" draggable="false">
                    <div id="cropFrame" style="position:absolute; width:200px; height:200px; border:2px dashed rgba(0,0,0,0.25); box-shadow:0 6px 16px rgba(0,0,0,0.15); border-radius:8px; pointer-events:none;"></div>
                </div>
                <div style="display:flex; gap:12px; align-items:center; margin-bottom:16px; flex-wrap:wrap;">
                    <div style="position:relative; width:150px; height:150px; border:2px solid #0284c7; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f8fafc;">
                        <canvas id="cropCircleCanvas" width="150" height="150" style="width:150px; height:150px; display:block; border-radius:50%;"></canvas>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div style="font-size:0.85rem; font-weight:700; color:#0f172a;">Avatar Preview</div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <div style="width:44px; height:44px; border-radius:50%; overflow:hidden; background:#fff; display:flex; align-items:center; justify-content:center;"><canvas id="cropSmallCanvas" width="44" height="44" style="width:44px; height:44px; border-radius:50%; display:block;"></canvas></div>
                            <div style="width:72px; height:72px; border-radius:50%; overflow:hidden; background:#fff; display:flex; align-items:center; justify-content:center;"><canvas id="cropMediumCanvas" width="72" height="72" style="width:72px; height:72px; border-radius:50%; display:block;"></canvas></div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:8px; font-size:0.75rem; color:#64748b; margin-bottom:16px; align-items:center;">
                    <span>📏 Position:</span>
                    <input type="range" id="cropOffsetX" min="-800" max="800" value="0" aria-label="Horizontal crop position" style="flex:1; min-width:70px;">
                    <input type="range" id="cropOffsetY" min="-800" max="800" value="0" aria-label="Vertical crop position" style="flex:1; min-width:70px;">
                    <input type="range" id="cropZoom" min="10" max="400" value="100" aria-label="Crop zoom" style="flex:1; min-width:70px;">
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="button" id="saveStagedCropButton" style="flex:1; background:#10b981; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✓ Save Photo</button>
                    <button type="button" id="cancelStagedCropButton" style="flex:1; background:#ef4444; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✕ Cancel</button>
                </div>
            </div>`;
        document.body.appendChild(dialog);

        const previewImg = dialog.querySelector('#cropImagePreview');
        const circleCanvas = dialog.querySelector('#cropCircleCanvas');
        const smallCanvas = dialog.querySelector('#cropSmallCanvas');
        const mediumCanvas = dialog.querySelector('#cropMediumCanvas');
        const offsetXSlider = dialog.querySelector('#cropOffsetX');
        const offsetYSlider = dialog.querySelector('#cropOffsetY');
        const zoomSlider = dialog.querySelector('#cropZoom');
        const srcImage = new Image();
        let isGrabbing = false;
        let grabStartX = 0;
        let grabStartY = 0;

        const drawPreviewToCanvas = (canvas, size) => {
            if (!srcImage.naturalWidth) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
            ctx.clip();

            const offsetX = parseInt(offsetXSlider.value, 10) || 0;
            const offsetY = parseInt(offsetYSlider.value, 10) || 0;
            const zoom = parseInt(zoomSlider.value, 10) || 100;
            const factor = size / 200;
            const scaledWidth = srcImage.naturalWidth * (zoom / 100) * factor;
            const scaledHeight = srcImage.naturalHeight * (zoom / 100) * factor;
            const x = size / 2 - scaledWidth / 2 + offsetX * factor;
            const y = size / 2 - scaledHeight / 2 + offsetY * factor;
            ctx.drawImage(srcImage, x, y, scaledWidth, scaledHeight);
            ctx.restore();
        };

        const updatePreview = () => {
            const frame = dialog.querySelector('#cropFrame');
            if (frame) {
                frame.style.left = `calc(50% - ${frame.offsetWidth / 2}px)`;
                frame.style.top = `calc(50% - ${frame.offsetHeight / 2}px)`;
            }
            if (srcImage.complete && srcImage.naturalWidth) {
                drawPreviewToCanvas(circleCanvas, 150);
                drawPreviewToCanvas(smallCanvas, 44);
                drawPreviewToCanvas(mediumCanvas, 72);
            }
        };

        previewImg.addEventListener('mousedown', event => {
            isGrabbing = true;
            grabStartX = event.clientX;
            grabStartY = event.clientY;
            previewImg.style.cursor = 'grabbing';
            event.preventDefault();
        });
        const moveCrop = event => {
            if (!isGrabbing) return;
            const deltaX = event.clientX - grabStartX;
            const deltaY = event.clientY - grabStartY;
            offsetXSlider.value = Math.max(-800, Math.min(800, (parseInt(offsetXSlider.value, 10) || 0) + deltaX));
            offsetYSlider.value = Math.max(-800, Math.min(800, (parseInt(offsetYSlider.value, 10) || 0) + deltaY));
            grabStartX = event.clientX;
            grabStartY = event.clientY;
            updatePreview();
        };
        const stopCropDrag = () => {
            isGrabbing = false;
            previewImg.style.cursor = 'grab';
        };
        dialog.addEventListener('mousemove', moveCrop);
        dialog.addEventListener('mouseup', stopCropDrag);
        dialog.addEventListener('mouseleave', stopCropDrag);
        [offsetXSlider, offsetYSlider, zoomSlider].forEach(slider => slider.addEventListener('input', updatePreview));
        dialog.querySelector('#saveStagedCropButton').addEventListener('click', () => saveStagedCroppedPhoto(srcImage, dialog));
        dialog.querySelector('#cancelStagedCropButton').addEventListener('click', () => dialog.remove());
        previewImg.addEventListener('error', () => {
            dialog.remove();
            photoStatus.textContent = 'Unable to load that image. Choose a different file.';
        }, { once: true });

        previewImg.src = imageSrc;
        srcImage.onload = () => {
            const initialZoom = Math.max(10, Math.min(200, Math.round((300 / srcImage.naturalHeight) * 100)));
            zoomSlider.value = initialZoom;
            offsetXSlider.value = 0;
            offsetYSlider.value = 0;
            updatePreview();
        };
        srcImage.onerror = () => {
            dialog.remove();
            photoStatus.textContent = 'Unable to load that image. Choose a different file.';
        };
        srcImage.src = imageSrc;
    }

    function saveStagedCroppedPhoto(srcImage, dialog) {
        if (!srcImage.naturalWidth) {
            showStatus('Wait for the image to finish loading before saving the crop.', true);
            return;
        }

        try {
            const offsetX = parseInt(dialog.querySelector('#cropOffsetX').value, 10) || 0;
            const offsetY = parseInt(dialog.querySelector('#cropOffsetY').value, 10) || 0;
            const zoom = parseInt(dialog.querySelector('#cropZoom').value, 10) || 100;
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Image cropping is unavailable in this browser.');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 200, 200);
            ctx.beginPath();
            ctx.arc(100, 100, 100, 0, Math.PI * 2);
            ctx.clip();
            const scale = zoom / 100;
            const scaledWidth = srcImage.naturalWidth * scale;
            const scaledHeight = srcImage.naturalHeight * scale;
            ctx.drawImage(srcImage, 100 - scaledWidth / 2 + offsetX, 100 - scaledHeight / 2 + offsetY, scaledWidth, scaledHeight);

            stagedPhoto = canvas.toDataURL('image/jpeg', 0.8);
            photoPreview.replaceChildren();
            const image = document.createElement('img');
            image.src = stagedPhoto;
            image.alt = 'Cropped profile picture preview';
            photoPreview.appendChild(image);
            photoStatus.textContent = 'Cropped profile picture ready.';
            dialog.remove();
            showStatus('Cropped photo ready. Add the fighter to save it to staging.');
        } catch (error) {
            console.error('Unable to crop staged fighter image.', error);
            showStatus(error instanceof Error ? error.message : 'Unable to crop this image.', true);
        }
    }

    function handleStagedPhotoFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            photoInput.value = '';
            photoStatus.textContent = 'Choose a valid image file.';
            showStatus('Choose a valid image file.', true);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                showStatus('Unable to read that image file.', true);
                return;
            }
            photoInput.value = '';
            photoStatus.textContent = 'Adjust the crop and save the photo.';
            openStagedPhotoCropDialog(reader.result);
        };
        reader.onerror = () => {
            console.error('Unable to read staged fighter image.', reader.error);
            showStatus('Unable to read that image file.', true);
        };
        reader.readAsDataURL(file);
    }

    function addStagedFighter(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const gender = String(formData.get('gender') || '');
        const division = String(formData.get('division') || '');

        if (!name) {
            showStatus('Enter a fighter name.', true);
            return;
        }
        if (!['male', 'female'].includes(gender) ||
            !['Cruiserweight', 'Light Heavyweight', 'Heavyweight', 'Super Heavyweight'].includes(division)) {
            showStatus('Choose a valid gender and weight class.', true);
            return;
        }

        try {
            const photo = stagedPhoto || '';
            const stagedFighters = readStagedFighters();
            stagedFighters.push({
                id: makeFighterId(),
                name,
                gender,
                division,
                photo
            });
            localStorage.setItem(STAGED_FIGHTERS_KEY, JSON.stringify(stagedFighters));
            form.reset();
            stagedPhoto = '';
            photoPreview.textContent = '?';
            photoStatus.textContent = 'Choose a picture to crop it.';
            showStatus(`${name} added to the staging pool.`);
            renderStagedFighters();
        } catch (error) {
            console.error('Unable to stage future fighter.', error);
            showStatus(error instanceof Error ? error.message : 'Unable to save staged fighter.', true);
        }
    }

    function restoreStorageValue(key, originalValue) {
        if (originalValue === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, originalValue);
        }
    }

    function graduateFighter(fighterId) {
        if (!fighterId) {
            showStatus('This staged fighter has no ID and cannot be moved.', true);
            return;
        }

        let previousRosterValue = null;
        let previousStagedValue = null;
        let rosterWritten = false;
        let stagedWritten = false;

        try {
            previousRosterValue = localStorage.getItem(ROSTER_KEY);
            const previousLegacyValue = localStorage.getItem(LEGACY_ROSTER_KEY);
            previousStagedValue = localStorage.getItem(STAGED_FIGHTERS_KEY);
            const stagedFighters = readStagedFighters();
            const stagedIndex = stagedFighters.findIndex(fighter => fighter && fighter.id === fighterId);
            if (stagedIndex < 0) {
                throw new Error('This staged fighter was not found. Refresh the page and try again.');
            }

            const [stagedFighter] = stagedFighters.splice(stagedIndex, 1);
            const rosterSource = previousRosterValue === null ? previousLegacyValue : previousRosterValue;
            const roster = parseArray(rosterSource, previousRosterValue === null ? LEGACY_ROSTER_KEY : ROSTER_KEY);
            if (stagedFighter.id && roster.some(fighter => fighter && fighter.id === stagedFighter.id)) {
                throw new Error('This fighter is already in the main roster.');
            }

            const gender = String(stagedFighter.gender || 'male').toLowerCase();
            const division = String(stagedFighter.division || 'Heavyweight');
            const name = String(stagedFighter.name || '').trim();
            if (!name) {
                throw new Error('This staged fighter has no name and cannot be moved.');
            }
            if (!['male', 'female'].includes(gender) ||
                !['Cruiserweight', 'Light Heavyweight', 'Heavyweight', 'Super Heavyweight'].includes(division)) {
                throw new Error('This staged fighter has an invalid gender or weight class.');
            }

            const graduatedFighter = {
                id: stagedFighter.id || makeFighterId(),
                name,
                gender,
                division,
                photo: normalizePhotoUrl(stagedFighter.photo),
                wins: 0,
                losses: 0,
                win_streak: 0,
                total_title_fights: 0,
                title_fights: 0,
                lifetime_defenses: 0,
                defenses: 0,
                win_pinfall: 0,
                win_ko: 0,
                win_submission: 0,
                retired: false
            };

            roster.push(graduatedFighter);
            localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
            rosterWritten = true;
            localStorage.setItem(STAGED_FIGHTERS_KEY, JSON.stringify(stagedFighters));
            stagedWritten = true;
            window.dispatchEvent(new CustomEvent('wwe_fighters:changed', {
                detail: { source: 'future_fighters.js', count: roster.length }
            }));
            showStatus(`${graduatedFighter.name} moved to the main roster.`);
            renderStagedFighters();
        } catch (error) {
            try {
                if (rosterWritten) restoreStorageValue(ROSTER_KEY, previousRosterValue);
                if (stagedWritten) restoreStorageValue(STAGED_FIGHTERS_KEY, previousStagedValue);
            } catch (rollbackError) {
                console.error('Failed to restore storage after an unsuccessful roster graduation.', rollbackError);
            }
            console.error('Unable to move staged fighter to the main roster.', error);
            showStatus(error instanceof Error ? error.message : 'Unable to graduate fighter.', true);
        }
    }

    photoInput.addEventListener('change', handleStagedPhotoFile);
    form.addEventListener('submit', addStagedFighter);
    renderStagedFighters();
})();
