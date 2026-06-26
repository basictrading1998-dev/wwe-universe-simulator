function loadFightersFromStorage() {
    const raw = localStorage.getItem('wwe_fighters') || localStorage.getItem('fighters');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(f => ({
            id: f.id || `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
            name: f.name || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'Unknown Fighter',
            gender: (f.gender || 'male').toString().toLowerCase(),
            division: f.division || f.weightClass || 'Heavyweight',
            wins: Number(f.wins || 0),
            losses: Number(f.losses || 0),
            defenses: Number(f.defenses || 0),
            title_fights: Number(f.title_fights || 0),
            win_pinfall: Number(f.win_pinfall || 0),
            win_ko: Number(f.win_ko || 0),
            win_submission: Number(f.win_submission || 0),
            photo: f.photo || '',
            photo_key: f.photo_key || '',
            compiled_history_deck: Array.isArray(f.compiled_history_deck) ? f.compiled_history_deck : Array.isArray(f.history_deck) ? f.history_deck : Array.isArray(f.history) ? f.history : [],
            history_deck: Array.isArray(f.history_deck) ? f.history_deck : [],
            history: Array.isArray(f.history) ? f.history : []
        }));
    } catch {
        return [];
    }
}

function saveFighters(list = fighters) {
    const payload = (list || []).map(f => {
        if (!f || typeof f !== 'object') return null;
        const normalized = { ...f };
        normalized.id = normalized.id || `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
        normalized.name = normalized.name || 'Unknown Fighter';
        normalized.gender = (normalized.gender || 'male').toString().toLowerCase();
        normalized.division = normalized.division || normalized.weightClass || 'Heavyweight';
        normalized.wins = Number(normalized.wins || 0);
        normalized.losses = Number(normalized.losses || 0);
        normalized.defenses = Number(normalized.defenses || 0);
        normalized.title_fights = Number(normalized.title_fights || 0);
        normalized.win_pinfall = Number(normalized.win_pinfall || 0);
        normalized.win_ko = Number(normalized.win_ko || 0);
        normalized.win_submission = Number(normalized.win_submission || 0);
        normalized.photo_key = normalized.photo_key || '';
        normalized.photo = normalized.photo_key ? '' : (normalized.photo || '');
        return normalized;
    }).filter(Boolean);
    localStorage.setItem('wwe_fighters', JSON.stringify(payload));
}

async function openFighterPhotoDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('wwe_fighter_photos', 1);
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('photos')) {
                db.createObjectStore('photos');
            }
        };
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        request.onerror = function(event) {
            reject(event.target.error || new Error('IndexedDB open failed'));
        };
    });
}

async function storeFighterPhotoInIDB(key, photoData) {
    const db = await openFighterPhotoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        const request = store.put(photoData, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error || new Error('Failed to save fighter photo in IndexedDB'));
    });
}

async function loadFighterPhotoFromIDB(key) {
    if (!key) return null;
    try {
        const db = await openFighterPhotoDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('photos', 'readonly');
            const store = tx.objectStore('photos');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('Failed to load fighter photo from IndexedDB'));
        });
    } catch (err) {
        return null;
    }
}

async function hydrateFighterPhotos() {
    await Promise.all(fighters.map(async (fighter) => {
        if (!fighter.photo && fighter.photo_key) {
            const photo = await loadFighterPhotoFromIDB(fighter.photo_key);
            if (photo) fighter.photo = photo;
        }
    }));
}

function buildWwePopupModal() {
    if (document.getElementById('wwePopupModal')) return;
    const modal = document.createElement('div');
    modal.id = 'wwePopupModal';
    modal.style.cssText = 'position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(15,23,42,0.65); backdrop-filter:blur(2px); z-index:99999; padding:20px;';
    modal.innerHTML = `
        <div id="wwePopupDialog" style="width:min(520px,100%); background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 24px 70px rgba(15,23,42,0.22); font-family:Inter,system-ui,sans-serif;">
            <div style="padding:24px 24px 18px 24px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                    <div>
                        <div id="wwePopupTitle" style="font-size:1.05rem; font-weight:800; color:#0f172a; margin-bottom:10px;">Notice</div>
                        <div id="wwePopupMessage" style="color:#475569; line-height:1.75; white-space:pre-wrap; font-size:0.95rem;"></div>
                    </div>
                    <button id="wwePopupClose" style="background:transparent; border:none; color:#64748b; font-size:1.4rem; line-height:1; cursor:pointer;">×</button>
                </div>
                <div id="wwePopupInputWrap" style="margin-top:18px; display:none;">
                    <input id="wwePopupInput" type="text" style="width:100%; padding:12px 14px; border:1px solid #cbd5e1; border-radius:14px; font-size:0.95rem; color:#0f172a; background:#f8fafc; outline:none;" />
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; padding:18px 20px 20px; background:#f8fafc; border-top:1px solid #e2e8f0;">
                <button id="wwePopupCancel" style="display:none; border:1px solid #cbd5e1; background:#ffffff; color:#475569; font-weight:700; padding:10px 16px; border-radius:14px; cursor:pointer;">Cancel</button>
                <button id="wwePopupConfirm" style="border:none; background:#0b74ff; color:white; font-weight:700; padding:10px 16px; border-radius:14px; cursor:pointer;">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('wwePopupClose');
    const cancelBtn = document.getElementById('wwePopupCancel');
    const confirmBtn = document.getElementById('wwePopupConfirm');

    closeBtn.onclick = () => {
        const onCancel = window._wwePopupCancel;
        const onConfirm = window._wwePopupConfirm;
        hideWwePopupModal();
        if (onCancel) {
            onCancel(false);
        } else if (onConfirm) {
            const input = document.getElementById('wwePopupInput');
            onConfirm(input ? input.value : true);
        }
    };
    cancelBtn.onclick = () => {
        const onCancel = window._wwePopupCancel;
        hideWwePopupModal();
        if (onCancel) onCancel(false);
    };
    confirmBtn.onclick = () => {
        const onConfirm = window._wwePopupConfirm;
        hideWwePopupModal();
        const input = document.getElementById('wwePopupInput');
        if (onConfirm) onConfirm(input ? input.value : true);
    };
    modal.onclick = (event) => {
        if (event.target === modal) {
            const onCancel = window._wwePopupCancel;
            const onConfirm = window._wwePopupConfirm;
            hideWwePopupModal();
            if (onCancel) {
                onCancel(false);
            } else if (onConfirm) {
                const input = document.getElementById('wwePopupInput');
                onConfirm(input ? input.value : true);
            }
        }
    };
}

function hideWwePopupModal() {
    const modal = document.getElementById('wwePopupModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    delete window._wwePopupConfirm;
    delete window._wwePopupCancel;
}

function showWwePopupModal(options) {
    buildWwePopupModal();
    const modal = document.getElementById('wwePopupModal');
    const titleEl = document.getElementById('wwePopupTitle');
    const messageEl = document.getElementById('wwePopupMessage');
    const cancelBtn = document.getElementById('wwePopupCancel');
    const confirmBtn = document.getElementById('wwePopupConfirm');
    const inputWrap = document.getElementById('wwePopupInputWrap');
    const inputEl = document.getElementById('wwePopupInput');

    titleEl.textContent = options.title || 'Notice';
    messageEl.textContent = options.message || '';
    confirmBtn.textContent = options.confirmText || 'OK';
    cancelBtn.textContent = options.cancelText || 'Cancel';
    cancelBtn.style.display = options.showCancel ? 'inline-flex' : 'none';
    inputWrap.style.display = options.showInput ? 'block' : 'none';

    if (options.showInput) {
        inputEl.value = options.inputValue || '';
        setTimeout(() => inputEl.focus(), 50);
    }

    window._wwePopupConfirm = options.onConfirm || function() {};
    window._wwePopupCancel = options.onCancel || function() {};
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function customAlert(message, title = 'Notice', callback = function() {}) {
    showWwePopupModal({
        title,
        message,
        showCancel: false,
        confirmText: 'OK',
        onConfirm: function() { callback(); }
    });
}

function customConfirm(message, callback, title = 'Confirm') {
    showWwePopupModal({
        title,
        message,
        showCancel: true,
        confirmText: 'Yes',
        cancelText: 'Cancel',
        onConfirm: function() { callback(true); },
        onCancel: function() { callback(false); }
    });
}

function customPrompt(message, defaultValue, callback, title = 'Input') {
    showWwePopupModal({
        title,
        message,
        showCancel: true,
        showInput: true,
        inputValue: defaultValue || '',
        confirmText: 'Save',
        cancelText: 'Cancel',
        onConfirm: function(value) { callback(value); },
        onCancel: function() { callback(null); }
    });
}

// === BETTING SYSTEM ===
function initBettingSystem() {
    const stored = localStorage.getItem('wwe_betting_money');
    if (stored === null || stored === '100000') {
        localStorage.setItem('wwe_betting_money', '1000'); // Start with $1,000
    }
}

function getBettingMoney() {
    return Number(localStorage.getItem('wwe_betting_money')) || 0;
}

function setBettingMoney(amount) {
    localStorage.setItem('wwe_betting_money', Math.max(0, amount).toString());
    updateBettingMoneyDisplay();
}

function updateBettingMoney(delta) {
    const current = getBettingMoney();
    setBettingMoney(current + delta);
}

function updateBettingMoneyDisplay() {
    const display = document.getElementById('betting-money-display');
    if (display) {
        display.textContent = `$${getBettingMoney().toLocaleString()}`;
    }
}

window.resetBettingMoney = function() {
    setBettingMoney(1000);
    customAlert('💵 Betting balance reset to $1,000.', 'Betting Reset');
}

// Store active bets for each match
let activeBets = {};

window.selectBetFighter = function(matchId, fighterSlot) {
    if (!window.bettingEnabled) return;
    if (!activeBets[matchId]) activeBets[matchId] = {};
    activeBets[matchId].selectedFighter = fighterSlot;
    
    // Update button states
    const btn1 = document.getElementById(`${matchId}-bet-f1`);
    const btn2 = document.getElementById(`${matchId}-bet-f2`);
    
    if (fighterSlot === '1') {
        btn1.style.background = '#10b981';
        btn1.style.borderColor = '#10b981';
        btn1.style.color = 'white';
        btn2.style.background = '#f1f5f9';
        btn2.style.borderColor = '#cbd5e1';
        btn2.style.color = '#475569';
    } else {
        btn2.style.background = '#10b981';
        btn2.style.borderColor = '#10b981';
        btn2.style.color = 'white';
        btn1.style.background = '#f1f5f9';
        btn1.style.borderColor = '#cbd5e1';
        btn1.style.color = '#475569';
    }
    
    updateBetDisplay(matchId);
};

window.setBetAmount = function(matchId, multiplier) {
    if (!window.bettingEnabled) return;
    if (!activeBets[matchId]) activeBets[matchId] = {};
    
    const currentMoney = getBettingMoney();
    let betAmount = 0;
    
    if (multiplier === 'MAX') {
        betAmount = currentMoney;
    } else {
        const mult = parseInt(multiplier.replace('x', ''));
        const baseAmount = Math.floor(currentMoney / 10); // Base is 10% of current money
        betAmount = baseAmount * mult;
    }
    
    // Cap at available money
    betAmount = Math.min(betAmount, currentMoney);
    activeBets[matchId].betAmount = betAmount;
    
    updateBetDisplay(matchId);
};

function updateBetDisplay(matchId) {
    const bet = activeBets[matchId] || {};
    const betAmount = bet.betAmount || 0;
    
    document.getElementById(`${matchId}-bet-amount`).textContent = `$${betAmount.toLocaleString()}`;
    
    // Calculate potential win (2x the bet as profit)
    const potentialWin = betAmount * 2;
    document.getElementById(`${matchId}-potential-win`).textContent = `$${potentialWin.toLocaleString()}`;
}

window.clearBet = function(matchId) {
    activeBets[matchId] = {};
    const btn1 = document.getElementById(`${matchId}-bet-f1`);
    const btn2 = document.getElementById(`${matchId}-bet-f2`);
    if (btn1) {
        btn1.style.background = '#f1f5f9';
        btn1.style.borderColor = '#cbd5e1';
        btn1.style.color = '#475569';
    }
    if (btn2) {
        btn2.style.background = '#f1f5f9';
        btn2.style.borderColor = '#cbd5e1';
        btn2.style.color = '#475569';
    }
    document.getElementById(`${matchId}-bet-amount`).textContent = '$0';
    document.getElementById(`${matchId}-potential-win`).textContent = '$0';
};

window.placeBet = function(matchId) {
    if (!window.bettingEnabled) {
        customAlert('Betting is currently disabled.', 'Betting Disabled');
        return;
    }
    const bet = activeBets[matchId] || {};
    
    if (!bet.selectedFighter) {
        return customAlert('Select which fighter you want to bet on first!', 'Place Bet');
    }
    
    if (!bet.betAmount || bet.betAmount <= 0) {
        return customAlert('Select a bet amount!', 'Place Bet');
    }
    
    const slot1Input = document.getElementById(`${matchId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2Input = document.getElementById(`${matchId}-slot2`)?.querySelector('.fighter-search-input');
    
    if (!slot1Input?.value || !slot2Input?.value) {
        return customAlert('Both fighters must be selected before placing a bet!', 'Place Bet');
    }
    
    const currentMoney = getBettingMoney();
    if (bet.betAmount > currentMoney) {
        return customAlert('Insufficient funds!', 'Place Bet');
    }
    
    // Deduct bet from money
    updateBettingMoney(-bet.betAmount);
    
    const betOnFighterNum = bet.selectedFighter;
    const betOnInput = betOnFighterNum === '1' ? slot1Input : slot2Input;
    const betOnFighterName = betOnInput.value;
    
    // Store the bet data for later when match is logged
    if (!window.placedBets) window.placedBets = {};
    window.placedBets[matchId] = {
        betAmount: bet.betAmount,
        betOnFighterNum: betOnFighterNum,
        betOnFighterName: betOnFighterName,
        timestamp: Date.now()
    };
    
    customAlert(`✅ Bet placed! $${bet.betAmount.toLocaleString()} on ${betOnFighterName} to win!\n\nYou could win $${(bet.betAmount * 2).toLocaleString()}`, 'Bet Placed');
    
    // Reset bet UI
    activeBets[matchId] = {};
    document.getElementById(`${matchId}-bet-f1`).style.background = '#f1f5f9';
    document.getElementById(`${matchId}-bet-f1`).style.borderColor = '#cbd5e1';
    document.getElementById(`${matchId}-bet-f1`).style.color = '#475569';
    document.getElementById(`${matchId}-bet-f2`).style.background = '#f1f5f9';
    document.getElementById(`${matchId}-bet-f2`).style.borderColor = '#cbd5e1';
    document.getElementById(`${matchId}-bet-f2`).style.color = '#475569';
    document.getElementById(`${matchId}-bet-amount`).textContent = '$0';
    document.getElementById(`${matchId}-potential-win`).textContent = '$0';
    
    saveCurrentCardDraft();
};

let fighters = loadFightersFromStorage();
let futureShows = JSON.parse(localStorage.getItem('wwe_future_shows')) || [];
let activeShowId = localStorage.getItem('wwe_active_show_id') || '';
let completedMatches = loadCompletedMatchesForShow(activeShowId);
let activeMatchId = null;
window.skipDraftSaveOnUnload = false;

function loadCompletedMatchesForShow(showId) {
    if (!showId) return {};
    const storedMatches = JSON.parse(localStorage.getItem("wwe_matches_" + showId)) || {};
    if (Object.keys(storedMatches).length > 0) {
        let updated = false;
        Object.values(storedMatches).forEach(state => {
            if (state && !state.gender) {
                const maybeF1 = fighters.find(f => f.id === state.slot1Id || f.name === state.slot1Name);
                const maybeF2 = fighters.find(f => f.id === state.slot2Id || f.name === state.slot2Name);
                state.gender = maybeF1?.gender || maybeF2?.gender || 'male';
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem("wwe_matches_" + showId, JSON.stringify(storedMatches));
        }
        return storedMatches;
    }
    if (!isShowCompleted(showId)) return {};

    const historyLog = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    const eventRecord = historyLog.find(event => event.showId === showId);
    if (!eventRecord || !Array.isArray(eventRecord.matches)) return {};

    const recovered = {};
    eventRecord.matches.forEach(match => {
        if (!match.matchId || !match.winner || !match.loser) return;
        const winnerFighter = fighters.find(f => f.name === match.winner);
        const loserFighter = fighters.find(f => f.name === match.loser);
        const inferredGender = winnerFighter?.gender || loserFighter?.gender || 'male';
        recovered[match.matchId] = {
            winnerName: match.winner,
            loserName: match.loser,
            winnerGender: winnerFighter ? winnerFighter.gender : 'male',
            slot1Name: match.winner,
            slot2Name: match.loser,
            slot1Id: '',
            slot2Id: '',
            gender: inferredGender,
            methodId: match.methodId || '',
            methodName: match.method || '',
            isTitle: Boolean(match.isTitle),
            titleId: match.titleId || '',
            titleName: match.customTitleName || ''
        };
    });

    if (Object.keys(recovered).length > 0) {
        localStorage.setItem("wwe_matches_" + showId, JSON.stringify(recovered));
    }
    return recovered;
}

function isShowCompleted(showId) {
    const show = futureShows.find(s => s.id === showId);
    return Boolean(show && show.completed);
}

function setShowCompleted(showId, value) {
    const show = futureShows.find(s => s.id === showId);
    if (!show) return;
    show.completed = !!value;
    if (value) {
        show.completedAt = new Date().toISOString();
    } else {
        delete show.completedAt;
    }
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
}

window.restartCurrentShow = function() {
    if (!activeShowId) return;
    customConfirm('Restart this completed fight card? This will clear the current archived layout and allow you to rebook the show from scratch.', function(result) {
        if (!result) return;
        setShowCompleted(activeShowId, false);
        localStorage.removeItem('wwe_matches_' + activeShowId);
        localStorage.removeItem('wwe_draft_' + activeShowId);
        location.reload();
    }, 'Restart Card');
};

function applyCompletedShowVisuals() {
    if (!isShowCompleted(activeShowId)) return;
    document.querySelectorAll('.match-row').forEach(row => {
        row.style.opacity = '0.55';
        row.style.filter = 'grayscale(0.2)';
        row.style.userSelect = 'none';
    });
    document.querySelectorAll('.match-row input, .match-row select, .match-row button').forEach(el => {
        if (el.classList && el.classList.contains('announce-btn')) {
            el.disabled = false;
            el.style.pointerEvents = 'auto';
        } else if (el.classList && el.classList.contains('randomizer-btn')) {
            el.style.display = 'none';
        } else {
            el.disabled = true;
        }
    });
}

// --- Announcer / SpeechSynthesis Helpers ---
window.announcerEnabled = localStorage.getItem('wwe_announcer_enabled') === '1';
window.preferredAnnouncerGender = 'female'; // currently only female option requested
window.bettingEnabled = localStorage.getItem('wwe_betting_enabled') === '1';
window.announcerTimeoutId = null;

function saveAnnouncerSetting(enabled) {
    window.announcerEnabled = !!enabled;
    localStorage.setItem('wwe_announcer_enabled', window.announcerEnabled ? '1' : '0');
    applyAnnouncerState();
}

function saveBettingSetting(enabled) {
    window.bettingEnabled = !!enabled;
    localStorage.setItem('wwe_betting_enabled', window.bettingEnabled ? '1' : '0');
    applyBettingState();
}

function getPreferredVoice() {
    const voices = speechSynthesis.getVoices() || [];
    const saved = localStorage.getItem('wwe_announcer_voice') || '';
    if (saved) {
        const found = voices.find(v => v.name === saved || v.name.indexOf(saved) !== -1);
        if (found) return found;
    }
    // prefer voices that look female or are English
    const femaleMatch = voices.find(v => /female|zira|samantha|victoria|alloy|amy|kate|karen/i.test(v.name));
    if (femaleMatch) return femaleMatch;
    const enVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    return femaleMatch || enVoice || voices[0] || null;
}

function speakText(text, onEnd) {
    if (!('speechSynthesis' in window)) { if (onEnd) onEnd(); return; }
    const utter = new SpeechSynthesisUtterance(text);
    const voice = getPreferredVoice();
    if (voice) utter.voice = voice;
    utter.rate = 1.0;
    utter.onend = function() { if (onEnd) onEnd(); };
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
}

function scheduleAnnouncerSpeak(text, onEnd, delay = 0) {
    if (window.announcerTimeoutId) {
        clearTimeout(window.announcerTimeoutId);
        window.announcerTimeoutId = null;
    }
    window.announcerTimeoutId = setTimeout(() => {
        window.announcerTimeoutId = null;
        speakText(text, onEnd);
    }, delay);
}

function stopAnnouncer() {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    if (window.announcerTimeoutId) {
        clearTimeout(window.announcerTimeoutId);
        window.announcerTimeoutId = null;
    }
}

function composeFighterAnnouncement(f) {
    if (!f) return '';
    const wins = Number(f.wins || 0);
    const losses = Number(f.losses || 0);
    const ko = Number(f.win_ko || 0);
    const pin = Number(f.win_pinfall || 0);
    const sub = Number(f.win_submission || 0);
    const titles = Number(f.title_fights || 0);
    let parts = [];
    parts.push(`${f.name}.`);
    parts.push(`Professional record: ${wins} wins, ${losses} losses.`);
    const finishes = [];
    if (ko) finishes.push(`${ko} by knockout`);
    if (pin) finishes.push(`${pin} by pinfall`);
    if (sub) finishes.push(`${sub} by submission`);
    if (finishes.length) parts.push(`Notable finishes: ${finishes.join(', ')}.`);
    parts.push(`Title fights: ${titles}.`);
    return parts.join(' ');
}

function maybeAnnounceSlot(matchId, force) {
    if (!window.announcerEnabled) return;
    const slot1Input = document.getElementById(`${matchId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2Input = document.getElementById(`${matchId}-slot2`)?.querySelector('.fighter-search-input');
    const id1 = slot1Input?.getAttribute('data-fighter-id') || '';
    const id2 = slot2Input?.getAttribute('data-fighter-id') || '';
    const f1 = fighters.find(x => x.id === id1) || (slot1Input && slot1Input.value ? { name: slot1Input.value, wins:0, losses:0, win_ko:0, win_pinfall:0, win_submission:0, title_fights:0 } : null);
    const f2 = fighters.find(x => x.id === id2) || (slot2Input && slot2Input.value ? { name: slot2Input.value, wins:0, losses:0, win_ko:0, win_pinfall:0, win_submission:0, title_fights:0 } : null);

    if (f1 && f2) {
        scheduleAnnouncerSpeak(composeFighterAnnouncement(f1), function() {
            window.announcerTimeoutId = setTimeout(() => {
                window.announcerTimeoutId = null;
                scheduleAnnouncerSpeak(composeFighterAnnouncement(f2));
            }, 250);
        });
    } else if (f1) {
        scheduleAnnouncerSpeak(composeFighterAnnouncement(f1));
    } else if (f2) {
        scheduleAnnouncerSpeak(composeFighterAnnouncement(f2));
    }
}

window.announceEventRecap = function() {
    if (!isShowCompleted(activeShowId)) {
        customAlert('The show must be finalized first before recapping.', 'Show Not Finalized');
        return;
    }
    
    if (!window.announcerEnabled) {
        customAlert('Announcer is disabled. Enable it in the controls above.', 'Announcer Off');
        return;
    }
    
    const activeShowSavedData = JSON.parse(localStorage.getItem('wwe_matches_' + activeShowId)) || {};
    const allMatchRows = Array.from(document.querySelectorAll('.match-row'));
    const matchEntries = allMatchRows.slice().reverse().map(row => {
        const state = activeShowSavedData[row.id];
        if (!state || !state.winnerName || !state.loserName || !state.methodName) return null;
        return {
            ...state,
            tierName: state.tierName || row.parentNode.querySelector('.tier-title')?.textContent || 'Match'
        };
    }).filter(Boolean);
    
    if (!matchEntries.length) {
        customAlert('No logged matches to recap. Log some results first!', 'No Matches');
        return;
    }
    
    const championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    const tierOrder = {
        'early prelims': 0,
        'preliminary card': 1,
        'prelims': 1,
        'main card': 2,
        'co-main event': 3,
        'co-main': 3,
        'main event': 4
    };

    const normalizeTier = (name) => {
        if (!name) return 'other';
        const key = name.toString().trim().toLowerCase();
        if (key.includes('early')) return 'early prelims';
        if (key.includes('co-main')) return 'co-main event';
        if (key.includes('main card')) return 'main card';
        if (key.includes('prelim')) return key.includes('early') ? 'early prelims' : 'preliminary card';
        if (key.includes('main event')) return 'main event';
        return key;
    };

    const tierIntro = (tierName, count) => {
        const normalized = normalizeTier(tierName);
        switch (normalized) {
            case 'early prelims':
                return count > 1 ? 'In the early prelims, we have the following victories.' : 'In the early prelims, we have one victory.';
            case 'preliminary card':
                return count > 1 ? 'Next, on the preliminary card, here are the results.' : 'Next, on the preliminary card, here is the result.';
            case 'main card':
                return count > 1 ? 'Now on the main card, the winners are:' : 'Now on the main card, the winner is:';
            case 'co-main event':
                return 'As we move into the co-main event, the result is:';
            case 'main event':
                return 'Finally, in the main event, the winner is:';
            default:
                return `For ${tierName}, here are the results.`;
        }
    };

    const grouped = {};
    matchEntries.forEach(state => {
        const tierKey = state.tierName || 'Match';
        if (!grouped[tierKey]) grouped[tierKey] = [];
        grouped[tierKey].push(state);
    });

    const orderedTiers = Object.keys(grouped).sort((a, b) => {
        const orderA = tierOrder[normalizeTier(a)] ?? 99;
        const orderB = tierOrder[normalizeTier(b)] ?? 99;
        return orderB - orderA || a.localeCompare(b);
    });

    let recapParts = [];
    recapParts.push('Ladies and gentlemen, here is your official event recap.');

    orderedTiers.forEach(tierName => {
        const matches = grouped[tierName];
        recapParts.push(tierIntro(tierName, matches.length));
        matches.forEach(state => {
            const methodLabel = state.methodName.replace('PINFALL', 'by pinfall').replace('KO/TKO', 'by knockout').replace('SUBMISSION', 'by submission').toLowerCase();
            let matchAnnounce = `${state.winnerName} defeated ${state.loserName} ${methodLabel}.`;
            if (state.isTitle) {
                const titleBelt = championshipsRegistry.find(t => t.id === state.titleId);
                if (titleBelt) {
                    const defenseCount = titleBelt.defenses || 0;
                    matchAnnounce += ` ${state.winnerName} retains the ${titleBelt.name}${defenseCount ? ` with ${defenseCount} successful defense${defenseCount !== 1 ? 's' : ''}` : ''}.`;
                } else if (state.titleName) {
                    matchAnnounce += ` ${state.winnerName} is the new champion of the ${state.titleName}.`;
                }
            }
            recapParts.push(matchAnnounce);
        });
    });

    recapParts.push('Thank you for watching!');
    const fullRecap = recapParts.join(' ');
    speakText(fullRecap);
};

function populateVoiceList() {
    if (!('speechSynthesis' in window)) return;
    const select = document.getElementById('announcer-voice-select');
    if (!select) return;
    const voices = speechSynthesis.getVoices() || [];
    // Clear existing
    select.innerHTML = '';
    // add placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.text = 'Default (auto)';
    select.appendChild(placeholder);

    voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.text = `${v.name} (${v.lang})`;
        select.appendChild(opt);
    });

    const saved = localStorage.getItem('wwe_announcer_voice') || '';
    if (saved) select.value = saved;
    else {
        // pick a female voice if available
        const female = voices.find(v => /female|zira|samantha|victoria|alloy|amy|kate|karen/i.test(v.name));
        if (female) select.value = female.name;
    }

    select.onchange = function() {
        const v = select.value || '';
        if (v) localStorage.setItem('wwe_announcer_voice', v);
        else localStorage.removeItem('wwe_announcer_voice');
    };
}

function applyAnnouncerState() {
    document.querySelectorAll('.announce-btn').forEach(btn => {
        btn.disabled = !window.announcerEnabled;
        btn.style.opacity = window.announcerEnabled ? '1' : '0.45';
        btn.style.cursor = window.announcerEnabled ? 'pointer' : 'not-allowed';
        btn.title = window.announcerEnabled ? '' : 'Announcer is disabled.';
    });
    const voiceSelect = document.getElementById('announcer-voice-select');
    if (voiceSelect) voiceSelect.disabled = !window.announcerEnabled;
}

function applyBettingState() {
    const showCompleted = isShowCompleted(activeShowId);
    document.querySelectorAll('.betting-panel').forEach(panel => {
        panel.style.display = (!showCompleted && window.bettingEnabled) ? 'flex' : 'none';
    });
    const betControls = document.querySelectorAll('[id$="-bet-f1"], [id$="-bet-f2"], [id$="-bet-amount"], [id$="-potential-win"], button[onclick*="placeBet"], button[onclick*="clearBet"], button[onclick*="setBetAmount"], button[onclick*="selectBetFighter"]');
    betControls.forEach(el => {
        const enabled = window.bettingEnabled && !showCompleted;
        el.disabled = !enabled;
        if (el.style) {
            el.style.opacity = enabled ? '1' : '0.35';
            el.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    });
    if (!window.bettingEnabled || showCompleted) {
        activeBets = {};
        if (window.placedBets) window.placedBets = {};
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    await hydrateFighterPhotos();
    initBettingSystem();
    const tiers = ['mainEventContainer', 'coMainContainer', 'mainCardContainer', 'prelimsContainer', 'earlyPrelimsContainer'];
    tiers.forEach(id => {
        let box = document.getElementById(id);
        if (!box) return;
        let num = (id.includes('mainEvent') || id.includes('coMain')) ? 1 : 4;
        renderCardRows(box, num, id, id.includes('mainEvent'));
    });
    restoreCurrentCardDraft();
    buildShowSchedulerHeader();
    buildModalContainer();
    insertCompletedShowNotice();
    applyCompletedShowVisuals();
    applyAnnouncerState();
    applyBettingState();
    updateBettingMoneyDisplay();
    updateFinalizeButtonState();
    updateRandomizerState();
    const eventNameInput = document.getElementById('eventNameInput');
    if (eventNameInput) {
        eventNameInput.addEventListener('input', updateFinalizeButtonState);
    }
    // Populate available voices for announcer (may arrive asynchronously)
    try {
        populateVoiceList();
        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    } catch (e) {}
        // LIVE WATCHER: Auto-clears title field blocks if a fighter name is ever deleted
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('fighter-search-input')) {
            const matchRow = e.target.closest('.match-row');
            if (matchRow) {
                const id = matchRow.id;
                const slot1Input = document.getElementById(`${id}-slot1`)?.querySelector('.fighter-search-input');
                const slot2Input = document.getElementById(`${id}-slot2`)?.querySelector('.fighter-search-input');
                const slotType = e.target.closest('.fighter-slot')?.id?.replace(`${id}-`, '') || '';
                const hasEmptyFighter = !slot1Input?.value.trim() || !slot2Input?.value.trim();
                const cb = document.getElementById(`${id}-title-check`);
                const titleInput = document.getElementById(`${id}-title-name-input`);

                if (!e.target.value.trim()) {
                    const slot = e.target.closest('.fighter-slot');
                    if (slot) {
                        const avatar = slot.querySelector('.avatar-box');
                        if (avatar) {
                            avatar.innerHTML = '👤';
                            avatar.style.cssText = "width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; overflow:hidden; cursor:pointer;";
                        }
                        e.target.setAttribute('data-fighter-id', '');
                        const badge = slot.querySelector('.win-badge');
                        const label = slot.querySelector('.win-method-label');
                        if (badge) badge.style.display = 'none';
                        if (label) label.style.display = 'none';

                        const matchRow = e.target.closest('.match-row');
                        if (matchRow) {
                            resetMatchRowRematchState(matchRow.id);
                        }
                    }
                }

                refreshTitleFightState(id);
                if (hasEmptyFighter) {
                    matchRow.style.border = '1px solid #bae6fd';
                    matchRow.style.background = '#ffffff';
                    if (id.includes('mainEventContainer') || id.includes('coMainContainer')) {
                        matchRow.style.border = '1px solid #fca5a5';
                        matchRow.style.background = 'linear-gradient(to right, #ffffff, #fff5f5, #ffffff)';
                    }
                } else {
                    const accepted = getMatchRowAcceptedRematch(id);
                    const currentF1Id = slot1Input?.getAttribute('data-fighter-id') || '';
                    const currentF2Id = slot2Input?.getAttribute('data-fighter-id') || '';
                    if (accepted && !areMatchRowRematchPairsEqual(currentF1Id, currentF2Id, accepted.fighter1Id, accepted.fighter2Id)) {
                        resetMatchRowRematchState(id);
                    }
                    checkExistingFightRematch(id, slotType);
                }
            }
            saveCurrentCardDraft();
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.closest && e.target.closest('.match-row')) {
            saveCurrentCardDraft();
        }
    });

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && !window.skipDraftSaveOnUnload) saveCurrentCardDraft();
    });

    window.addEventListener('pagehide', (event) => {
        if (!window.skipDraftSaveOnUnload) saveCurrentCardDraft(event);
    });

});

window.addEventListener('beforeunload', () => {
    if (!window.skipDraftSaveOnUnload) saveCurrentCardDraft();
});

function buildShowSchedulerHeader() {
    const mainBox = document.getElementById('mainEventContainer');
    if (!mainBox || document.getElementById('schedulerControlRow')) return;

    const row = document.createElement('div');
    row.id = 'schedulerControlRow';
    row.style.cssText = "background:white; border:1px solid #bae6fd; border-radius:12px; padding:16px; margin-bottom:24px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05); width:100%; box-sizing:border-box;";

    let opts = '';
    futureShows.forEach(s => {
        opts += `<option value="${s.id}" ${s.id === activeShowId ? 'selected' : ''}>${s.name}</option>`;
    });
    const activeShowCompleted = isShowCompleted(activeShowId);

    row.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; flex:1 1 320px; min-width:260px; flex-wrap:wrap;">
            <span style="font-size:0.75rem; font-weight:800; color:#0369a1; text-transform:uppercase;">📅 Active Schedule:</span>
            <select id="activeShowSelector" onchange="switchActiveShowCard(this.value)" style="padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; font-size:0.85rem; color:#1e293b; background:white; min-width:180px; max-width:260px; width:100%;">${opts}</select>
            <button onclick="editCurrentShowName()" style="background:#64748b; border:none; color:white; font-weight:bold; padding:6px 10px; border-radius:6px; font-size:0.7rem; cursor:pointer; text-transform:uppercase;">✏️ Edit</button>
            <button id="randomizeShowButton" onclick="randomizeEntireShow()" ${activeShowCompleted ? 'disabled' : ''} style="background:#7c3aed; border:none; color:white; font-weight:bold; padding:6px 10px; border-radius:6px; font-size:0.7rem; cursor:${activeShowCompleted ? 'not-allowed' : 'pointer'}; text-transform:uppercase; white-space:nowrap; opacity:${activeShowCompleted ? '0.45' : '1'};">🎲 Randomize All</button>
            <button id="recapButton" onclick="announceEventRecap()" style="background:#f59e0b; border:none; color:white; font-weight:bold; padding:6px 10px; border-radius:6px; font-size:0.7rem; cursor:pointer; text-transform:uppercase; white-space:nowrap;">📢 Recap</button>
            <button id="stopAnnouncerButton" onclick="stopAnnouncer()" style="background:#0f172a; border:none; color:white; font-weight:bold; padding:6px 10px; border-radius:6px; font-size:0.7rem; cursor:pointer; text-transform:uppercase; white-space:nowrap;">⏹ Stop</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex:1 1 280px; min-width:220px; flex-wrap:wrap; justify-content:flex-end;">
            <input type="text" id="eventNameInput" placeholder="Name" value="${activeShowId ? (futureShows.find(s => s.id === activeShowId)?.name || '') : ''}" style="padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.8rem; font-weight:600; outline:none; min-width:140px; max-width:200px; width:100%; background:white; color:#1e293b;">
            <label style="display:inline-flex; align-items:center; gap:8px; padding:6px 8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-weight:700; color:#475569; white-space:nowrap;">
                <input id="announcer-toggle" type="checkbox" onchange="saveAnnouncerSetting(this.checked)" ${window.announcerEnabled ? 'checked' : ''}>
                <span style="font-size:0.8rem;">Announcer</span>
            </label>
            <label style="display:inline-flex; align-items:center; gap:8px; padding:6px 8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-weight:700; color:#475569; white-space:nowrap;">
                <input id="betting-toggle" type="checkbox" onchange="saveBettingSetting(this.checked)" ${window.bettingEnabled ? 'checked' : ''}>
                <span style="font-size:0.8rem;">Betting</span>
            </label>
            <select id="announcer-voice-select" style="padding:6px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.75rem; background:white; color:#1e293b; min-width:180px; max-width:260px;">
                <option>Loading voices…</option>
            </select>
            ${isShowCompleted(activeShowId) ? `<span style="display:inline-flex; align-items:center; gap:6px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:0.75rem; font-weight:700; color:#475569; white-space:nowrap;">✅ Completed<span style="font-size:0.7rem; color:#64748b;">${futureShows.find(s => s.id === activeShowId)?.completedAt ? new Date(futureShows.find(s => s.id === activeShowId).completedAt).toLocaleDateString() : ''}</span></span>` : ''}
            <button onclick="createNewFutureShow()" style="background:#0369a1; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer; text-transform:uppercase; white-space:nowrap;">+ Add Show</button>
            ${isShowCompleted(activeShowId) ? `<button onclick="restartCurrentShow()" style="background:#f97316; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer; text-transform:uppercase; white-space:nowrap;">Restart Card</button>` : ''}
            <button onclick="downloadAppBackup()" style="background:#0f766e; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer; text-transform:uppercase; white-space:nowrap;">⬇️ Backup</button>
            <button onclick="importAppBackup()" style="background:#0c4a6e; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer; text-transform:uppercase; white-space:nowrap;">⬆️ Restore</button>
        </div>`;
        
    const mainSection = mainBox ? mainBox.closest('section') : null;
    if (mainSection && mainSection.parentNode) {
        mainSection.parentNode.insertBefore(row, mainSection);
    } else if (mainBox && mainBox.parentNode) {
        mainBox.parentNode.insertBefore(row, mainBox);
    }
}

function insertCompletedShowNotice() {
    if (!isShowCompleted(activeShowId)) return;
    const headerRow = document.getElementById('schedulerControlRow');
    if (!headerRow) return;
    if (document.getElementById('completedShowNotice')) return;

    const notice = document.createElement('div');
    notice.id = 'completedShowNotice';
    notice.style.cssText = 'background:#f1f5f9; border:1px solid #cbd5e1; border-radius:12px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:10px; color:#0f172a;';
    notice.innerHTML = `<div style="display:flex; align-items:center; gap:10px; font-size:0.9rem;"><strong style="color:#094067;">This show is completed and archived.</strong><span style="color:#475569;">Use the top controls to restart or edit the show name.</span></div><button onclick="restartCurrentShow()" style="background:#ef4444; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.75rem; text-transform:uppercase;">Restart Event</button>`;
    headerRow.parentNode.insertBefore(notice, headerRow.nextSibling);
}

window.switchActiveShowCard = function(showId) {
    localStorage.setItem('wwe_active_show_id', showId);
    location.reload();
};

window.createNewFutureShow = function() {
    const input = document.getElementById('eventNameInput');
    const name = input ? input.value.trim() : '';
    if (!name) return customAlert('Type a name to book an upcoming event card!', 'Create Event');

    const newId = 'show-' + Date.now();
    futureShows.push({ id: newId, name: name });
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    localStorage.setItem('wwe_active_show_id', newId);
    input.value = '';
    
    customAlert(`Success! "${name}" added to your future show calendar.`, 'Event Created');
    location.reload();
};

window.editCurrentShowName = function() {
    if (!activeShowId || !futureShows.find(s => s.id === activeShowId)) {
        customAlert('No show selected to edit.', 'Edit Show');
        return;
    }
    
    const currentShow = futureShows.find(s => s.id === activeShowId);
    customPrompt(`Edit show name:\n\nCurrent: ${currentShow.name}`, currentShow.name, function(newName) {
        if (newName === null) return;
        if (!newName.trim()) {
            customAlert('Show name cannot be empty.', 'Edit Show');
            return;
        }
        currentShow.name = newName.trim();
        localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
        customAlert(`Show renamed to "${currentShow.name}".`, 'Show Renamed');
        location.reload();
    }, 'Edit Show');
};

function renderCardRows(box, num, tierId, isMain) {
    for (let i = 1; i <= num; i++) {
        const uId = `${tierId}-m${i}`;
        const matchRow = document.createElement('div');
        matchRow.className = 'match-row';
        matchRow.id = uId;
        matchRow.dataset.isMain = isMain ? 'true' : 'false';
        matchRow.style.cssText = "background:#fff; border:1px solid #bae6fd; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px; margin-bottom:12px; position:relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width:100%; box-sizing:border-box;";
        if (isMain) { matchRow.style.background = "linear-gradient(to right, #fff, #fff5f5, #fff)"; matchRow.style.borderColor = "#fca5a5"; }

        matchRow.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px dashed #e2e8f0; padding-bottom:6px; font-size:0.65rem; font-weight:bold; color:#64748b;">
                <span>MATCH VARIANT</span>
                <div style="display:flex; gap:4px; align-items:center;">
                    <button class="randomizer-btn" onclick="randomizeMatchup('${uId}')" style="background:#7c3aed; border:none; color:white; padding:3px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem; transition:0.2s;" title="Pick 2 random fighters of same gender & weight class">🎲 RANDOM</button>
                    <button class="randomizer-btn" onclick="randomizeMatchup('${uId}')" style="background:#a855f7; border:none; color:white; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.55rem; transition:0.2s;" title="Reroll">↻</button>
                    <div style="display:flex; gap:4px; background:#f1f5f9; padding:2px; border-radius:6px;">
                        <button onclick="changeMatchGender('${uId}', 'male')" id="${uId}-btn-male" style="background:#0369a1; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;">MALE</button>
                        <button onclick="changeMatchGender('${uId}', 'female')" id="${uId}-btn-female" style="background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;">FEMALE</button>
                    </div>
                </div>
            </div>
            <div id="${uId}-booking-panel" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                
                <div class="fighter-slot" id="${uId}-slot1" data-gender="male" style="width:38%; display:flex; align-items:center; gap:8px; position:relative; transition: box-shadow 0.25s ease, transform 0.25s ease;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; position:relative;">
                        <div class="avatar-frame" style="position:relative; width:36px; height:36px;">
                            <div class="avatar-box" style="width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; overflow:hidden; cursor:pointer;">👤</div>
                            <div class="win-badge" style="display:none; position:absolute; right:-2px; bottom:-2px; width:14px; height:14px; border-radius:50%; background:#16a34a; color:white; border:1px solid white; display:flex; align-items:center; justify-content:center; font-size:0.65rem; box-shadow:none;">✓</div>
                        </div>
                        <div class="win-method-label" style="display:none; font-size:0.65rem; font-weight:800; color:#16a34a; text-transform:uppercase; text-align:center; line-height:1; max-width:80px;">KO/TKO</div>
                    </div>
                    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
                        <div class="dropdown-search-container" style="width:100%;">
                            <input type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" class="fighter-search-input" data-fighter-id="" placeholder="Type Fighter 1..." onfocus="triggerSearchFill('${uId}', 'slot1')" onkeyup="triggerSearchFill('${uId}', 'slot1')" style="width:100%; padding:6px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; font-weight:600;">
                            <div class="search-results-floating-panel" style="display:none;"></div>
                        </div>
                        <div id="${uId}-slot1-record" class="fighter-record" style="font-size:0.75rem; color:#475569; margin-top:4px; min-height:18px; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
                    </div>
                </div>

                <div class="vs-badge" style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:20%;">
                    <span style="font-size:0.75rem; font-weight:900; background:#64748b; color:white; padding:4px 10px; border-radius:4px; letter-spacing:0.05em; ${isMain?'background:#dc2626;':''}">VS</span>
                    <button onclick="suggestOpponent('${uId}')" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:0.65rem; font-weight:bold; margin-top:6px;">💡 Suggest</button>
                </div>

                <div class="fighter-slot" id="${uId}-slot2" data-gender="male" style="width:38%; text-align:right; display:flex; flex-direction:row-reverse; align-items:center; gap:8px; position:relative; min-width:0; transition: box-shadow 0.25s ease, transform 0.25s ease;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; position:relative;">
                        <div class="avatar-frame" style="position:relative; width:36px; height:36px;">
                            <div class="avatar-box" style="width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; overflow:hidden; cursor:pointer;">👤</div>
                            <div class="win-badge" style="display:none; position:absolute; right:-2px; bottom:-2px; width:14px; height:14px; border-radius:50%; background:#16a34a; color:white; border:1px solid white; display:flex; align-items:center; justify-content:center; font-size:0.65rem; box-shadow:none;">✓</div>
                        </div>
                        <div class="win-method-label" style="display:none; font-size:0.65rem; font-weight:800; color:#16a34a; text-transform:uppercase; text-align:center; line-height:1; max-width:80px;">KO/TKO</div>
                    </div>
                    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
                        <div class="dropdown-search-container" style="width:100%;">
                            <input type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" class="fighter-search-input" data-fighter-id="" placeholder="Type Fighter 2..." onfocus="triggerSearchFill('${uId}', 'slot2')" onkeyup="triggerSearchFill('${uId}', 'slot2')" style="width:100%; padding:6px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; font-weight:600; text-align:right;">
                            <div class="search-results-floating-panel" style="display:none;"></div>
                        </div>
                        <div id="${uId}-slot2-record" class="fighter-record" style="font-size:0.75rem; color:#475569; margin-top:4px; min-height:18px; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
                    </div>
                </div>

            </div>
            <div id="${uId}-rematch-warning" style="display:none; width:100%; background:#fef3c7; border:1px solid #fde68a; border-radius:10px; padding:12px; color:#92400e; box-sizing:border-box;">
                <div id="${uId}-rematch-warning-text" style="font-size:0.78rem; line-height:1.4; margin-bottom:10px;"></div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="${uId}-rematch-cancel" type="button" style="background:#ef4444; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Cancel</button>
                    <button id="${uId}-rematch-allow" type="button" style="background:#15803d; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Allow Rematch</button>
                </div>
            </div>
            <div id="${uId}-duplicate-warning" style="display:none; width:100%; background:#fff1f2; border:1px solid #fecaca; border-radius:10px; padding:12px; color:#7f1d1d; box-sizing:border-box;">
                <div id="${uId}-duplicate-warning-text" style="font-size:0.78rem; line-height:1.4; margin-bottom:10px;"></div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="${uId}-duplicate-cancel" type="button" style="background:#ef4444; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Cancel</button>
                    <button id="${uId}-duplicate-replace" type="button" style="background:#f97316; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Replace with another fighter</button>
                    <button id="${uId}-duplicate-allow" type="button" style="background:#15803d; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Allow</button>
                </div>
            </div>
            <div id="${uId}-result-panel" style="display:none; flex-direction:column; align-items:center; width:100%; background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; text-align:center; box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">
                <div style="font-size:0.6rem; font-weight:800; color:#64748b; tracking-letter:0.1em; text-transform:uppercase; margin-bottom:4px;">Official Ring Result</div>
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; font-size:1.1rem; font-weight:900;">
                    <div id="${uId}-showcase-winner" style="width:40%; text-align:left; font-weight:bold;"></div>
                    <div style="width:20%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span style="font-size:0.65rem; color:#64748b; font-weight:bold; font-style:italic;">DEFEATED BY</span>
                        <span id="${uId}-showcase-method" style="font-size:0.85rem; color:#38bdf8; font-weight:800; letter-spacing:0.05em; margin-top:1px;"></span>
                    </div>
                    <div id="${uId}-showcase-loser" style="width:40%; text-align:right; color:#ef4444; text-decoration:line-through; font-size:0.95rem; font-weight:700; opacity:0.6;"></div>
                </div>
            </div>
            <div class="controls-area" style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:4px; border-top:1px solid #f1f5f9; padding-top:8px;">
                <div style="width:70%; display:flex; gap:8px; align-items:center;">
                    <select id="${uId}-winner-select" style="padding:4px 8px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.7rem; font-weight:bold; color:#334155; width:140px;">
                        <option value="">Winner...</option>
                    </select>
                    <select id="${uId}-method-select" style="padding:4px 8px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.7rem; font-weight:bold; color:#334155; width:110px;">
                        <option value="">How?</option>
                        <option value="win_pinfall">PINFALL</option>
                        <option value="win_ko">KO/TKO</option>
                        <option value="win_submission">SUBMISSION</option>
                    </select>
                        <button id="${uId}-log-btn" onclick="logMatchResult('${uId}')" style="background:#ef4444; border:none; color:white; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">Log Result</button>
                        <button id="${uId}-unlog-btn" onclick="unlogMatchResult('${uId}')" style="display:none; background:#d946ef; border:none; color:white; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">Unlog Result</button>
                        <button id="${uId}-announce-btn" class="announce-btn" onclick="maybeAnnounceSlot('${uId}', true)" style="background:#0b74ff; border:none; color:white; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">Announce</button>
                </div>
                                <div style="width:30%; display:flex; justify-content:flex-end; gap:8px; font-size:0.7rem; font-weight:bold; color:#475569; align-items:center;">
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" id="${uId}-title-check" onchange="toggleTitleFight('${uId}', this)"> 🏆 TITLE / BELT MATCH</label>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <select id="${uId}-title-name-input" style="display:none; padding:6px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.65rem; font-weight:bold; width:180px; outline:none; background:white; color:#1e293b;"></select>
                    </div>
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" onchange="toggleRematchCounter('${uId}', this)"> 🔄 REMATCH <input type="number" min="1" value="1" id="${uId}-rematch-count" style="display:none; width:32px; font-size:0.65rem; margin-left:2px;"></label>
                </div>

            </div>
            <div id="${uId}-betting-panel" class="betting-panel" style="display:flex; flex-direction:column; gap:8px; width:100%; background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:8px; margin:8px 0;">
                <div style="display:flex; gap:6px; font-size:0.65rem; font-weight:bold;">
                    <button onclick="selectBetFighter('${uId}', '1')" id="${uId}-bet-f1" style="flex:1; background:#f1f5f9; border:2px solid #cbd5e1; color:#475569; padding:4px; border-radius:4px; cursor:pointer; transition:0.2s; font-size:0.65rem;">BET F1</button>
                    <button onclick="selectBetFighter('${uId}', '2')" id="${uId}-bet-f2" style="flex:1; background:#f1f5f9; border:2px solid #cbd5e1; color:#475569; padding:4px; border-radius:4px; cursor:pointer; transition:0.2s; font-size:0.65rem;">BET F2</button>
                </div>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; font-size:0.6rem; font-weight:bold;">
                    <button onclick="setBetAmount('${uId}', 'x2')" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:3px; cursor:pointer; transition:0.2s; font-size:0.65rem;">x2</button>
                    <button onclick="setBetAmount('${uId}', 'x5')" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:3px; cursor:pointer; transition:0.2s; font-size:0.65rem;">x5</button>
                    <button onclick="setBetAmount('${uId}', 'x10')" style="background:#ef4444; color:white; border:none; padding:4px; border-radius:3px; cursor:pointer; transition:0.2s; font-size:0.65rem;">x10</button>
                    <button onclick="setBetAmount('${uId}', 'MAX')" style="background:#dc2626; color:white; border:none; padding:4px; border-radius:3px; cursor:pointer; font-weight:900; transition:0.2s; font-size:0.65rem;">MAX</button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px;">
                    <div style="background:white; border:1px solid #86efac; border-radius:4px; padding:6px; text-align:center;">
                        <div style="font-size:0.6rem; color:#65a30d; font-weight:bold; text-transform:uppercase;">Bet</div>
                        <div id="${uId}-bet-amount" style="font-size:0.9rem; font-weight:900; color:#16a34a;">$0</div>
                    </div>
                    <div style="background:white; border:1px solid #86efac; border-radius:4px; padding:6px; text-align:center;">
                        <div style="font-size:0.6rem; color:#65a30d; font-weight:bold; text-transform:uppercase;">Win</div>
                        <div id="${uId}-potential-win" style="font-size:0.9rem; font-weight:900; color:#16a34a;">$0</div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
                        <button onclick="placeBet('${uId}')" style="background:#10b981; border:none; color:white; padding:6px; border-radius:4px; cursor:pointer; font-weight:bold; text-transform:uppercase; font-size:0.65rem; transition:0.2s;">PLACE</button>
                        <button onclick="clearBet('${uId}')" style="background:#f97316; border:none; color:white; padding:6px; border-radius:4px; cursor:pointer; font-weight:bold; text-transform:uppercase; font-size:0.65rem; transition:0.2s;">CLEAR</button>
                    </div>
                </div>
            </div>`;
        box.appendChild(matchRow);
        clearMatchWinnerBadges(uId);
        
        if (completedMatches[uId]) {
            restoreLoggedResult(uId, completedMatches[uId]);
            disableMatchRowControls(uId);
            const unlogBtn = document.getElementById(`${uId}-unlog-btn`);
            if (unlogBtn) {
                unlogBtn.style.display = 'inline-flex';
                unlogBtn.disabled = false;
            }
        }
    }
}

window.triggerSearchFill = function(uId, slotType) {
    const slot = document.getElementById(`${uId}-${slotType}`);
    const input = slot.querySelector('.fighter-search-input');
    const panel = slot.querySelector('.search-results-floating-panel');
    const gender = slot.getAttribute('data-gender');
    const filter = input.value.toLowerCase();
    
        let busyFighterIds = [];
    
    // Scan all active, unplayed input selections currently open on screen
    document.querySelectorAll('.fighter-search-input').forEach(inp => {
        if(inp !== input && inp.getAttribute('data-fighter-id')) {
            busyFighterIds.push(inp.getAttribute('data-fighter-id'));
        }
    });

    // Scan all logged, completed matches stored in memory for this active show
    Object.keys(completedMatches).forEach(matchId => {
        const state = completedMatches[matchId];
        if (state) {
            let fWin = fighters.find(f => f.name === state.winnerName);
            let fLos = fighters.find(f => f.name === state.loserName);
            if (fWin) busyFighterIds.push(fWin.id);
            if (fLos) busyFighterIds.push(fLos.id);
        }
    });


    panel.innerHTML = '';
    const matchingFighters = fighters.filter(f => f.gender === gender && f.name.toLowerCase().includes(filter));

    if(matchingFighters.length === 0) {
        panel.style.display = 'none';
        return;
    }

    matchingFighters.forEach(f => {
        const item = document.createElement('div');
        item.className = 'search-result-item-row';
        const isAlreadyBooked = busyFighterIds.includes(f.id);
        const label = isAlreadyBooked ? `❌ ${f.name} (BOOKED)` : `👤 ${f.name} (${f.division})`;
        item.textContent = label;
        if (isAlreadyBooked) {
            item.className += ' is-already-booked';
        }
        item.onclick = function() {
            input.value = f.name;
            input.setAttribute('data-fighter-id', f.id);
            panel.style.display = 'none';
            
            const av = slot.querySelector('.avatar-box');
            let avatarContent = '';
            if (f.photo) {
                avatarContent = `<img src="${f.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarContent = f.name.charAt(0);
            }
            av.innerHTML = avatarContent;
            av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            av.onclick = function(e) { 
                e.stopPropagation(); 
                uploadFighterPhotoFromCard(f.id); 
            };
            updateFighterRecordDisplay(uId, slotType, f);
            updateWinnerDropdown(uId);
            checkExistingFightRematch(uId, slotType);
            checkDuplicateOnCard(uId, slotType);
            refreshTitleFightState(uId);
            saveCurrentCardDraft();
        };
        panel.appendChild(item);
    });
    panel.style.display = 'block';
};

document.addEventListener('click', (e) => {
    if(!e.target.classList.contains('fighter-search-input')) {
        document.querySelectorAll('.search-results-floating-panel').forEach(p => p.style.display = 'none');
    }
});

document.addEventListener('input', (e) => {
    if (!e.target.classList || !e.target.classList.contains('fighter-search-input')) return;
    const input = e.target;
    const matchRow = input.closest('.match-row');
    if (!matchRow) return;
    const slotType = input.closest('.fighter-slot')?.id?.endsWith('-slot1') ? 'slot1' : 'slot2';
    const fighter = getFighterByIdOrName(input.value.trim());
    if (fighter) {
        input.setAttribute('data-fighter-id', fighter.id);
        updateFighterRecordDisplay(matchRow.id, slotType, fighter);
    } else {
        input.setAttribute('data-fighter-id', '');
        updateFighterRecordDisplay(matchRow.id, slotType, null);
        hideRematchWarning(matchRow.id);
    }
    updateWinnerDropdown(matchRow.id);
    checkExistingFightRematch(matchRow.id, slotType);
    refreshDuplicateWarnings();
    refreshTitleFightState(matchRow.id);
    saveCurrentCardDraft();
});

function setMatchRowSelectedGender(matchRowId, gender) {
    const btnMale = document.getElementById(`${matchRowId}-btn-male`);
    const btnFemale = document.getElementById(`${matchRowId}-btn-female`);
    const slot1 = document.getElementById(`${matchRowId}-slot1`);
    const slot2 = document.getElementById(`${matchRowId}-slot2`);

    if (btnMale && btnFemale) {
        if (gender === 'male') {
            btnMale.style.cssText = "background:#0369a1; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem; box-shadow:0 0 0 2px rgba(56,189,248,0.45);";
            btnFemale.style.cssText = "background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem; box-shadow:none;";
        } else {
            btnFemale.style.cssText = "background:#db2777; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem; box-shadow:0 0 0 2px rgba(236,72,153,0.45);";
            btnMale.style.cssText = "background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem; box-shadow:none;";
        }
    }

    if (slot1) slot1.setAttribute('data-gender', gender);
    if (slot2) slot2.setAttribute('data-gender', gender);
}

function populateDropdownGenders(matchRowId, genderVariant) {
    const slot1 = document.getElementById(`${matchRowId}-slot1`);
    const slot2 = document.getElementById(`${matchRowId}-slot2`);
    if (slot1 && slot2) {
        slot1.setAttribute('data-gender', genderVariant);
        slot2.setAttribute('data-gender', genderVariant);
        slot1.querySelector('.fighter-search-input').value = '';
        slot2.querySelector('.fighter-search-input').value = '';
        slot1.querySelector('.fighter-search-input').setAttribute('data-fighter-id', '');
        slot2.querySelector('.fighter-search-input').setAttribute('data-fighter-id', '');
        updateFighterRecordDisplay(matchRowId, 'slot1', null);
        updateFighterRecordDisplay(matchRowId, 'slot2', null);
        refreshTitleFightState(matchRowId);
    }
}

function getFightHistoryBetween(f1, f2) {
    if (!f1 || !f2 || f1.id === f2.id) return [];
    const history1 = (f1.compiled_history_deck || f1.history_deck || f1.history || []).filter(entry => entry.opponent === f2.name);
    if (history1.length) {
        return history1.map(entry => ({
            winner: entry.outcome === 'win' ? f1.name : f2.name,
            loser: entry.outcome === 'loss' ? f1.name : f2.name,
            method: entry.method,
            showName: entry.showName,
            rematchNumber: (typeof entry.rematchNumber === 'number') ? entry.rematchNumber : 0
        }));
    }
    const history2 = (f2.compiled_history_deck || f2.history_deck || f2.history || []).filter(entry => entry.opponent === f1.name);
    return history2.map(entry => ({
        winner: entry.outcome === 'win' ? f2.name : f1.name,
        loser: entry.outcome === 'loss' ? f2.name : f1.name,
        method: entry.method,
        showName: entry.showName,
        rematchNumber: (typeof entry.rematchNumber === 'number') ? entry.rematchNumber : 0
    }));
}

function clearCardFighterSlot(matchRowId, slotType) {
    const slot = document.getElementById(`${matchRowId}-${slotType}`);
    if (!slot) return;
    const input = slot.querySelector('.fighter-search-input');
    const av = slot.querySelector('.avatar-box');
    if (input) {
        input.value = '';
        input.setAttribute('data-fighter-id', '');
    }
    if (av) {
        av.innerHTML = '👤';
        av.style.cssText = "width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; cursor:pointer; overflow:hidden;";
    }
    const badge = slot.querySelector('.win-badge');
    const label = slot.querySelector('.win-method-label');
    const recordDisplay = slot.querySelector('.fighter-record');
    if (badge) badge.style.display = 'none';
    if (label) label.style.display = 'none';
    if (recordDisplay) recordDisplay.textContent = '';
    
    const matchRow = document.getElementById(matchRowId);
    const slot1El = document.getElementById(`${matchRowId}-slot1`);
    const slot2El = document.getElementById(`${matchRowId}-slot2`);
    
    const titleCheckbox = document.getElementById(`${matchRowId}-title-check`);
    if (titleCheckbox && titleCheckbox.checked) {
        titleCheckbox.checked = false;
        const titleInput = document.getElementById(`${matchRowId}-title-name-input`);
        if (titleInput) { titleInput.style.display = 'none'; titleInput.value = ''; }
    }
    
    if (matchRow) {
        if (matchRow.dataset.isMain === 'true') {
            matchRow.style.background = "linear-gradient(to right, #fff, #fff5f5, #fff)";
            matchRow.style.borderColor = "#fca5a5";
        } else {
            matchRow.style.background = '#fff';
            matchRow.style.borderColor = '#bae6fd';
        }
        matchRow.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    }
    
    resetMatchRowRematchState(matchRowId);
    hideRematchWarning(matchRowId);
    updateWinnerDropdown(matchRowId);
    saveCurrentCardDraft();
}

function refreshTitleFightState(matchRowId) {
    const titleCheckbox = document.getElementById(`${matchRowId}-title-check`);
    const titleInput = document.getElementById(`${matchRowId}-title-name-input`);
    const slot1Input = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2Input = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    const fighter1Identifier = slot1Input?.getAttribute('data-fighter-id') || slot1Input?.value.trim();
    const fighter2Identifier = slot2Input?.getAttribute('data-fighter-id') || slot2Input?.value.trim();
    const fighter1 = getFighterByIdOrName(fighter1Identifier);
    const fighter2 = getFighterByIdOrName(fighter2Identifier);
    const hasCompleteFighters = !!slot1Input?.value.trim() && !!slot2Input?.value.trim();
    const hasValidFighterSelection = fighter1 && fighter2 && fighter1.id !== fighter2.id;
    const validTitleFight = hasValidFighterSelection && (fighter1.wins || 0) >= 5 && (fighter2.wins || 0) >= 5;

    if (!hasCompleteFighters || !hasValidFighterSelection) {
        if (titleCheckbox) {
            titleCheckbox.checked = false;
            titleCheckbox.disabled = true;
        }
        if (titleInput) {
            titleInput.style.display = 'none';
            titleInput.value = '';
            titleInput.innerHTML = '';
        }
    } else {
        if (titleCheckbox) {
            titleCheckbox.disabled = !validTitleFight;
            if (!validTitleFight && titleCheckbox.checked) {
                titleCheckbox.checked = false;
                if (titleInput) {
                    titleInput.style.display = 'none';
                    titleInput.value = '';
                    titleInput.innerHTML = '';
                }
            }
        }
    }
}

function resetMatchRowRematchState(matchRowId) {
    const matchRow = document.getElementById(matchRowId);
    const rematchCheckbox = matchRow ? matchRow.querySelector('input[type="checkbox"][onchange*="toggleRematchCounter"]') : null;
    const rematchCount = document.getElementById(`${matchRowId}-rematch-count`);
    if (rematchCheckbox) {
        rematchCheckbox.checked = false;
    }
    if (rematchCount) {
        rematchCount.style.display = 'none';
        rematchCount.value = '1';
    }
    if (matchRow) {
        delete matchRow.dataset.rematchAccepted;
        delete matchRow.dataset.rematchF1;
        delete matchRow.dataset.rematchF2;
        delete matchRow.dataset.rematchCount;
    }
}

window.setMatchRowRematchAccepted = function(matchRowId, fighter1Id, fighter2Id, count) {
    const matchRow = document.getElementById(matchRowId);
    if (!matchRow) return;
    matchRow.dataset.rematchAccepted = 'true';
    matchRow.dataset.rematchF1 = fighter1Id || '';
    matchRow.dataset.rematchF2 = fighter2Id || '';
    matchRow.dataset.rematchCount = String(count || 1);
};

window.getMatchRowAcceptedRematch = function(matchRowId) {
    const matchRow = document.getElementById(matchRowId);
    if (!matchRow || matchRow.dataset.rematchAccepted !== 'true') return null;
    return {
        accepted: true,
        fighter1Id: matchRow.dataset.rematchF1 || '',
        fighter2Id: matchRow.dataset.rematchF2 || '',
        count: Number(matchRow.dataset.rematchCount || '1')
    };
};

function areMatchRowRematchPairsEqual(f1Id, f2Id, acceptedF1Id, acceptedF2Id) {
    if (!f1Id || !f2Id || !acceptedF1Id || !acceptedF2Id) return false;
    return (f1Id === acceptedF1Id && f2Id === acceptedF2Id) || (f1Id === acceptedF2Id && f2Id === acceptedF1Id);
}

function updateFighterRecordDisplay(matchRowId, slotType, fighter) {
    const recordEl = document.getElementById(`${matchRowId}-${slotType}-record`);
    if (!recordEl) return;

    if (!fighter || typeof fighter.wins === 'undefined' || typeof fighter.losses === 'undefined') {
        recordEl.textContent = '';
        return;
    }

    const wins = Number(fighter.wins || 0);
    const losses = Number(fighter.losses || 0);
    recordEl.textContent = `${wins}W / ${losses}L`;
}

function refreshFighterRecordDisplaysForId(fighterId) {
    if (!fighterId) return;
    const fighter = fighters.find(f => f.id === fighterId);
    if (!fighter) return;

    document.querySelectorAll(`.fighter-search-input[data-fighter-id="${fighterId}"]`).forEach(input => {
        const slotContainer = input.closest('.fighter-slot');
        const matchRow = input.closest('.match-row');
        if (!slotContainer || !matchRow) return;
        const slotType = slotContainer.id.endsWith('-slot1') ? 'slot1' : 'slot2';
        updateFighterRecordDisplay(matchRow.id, slotType, fighter);
    });
}

function getFighterByIdOrName(identifier) {
    if (!identifier) return null;
    const trimmedIdentifier = String(identifier).trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();
    return fighters.find(f => f.id === trimmedIdentifier || f.name.toLowerCase() === normalizedIdentifier) || null;
}

function checkExistingFightRematch(matchRowId, changedSlot) {
    const slot1 = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    if (!slot1 || !slot2 || !slot1.value || !slot2.value) return true;

    const fighter1 = fighters.find(f => f.id === slot1.getAttribute('data-fighter-id') || f.name === slot1.value);
    const fighter2 = fighters.find(f => f.id === slot2.getAttribute('data-fighter-id') || f.name === slot2.value);
    if (!fighter1 || !fighter2 || fighter1.id === fighter2.id) return true;

    const accepted = getMatchRowAcceptedRematch(matchRowId);
    if (accepted && areMatchRowRematchPairsEqual(fighter1.id, fighter2.id, accepted.fighter1Id, accepted.fighter2Id)) {
        return true;
    }

    const historyEntries = getFightHistoryBetween(fighter1, fighter2);
    if (!historyEntries.length) {
        hideRematchWarning(matchRowId);
        return true;
    }

    const priorCount = historyEntries.length;
    const lastFight = historyEntries[historyEntries.length - 1];
    const lastWinner = lastFight.winner || 'Unknown';
    const fightNumber = priorCount + 1;
    const showName = lastFight.showName || 'Unknown show';
    const methodLabel = lastFight.method ? `${lastFight.method}` : 'Unknown method';

    showRematchWarning(matchRowId, fighter1, fighter2, {
        priorCount,
        lastWinner,
        fightNumber,
        showName,
        methodLabel
    }, changedSlot);

    return false;
}

function showRematchWarning(matchRowId, fighter1, fighter2, history, changedSlot) {
    const container = document.getElementById(`${matchRowId}-rematch-warning`);
    const text = document.getElementById(`${matchRowId}-rematch-warning-text`);
    if (!container || !text) return;
    text.innerHTML = `⚠️ <strong>${fighter1.name}</strong> and <strong>${fighter2.name}</strong> have already fought ${history.priorCount} time${history.priorCount === 1 ? '' : 's'}.<br>` +
                     `Last winner: <strong>${history.lastWinner}</strong><br>` +
                     `Show: <strong>${history.showName}</strong><br>` +
                     `Method: <strong>${history.methodLabel}</strong><br>` +
                     `<span style="display:block; margin-top:8px;">This will be fight #${history.fightNumber} between them.</span>`;
    container.style.display = 'block';

    // Disable result controls until user accepts or cancels the rematch warning
    const winSelectEl = document.getElementById(`${matchRowId}-winner-select`);
    const methodSelectEl = document.getElementById(`${matchRowId}-method-select`);
    const logBtnEl = document.getElementById(`${matchRowId}-log-btn`);
    if (winSelectEl) winSelectEl.disabled = true;
    if (methodSelectEl) methodSelectEl.disabled = true;
    if (logBtnEl) {
        // store previous styles so we can restore them
        logBtnEl.dataset.prevOpacity = logBtnEl.style.opacity || '';
        logBtnEl.dataset.prevCursor = logBtnEl.style.cursor || '';
        logBtnEl.disabled = true;
        logBtnEl.style.opacity = '0.6';
        logBtnEl.style.cursor = 'not-allowed';
    }

    const cancelBtn = document.getElementById(`${matchRowId}-rematch-cancel`);
    const allowBtn = document.getElementById(`${matchRowId}-rematch-allow`);
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            if (changedSlot === 'both') {
                clearCardFighterSlot(matchRowId, 'slot1');
                clearCardFighterSlot(matchRowId, 'slot2');
            } else {
                clearCardFighterSlot(matchRowId, changedSlot || 'slot2');
            }
            hideRematchWarning(matchRowId);
        };
    }
    if (allowBtn) {
        allowBtn.onclick = function() {
            const matchRow = document.getElementById(matchRowId);
            const rematchCheckbox = matchRow ? matchRow.querySelector('input[type="checkbox"][onchange*="toggleRematchCounter"]') : null;
            const rematchCount = document.getElementById(`${matchRowId}-rematch-count`);
            if (rematchCheckbox) {
                rematchCheckbox.checked = true;
            }
            if (rematchCount) {
                rematchCount.value = history.fightNumber;
                rematchCount.style.display = 'inline-block';
            }
            setMatchRowRematchAccepted(matchRowId, fighter1.id, fighter2.id, history.fightNumber);
            saveCurrentCardDraft();
            hideRematchWarning(matchRowId);
        };
    }
}

function hideRematchWarning(matchRowId) {
    const container = document.getElementById(`${matchRowId}-rematch-warning`);
    if (container) container.style.display = 'none';
    // Re-enable result controls
    const winSelectEl = document.getElementById(`${matchRowId}-winner-select`);
    const methodSelectEl = document.getElementById(`${matchRowId}-method-select`);
    const logBtnEl = document.getElementById(`${matchRowId}-log-btn`);
    if (winSelectEl) winSelectEl.disabled = false;
    if (methodSelectEl) methodSelectEl.disabled = false;
    if (logBtnEl) {
        logBtnEl.disabled = false;
        // restore previous styles
        if (logBtnEl.dataset.prevOpacity !== undefined) logBtnEl.style.opacity = logBtnEl.dataset.prevOpacity;
        if (logBtnEl.dataset.prevCursor !== undefined) logBtnEl.style.cursor = logBtnEl.dataset.prevCursor;
        delete logBtnEl.dataset.prevOpacity;
        delete logBtnEl.dataset.prevCursor;
    }
}

function normalizeFighterName(name) {
    if (!name) return '';
    let n = String(name).trim().toLowerCase();
    // remove year suffixes like '20 or 2020 or (20) or (2020)
    n = n.replace(/\(.*?\)/g, '');
    n = n.replace(/['’]\d{2,4}$/g, '');
    n = n.replace(/\b\d{2,4}$/g, '');
    // remove punctuation
    n = n.replace(/[^a-z0-9\s]/g, '');
    n = n.replace(/\s+/g, ' ').trim();
    return n;
}

function baseFighterName(name) {
    if (!name) return '';
    let n = String(name).trim().toLowerCase();
    // remove quoted nicknames like "Elite" or ‘Elite’ or “Elite”
    n = n.replace(/["“”'‘’].*?["“”'‘’]/g, '');
    // remove parentheses content
    n = n.replace(/\(.*?\)/g, '');
    // remove year suffixes like '20 or 2020
    n = n.replace(/["'’]\d{2,4}$/g, '');
    n = n.replace(/\b\d{2,4}$/g, '');
    // remove punctuation
    n = n.replace(/[^a-z0-9\s]/g, '');
    n = n.replace(/\s+/g, ' ').trim();
    return n;
}

function findSimilarNameOnCard(name, excludeInput) {
    const normalized = normalizeFighterName(name);
    const base = baseFighterName(name);
    if (!normalized) return null;
    const inputs = Array.from(document.querySelectorAll('.fighter-search-input'));
    for (let inp of inputs) {
        if (inp === excludeInput) continue;
        const val = inp.value || '';
        if (!val) continue;
        const normVal = normalizeFighterName(val);
        const baseVal = baseFighterName(val);
        if (!normVal) continue;
        // exact normalized match or one contains the other
        if (normVal === normalized || normVal.includes(normalized) || normalized.includes(normVal)) {
            return { input: inp, name: val };
        }
        // base name match (ignores nicknames) e.g., "Elite Cody Rhodes" vs "Cody Rhodes"
        if (base && baseVal && (base === baseVal || base.includes(baseVal) || baseVal.includes(base))) {
            return { input: inp, name: val };
        }
    }
    return null;
}

function showDuplicateWarning(matchRowId, changedSlot, existingName, newName) {
    const container = document.getElementById(`${matchRowId}-duplicate-warning`);
    const text = document.getElementById(`${matchRowId}-duplicate-warning-text`);
    if (!container || !text) return;
    text.innerHTML = `⚠️ <strong>${newName}</strong> looks similar to <strong>${existingName}</strong> already on this card.`;
    container.style.display = 'block';

    const cancelBtn = document.getElementById(`${matchRowId}-duplicate-cancel`);
    const allowBtn = document.getElementById(`${matchRowId}-duplicate-allow`);
    const replaceBtn = document.getElementById(`${matchRowId}-duplicate-replace`);

    if (cancelBtn) cancelBtn.onclick = function() {
        clearCardFighterSlot(matchRowId, changedSlot || 'slot2');
        hideDuplicateWarning(matchRowId);
    };
    if (allowBtn) allowBtn.onclick = function() {
        // simply allow; hide warning
        hideDuplicateWarning(matchRowId);
    };
    if (replaceBtn) replaceBtn.onclick = function() {
        // try to find replacement in same weight class/gender for the newName
        const changedSlotEl = document.getElementById(`${matchRowId}-${changedSlot}`);
        const changedInput = changedSlotEl ? changedSlotEl.querySelector('.fighter-search-input') : null;
        const existingSlot = document.querySelectorAll('.fighter-search-input');
        // determine target gender and division from the existing similar fighter if available
        const similar = findSimilarNameOnCard(newName, changedInput);
        let targetDivision = null;
        let targetGender = null;
        if (similar) {
            const simId = similar.input.getAttribute('data-fighter-id');
            const simF = fighters.find(f => f.id === simId) || fighters.find(f => f.name === similar.name);
            if (simF) {
                targetDivision = simF.division || simF.weightClass || simF.division;
                targetGender = simF.gender || 'male';
            }
        }
        // fallback to changed input's slot gender
        if (!targetGender && changedSlotEl) targetGender = changedSlotEl.getAttribute('data-gender') || 'male';
        // find candidate fighters
        const bookedIds = Array.from(document.querySelectorAll('.fighter-search-input')).map(i => i.getAttribute('data-fighter-id')).filter(Boolean);
        let candidates = fighters.filter(f => {
            if (bookedIds.includes(f.id)) return false;
            if (targetGender && (f.gender || 'male') !== targetGender) return false;
            if (targetDivision && (f.division || f.weightClass || '').toLowerCase() !== (targetDivision || '').toLowerCase()) return false;
            // avoid those with similar names
            const n = normalizeFighterName(f.name);
            if (n === normalizeFighterName(newName)) return false;
            return true;
        });
        if (!candidates.length) {
            customAlert('No replacement fighter found in the same weight class. Try allowing or canceling.', 'Replace Fighter');
            return;
        }
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (changedInput) {
            changedInput.value = pick.name;
            changedInput.setAttribute('data-fighter-id', pick.id);
            updateFighterRecordDisplay(matchRowId, changedSlot, pick);
            const av = document.getElementById(`${matchRowId}-${changedSlot}`).querySelector('.avatar-box');
            if (av) {
                av.innerHTML = pick.photo ? `<img src="${pick.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : pick.name.charAt(0);
                av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            }
            refreshTitleFightState(matchRowId);
            updateWinnerDropdown(matchRowId);
            saveCurrentCardDraft();
        }
        hideDuplicateWarning(matchRowId);
    };
}

function hideDuplicateWarning(matchRowId) {
    const container = document.getElementById(`${matchRowId}-duplicate-warning`);
    if (container) container.style.display = 'none';
}

function refreshDuplicateWarnings() {
    document.querySelectorAll('.match-row').forEach(row => {
        checkDuplicateOnCard(row.id, 'both');
    });
}

function findDuplicatePairInMatchRow(matchRowId) {
    const s1 = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const s2 = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    if (!s1 || !s2 || !s1.value || !s2.value) return null;
    const sim1 = findSimilarNameOnCard(s1.value.trim(), s1);
    const sim2 = findSimilarNameOnCard(s2.value.trim(), s2);
    if (sim1) return { slotType: 'slot1', similar: sim1, value: s1.value.trim() };
    if (sim2) return { slotType: 'slot2', similar: sim2, value: s2.value.trim() };
    return null;
}

function checkDuplicateOnCard(matchRowId, changedSlot) {
    const duplicatePair = findDuplicatePairInMatchRow(matchRowId);
    if (duplicatePair) {
        showDuplicateWarning(matchRowId, duplicatePair.slotType, duplicatePair.similar.name, duplicatePair.value);
        return false;
    }
    hideDuplicateWarning(matchRowId);
    return true;
}

window.toggleRematchCounter = function(id, cb) {
    const el = document.getElementById(`${id}-rematch-count`); if (el) el.style.display = cb.checked ? "inline-block" : "none";
};

window.toggleTitleFight = function(matchRowId, checkbox) {
    const titleInput = document.getElementById(`${matchRowId}-title-name-input`);
    const slot1Input = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2Input = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    const fighter1 = slot1Input ? fighters.find(f => f.id === slot1Input.getAttribute('data-fighter-id') || f.name === slot1Input.value) : null;
    const fighter2 = slot2Input ? fighters.find(f => f.id === slot2Input.getAttribute('data-fighter-id') || f.name === slot2Input.value) : null;

    const matchRow = document.getElementById(matchRowId);
    const slot1 = document.getElementById(`${matchRowId}-slot1`);
    const slot2 = document.getElementById(`${matchRowId}-slot2`);
    const clearTitleGlow = () => {
        if (matchRow) {
            if (matchRow.dataset.isMain === 'true') {
                matchRow.style.background = "linear-gradient(to right, #fff, #fff5f5, #fff)";
                matchRow.style.borderColor = "#fca5a5";
            } else {
                matchRow.style.background = '#fff';
                matchRow.style.borderColor = '#bae6fd';
            }
            matchRow.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }
    };
    const applyTitleGlow = () => {
        if (matchRow) {
            matchRow.style.background = 'linear-gradient(to right, #fffaf0, #fff5d6, #fef3c7)';
            matchRow.style.borderColor = '#fbbf24';
        }
    };

    if (!checkbox.checked) {
        if (titleInput) { titleInput.style.display = 'none'; titleInput.value = ''; }
        clearTitleGlow();
        return;
    }

    if (!fighter1 || !fighter2) {
        customAlert('Select both competitors before enabling a Title fight.', 'Title Fight');
        checkbox.checked = false;
        if (titleInput) { titleInput.style.display = 'none'; titleInput.value = ''; }
        return;
    }

    if ((fighter1.wins || 0) < 5 || (fighter2.wins || 0) < 5) {
        customAlert('Title fights require both competitors to have 5 wins or more. Please book a qualifying matchup.', 'Title Fight');
        checkbox.checked = false;
        if (titleInput) { titleInput.style.display = 'none'; titleInput.value = ''; }
        return;
    }

    if (titleInput) {
        // populate dropdown with available titles matching gender
        titleInput.style.display = 'inline-block';
        populateTitleDropdown(matchRowId);
        titleInput.focus();
    }
    applyTitleGlow();
    // Note: Manual finalize button removed — titles will be applied automatically when logging results.
};

window.updateTitleFinalizeState = function(matchRowId) {
    // Deprecated: manual finalize removed. Keep function for compatibility but do nothing.
};

window.finalizeTitleFight = function(matchRowId) {
    // Manual finalize removed — title finalization now occurs when logging match results.
};

window.populateTitleDropdown = function(matchRowId) {
    const select = document.getElementById(`${matchRowId}-title-name-input`);
    if (!select) return;
    // clear existing
    select.innerHTML = '';

    const slot1Input = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2Input = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    const fighter1 = slot1Input ? fighters.find(f => f.id === slot1Input.getAttribute('data-fighter-id') || f.name === slot1Input.value) : null;
    const fighter2 = slot2Input ? fighters.find(f => f.id === slot2Input.getAttribute('data-fighter-id') || f.name === slot2Input.value) : null;
    const gender = slot1Input?.closest('.fighter-slot')?.getAttribute('data-gender') || (fighter1 ? fighter1.gender : 'male');

    const titles = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    // add placeholder
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.text = 'Select title...';
    select.appendChild(placeholder);

    titles.forEach(t => {
        if ((t.gender || 'male') !== gender) return; // only correct gender
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.setAttribute('data-name', t.name);
        // if title is held by someone not in this match, disable option and mark
        if (t.championId && !(fighter1 && fighter1.id === t.championId) && !(fighter2 && fighter2.id === t.championId)) {
            opt.disabled = true;
            const holder = fighters.find(f => f.id === t.championId);
            opt.text = `${t.name} (Held by ${holder ? holder.name : 'Someone'})`;
        } else {
            opt.text = t.name;
        }
        select.appendChild(opt);
    });
};

window.uploadFighterPhotoFromCard = function(fighterId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            openPhotoCropDialog(event.target.result, fighterId, false);
        };
        reader.readAsDataURL(file);
    };
    input.click();
};

window.openPhotoCropDialog = function(imageSrc, fighterId, isRoster) {
    if (document.getElementById('photoCropDialog')) {
        document.getElementById('photoCropDialog').remove();
    }

    const dialog = document.createElement('div');
    dialog.id = 'photoCropDialog';
    dialog.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:5000; display:flex; align-items:center; justify-content:center;';

    dialog.innerHTML = `
        <div style="background:white; border-radius:12px; padding:20px; max-width:500px; width:90%; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 16px 0; color:#0f172a; font-weight:800;">Crop Fighter Photo</h3>
            <div style="position:relative; width:100%; height:300px; background:#f1f5f9; border-radius:8px; overflow:hidden; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
                <img id="cropImagePreview" src="${imageSrc}" style="max-width:100%; max-height:100%; cursor:grab; user-select:none; object-fit:contain;" draggable="false">
                <div id="cropFrame" style="position:absolute; width:200px; height:200px; border:2px dashed rgba(0,0,0,0.25); box-shadow:0 6px 16px rgba(0,0,0,0.15); border-radius:8px; pointer-events:none;"></div>
            </div>
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:16px;">
                <div style="position:relative; width:150px; height:150px; border:2px solid #0284c7; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f8fafc;">
                    <canvas id="cropCircleCanvas" width="150" height="150" style="width:150px; height:150px; display:block; border-radius:50%;"></canvas>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="font-size:0.85rem; font-weight:700; color:#0f172a;">Avatar Preview</div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <div style="width:44px; height:44px; border-radius:50%; overflow:hidden; background:#fff; display:flex; align-items:center; justify-content:center;" id="cropSmallContainer">
                            <canvas id="cropSmallCanvas" width="44" height="44" style="width:44px; height:44px; border-radius:50%; display:block;"></canvas>
                        </div>
                        <div style="width:72px; height:72px; border-radius:50%; overflow:hidden; background:#fff; display:flex; align-items:center; justify-content:center;" id="cropMediumContainer">
                            <canvas id="cropMediumCanvas" width="72" height="72" style="width:72px; height:72px; border-radius:50%; display:block;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:8px; font-size:0.75rem; color:#64748b; margin-bottom:16px; align-items:center;">
                <span>📏 Position:</span>
                <input type="range" id="cropOffsetX" min="-800" max="800" value="0" style="flex:1;">
                <input type="range" id="cropOffsetY" min="-800" max="800" value="0" style="flex:1;">
                <input type="range" id="cropZoom" min="10" max="400" value="100" style="flex:1;">
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="saveCroppedPhoto('${fighterId}', ${isRoster ? 'true' : 'false'})" style="flex:1; background:#10b981; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✓ Save Photo</button>
                <button onclick="deleteFighterPhoto('${fighterId}', ${isRoster ? 'true' : 'false'})" style="flex:1; background:#f97316; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">🗑️ Delete Photo</button>
                <button onclick="document.getElementById('photoCropDialog').remove()" style="flex:1; background:#ef4444; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✕ Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const previewImg = document.getElementById('cropImagePreview');
    const circleCanvas = document.getElementById('cropCircleCanvas');
    const smallCanvas = document.getElementById('cropSmallCanvas');
    const mediumCanvas = document.getElementById('cropMediumCanvas');
    const offsetXSlider = document.getElementById('cropOffsetX');
    const offsetYSlider = document.getElementById('cropOffsetY');
    const zoomSlider = document.getElementById('cropZoom');
    let isGrabbing = false;
    let grabStartX = 0, grabStartY = 0;

    const srcImage = new Image();
    srcImage.crossOrigin = 'anonymous';
    srcImage.src = imageSrc;
    window._rosterCropSrcImage = srcImage;

    const drawPreviewToCanvas = (canvas, size) => {
        if (!srcImage || !srcImage.naturalWidth) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
        ctx.clip();

        const offsetX = parseInt(offsetXSlider.value, 10) || 0;
        const offsetY = parseInt(offsetYSlider.value, 10) || 0;
        const zoom = parseInt(zoomSlider.value, 10) || 100;

        const scale = zoom / 100;
        const scaledWidth = srcImage.naturalWidth * scale;
        const scaledHeight = srcImage.naturalHeight * scale;
        const factor = size / 200;
        const dstWidth = scaledWidth * factor;
        const dstHeight = scaledHeight * factor;
        const x = size/2 - dstWidth/2 + offsetX * factor;
        const y = size/2 - dstHeight/2 + offsetY * factor;
        ctx.drawImage(srcImage, x, y, dstWidth, dstHeight);
        ctx.restore();
    };

    const updatePreview = () => {
        const frame = document.getElementById('cropFrame');
        if (frame) {
            frame.style.left = `calc(50% - ${frame.offsetWidth/2}px)`;
            frame.style.top = `calc(50% - ${frame.offsetHeight/2}px)`;
        }
        if (srcImage && srcImage.complete) {
            drawPreviewToCanvas(circleCanvas, 150);
            drawPreviewToCanvas(smallCanvas, 44);
            drawPreviewToCanvas(mediumCanvas, 72);
        }
    };

    previewImg.addEventListener('mousedown', (e) => {
        isGrabbing = true;
        grabStartX = e.clientX;
        grabStartY = e.clientY;
        previewImg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isGrabbing) return;
        const deltaX = e.clientX - grabStartX;
        const deltaY = e.clientY - grabStartY;
        const newX = Math.max(parseInt(offsetXSlider.min, 10), Math.min(parseInt(offsetXSlider.max, 10), parseInt(offsetXSlider.value || 0, 10) + deltaX));
        const newY = Math.max(parseInt(offsetYSlider.min, 10), Math.min(parseInt(offsetYSlider.max, 10), parseInt(offsetYSlider.value || 0, 10) + deltaY));
        offsetXSlider.value = newX;
        offsetYSlider.value = newY;
        grabStartX = e.clientX;
        grabStartY = e.clientY;
        updatePreview();
    });

    document.addEventListener('mouseup', () => {
        isGrabbing = false;
        previewImg.style.cursor = 'grab';
    });

    offsetXSlider.addEventListener('input', updatePreview);
    offsetYSlider.addEventListener('input', updatePreview);
    zoomSlider.addEventListener('input', updatePreview);

    srcImage.onload = updatePreview;
};

window.saveCroppedPhoto = async function(fighterId, isRoster) {
    const offsetXSlider = document.getElementById('cropOffsetX');
    const offsetYSlider = document.getElementById('cropOffsetY');
    const zoomSlider = document.getElementById('cropZoom');

    const offsetX = parseInt(offsetXSlider.value, 10) || 0;
    const offsetY = parseInt(offsetYSlider.value, 10) || 0;
    const zoom = parseInt(zoomSlider.value, 10) || 100;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.clip();

    const srcImage = window._rosterCropSrcImage || new Image();
    const performSave = async () => {
        const scale = zoom / 100;
        const scaledWidth = srcImage.naturalWidth * scale;
        const scaledHeight = srcImage.naturalHeight * scale;
        const x = canvas.width / 2 - scaledWidth / 2 + offsetX;
        const y = canvas.height / 2 - scaledHeight / 2 + offsetY;
        ctx.drawImage(srcImage, x, y, scaledWidth, scaledHeight);

        const croppedPhoto = canvas.toDataURL('image/jpeg');
        const fighter = fighters.find(f => f.id === fighterId);
        if (!fighter) return;

        let saved = false;
        const photoKey = fighter.photo_key || `fighter-photo-${fighter.id}`;

        const tryIDBDirect = async () => {
            try {
                await storeFighterPhotoInIDB(photoKey, croppedPhoto);
                fighter.photo_key = photoKey;
                fighter.photo = croppedPhoto;
                saveFighters(fighters);
                return true;
            } catch (err) {
                console.warn('IDB save failed, trying smaller versions', err);
                return false;
            }
        };

        const tryIDBWithFallbacks = async () => {
            const qualitySteps = [0.7, 0.5, 0.3, 0.1];
            for (let q of qualitySteps) {
                const smaller = canvas.toDataURL('image/jpeg', q);
                try {
                    await storeFighterPhotoInIDB(photoKey, smaller);
                    fighter.photo_key = photoKey;
                    fighter.photo = smaller;
                    saveFighters(fighters);
                    return true;
                } catch (err) {
                    continue;
                }
            }

            const dimensions = [150, 128, 100];
            for (let size of dimensions) {
                const smallCanvas = document.createElement('canvas');
                smallCanvas.width = size;
                smallCanvas.height = size;
                const smallCtx = smallCanvas.getContext('2d');
                smallCtx.fillStyle = '#ffffff';
                smallCtx.fillRect(0, 0, size, size);
                smallCtx.beginPath();
                smallCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
                smallCtx.clip();
                const factor = size / 200;
                const xSmall = size / 2 - (srcImage.naturalWidth * zoom / 100) * factor / 2 + offsetX * factor;
                const ySmall = size / 2 - (srcImage.naturalHeight * zoom / 100) * factor / 2 + offsetY * factor;
                const scaledWidth = srcImage.naturalWidth * (zoom / 100) * factor;
                const scaledHeight = srcImage.naturalHeight * (zoom / 100) * factor;
                smallCtx.drawImage(srcImage, xSmall, ySmall, scaledWidth, scaledHeight);

                for (let q of qualitySteps) {
                    const smaller = smallCanvas.toDataURL('image/jpeg', q);
                    try {
                        await storeFighterPhotoInIDB(photoKey, smaller);
                        fighter.photo_key = photoKey;
                        fighter.photo = smaller;
                        saveFighters(fighters);
                        return true;
                    } catch (err) {
                        continue;
                    }
                }
            }
            return false;
        };

        try {
            saved = await tryIDBDirect();
        } catch (err) {
            saved = await tryIDBWithFallbacks();
        }

        if (!saved) {
            alert('Unable to save this image due to an unexpected error. Please try again.');
        }

        if (isRoster) {
            const rosterSearch = document.getElementById('rosterSearchInput');
            const searchQuery = rosterSearch ? rosterSearch.value : '';
            const hadFocus = document.activeElement === rosterSearch;
            renderRosterGrid();
            const rs = document.getElementById('rosterSearchInput');
            if (rs) {
                rs.value = searchQuery;
                filterRosterCards();
                if (hadFocus) rs.focus();
            }
            setTimeout(() => {
                const el = document.getElementById(`fighter-card-${fighterId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    };

    if (srcImage && srcImage.naturalWidth) {
        await performSave();
    } else {
        srcImage.crossOrigin = 'anonymous';
        srcImage.src = document.getElementById('cropImagePreview').src;
        srcImage.onload = async () => await performSave();
    }

    if (document.getElementById('photoCropDialog')) {
        document.getElementById('photoCropDialog').remove();
    }
};

window.deleteFighterPhoto = async function(fighterId, isRoster) {
    const fighter = fighters.find(f => f.id === fighterId);
    if (!fighter) return;
    customConfirm(`Delete ${fighter.name}'s photo? This cannot be undone.`, async function(result) {
        if (!result) return;
        if (fighter.photo_key) {
            try {
                await deleteFighterPhotoFromIDB(fighter.photo_key);
            } catch (err) {
                console.warn('Failed to delete photo from IDB', err);
            }
        }
        delete fighter.photo;
        delete fighter.photo_key;
        saveFighters(fighters);
        if (document.getElementById('photoCropDialog')) document.getElementById('photoCropDialog').remove();
        if (isRoster) {
            renderRosterGrid();
        } else {
            document.querySelectorAll(`.avatar-box`).forEach(av => {
                const input = av.closest('.fighter-slot')?.querySelector('.fighter-search-input');
                if (input && input.getAttribute('data-fighter-id') === fighterId) {
                    av.innerHTML = fighter.name.charAt(0);
                    av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
                }
            });
        }
    }, 'Delete Photo');
};

window.deleteFighterPhotoCard = function(fighterId) {
    deleteFighterPhoto(fighterId, false);
};

function buildModalContainer() {
    if (document.getElementById('suggestionModal')) return;
    let modal = document.createElement('div'); modal.id = 'suggestionModal';
    modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(9,15,28,0.75); z-index:1000; align-items:center; justify-content:center; backdrop-filter:blur(4px); font-family:sans-serif;';
    modal.innerHTML = `
      <div style="background:#111c2e; border-radius:12px; width:95%; max-width:750px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); border:1px solid #1e293b; overflow:hidden; display:flex; flex-direction:column;">
          <div style="background:#1a2638; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b;">
              <div><h3 style="margin:0; color:#ffffff; font-size:1.05rem; font-weight:bold;">👑 Suggested Opponents</h3><span id="modalF1Header" style="font-size:0.75rem; color:#94a3b8; font-weight:600; text-transform:uppercase; margin-top:2px; display:block;">Best skill-level matches</span></div>
              <button onclick="closeSuggestionModal()" style="background:none; border:none; color:#64748b; font-size:1.3rem; cursor:pointer; font-weight:bold;">✕</button>
          </div>
          <div id="suggestionModalGrid" style="padding:20px; max-height:480px; overflow-y:auto; display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:16px; background:#0f172a;"></div>
      </div>`;
    document.body.appendChild(modal);
}

window.closeSuggestionModal = function() { document.getElementById('suggestionModal').style.display = 'none'; };

function pickTwoDistinctFighters(list) {
    if (!Array.isArray(list) || list.length < 2) return null;
    const idx1 = Math.floor(Math.random() * list.length);
    let idx2 = Math.floor(Math.random() * list.length);
    while (idx2 === idx1 && list.length > 1) {
        idx2 = Math.floor(Math.random() * list.length);
    }
    if (idx1 === idx2) return null;
    return [list[idx1], list[idx2]];
}

window.randomizeEntireShow = function() {
    if (isShowCompleted(activeShowId) || window.hasActiveShowResults()) {
        customAlert('This show has already begun or been finalized. Reset the show or switch cards before randomizing.', 'Randomize Disabled');
        return;
    }
    const matchRows = document.querySelectorAll('.match-row');
    if (!matchRows.length) {
        customAlert('No match rows found to randomize.', 'Randomize Show');
        return;
    }

    let successCount = 0;
    let failCount = 0;
    
    matchRows.forEach(row => {
        const matchId = row.id;
        if (!matchId) return;
        
        // Collect all currently booked fighter IDs
        let bookedFighterIds = [];
        document.querySelectorAll('.fighter-search-input').forEach(inp => {
            const fighterId = inp.getAttribute('data-fighter-id');
            if (fighterId && !bookedFighterIds.includes(fighterId)) bookedFighterIds.push(fighterId);
        });
        
        // Also exclude fighters in completed matches
        Object.keys(completedMatches || {}).forEach(cMatchId => {
            const state = completedMatches[cMatchId];
            if (state) {
                const fWin = fighters.find(f => f.name === state.winnerName);
                const fLos = fighters.find(f => f.name === state.loserName);
                if (fWin && !bookedFighterIds.includes(fWin.id)) bookedFighterIds.push(fWin.id);
                if (fLos && !bookedFighterIds.includes(fLos.id)) bookedFighterIds.push(fLos.id);
            }
        });
        
        // Filter available fighters by gender and division groups
        const reservedPairs = new Set(getReservedOpponentPairsFromOtherShows());
        const availableFighters = fighters.filter(f => !bookedFighterIds.includes(f.id));
        const fightersByGenderAndDivision = {};
        availableFighters.forEach(f => {
            const gender = (f.gender || 'male').toLowerCase();
            const div = (f.division || 'Heavyweight').toLowerCase();
            fightersByGenderAndDivision[gender] = fightersByGenderAndDivision[gender] || {};
            fightersByGenderAndDivision[gender][div] = fightersByGenderAndDivision[gender][div] || [];
            fightersByGenderAndDivision[gender][div].push(f);
        });

        const validGenderChoices = Object.keys(fightersByGenderAndDivision).filter(gender => {
            return Object.values(fightersByGenderAndDivision[gender]).some(list => list.length >= 2);
        });
        if (validGenderChoices.length === 0) {
            failCount++;
            return;
        }

        const selectedGender = validGenderChoices[Math.floor(Math.random() * validGenderChoices.length)];
        const validDivisions = Object.entries(fightersByGenderAndDivision[selectedGender]).filter(([, list]) => list.length >= 2);
        if (!validDivisions.length) {
            failCount++;
            return;
        }

        const [randomDivision, divisionalFighters] = validDivisions[Math.floor(Math.random() * validDivisions.length)];
        const allowedPairs = [];
        for (let i = 0; i < divisionalFighters.length - 1; i++) {
            for (let j = i + 1; j < divisionalFighters.length; j++) {
                const f1 = divisionalFighters[i];
                const f2 = divisionalFighters[j];
                const key = window.makeOpponentPairKey(f1.id, f2.id);
                if (!reservedPairs.has(key)) {
                    allowedPairs.push([f1, f2]);
                }
            }
        }
        if (!allowedPairs.length) {
            failCount++;
            return;
        }
        const chosenPair = allowedPairs[Math.floor(Math.random() * allowedPairs.length)];
        const [fighter1, fighter2] = chosenPair;
        
        // Set the gender for this match based on the chosen fighters
        setMatchRowSelectedGender(matchId, selectedGender);
        
        // Populate both slots
        const slot1 = document.getElementById(`${matchId}-slot1`);
        const slot2 = document.getElementById(`${matchId}-slot2`);
        
        if (slot1 && slot2) {
            // Slot 1
            const input1 = slot1.querySelector('.fighter-search-input');
            input1.value = fighter1.name;
            input1.setAttribute('data-fighter-id', fighter1.id);
            const av1 = slot1.querySelector('.avatar-box');
            av1.innerHTML = fighter1.photo ? `<img src="${fighter1.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">` : fighter1.name.charAt(0);
            av1.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            av1.onclick = function(e) { e.stopPropagation(); uploadFighterPhotoFromCard(fighter1.id); };
            updateFighterRecordDisplay(matchId, 'slot1', fighter1);
            
            // Slot 2
            const input2 = slot2.querySelector('.fighter-search-input');
            input2.value = fighter2.name;
            input2.setAttribute('data-fighter-id', fighter2.id);
            const av2 = slot2.querySelector('.avatar-box');
            av2.innerHTML = fighter2.photo ? `<img src="${fighter2.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">` : fighter2.name.charAt(0);
            av2.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            av2.onclick = function(e) { e.stopPropagation(); uploadFighterPhotoFromCard(fighter2.id); };
            updateFighterRecordDisplay(matchId, 'slot2', fighter2);
            
            refreshTitleFightState(matchId);

            // Update winner dropdown
            updateWinnerDropdown(matchId);
            
            // Check for rematch warnings
            checkExistingFightRematch(matchId, 'both');
            // Also check for duplicate-name warnings (show warnings but continue)
            try { checkDuplicateOnCard(matchId, 'both'); } catch (e) {}
            
            successCount++;
        }
    });
    
    // Save draft
    saveCurrentCardDraft();
    
    const message = failCount > 0 
        ? `🎲 Randomized ${successCount} match${successCount !== 1 ? 'es' : ''}!\n\n⚠️ Could not randomize ${failCount} match${failCount !== 1 ? 'es' : ''} - not enough available fighters.`
        : `🎲 All ${successCount} match${successCount !== 1 ? 'es' : ''} randomized! Gender sliders updated.`;
    
    customAlert(message, 'Randomize Show');
};

window.randomizeMatchup = function(matchId) {
    if (isShowCompleted(activeShowId) || window.hasActiveShowResults()) {
        return customAlert('This show has already begun or been finalized. Reset the show or switch cards before randomizing.', 'Randomize Disabled');
    }
    const row = document.getElementById(matchId);
    const slot1 = document.getElementById(`${matchId}-slot1`);
    const slot2 = document.getElementById(`${matchId}-slot2`);
    
    if (!slot1 || !slot2) return customAlert('Match row not found.', 'Match Error');
    
    // Collect all booked fighter IDs (by explicit id or typed name) and logged/completed matches
    let bookedFighterIds = [];
    const reservedPairs = new Set(getReservedOpponentPairsFromOtherShows());
    document.querySelectorAll('.fighter-search-input').forEach(inp => {
        const fighterId = inp.getAttribute('data-fighter-id');
        if (fighterId) {
            if (!bookedFighterIds.includes(fighterId)) bookedFighterIds.push(fighterId);
        } else if (inp.value && inp.value.trim()) {
            // If user typed a name but didn't select from dropdown, resolve it to an id
            const typed = inp.value.trim();
            const found = fighters.find(ff => ff.name === typed);
            if (found && !bookedFighterIds.includes(found.id)) bookedFighterIds.push(found.id);
        }
    });
    // Also exclude fighters already logged in completed matches for the active show
    Object.keys(completedMatches || {}).forEach(matchId => {
        const state = completedMatches[matchId];
        if (state) {
            const fWin = fighters.find(f => f.name === state.winnerName);
            const fLos = fighters.find(f => f.name === state.loserName);
            if (fWin && !bookedFighterIds.includes(fWin.id)) bookedFighterIds.push(fWin.id);
            if (fLos && !bookedFighterIds.includes(fLos.id)) bookedFighterIds.push(fLos.id);
        }
    });
    
    // Filter available fighters: same gender, not booked, have a valid division
    const availableFighters = fighters.filter(f => 
        !bookedFighterIds.includes(f.id)
    );
    
    const fightersByGenderAndDivision = {};
    availableFighters.forEach(f => {
        const gender = f.gender || 'male';
        const div = (f.division || 'Heavyweight').toLowerCase();
        fightersByGenderAndDivision[gender] = fightersByGenderAndDivision[gender] || {};
        fightersByGenderAndDivision[gender][div] = fightersByGenderAndDivision[gender][div] || [];
        fightersByGenderAndDivision[gender][div].push(f);
    });

    const validGenderChoices = Object.keys(fightersByGenderAndDivision).filter(gender => {
        return Object.values(fightersByGenderAndDivision[gender]).some(list => list.length >= 2);
    });

    if (validGenderChoices.length === 0) {
        return customAlert('Not enough available fighters of any gender! You need at least 2 unbooked fighters in the same division.', 'Randomize Matchup');
    }

    const selectedGender = validGenderChoices[Math.floor(Math.random() * validGenderChoices.length)];
    const validDivisions = Object.entries(fightersByGenderAndDivision[selectedGender]).filter(([, list]) => list.length >= 2);
    const randomDivision = validDivisions[Math.floor(Math.random() * validDivisions.length)][0];
    const divisionalFighters = fightersByGenderAndDivision[selectedGender][randomDivision] || [];
    const selectedDivision = randomDivision;

    if (!divisionalFighters.length) {
        return customAlert(`No weight class has 2+ available ${selectedGender} fighters! Add more wrestlers to the roster.`, 'Randomize Matchup');
    }

    const allowedPairs = [];
    for (let i = 0; i < divisionalFighters.length - 1; i++) {
        for (let j = i + 1; j < divisionalFighters.length; j++) {
            const f1 = divisionalFighters[i];
            const f2 = divisionalFighters[j];
            const key = window.makeOpponentPairKey(f1.id, f2.id);
            if (!reservedPairs.has(key)) {
                allowedPairs.push([f1, f2]);
            }
        }
    }
    if (!allowedPairs.length) {
        return customAlert(`No weight class has 2+ available ${selectedGender} fighters who are not already paired elsewhere.`, 'Randomize Matchup');
    }
    const chosenPair = allowedPairs[Math.floor(Math.random() * allowedPairs.length)];
    const [fighter1, fighter2] = chosenPair;
    
    // Populate slot 1
    const input1 = slot1.querySelector('.fighter-search-input');
    input1.value = fighter1.name;
    input1.setAttribute('data-fighter-id', fighter1.id);
    const av1 = slot1.querySelector('.avatar-box');
    let content1 = '';
    if (fighter1.photo) {
        content1 = `<img src="${fighter1.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">`;
    } else {
        content1 = fighter1.name.charAt(0);
    }
    av1.innerHTML = content1;
    av1.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
    av1.onclick = function(e) { e.stopPropagation(); uploadFighterPhotoFromCard(fighter1.id); };
    
    // Populate slot 2
    const input2 = slot2.querySelector('.fighter-search-input');
    input2.value = fighter2.name;
    input2.setAttribute('data-fighter-id', fighter2.id);
    const av2 = slot2.querySelector('.avatar-box');
    let content2 = '';
    if (fighter2.photo) {
        content2 = `<img src="${fighter2.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">`;
    } else {
        content2 = fighter2.name.charAt(0);
    }
    av2.innerHTML = content2;
    av2.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
    av2.onclick = function(e) { e.stopPropagation(); uploadFighterPhotoFromCard(fighter2.id); };
    
    // Reset title fight state for the newly randomized match
    refreshTitleFightState(matchId);

    // Sync gender controls to the chosen fighters' gender
    setMatchRowSelectedGender(matchId, selectedGender);

    // Check for previous fight history between the chosen fighters
    if (!checkExistingFightRematch(matchId, 'both')) {
        return;
    }
    if (!checkDuplicateOnCard(matchId, 'both')) {
        return;
    }

    // Update winner dropdown
    updateWinnerDropdown(matchId);
    
    // Save draft
    saveCurrentCardDraft();
    
    // Show confirmation
    const divisionDisplay = selectedDivision.charAt(0).toUpperCase() + selectedDivision.slice(1);
    customAlert(`🎲 Randomized!\n\n${fighter1.name} vs ${fighter2.name}\n(${divisionDisplay})`, 'Match Randomized');
};

window.suggestOpponent = function(id) {
    activeMatchId = id; 
    const row = document.getElementById(id); 
    const sel1 = row.querySelector('.fighter-search-input');
    
    if (!sel1 || !sel1.getAttribute('data-fighter-id')) {
        return customAlert('Select Fighter 1 first!', 'Suggest Opponent');
    }
    
    const f1 = fighters.find(f => f.id === sel1.getAttribute('data-fighter-id'));
    document.getElementById('modalF1Header').textContent = `Matches for ${f1.name} (${f1.wins}W-${f1.losses}L)`;
    
    let historyLog = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    let totalPastEvents = historyLog.length;
    let candidates = [];
    let t1 = f1.wins + f1.losses;
    let r1 = t1 === 0 ? 0 : f1.wins / t1;
    const slot2 = document.getElementById(`${id}-slot2`);
    const currentOpponentId = slot2 ? slot2.querySelector('.fighter-search-input')?.getAttribute('data-fighter-id') : null;

    // Collect all already-booked fighter IDs on this card
    let bookedFighterIds = [];
    document.querySelectorAll('.fighter-search-input').forEach(inp => {
        const fighterId = inp.getAttribute('data-fighter-id');
        if (fighterId && fighterId !== sel1.getAttribute('data-fighter-id')) {
            bookedFighterIds.push(fighterId);
        }
    });

    fighters.forEach(c => {
        if (c.id === f1.id) return; // never suggest the same fighter

        // Check if fighter is already booked in another match (unless they're the current opponent)
        const isBookedElsewhere = bookedFighterIds.includes(c.id);
        if (isBookedElsewhere && !(currentOpponentId && c.id === currentOpponentId)) {
            return; // skip already-booked fighters
        }

        // always allow current opponent (if set) regardless of benching checks, but still require same division
        if (currentOpponentId && c.id === currentOpponentId) {
            // include current opponent as high-priority candidate
        } else {
            // enforce same gender and division
            if (c.gender !== f1.gender || (c.division || '').toLowerCase() !== (f1.division || '').toLowerCase()) return;
        }

        let t2 = c.wins + c.losses;
        let r2 = t2 === 0 ? 0 : c.wins / t2;
        let diff = Math.abs(r1 - r2);

        let lastEventIndex = -1;
        for (let i = 0; i < historyLog.length; i++) {
            let matchFound = historyLog[i].matches.some(m => m.winner === c.name || m.loser === c.name);
            if (matchFound) { lastEventIndex = i; break; }
        }

        let showsBenched = (lastEventIndex === -1) ? totalPastEvents : lastEventIndex;
        candidates.push({ fighter: c, diff: diff, ratio: r2, benchedCount: showsBenched, isCurrentOpponent: currentOpponentId === c.id });
    });

    // sort: prefer current opponent first, then most benched, then closest winrate
    candidates.sort((a, b) => {
        if (a.isCurrentOpponent && !b.isCurrentOpponent) return -1;
        if (b.isCurrentOpponent && !a.isCurrentOpponent) return 1;
        if (b.benchedCount !== a.benchedCount) return b.benchedCount - a.benchedCount;
        return a.diff - b.diff;
    });
    let grid = document.getElementById('suggestionModalGrid'); 
    grid.innerHTML = '';
    // store last candidates for random picker
    window.__lastSuggestionCandidates = candidates.map(c => c.fighter.id);

    // insert (or refresh) random pick button above the grid
    const existingWrapper = document.getElementById('suggestRandomWrapper');
    if (existingWrapper) existingWrapper.remove();
    const wrapper = document.createElement('div');
    wrapper.id = 'suggestRandomWrapper';
    wrapper.style.cssText = 'display:flex; justify-content:flex-end; padding:8px 12px; gap:8px;';
    const randBtn = document.createElement('button');
    randBtn.id = 'suggestRandomBtn';
    randBtn.textContent = '🎲 Random Pick';
    randBtn.style.cssText = 'background:#ef4444; border:none; color:white; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;';
    randBtn.onclick = function() {
        const list = window.__lastSuggestionCandidates || [];
        if (!list.length) return customAlert('No candidates available to pick.', 'Random Pick');
        const pick = list[Math.floor(Math.random() * list.length)];
        bookSuggested(pick);
    };
    wrapper.appendChild(randBtn);
    grid.parentNode.insertBefore(wrapper, grid);
    
    if (candidates.length === 0) { 
        grid.innerHTML = `<p style="color:#94a3b8; text-align:center; grid-column:span 3; padding:12px 0;">No matching contenders found.</p>`; 
    } else {
        candidates.forEach((item, idx) => {
            let c = item.fighter; 
            let card = document.createElement('div');
            card.style.cssText = 'background:#1e293b; border:1px solid #334155; border-radius:10px; padding:16px; display:flex; flex-direction:column; align-items:center; position:relative;';
            
            let rustBadgeHtml = '';
            if (item.isCurrentOpponent) {
                rustBadgeHtml = `<span style="position:absolute; top:8px; right:8px; font-size:0.58rem; font-weight:800; background:#10b981; color:white; padding:2px 6px; border-radius:4px;">CURRENT OPPONENT</span>`;
            } else if (item.benchedCount >= 5) {
                rustBadgeHtml = `<span style="position:absolute; top:8px; right:8px; font-size:0.58rem; font-weight:800; background:#ef4444; color:white; padding:2px 6px; border-radius:4px;">⚠️ INACTIVE (${item.benchedCount} SHOWS)</span>`;
            } else if (item.benchedCount > 0) {
                rustBadgeHtml = `<span style="position:absolute; top:8px; right:8px; font-size:0.58rem; font-weight:bold; background:#475569; color:#cbd5e1; padding:2px 6px; border-radius:4px;">💤 Idle ${item.benchedCount} shows</span>`;
            }

            let tagColor = idx === 0 ? '#eab308' : '#334155'; 
            let tagText = idx === 0 ? '#0f172a' : '#94a3b8';
            let tot = c.wins + c.losses; 
            let rate = tot === 0 ? 0 : Math.round(item.ratio * 100);
            
                        card.innerHTML = `
              <span style="position:absolute; top:8px; left:8px; font-size:0.6rem; font-weight:800; background:${tagColor}; color:${tagText}; padding:2px 6px; border-radius:4px;">#${idx + 1} RANK</span>
              ${rustBadgeHtml}
              <div style="width:48px; height:48px; background:#334155; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-top:20px; margin-bottom:10px; border:2px solid #475569; color:#94a3b8;">👤</div>
              <h4 style="margin:0; font-size:0.95rem; color:#fff; font-weight:bold;">${c.name}</h4>
              <span style="font-size:0.65rem; color:#38bdf8; font-weight:bold; text-transform:uppercase;">${c.division}</span>
              <div style="margin:12px 0 6px 0;"><span style="font-size:1.3rem; font-weight:900; color:#10b981; display:block;">${c.wins} - ${c.losses}</span></div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; width:100%; border-top:1px solid #334155; padding-top:8px; font-size:0.6rem; color:#64748b; gap:4px; text-align:center;">
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${c.win_pinfall||0}</span>PINS</div>
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${c.win_ko||0}</span>KO</div>
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${c.win_submission||0}</span>SUB</div>
              </div>
              <button onclick="bookSuggested('${c.id}')" style="width:100%; background:#10b981; border:none; color:white; font-weight:bold; padding:8px; border-radius:6px; margin-top:14px; font-size:0.75rem; cursor:pointer;">Book Fight</button>`;
            grid.appendChild(card);
        });
    }
    document.getElementById('suggestionModal').style.display = 'flex';
};

window.bookSuggested = function(fId) {
    if (!activeMatchId) return;
    const slot2 = document.getElementById(`${activeMatchId}-slot2`);
    const input2 = slot2.querySelector('.fighter-search-input');
    const f2 = fighters.find(f => f.id === fId);
    if (input2 && f2) {
        input2.value = f2.name;
        input2.setAttribute('data-fighter-id', f2.id);
        const av = slot2.querySelector('.avatar-box');
        let avatarContent = '';
        if (f2.photo) {
            avatarContent = `<img src="${f2.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatarContent = f2.name.charAt(0);
        }
        av.innerHTML = avatarContent;
        av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
        av.onclick = function(e) { 
            e.stopPropagation(); 
            uploadFighterPhotoFromCard(f2.id); 
        };
        updateFighterRecordDisplay(activeMatchId, 'slot2', f2);
        updateWinnerDropdown(activeMatchId);
        if (!checkExistingFightRematch(activeMatchId, 'slot2')) {
            window.closeSuggestionModal();
            return;
        }
        saveCurrentCardDraft();
    }
    window.closeSuggestionModal();
};
window.logMatchResult = function(id) {
    const row = document.getElementById(id); 
    const slot1 = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
    const winSelect = document.getElementById(`${id}-winner-select`); 
    const methodSelect = document.getElementById(`${id}-method-select`);
    
    if (!slot1 || !slot2 || !slot1.value || !slot2.value) return customAlert('Select both fighters before logging finishes!', 'Log Match Result');
    if (!winSelect || !winSelect.value) return customAlert('Please choose who won the fight!', 'Log Match Result');
    if (!methodSelect || !methodSelect.value) return customAlert('Please choose the method of victory!', 'Log Match Result');
    
    let f1 = fighters.find(f => f.id === slot1.getAttribute('data-fighter-id')); 
    let f2 = fighters.find(f => f.id === slot2.getAttribute('data-fighter-id'));
    let w = (winSelect.value === '1') ? f1 : f2; 
    let l = (winSelect.value === '1') ? f2 : f1;
    
    w.wins++; 
    w[methodSelect.value]++; 
    l.losses++;

    const methodName = methodSelect.options[methodSelect.selectedIndex].text;
    const currentShow = futureShows.find(s => s.id === activeShowId);
    const showName = currentShow?.name || document.getElementById('eventNameInput')?.value.trim() || 'Show';

    if (!w.compiled_history_deck) w.compiled_history_deck = [];
    if (!l.compiled_history_deck) l.compiled_history_deck = [];
    const priorHeadToHead = getFightHistoryBetween(w, l).length;
    const rematchNumber = priorHeadToHead;

    const winnerHistoryEntry = {
        outcome: 'win',
        opponent: l.name,
        method: methodName,
        showName,
        rematchNumber: rematchNumber
    };
    const loserHistoryEntry = {
        outcome: 'loss',
        opponent: w.name,
        method: methodName,
        showName,
        rematchNumber: rematchNumber
    };

    const winnerAlreadyLogged = w.compiled_history_deck.some(entry => entry.outcome === 'win' && entry.opponent === l.name && entry.showName === showName && entry.method === methodName && entry.rematchNumber === rematchNumber);
    const loserAlreadyLogged = l.compiled_history_deck.some(entry => entry.outcome === 'loss' && entry.opponent === w.name && entry.showName === showName && entry.method === methodName && entry.rematchNumber === rematchNumber);

    if (!winnerAlreadyLogged) w.compiled_history_deck.push(winnerHistoryEntry);
    if (!loserAlreadyLogged) l.compiled_history_deck.push(loserHistoryEntry);

    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
    updateFighterRecordDisplay(id, 'slot1', f1);
    updateFighterRecordDisplay(id, 'slot2', f2);
    
    const titleCheck = document.getElementById(`${id}-title-check`);
    const titleInput = document.getElementById(`${id}-title-name-input`);
    const rowGender = document.getElementById(`${id}-slot1`)?.getAttribute('data-gender') || document.getElementById(`${id}-slot2`)?.getAttribute('data-gender') || 'male';
    let matchSaveState = {
        winnerName: w.name,
        loserName: l.name,
        winnerGender: w.gender,
        slot1Name: slot1.value,
        slot2Name: slot2.value,
        slot1Id: slot1.getAttribute('data-fighter-id'),
        slot2Id: slot2.getAttribute('data-fighter-id'),
        gender: rowGender,
        methodId: methodSelect.value,
        methodName: methodSelect.options[methodSelect.selectedIndex].text,
        showName: showName,
        isTitle: titleCheck ? titleCheck.checked : false,
        titleId: '',
        titleName: '',
        rematchNumber: rematchNumber
    };
    // If this was a title match and a title was selected, store title id/name and immediately apply transfer
    if (titleCheck && titleCheck.checked && titleInput && titleInput.value) {
        const selectedId = titleInput.value;
        const selectedOpt = titleInput.options[titleInput.selectedIndex];
        const selName = selectedOpt ? (selectedOpt.getAttribute('data-name') || selectedOpt.text) : '';
        matchSaveState.titleId = selectedId;
        matchSaveState.titleName = selName;

        // Apply title transfer immediately
        try {
            let championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];
            let targetBelt = championshipsRegistry.find(b => b.id === selectedId);
            if (!targetBelt) {
                targetBelt = {
                    id: selectedId,
                    name: selName || 'Championship',
                    gender: w.gender || 'male',
                    championId: '',
                    history: [],
                    defenses: 0
                };
                championshipsRegistry.push(targetBelt);
            }

            const previousChampionId = targetBelt.championId;
            // Score title fight/defense stats for this specific belt
            try {
                w.title_fights = (w.title_fights || 0) + 1;
                l.title_fights = (l.title_fights || 0) + 1;
                if (previousChampionId && previousChampionId === w.id) {
                    // winner was already champion -> increment defenses for this belt
                    targetBelt.defenses = (targetBelt.defenses || 0) + 1;
                } else {
                    // new champion or contested match -> reset defenses for this belt
                    targetBelt.defenses = 0;
                }
            } catch (err) {
                console.error('Error updating roster title stats', err);
            }
            const winMethodText = methodSelect.value.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');
            if (previousChampionId !== w.id) {
                // push new reign
                targetBelt.history = targetBelt.history || [];
                targetBelt.history.push({ wrestlerName: w.name, showTitle: showName, winMethod: winMethodText });
            }
            targetBelt.championId = w.id;
            localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
            // Update fighters storage with any modified defense counts
            localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
        } catch (e) {
            console.error('Error applying title transfer', e);
        }
    }
    completedMatches[id] = matchSaveState; 
    localStorage.setItem("wwe_matches_" + activeShowId, JSON.stringify(completedMatches));
    
    clearMatchWinnerBadges(id);
    const winningSlot = winSelect.value === '1' ? 'slot1' : 'slot2';
    showMatchWinnerBadge(id, winningSlot, methodName);
    disableMatchRowControls(id);
    
    // RESOLVE BET IF ONE WAS PLACED
    if (window.placedBets && window.placedBets[id]) {
        const bet = window.placedBets[id];
        const betWon = bet.betOnFighterName === w.name;
        
        if (betWon) {
            // Double the money (original bet + winnings)
            const winnings = bet.betAmount * 2;
            updateBettingMoney(winnings);
            customAlert(`🎉 BET WON! You won $${winnings.toLocaleString()}!`, 'Bet Result');
        } else {
            // Bet lost (money already deducted when bet was placed)
            customAlert(`😞 Bet lost. You had $${bet.betAmount.toLocaleString()} on ${bet.betOnFighterName}.`, 'Bet Result');
        }
        
        // Clear the bet
        delete window.placedBets[id];
    }
    
    restoreLoggedResult(id, matchSaveState);
    refreshFighterRecordDisplaysForId(w.id);
    refreshFighterRecordDisplaysForId(l.id);

    const unlogBtn = document.getElementById(`${id}-unlog-btn`);
    if (unlogBtn) unlogBtn.style.display = 'inline-flex';
    updateFinalizeButtonState();
    updateRandomizerState();
};

window.unlogMatchResult = function(id) {
    const savedMatch = completedMatches[id];
    if (!savedMatch) return;

    const f1 = fighters.find(f => f.id === savedMatch.slot1Id || f.name === savedMatch.slot1Name);
    const f2 = fighters.find(f => f.id === savedMatch.slot2Id || f.name === savedMatch.slot2Name);
    const winner = savedMatch.winnerName === (f1?.name || '') ? f1 : f2;
    const loser = savedMatch.loserName === (f1?.name || '') ? f1 : f2;

    if (winner) {
        winner.wins = Math.max(0, Number(winner.wins || 0) - 1);
        if (savedMatch.methodId && typeof winner[savedMatch.methodId] !== 'undefined') {
            winner[savedMatch.methodId] = Math.max(0, Number(winner[savedMatch.methodId] || 0) - 1);
        }
        if (winner.compiled_history_deck) {
            winner.compiled_history_deck = winner.compiled_history_deck.filter(entry => {
                return !(entry.outcome === 'win' && entry.opponent === savedMatch.loserName && entry.showName === savedMatch.showName && entry.method === savedMatch.methodName && entry.rematchNumber === savedMatch.rematchNumber);
            });
        }
    }
    if (loser) {
        loser.losses = Math.max(0, Number(loser.losses || 0) - 1);
        if (loser.compiled_history_deck) {
            loser.compiled_history_deck = loser.compiled_history_deck.filter(entry => {
                return !(entry.outcome === 'loss' && entry.opponent === savedMatch.winnerName && entry.showName === savedMatch.showName && entry.method === savedMatch.methodName && entry.rematchNumber === savedMatch.rematchNumber);
            });
        }
    }

    if (winner) refreshFighterRecordDisplaysForId(winner.id);
    if (loser) refreshFighterRecordDisplaysForId(loser.id);

    if (savedMatch.isTitle && savedMatch.titleId) {
        try {
            const championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];
            const targetBelt = championshipsRegistry.find(b => b.id === savedMatch.titleId);
            if (targetBelt) {
                const wasChampion = targetBelt.championId === (winner?.id || '');
                if (wasChampion) {
                    targetBelt.defenses = Math.max(0, Number(targetBelt.defenses || 0) - 1);
                }
                if (targetBelt.history && targetBelt.history.length) {
                    targetBelt.history = targetBelt.history.filter(entry => !(entry.wrestlerName === (winner?.name || '') && entry.showTitle === (savedMatch.showName || '') && entry.winMethod === (savedMatch.methodName || '')));
                }
                if (wasChampion) {
                    targetBelt.championId = '';
                }
                localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
            }
        } catch (err) {
            console.error('Error undoing title result', err);
        }
    }

    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
    delete completedMatches[id];
    localStorage.setItem('wwe_matches_' + activeShowId, JSON.stringify(completedMatches));

    const row = document.getElementById(id);
    if (row) {
        const unlogBtn = document.getElementById(`${id}-unlog-btn`);
        if (unlogBtn) unlogBtn.style.display = 'none';
        const logBtn = document.getElementById(`${id}-log-btn`);
        const announceBtn = document.getElementById(`${id}-announce-btn`);
        const inputs = row.querySelectorAll('input, select, button');
        inputs.forEach(el => {
            el.disabled = false;
            el.style.opacity = '1';
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
            if (el.tagName === 'BUTTON' || el.tagName === 'SELECT' || el.tagName === 'INPUT') {
                el.title = '';
            }
        });
        if (row.querySelector('.search-results-floating-panel')) {
            row.querySelectorAll('.search-results-floating-panel').forEach(panel => panel.style.display = 'none');
        }
        clearMatchWinnerBadges(id);
        const resultPanel = document.getElementById(`${id}-result-panel`);
        if (resultPanel) resultPanel.style.display = 'none';
        const winSelect = document.getElementById(`${id}-winner-select`);
        const methodSelect = document.getElementById(`${id}-method-select`);
        if (winSelect) winSelect.value = '';
        if (methodSelect) methodSelect.value = '';
        updateWinnerDropdown(id);
    }

    updateFinalizeButtonState();
    updateRandomizerState();
};

function getFinalizeEventButton() {
    return document.getElementById('finalizeEventButton');
}

window.hasActiveShowResults = function() {
    if (!activeShowId) return false;
    const saved = JSON.parse(localStorage.getItem('wwe_matches_' + activeShowId)) || {};
    return Object.keys(saved).length > 0;
};

window.makeOpponentPairKey = function(idA, idB) {
    const a = idA || '';
    const b = idB || '';
    return a < b ? `${a}--${b}` : `${b}--${a}`;
};

window.getReservedOpponentPairsFromOtherShows = function() {
    const reservedPairs = new Set();
    futureShows.forEach(show => {
        if (!show.id || show.id === activeShowId || isShowCompleted(show.id)) return;
        const draftData = JSON.parse(localStorage.getItem('wwe_draft_' + show.id)) || {};
        Object.values(draftData).forEach(entry => {
            if (!entry || !entry.f1Name || !entry.f2Name) return;
            const fighter1 = entry.f1Id ? fighters.find(f => f.id === entry.f1Id) : getFighterByIdOrName(entry.f1Name);
            const fighter2 = entry.f2Id ? fighters.find(f => f.id === entry.f2Id) : getFighterByIdOrName(entry.f2Name);
            if (fighter1 && fighter2 && fighter1.id !== fighter2.id) {
                reservedPairs.add(window.makeOpponentPairKey(fighter1.id, fighter2.id));
            }
        });
    });
    return Array.from(reservedPairs).filter(Boolean);
};

window.updateRandomizerState = function() {
    const showButton = document.getElementById('randomizeShowButton');
    const rowButtons = Array.from(document.querySelectorAll('.randomizer-btn'));
    const activeShowCompleted = isShowCompleted(activeShowId);
    const showHasResults = window.hasActiveShowResults();
    const disable = activeShowCompleted || showHasResults;

    if (showButton) {
        showButton.disabled = disable;
        showButton.style.opacity = disable ? '0.45' : '1';
        showButton.style.cursor = disable ? 'not-allowed' : 'pointer';
        if (activeShowCompleted) {
            showButton.title = 'This show has been finalized and can no longer be randomized.';
        } else if (showHasResults) {
            showButton.title = 'Randomization disabled after match results have started. Reset or switch cards to randomize again.';
        } else {
            showButton.title = 'Randomize all matchups in the active show.';
        }
    }
    rowButtons.forEach(btn => {
        btn.disabled = disable;
        btn.style.opacity = disable ? '0.45' : '1';
        btn.style.cursor = disable ? 'not-allowed' : 'pointer';
        if (disable) {
            btn.title = activeShowCompleted ? 'This match can no longer be randomized after the show was archived.' : 'Randomization disabled after match results have started.';
        } else {
            btn.title = btn.title || 'Reroll this matchup.';
        }
    });
};

window.updateFinalizeButtonState = function() {
    const button = getFinalizeEventButton();
    if (!button) return;

    const eventNameValue = document.getElementById('eventNameInput')?.value.trim() || '';
    const activeShowCompleted = isShowCompleted(activeShowId);
    const allMatchRows = Array.from(document.querySelectorAll('.match-row'));
    const activeShowSavedData = JSON.parse(localStorage.getItem('wwe_matches_' + activeShowId)) || {};
    const incompleteRows = allMatchRows.filter(row => {
        const saved = activeShowSavedData[row.id];
        return !saved || !saved.winnerName || !saved.loserName || !saved.methodName;
    });

    const canEnable = !activeShowCompleted && eventNameValue.length > 0 && allMatchRows.length > 0 && incompleteRows.length === 0;
    button.disabled = !canEnable;
    button.style.opacity = canEnable ? '1' : '0.55';
    button.style.cursor = canEnable ? 'pointer' : 'not-allowed';
    if (activeShowCompleted) {
        button.title = 'This show has already been finalized and archived.';
    } else if (!eventNameValue) {
        button.title = 'Enter an Event/Show Title Name before finalizing.';
    } else if (incompleteRows.length > 0) {
        button.title = `Log all ${allMatchRows.length} matches first (${allMatchRows.length - incompleteRows.length}/${allMatchRows.length}).`;
    } else {
        button.title = 'Finalize and archive the event.';
    }
};

function restoreLoggedResult(id, state) {
    const row = document.getElementById(id);
    const slot1 = document.getElementById(`${id}-slot1`);
    const slot2 = document.getElementById(`${id}-slot2`);
    const slot1Input = slot1?.querySelector('.fighter-search-input');
    const slot2Input = slot2?.querySelector('.fighter-search-input');

    const restoreSlot = (slotEl, inputEl, fighterName, fighterId) => {
        if (!slotEl || !inputEl || !fighterName) return;
        inputEl.value = fighterName;
        if (fighterId) inputEl.setAttribute('data-fighter-id', fighterId);
        const f = fighters.find(fighter => fighter.id === fighterId);
        const avatar = slotEl.querySelector('.avatar-box');
        if (avatar) {
            let avatarContent = '';
            if (f && f.photo) {
                avatarContent = `<img src="${f.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarContent = fighterName.charAt(0);
            }
            avatar.innerHTML = avatarContent;
            avatar.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            avatar.onclick = function(e) { e.stopPropagation(); if (fighterId) uploadFighterPhotoFromCard(fighterId); };
        }
    };

    restoreSlot(slot1, slot1Input, state.slot1Name, state.slot1Id);
    restoreSlot(slot2, slot2Input, state.slot2Name, state.slot2Id);

    updateFighterRecordDisplay(id, 'slot1', fighters.find(f => f.id === state.slot1Id));
    updateFighterRecordDisplay(id, 'slot2', fighters.find(f => f.id === state.slot2Id));

    const rowGender = state.gender ||
        fighters.find(f => f.id === state.slot1Id || f.name === state.slot1Name)?.gender ||
        fighters.find(f => f.id === state.slot2Id || f.name === state.slot2Name)?.gender ||
        'male';
    setMatchRowSelectedGender(id, rowGender);

    const titleCheck = document.getElementById(`${id}-title-check`);
    const titleInput = document.getElementById(`${id}-title-name-input`);
    if (titleCheck) {
        titleCheck.checked = !!state.isTitle;
    }
    if (titleInput) {
        if (state.isTitle && state.titleId) {
            titleInput.style.display = 'inline-block';
            titleInput.value = state.titleId;
            const existingOption = titleInput.querySelector(`option[value="${state.titleId}"]`);
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = state.titleId;
                option.setAttribute('data-name', state.titleName || state.titleId);
                option.text = state.titleName || state.titleId;
                titleInput.appendChild(option);
            }
            if (titleInput.value !== state.titleId) titleInput.value = state.titleId;
        } else {
            titleInput.style.display = 'none';
            titleInput.value = '';
            titleInput.innerHTML = '';
        }
    }

    const hasSlot1Value = slot1Input?.value?.trim();
    const hasSlot2Value = slot2Input?.value?.trim();
    const resultPanel = document.getElementById(`${id}-result-panel`);
    const hasCompleteMatch = hasSlot1Value && hasSlot2Value && state.winnerName && state.loserName;

    if (!hasCompleteMatch) {
        clearMatchWinnerBadges(id);
        if (resultPanel) resultPanel.style.display = 'none';
        const winnerShowcase = document.getElementById(`${id}-showcase-winner`);
        const loserShowcase = document.getElementById(`${id}-showcase-loser`);
        const methodShowcase = document.getElementById(`${id}-showcase-method`);
        if (winnerShowcase) winnerShowcase.textContent = '';
        if (loserShowcase) loserShowcase.textContent = '';
        if (methodShowcase) methodShowcase.textContent = '';
        return;
    }

    if ((!state.slot1Name || !state.slot2Name) && slot1Input && slot2Input) {
        if (!slot1Input.value && !slot2Input.value) {
            slot1Input.value = state.winnerName || '';
            slot2Input.value = state.loserName || '';
        } else if (!slot1Input.value && slot2Input.value === state.loserName) {
            slot1Input.value = state.winnerName || '';
        } else if (!slot2Input.value && slot1Input.value === state.winnerName) {
            slot2Input.value = state.loserName || '';
        }
    }

    if (resultPanel) resultPanel.style.display = 'none';

    const winnerShowcase = document.getElementById(`${id}-showcase-winner`);
    const loserShowcase = document.getElementById(`${id}-showcase-loser`);
    const methodShowcase = document.getElementById(`${id}-showcase-method`);
    if (winnerShowcase && loserShowcase && methodShowcase) {
        winnerShowcase.textContent = state.winnerName;
        winnerShowcase.style.color = state.winnerGender === 'male' ? '#22c55e' : '#f472b6';
        loserShowcase.textContent = state.loserName;
        methodShowcase.textContent = state.methodName;

        let winnerSlot = null;
        if (state.slot1Name && state.slot1Name === state.winnerName) winnerSlot = 'slot1';
        else if (state.slot2Name && state.slot2Name === state.winnerName) winnerSlot = 'slot2';
        else if (state.slot1Name && state.slot1Name === state.loserName) winnerSlot = 'slot2';
        else if (state.slot2Name && state.slot2Name === state.loserName) winnerSlot = 'slot1';
        else if (slot1Input && slot1Input.value === state.winnerName) winnerSlot = 'slot1';
        else if (slot2Input && slot2Input.value === state.winnerName) winnerSlot = 'slot2';
        else if (slot1Input && slot1Input.value === state.loserName) winnerSlot = 'slot2';
        else if (slot2Input && slot2Input.value === state.loserName) winnerSlot = 'slot1';

        clearMatchWinnerBadges(id);
        if (winnerSlot) showMatchWinnerBadge(id, winnerSlot, state.methodName);
    }
}

function clearMatchWinnerBadges(matchId) {
    ['slot1','slot2'].forEach(slotType => {
        const slot = document.getElementById(`${matchId}-${slotType}`);
        if (!slot) return;
        const badge = slot.querySelector('.win-badge');
        const label = slot.querySelector('.win-method-label');
        const avatar = slot.querySelector('.avatar-box');
        if (badge) badge.style.display = 'none';
        if (label) label.style.display = 'none';
        if (avatar) {
            avatar.style.borderColor = '#cbd5e1';
            avatar.style.background = '#e2e8f0';
            avatar.style.boxShadow = 'none';
        }
    });
}

function disableMatchRowControls(matchId) {
    const row = document.getElementById(matchId);
    if (!row) return;

    row.querySelectorAll('button, input, select, textarea').forEach(el => {
        if (el.id === `${matchId}-unlog-btn`) {
            el.disabled = false;
            el.style.display = 'inline-flex';
            el.style.opacity = '1';
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
            el.title = 'Unlog this result and edit the match again.';
            return;
        }
        el.disabled = true;
        el.style.opacity = '0.45';
        el.style.cursor = 'not-allowed';
        el.style.pointerEvents = 'none';
        if (el.tagName === 'BUTTON' || el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.title = 'This match is finalized and can no longer be changed.';
        }
    });

    row.querySelectorAll('.search-results-floating-panel').forEach(panel => {
        panel.style.display = 'none';
    });
}

function disableMatchRandomizer(matchId) {
    disableMatchRowControls(matchId);
}

function disableMatchGenderControls(matchId) {
    disableMatchRowControls(matchId);
}

function showMatchWinnerBadge(matchId, slotType, methodText) {
    clearMatchWinnerBadges(matchId);
    const slot = document.getElementById(`${matchId}-${slotType}`);
    if (!slot) return;
    const slotInput = slot.querySelector('.fighter-search-input');
    const badge = slot.querySelector('.win-badge');
    const label = slot.querySelector('.win-method-label');
    const avatar = slot.querySelector('.avatar-box');
    if (!slotInput || !slotInput.value?.trim()) return;
    if (badge) {
        badge.style.display = 'flex';
        badge.style.opacity = '1';
    }
    if (label) {
        label.textContent = methodText || '';
        label.style.display = methodText ? 'block' : 'none';
    }
    if (avatar) {
        avatar.style.background = '#dcfce7';
        avatar.style.borderColor = '#16a34a';
        avatar.style.boxShadow = '0 0 0 4px rgba(22, 163, 74, 0.24), inset 0 0 0 1px rgba(22, 163, 74, 0.55)';
        avatar.style.position = 'relative';
    }
}

window.finalizeFullEventCard = function() {
    const topInput = document.getElementById('eventNameInput');
    const shownShowName = topInput ? topInput.value.trim() : "";
    if (!shownShowName) {
        customAlert("Archive Blocked!\nYou must enter an Event/Show Title Name before finalizing.", 'Finalize Event');
        return;
    }

    const currentShow = futureShows.find(s => s.id === activeShowId);
    if (currentShow && currentShow.name !== shownShowName) {
        currentShow.name = shownShowName;
        localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    }

    const activeShowSavedData = JSON.parse(localStorage.getItem("wwe_matches_" + activeShowId)) || {};
    const allMatchRows = Array.from(document.querySelectorAll('.match-row'));
    const incompleteRows = allMatchRows.filter(row => {
        const saved = activeShowSavedData[row.id];
        return !saved || !saved.winnerName || !saved.loserName || !saved.methodName;
    });

    if (incompleteRows.length > 0) {
        customAlert(`Archive Blocked!\nYou must log all ${allMatchRows.length} matches before completing the event.\n\nCurrent Progress: ${allMatchRows.length - incompleteRows.length}/${allMatchRows.length}`, 'Finalize Event');
        return;
    }

    // Award event archive bonus once per completed show
    updateBettingMoney(1000);
    customAlert('🏆 Live show finalized! You earned a $1,000 bonus for archiving the event.', 'Event Archived');

    let eventMatchesCompiled = allMatchRows.map(row => {
        const savedState = activeShowSavedData[row.id];
        const titleCheck = document.getElementById(`${row.id}-title-check`);
        const titleNameInp = document.getElementById(`${row.id}-title-name-input`);
        const savedIsTitle = typeof savedState.isTitle !== 'undefined' ? savedState.isTitle : (titleCheck ? titleCheck.checked : false);
        const savedTitleId = savedState?.titleId || '';
        const savedTitleName = savedState?.titleName || (titleNameInp ? (titleNameInp.options[titleNameInp.selectedIndex]?.getAttribute('data-name') || titleNameInp.value.trim()) : '');

        return {
            matchId: row.id,
            tierName: row.parentNode.querySelector('.tier-title') ? row.parentNode.querySelector('.tier-title').textContent : "Match",
            winner: savedState.winnerName,
            loser: savedState.loserName,
            method: savedState.methodName,
            methodId: savedState.methodId || '',
            isTitle: savedIsTitle,
            titleId: savedTitleId,
            customTitleName: savedTitleName
        };
    });

    let championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    eventMatchesCompiled.forEach(m => {
        if (!m.isTitle) return;
        // If this match already applied a title at log time (stored by match state), skip re-applying here
        const savedState = activeShowSavedData[m.matchId] || {};
        if (savedState && savedState.titleId) return;

        const champWinnerObj = fighters.find(f => f.name === m.winner);
        const loserObj = fighters.find(f => f.name === m.loser);
        const beltName = m.customTitleName;

        if (champWinnerObj) {
            champWinnerObj.title_fights = (champWinnerObj.title_fights || 0) + 1;
        }
        if (loserObj) {
            loserObj.title_fights = (loserObj.title_fights || 0) + 1;
        }

        let targetBelt = championshipsRegistry.find(b => b.name.toLowerCase() === beltName.toLowerCase());
        if (!targetBelt) {
            targetBelt = {
                id: 'title-' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: beltName,
                gender: champWinnerObj ? champWinnerObj.gender : 'male',
                championId: '',
                history: [],
                defenses: 0
            };
            championshipsRegistry.push(targetBelt);
        }

        if (champWinnerObj) {
            const previousChampionId = targetBelt.championId;
            const winMethodText = m.method.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');
            if (previousChampionId !== champWinnerObj.id) {
                targetBelt.history.push({
                    wrestlerName: champWinnerObj.name,
                    showTitle: shownShowName,
                    winMethod: winMethodText
                });
                targetBelt.defenses = 0;
            } else {
                targetBelt.defenses = (targetBelt.defenses || 0) + 1;
            }
            targetBelt.championId = champWinnerObj.id;
        }
    });

    localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));

    let eventHistoryCalendar = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    const eventDate = new Date();
    eventHistoryCalendar.push({
        id: "event-" + Date.now(),
        name: shownShowName,
        showTitle: shownShowName,
        showId: activeShowId,
        date: eventDate.toLocaleString(),
        completedAt: eventDate.toISOString(),
        matches: eventMatchesCompiled
    });
    localStorage.setItem("wwe_event_history", JSON.stringify(eventHistoryCalendar));
    setShowCompleted(activeShowId, true);
    updateFinalizeButtonState();

    eventMatchesCompiled.forEach(m => {
        const winnerFighter = fighters.find(f => f.name === m.winner);
        const loserFighter = fighters.find(f => f.name === m.loser);
        if (!winnerFighter || !loserFighter) return;

        if (!winnerFighter.compiled_history_deck) winnerFighter.compiled_history_deck = [];
        if (!loserFighter.compiled_history_deck) loserFighter.compiled_history_deck = [];

        const methodSource = m.methodId || m.method || '';
        const cleanMethodName = methodSource.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');

        const winnerAlreadyLogged = winnerFighter.compiled_history_deck.some(entry => entry.outcome === 'win' && entry.opponent === loserFighter.name && entry.showName === shownShowName && entry.method === cleanMethodName);
        const loserAlreadyLogged = loserFighter.compiled_history_deck.some(entry => entry.outcome === 'loss' && entry.opponent === winnerFighter.name && entry.showName === shownShowName && entry.method === cleanMethodName);

        if (!winnerAlreadyLogged) {
            winnerFighter.compiled_history_deck.push({
                outcome: 'win',
                opponent: loserFighter.name,
                method: cleanMethodName,
                showName: shownShowName
            });
        }
        if (!loserAlreadyLogged) {
            loserFighter.compiled_history_deck.push({
                outcome: 'loss',
                opponent: winnerFighter.name,
                method: cleanMethodName,
                showName: shownShowName
            });
        }
    });
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));

    // Preserve the completed match data so the finalized fight card remains visible with winners saved.
    customAlert(`Show Card Successfully Archived!\n\n"${shownShowName}" data loops synchronized, belts pushed, and rivalries logged seamlessly across all systems!`, 'Show Archived', function() {
        location.reload();
    });
};



window.updateWinnerDropdown = function(matchRowId) {
    const slot1 = document.getElementById(`${matchRowId}-slot1`).querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${matchRowId}-slot2`).querySelector('.fighter-search-input');
    const winSelect = document.getElementById(`${matchRowId}-winner-select`);
    if (!winSelect) return;
    
    let winOpts = '<option value="">Winner...</option>';
    if (slot1 && slot1.value) winOpts += `<option value="1">${slot1.value}</option>`;
    if (slot2 && slot2.value) winOpts += `<option value="2">${slot2.value}</option>`;
    winSelect.innerHTML = winOpts;
    
    saveCurrentCardDraft();
};

function getCurrentDraftStorageKey() {
    return activeShowId ? `wwe_draft_${activeShowId}` : 'wwe_draft_default';
}

function saveCurrentCardDraft() {
    let draftData = {};
    document.querySelectorAll('.match-row').forEach(row => {
        const id = row.id;
        const s1 = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
        const s2 = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
        const gender = document.getElementById(`${id}-slot1`)?.getAttribute('data-gender') || 'male';
        const acceptedRematch = getMatchRowAcceptedRematch(id);
        
        draftData[id] = {
            f1Name: s1 ? s1.value : '',
            f1Id: s1 ? s1.getAttribute('data-fighter-id') : '',
            f2Name: s2 ? s2.value : '',
            f2Id: s2 ? s2.getAttribute('data-fighter-id') : '',
            gender: gender,
            rematchAccepted: acceptedRematch ? true : false,
            rematchF1Id: acceptedRematch ? acceptedRematch.fighter1Id : '',
            rematchF2Id: acceptedRematch ? acceptedRematch.fighter2Id : '',
            rematchCount: acceptedRematch ? acceptedRematch.count : 1
        };
    });
    localStorage.setItem(getCurrentDraftStorageKey(), JSON.stringify(draftData));
}

function restoreCurrentCardDraft() {
    let draftData = JSON.parse(localStorage.getItem(getCurrentDraftStorageKey())) || {};
    if (!activeShowId && Object.keys(draftData).length === 0) {
        draftData = JSON.parse(localStorage.getItem('wwe_draft_default')) || {};
    }
    Object.keys(draftData).forEach(id => {
        const row = document.getElementById(id);
        if (!row || completedMatches[id]) return;
        
        const d = draftData[id];
        const s1 = document.getElementById(`${id}-slot1`);
        const s2 = document.getElementById(`${id}-slot2`);
        
        if (s1 && d.f1Name) {
            const inp1 = s1.querySelector('.fighter-search-input');
            inp1.value = d.f1Name;
            inp1.setAttribute('data-fighter-id', d.f1Id);
            const f1 = fighters.find(f => f.id === d.f1Id) || getFighterByIdOrName(d.f1Name);
            if (f1 && !d.f1Id) {
                inp1.setAttribute('data-fighter-id', f1.id);
            }
            const av1 = s1.querySelector('.avatar-box');
            let avatarContent1 = '';
            if (f1 && f1.photo) {
                avatarContent1 = `<img src="${f1.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarContent1 = d.f1Name.charAt(0);
            }
            av1.innerHTML = avatarContent1;
            av1.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            av1.onclick = function(e) { 
                e.stopPropagation(); 
                if (f1) uploadFighterPhotoFromCard(f1.id); 
            };
            updateFighterRecordDisplay(id, 'slot1', f1);
        }
        if (s2 && d.f2Name) {
            const inp2 = s2.querySelector('.fighter-search-input');
            inp2.value = d.f2Name;
            inp2.setAttribute('data-fighter-id', d.f2Id);
            const f2 = fighters.find(f => f.id === d.f2Id) || getFighterByIdOrName(d.f2Name);
            if (f2 && !d.f2Id) {
                inp2.setAttribute('data-fighter-id', f2.id);
            }
            const av2 = s2.querySelector('.avatar-box');
            let avatarContent2 = '';
            if (f2 && f2.photo) {
                avatarContent2 = `<img src="${f2.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarContent2 = d.f2Name.charAt(0);
            }
            av2.innerHTML = avatarContent2;
            av2.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            av2.onclick = function(e) { 
                e.stopPropagation(); 
                if (f2) uploadFighterPhotoFromCard(f2.id); 
            };
            updateFighterRecordDisplay(id, 'slot2', f2);
        }
        
        const hasRematchAccepted = d.rematchAccepted && d.rematchF1Id && d.rematchF2Id;
        if (hasRematchAccepted) {
            const currentF1Id = document.getElementById(`${id}-slot1`)?.querySelector('.fighter-search-input')?.getAttribute('data-fighter-id') || '';
            const currentF2Id = document.getElementById(`${id}-slot2`)?.querySelector('.fighter-search-input')?.getAttribute('data-fighter-id') || '';
            if (areMatchRowRematchPairsEqual(currentF1Id, currentF2Id, d.rematchF1Id, d.rematchF2Id)) {
                const rematchCheckbox = document.querySelector(`#${id} input[type="checkbox"][onchange*="toggleRematchCounter"]`);
                const rematchCount = document.getElementById(`${id}-rematch-count`);
                if (rematchCheckbox) rematchCheckbox.checked = true;
                if (rematchCount) {
                    rematchCount.value = d.rematchCount || 1;
                    rematchCount.style.display = 'inline-block';
                }
                setMatchRowRematchAccepted(id, d.rematchF1Id, d.rematchF2Id, d.rematchCount || 1);
            }
        }
        if (d.gender) {
            setMatchRowSelectedGender(id, d.gender);
        } else {
            const maybeF1 = fighters.find(f => f.id === d.f1Id || f.name === d.f1Name);
            const maybeF2 = fighters.find(f => f.id === d.f2Id || f.name === d.f2Name);
            const inferred = maybeF1?.gender || maybeF2?.gender;
            if (inferred) setMatchRowSelectedGender(id, inferred);
        }
        if (d.f1Name || d.f2Name) {
            const winSelect = document.getElementById(`${id}-winner-select`);
            if (winSelect) {
                let winOpts = '<option value="">Winner...</option>';
                if (d.f1Name) winOpts += `<option value="1">${d.f1Name}</option>`;
                if (d.f2Name) winOpts += `<option value="2">${d.f2Name}</option>`;
                winSelect.innerHTML = winOpts;
            }
        }
        if (d.f1Name && d.f2Name) {
            checkExistingFightRematch(id, 'both');
        }
        refreshTitleFightState(id);
    });
}

window.changeMatchGender = function(matchRowId, gender) {
    setMatchRowSelectedGender(matchRowId, gender);
    populateDropdownGenders(matchRowId, gender);
    saveCurrentCardDraft();
};
window.resetActiveShowDraft = function() {
    customConfirm("Are you sure you want to clear this entire card layout?\n\nThis will empty out all selected fighters and wipe logged match results for this specific show, but your Master Roster stats and Championship Lineage will stay completely safe!", function(result) {
        if (!result) return;
        const selector = document.getElementById('activeShowSelector');
        const targetShowId = selector && selector.value ? selector.value : activeShowId;
        if (targetShowId) {
            setShowCompleted(targetShowId, false);
            localStorage.removeItem("wwe_matches_" + targetShowId);
            localStorage.removeItem("wwe_draft_" + targetShowId);
        }
        localStorage.removeItem('wwe_draft_default');

        document.querySelectorAll('.fighter-search-input').forEach(input => {
            input.value = '';
            input.setAttribute('data-fighter-id', '');
        });
        document.querySelectorAll('.avatar-box').forEach(av => {
            av.innerHTML = '👤';
            av.style.cssText = "width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; cursor:pointer; overflow:hidden;";
        });
        document.querySelectorAll('.match-row').forEach(row => {
            const id = row.id;
            clearMatchWinnerBadges(id);
            updateWinnerDropdown(id);
            setMatchRowSelectedGender(id, 'male');

            const titleCheck = document.getElementById(`${id}-title-check`);
            if (titleCheck) {
                titleCheck.checked = false;
                titleCheck.disabled = true;
            }
            const titleInput = document.getElementById(`${id}-title-name-input`);
            if (titleInput) {
                titleInput.style.display = 'none';
                titleInput.value = '';
            }
        });
        document.querySelectorAll('.search-results-floating-panel').forEach(panel => panel.style.display = 'none');

        window.skipDraftSaveOnUnload = true;
        customAlert("Active card layout has been completely reset back to its clean draft state!", 'Draft Reset', function() {
            location.reload();
        });
    }, 'Reset Draft');
};

window.downloadAppBackup = function() {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wwe_')) {
            backup[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wwe-universe-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

window.importAppBackup = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            try {
                const imported = JSON.parse(loadEvent.target.result);
                if (!imported || typeof imported !== 'object') throw new Error('Invalid backup format');
                let importedCount = 0;
                Object.keys(imported).forEach(key => {
                    if (key && key.startsWith('wwe_')) {
                        localStorage.setItem(key, imported[key]);
                        importedCount++;
                    }
                });
                if (importedCount === 0) {
                    return customAlert('No valid WWE backup data found in that file.', 'Backup Import');
                }
                customAlert(`Imported ${importedCount} WWE storage item${importedCount !== 1 ? 's' : ''}. Refreshing page now.`, 'Backup Imported', function() {
                    location.reload();
                });
            } catch (err) {
                console.error(err);
                customAlert('Backup import failed. Please select a valid JSON backup file.', 'Backup Import');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};


