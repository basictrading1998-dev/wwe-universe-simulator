const activeRematchWarnings = {};

function formatEventTimestamp(isoString) {
    if (typeof isoString !== 'string' || !isoString.trim()) return '';
    const date = new Date(isoString);
    if (!Number.isFinite(date.getTime())) return '';

    const now = new Date();
    const dayDifference = (
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    ) / 86400000;
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (dayDifference === 0) return `Today • ${time}`;
    if (dayDifference === 1) return `Yesterday • ${time}`;

    const dateLabel = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    return `${dateLabel} • ${time}`;
}

function getCardsTitleRules() {
    const legacyMinimum = localStorage.getItem('titleWinMinimum') === '10' ? 10 : 5;
    let storedRules = {};
    const raw = localStorage.getItem('universeTitleRules');
    if (raw) {
        try {
            storedRules = JSON.parse(raw) || {};
        } catch (error) {
            console.error('Unable to read title eligibility rules in fight cards.', error);
        }
    }
    return {
        initialTitleWins: Number(storedRules.initialTitleWins) === 10 ? 10
            : Number(storedRules.initialTitleWins) === 5 ? 5 : legacyMinimum,
        baseRebuildWins: [3, 4, 5].includes(Number(storedRules.baseRebuildWins))
            ? Number(storedRules.baseRebuildWins) : 3,
        extraLossPenalty: [1, 2, 3].includes(Number(storedRules.extraLossPenalty))
            ? Number(storedRules.extraLossPenalty) : 2
    };
}

function getCardsTitleWinMinimum() {
    return getCardsTitleRules().initialTitleWins;
}

function getCardsRebuildLossCount(fighter, required = fighter?.rebuild_wins_required) {
    if (!(Number(required) > 0)) return 0;
    const savedCount = Math.max(0, Math.floor(Number(fighter?.rebuild_loss_count) || 0));
    if (savedCount > 0) return savedCount;
    return Math.max(1, Math.ceil((Number(required) - 3) / 2) + 1);
}

function getCardsRebuildWinsRequired(lossCount, rules = getCardsTitleRules()) {
    if (!(Number(lossCount) > 0)) return 0;
    const cap = Math.min(15, Math.max(1, Number(rules.initialTitleWins) || 15));
    return Math.min(
        cap,
        Math.max(1, Number(rules.baseRebuildWins) || 3) +
            (Math.max(1, Math.floor(Number(lossCount) || 1)) - 1) * Math.max(1, Number(rules.extraLossPenalty) || 2)
    );
}

function normalizeCardsTitleGate(fighter, rules = getCardsTitleRules()) {
    let required = Math.max(0, Math.floor(Number(fighter?.rebuild_wins_required) || 0));
    let lossCount = getCardsRebuildLossCount(fighter, required);
    let comebackCompleted = fighter?.title_comeback_completed === true;
    let dominantExChampionRebuild = fighter?.dominant_ex_champ_rebuild === true;
    if (required > 0) {
        required = dominantExChampionRebuild ? 1 : getCardsRebuildWinsRequired(lossCount, rules);
        if (Math.max(0, Math.floor(Number(fighter?.win_streak) || 0)) >= required) {
            required = 0;
            lossCount = 0;
            comebackCompleted = true;
            dominantExChampionRebuild = false;
        } else {
            comebackCompleted = false;
        }
    } else {
        lossCount = 0;
        dominantExChampionRebuild = false;
    }
    return {
        rebuildWinsRequired: required,
        rebuildLossCount: lossCount,
        comebackCompleted,
        dominantExChampionRebuild
    };
}

function getTitleEligibilityStatus(fighter) {
    const minimum = getCardsTitleWinMinimum();
    const winStreak = Math.max(0, Math.floor(Number(fighter?.win_streak) || 0));
    const rebuildWinsRequired = Math.max(0, Math.floor(Number(fighter?.rebuild_wins_required) || 0));
    if (rebuildWinsRequired > 0) {
        const remaining = Math.max(0, rebuildWinsRequired - winStreak);
        return {
            eligible: false,
            status: winStreak > 0 ? 'rebuilding' : 'locked',
            label: fighter?.dominant_ex_champ_rebuild === true && rebuildWinsRequired === 1
                ? `🟡 EX-CHAMP REBUILD (${winStreak}/1 WIN)`
                : winStreak > 0
                ? `🟡 REBUILDING (${winStreak}/${rebuildWinsRequired} WINS)`
                : `🔴 LOCKED (NEEDS ${rebuildWinsRequired}W)`,
            remaining,
            winStreak,
            required: rebuildWinsRequired
        };
    }
    if (fighter?.title_comeback_completed === true || winStreak >= minimum) {
        return { eligible: true, status: 'eligible', label: '🟢 TITLE ELIGIBLE', remaining: 0, winStreak, required: minimum };
    }
    return {
        eligible: false,
        status: 'contender',
        label: `⚪ CONTENDER (${winStreak}/${minimum}W)`,
        remaining: Math.max(0, minimum - winStreak),
        winStreak,
        required: minimum
    };
}

function applyTitleGateWin(fighter, rules) {
    const required = Math.max(0, Math.floor(Number(fighter.rebuild_wins_required) || 0));
    if (required > 0 && Number(fighter.win_streak) >= required) {
        fighter.rebuild_wins_required = 0;
        fighter.rebuild_loss_count = 0;
        fighter.title_comeback_completed = true;
        fighter.dominant_ex_champ_rebuild = false;
    } else if (required === 0 && Number(fighter.win_streak) >= rules.initialTitleWins) {
        fighter.title_comeback_completed = false;
    }
}

function applyTitleGateLoss(fighter, rules, dominantExChampionException = false) {
    const required = Math.max(0, Math.floor(Number(fighter.rebuild_wins_required) || 0));
    fighter.rebuild_loss_count = required > 0
        ? getCardsRebuildLossCount(fighter, required) + 1
        : 1;
    fighter.dominant_ex_champ_rebuild = dominantExChampionException;
    fighter.rebuild_wins_required = dominantExChampionException
        ? 1
        : getCardsRebuildWinsRequired(fighter.rebuild_loss_count, rules);
    fighter.title_comeback_completed = false;
}

function getDominantTitleLossDefenseCount(fighter, titleId) {
    if (!fighter || !titleId) return 0;

    let titles;
    try {
        titles = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
    } catch (error) {
        throw new Error(`Unable to verify title reign defenses: ${error.message}`);
    }
    if (!Array.isArray(titles)) throw new Error('The saved championship list is not valid.');

    const title = titles.find(item => item && String(item.id) === String(titleId));
    if (!title) return 0;
    const championIdentity = title.championId ||
        (title.champion && typeof title.champion === 'object'
            ? title.champion.id || title.champion.name
            : title.champion) || '';
    const normalizedIdentity = String(championIdentity).trim().toLowerCase();
    const isCurrentChampion = String(championIdentity) === String(fighter.id) ||
        normalizedIdentity === String(fighter.name || '').trim().toLowerCase();
    if (!isCurrentChampion) return 0;

    const defenseCounts = [title.currentReignDefenses, title.defenses, fighter.current_reign_defenses]
        .map(value => Number(value))
        .filter(Number.isFinite);
    return defenseCounts.length
        ? Math.max(0, Math.floor(Math.max(...defenseCounts)))
        : 0;
}

window.getTitleEligibilityStatus = getTitleEligibilityStatus;

function getCardsCareerPeakWinStreak(fighter) {
    let historyPeak = 0;
    [fighter?.compiled_history_deck, fighter?.history_deck, fighter?.history].forEach(history => {
        if (!Array.isArray(history)) return;
        history.forEach(entry => {
            historyPeak = Math.max(
                historyPeak,
                Math.floor(Number(entry?.winStreak) || 0),
                Math.floor(Number(entry?.win_streak) || 0)
            );
        });
    });
    return Math.max(
        0,
        Math.floor(Number(fighter?.peak_win_streak) || 0),
        Math.floor(Number(fighter?.win_streak) || 0),
        historyPeak
    );
}

function loadFightersFromStorage() {
    const raw = localStorage.getItem('wwe_fighters') || localStorage.getItem('fighters');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const titleRules = getCardsTitleRules();
        const normalizedFighters = parsed.map(f => {
            const titleGate = normalizeCardsTitleGate(f, titleRules);
            return ({
            id: f.id || `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
            name: f.name || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'Unknown Fighter',
            gender: (f.gender || 'male').toString().toLowerCase(),
            division: f.division || f.weightClass || 'Heavyweight',
            wins: Number(f.wins || 0),
            losses: Number(f.losses || 0),
            defenses: Number(f.defenses || 0),
            lifetime_defenses: Number(f.lifetime_defenses || 0),
            title_fights: Number(f.title_fights || 0),
            total_title_fights: Number(f.total_title_fights ?? f.title_fights ?? 0),
            win_pinfall: Number(f.win_pinfall ?? f.pin_wins ?? 0),
            win_ko: Number(f.win_ko ?? f.ko_wins ?? 0),
            win_submission: Number(f.win_submission ?? f.sub_wins ?? 0),
            pin_wins: Number(f.pin_wins ?? f.win_pinfall ?? 0),
            ko_wins: Number(f.ko_wins ?? f.win_ko ?? 0),
            sub_wins: Number(f.sub_wins ?? f.win_submission ?? 0),
            fotn_bonuses: Math.max(0, Math.floor(Number(f.fotn_bonuses) || 0)),
            potn_bonuses: Math.max(0, Math.floor(Number(f.potn_bonuses) || 0)),
            career_bonuses: Math.max(0, Math.floor(Number(f.fotn_bonuses) || 0)) +
                Math.max(0, Math.floor(Number(f.potn_bonuses) || 0)),
            is_boss: f.is_boss === true,
            boss_slays: Math.max(0, Math.floor(Number(f.boss_slays) || 0)),
            countout_wins: Number(f.countout_wins || 0),
            dq_wins: Number(f.dq_wins || 0),
            win_streak: Number(f.win_streak || 0),
            rebuild_wins_required: titleGate.rebuildWinsRequired,
            rebuild_loss_count: titleGate.rebuildLossCount,
            title_comeback_completed: titleGate.comebackCompleted,
            dominant_ex_champ_rebuild: titleGate.dominantExChampionRebuild,
            peak_win_streak: getCardsCareerPeakWinStreak(f),
            lose_streak: typeof window.getCurrentLoseStreak === 'function'
                ? window.getCurrentLoseStreak(f)
                : Math.max(0, Math.floor(Number(f.lose_streak) || 0)),
            manual_stats_override: f.manual_stats_override === true,
            manual_win_streak_override: f.manual_win_streak_override === true,
            retired: f.retired === true,
            photo: f.photo || f.image || '',
            photo_key: f.photo_key || '',
            compiled_history_deck: Array.isArray(f.compiled_history_deck) ? f.compiled_history_deck : Array.isArray(f.history_deck) ? f.history_deck : Array.isArray(f.history) ? f.history : [],
            history_deck: Array.isArray(f.history_deck) ? f.history_deck : [],
            history: Array.isArray(f.history) ? f.history : [],
            fast_tracked: f.fast_tracked === true
            });
        });
        const needsTitleGateMigration = parsed.some((fighter, index) =>
            !fighter || typeof fighter !== 'object' ||
            Number(fighter.rebuild_wins_required) !==
                normalizedFighters[index]?.rebuild_wins_required ||
            Number(fighter.rebuild_loss_count) !==
                normalizedFighters[index]?.rebuild_loss_count ||
            fighter.title_comeback_completed !==
                normalizedFighters[index]?.title_comeback_completed ||
            fighter.dominant_ex_champ_rebuild !==
                normalizedFighters[index]?.dominant_ex_champ_rebuild
        );
        if (needsTitleGateMigration) {
            const migrated = parsed.map((fighter, index) => fighter && typeof fighter === 'object'
                ? {
                    ...fighter,
                    rebuild_wins_required: normalizedFighters[index]?.rebuild_wins_required || 0,
                    rebuild_loss_count: normalizedFighters[index]?.rebuild_loss_count || 0,
                    title_comeback_completed: normalizedFighters[index]?.title_comeback_completed === true,
                    dominant_ex_champ_rebuild: normalizedFighters[index]?.dominant_ex_champ_rebuild === true
                }
                : fighter);
            try {
                localStorage.setItem(
                    localStorage.getItem('wwe_fighters') === null ? 'fighters' : 'wwe_fighters',
                    JSON.stringify(migrated)
                );
            } catch (error) {
                console.error('Unable to initialize title eligibility counters.', error);
            }
        }
        return normalizedFighters;
    } catch {
        return [];
    }
}

function refreshFightersFromStorage(force = false) {
    const loaded = loadFightersFromStorage();
    if (force || !Array.isArray(fighters) || fighters.length === 0 || loaded.length > fighters.length) {
        fighters = loaded;
    }
    if (force || !window.fighters || !window.fighters.length) {
        window.fighters = fighters;
    }
    return fighters;
}

function getFighterList() {
    if (!Array.isArray(fighters) || fighters.length === 0) {
        refreshFightersFromStorage();
    }
    return fighters;
}

function isGeneratedFallbackPortrait(photo) {
    if (typeof photo !== 'string') return false;
    const value = photo.trim();
    if (!value.startsWith('data:image/svg+xml')) return false;
    return value.includes('portraitBg') || value.includes('rgba(255,255,255,0.18)') || value.includes('text-anchor="middle"');
}

function saveFighters(list = fighters) {
    if (window.wweUniverseResetInProgress) return;
    const baseList = list === undefined || list === null ? getFighterList() : list;
    const payload = (baseList || []).map(f => {
        if (!f || typeof f !== 'object') return null;
        const normalized = { ...f };
        normalized.id = normalized.id || `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
        normalized.name = normalized.name || 'Unknown Fighter';
        normalized.gender = (normalized.gender || 'male').toString().toLowerCase();
        normalized.division = normalized.division || normalized.weightClass || 'Heavyweight';
        normalized.wins = Number(normalized.wins || 0);
        normalized.losses = Number(normalized.losses || 0);
        normalized.defenses = Number(normalized.defenses || 0);
        normalized.lifetime_defenses = Number(normalized.lifetime_defenses || 0);
        normalized.title_fights = Number(normalized.title_fights || 0);
        normalized.total_title_fights = Number(normalized.total_title_fights ?? normalized.title_fights ?? 0);
        normalized.win_pinfall = Number(normalized.win_pinfall ?? normalized.pin_wins ?? 0);
        normalized.win_ko = Number(normalized.win_ko ?? normalized.ko_wins ?? 0);
        normalized.win_submission = Number(normalized.win_submission ?? normalized.sub_wins ?? 0);
        normalized.lose_streak = Math.max(0, Math.floor(Number(normalized.lose_streak) || 0));
        const titleGate = normalizeCardsTitleGate(normalized);
        normalized.rebuild_wins_required = titleGate.rebuildWinsRequired;
        normalized.rebuild_loss_count = titleGate.rebuildLossCount;
        normalized.title_comeback_completed = titleGate.comebackCompleted;
        normalized.dominant_ex_champ_rebuild = titleGate.dominantExChampionRebuild;
        normalized.peak_win_streak = getCardsCareerPeakWinStreak(normalized);
        normalized.fotn_bonuses = Math.max(0, Math.floor(Number(normalized.fotn_bonuses) || 0));
        normalized.potn_bonuses = Math.max(0, Math.floor(Number(normalized.potn_bonuses) || 0));
        normalized.career_bonuses = normalized.fotn_bonuses + normalized.potn_bonuses;
        normalized.is_boss = normalized.is_boss === true;
        normalized.boss_slays = Math.max(0, Math.floor(Number(normalized.boss_slays) || 0));
        delete normalized.team;
        delete normalized.partner;
        delete normalized.family;
        normalized.photo_key = normalized.photo_key || '';
        normalized.photo = typeof normalized.photo === 'string' ? normalized.photo.trim() : '';
        // Preserve fight history and other deck properties
        normalized.compiled_history_deck = Array.isArray(f.compiled_history_deck) ? f.compiled_history_deck : [];
        normalized.history_deck = Array.isArray(f.history_deck) ? f.history_deck : [];
        normalized.history = Array.isArray(f.history) ? f.history : [];
        return normalized;
    }).filter(Boolean);

    try {
        localStorage.setItem('wwe_fighters', JSON.stringify(payload));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wwe_fighters:changed', {
                detail: { source: 'cards.js', count: payload.length }
            }));
        }
    } catch (err) {
        if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22 || err.code === 1014)) {
            const fallbackPayload = payload.map(f => {
                if (!f || typeof f !== 'object') return f;
                if (typeof f.photo === 'string' && f.photo.startsWith('data:image')) {
                    const targetKey = f.photo_key || `fighter-photo-${f.id}`;
                    if (typeof window !== 'undefined' && 'indexedDB' in window) {
                        openFighterPhotoDB().then(db => {
                            const tx = db.transaction('photos', 'readwrite');
                            const store = tx.objectStore('photos');
                            store.put(f.photo, targetKey);
                        }).catch(() => {});
                    }
                    return { ...f, photo: '', photo_key: targetKey };
                }
                return f;
            });
            try {
                localStorage.setItem('wwe_fighters', JSON.stringify(fallbackPayload));
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('wwe_fighters:changed', {
                        detail: { source: 'cards.js-fallback', count: fallbackPayload.length }
                    }));
                }
                return;
            } catch (innerErr) {
                console.error('Failed to save fighters after moving inline photos to IndexedDB:', innerErr);
            }
        }
        console.error('Failed to save fighters:', err);
    }
}

if (typeof openFighterPhotoDB !== 'function') {
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
}

if (typeof storeFighterPhotoInIDB !== 'function') {
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
}

if (typeof loadFighterPhotoFromIDB !== 'function') {
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
}

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

let allianceLookupCacheRaw = null;
let allianceLookupCache = [];

function getUniverseAlliances() {
    const raw = localStorage.getItem('universeAlliances') || '[]';
    if (raw === allianceLookupCacheRaw) return allianceLookupCache;
    allianceLookupCacheRaw = raw;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Alliance data is not an array.');
        allianceLookupCache = parsed.filter(alliance =>
            alliance && typeof alliance === 'object' &&
            typeof alliance.name === 'string' &&
            Array.isArray(alliance.members)
        ).map(alliance => ({
            ...alliance,
            normalizedMemberKeys: new Set(alliance.members.map(normalizeLookupKey).filter(Boolean))
        }));
    } catch (error) {
        allianceLookupCache = [];
        console.error('Unable to read saved alliances for fight-card protection.', error);
    }
    return allianceLookupCache;
}

function getSharedAllianceForFighters(fighter1, fighter2) {
    const fighter1Key = normalizeLookupKey(fighter1?.name);
    const fighter2Key = normalizeLookupKey(fighter2?.name);
    if (!fighter1Key || !fighter2Key) return null;
    return getUniverseAlliances().find(alliance =>
        alliance.normalizedMemberKeys.has(fighter1Key) &&
        alliance.normalizedMemberKeys.has(fighter2Key)
    ) || null;
}

function getWarningStorageKey(matchRowId) {
    return `warning_match_${matchRowId}`;
}

function getRematchWarningActiveStorageKey(matchRowId) {
    return `match_${activeShowId || 'default'}_${matchRowId}_rematch_warning_active`;
}

function getRematchWarningDataStorageKey(matchRowId) {
    return `match_${activeShowId || 'default'}_${matchRowId}_rematch_warning_data`;
}

function isRematchWarningActive(matchRowId) {
    return sessionStorage.getItem(getRematchWarningActiveStorageKey(matchRowId)) === 'true';
}

function clearRematchWarningStorage(matchRowId) {
    sessionStorage.removeItem(getRematchWarningActiveStorageKey(matchRowId));
    sessionStorage.removeItem(getRematchWarningDataStorageKey(matchRowId));
}

function getWarningMatchState(matchRowId) {
    try {
        const stored = sessionStorage.getItem(getWarningStorageKey(matchRowId));
        const state = stored ? JSON.parse(stored) : null;
        if (!state || (state.showId && state.showId !== activeShowId)) return null;
        return state;
    } catch (error) {
        return null;
    }
}

function setWarningMatchState(matchRowId, type, details = {}) {
    const state = getWarningMatchState(matchRowId) || {};
    state.showId = activeShowId || '';
    state[type] = { ...details };
    sessionStorage.setItem(getWarningStorageKey(matchRowId), JSON.stringify(state));
}

function clearWarningMatchState(matchRowId, type) {
    const state = getWarningMatchState(matchRowId);
    if (!state) {
        sessionStorage.removeItem(getWarningStorageKey(matchRowId));
        if (type === 'rematch' || !type) sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
        return;
    }
    if (type) delete state[type];
    else {
        delete state.sameName;
        delete state.rematch;
        sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
    }
    if (type === 'rematch') sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
    if (!state.sameName && !state.rematch) {
        sessionStorage.removeItem(getWarningStorageKey(matchRowId));
    } else {
        sessionStorage.setItem(getWarningStorageKey(matchRowId), JSON.stringify(state));
    }
}

function isUnfinalizedWarningRow(matchRowId) {
    const row = document.getElementById(matchRowId);
    return !!row && !completedMatches[matchRowId] && !isShowCompleted(activeShowId);
}

const rosterPortraitMap = (typeof window !== 'undefined' && window.wwe2k24PortraitMap) ? window.wwe2k24PortraitMap : {};
const rosterPortraitMapNormalized = (typeof window !== 'undefined' && window.wwe2k24PortraitMapNormalized) ? window.wwe2k24PortraitMapNormalized : Object.keys(rosterPortraitMap).reduce((acc, name) => {
    acc[normalizeLookupKey(name)] = rosterPortraitMap[name];
    return acc;
}, {});

if (typeof window !== 'undefined') {
    window.wwe2k24PortraitMap = rosterPortraitMap;
    window.wwe2k24PortraitMapNormalized = rosterPortraitMapNormalized;
    window.normalizeLookupKey = window.normalizeLookupKey || normalizeLookupKey;
    window.getWWE2K24Portrait = window.getWWE2K24Portrait || function(name) {
        if (!name) return '';
        return (window.wwe2k24PortraitMapNormalized || {})[normalizeLookupKey(name)] || '';
    };
}

function getActiveWinStreakForPortrait(fighter) {
    if (typeof window.getCurrentWinStreak === 'function') return window.getCurrentWinStreak(fighter);
    if (!fighter) return 0;
    const wins = Number(fighter.wins || 0);
    const losses = Number(fighter.losses || 0);
    const activeStreak = losses === 0 ? wins : (fighter.win_streak || 0);
    return Number(activeStreak) || 0;
}

function getStreakClass(fighter) {
    if (typeof window.getWinStreakPortraitClass === 'function') {
        return window.getWinStreakPortraitClass(fighter);
    }
    const calculatedStreak = getActiveWinStreakForPortrait(fighter);
    if (calculatedStreak >= 47) return 'streak-tier-master-prestige';
    if (calculatedStreak >= 43) return 'streak-tier-blood-moon';
    if (calculatedStreak >= 39) return 'streak-tier-cyber';
    if (calculatedStreak >= 35) return 'streak-tier-cosmic';
    if (calculatedStreak >= 31) return 'streak-tier-hellfire';
    if (calculatedStreak >= 26) return 'streak-tier-lightning';
    if (calculatedStreak >= 22) return 'streak-tier-rainbow';
    if (calculatedStreak >= 18) return 'streak-tier-gold';
    if (calculatedStreak >= 13) return 'streak-tier-blue';
    if (calculatedStreak >= 7) return 'streak-tier-green';
    if (calculatedStreak >= 3) return 'streak-tier-purple';
    return '';
}

function applyStreakPortraitClass(frame, fighter) {
    if (!frame) return;
    const streakClass = getStreakClass(fighter);
    if (typeof window.applyWinStreakPortraitClass === 'function') {
        window.applyWinStreakPortraitClass(frame, fighter);
    } else {
        frame.classList.add('portrait-frame-base');
        frame.classList.remove('streak-tier-purple', 'streak-tier-green', 'streak-tier-blue', 'streak-tier-gold', 'streak-tier-rainbow', 'streak-tier-lightning', 'streak-tier-hellfire', 'streak-tier-cosmic', 'streak-tier-cyber', 'streak-tier-blood-moon', 'streak-tier-master-prestige', 'streak-purple', 'streak-green', 'streak-blue', 'streak-rainbow-diamond', 'border-tier-1', 'border-tier-2', 'border-tier-3', 'border-tier-4');
        if (streakClass) frame.classList.add(streakClass);
    }

    const slot = frame.closest('.fighter-slot');
    if (slot) {
        slot.classList.remove('streak-tier-purple', 'streak-tier-green', 'streak-tier-blue', 'streak-tier-gold', 'streak-tier-rainbow', 'streak-tier-lightning', 'streak-tier-hellfire', 'streak-tier-cosmic', 'streak-tier-cyber', 'streak-tier-blood-moon', 'streak-tier-master-prestige');
        if (streakClass) slot.classList.add(streakClass);
    }
    const applyEffects = window.applyWinStreakEffects || window.applyWinStreakLightningOverlay;
    if (typeof applyEffects === 'function') applyEffects(frame, fighter);
    if (typeof window.applyLoseStreakPortraitEffects === 'function') {
        window.applyLoseStreakPortraitEffects(frame, fighter);
        if (slot) {
            slot.classList.remove('cold-streak-slump', 'cold-streak-freeze', 'cold-streak-hot-seat');
            const coldStreakClass = window.getLoseStreakPortraitClass?.(fighter);
            if (coldStreakClass) slot.classList.add(coldStreakClass);
        }
    }
}

window.getStreakClass = getStreakClass;

const hydrateFighterPhotos = async function() {
    const activeFighters = Array.from(document.querySelectorAll('.fighter-search-input'))
        .map(input => getFighterByIdOrName(input.value.trim()) || getFighterByIdOrName(input.getAttribute('data-fighter-id')))
        .filter((fighter, index, list) => fighter && list.indexOf(fighter) === index);

    await Promise.all(activeFighters.map(async fighter => {
        if (fighter.photo || !fighter.photo_key || typeof loadFighterPhotoFromIDB !== 'function') return;
        const storedPhoto = await loadFighterPhotoFromIDB(fighter.photo_key);
        if (!storedPhoto) return;
        fighter.photo = storedPhoto;
        window._fighterPhotoCache = window._fighterPhotoCache || Object.create(null);
        window._fighterPhotoCache[String(fighter.photo_key)] = storedPhoto;
    }));
};

async function hydrateSelectedFighterPortrait(input) {
    if (!input) return;
    await hydrateFighterPhotos();

    const slot = input.closest('.fighter-slot');
    const fighter = getFighterByIdOrName(input.value.trim());
    const avatar = slot?.querySelector('.avatar-box');
    if (!fighter || !avatar) return;
    applyStreakPortraitClass(slot.querySelector('.avatar-frame'), fighter);

    const photo = getEffectivePhotoFor(fighter);
    avatar.innerHTML = photo
        ? `<img src="${photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
        : (fighter.name || 'F').charAt(0);
}

function getEffectivePhotoFor(fighter) {
    if (!fighter || typeof fighter !== 'object') return '';
    if (typeof fighter.photo === 'string' && fighter.photo) return fighter.photo;
    if (typeof fighter.image === 'string' && fighter.image) return fighter.image;
    const mapped = typeof window !== 'undefined' && typeof window.getWWE2K24Portrait === 'function'
        ? window.getWWE2K24Portrait(fighter.name || '')
        : getWWE2K24Portrait(fighter.name || '');
    if (mapped) return mapped;
    try {
        const key = fighter.photo_key || fighter.photoKey || (`fighter-photo-${fighter.id}`);
        if (key && window._fighterPhotoCache && window._fighterPhotoCache[String(key)]) return window._fighterPhotoCache[String(key)];
    } catch (e) {}
    return '';
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

// Betting system removed, but some legacy UI still calls these hooks.
var updateBettingMoney = function(amount) {
    return Number(amount || 0);
};
window.updateBettingMoney = updateBettingMoney;

var resetBettingMoney = function() {
    return 0;
};
window.resetBettingMoney = resetBettingMoney;

fighters = loadFightersFromStorage();
window.fighters = fighters;
let futureShows = JSON.parse(localStorage.getItem('wwe_future_shows')) || [];
let activeShowId = localStorage.getItem('wwe_active_show_id') || '';
let portraitHydrationOnLoadRan = false;
let portraitHydrationOnChangeRan = false;
const matchTimerStates = new Map();

function getShowNumber(show) {
    const storedNumber = Number(show?.showNumber);
    if (Number.isInteger(storedNumber) && storedNumber > 0) return storedNumber;
    const index = futureShows.indexOf(show);
    return index >= 0 ? index + 1 : futureShows.length + 1;
}

function getAutomaticShowTier(showNumber) {
    return showNumber % 4 === 0 ? 'ppv' : 'fight_night';
}

function getShowTier(show) {
    if (show?.tierOverride === true && (show.tier === 'fight_night' || show.tier === 'ppv')) {
        return show.tier;
    }
    return getAutomaticShowTier(getShowNumber(show));
}

function getActiveShowTier() {
    const show = futureShows.find(item => item.id === activeShowId);
    return show ? getShowTier(show) : null;
}

function isUndefeatedProspect(fighter) {
    return !!fighter &&
        Number(fighter.wins) >= 2 &&
        Number(fighter.losses || 0) === 0 &&
        !fighter.retired;
}
window.isUndefeatedProspect = isUndefeatedProspect;

function isFightNightMatchupAllowed(fighter1, fighter2) {
    if (getSharedAllianceForFighters(fighter1, fighter2)) return false;
    if (getActiveShowTier() !== 'fight_night') return true;
    if (isUndefeatedProspect(fighter1) && Number(fighter2?.losses || 0) < 1) return false;
    if (isUndefeatedProspect(fighter2) && Number(fighter1?.losses || 0) < 1) return false;
    return true;
}

function updateProspectProtectionBadge(matchRowId) {
    const row = document.getElementById(matchRowId);
    const badge = document.getElementById(`${matchRowId}-prospect-protection-badge`);
    const statusRow = document.getElementById(`${matchRowId}-prospect-protection-row`);
    if (!row || !badge || !statusRow) return;

    const getSlotFighter = slotType => {
        const input = row.querySelector(`.fighter-slot[id$="-${slotType}"] .fighter-search-input`);
        const fighterId = input?.getAttribute('data-fighter-id');
        return (fighterId && fighters.find(fighter => fighter.id === fighterId)) ||
            getFighterByIdOrName(input?.value.trim());
    };
    const fighter1 = getSlotFighter('slot1');
    const fighter2 = getSlotFighter('slot2');
    const tier = getActiveShowTier();

    badge.className = 'prospect-protection-badge';
    if (tier === 'fight_night' && isUndefeatedProspect(fighter1) && isUndefeatedProspect(fighter2)) {
        badge.classList.add('prospect-protection-badge--protected');
        badge.textContent = '🛡️ PROSPECT PROTECTION • Save Undefeated Clash for PPV?';
    } else if (tier === 'ppv' &&
        Number(fighter1?.wins) >= 3 && Number(fighter1?.losses || 0) === 0 && !fighter1?.retired &&
        Number(fighter2?.wins) >= 3 && Number(fighter2?.losses || 0) === 0 && !fighter2?.retired) {
        badge.classList.add('prospect-protection-badge--collision');
        badge.textContent = `🔥 UNDEFEATED COLLISION (${Number(fighter1.wins)}-0 vs ${Number(fighter2.wins)}-0)`;
    } else {
        statusRow.hidden = true;
        badge.textContent = '';
        updateTitleShotProtectionAlert(matchRowId);
        updateShortNoticeBadge(matchRowId);
        updateAllianceClashAlert(matchRowId);
        return;
    }

    statusRow.hidden = false;
    updateTitleShotProtectionAlert(matchRowId);
    updateShortNoticeBadge(matchRowId);
    updateAllianceClashAlert(matchRowId);
}

function updateAllianceClashAlert(matchRowId) {
    const row = document.getElementById(matchRowId);
    if (!row) return;
    let banner = row.querySelector('.alliance-clash-alert');
    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'alliance-clash-alert';
        banner.hidden = true;
        row.insertBefore(banner, row.querySelector(`#${matchRowId}-booking-panel`));
    }

    if (completedMatches[matchRowId] || isShowCompleted(activeShowId)) {
        banner.hidden = true;
        banner.textContent = '';
        return;
    }
    const fighter1 = getFighterByIdOrName(
        row.querySelector(`#${matchRowId}-slot1 .fighter-search-input`)?.getAttribute('data-fighter-id') ||
        row.querySelector(`#${matchRowId}-slot1 .fighter-search-input`)?.value.trim()
    );
    const fighter2 = getFighterByIdOrName(
        row.querySelector(`#${matchRowId}-slot2 .fighter-search-input`)?.getAttribute('data-fighter-id') ||
        row.querySelector(`#${matchRowId}-slot2 .fighter-search-input`)?.value.trim()
    );
    const alliance = getSharedAllianceForFighters(fighter1, fighter2);
    banner.hidden = !alliance;
    banner.textContent = alliance
        ? `💔 FAMILY / FRIEND / ROMANTIC CLASH • ${alliance.name}!`
        : '';
}

function isShortNoticeTitleEligible(fighter) {
    return !!fighter &&
        Number(fighter.win_streak) >= getCardsTitleRules().initialTitleWins &&
        (Number(fighter.rebuild_wins_required) || 0) === 0;
}

function isFighterBookedForTitleOnAnotherUnfinalizedShow(fighter) {
    const fighterKey = normalizeLookupKey(fighter?.name);
    if (!fighterKey) return false;
    const finalizedShowIds = getFinalizedShowIds();

    return futureShows.some(show => {
        if (!show || show.id === activeShowId || show.completed || finalizedShowIds.has(show.id)) return false;
        return [`wwe_matches_${show.id}`, `wwe_draft_${show.id}`].some(storageKey => {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return false;
            let entries;
            try {
                entries = JSON.parse(raw);
            } catch (error) {
                console.error(`Unable to inspect title bookings in ${storageKey}.`, error);
                return false;
            }
            if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return false;
            return Object.values(entries).some(entry => {
                if (!entry || !(entry.isTitle === true || entry.titleChecked === true)) return false;
                const names = [entry.slot1Name, entry.slot2Name, entry.f1Name, entry.f2Name];
                const ids = [entry.slot1Id, entry.slot2Id, entry.f1Id, entry.f2Id];
                return names.some(name => normalizeLookupKey(name) === fighterKey) ||
                    (fighter.id && ids.some(id => String(id || '') === String(fighter.id)));
            });
        });
    });
}

function updateTitleShotProtectionAlert(matchRowId) {
    const row = document.getElementById(matchRowId);
    if (!row) return;
    let banner = row.querySelector('.title-shot-protection-alert');
    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'title-shot-protection-alert';
        banner.hidden = true;
        row.insertBefore(banner, row.querySelector(`#${matchRowId}-booking-panel`));
    }

    if (isShowCompleted(activeShowId) || completedMatches[matchRowId] ||
        document.getElementById(`${matchRowId}-title-check`)?.checked) {
        banner.hidden = true;
        banner.replaceChildren();
        return;
    }

    const protectedFighters = ['slot1', 'slot2'].map(slotSide => {
        const input = row.querySelector(`#${matchRowId}-${slotSide} .fighter-search-input`);
        const fighter = getFighterByIdOrName(input?.getAttribute('data-fighter-id') || input?.value.trim());
        return fighter && (isShortNoticeTitleEligible(fighter) ||
            isFighterBookedForTitleOnAnotherUnfinalizedShow(fighter))
            ? { fighter, slotSide }
            : null;
    }).filter(Boolean);

    banner.replaceChildren();
    banner.hidden = protectedFighters.length === 0;
    protectedFighters.forEach(({ fighter, slotSide }) => {
        const message = document.createElement('span');
        message.className = 'title-shot-protection-alert__message';
        message.textContent = `🛡️ TITLE SHOT PROTECTION: ${fighter.name} is Title Eligible — Risking Title Shot in Non-Title Bout!`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'title-shot-protection-alert__action';
        button.textContent = '⚡ Auto-Replace (Short Notice)';
        const showIndex = futureShows.findIndex(show => show.id === activeShowId);
        const matchIndex = Array.from(document.querySelectorAll('.match-row')).indexOf(row);
        button.addEventListener('click', () =>
            window.replaceWithShortNotice(showIndex, matchIndex, slotSide)
        );
        banner.append(message, button);
    });
}

function updateShortNoticeBadge(matchRowId) {
    const row = document.getElementById(matchRowId);
    const badge = row?.querySelector('.short-notice-replacement-pill');
    if (!row || !badge) return;
    const matchState = completedMatches[matchRowId];
    const fighterName = row.dataset.shortNoticeFighter || matchState?.shortNoticeFighter || '';
    const isShortNotice = row.dataset.shortNotice === 'true' || matchState?.shortNotice === true;
    badge.hidden = !isShortNotice;
    badge.textContent = isShortNotice ? '⚡ SHORT NOTICE REPLACEMENT' : '';
    badge.title = fighterName ? `Replacement: ${fighterName}` : '';
}

window.replaceWithShortNotice = function(showIndex, matchIndex, slotSide) {
    const show = futureShows[Number(showIndex)];
    const rows = Array.from(document.querySelectorAll('.match-row'));
    const row = rows[Number(matchIndex)];
    if (!show || show.id !== activeShowId || !row ||
        !['slot1', 'slot2'].includes(slotSide) ||
        isShowCompleted(show.id) || completedMatches[row.id]) {
        return customAlert('This match is no longer available for a short-notice replacement.', 'Short-Notice Replacement');
    }
    if (document.getElementById(`${row.id}-title-check`)?.checked) {
        return customAlert('Protected fighters cannot be replaced from a title bout.', 'Short-Notice Replacement');
    }

    refreshFightersFromStorage(true);
    const protectedInput = row.querySelector(`#${row.id}-${slotSide} .fighter-search-input`);
    const opponentSide = slotSide === 'slot1' ? 'slot2' : 'slot1';
    const opponentInput = row.querySelector(`#${row.id}-${opponentSide} .fighter-search-input`);
    const protectedFighter = getFighterByIdOrName(protectedInput?.getAttribute('data-fighter-id') || protectedInput?.value.trim());
    const opponent = getFighterByIdOrName(opponentInput?.getAttribute('data-fighter-id') || opponentInput?.value.trim());
    if (!protectedInput || !protectedFighter || !opponent ||
        !(isShortNoticeTitleEligible(protectedFighter) ||
            isFighterBookedForTitleOnAnotherUnfinalizedShow(protectedFighter))) {
        return customAlert('The protected fighter or opponent could not be verified. No changes were made.', 'Short-Notice Replacement');
    }

    const bookedKeys = new Set();
    rows.forEach(cardRow => {
        ['slot1', 'slot2'].forEach(side => {
            if (cardRow === row && side === slotSide) return;
            const input = cardRow.querySelector(`.fighter-slot[id$="-${side}"] .fighter-search-input`);
            const key = normalizeLookupKey(input?.value);
            if (key) bookedKeys.add(key);
        });
    });
    const gender = normalizeSmartBookGender(opponent.gender);
    const rankings = typeof window.getDivisionRankings === 'function' ? window.getDivisionRankings() : [];
    const rankByName = new Map();
    (Array.isArray(rankings) ? rankings : []).forEach(group => {
        (group.rankings || []).forEach(entry => {
            const key = normalizeLookupKey(entry.fighter?.name);
            if (key) {
                const rank = Number(entry.rankNumber) ||
                    Number(String(entry.rank || '').match(/^#(\d+)$/)?.[1]) || 99;
                rankByName.set(key, rank);
            }
        });
    });
    const record = fighter => {
        const wins = Math.max(0, Number(fighter.wins) || 0);
        const losses = Math.max(0, Number(fighter.losses) || 0);
        const fights = wins + losses + Math.max(0, Number(fighter.draws) || 0);
        return { wins, losses, fights, rate: fights ? wins / fights : 0 };
    };
    const opponentRank = rankByName.get(normalizeLookupKey(opponent.name)) || 99;
    const opponentRecord = record(opponent);
    const score = fighter => {
        const fighterRank = rankByName.get(normalizeLookupKey(fighter.name)) || 99;
        const fighterRecord = record(fighter);
        return Math.abs(fighterRank - opponentRank) * 2 +
            Math.abs(fighterRecord.rate - opponentRecord.rate) * 12 +
            Math.abs(fighterRecord.fights - opponentRecord.fights) * 0.15;
    };
    const candidates = fighters.filter(fighter =>
        fighter && fighter.retired !== true &&
        normalizeSmartBookGender(fighter.gender) === gender &&
        normalizeLookupKey(fighter.name) !== normalizeLookupKey(opponent.name) &&
        normalizeLookupKey(fighter.name) !== normalizeLookupKey(protectedFighter.name) &&
        !bookedKeys.has(normalizeLookupKey(fighter.name)) &&
        !getTitleEligibilityStatus(fighter).eligible &&
        isFightNightMatchupAllowed(fighter, opponent)
    ).sort((first, second) => score(first) - score(second) ||
        String(first.name).localeCompare(String(second.name)));
    const replacement = candidates[0];
    if (!replacement) {
        return customAlert('No eligible, unbooked replacement is available in this gender division.', 'Short-Notice Replacement');
    }

    clearRematchWarningForInput(row.id);
    clearDuplicateApprovalForChangedInput(row.id);
    protectedInput.value = replacement.name;
    protectedInput.setAttribute('data-fighter-id', replacement.id || '');
    const avatar = row.querySelector(`#${row.id}-${slotSide} .avatar-box`);
    if (avatar) {
        avatar.innerHTML = replacement.photo
            ? `<img src="${replacement.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
            : replacement.name.charAt(0);
        avatar.style.cssText = 'width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;';
        avatar.onclick = event => {
            event.stopPropagation();
            uploadFighterPhotoFromCard(replacement.id);
        };
    }
    row.dataset.shortNotice = 'true';
    row.dataset.shortNoticeFighter = replacement.name;
    updateFighterRecordDisplay(row.id, slotSide, replacement);
    checkFighterScheduleConflict(row);
    updateWinnerDropdown(row.id);
    recheckMatchValidation(row.id, slotSide);
    refreshTitleFightState(row.id);
    hydrateSelectedFighterPortrait(protectedInput).catch(() => {});
    updateShortNoticeBadge(row.id);
    saveCurrentCardDraft();
    updateFighterScheduleLocator();
};

function getNextShowNumber() {
    return futureShows.reduce((highest, show) => Math.max(highest, getShowNumber(show)), 0) + 1;
}

function createScheduledShow(showNumber) {
    const tier = getAutomaticShowTier(showNumber);
    const tierNumber = tier === 'ppv' ? Math.floor(showNumber / 4) : showNumber - Math.floor(showNumber / 4);
    const name = tier === 'ppv' ? `PPV ${tierNumber}` : `FIGHT NIGHT ${tierNumber}`;
    return {
        id: `show-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        showNumber,
        tier,
        tierOverride: false
    };
}

function appendScheduledShows(count) {
    const startNumber = getNextShowNumber();
    for (let index = 0; index < count; index++) {
        futureShows.push(createScheduledShow(startNumber + index));
    }
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    return startNumber;
}

function updateCurrentShowTierPresentation() {
    const show = futureShows.find(item => item.id === activeShowId);
    if (!show) return;

    const tier = getShowTier(show);
    const badge = document.getElementById('showTierBadge');
    const selector = document.getElementById('showTierSelector');
    document.body.classList.toggle('show-tier-fight-night', tier === 'fight_night');
    document.body.classList.toggle('show-tier-ppv', tier === 'ppv');

    if (badge) {
        badge.textContent = tier === 'ppv' ? '🏆 MAJOR PPV EVENT' : '🥊 UFC FIGHT NIGHT';
        badge.classList.toggle('show-tier-badge-ppv', tier === 'ppv');
        badge.classList.toggle('show-tier-badge-fight-night', tier === 'fight_night');
        badge.title = `Show ${getShowNumber(show)} of the 4-show cycle`;
    }
    if (selector) selector.value = tier;
    document.querySelectorAll('.match-row').forEach(row => updateProspectProtectionBadge(row.id));
}

function refreshShowStateFromStorage() {
    try {
        futureShows = JSON.parse(localStorage.getItem('wwe_future_shows')) || [];
    } catch (e) {
        futureShows = [];
    }

    if (!activeShowId || !futureShows.find(s => s.id === activeShowId)) {
        activeShowId = futureShows[0]?.id || '';
        if (activeShowId) {
            localStorage.setItem('wwe_active_show_id', activeShowId);
        }
    }
}

function getActiveShowMatchesStorageKey() {
    refreshShowStateFromStorage();
    if (!activeShowId || !futureShows.find(s => s.id === activeShowId)) return null;
    return `wwe_matches_${activeShowId}`;
}

function getEventNameInput() {
    const input = document.getElementById('eventNameInput') || document.getElementById('showNameInput');
    if (!input) return null;
    if (input.id !== 'eventNameInput') {
        input.id = 'eventNameInput';
    }
    return input;
}

function syncEventNameInputToActiveShow() {
    const input = getEventNameInput();
    if (!input) return;
    const currentShow = futureShows.find(s => s.id === activeShowId);
    if (!currentShow) return;
    if (input.value.trim() !== currentShow.name) {
        input.value = currentShow.name;
    }
}

function ensureActiveShowSelected() {
    if (activeShowId && futureShows.find(s => s.id === activeShowId)) {
        if (localStorage.getItem('wwe_matches_')) {
            localStorage.removeItem('wwe_matches_');
        }
        return;
    }

    if (futureShows.length > 0) {
        activeShowId = futureShows[0].id;
        localStorage.setItem('wwe_active_show_id', activeShowId);
        if (localStorage.getItem('wwe_matches_')) {
            localStorage.removeItem('wwe_matches_');
        }
        return;
    }

    const newShow = createScheduledShow(getNextShowNumber());
    const newId = newShow.id;
    futureShows.push(newShow);
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    activeShowId = newId;
    localStorage.setItem('wwe_active_show_id', activeShowId);
    if (localStorage.getItem('wwe_matches_')) {
        localStorage.removeItem('wwe_matches_');
    }
}

ensureActiveShowSelected();

function auditPastRematchStates() {
    const auditKey = 'wwe_rematch_history_audited_v1';
    if (localStorage.getItem(auditKey) === 'true') return;

    let eventHistory;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
    } catch (error) {
        console.error('Unable to read archived event history for the rematch audit.', error);
        return;
    }
    if (!Array.isArray(eventHistory)) {
        console.error('Archived event history is not a valid list; rematch audit was not saved.');
        return;
    }

    const showById = new Map(futureShows.map(show => [show.id, show]));
    const showByName = new Map(futureShows.map(show => [String(show.name || '').trim().toLocaleLowerCase(), show]));
    const getEventShow = event => showById.get(event.showId) ||
        showByName.get(String(event.showTitle || event.name || '').trim().toLocaleLowerCase());
    const getCardNumber = event => {
        const match = String(event.showTitle || event.name || '').match(/(?:FIGHT\s*CARD)\s*(\d+)/i);
        return match ? Number(match[1]) : null;
    };
    const chronologicalEvents = eventHistory
        .map((event, index) => ({
            event,
            index,
            cardNumber: getCardNumber(event),
            timestamp: Date.parse(event.completedAt || event.date || '') || 0
        }))
        .filter(item => item.event && Array.isArray(item.event.matches))
        .sort((a, b) => {
            if (a.cardNumber !== null && b.cardNumber !== null && a.cardNumber !== b.cardNumber) {
                return a.cardNumber - b.cardNumber;
            }
            return a.timestamp - b.timestamp || a.index - b.index;
        });
    const meetingCounts = new Map();
    const changedShowStates = new Map();

    chronologicalEvents.forEach(({ event }) => {
        const show = getEventShow(event);
        let savedMatches = null;
        const storageKey = show?.id ? `wwe_matches_${show.id}` : null;
        if (storageKey) {
            try {
                savedMatches = JSON.parse(localStorage.getItem(storageKey) || '{}');
            } catch (error) {
                console.error(`Unable to read saved match results for ${show.name || show.id} during rematch audit.`, error);
                savedMatches = null;
            }
        }

        event.matches.forEach(match => {
            if (!match || typeof match !== 'object') return;
            const fighterA = String(match.winner || match.winnerName || '').trim();
            const fighterB = String(match.loser || match.loserName || '').trim();
            if (!fighterA || !fighterB) return;
            const names = [normalizeLookupKey(fighterA), normalizeLookupKey(fighterB)].sort();
            if (!names[0] || !names[1] || names[0] === names[1]) return;
            const pairKey = JSON.stringify(names);
            const priorMeetings = meetingCounts.get(pairKey) || 0;
            const markedRematch = match.isRematch === true;
            const isRematch = markedRematch || priorMeetings > 0;
            const savedNumber = Number(match.rematchNumber) || 0;
            const legacyMeetingNumber = match.rematchNumberIsMeeting === true ? savedNumber : savedNumber + 1;
            const rematchNumber = isRematch
                ? Math.max(2, priorMeetings + 1, legacyMeetingNumber)
                : 0;
            match.isRematch = isRematch;
            match.rematchNumber = rematchNumber;
            match.rematchNumberIsMeeting = true;
            meetingCounts.set(pairKey, priorMeetings + 1);

            if (savedMatches && match.matchId && savedMatches[match.matchId]) {
                savedMatches[match.matchId].isRematch = match.isRematch;
                savedMatches[match.matchId].rematchNumber = rematchNumber;
                savedMatches[match.matchId].rematchNumberIsMeeting = true;
            }
        });

        if (storageKey && savedMatches) changedShowStates.set(storageKey, savedMatches);
    });

    try {
        localStorage.setItem('wwe_event_history', JSON.stringify(eventHistory));
        changedShowStates.forEach((matches, storageKey) => {
            localStorage.setItem(storageKey, JSON.stringify(matches));
        });
        localStorage.setItem(auditKey, 'true');
    } catch (error) {
        console.error('Unable to save audited rematch history.', error);
    }
}

auditPastRematchStates();

function auditTitleFightAppearances() {
    const auditKey = 'wwe_total_title_fights_audited_v1';
    if (localStorage.getItem(auditKey) === 'true') return;

    let eventHistory;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
    } catch (error) {
        console.error('Unable to read archived event history for title-fight audit.', error);
        return;
    }
    if (!Array.isArray(eventHistory)) {
        console.error('Archived event history is not a valid list; title-fight audit was not saved.');
        return;
    }

    const counts = new Map(fighters.map(fighter => [fighter.id, 0]));
    const unfinalizedMatchUpdates = new Map();
    const fighterByName = new Map(fighters.map(fighter => [normalizeLookupKey(fighter.name), fighter]));
    const resolveFighter = (id, name) => fighters.find(fighter => id && fighter.id === id) ||
        fighterByName.get(normalizeLookupKey(name || ''));
    const countTitleMatch = match => {
        if (!match || match.isTitle !== true) return;
        const fighter1 = resolveFighter(match.slot1Id || match.winnerId, match.slot1Name || match.winner || match.winnerName);
        const fighter2 = resolveFighter(match.slot2Id || match.loserId, match.slot2Name || match.loser || match.loserName);
        if (fighter1) counts.set(fighter1.id, (counts.get(fighter1.id) || 0) + 1);
        if (fighter2 && fighter2.id !== fighter1?.id) counts.set(fighter2.id, (counts.get(fighter2.id) || 0) + 1);
        match.totalTitleFightAppearanceCounted = true;
    };

    const archivedShowIds = new Set();
    const archivedShowNames = new Set();
    eventHistory.forEach(event => {
        if (!event || !Array.isArray(event.matches)) return;
        if (event.showId) archivedShowIds.add(event.showId);
        const eventName = String(event.showTitle || event.name || '').trim().toLocaleLowerCase();
        if (eventName) archivedShowNames.add(eventName);
        event.matches.forEach(countTitleMatch);
    });

    futureShows.forEach(show => {
        if (!show?.id || archivedShowIds.has(show.id) ||
            archivedShowNames.has(String(show.name || '').trim().toLocaleLowerCase())) return;
        let savedMatches;
        try {
            savedMatches = JSON.parse(localStorage.getItem(`wwe_matches_${show.id}`) || '{}');
        } catch (error) {
            console.error(`Unable to read match results for ${show.name || show.id} during title-fight audit.`, error);
            return;
        }
        if (savedMatches && typeof savedMatches === 'object' && !Array.isArray(savedMatches)) {
            Object.values(savedMatches).forEach(match => {
                countTitleMatch(match);
                if (match?.isTitle === true) match.totalTitleFightAppearanceCounted = true;
            });
            unfinalizedMatchUpdates.set(`wwe_matches_${show.id}`, savedMatches);
        }
    });

    try {
        fighters.forEach(fighter => {
            if (fighter.manual_stats_override === true) return;
            const total = counts.get(fighter.id) || 0;
            fighter.total_title_fights = total;
            fighter.title_fights = total;
        });
        localStorage.setItem('wwe_event_history', JSON.stringify(eventHistory));
        unfinalizedMatchUpdates.forEach((matches, key) => {
            localStorage.setItem(key, JSON.stringify(matches));
        });
        saveFighters(fighters);
        localStorage.setItem(auditKey, 'true');
    } catch (error) {
        console.error('Unable to save audited title-fight totals.', error);
    }
}

auditTitleFightAppearances();

function auditLifetimeTitleDefenses() {
    const auditKey = 'wwe_lifetime_title_defenses_audit_v2';
    if (localStorage.getItem(auditKey) === 'complete') return;

    let eventHistory;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
    } catch (error) {
        console.error('Unable to read archived event history for lifetime-defense audit.', error);
        return;
    }
    if (!Array.isArray(eventHistory)) {
        console.error('Archived event history is not a valid list; lifetime-defense audit was not saved.');
        return;
    }

    const totals = new Map(fighters.map(fighter => [fighter.id, 0]));
    const fighterByName = new Map(fighters.map(fighter => [normalizeLookupKey(fighter.name), fighter]));
    const getFighter = (id, name) => fighters.find(fighter => id && fighter.id === id) ||
        fighterByName.get(normalizeLookupKey(name || ''));
    eventHistory.forEach(event => {
        if (!Array.isArray(event?.matches)) return;
        event.matches.forEach(match => {
            if (!match || match.isTitle !== true || (match.titleRetained !== true && match.lifetimeDefenseCounted !== true)) return;
            const champion = getFighter(match.winnerId, match.winner || match.winnerName);
            if (!champion) return;
            totals.set(champion.id, (totals.get(champion.id) || 0) + 1);
            match.lifetimeDefenseCounted = true;
        });
    });

    try {
        fighters.forEach(fighter => {
            if (fighter.manual_stats_override === true) return;
            fighter.lifetime_defenses = totals.get(fighter.id) || 0;
        });
        saveFighters(fighters);
        localStorage.setItem('wwe_event_history', JSON.stringify(eventHistory));
        localStorage.setItem(auditKey, 'complete');
    } catch (error) {
        console.error('Unable to persist audited lifetime title defenses.', error);
    }
}

auditLifetimeTitleDefenses();
let completedMatches = loadCompletedMatchesForShow(activeShowId);
let activeMatchId = null;
window.skipDraftSaveOnUnload = false;

function loadCompletedMatchesForShow(showId) {
    refreshFightersFromStorage();
    if (!showId) return {};
    const storageKey = `wwe_matches_${showId}`;
    const storedMatches = JSON.parse(localStorage.getItem(storageKey)) || {};
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
            localStorage.setItem(storageKey, JSON.stringify(storedMatches));
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
            showName: eventRecord.showTitle || eventRecord.name || '',
            winnerGender: winnerFighter ? winnerFighter.gender : 'male',
            slot1Name: match.winner,
            slot2Name: match.loser,
            slot1Id: winnerFighter?.id || '',
            slot2Id: loserFighter?.id || '',
            gender: inferredGender,
            methodId: match.methodId || '',
            methodName: match.method || '',
            bonusType: normalizePerformanceBonusType(match.bonusType),
            loserLoseStreakBefore: Math.max(0, Math.floor(Number(match.loserLoseStreakBefore) || 0)),
            isTitle: Boolean(match.isTitle),
            shortNotice: match.shortNotice === true,
            shortNoticeFighter: match.shortNoticeFighter || '',
            titleId: match.titleId || '',
            titleName: match.customTitleName || '',
            isRematch: match.isRematch === true,
            rematchNumber: Number(match.rematchNumber) || 0,
            rematchNumberIsMeeting: match.rematchNumberIsMeeting === true,
            titleFightAppearanceCounted: match.totalTitleFightAppearanceCounted === true
            };
    });

    if (Object.keys(recovered).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(recovered));
    }
    return recovered;
}

function isShowCompleted(showId) {
    refreshShowStateFromStorage();
    const show = futureShows.find(s => s.id === showId);
    return Boolean(show && show.completed);
}

function getFinalizedShowIds() {
    const finalizedIds = new Set(futureShows.filter(show => show.completed).map(show => show.id));
    try {
        const archivedEvents = JSON.parse(localStorage.getItem('wwe_event_history')) || [];
        archivedEvents.forEach(event => {
            if (event && event.showId) finalizedIds.add(event.showId);
        });
    } catch (error) {}
    return finalizedIds;
}

function updateFinalizedShowDropdownStyles() {
    const selector = document.getElementById('activeShowSelector');
    if (!selector) return;
    refreshShowStateFromStorage();
    const finalizedIds = getFinalizedShowIds();
    Array.from(selector.options).forEach(option => {
        const show = futureShows.find(item => item.id === option.value);
        const hasNamedMatchSlot = match => {
            if (!match || typeof match !== 'object') return false;
            return ['fighter1', 'fighter2', 'f1Name', 'f2Name', 'slot1Name', 'slot2Name', 'winnerName', 'loserName', 'winner', 'loser']
                .some(key => typeof match[key] === 'string' && match[key].trim() !== '');
        };
        const hasStoredDrafts = show && [ `wwe_draft_${show.id}`, `wwe_matches_${show.id}` ].some(storageKey => {
            try {
                const savedMatches = JSON.parse(localStorage.getItem(storageKey) || '{}');
                return savedMatches && typeof savedMatches === 'object' && !Array.isArray(savedMatches) &&
                    Object.values(savedMatches).some(hasNamedMatchSlot);
            } catch (error) {
                console.warn(`Unable to read match data for ${show.name || show.id} while updating the show selector.`, error);
                return false;
            }
        });
        const hasDraftedFights = Boolean(
            (Array.isArray(show?.matches) && show.matches.some(hasNamedMatchSlot)) || hasStoredDrafts
        );
        const isFinalized = finalizedIds.has(option.value);
        option.classList.toggle('dropdown-card-finalized', isFinalized);
        option.style.color = isFinalized ? '#00ff7f' : hasDraftedFights ? '#d97706' : '';
        option.style.fontWeight = isFinalized || hasDraftedFights ? 'bold' : '';
    });
}

function setShowCompleted(showId, value, finalizedAt = '') {
    refreshShowStateFromStorage();
    const show = futureShows.find(s => s.id === showId);
    if (!show) return;
    show.completed = !!value;
    if (value) {
        const timestamp = finalizedAt || new Date().toISOString();
        show.completedAt = timestamp;
        show.finalizedAt = timestamp;
    } else {
        delete show.completedAt;
        delete show.finalizedAt;
    }
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    updateMatchSwapSelectorsState();
}

window.restartCurrentShow = function() {
    if (!activeShowId) return;
    customConfirm('Restart this completed fight card? This will clear the current archived layout and allow you to rebook the show from scratch.', function(result) {
        if (!result) return;
        setShowCompleted(activeShowId, false);
        const storageKey = getActiveShowMatchesStorageKey();
        if (storageKey) localStorage.removeItem(storageKey);
        localStorage.removeItem('wwe_draft_' + activeShowId);
        location.reload();
    }, 'Restart Card');
};

function applyCompletedShowVisuals() {
    updateMatchSwapSelectorsState();
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
        } else if (el.classList && el.classList.contains('performance-bonus-select')) {
            el.disabled = false;
            el.style.pointerEvents = 'auto';
        } else if (el.classList && el.classList.contains('randomizer-btn')) {
            el.style.display = 'none';
        } else {
            el.disabled = true;
        }
    });
    updateFinalizedShowDropdownStyles();
}

// Announcer system removed

// Announcer recap function removed

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

// applyAnnouncerState and applyBettingState removed


async function refreshFightCardPortraits() {
    try {
        refreshFightersFromStorage(true);
        await hydrateFighterPhotos();
        document.querySelectorAll('.fighter-search-input').forEach(input => {
            const slot = input.closest('.fighter-slot');
            const row = input.closest('.match-row');
            if (!slot || !row) return;
            if (row.dataset.rematchPending === 'true') return;

            const slotType = slot.id.endsWith('-slot1') ? 'slot1' : 'slot2';
            const fighterId = input.getAttribute('data-fighter-id');
            const currentName = input.value.trim();
            const fighter = fighters.find(f =>
                f.name.trim().toLowerCase() === currentName.toLowerCase()
            ) || (fighterId ? fighters.find(f => f.id === fighterId) : null);
            const avatar = slot.querySelector('.avatar-box');
            if (!avatar) return;

            if (fighter) {
                const liveImage = typeof fighter.image === 'string' ? fighter.image.trim() : '';
                const photo = liveImage || getEffectivePhotoFor(fighter);
                avatar.innerHTML = photo ? `<img src="${photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : (fighter.name || 'F').charAt(0);
                avatar.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
                applyStreakPortraitClass(slot.querySelector('.avatar-frame'), fighter);
                if (fighter.id) input.setAttribute('data-fighter-id', fighter.id);
                updateFighterRecordDisplay(row.id, slotType, fighter);
            } else {
                avatar.innerHTML = '👤';
                avatar.style.cssText = "width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; cursor:pointer; overflow:hidden;";
                applyStreakPortraitClass(slot.querySelector('.avatar-frame'), null);
            }
        });
    } catch (err) {
        console.warn('Failed to refresh fight-card portraits', err);
    }
}

async function refreshFightCardView() {
    refreshFightersFromStorage(true);
    removeRetiredFightersFromActiveCard();
    await refreshFightCardPortraits();
}

function updateFighterScheduleLocator(selectedName) {
    const searchInput = document.getElementById('fighterScheduleLocatorInput');
    const results = document.getElementById('fighterScheduleResults');
    if (!results) return;

    const fighterName = (typeof selectedName === 'string' ? selectedName : searchInput?.value || '').trim();
    if (!fighterName) {
        results.textContent = '';
        return;
    }

    refreshShowStateFromStorage();
    const finalizedShowIds = new Set(futureShows.filter(show => show.completed).map(show => show.id));
    const normalizedName = fighterName.toLocaleLowerCase();
    const scheduledCards = new Set();

    futureShows.forEach(show => {
        if (!show.id || finalizedShowIds.has(show.id)) return;

        let cardEntries = [];
        if (show.id === activeShowId) {
            cardEntries = Array.from(document.querySelectorAll('.match-row')).map(row => ({
                f1Name: row.querySelector('.fighter-slot[id$="-slot1"] .fighter-search-input')?.value || '',
                f2Name: row.querySelector('.fighter-slot[id$="-slot2"] .fighter-search-input')?.value || ''
            }));
        } else {
            try {
                cardEntries = Object.values(JSON.parse(localStorage.getItem(`wwe_draft_${show.id}`)) || {});
            } catch (error) {
                cardEntries = [];
            }
        }

        const isScheduled = cardEntries.some(entry => {
            const fighterA = (entry?.f1Name || '').trim().toLocaleLowerCase();
            const fighterB = (entry?.f2Name || '').trim().toLocaleLowerCase();
            return fighterA === normalizedName || fighterB === normalizedName;
        });

        if (isScheduled) {
            const numberMatch = (show.name || '').match(/^FIGHT CARD\s*(\d+)$/i);
            scheduledCards.add(numberMatch ? `Fight Card ${Number(numberMatch[1])}` : (show.name || 'Unnamed Card'));
        }
    });

    results.textContent = scheduledCards.size
        ? `${fighterName} is currently scheduled to fight on: ${Array.from(scheduledCards).join(', ')}`
        : `No active bookings found for ${fighterName}`;
}

function getBookingConflictStorageKey(showId, matchRowId) {
    return `booking_conflict_${showId}_${matchRowId}`;
}

function renderBookingConflictWarning(matchRow, conflicts) {
    const warningId = `${matchRow.id}-booking-conflict-warning`;
    let warning = document.getElementById(warningId);
    if (!conflicts.length) {
        warning?.remove();
        sessionStorage.removeItem(getBookingConflictStorageKey(activeShowId, matchRow.id));
        return;
    }

    if (!warning) {
        warning = document.createElement('div');
        warning.id = warningId;
        warning.className = 'booking-conflict-warning';
        warning.setAttribute('role', 'alert');
        matchRow.appendChild(warning);
    }
    const cardNames = conflicts.map(conflict => conflict.cardName);
    warning.textContent = `This matchup is already scheduled on ${cardNames.join(', ')}`;
    sessionStorage.setItem(getBookingConflictStorageKey(activeShowId, matchRow.id), JSON.stringify({
        showId: activeShowId,
        conflicts
    }));
}

function checkFighterScheduleConflict(matchRow) {
    if (!matchRow || !matchRow.id) return;
    const styleId = 'booking-conflict-warning-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = '.booking-conflict-warning{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #fca5a5;border-left:4px solid #dc2626;border-radius:8px;background:#fef2f2;color:#991b1b;font-size:.78rem;font-weight:700;line-height:1.45;}';
        document.head.appendChild(style);
    }

    refreshShowStateFromStorage();
    const currentShow = futureShows.find(show => show.id === activeShowId);
    const finalizedShowIds = getFinalizedShowIds();
    if (!currentShow || finalizedShowIds.has(activeShowId)) {
        renderBookingConflictWarning(matchRow, []);
        return;
    }

    const slot1Input = matchRow.querySelector('.fighter-slot[id$="-slot1"] .fighter-search-input');
    const slot2Input = matchRow.querySelector('.fighter-slot[id$="-slot2"] .fighter-search-input');
    const currentA = normalizeLookupKey(slot1Input?.value || '');
    const currentB = normalizeLookupKey(slot2Input?.value || '');
    if (!currentA || !currentB) {
        renderBookingConflictWarning(matchRow, []);
        return;
    }

    const conflicts = new Map();
    const matchesCurrentPair = (fighterA, fighterB) => {
        const otherA = normalizeLookupKey(fighterA || '');
        const otherB = normalizeLookupKey(fighterB || '');
        if (!otherA || !otherB) return false;
        return (currentA === otherA && currentB === otherB) ||
            (currentA === otherB && currentB === otherA);
    };
    const recordConflict = (entries, show) => {
        const isExactPairScheduled = entries.some(entry =>
            entry && matchesCurrentPair(
                entry.f1Name || entry.slot1Name || entry.winnerName || entry.winner,
                entry.f2Name || entry.slot2Name || entry.loserName || entry.loser
            )
        );
        if (!isExactPairScheduled) return;
        const numberMatch = String(show.name || '').match(/^FIGHT\s*CARD\s*(\d+)$/i);
        const cardName = numberMatch ? `Fight Card ${Number(numberMatch[1])}` : (show.name || 'Unnamed Card');
        conflicts.set(show.id, { cardName });
    };

    futureShows.forEach(show => {
        if (!show?.id || finalizedShowIds.has(show.id)) return;
        if (show.id === activeShowId) {
            const entries = [];
            document.querySelectorAll('.match-row').forEach(otherRow => {
                if (otherRow === matchRow) return;
                entries.push({
                    f1Name: otherRow.querySelector('.fighter-slot[id$="-slot1"] .fighter-search-input')?.value || '',
                    f2Name: otherRow.querySelector('.fighter-slot[id$="-slot2"] .fighter-search-input')?.value || ''
                });
            });
            recordConflict(entries, show);
            return;
        }

        const entries = new Map();
        [ `wwe_draft_${show.id}`, `wwe_matches_${show.id}` ].forEach(storageKey => {
            try {
                const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
                if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
                    Object.values(stored).forEach(entry => {
                        if (!entry || typeof entry !== 'object') return;
                        const nameA = entry.f1Name || entry.slot1Name || entry.winnerName || entry.winner || '';
                        const nameB = entry.f2Name || entry.slot2Name || entry.loserName || entry.loser || '';
                        if (matchesCurrentPair(nameA, nameB)) {
                            entries.set(`${normalizeLookupKey(nameA)}|${normalizeLookupKey(nameB)}`, { f1Name: nameA, f2Name: nameB });
                        }
                    });
                }
            } catch (error) {
                console.warn(`Unable to read scheduled matches for ${show.name || show.id}.`, error);
            }
        });
        recordConflict(Array.from(entries.values()), show);
    });

    renderBookingConflictWarning(matchRow, Array.from(conflicts.values()));
}

function buildShowSchedulerHeader() {
    if (document.getElementById('schedulerControlRow')) return;
    
    const headerRow = document.createElement('div');
    headerRow.id = 'schedulerControlRow';
    headerRow.style.cssText = 'background:#f0f4f8; border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; flex-wrap:wrap; gap:12px; align-items:center;';
    
    const select = document.createElement('select');
    select.id = 'activeShowSelector';
    select.style.cssText = 'padding:6px 10px; border:1px solid #cbd5e1; border-radius:4px; background:white; font-weight:bold; cursor:pointer;';
    futureShows.forEach(show => {
        const option = document.createElement('option');
        option.value = show.id;
        option.textContent = show.name;
        if (show.id === activeShowId) option.selected = true;
        select.appendChild(option);
    });
    select.addEventListener('change', function() {
        window.switchActiveShowCard(this.value);
    });
    headerRow.appendChild(select);
    updateFinalizedShowDropdownStyles();
    
    // Show name input field
    const currentShow = futureShows.find(s => s.id === activeShowId);
    const nameInput = document.createElement('input');
    nameInput.id = 'eventNameInput';
    nameInput.type = 'text';
    nameInput.value = currentShow ? currentShow.name : 'Unnamed Show';
    nameInput.placeholder = 'Show name...';
    nameInput.style.cssText = 'padding:6px 10px; border:1px solid #cbd5e1; border-radius:4px; background:white; font-weight:bold; cursor:text; min-width:150px;';
    nameInput.addEventListener('blur', function() {
        if (this.value.trim() && currentShow) {
            currentShow.name = this.value.trim();
            localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
            select.options[select.selectedIndex].textContent = currentShow.name;
            updateFinalizeButtonState();
        } else if (currentShow) {
            this.value = currentShow.name;
        }
    });
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') this.blur();
    });
    headerRow.appendChild(nameInput);

    const showTierBadge = document.createElement('span');
    showTierBadge.id = 'showTierBadge';
    showTierBadge.className = 'show-tier-badge';
    showTierBadge.setAttribute('aria-live', 'polite');
    headerRow.appendChild(showTierBadge);

    const showTierSelector = document.createElement('select');
    showTierSelector.id = 'showTierSelector';
    showTierSelector.setAttribute('aria-label', 'Show tier override');
    showTierSelector.style.cssText = 'padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; background:white; font-weight:bold; cursor:pointer;';
    showTierSelector.innerHTML = '<option value="fight_night">🥊 FIGHT NIGHT</option><option value="ppv">🏆 MAJOR PPV</option>';
    showTierSelector.addEventListener('change', function() {
        const selectedShow = futureShows.find(show => show.id === activeShowId);
        if (!selectedShow) return;
        selectedShow.tier = this.value;
        selectedShow.tierOverride = true;
        localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
        updateCurrentShowTierPresentation();
    });
    headerRow.appendChild(showTierSelector);
    
    // Bulk add shows
    const bulkDiv = document.createElement('div');
    bulkDiv.style.cssText = 'display:flex; gap:8px; align-items:center;';
    
    const bulkLabel = document.createElement('label');
    bulkLabel.textContent = 'Add:';
    bulkLabel.style.cssText = 'font-weight:bold; font-size:0.9rem; color:#0f172a;';
    bulkDiv.appendChild(bulkLabel);
    
    const bulkInput = document.createElement('input');
    bulkInput.type = 'number';
    bulkInput.min = '1';
    bulkInput.value = '1';
    bulkInput.placeholder = '1';
    bulkInput.style.cssText = 'padding:6px 8px; border:1px solid #cbd5e1; border-radius:4px; background:white; width:50px; font-weight:bold; cursor:text;';
    bulkDiv.appendChild(bulkInput);
    
    const bulkLabel2 = document.createElement('label');
    bulkLabel2.textContent = 'shows';
    bulkLabel2.style.cssText = 'font-weight:bold; font-size:0.9rem; color:#0f172a;';
    bulkDiv.appendChild(bulkLabel2);
    
    const bulkBtn = document.createElement('button');
    bulkBtn.textContent = 'BULK ADD';
    bulkBtn.style.cssText = 'background:#06b6d4; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
    bulkBtn.addEventListener('click', function() {
        const count = parseInt(bulkInput.value) || 1;
        if (count < 1) {
            customAlert('Please enter a number greater than 0.', 'Bulk Add');
            return;
        }
        window.bulkAddFutureShows(count);
    });
    bulkDiv.appendChild(bulkBtn);
    headerRow.appendChild(bulkDiv);
    
    const editBtn = document.createElement('button');
    editBtn.textContent = 'EDIT';
    editBtn.style.cssText = 'background:#4b5563; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
    editBtn.addEventListener('click', window.editCurrentShowName);
    headerRow.appendChild(editBtn);

    const locatorTemplate = document.getElementById('fighterScheduleLocatorTemplate');
    const locatorFragment = locatorTemplate?.content.cloneNode(true);
    if (locatorFragment) {
        const rosterOptions = locatorFragment.querySelector('#fighterRosterOptions');
        getFighterList().forEach(fighter => {
            if (!fighter?.name) return;
            const option = document.createElement('option');
            option.value = fighter.name;
            rosterOptions.appendChild(option);
        });
        const locatorInput = locatorFragment.querySelector('#fighterScheduleLocatorInput');
        locatorInput.addEventListener('input', () => updateFighterScheduleLocator(locatorInput.value));
        locatorInput.addEventListener('change', () => updateFighterScheduleLocator(locatorInput.value));
        headerRow.appendChild(locatorFragment);
    }
    const randomBtn = document.createElement('button');
    randomBtn.textContent = 'RANDOMIZE ALL';
    randomBtn.style.cssText = 'background:#7c3aed; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
    randomBtn.addEventListener('click', window.randomizeEntireShow);
    headerRow.appendChild(randomBtn);

    const smartBookButtonTemplate = document.getElementById('smartBookCardButtonTemplate');
    const smartBookBtn = smartBookButtonTemplate?.content.firstElementChild?.cloneNode(true) ||
        document.createElement('button');
    smartBookBtn.type = 'button';
    smartBookBtn.className = 'smart-book-card-button';
    smartBookBtn.textContent = '🧠 SMART BOOK CARD';
    smartBookBtn.title = 'Book open-weight matchups using gender divisions, rankings, records, streaks, titles, and show tier';
    smartBookBtn.addEventListener('click', window.smartBookFightCard);
    headerRow.appendChild(smartBookBtn);
    
    const addBtn = document.createElement('button');
    addBtn.textContent = 'ADD SHOW';
    addBtn.style.cssText = 'background:#0284c7; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
    addBtn.addEventListener('click', window.createNewFutureShow);
    headerRow.appendChild(addBtn);
    
    const delBtn = document.createElement('button');
    delBtn.textContent = 'DELETE';
    delBtn.style.cssText = 'background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
    delBtn.addEventListener('click', window.deleteCurrentFutureShow);
    headerRow.appendChild(delBtn);
    
    // Create a section wrapper and insert it at the top of main, after the archive panel
    const section = document.createElement('section');
    section.style.cssText = 'background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #bae6fd; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
    section.appendChild(headerRow);
    
    const main = document.querySelector('main');
    const firstSection = main.querySelector('section');
    if (main && firstSection) {
        firstSection.parentNode.insertBefore(section, firstSection.nextSibling);
    }
    updateCurrentShowTierPresentation();
    updateFighterScheduleLocator();
}

function insertCompletedShowNotice() {
    if (!isShowCompleted(activeShowId)) return;
    const headerRow = document.getElementById('schedulerControlRow');
    if (!headerRow) return;
    if (document.getElementById('completedShowNotice')) return;

    const notice = document.createElement('div');
    notice.id = 'completedShowNotice';
    notice.style.cssText = 'background:#f1f5f9; border:1px solid #cbd5e1; border-radius:12px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:10px; color:#0f172a;';
    notice.innerHTML = `<div style="display:flex; align-items:center; gap:10px; font-size:0.9rem;"><strong style="color:#094067;">This show is completed and archived.</strong><span style="color:#475569;">Use the top controls to restart or edit the show name.</span></div><div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;"><button onclick="unfinalizeCurrentCard()" style="background:#f97316; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.75rem; text-transform:uppercase;">UNFINALIZE CARD</button><button onclick="restartCurrentShow()" style="background:#ef4444; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.75rem; text-transform:uppercase;">Restart Event</button></div>`;
    headerRow.parentNode.insertBefore(notice, headerRow.nextSibling);
}

async function triggerInitialPortraitHydration() {
    if (portraitHydrationOnLoadRan) return;
    portraitHydrationOnLoadRan = true;
    await hydrateFighterPhotos();
}

async function triggerSelectedFighterPortraitHydration() {
    if (portraitHydrationOnChangeRan) return;
    portraitHydrationOnChangeRan = true;
    await hydrateFighterPhotos();
}

document.addEventListener('DOMContentLoaded', async () => {
    refreshFightersFromStorage();
    await triggerInitialPortraitHydration();
    const tiers = ['mainEventContainer', 'coMainContainer', 'mainCardContainer', 'prelimsContainer', 'earlyPrelimsContainer'];
    tiers.forEach(id => {
        let box = document.getElementById(id);
        if (!box) return;
        let num = (id.includes('mainEvent') || id.includes('coMain')) ? 1 : 4;
        renderCardRows(box, num, id, id.includes('mainEvent'));
    });
    populateMatchSwapSelectors();
    restoreCurrentCardDraft();
    refreshFightCardView().catch(error => console.warn('Unable to restore fight-card portraits.', error));
    buildShowSchedulerHeader();
    buildModalContainer();
    insertCompletedShowNotice();
    applyCompletedShowVisuals();
    updateFinalizeButtonState();
    updateRandomizerState();
    const eventNameInput = getEventNameInput();
    if (eventNameInput) {
        eventNameInput.addEventListener('input', updateFinalizeButtonState);
    }
    try {
        populateVoiceList();
        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    } catch (e) {}

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('fighter-search-input')) {
            updateFighterScheduleLocator();
            const matchRow = e.target.closest('.match-row');
            if (matchRow) {
                const id = matchRow.id;
                clearMatchRowWarningsForInput(id);
                clearDuplicateApprovalForChangedInput(id);
                checkFighterScheduleConflict(matchRow);
                const typedName = e.target.value.trim().toLowerCase();
                const exactFighter = fighters.find(f => f.name.toLowerCase() === typedName);
                e.target.setAttribute('data-fighter-id', exactFighter ? exactFighter.id : '');
                updateTaleOfTheTapeButton(id);
                if (matchRow.dataset.validationBatch === 'true') return;
                delete matchRow.dataset.smartBookedTitle;
                const slot1Input = document.getElementById(`${id}-slot1`)?.querySelector('.fighter-search-input');
                const slot2Input = document.getElementById(`${id}-slot2`)?.querySelector('.fighter-search-input');
                const slotType = e.target.closest('.fighter-slot')?.id?.replace(`${id}-`, '') || '';
                const hasEmptyFighter = !slot1Input?.value.trim() || !slot2Input?.value.trim();
                const titleCheckbox = document.getElementById(`${id}-title-check`);

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
                        if (badge) {
                            badge.style.display = 'none';
                            badge.classList.remove('winner-check-badge');
                        }
                        if (avatar) avatar.classList.remove('ufc-winner-border');
                        if (label) label.style.display = 'none';
                        updateFighterRecordDisplay(id, slotType, null);

                        if (matchRow) {
                            resetMatchRowRematchState(matchRow.id);
                        }
                    }
                }

                refreshTitleFightState(id);
                if (hasEmptyFighter && (!titleCheckbox || !titleCheckbox.checked)) {
                    matchRow.style.border = '1px solid #bae6fd';
                    matchRow.style.background = '#ffffff';
                    if (id.includes('mainEventContainer') || id.includes('coMainContainer')) {
                        matchRow.style.border = '1px solid #fca5a5';
                        matchRow.style.background = 'linear-gradient(to right, #ffffff, #fff5f5, #ffffff)';
                    }
                } else if (titleCheckbox && titleCheckbox.checked) {
                    applyMatchRowTitleGlow(matchRow);
                } else {
                    const accepted = getMatchRowAcceptedRematch(id);
                    const currentF1Id = slot1Input?.getAttribute('data-fighter-id') || '';
                    const currentF2Id = slot2Input?.getAttribute('data-fighter-id') || '';
                    if (accepted && !areMatchRowRematchPairsEqual(currentF1Id, currentF2Id, accepted.fighter1Id, accepted.fighter2Id)) {
                        resetMatchRowRematchState(id);
                    }
                }
                if (!hasEmptyFighter) recheckMatchValidation(id, slotType);
            }
            saveCurrentCardDraft();
        }
    });

    document.addEventListener('change', async (e) => {
        const target = e.target;
        if (!target || !target.classList || !target.classList.contains('fighter-search-input')) {
            if (target && target.closest && target.closest('.match-row')) {
                saveCurrentCardDraft();
            }
            return;
        }

        const selectedValue = (target.value || '').trim();
        if (!selectedValue) return;

        const associatedFighter = getFighterByIdOrName(selectedValue);
        if (!associatedFighter) return;
        if (target.getAttribute('data-fighter-id') !== associatedFighter.id) return;

        hydrateSelectedFighterPortrait(target).catch(() => {});
        saveCurrentCardDraft();
    });

    window.addEventListener('pagehide', (event) => {
        if (!window.skipDraftSaveOnUnload && !window.wweUniverseResetInProgress) saveCurrentCardDraft(event);
    });
    restoreSessionWarnings();
    const hasUnsubmittedMatchLoggingState = () => Array.from(document.querySelectorAll('.match-row')).some(matchRow => {
        if (completedMatches[matchRow.id]) return false;
        if (document.activeElement && matchRow.contains(document.activeElement)) return true;
        if (matchRow.dataset.rematchPending === 'true') return true;
        const logButton = document.getElementById(`${matchRow.id}-log-btn`);
        if (!logButton) return false;
        const slot1 = document.getElementById(`${matchRow.id}-slot1`)?.querySelector('.fighter-search-input');
        const slot2 = document.getElementById(`${matchRow.id}-slot2`)?.querySelector('.fighter-search-input');
        const winner = document.getElementById(`${matchRow.id}-winner-select`);
        const method = document.getElementById(`${matchRow.id}-method-select`);
        return !!(slot1?.value.trim() || slot2?.value.trim() || winner?.value || method?.value);
    });
    window.addEventListener('focus', () => {
        if (hasUnsubmittedMatchLoggingState()) return;
        restoreSessionWarnings();
        refreshFightCardView().catch(error => console.warn('Unable to refresh fight-card portraits on focus.', error));
    });
    window.addEventListener('storage', event => {
        if (event.key !== 'wwe_fighters') return;
        refreshFightCardView().catch(error => console.warn('Unable to refresh fight-card portraits after roster storage changed.', error));
    });
    window.addEventListener('wwe_fighters:changed', () => {
        refreshFightCardView().catch(error => console.warn('Unable to refresh fight-card portraits after roster update.', error));
    });
    window.addEventListener('universeTitleRules:changed', () => {
        refreshFightersFromStorage(true);
        document.querySelectorAll('.match-row').forEach(matchRow => {
            ['slot1', 'slot2'].forEach(slotType => {
                const input = matchRow.querySelector(`#${matchRow.id}-${slotType} .fighter-search-input`);
                const fighter = input
                    ? getFighterByIdOrName(input.getAttribute('data-fighter-id') || input.value.trim())
                    : null;
                updateFighterRecordDisplay(matchRow.id, slotType, fighter);
            });
            refreshTitleFightState(matchRow.id);
        });
    });
    const refreshFightCardViewAfterNavigation = reason => {
        window.requestAnimationFrame(() => {
            refreshFightCardView().catch(error => console.warn(`Unable to refresh fight-card portraits ${reason}.`, error));
        });
    };
    window.addEventListener('pageshow', () => {
        refreshFightCardViewAfterNavigation('after page restore');
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !hasUnsubmittedMatchLoggingState()) {
            refreshFightCardView().catch(error => console.warn('Unable to refresh fight-card portraits after tab switch.', error));
        }
    });
    document.addEventListener('click', event => {
        const link = event.target.closest('.navbar-sidebar-left a[href]');
        if (!link) return;
        const targetUrl = new URL(link.href, window.location.href);
        const targetPath = targetUrl.pathname.toLowerCase().replace(/\/+$/, '');
        if (targetPath === '' || targetPath.endsWith('/index.html')) {
            refreshFightCardViewAfterNavigation('during navigation');
        }
    });
    refreshFightersFromStorage(true);
    removeRetiredFightersFromActiveCard();
});



// fighter schedule search UI removed; related functions omitted

// suggestion helpers removed

window.switchActiveShowCard = function(showId) {
    localStorage.setItem('wwe_active_show_id', showId);
    location.reload();
};



window.createNewFutureShow = function() {
    const newShow = createScheduledShow(getNextShowNumber());
    futureShows.push(newShow);
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    localStorage.setItem('wwe_active_show_id', newShow.id);
    
    customAlert(`Success! "${newShow.name}" added to your future show calendar.`, 'Event Created');
    location.reload();
};

window.deleteCurrentFutureShow = function() {
    const selector = document.getElementById('activeShowSelector');
    const showId = selector ? selector.value : activeShowId;
    if (!showId) return customAlert('No show selected to delete.', 'Delete Show');

    const show = futureShows.find(s => s.id === showId);
    if (!show) return customAlert('Selected show not found.', 'Delete Show');

    customConfirm(`Delete "${show.name}"? This will remove the show from your schedule and clear its draft and match data for this show. This cannot be undone. Continue?`, function(result) {
        if (!result) return;
        // remove from array
        futureShows = futureShows.filter(s => s.id !== showId);
        localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));

        // clear associated storage keys
        try { localStorage.removeItem(`wwe_matches_${showId}`); } catch(e) {}
        try { localStorage.removeItem(`wwe_draft_${showId}`); } catch(e) {}

        // if deleted was active, pick a new active show or create a default
        if (activeShowId === showId) {
            if (futureShows.length > 0) {
                activeShowId = futureShows[0].id;
                localStorage.setItem('wwe_active_show_id', activeShowId);
            } else {
                const newShow = createScheduledShow(getNextShowNumber());
                futureShows.push(newShow);
                localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
                activeShowId = newShow.id;
                localStorage.setItem('wwe_active_show_id', activeShowId);
            }
        }

        customAlert(`Deleted "${show.name}".`, 'Show Deleted');
        location.reload();
    }, 'Delete Show');
};

window.bulkCreateFutureShows = function() {
    const countEl = document.getElementById('bulkShowCount');
    if (!countEl) return alert('Bulk create control not found.');
    const count = Math.max(0, parseInt(countEl.value, 10) || 0);
    if (!count) return alert('Enter a number greater than zero.');
    appendScheduledShows(count);
    customAlert(`Added ${count} shows to your schedule.`, 'Bulk Shows Created');
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

window.bulkAddFutureShows = function(count) {
    if (!count || count < 1) {
        customAlert('Please enter a number greater than 0.', 'Bulk Add Shows');
        return;
    }

    const startNumber = appendScheduledShows(count);
    const firstShowName = futureShows.find(show => getShowNumber(show) === startNumber)?.name;
    const lastShowName = futureShows.find(show => getShowNumber(show) === startNumber + count - 1)?.name;
    customAlert(`Added ${count} show${count === 1 ? '' : 's'}! (${firstShowName} - ${lastShowName})`, 'Bulk Shows Added');
    location.reload();
};

function getMatchTimerElapsedMs(state) {
    if (!state) return 0;
    return Math.max(0, Number(state.elapsedMs) || 0) +
        (state.startedAt ? Math.max(0, Date.now() - state.startedAt) : 0);
}

function formatMatchTimerDisplay(elapsedMs) {
    const totalSeconds = Math.floor(Math.max(0, Number(elapsedMs) || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function parseMatchFightTime(value) {
    const match = /^(\d+):([0-5]\d)$/.exec(String(value || '').trim());
    if (!match) return 0;
    return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}

function getMatchFightTime(state) {
    const elapsedMs = getMatchTimerElapsedMs(state);
    return Math.floor(elapsedMs / 1000) > 0 ? formatMatchTimerDisplay(elapsedMs) : '';
}

function updateMatchTimerDisplay(matchId) {
    const display = document.getElementById(`${matchId}-timer-display`);
    if (!display) return;
    display.textContent = formatMatchTimerDisplay(getMatchTimerElapsedMs(matchTimerStates.get(matchId)));
}

function ensureMatchTimerInterval(matchId, state) {
    if (!state || !state.startedAt || state.intervalId) return;
    state.intervalId = window.setInterval(() => updateMatchTimerDisplay(matchId), 1000);
}

function clearMatchTimerIntervals() {
    matchTimerStates.forEach(state => {
        if (state.intervalId) window.clearInterval(state.intervalId);
        state.intervalId = null;
    });
}

function restoreMatchTimerFromDraft(matchId, draft) {
    const priorState = matchTimerStates.get(matchId);
    if (priorState?.intervalId) window.clearInterval(priorState.intervalId);
    const state = {
        elapsedMs: Math.max(0, Number(draft?.fightTimerElapsedMs) || 0),
        startedAt: Math.max(0, Number(draft?.fightTimerStartedAt) || 0),
        intervalId: null
    };
    matchTimerStates.set(matchId, state);
    updateMatchTimerDisplay(matchId);
    ensureMatchTimerInterval(matchId, state);
}

function restoreMatchTimerFromSaved(matchId, fightTime) {
    const priorState = matchTimerStates.get(matchId);
    if (priorState?.intervalId) window.clearInterval(priorState.intervalId);
    const state = {
        elapsedMs: parseMatchFightTime(fightTime),
        startedAt: 0,
        intervalId: null
    };
    matchTimerStates.set(matchId, state);
    updateMatchTimerDisplay(matchId);
}

window.startMatchTimer = function(matchId) {
    if (!document.getElementById(matchId) || completedMatches[matchId] || isShowCompleted(activeShowId)) return;
    const state = matchTimerStates.get(matchId) || { elapsedMs: 0, startedAt: 0, intervalId: null };
    if (!state.startedAt) state.startedAt = Date.now();
    matchTimerStates.set(matchId, state);
    ensureMatchTimerInterval(matchId, state);
    updateMatchTimerDisplay(matchId);
    saveCurrentCardDraft();
};

window.stopMatchTimer = function(matchId) {
    const state = matchTimerStates.get(matchId) || { elapsedMs: 0, startedAt: 0, intervalId: null };
    if (state.startedAt) {
        state.elapsedMs = getMatchTimerElapsedMs(state);
        state.startedAt = 0;
    }
    if (state.intervalId) window.clearInterval(state.intervalId);
    state.intervalId = null;
    matchTimerStates.set(matchId, state);
    updateMatchTimerDisplay(matchId);
    if (typeof saveCurrentCardDraft === 'function') saveCurrentCardDraft();
    return getMatchFightTime(state);
};

window.resetMatchTimer = function(matchId) {
    if (!document.getElementById(matchId) || completedMatches[matchId] || isShowCompleted(activeShowId)) return;
    const state = matchTimerStates.get(matchId);
    if (state?.intervalId) window.clearInterval(state.intervalId);
    matchTimerStates.set(matchId, { elapsedMs: 0, startedAt: 0, intervalId: null });
    updateMatchTimerDisplay(matchId);
    saveCurrentCardDraft();
};

function renderCardRows(box, num, tierId, isMain) {
    const tierLabels = {
        mainEventContainer: 'Main Event',
        coMainContainer: 'Co-Main Event',
        mainCardContainer: 'Main Card',
        prelimsContainer: 'Prelims',
        earlyPrelimsContainer: 'Early Prelims'
    };
    for (let i = 1; i <= num; i++) {
        const uId = `${tierId}-m${i}`;
        // If the row already exists, skip creating it so bulk-add can safely call renderCardRows
        if (document.getElementById(uId)) continue;
        const matchRow = document.createElement('div');
        matchRow.className = 'match-row';
        matchRow.id = uId;
        matchRow.dataset.matchLabel = `${tierLabels[tierId] || tierId} ${(tierId === 'mainEventContainer' || tierId === 'coMainContainer') ? '' : i}`.trim();
        matchRow.dataset.isMain = isMain ? 'true' : 'false';
        matchRow.style.cssText = "background:#fff; border:1px solid #bae6fd; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px; margin-bottom:12px; position:relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width:100%; box-sizing:border-box;";
        if (isMain) { matchRow.style.background = "linear-gradient(to right, #fff, #fff5f5, #fff)"; matchRow.style.borderColor = "#fca5a5"; }

        matchRow.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px dashed #e2e8f0; padding-bottom:6px; font-size:0.65rem; font-weight:bold; color:#64748b;">
                <span>MATCH VARIANT <span id="${uId}-boss-fight-banner" class="boss-fight-banner" hidden>☠️ BOSS FIGHT • BOUNTY ACTIVE</span></span>
                <span class="short-notice-replacement-pill" hidden></span>
                <div style="display:flex; gap:4px; align-items:center;">
                    <button class="randomizer-btn" onclick="randomizeMatchup('${uId}')" style="background:#7c3aed; border:none; color:white; padding:3px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem; transition:0.2s;" title="Pick 2 random fighters of the same gender (open weight)">🎲 RANDOM</button>
                    <button class="randomizer-btn" onclick="randomizeMatchup('${uId}')" style="background:#a855f7; border:none; color:white; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.55rem; transition:0.2s;" title="Reroll">↻</button>
                    <div style="display:flex; gap:4px; background:#f1f5f9; padding:2px; border-radius:6px;">
                        <button onclick="changeMatchGender('${uId}', 'male')" id="${uId}-btn-male" style="background:#0369a1; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;">MALE</button>
                        <button onclick="changeMatchGender('${uId}', 'female')" id="${uId}-btn-female" style="background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;">FEMALE</button>
                    </div>
                </div>
            </div>
            <div class="rivalry-status-row" id="${uId}-rivalry-status-row" hidden>
                <span class="rivalry-match-badge" id="${uId}-rivalry-status"></span>
            </div>
            <div class="prospect-protection-status-row" id="${uId}-prospect-protection-row" hidden>
                <span class="prospect-protection-badge" id="${uId}-prospect-protection-badge"></span>
            </div>
            <div id="${uId}-booking-panel" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                
                <div class="fighter-slot" id="${uId}-slot1" data-gender="male" style="width:38%; display:flex; align-items:center; gap:8px; position:relative; transition: box-shadow 0.25s ease, transform 0.25s ease;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; position:relative;">
                        <div class="avatar-frame portrait-frame-base" style="position:relative; display:inline-block; overflow:visible; width:60px; height:60px;">
                            <span class="division-rank-badge" data-rank-fighter-id="" hidden></span>
                            <div class="avatar-box" style="width:60px; height:60px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; overflow:hidden; cursor:pointer;">👤</div>
                            <div class="win-badge" style="display:none;">✓</div>
                        </div>
                        <div class="win-method-label" style="display:none; font-size:0.65rem; font-weight:800; color:#16a34a; text-transform:uppercase; text-align:center; line-height:1; max-width:80px;">KO/TKO</div>
                    </div>
                    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
                        <div class="fighter-name-rank-row" style="display:flex; align-items:center; gap:5px; width:100%;">
                            <div class="dropdown-search-container" style="flex:1; min-width:0;">
                                <input type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" class="fighter-search-input" data-fighter-id="" placeholder="Type Fighter 1..." onfocus="triggerSearchFill('${uId}', 'slot1')" onkeyup="triggerSearchFill('${uId}', 'slot1')" style="width:100%; padding:6px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; font-weight:600;">
                                <div class="search-results-floating-panel" style="display:none;"></div>
                            </div>
                        </div>
                        <div id="${uId}-slot1-record" class="fighter-record" style="font-size:0.75rem; color:#475569; margin-top:4px; min-height:18px; width:100%;"></div>
                    </div>
                </div>

                <div class="vs-badge" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; width:20%;">
                    <span style="font-size:0.75rem; font-weight:900; background:#64748b; color:white; padding:4px 10px; border-radius:4px; letter-spacing:0.05em; ${isMain?'background:#dc2626;':''}">VS</span>
                    <button type="button" class="tale-of-the-tape-trigger" onclick="openTaleOfTheTape('${uId}')" disabled>📊 Tale of the Tape</button>
                    <button onclick="suggestOpponent('${uId}')" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:0.65rem; font-weight:bold;">💡 Suggest</button>
                </div>

                <div class="fighter-slot" id="${uId}-slot2" data-gender="male" style="width:38%; text-align:right; display:flex; flex-direction:row-reverse; align-items:center; gap:8px; position:relative; min-width:0; transition: box-shadow 0.25s ease, transform 0.25s ease;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; position:relative;">
                        <div class="avatar-frame portrait-frame-base" style="position:relative; display:inline-block; overflow:visible; width:60px; height:60px;">
                            <span class="division-rank-badge" data-rank-fighter-id="" hidden></span>
                            <div class="avatar-box" style="width:60px; height:60px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; overflow:hidden; cursor:pointer;">👤</div>
                            <div class="win-badge" style="display:none;">✓</div>
                        </div>
                        <div class="win-method-label" style="display:none; font-size:0.65rem; font-weight:800; color:#16a34a; text-transform:uppercase; text-align:center; line-height:1; max-width:80px;">KO/TKO</div>
                    </div>
                    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
                        <div class="fighter-name-rank-row" style="display:flex; align-items:center; gap:5px; width:100%;">
                            <div class="dropdown-search-container" style="flex:1; min-width:0;">
                                <input type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" class="fighter-search-input" data-fighter-id="" placeholder="Type Fighter 2..." onfocus="triggerSearchFill('${uId}', 'slot2')" onkeyup="triggerSearchFill('${uId}', 'slot2')" style="width:100%; padding:6px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; font-weight:600; text-align:right;">
                                <div class="search-results-floating-panel" style="display:none;"></div>
                            </div>
                        </div>
                        <div id="${uId}-slot2-record" class="fighter-record" style="font-size:0.75rem; color:#475569; margin-top:4px; min-height:18px; width:100%;"></div>
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
            <div class="controls-area" style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:4px; border-top:1px solid #f1f5f9; padding-top:8px;">
                <div style="width:70%; display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
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
                    <div id="${uId}-performance-bonus-controls" class="performance-bonus-controls" hidden>
                        <label for="${uId}-performance-bonus">🏅 Award Bonus</label>
                        <select id="${uId}-performance-bonus" class="performance-bonus-select" onchange="setMatchBonus('${uId}', this.value)">
                            <option value="">None</option>
                            <option value="FOTN">🏆 Fight of the Night (FOTN)</option>
                            <option value="POTN">💥 Performance of the Night (POTN)</option>
                        </select>
                        <span id="${uId}-performance-bonus-badge" class="performance-bonus-pill" hidden></span>
                    </div>
                    <span id="${uId}-upset-alert" class="upset-alert-badge" hidden></span>
                    <span id="${uId}-fast-track-alert" class="fast-track-alert-badge" hidden></span>
                    <span id="${uId}-boss-slain-alert" class="boss-slain-alert" hidden></span>
                    <div class="match-timer-widget" role="group" aria-label="Fight timer">
                        <span id="${uId}-timer-display" class="match-timer-display">00:00</span>
                        <button type="button" class="match-timer-button" onclick="startMatchTimer('${uId}')">▶ Start</button>
                        <button type="button" class="match-timer-button" onclick="stopMatchTimer('${uId}')">⏸ Stop</button>
                        <button type="button" class="match-timer-button match-timer-button--reset" onclick="resetMatchTimer('${uId}')">↺ Reset</button>
                    </div>
                </div>
                                <div style="width:30%; display:flex; justify-content:flex-end; gap:8px; font-size:0.7rem; font-weight:bold; color:#475569; align-items:center;">
                    <span id="${uId}-title-gate-warning" class="title-gate-warning" hidden></span>
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" id="${uId}-title-check" onchange="toggleTitleFight('${uId}', this)"> 🏆 TITLE / BELT MATCH</label>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <select id="${uId}-title-name-input" style="display:none; padding:6px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.65rem; font-weight:bold; width:180px; outline:none; background:white; color:#1e293b;"></select>
                        <div id="${uId}-title-defense-milestone" class="title-defense-milestone" hidden aria-live="polite"></div>
                    </div>
                    <label class="rematch-control"><input type="checkbox" data-rematch-indicator disabled aria-label="Automatic rematch indicator"><span class="rematch-label rematch-label--muted" id="${uId}-rematch-label">REMATCH</span><input type="hidden" min="1" value="1" id="${uId}-rematch-count"></label>
                </div>

            </div>`;
        box.appendChild(matchRow);
        updateTaleOfTheTapeButton(uId);
        restoreSessionRematchWarningForRow(uId);
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
        updateTaleOfTheTapeButton(uId);
    }
}

function populateMatchSwapSelectors() {
    const matchRows = Array.from(document.querySelectorAll('.match-row'));
    const refreshedControls = new Set();
    matchRows.forEach(row => {
        const section = row.parentElement?.closest('section');
        const heading = section?.querySelector('.tier-title');
        if (!heading) return;
        let label = heading.querySelector('.tier-title-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'tier-title-label';
            label.textContent = heading.textContent.trim();
            heading.replaceChildren(label);
            heading.style.display = 'flex';
            heading.style.alignItems = 'center';
            heading.style.justifyContent = 'space-between';
            heading.style.flexWrap = 'wrap';
            heading.style.gap = '8px';
        }
        let controls = heading.querySelector('.match-swap-controls');
        if (!controls) {
            controls = document.createElement('span');
            controls.className = 'match-swap-controls';
            controls.style.cssText = 'display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:6px;';
            heading.appendChild(controls);
        }
        if (!refreshedControls.has(controls)) {
            controls.replaceChildren();
            refreshedControls.add(controls);
        }

        const selector = document.createElement('select');
        selector.className = 'match-swap-select';
        selector.setAttribute('aria-label', `Swap ${row.dataset.matchLabel}`);
        selector.title = `Swap ${row.dataset.matchLabel} with another match slot`;
        selector.style.cssText = 'max-width:145px; padding:3px 5px; border:1px solid #cbd5e1; border-radius:5px; background:white; color:#334155; font-size:0.65rem; font-weight:bold;';
        selector.replaceChildren(new Option('⇄ Swap Match...', ''));
        matchRows.filter(otherRow => otherRow !== row).forEach(otherRow => {
            selector.add(new Option(otherRow.dataset.matchLabel || otherRow.id, otherRow.id));
        });
        selector.addEventListener('change', () => {
            const targetMatchId = selector.value;
            selector.value = '';
            if (targetMatchId) swapActiveShowMatches(row.id, targetMatchId);
        });
        controls.appendChild(selector);
    });
    updateMatchSwapSelectorsState();
}

function updateMatchSwapSelectorsState() {
    const isFinalized = isShowCompleted(activeShowId);
    document.querySelectorAll('.match-swap-select').forEach(selector => {
        selector.disabled = isFinalized;
        selector.title = isFinalized
            ? 'Unfinalize this card before swapping matches.'
            : `Swap ${selector.getAttribute('aria-label')?.replace(/^Swap /, '') || 'this match'} with another match slot`;
    });
}

function swapStoredMatchEntries(entries, firstId, secondId) {
    const firstExists = Object.prototype.hasOwnProperty.call(entries, firstId);
    const secondExists = Object.prototype.hasOwnProperty.call(entries, secondId);
    const firstEntry = entries[firstId];
    const secondEntry = entries[secondId];
    if (secondExists) entries[firstId] = secondEntry;
    else delete entries[firstId];
    if (firstExists) entries[secondId] = firstEntry;
    else delete entries[secondId];
}

function readMatchEntriesForSwap(storageKey) {
    const entries = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
        throw new Error(`Saved match data in ${storageKey} has an unexpected format.`);
    }
    return entries;
}

function swapActiveShowMatches(firstId, secondId) {
    if (!activeShowId || !document.getElementById(firstId) || !document.getElementById(secondId)) return;
    if (isShowCompleted(activeShowId)) {
        customAlert('Unfinalize this card before swapping matches.', 'Swap Match');
        return;
    }

    const draftStorageKey = getCurrentDraftStorageKey();
    const matchesStorageKey = getActiveShowMatchesStorageKey();
    if (!matchesStorageKey) {
        customAlert('Could not find the active show match data.', 'Swap Match');
        return;
    }

    try {
        saveCurrentCardDraft();
        const draftEntries = readMatchEntriesForSwap(draftStorageKey);
        const matchEntries = readMatchEntriesForSwap(matchesStorageKey);
        swapStoredMatchEntries(draftEntries, firstId, secondId);
        swapStoredMatchEntries(matchEntries, firstId, secondId);

        const previousDraft = localStorage.getItem(draftStorageKey);
        const previousMatches = localStorage.getItem(matchesStorageKey);
        try {
            localStorage.setItem(draftStorageKey, JSON.stringify(draftEntries));
            localStorage.setItem(matchesStorageKey, JSON.stringify(matchEntries));
        } catch (error) {
            try {
                if (previousDraft === null) localStorage.removeItem(draftStorageKey);
                else localStorage.setItem(draftStorageKey, previousDraft);
                if (previousMatches === null) localStorage.removeItem(matchesStorageKey);
                else localStorage.setItem(matchesStorageKey, previousMatches);
            } catch (rollbackError) {
                console.error('Unable to restore match data after a failed swap.', rollbackError);
            }
            throw error;
        }

        completedMatches = matchEntries;
        [firstId, secondId].forEach(matchId => {
            clearMatchRowWarningsForInput(matchId);
            sessionStorage.removeItem(getBookingConflictStorageKey(activeShowId, matchId));
        });
        rerenderActiveFightCard();
    } catch (error) {
        console.error('Unable to swap the selected match slots.', error);
        customAlert(error instanceof Error ? error.message : 'The match slots could not be swapped.', 'Swap Match');
    }
}

function rerenderActiveFightCard() {
    clearMatchTimerIntervals();
    matchTimerStates.clear();
    const tierIds = ['mainEventContainer', 'coMainContainer', 'mainCardContainer', 'prelimsContainer', 'earlyPrelimsContainer'];
    const rowsByTier = new Map(tierIds.map(id => [id, []]));
    document.querySelectorAll('.match-row').forEach(row => {
        const tierId = tierIds.find(id => row.id.startsWith(`${id}-m`));
        if (tierId) rowsByTier.get(tierId).push(row);
    });

    rowsByTier.forEach(rows => rows.forEach(row => row.remove()));
    tierIds.forEach(tierId => {
        const container = document.getElementById(tierId);
        const rows = rowsByTier.get(tierId);
        if (container && rows.length) {
            renderCardRows(container, rows.length, tierId, tierId === 'mainEventContainer');
        }
    });
    populateMatchSwapSelectors();
    restoreCurrentCardDraft();
    document.querySelectorAll('.match-row').forEach(row => updateRivalryIndicator(row.id));
    refreshFightCardView().catch(error => console.warn('Unable to refresh fight-card portraits after swapping matches.', error));
    applyCompletedShowVisuals();
    updateFinalizeButtonState();
    updateRandomizerState();
    updateFighterScheduleLocator();
}

window.triggerSearchFill = function(uId, slotType) {
    refreshFightersFromStorage();
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
    const matchingFighters = fighters.filter(f => f.retired !== true && f.gender === gender && f.name.toLowerCase().includes(filter));

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
            clearRematchWarningForInput(uId);
            input.value = f.name;
            clearDuplicateApprovalForChangedInput(uId);
            hydrateFighterPhotos().catch(() => {});
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
            checkFighterScheduleConflict(document.getElementById(uId));
            updateWinnerDropdown(uId);
            recheckMatchValidation(uId, slotType);
            refreshTitleFightState(uId);
            hydrateSelectedFighterPortrait(input).catch(() => {});
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
    clearRematchWarningForInput(matchRow.id);
    const fighter = fighters.find(f => f.name.toLowerCase() === input.value.trim().toLowerCase());
    if (fighter) {
        input.setAttribute('data-fighter-id', fighter.id);
        updateFighterRecordDisplay(matchRow.id, slotType, fighter);
        hydrateSelectedFighterPortrait(input).catch(() => {});
    } else {
        input.setAttribute('data-fighter-id', '');
        updateFighterRecordDisplay(matchRow.id, slotType, null);
        hideRematchWarning(matchRow.id);
    }
    updateWinnerDropdown(matchRow.id);
    if (matchRow.dataset.validationBatch !== 'true') {
        recheckMatchValidation(matchRow.id, slotType);
    }
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
        clearMatchRowWarningsForInput(matchRowId);
        slot1.setAttribute('data-gender', genderVariant);
        slot2.setAttribute('data-gender', genderVariant);
        slot1.querySelector('.fighter-search-input').value = '';
        slot2.querySelector('.fighter-search-input').value = '';
        slot1.querySelector('.fighter-search-input').setAttribute('data-fighter-id', '');
        slot2.querySelector('.fighter-search-input').setAttribute('data-fighter-id', '');
        clearDuplicateApproval(matchRowId);
        updateFighterRecordDisplay(matchRowId, 'slot1', null);
        updateFighterRecordDisplay(matchRowId, 'slot2', null);
        resetMatchValidationState(matchRowId);
        refreshTitleFightState(matchRowId);
        checkFighterScheduleConflict(document.getElementById(matchRowId));
        updateFighterScheduleLocator();
    }
}

function getArchivedFightHistoryBetween(f1, f2) {
    const fighter1Key = normalizeLookupKey(f1?.name);
    const fighter2Key = normalizeLookupKey(f2?.name);
    if (!fighter1Key || !fighter2Key || fighter1Key === fighter2Key) return [];

    let eventHistory;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
        if (!Array.isArray(eventHistory)) throw new Error('Archived event history is not a list.');
    } catch (error) {
        console.error('Unable to read archived fights for rematch detection.', error);
        return [];
    }

    const matches = [];
    eventHistory.forEach((event, eventIndex) => {
        if (!Array.isArray(event?.matches)) return;
        event.matches.forEach(match => {
            if (!match || typeof match !== 'object') return;
            const winner = String(match.winner || match.winnerName || '').trim();
            const loser = String(match.loser || match.loserName || '').trim();
            if (!winner || !loser) return;
            const winnerKey = normalizeLookupKey(winner);
            const loserKey = normalizeLookupKey(loser);
            if (!((winnerKey === fighter1Key && loserKey === fighter2Key) ||
                (winnerKey === fighter2Key && loserKey === fighter1Key))) return;
            matches.push({
                winner,
                loser,
                method: match.method || match.methodName || '',
                fightTime: match.fightTime || '',
                showName: event.showTitle || event.name || `Fight Card ${eventIndex + 1}`,
                rematchNumber: Number(match.rematchNumber) || 0,
                rematchNumberIsMeeting: match.rematchNumberIsMeeting === true
            });
        });
    });
    return matches;
}

function getFighterHistoryBetween(fighter, opponent) {
    const opponentKey = normalizeLookupKey(opponent?.name);
    if (!opponentKey) return [];
    const historySources = [fighter?.compiled_history_deck, fighter?.history_deck, fighter?.history];
    const history = historySources.find(source => Array.isArray(source) && source.length) ||
        historySources.find(Array.isArray) || [];
    return history.filter(entry =>
        entry && normalizeLookupKey(entry.opponent) === opponentKey
    ).map(entry => ({
        winner: String(entry.outcome || '').toLowerCase() === 'win' ? fighter.name : opponent.name,
        loser: String(entry.outcome || '').toLowerCase() === 'loss' ? fighter.name : opponent.name,
        method: entry.method || '',
        fightTime: entry.fightTime || '',
        showName: entry.showName || '',
        rematchNumber: Number(entry.rematchNumber) || 0,
        rematchNumberIsMeeting: entry.rematchNumberIsMeeting === true
    }));
}

function getFightHistoryBetween(f1, f2) {
    if (!f1 || !f2 || f1.id === f2.id) return [];
    const fighter1Key = normalizeLookupKey(f1.name);
    const fighter2Key = normalizeLookupKey(f2.name);
    if (!fighter1Key || !fighter2Key || fighter1Key === fighter2Key) return [];
    const historySources = [
        getArchivedFightHistoryBetween(f1, f2),
        getFighterHistoryBetween(f1, f2),
        getFighterHistoryBetween(f2, f1)
    ];
    return historySources.reduce((best, source) => source.length > best.length ? source : best, []);
}

function getTaleOfTheTapeFighter(matchRowId, slotType) {
    const input = document.querySelector(`#${matchRowId}-${slotType} .fighter-search-input`);
    if (!input) return null;
    const fighterId = input.getAttribute('data-fighter-id') || '';
    const fighterNameKey = normalizeLookupKey(input.value);
    const roster = Array.isArray(fighters) ? fighters : [];
    return (fighterId && roster.find(fighter => String(fighter.id) === fighterId)) ||
        (fighterNameKey && roster.find(fighter => normalizeLookupKey(fighter.name) === fighterNameKey)) ||
        null;
}

function updateTaleOfTheTapeButton(matchRowId) {
    const button = document.querySelector(`#${matchRowId} .tale-of-the-tape-trigger`);
    if (!button) return;
    const enabled = !!(getTaleOfTheTapeFighter(matchRowId, 'slot1') ||
        getTaleOfTheTapeFighter(matchRowId, 'slot2'));
    button.disabled = !enabled;
    button.setAttribute('aria-disabled', String(!enabled));
}

function getTaleOfTheTapeTitleStatus(fighter) {
    const status = getTitleEligibilityStatus(fighter);
    const priority = status.status === 'eligible' ? 3 :
        status.status === 'contender' ? 2 : 1;
    return {
        label: status.status === 'eligible' ? '🟢 TITLE ELIGIBLE' :
            status.status === 'rebuilding' || status.status === 'locked' ? '🟡 REBUILDING' :
                '⚪ CONTENDER',
        priority
    };
}

function getTaleOfTheTapeStreak(fighter) {
    const wins = Math.max(0, Math.floor(Number(fighter?.win_streak) || 0));
    const losses = Math.max(0, Math.floor(Number(fighter?.lose_streak) || 0));
    const peak = getCardsCareerPeakWinStreak(fighter);
    return {
        label: wins ? `🔥 ${wins}W • Peak ${peak}W` :
            losses ? `❄️ ${losses}L • Peak ${peak}W` : `No active streak • Peak ${peak}W`,
        score: wins || -losses
    };
}

function getTaleOfTheTapeStyle(fighter) {
    const finishes = [
        { label: '💀 KO ARTIST', count: Math.max(0, Number(fighter?.win_ko ?? fighter?.ko_wins) || 0) },
        { label: '🔒 SUB ARTIST', count: Math.max(0, Number(fighter?.win_submission ?? fighter?.sub_wins) || 0) },
        { label: '🤼 PIN ARTIST', count: Math.max(0, Number(fighter?.win_pinfall ?? fighter?.pin_wins) || 0) }
    ];
    const maxCount = Math.max(...finishes.map(item => item.count));
    if (!maxCount) return { label: '—', score: 0 };
    const leaders = finishes.filter(item => item.count === maxCount);
    return {
        label: leaders[0].label,
        score: maxCount
    };
}

function getTaleOfTheTapeAllianceSummary(fighter) {
    const nameKey = normalizeLookupKey(fighter?.name);
    const fighterId = String(fighter?.id || '');
    if (!nameKey && !fighterId) return 'None';
    const groups = [];
    const partners = [];
    getUniverseAlliances().forEach(alliance => {
        const members = alliance.members.map(member => {
            if (member && typeof member === 'object') {
                return { id: String(member.id || ''), name: String(member.name || '') };
            }
            return { id: '', name: String(member || '') };
        });
        const includesFighter = members.some(member =>
            (fighterId && member.id && member.id === fighterId) ||
            (nameKey && normalizeLookupKey(member.name) === nameKey)
        );
        if (!includesFighter) return;
        const type = String(alliance.type || '').toLowerCase();
        const isRomantic = type.includes('romantic') || type.includes('couple');
        const groupName = String(alliance.name || '').trim();
        if (groupName) {
            const typeLabel = isRomantic ? 'ROMANTIC' :
                type.includes('family') || type.includes('bloodline') ? 'FAMILY' :
                    type.includes('friend') || type.includes('faction') ? 'FRIENDS' : 'ALLIANCE';
            groups.push(`${groupName} (${typeLabel})`);
        }
        if (isRomantic) {
            members.forEach(member => {
                const isCurrentFighter = (fighterId && member.id && member.id === fighterId) ||
                    (nameKey && normalizeLookupKey(member.name) === nameKey);
                if (!isCurrentFighter && member.name.trim()) {
                    partners.push(groupName
                        ? `${member.name.trim()} (${groupName})`
                        : member.name.trim());
                }
            });
        }
    });
    const uniquePartners = Array.from(new Set(partners));
    const uniqueGroups = Array.from(new Set(groups));
    const details = [];
    if (uniquePartners.length) details.push(`♥ Partner(s): ${uniquePartners.join(', ')}`);
    if (uniqueGroups.length) details.push(`Groups: ${uniqueGroups.join(', ')}`);
    return details.join(' • ') || 'None';
}

function getTaleOfTheTapeTimedWinAverage(fighter) {
    const fighterId = String(fighter?.id || '');
    const fighterNameKey = normalizeLookupKey(fighter?.name);
    let eventHistory;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
        if (!Array.isArray(eventHistory)) throw new Error('Archived event history is not a list.');
    } catch (error) {
        console.error('Unable to read archived fights for Tale of the Tape.', error);
        return null;
    }

    let totalSeconds = 0;
    let timedWins = 0;
    eventHistory.forEach(event => {
        if (!Array.isArray(event?.matches)) return;
        event.matches.forEach(match => {
            if (!match || typeof match !== 'object') return;
            const winnerId = String(match.winnerId || match.winner_id || '');
            const winnerNameKey = normalizeLookupKey(match.winner || match.winnerName);
            const isWin = (fighterId && winnerId && winnerId === fighterId) ||
                (fighterNameKey && winnerNameKey === fighterNameKey);
            if (!isWin) return;
            const timeMs = parseMatchFightTime(match.fightTime);
            if (!timeMs) return;
            totalSeconds += timeMs / 1000;
            timedWins++;
        });
    });
    return timedWins ? totalSeconds / timedWins : null;
}

function getTaleOfTheTapeRankLookup() {
    if (typeof window.getDivisionRankLookup !== 'function') return null;
    try {
        const rankings = typeof window.getDivisionRankings === 'function'
            ? window.getDivisionRankings()
            : [];
        return window.getDivisionRankLookup(rankings);
    } catch (error) {
        console.error('Unable to load division ranks for Tale of the Tape.', error);
        return null;
    }
}

function getTaleOfTheTapeRank(fighter, rankLookup) {
    if (!fighter || !rankLookup) return 'NR';
    const entry = (fighter.id && rankLookup.get(String(fighter.id))) ||
        (fighter.name && rankLookup.get(`name:${String(fighter.name).trim().toLowerCase()}`));
    return entry?.rank || 'NR';
}

function getTaleOfTheTapeStats(fighter) {
    const wins = Math.max(0, Number(fighter?.wins) || 0);
    const losses = Math.max(0, Number(fighter?.losses) || 0);
    const fights = wins + losses;
    const ko = Math.max(0, Number(fighter?.win_ko ?? fighter?.ko_wins) || 0);
    const submission = Math.max(0, Number(fighter?.win_submission ?? fighter?.sub_wins) || 0);
    const pin = Math.max(0, Number(fighter?.win_pinfall ?? fighter?.pin_wins) || 0);
    const bonuses = Math.max(0, Number(fighter?.fotn_bonuses) || 0) +
        Math.max(0, Number(fighter?.potn_bonuses) || 0);
    return {
        wins,
        losses,
        winRate: fights ? wins / fights * 100 : 0,
        streak: getTaleOfTheTapeStreak(fighter),
        title: getTaleOfTheTapeTitleStatus(fighter),
        style: getTaleOfTheTapeStyle(fighter),
        finishTotal: pin + ko + submission,
        finishBreakdown: `${pin} PIN • ${ko} KO • ${submission} SUB`,
        averageFightTime: getTaleOfTheTapeTimedWinAverage(fighter),
        giantKills: Math.max(0, Number(fighter?.giant_kills) || 0),
        bossSlays: Math.max(0, Number(fighter?.boss_slays) || 0),
        bonuses,
        achievements: `⚔️ ${Math.max(0, Number(fighter?.giant_kills) || 0)} Giant Kills • 🗡️ ${Math.max(0, Number(fighter?.boss_slays) || 0)} Boss Slays • 🏅 ${bonuses} Bonuses`,
        alliances: getTaleOfTheTapeAllianceSummary(fighter)
    };
}

function getTaleOfTheTapeFightTimeLabel(value) {
    const timeMs = parseMatchFightTime(value);
    return timeMs ? formatMatchTimerDisplay(timeMs) : 'N/A';
}

function getTaleOfTheTapeMethodLabel(method) {
    return String(method || 'Method N/A')
        .replace(/win_pinfall/gi, 'PINFALL')
        .replace(/win_ko/gi, 'KO/TKO')
        .replace(/win_submission/gi, 'SUBMISSION');
}

function appendTaleOfTheTapeStatRow(tbody, label, leftValue, rightValue, advantage = 0) {
    const row = document.createElement('tr');
    row.className = 'tale-of-the-tape-stats__row';
    const left = document.createElement('td');
    const category = document.createElement('th');
    const right = document.createElement('td');
    left.className = 'tale-of-the-tape-stats__value';
    right.className = 'tale-of-the-tape-stats__value';
    category.className = 'tale-of-the-tape-stats__category';
    left.textContent = leftValue;
    category.textContent = label;
    right.textContent = rightValue;
    if (advantage > 0) left.classList.add('tale-of-the-tape-stats__value--advantage');
    if (advantage < 0) right.classList.add('tale-of-the-tape-stats__value--advantage');
    row.append(left, category, right);
    tbody.appendChild(row);
}

function populateTaleOfTheTapeFighter(side, fighter, rankLookup) {
    const suffix = side === 'slot1' ? '1' : '2';
    const portrait = document.getElementById(`taleOfTheTapePortrait${suffix}`);
    const initials = document.getElementById(`taleOfTheTapeInitials${suffix}`);
    const name = document.getElementById(`taleOfTheTapeName${suffix}`);
    const rank = document.getElementById(`taleOfTheTapeRank${suffix}`);
    const details = document.getElementById(`taleOfTheTapeDetails${suffix}`);
    const fighterName = String(fighter?.name || '').trim();
    name.textContent = fighterName || 'No fighter selected';
    rank.textContent = getTaleOfTheTapeRank(fighter, rankLookup);
    initials.textContent = fighterName
        ? fighterName.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase()
        : '?';
    const portraitPath = fighter?.photo || fighter?.image || fighter?.profile_pic || '';
    portrait.hidden = !portraitPath;
    initials.hidden = !!portraitPath;
    portrait.alt = fighterName ? `${fighterName} portrait` : '';
    portrait.onerror = () => {
        portrait.hidden = true;
        initials.hidden = false;
    };
    portrait.src = portraitPath;
    details.textContent = fighter
        ? `${String(fighter.gender || 'Unknown').replace(/^./, char => char.toUpperCase())} • ${fighter.division || fighter.weight_class || 'Division not set'}`
        : '';
}

function populateTaleOfTheTapeMeetings(fighter1, fighter2) {
    const meetingsList = document.getElementById('taleOfTheTapeMeetings');
    const seriesScore = document.getElementById('taleOfTheTapeSeriesScore');
    if (!meetingsList || !seriesScore) return;
    meetingsList.replaceChildren();
    const history = fighter1 && fighter2 ? getFightHistoryBetween(fighter1, fighter2) : [];
    const fighter1Key = normalizeLookupKey(fighter1?.name);
    const fighter2Key = normalizeLookupKey(fighter2?.name);
    let fighter1Wins = 0;
    let fighter2Wins = 0;
    history.forEach(match => {
        const winnerKey = normalizeLookupKey(match.winner);
        if (winnerKey === fighter1Key) fighter1Wins++;
        else if (winnerKey === fighter2Key) fighter2Wins++;
    });
    seriesScore.textContent = !fighter1 || !fighter2
        ? 'Select both fighters'
        : !history.length
        ? 'First Ever Meeting'
        : fighter1Wins === fighter2Wins
            ? `Tied ${fighter1Wins}–${fighter2Wins}`
            : `${fighter1Wins > fighter2Wins ? fighter1.name : fighter2.name} leads ${Math.max(fighter1Wins, fighter2Wins)}–${Math.min(fighter1Wins, fighter2Wins)}`;

    history.slice().reverse().forEach(match => {
        const item = document.createElement('li');
        const showName = document.createElement('strong');
        const result = document.createElement('span');
        const method = document.createElement('span');
        const time = document.createElement('span');
        showName.textContent = match.showName || 'Archived Fight';
        result.textContent = `Winner: ${match.winner || 'Unknown'}`;
        method.textContent = getTaleOfTheTapeMethodLabel(match.method);
        time.textContent = getTaleOfTheTapeFightTimeLabel(match.fightTime);
        item.append(showName, result, method, time);
        meetingsList.appendChild(item);
    });
}

window.openTaleOfTheTape = function(matchRowId) {
    const backdrop = document.getElementById('taleOfTheTapeBackdrop');
    const tbody = document.getElementById('taleOfTheTapeStats');
    const matchRow = document.getElementById(matchRowId);
    if (!backdrop || !tbody || !matchRow) return;
    const fighter1 = getTaleOfTheTapeFighter(matchRowId, 'slot1');
    const fighter2 = getTaleOfTheTapeFighter(matchRowId, 'slot2');
    if (!fighter1 && !fighter2) return;
    taleOfTheTapeTrigger = document.activeElement;

    const matchLabel = document.getElementById('taleOfTheTapeMatchLabel');
    if (matchLabel) matchLabel.textContent = (matchRow.dataset.matchLabel || 'MATCH').toUpperCase();
    const context = document.getElementById('taleOfTheTapeContext');
    if (context) {
        context.replaceChildren();
        const rivalry = fighter1 && fighter2 ? getRivalryStatus(fighter1, fighter2) : null;
        const hasBoss = [fighter1, fighter2].some(fighter => fighter?.is_boss === true);
        if (rivalry?.label || hasBoss) {
            context.hidden = false;
            if (rivalry?.label) {
                const rivalryBanner = document.createElement('span');
                rivalryBanner.className = `tale-of-the-tape-context__banner ${rivalry.className || ''}`;
                rivalryBanner.textContent = rivalry.label;
                context.appendChild(rivalryBanner);
            }
            if (hasBoss) {
                const bossBanner = document.createElement('span');
                bossBanner.className = 'tale-of-the-tape-context__banner tale-of-the-tape-context__banner--boss';
                bossBanner.textContent = '☠️ BOSS FIGHT • BOUNTY ACTIVE';
                context.appendChild(bossBanner);
            }
        } else {
            context.hidden = true;
        }
    }

    const rankLookup = getTaleOfTheTapeRankLookup();
    populateTaleOfTheTapeFighter('slot1', fighter1, rankLookup);
    populateTaleOfTheTapeFighter('slot2', fighter2, rankLookup);
    const emptyStats = {
        wins: null, losses: null, winRate: null,
        streak: { label: '—', score: null },
        title: { label: '—', priority: null },
        style: { label: '—', score: null },
        finishTotal: null, finishBreakdown: '—',
        averageFightTime: null,
        giantKills: null, bossSlays: null, bonuses: null,
        achievements: '—', alliances: '—'
    };
    const left = fighter1 ? getTaleOfTheTapeStats(fighter1) : emptyStats;
    const right = fighter2 ? getTaleOfTheTapeStats(fighter2) : emptyStats;
    tbody.replaceChildren();
    const bothFightersSelected = !!(fighter1 && fighter2);
    const leftRecord = left.wins === null ? '—' : `${left.wins} - ${left.losses}`;
    const rightRecord = right.wins === null ? '—' : `${right.wins} - ${right.losses}`;
    const compare = (a, b) => !bothFightersSelected ? 0 : a > b ? 1 : a < b ? -1 : 0;
    appendTaleOfTheTapeStatRow(tbody, 'OVERALL RECORD', leftRecord, rightRecord, compare(left.winRate, right.winRate));
    appendTaleOfTheTapeStatRow(tbody, 'WIN RATE', left.winRate === null ? '—' : `${left.winRate.toFixed(1)}%`, right.winRate === null ? '—' : `${right.winRate.toFixed(1)}%`, compare(left.winRate, right.winRate));
    appendTaleOfTheTapeStatRow(tbody, 'ACTIVE STREAK', left.streak.label, right.streak.label, compare(left.streak.score, right.streak.score));
    appendTaleOfTheTapeStatRow(tbody, 'TITLE STATUS', left.title.label, right.title.label, compare(left.title.priority, right.title.priority));
    appendTaleOfTheTapeStatRow(tbody, 'PRIMARY STYLE', left.style.label, right.style.label, compare(left.style.score, right.style.score));
    appendTaleOfTheTapeStatRow(tbody, 'FINISH BREAKDOWN', left.finishBreakdown, right.finishBreakdown, compare(left.finishTotal, right.finishTotal));
    const leftTime = left.averageFightTime;
    const rightTime = right.averageFightTime;
    const timeAdvantage = !bothFightersSelected || leftTime === null || rightTime === null
        ? 0
        : leftTime < rightTime ? 1 : leftTime > rightTime ? -1 : 0;
    appendTaleOfTheTapeStatRow(
        tbody,
        'AVERAGE FIGHT TIME',
        leftTime === null ? 'N/A' : formatMatchTimerDisplay(leftTime * 1000),
        rightTime === null ? 'N/A' : formatMatchTimerDisplay(rightTime * 1000),
        timeAdvantage
    );
    appendTaleOfTheTapeStatRow(tbody, 'SPECIAL ACHIEVEMENTS', left.achievements, right.achievements, compare(left.giantKills + left.bossSlays + left.bonuses, right.giantKills + right.bossSlays + right.bonuses));
    appendTaleOfTheTapeStatRow(tbody, 'ALLIANCES / PARTNER(S)', left.alliances, right.alliances);
    populateTaleOfTheTapeMeetings(fighter1, fighter2);

    backdrop.hidden = false;
    document.getElementById('taleOfTheTapeClose')?.focus();
};

function closeTaleOfTheTape() {
    const backdrop = document.getElementById('taleOfTheTapeBackdrop');
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    if (taleOfTheTapeTrigger?.isConnected) taleOfTheTapeTrigger.focus({ preventScroll: true });
}

let taleOfTheTapeTrigger = null;
document.getElementById('taleOfTheTapeClose')?.addEventListener('click', closeTaleOfTheTape);
document.getElementById('taleOfTheTapeBackdrop')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeTaleOfTheTape();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('taleOfTheTapeBackdrop')?.hidden) {
        closeTaleOfTheTape();
    }
});

function getPastFightsCount(f1, f2) {
    return getFightHistoryBetween(f1, f2).length;
}

function getRivalryStatus(fighter1, fighter2) {
    const fighter1Key = normalizeLookupKey(fighter1?.name);
    const fighter2Key = normalizeLookupKey(fighter2?.name);
    const status = {
        f1Wins: 0,
        f2Wins: 0,
        totalPastFights: 0,
        rivalryTag: '',
        rivalryKind: '',
        label: '',
        className: ''
    };
    if (!fighter1Key || !fighter2Key || fighter1Key === fighter2Key) return status;

    getFightHistoryBetween(fighter1, fighter2).forEach(match => {
        const winnerKey = normalizeLookupKey(match.winner);
        if (winnerKey === fighter1Key) status.f1Wins++;
        else if (winnerKey === fighter2Key) status.f2Wins++;
    });
    status.totalPastFights = status.f1Wins + status.f2Wins;

    if (status.totalPastFights < 2) return status;
    if (status.totalPastFights === 2 && status.f1Wins === 1 && status.f2Wins === 1) {
        status.rivalryTag = 'trilogy';
        status.rivalryKind = 'rubber-match';
        status.label = `🔥 TRILOGY • RUBBER MATCH (${status.f1Wins}–${status.f2Wins})`;
        status.className = 'rivalry-match-badge--rubber';
    } else if (status.totalPastFights === 2) {
        status.rivalryTag = 'trilogy';
        status.rivalryKind = 'series-on-the-line';
        status.label = `⚔️ TRILOGY • SERIES ON THE LINE (${status.f1Wins}–${status.f2Wins})`;
        status.className = 'rivalry-match-badge--series';
    } else {
        status.rivalryTag = 'rivalry';
        status.rivalryKind = 'historic-rivalry';
        status.label = `👑 HISTORIC RIVALRY • FIGHT #${status.totalPastFights + 1} (${status.f1Wins}–${status.f2Wins})`;
        status.className = 'rivalry-match-badge--historic';
    }
    return status;
}

window.getRivalryStatus = getRivalryStatus;

function updateRivalryIndicator(matchRowId) {
    const matchRow = document.getElementById(matchRowId);
    const statusRow = document.getElementById(`${matchRowId}-rivalry-status-row`);
    const badge = document.getElementById(`${matchRowId}-rivalry-status`);
    if (!matchRow || !statusRow || !badge) return;

    const savedMatch = completedMatches[matchRowId];
    let status;
    if (savedMatch) {
        status = {
            rivalryTag: savedMatch.rivalryTag || '',
            rivalryKind: savedMatch.rivalryKind || '',
            label: savedMatch.rivalryLabel || '',
            className: savedMatch.rivalryKind === 'rubber-match'
                ? 'rivalry-match-badge--rubber'
                : savedMatch.rivalryKind === 'series-on-the-line'
                    ? 'rivalry-match-badge--series'
                    : savedMatch.rivalryKind === 'historic-rivalry'
                        ? 'rivalry-match-badge--historic'
                        : ''
        };
    } else {
        const getSelectedFighter = slotType => {
            const input = document.getElementById(`${matchRowId}-${slotType}`)?.querySelector('.fighter-search-input');
            if (!input || !input.value.trim()) return null;
            const fighterId = input.getAttribute('data-fighter-id');
            if (fighterId) {
                const fighter = fighters.find(candidate => String(candidate.id) === fighterId);
                if (fighter) return fighter;
            }
            const fighterKey = normalizeLookupKey(input.value);
            return fighters.find(fighter => normalizeLookupKey(fighter.name) === fighterKey) || null;
        };
        status = getRivalryStatus(getSelectedFighter('slot1'), getSelectedFighter('slot2'));
    }

    const hasRivalry = status.rivalryTag && status.label && status.className;
    statusRow.hidden = !hasRivalry;
    matchRow.classList.toggle('match-row--rivalry', Boolean(hasRivalry));
    badge.className = `rivalry-match-badge ${hasRivalry ? status.className : ''}`.trim();
    badge.textContent = hasRivalry ? status.label : '';
}

function updateRematchIndicator(matchRowId, pastFightsCount, meetingNumber) {
    const matchRow = document.getElementById(matchRowId);
    const rematchCheckbox = matchRow?.querySelector('input[data-rematch-indicator]');
    const rematchCount = document.getElementById(`${matchRowId}-rematch-count`);
    const rematchLabel = document.getElementById(`${matchRowId}-rematch-label`);
    const isRematch = pastFightsCount > 0;
    const currentMeetingNumber = isRematch
        ? Math.max(pastFightsCount + 1, Number(meetingNumber) || 0)
        : 0;

    if (rematchCheckbox) {
        rematchCheckbox.disabled = true;
        rematchCheckbox.checked = isRematch;
    }
    if (rematchCount) {
        rematchCount.value = isRematch ? String(currentMeetingNumber) : '1';
        rematchCount.style.display = 'none';
    }
    if (rematchLabel) {
        rematchLabel.classList.remove('rematch-label--active', 'rematch-label--trilogy');
        rematchLabel.classList.add('rematch-label--muted');
        if (!isRematch) {
            rematchLabel.textContent = 'REMATCH';
        } else if (pastFightsCount === 2) {
            rematchLabel.textContent = `🔥 REMATCH #${pastFightsCount}`;
            rematchLabel.classList.replace('rematch-label--muted', 'rematch-label--trilogy');
        } else {
            rematchLabel.textContent = `REMATCH #${pastFightsCount}`;
            rematchLabel.classList.replace('rematch-label--muted', 'rematch-label--active');
        }
    }
    updateRivalryIndicator(matchRowId);
    return currentMeetingNumber;
}

function clearCardFighterSlot(matchRowId, slotType) {
    const slot = document.getElementById(`${matchRowId}-${slotType}`);
    if (!slot) return;
    const rowElement = slot.closest('.match-row');
    if (rowElement) delete rowElement.dataset.smartBookedTitle;
    clearMatchRowWarningsForInput(matchRowId);
    resetMatchValidationState(matchRowId);
    const input = slot.querySelector('.fighter-search-input');
    const av = slot.querySelector('.avatar-box');
    if (input) {
        input.value = '';
        input.setAttribute('data-fighter-id', '');
    }
    clearDuplicateApproval(matchRowId);
    if (av) {
        av.innerHTML = '👤';
        av.style.cssText = "width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; cursor:pointer; overflow:hidden;";
    }
    const badge = slot.querySelector('.win-badge');
    const label = slot.querySelector('.win-method-label');
    const recordDisplay = slot.querySelector('.fighter-record');
    if (badge) {
        badge.style.display = 'none';
        badge.classList.remove('winner-check-badge');
    }
    if (av) av.classList.remove('ufc-winner-border');
    if (label) label.style.display = 'none';
    if (recordDisplay) recordDisplay.textContent = '';
    updateFighterRecordDisplay(matchRowId, slotType, null);
    
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
        checkFighterScheduleConflict(matchRow);
    }
    
    resetMatchRowRematchState(matchRowId);
    hideRematchWarning(matchRowId);
    updateWinnerDropdown(matchRowId);
    saveCurrentCardDraft();
    updateFighterScheduleLocator();
}

function clearRematchWarningForInput(matchRowId) {
    clearMatchRowWarningsForInput(matchRowId);
}

function clearMatchRowWarningsForInput(matchRowId) {
    const rematchWarning = document.getElementById(`${matchRowId}-rematch-warning`);
    const duplicateWarning = document.getElementById(`${matchRowId}-duplicate-warning`);

    if (rematchWarning) {
        if (!rematchWarning.dataset.warningMarkup) {
            rematchWarning.dataset.warningMarkup = rematchWarning.innerHTML;
        }
        rematchWarning.innerHTML = '';
        rematchWarning.style.display = 'none';
    }
    if (duplicateWarning) {
        if (!duplicateWarning.dataset.warningMarkup) {
            duplicateWarning.dataset.warningMarkup = duplicateWarning.innerHTML;
        }
        duplicateWarning.innerHTML = '';
        duplicateWarning.style.display = 'none';
    }

    clearRematchWarningStorage(matchRowId);
    sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
    sessionStorage.removeItem(`match_${matchRowId}_rematch_warning_active`);
    sessionStorage.removeItem(`match_${activeShowId || 'default'}_${matchRowId}_variant_approved`);
    sessionStorage.removeItem(`match_${matchRowId}_variant_approved`);
    clearDuplicateApproval(matchRowId);
    clearWarningMatchState(matchRowId);
    delete activeRematchWarnings[matchRowId];

    const matchRow = document.getElementById(matchRowId);
    if (matchRow) delete matchRow.dataset.rematchPending;
    resetMatchRowRematchState(matchRowId);
    hideRematchWarning(matchRowId);
    hideDuplicateWarning(matchRowId);
}

function resetMatchValidationState(matchRowId) {
    const rematchWarningActive = isRematchWarningActive(matchRowId);
    if (!rematchWarningActive) {
        clearWarningMatchState(matchRowId);
        sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
        delete activeRematchWarnings[matchRowId];
        resetMatchRowRematchState(matchRowId);
    }

    const rematchWarning = document.getElementById(`${matchRowId}-rematch-warning`);
    const duplicateWarning = document.getElementById(`${matchRowId}-duplicate-warning`);
    [rematchWarningActive ? null : rematchWarning, duplicateWarning].forEach(container => {
        if (!container) return;
        container.style.display = 'none';
        const text = container.querySelector('[id$="-warning-text"]');
        if (text) text.innerHTML = '';
    });
    hideRematchWarning(matchRowId);
    hideDuplicateWarning(matchRowId);
}

function recheckMatchValidation(matchRowId, changedSlot = 'both') {
    updateRivalryIndicator(matchRowId);
    const rematchValid = checkExistingFightRematch(matchRowId, changedSlot);
    const duplicateValid = checkDuplicateOnCard(matchRowId, changedSlot);
    return rematchValid && duplicateValid;
}

function notifyFighterInputChanged(input) {
    if (!input) return;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

function applyMatchRowTitleGlow(matchRow) {
    if (!matchRow) return;
    matchRow.style.background = 'linear-gradient(to right, #fffaf0, #fff5d6, #fef3c7)';
    matchRow.style.borderColor = '#fbbf24';
}

function clearMatchRowTitleGlow(matchRow) {
    if (!matchRow) return;
    if (matchRow.dataset.isMain === 'true') {
        matchRow.style.background = 'linear-gradient(to right, #fff, #fff5f5, #fff)';
        matchRow.style.borderColor = '#fca5a5';
    } else {
        matchRow.style.background = '#fff';
        matchRow.style.borderColor = '#bae6fd';
    }
    matchRow.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
}

function updateTitleGateWarning(matchRowId, fighter1, fighter2) {
    const warning = document.getElementById(`${matchRowId}-title-gate-warning`);
    const titleCheckbox = document.getElementById(`${matchRowId}-title-check`);
    if (!warning || !titleCheckbox?.checked) {
        if (warning) {
            warning.hidden = true;
            warning.textContent = '';
        }
        return;
    }
    const lockedFighters = [fighter1, fighter2].filter(fighter =>
        fighter && !getTitleEligibilityStatus(fighter).eligible
    );
    if (!lockedFighters.length) {
        warning.hidden = true;
        warning.textContent = '';
        return;
    }
    const details = lockedFighters.map(fighter => {
        const status = getTitleEligibilityStatus(fighter);
        const wins = status.remaining;
        return `${fighter.name} needs ${wins} more win${wins === 1 ? '' : 's'}`;
    });
    warning.textContent = `⚠️ Locked: ${details.join('; ')} for title eligibility`;
    warning.hidden = false;
}

function refreshTitleFightState(matchRowId) {
    const matchRow = document.getElementById(matchRowId);
    if (!matchRow) return;
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
    const validTitleFight = matchRow.dataset.smartBookedTitle === 'true' || hasValidFighterSelection;

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
                clearMatchRowTitleGlow(matchRow);
            }
        }
    }

    if (titleCheckbox && titleCheckbox.checked) {
        applyMatchRowTitleGlow(matchRow);
    } else {
        clearMatchRowTitleGlow(matchRow);
    }
    updateTitleGateWarning(matchRowId, fighter1, fighter2);
    updateProspectProtectionBadge(matchRowId);
    updateTitleDefenseMilestone(matchRowId);
}

function resetMatchRowRematchState(matchRowId) {
    if (isRematchWarningActive(matchRowId)) return;
    const matchRow = document.getElementById(matchRowId);
    updateRematchIndicator(matchRowId, 0);
    if (matchRow) {
        delete matchRow.dataset.rematchAccepted;
        delete matchRow.dataset.rematchF1;
        delete matchRow.dataset.rematchF2;
        delete matchRow.dataset.rematchCount;
        delete matchRow.dataset.rematchPending;
    }
    delete activeRematchWarnings[matchRowId];
}

window.setMatchRowRematchAccepted = function(matchRowId, fighter1Id, fighter2Id, count) {
    const matchRow = document.getElementById(matchRowId);
    if (!matchRow) return;
    const fighter1 = fighters.find(fighter => fighter.id === fighter1Id);
    const fighter2 = fighters.find(fighter => fighter.id === fighter2Id);
    const meetingNumber = fighter1 && fighter2
        ? getPastFightsCount(fighter1, fighter2) + 1
        : Math.max(2, Number(count) || 0);
    matchRow.dataset.rematchAccepted = 'true';
    matchRow.dataset.rematchF1 = fighter1Id || '';
    matchRow.dataset.rematchF2 = fighter2Id || '';
    matchRow.dataset.rematchCount = String(meetingNumber);
    updateRematchIndicator(matchRowId, meetingNumber - 1, meetingNumber);
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
    updateTaleOfTheTapeButton(matchRowId);
    const recordEl = document.getElementById(`${matchRowId}-${slotType}-record`);
    if (!recordEl) return;
    updateBossFightDisplay(matchRowId);
    updateProspectProtectionBadge(matchRowId);

    const slot = document.getElementById(`${matchRowId}-${slotType}`);
    const portraitFrame = slot?.querySelector('.avatar-frame');
    applyStreakPortraitClass(portraitFrame, fighter);

    const rankBadge = slot?.querySelector('.division-rank-badge');
    if (rankBadge && typeof window.updateDivisionRankBadgeElement === 'function') {
        const divisionRankings = typeof window.getDivisionRankings === 'function'
            ? window.getDivisionRankings()
            : [];
        const rankLookup = typeof window.getDivisionRankLookup === 'function'
            ? window.getDivisionRankLookup(divisionRankings)
            : null;
        window.updateDivisionRankBadgeElement(rankBadge, fighter, rankLookup);
    }

    if (!fighter || typeof fighter.wins === 'undefined' || typeof fighter.losses === 'undefined') {
        recordEl.textContent = '';
        return;
    }

    const fighterInput = document.getElementById(`${matchRowId}-${slotType}`)?.querySelector('.fighter-search-input');
    const currentFighterName = (fighterInput?.value || fighter.name || '').trim();
    const liveFighterData = loadFightersFromStorage().find(
        f => f.name.trim() === currentFighterName
    );
    const recordSource = liveFighterData || fighter;
    const history = recordSource.compiled_history_deck || recordSource.history_deck || recordSource.history || [];
    const historyEntries = Array.isArray(history) ? history : [];
    const hasHistoryResults = historyEntries.some(entry =>
        ['win', 'loss'].includes((entry?.outcome || '').toLowerCase())
    );
    const wins = hasHistoryResults
        ? historyEntries.filter(entry => (entry?.outcome || '').toLowerCase() === 'win').length
        : Number(recordSource.wins || 0);
    const losses = hasHistoryResults
        ? historyEntries.filter(entry => (entry?.outcome || '').toLowerCase() === 'loss').length
        : Number(recordSource.losses || 0);
    recordEl.innerHTML = `<span class="fighter-record__record">${wins}W / ${losses}L</span>`;
    applyStreakPortraitClass(portraitFrame, recordSource);
    const streakBadgeHtml = typeof window.getWinStreakBadgeHtml === 'function'
        ? window.getWinStreakBadgeHtml(recordSource)
        : '';
    const coldStreakBadgeHtml = typeof window.getLoseStreakBadgeHtml === 'function'
        ? window.getLoseStreakBadgeHtml(recordSource)
        : '';
    const fightingStyleBadgeHtml = typeof window.getFighterStyleBadge === 'function'
        ? window.getFighterStyleBadge(recordSource)
        : '';
    const titleEligibility = getTitleEligibilityStatus(recordSource);
    const titleEligibilityBadgeHtml = `<span class="title-eligibility-badge title-eligibility-badge--${titleEligibility.status}">${titleEligibility.label}</span>`;
    const recordBadges = [streakBadgeHtml, coldStreakBadgeHtml, fightingStyleBadgeHtml, titleEligibilityBadgeHtml].filter(Boolean).join('');
    if (recordBadges) recordEl.insertAdjacentHTML('beforeend', recordBadges);
}

function updateBossFightDisplay(matchRowId) {
    const row = document.getElementById(matchRowId);
    if (!row) return;
    const isBossInMatch = ['slot1', 'slot2'].some(slotType => {
        const input = row.querySelector(`#${matchRowId}-${slotType} .fighter-search-input`);
        if (!input) return false;
        const fighterId = input.getAttribute('data-fighter-id');
        const fighterName = input.value.trim().toLowerCase();
        const fighterList = Array.isArray(fighters) ? fighters : [];
        const fighter = (fighterId && fighterList.find(item => String(item.id) === fighterId)) ||
            (fighterName && fighterList.find(item => String(item.name || '').trim().toLowerCase() === fighterName));
        return fighter?.is_boss === true;
    });
    row.classList.toggle('has-boss-fight', isBossInMatch);
    const banner = document.getElementById(`${matchRowId}-boss-fight-banner`);
    if (banner) banner.hidden = !isBossInMatch;
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
    const fighterList = (Array.isArray(fighters) && fighters.length > 0) ? fighters : loadFightersFromStorage();
    if (!Array.isArray(fighterList) || fighterList.length === 0) return null;
    const trimmedIdentifier = String(identifier).trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();
    const exactMatch = fighterList.find(f => f.id === trimmedIdentifier || f.name.toLowerCase() === normalizedIdentifier);
    if (exactMatch) return exactMatch;
    return fighterList.find(f => f.name.toLowerCase().includes(normalizedIdentifier) || (f.id && f.id.toLowerCase().includes(normalizedIdentifier))) || null;
}

function checkExistingFightRematch(matchRowId, changedSlot) {
    if (isRematchWarningActive(matchRowId)) return false;

    const slot1 = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    if (!slot1 || !slot2 || !slot1.value.trim() || !slot2.value.trim()) {
        resetMatchRowRematchState(matchRowId);
        return true;
    }

    const resolveFighter = input => {
        const fighterId = input.getAttribute('data-fighter-id');
        const fighterKey = normalizeLookupKey(input.value);
        return fighters.find(fighter => fighter.id === fighterId) ||
            fighters.find(fighter => normalizeLookupKey(fighter.name) === fighterKey);
    };
    const fighter1 = resolveFighter(slot1);
    const fighter2 = resolveFighter(slot2);
    if (!fighter1 || !fighter2 || fighter1.id === fighter2.id) {
        resetMatchRowRematchState(matchRowId);
        return true;
    }

    const accepted = getMatchRowAcceptedRematch(matchRowId);
    if (accepted && areMatchRowRematchPairsEqual(fighter1.id, fighter2.id, accepted.fighter1Id, accepted.fighter2Id)) {
        const pastFightsCount = getPastFightsCount(fighter1, fighter2);
        if (!pastFightsCount) {
            resetMatchRowRematchState(matchRowId);
            return true;
        }
        setMatchRowRematchAccepted(matchRowId, fighter1.id, fighter2.id, pastFightsCount + 1);
        return true;
    }

    const historyEntries = getFightHistoryBetween(fighter1, fighter2);
    const pastFightsCount = historyEntries.length;
    if (!pastFightsCount) {
        resetMatchRowRematchState(matchRowId);
        hideRematchWarning(matchRowId);
        return true;
    }

    const fightNumber = pastFightsCount + 1;
    const historySummary = {
        priorCount: pastFightsCount,
        lastWinner: historyEntries[historyEntries.length - 1]?.winner || fighter1.name,
        showName: historyEntries[historyEntries.length - 1]?.showName || 'Previous show',
        methodLabel: historyEntries[historyEntries.length - 1]?.method || 'Previous result',
        fightNumber
    };

    const matchRow = document.getElementById(matchRowId);
    updateRematchIndicator(matchRowId, pastFightsCount, fightNumber);
    setWarningMatchState(matchRowId, 'rematch', {
        fighter1: fighter1.name,
        fighter2: fighter2.name
    });
    const warningState = {
        fighter1: fighter1.name,
        fighter2: fighter2.name,
        fighter1Id: fighter1.id,
        fighter2Id: fighter2.id,
        history: historySummary,
        changedSlot
    };
    activeRematchWarnings[matchRowId] = warningState;
    sessionStorage.setItem(getRematchWarningActiveStorageKey(matchRowId), 'true');
    sessionStorage.setItem(getRematchWarningDataStorageKey(matchRowId), JSON.stringify(warningState));
    sessionStorage.setItem(`rematch_pending_match${matchRowId}`, JSON.stringify({
        fighter1: fighter1.name,
        fighter2: fighter2.name
    }));
    if (matchRow) matchRow.dataset.rematchPending = 'true';
    showRematchWarning(matchRowId, fighter1, fighter2, historySummary, changedSlot);

    return false; // Rematch detected: return false to prevent further actions and let user interact with warning
}

function showRematchWarning(matchRowId, fighter1, fighter2, history, changedSlot) {
    const container = document.getElementById(`${matchRowId}-rematch-warning`);
    if (container && !container.innerHTML.trim() && container.dataset.warningMarkup) {
        container.innerHTML = container.dataset.warningMarkup;
    }
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
            clearRematchWarningStorage(matchRowId);
            if (changedSlot === 'both') {
                clearCardFighterSlot(matchRowId, 'slot1');
                clearCardFighterSlot(matchRowId, 'slot2');
            } else {
                clearCardFighterSlot(matchRowId, changedSlot || 'slot2');
            }
            const matchRow = document.getElementById(matchRowId);
            if (matchRow) delete matchRow.dataset.rematchPending;
            delete activeRematchWarnings[matchRowId];
            clearWarningMatchState(matchRowId, 'rematch');
            sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
            hideRematchWarning(matchRowId);
        };
    }
    if (allowBtn) {
        allowBtn.onclick = function() {
            clearRematchWarningStorage(matchRowId);
            const matchRow = document.getElementById(matchRowId);
            const pastFightsCount = getPastFightsCount(fighter1, fighter2);
            if (pastFightsCount > 0) {
                setMatchRowRematchAccepted(matchRowId, fighter1.id, fighter2.id, pastFightsCount + 1);
            } else {
                resetMatchRowRematchState(matchRowId);
            }
            saveCurrentCardDraft();
            if (matchRow) delete matchRow.dataset.rematchPending;
            delete activeRematchWarnings[matchRowId];
            clearWarningMatchState(matchRowId, 'rematch');
            sessionStorage.removeItem(`rematch_pending_match${matchRowId}`);
            hideRematchWarning(matchRowId);
        };
    }
}

function restoreActiveRematchWarnings() {
    Object.entries(activeRematchWarnings).forEach(([matchRowId, warning]) => {
        const matchRow = document.getElementById(matchRowId);
        const fighter1 = getFighterByIdOrName(warning.fighter1Id || warning.fighter1);
        const fighter2 = getFighterByIdOrName(warning.fighter2Id || warning.fighter2);
        if (!matchRow || !fighter1 || !fighter2) return;

        let container = document.getElementById(`${matchRowId}-rematch-warning`);
        if (!container) {
            container = document.createElement('div');
            container.id = `${matchRowId}-rematch-warning`;
            container.style.cssText = 'display:none; width:100%; background:#fef3c7; border:1px solid #fde68a; border-radius:10px; padding:12px; color:#92400e; box-sizing:border-box;';
            container.innerHTML = `<div id="${matchRowId}-rematch-warning-text" style="font-size:0.78rem; line-height:1.4; margin-bottom:10px;"></div><div style="display:flex; justify-content:flex-end; gap:8px;"><button id="${matchRowId}-rematch-cancel" type="button" style="background:#ef4444; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Cancel</button><button id="${matchRowId}-rematch-allow" type="button" style="background:#15803d; border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.75rem;">Allow Rematch</button></div>`;
            matchRow.appendChild(container);
        }

        const historyEntries = getFightHistoryBetween(fighter1, fighter2);
        const pastFightsCount = historyEntries.length;
        if (!pastFightsCount) {
            clearRematchWarningStorage(matchRowId);
            clearWarningMatchState(matchRowId, 'rematch');
            resetMatchRowRematchState(matchRowId);
            hideRematchWarning(matchRowId);
            return;
        }
        updateRematchIndicator(matchRowId, pastFightsCount, pastFightsCount + 1);
        const historySummary = {
            ...(warning.history || {}),
            priorCount: pastFightsCount,
            lastWinner: historyEntries[historyEntries.length - 1]?.winner || fighter1.name,
            showName: historyEntries[historyEntries.length - 1]?.showName || 'Previous show',
            methodLabel: historyEntries[historyEntries.length - 1]?.method || 'Previous result',
            fightNumber: pastFightsCount + 1
        };
        showRematchWarning(matchRowId, fighter1, fighter2, {
            priorCount: historySummary.priorCount,
            lastWinner: historySummary.lastWinner,
            showName: historySummary.showName,
            methodLabel: historySummary.methodLabel,
            fightNumber: historySummary.fightNumber
        }, warning.changedSlot || 'both');
    });
}

function restoreSessionRematchWarningForRow(matchRowId) {
    if (!isRematchWarningActive(matchRowId)) return;
    try {
        const stored = sessionStorage.getItem(getRematchWarningDataStorageKey(matchRowId));
        const warning = stored ? JSON.parse(stored) : null;
        if (!warning || !warning.fighter1 || !warning.fighter2) return;
        activeRematchWarnings[matchRowId] = warning;
        setWarningMatchState(matchRowId, 'rematch', {
            fighter1: warning.fighter1,
            fighter2: warning.fighter2
        });
        restoreActiveRematchWarnings();
    } catch (error) {
        console.error(`Failed to restore rematch warning for match ${matchRowId}:`, error);
    }
}

function restoreSessionRematchWarnings() {
    document.querySelectorAll('.match-row').forEach(matchRow => {
        restoreSessionRematchWarningForRow(matchRow.id);
    });
}

function restoreSessionWarnings() {
    restoreSessionRematchWarnings();
    document.querySelectorAll('.match-row').forEach(matchRow => {
        if (!isUnfinalizedWarningRow(matchRow.id)) return;
        checkFighterScheduleConflict(matchRow);
        if (isDuplicateApprovalCurrent(matchRow.id)) {
            const container = document.getElementById(`${matchRow.id}-duplicate-warning`);
            if (container) container.style.display = 'none';
            return;
        }
        const sameName = getWarningMatchState(matchRow.id)?.sameName;
        if (sameName) {
            showDuplicateWarning(matchRow.id, sameName.changedSlot, sameName.existingName, sameName.newName, false);
        }
    });
}

function hideRematchWarning(matchRowId) {
    if (isRematchWarningActive(matchRowId)) return;
    if (isUnfinalizedWarningRow(matchRowId) && getWarningMatchState(matchRowId)?.rematch) return;
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
    const lookupKey = normalizeLookupKey(name);
    if (!normalized || !lookupKey) return null;
    const inputs = Array.from(document.querySelectorAll('.fighter-search-input'));
    for (let inp of inputs) {
        if (inp === excludeInput) continue;
        const val = inp.value || '';
        if (!val) continue;
        if (!fighters.some(f => f.name.toLowerCase() === val.trim().toLowerCase())) continue;
        const normVal = normalizeFighterName(val);
        const baseVal = baseFighterName(val);
        const lookupVal = normalizeLookupKey(val);
        if (!normVal) continue;
        if (lookupKey === lookupVal) {
            return { input: inp, name: val };
        }
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

function showDuplicateWarning(matchRowId, changedSlot, existingName, newName, persist = true) {
    const container = document.getElementById(`${matchRowId}-duplicate-warning`);
    if (!container) return;
    if (isDuplicateApprovalCurrent(matchRowId)) {
        container.style.display = 'none';
        return;
    }
    if (!container.dataset.warningMarkup) container.dataset.warningMarkup = container.innerHTML;
    if (!container.innerHTML.trim()) container.innerHTML = container.dataset.warningMarkup;
    const text = document.getElementById(`${matchRowId}-duplicate-warning-text`);
    if (!text) return;
    if (persist) {
        setWarningMatchState(matchRowId, 'sameName', { changedSlot, existingName, newName });
    }
    text.innerHTML = `⚠️ <strong>${newName}</strong> looks similar to <strong>${existingName}</strong> already on this card.`;
    container.style.display = 'block';

    const cancelBtn = document.getElementById(`${matchRowId}-duplicate-cancel`);
    const allowBtn = document.getElementById(`${matchRowId}-duplicate-allow`);
    const replaceBtn = document.getElementById(`${matchRowId}-duplicate-replace`);

    if (cancelBtn) cancelBtn.onclick = function() {
        clearCardFighterSlot(matchRowId, changedSlot || 'slot2');
        clearWarningMatchState(matchRowId, 'sameName');
        hideDuplicateWarning(matchRowId);
    };
    if (allowBtn) allowBtn.onclick = function() {
        const approvalKey = getDuplicateApprovalKey(matchRowId);
        const fighterNames = getMatchFighterNames(matchRowId);
        sessionStorage.setItem(approvalKey, 'true');
        sessionStorage.setItem(`${approvalKey}_fighters`, JSON.stringify(fighterNames));
        clearWarningMatchState(matchRowId, 'sameName');
        container.style.display = 'none';
        if (!container.dataset.warningMarkup) container.dataset.warningMarkup = container.innerHTML;
        container.innerHTML = '';
    };
    if (replaceBtn) replaceBtn.onclick = function() {
        // Find an open-weight replacement within the relevant gender division.
        const changedSlotEl = document.getElementById(`${matchRowId}-${changedSlot}`);
        const changedInput = changedSlotEl ? changedSlotEl.querySelector('.fighter-search-input') : null;
        // Determine the target gender from the existing similar fighter when possible.
        const similar = findSimilarNameOnCard(newName, changedInput);
        let targetGender = null;
        if (similar) {
            const simId = similar.input.getAttribute('data-fighter-id');
            const simF = fighters.find(f => f.id === simId) || fighters.find(f => f.name === similar.name);
            if (simF) {
                targetGender = simF.gender || 'male';
            }
        }
        // fallback to changed input's slot gender
        if (!targetGender && changedSlotEl) targetGender = changedSlotEl.getAttribute('data-gender') || 'male';
        // find candidate fighters
        const bookedIds = Array.from(document.querySelectorAll('.fighter-search-input')).map(i => i.getAttribute('data-fighter-id')).filter(Boolean);
        let candidates = fighters.filter(f => {
            if (f.retired === true) return false;
            if (bookedIds.includes(f.id)) return false;
            if (targetGender && (f.gender || 'male') !== targetGender) return false;
            // avoid those with similar names
            const n = normalizeFighterName(f.name);
            if (n === normalizeFighterName(newName)) return false;
            return true;
        });
        if (!candidates.length) {
            customAlert('No unbooked replacement fighter found in the same gender division. Try allowing or canceling.', 'Replace Fighter');
            return;
        }
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (changedInput) {
            clearMatchRowWarningsForInput(matchRowId);
            changedInput.value = pick.name;
            clearDuplicateApprovalForChangedInput(matchRowId);
            changedInput.setAttribute('data-fighter-id', pick.id);
            updateFighterRecordDisplay(matchRowId, changedSlot, pick);
            const av = document.getElementById(`${matchRowId}-${changedSlot}`).querySelector('.avatar-box');
            if (av) {
                const _eff = getEffectivePhotoFor(pick);
                av.innerHTML = _eff ? `<img src="${_eff}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : pick.name.charAt(0);
                av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            }
            refreshTitleFightState(matchRowId);
            updateWinnerDropdown(matchRowId);
            recheckMatchValidation(matchRowId, changedSlot);
            saveCurrentCardDraft();
            return;
        }
        clearWarningMatchState(matchRowId, 'sameName');
        hideDuplicateWarning(matchRowId);
    };
}

function hideDuplicateWarning(matchRowId) {
    if (isUnfinalizedWarningRow(matchRowId) && getWarningMatchState(matchRowId)?.sameName) return;
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
    const selectedFighterNames = fighters.map(f => f.name.toLowerCase());
    if (!selectedFighterNames.includes(s1.value.trim().toLowerCase()) ||
        !selectedFighterNames.includes(s2.value.trim().toLowerCase())) return null;
    const sim1 = findSimilarNameOnCard(s1.value.trim(), s1);
    const sim2 = findSimilarNameOnCard(s2.value.trim(), s2);
    if (sim1) return { slotType: 'slot1', similar: sim1, value: s1.value.trim() };
    if (sim2) return { slotType: 'slot2', similar: sim2, value: s2.value.trim() };
    return null;
}

function checkDuplicateOnCard(matchRowId, changedSlot) {
    if (isDuplicateApprovalCurrent(matchRowId)) {
        const container = document.getElementById(`${matchRowId}-duplicate-warning`);
        if (container) container.style.display = 'none';
        return true;
    }
    const duplicatePair = findDuplicatePairInMatchRow(matchRowId);
    if (duplicatePair) {
        showDuplicateWarning(matchRowId, duplicatePair.slotType, duplicatePair.similar.name, duplicatePair.value);
        return false;
    }
    hideDuplicateWarning(matchRowId);
    return true;
}

function getDuplicateApprovalKey(matchRowId) {
    return `match_${activeShowId || 'default'}_${matchRowId}_variant_approved`;
}

function getMatchFighterNames(matchRowId) {
    return {
        slot1: document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input')?.value.trim() || '',
        slot2: document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input')?.value.trim() || ''
    };
}

function clearDuplicateApprovalForChangedInput(matchRowId) {
    const approvalKey = getDuplicateApprovalKey(matchRowId);
    if (sessionStorage.getItem(approvalKey) !== 'true') return;

    const approvedNames = sessionStorage.getItem(`${approvalKey}_fighters`);
    if (!approvedNames) {
        sessionStorage.removeItem(approvalKey);
        sessionStorage.removeItem(`${approvalKey}_fighters`);
        return;
    }

    let approvedPair;
    try {
        approvedPair = JSON.parse(approvedNames);
    } catch (error) {
        clearDuplicateApproval(matchRowId);
        return;
    }

    if (!approvedPair || typeof approvedPair.slot1 !== 'string' || typeof approvedPair.slot2 !== 'string') {
        clearDuplicateApproval(matchRowId);
        return;
    }

    const currentPair = getMatchFighterNames(matchRowId);
    if (currentPair.slot1 !== approvedPair.slot1 || currentPair.slot2 !== approvedPair.slot2) {
        clearDuplicateApproval(matchRowId);
    }
}

function isDuplicateApprovalCurrent(matchRowId) {
    const approvalKey = getDuplicateApprovalKey(matchRowId);
    if (sessionStorage.getItem(approvalKey) !== 'true') return false;

    const approvedNames = sessionStorage.getItem(`${approvalKey}_fighters`);
    if (!approvedNames) {
        clearDuplicateApproval(matchRowId);
        return false;
    }

    let approvedPair;
    try {
        approvedPair = JSON.parse(approvedNames);
    } catch (error) {
        clearDuplicateApproval(matchRowId);
        return false;
    }

    const currentPair = getMatchFighterNames(matchRowId);
    if (!approvedPair || currentPair.slot1 !== approvedPair.slot1 || currentPair.slot2 !== approvedPair.slot2) {
        clearDuplicateApproval(matchRowId);
        return false;
    }
    return true;
}

function clearDuplicateApproval(matchRowId) {
    const approvalKey = getDuplicateApprovalKey(matchRowId);
    sessionStorage.removeItem(approvalKey);
    sessionStorage.removeItem(`${approvalKey}_fighters`);
}

window.toggleTitleFight = function(matchRowId, checkbox) {
    const titleInput = document.getElementById(`${matchRowId}-title-name-input`);
    const slot1Input = document.getElementById(`${matchRowId}-slot1`)?.querySelector('.fighter-search-input');
    const slot2Input = document.getElementById(`${matchRowId}-slot2`)?.querySelector('.fighter-search-input');
    const fighter1 = slot1Input ? fighters.find(f => f.id === slot1Input.getAttribute('data-fighter-id') || f.name === slot1Input.value) : null;
    const fighter2 = slot2Input ? fighters.find(f => f.id === slot2Input.getAttribute('data-fighter-id') || f.name === slot2Input.value) : null;

    const matchRow = document.getElementById(matchRowId);
    if (matchRow) delete matchRow.dataset.smartBookedTitle;
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
        updateTitleGateWarning(matchRowId, fighter1, fighter2);
        updateTitleDefenseMilestone(matchRowId);
        saveCurrentCardDraft();
        return;
    }

    if (!fighter1 || !fighter2) {
        customAlert('Select both competitors before enabling a Title fight.', 'Title Fight');
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
    updateTitleGateWarning(matchRowId, fighter1, fighter2);
    updateTitleDefenseMilestone(matchRowId);
    saveCurrentCardDraft();
    // Note: Manual finalize button removed — titles will be applied automatically when logging results.
};

window.updateTitleFinalizeState = function(matchRowId) {
    // Deprecated: manual finalize removed. Keep function for compatibility but do nothing.
};

window.finalizeTitleFight = function(matchRowId) {
    // Manual finalize removed — title finalization now occurs when logging match results.
};

function updateTitleDefenseMilestone(matchRowId) {
    const status = document.getElementById(`${matchRowId}-title-defense-milestone`);
    const titleCheck = document.getElementById(`${matchRowId}-title-check`);
    const titleInput = document.getElementById(`${matchRowId}-title-name-input`);
    if (!status || !titleCheck?.checked || !titleInput?.value) {
        if (status) {
            status.hidden = true;
            status.replaceChildren();
        }
        return;
    }

    let titles;
    try {
        titles = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
    } catch (error) {
        console.error('Unable to read championship defense milestones.', error);
        status.hidden = true;
        return;
    }
    if (!Array.isArray(titles)) {
        console.error('The saved championship list is not valid.');
        status.hidden = true;
        return;
    }

    const title = titles.find(entry => String(entry?.id || '') === String(titleInput.value));
    if (!title) {
        status.hidden = true;
        status.replaceChildren();
        return;
    }
    const championId = String(title.championId || title.champion?.id || '');
    const championName = String(
        title.champion?.name ||
        (typeof title.champion === 'string' ? title.champion : '') ||
        title.championName ||
        ''
    );
    const champion = fighters.find(fighter =>
        (championId && String(fighter.id) === championId) ||
        (championName && String(fighter.name || '').trim().toLowerCase() === championName.trim().toLowerCase())
    );
    const defenses = Math.max(0, Math.floor(Number(title.defenses ?? title.currentReignDefenses) || 0));
    const milestone = typeof window.getDefenseMilestone === 'function'
        ? window.getDefenseMilestone(defenses)
        : { tier: 0, label: `Defenses: ${defenses}`, className: '' };
    const result = completedMatches[matchRowId];
    const defenseNumber = result?.titleRetained === true && Number(result.titleDefenseNumber) > 0
        ? Number(result.titleDefenseNumber)
        : defenses + 1;

    status.replaceChildren();
    const championLine = document.createElement('span');
    championLine.className = 'title-defense-milestone__champion';
    championLine.textContent = `👑 ${champion?.name || championName || 'Vacant'} • Defense #${defenseNumber}`;
    status.appendChild(championLine);

    if (milestone.tier > 0) {
        const badge = document.createElement('span');
        badge.className = `defense-milestone-badge ${milestone.className}`;
        badge.textContent = milestone.label;
        status.appendChild(badge);
    } else {
        const counter = document.createElement('span');
        counter.className = 'title-defense-milestone__counter';
        counter.textContent = `Defenses: ${defenses}`;
        status.appendChild(counter);
    }

    if (result?.titleMilestoneUnlocked === true) {
        const unlocked = document.createElement('span');
        unlocked.className = 'title-milestone-unlocked';
        unlocked.textContent = '🎉 MILESTONE UNLOCKED!';
        status.appendChild(unlocked);
    }
    status.hidden = false;
}

window.updateTitleDefenseMilestone = updateTitleDefenseMilestone;

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
    updateTitleDefenseMilestone(matchRowId);
};

document.addEventListener('change', event => {
    const select = event.target.closest('select[id$="-title-name-input"]');
    if (!select) return;
    updateTitleDefenseMilestone(select.id.slice(0, -'-title-name-input'.length));
});

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

// Backward-compatible alias for older card code and cached browser pages.
window.loadFighterPhotoFromCard = function(fighterId) {
    if (!fighterId && fighterId !== 0) return;
    const fighter = fighters.find(f => f && f.id === fighterId) || getFighterByIdOrName(String(fighterId));
    if (fighter && fighter.photo) {
        openPhotoCropDialog(fighter.photo, fighter.id, false);
        return;
    }
    window.uploadFighterPhotoFromCard(fighterId);
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
            if (typeof scheduleRenderRosterGrid === 'function') scheduleRenderRosterGrid(); else try { renderRosterGrid(); } catch(e){}
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
            if (typeof scheduleRenderRosterGrid === 'function') scheduleRenderRosterGrid(); else try { renderRosterGrid(); } catch(e){}
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

function pickCompetitiveMatchup(fighterPool, reservedPairs) {
    const candidates = [];
    for (let i = 0; i < fighterPool.length - 1; i++) {
        for (let j = i + 1; j < fighterPool.length; j++) {
            const fighter1 = fighterPool[i];
            const fighter2 = fighterPool[j];
            if (!fighter1?.id || !fighter2?.id || fighter1.id === fighter2.id) continue;
            if (!isFightNightMatchupAllowed(fighter1, fighter2)) continue;

            const name1 = normalizeLookupKey(fighter1.name);
            const name2 = normalizeLookupKey(fighter2.name);
            if (!name1 || name1 === name2) continue;
            if (reservedPairs.has(window.makeOpponentPairKey(fighter1.id, fighter2.id))) continue;
            if (getFightHistoryBetween(fighter1, fighter2).length) continue;

            const wins1 = Math.max(0, Number(fighter1.wins) || 0);
            const wins2 = Math.max(0, Number(fighter2.wins) || 0);
            const losses1 = Math.max(0, Number(fighter1.losses) || 0);
            const losses2 = Math.max(0, Number(fighter2.losses) || 0);
            const total1 = wins1 + losses1;
            const total2 = wins2 + losses2;
            const ratio1 = total1 ? wins1 / total1 : 0;
            const ratio2 = total2 ? wins2 / total2 : 0;
            const ratioGap = Math.abs(ratio1 - ratio2);
            const pin1 = Math.max(0, Number(fighter1.win_pinfall ?? fighter1.pin_wins) || 0);
            const pin2 = Math.max(0, Number(fighter2.win_pinfall ?? fighter2.pin_wins) || 0);
            const ko1 = Math.max(0, Number(fighter1.win_ko ?? fighter1.ko_wins) || 0);
            const ko2 = Math.max(0, Number(fighter2.win_ko ?? fighter2.ko_wins) || 0);
            const sub1 = Math.max(0, Number(fighter1.win_submission ?? fighter1.sub_wins) || 0);
            const sub2 = Math.max(0, Number(fighter2.win_submission ?? fighter2.sub_wins) || 0);
            const relativeGap = (a, b) => Math.abs(a - b) / Math.max(1, a, b);
            const winsGap = Math.abs(wins1 - wins2);
            const pinGap = Math.abs(pin1 - pin2);
            const koGap = Math.abs(ko1 - ko2);
            const subGap = Math.abs(sub1 - sub2);
            const similarWins = winsGap <= Math.max(2, Math.max(wins1, wins2) * 0.2);
            const similarPins = pinGap <= Math.max(1, Math.max(pin1, pin2) * 0.25);
            const similarKOs = koGap <= Math.max(1, Math.max(ko1, ko2) * 0.25);
            const similarSubs = subGap <= Math.max(1, Math.max(sub1, sub2) * 0.25);
            const balanceTier = ratioGap <= 0.15 ? 0 : (similarWins || similarPins || similarKOs || similarSubs ? 1 : 2);
            const score = ratioGap +
                relativeGap(wins1, wins2) * 0.45 +
                relativeGap(pin1, pin2) * 0.25 +
                relativeGap(ko1, ko2) * 0.25 +
                relativeGap(sub1, sub2) * 0.25;
            candidates.push({ pair: [fighter1, fighter2], balanceTier, score });
        }
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => a.balanceTier - b.balanceTier || a.score - b.score);
    const bestTier = candidates[0].balanceTier;
    const bestScore = candidates[0].score;
    const bestCandidates = candidates.filter(candidate =>
        candidate.balanceTier === bestTier && candidate.score <= bestScore + 0.08
    );
    return bestCandidates[Math.floor(Math.random() * bestCandidates.length)].pair;
}

function normalizeSmartBookGender(value) {
    return /^(f|female|w|woman|women)/i.test(String(value || '').trim()) ? 'female' : 'male';
}

function removeRetiredFightersFromActiveCard() {
    if (isShowCompleted(activeShowId)) return;
    refreshFightersFromStorage(true);

    document.querySelectorAll('.match-row').forEach(row => {
        if (!row.id || completedMatches[row.id]) return;

        const retiredSlots = ['slot1', 'slot2'].filter(slotName => {
            const input = row.querySelector(`.fighter-slot[id$="-${slotName}"] .fighter-search-input`);
            const currentName = input?.value.trim();
            if (!currentName) return false;

            const fighterId = input.getAttribute('data-fighter-id');
            const profile = fighters.find(fighter => fighter.name.trim().toLowerCase() === currentName.toLowerCase()) ||
                fighters.find(fighter => fighter.id === fighterId);
            return profile?.retired === true;
        });
        if (!retiredSlots.length) return;

        row.dataset.validationBatch = 'true';
        retiredSlots.forEach(slotName => {
            const slot = row.querySelector(`.fighter-slot[id$="-${slotName}"]`);
            const input = slot?.querySelector('.fighter-search-input');
            if (!slot || !input) return;
            input.value = '';
            input.setAttribute('data-fighter-id', '');
            const avatar = slot.querySelector('.avatar-box');
            if (avatar) {
                avatar.innerHTML = '👤';
                avatar.style.cssText = "width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b; overflow:hidden; cursor:pointer;";
            }
            updateFighterRecordDisplay(row.id, slotName, null);
            notifyFighterInputChanged(input);
        });
        delete row.dataset.validationBatch;
        updateWinnerDropdown(row.id);

        if (!window.randomizeMatchup(row.id, { automatic: true })) {
            console.warn(`Retired fighter cleanup could not find a replacement matchup for ${row.id}.`);
        }
    });

    saveCurrentCardDraft();
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

    customConfirm('Randomize all matches? This will replace all current fighters with random ones.', function(confirmed) {
        if (!confirmed) return;

        let successCount = 0;
        let failCount = 0;
        
        matchRows.forEach(row => {
            const matchId = row.id;
            if (!matchId) return;
            
            // Keep fighters booked on other rows unavailable while allowing this row to reroll its own picks.
            let bookedFighterIds = [];
            document.querySelectorAll('.fighter-search-input').forEach(inp => {
                if (inp.closest('.match-row') === row) return;
                const fighterId = inp.getAttribute('data-fighter-id');
                const typedName = inp.value.trim();
                const bookedFighter = fighterId
                    ? fighters.find(fighter => fighter.id === fighterId)
                    : fighters.find(fighter => normalizeLookupKey(fighter.name) === normalizeLookupKey(typedName));
                if (bookedFighter && !bookedFighterIds.includes(bookedFighter.id)) {
                    bookedFighterIds.push(bookedFighter.id);
                }
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
            
            const slot1 = document.getElementById(`${matchId}-slot1`);
            const slot2 = document.getElementById(`${matchId}-slot2`);
            if (!slot1 || !slot2) {
                failCount++;
                return;
            }

            const selectedGender = (slot1.dataset.gender || 'male').toLowerCase();
            const reservedPairs = new Set(getReservedOpponentPairsFromOtherShows());
            const availableFighters = fighters.filter(f =>
                f.retired !== true &&
                (f.gender || 'male').toLowerCase() === selectedGender &&
                !bookedFighterIds.includes(f.id)
            );
            const chosenPair = pickCompetitiveMatchup(availableFighters, reservedPairs);
            if (!chosenPair) {
                failCount++;
                return;
            }
            const [fighter1, fighter2] = chosenPair;
            
            // Set the gender for this match based on the chosen fighters
            setMatchRowSelectedGender(matchId, selectedGender);
            
            // Populate both slots
            {
                resetMatchValidationState(matchId);
                row.dataset.validationBatch = 'true';
                // Slot 1
                const input1 = slot1.querySelector('.fighter-search-input');
                input1.value = fighter1.name;
                input1.setAttribute('data-fighter-id', fighter1.id);
                notifyFighterInputChanged(input1);
                const av1 = slot1.querySelector('.avatar-box');
                const _eff1 = getEffectivePhotoFor(fighter1);
                av1.innerHTML = _eff1 ? `<img src="${_eff1}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">` : fighter1.name.charAt(0);
                av1.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
                av1.onclick = function(e) { e.stopPropagation(); uploadFighterPhotoFromCard(fighter1.id); };
                updateFighterRecordDisplay(matchId, 'slot1', fighter1);
                
                // Slot 2
                const input2 = slot2.querySelector('.fighter-search-input');
                input2.value = fighter2.name;
                input2.setAttribute('data-fighter-id', fighter2.id);
                notifyFighterInputChanged(input2);
                delete row.dataset.validationBatch;
                const av2 = slot2.querySelector('.avatar-box');
                const _eff2 = getEffectivePhotoFor(fighter2);
                av2.innerHTML = _eff2 ? `<img src="${_eff2}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">` : fighter2.name.charAt(0);
                av2.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
                av2.onclick = function(e) { e.stopPropagation(); uploadFighterPhotoFromCard(fighter2.id); };
                updateFighterRecordDisplay(matchId, 'slot2', fighter2);
                
                refreshTitleFightState(matchId);

                // Update winner dropdown
                updateWinnerDropdown(matchId);
                
                // Check for rematch warnings
                recheckMatchValidation(matchId, 'both');
                
                successCount++;
            }
        });
        
        // Save draft
        saveCurrentCardDraft();
        updateFighterScheduleLocator();
        
        const message = failCount > 0 
            ? `🎲 Randomized ${successCount} match${successCount !== 1 ? 'es' : ''}!\n\n⚠️ Could not randomize ${failCount} match${failCount !== 1 ? 'es' : ''} - not enough available fighters.`
            : `🎲 All ${successCount} match${successCount !== 1 ? 'es' : ''} randomized! Gender sliders updated.`;
        
        customAlert(message, 'Randomize Show');
    }, 'Randomize All');
};

window.smartBookFightCard = function() {
    if (!activeShowId || !futureShows.find(show => show.id === activeShowId)) {
        ensureActiveShowSelected();
    }
    if (!activeShowId) return customAlert('Select or create a show before smart booking a card.', 'Smart Book Card');
    if (isShowCompleted(activeShowId) || window.hasActiveShowResults()) {
        return customAlert('This show has already begun or been finalized. Reset the show or switch cards before smart booking.', 'Smart Book Disabled');
    }

    const getRows = containerId => {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('.match-row')).sort((a, b) => {
            const numberA = Number(a.id.match(/-m(\d+)$/)?.[1]) || 0;
            const numberB = Number(b.id.match(/-m(\d+)$/)?.[1]) || 0;
            return numberA - numberB;
        });
    };
    const tierRows = {
        mainEvent: getRows('mainEventContainer'),
        coMain: getRows('coMainContainer'),
        mainCard: getRows('mainCardContainer'),
        prelims: getRows('prelimsContainer'),
        earlyPrelims: getRows('earlyPrelimsContainer')
    };
    const allRows = Object.values(tierRows).flat();
    if (!allRows.length) return customAlert('No match rows are available to book.', 'Smart Book Card');

    const hasExistingBookings = allRows.some(row =>
        ['slot1', 'slot2'].some(slotType =>
            row.querySelector(`.fighter-slot[id$="-${slotType}"] .fighter-search-input`)?.value.trim()
        )
    );
    const startBooking = () => {
        refreshFightersFromStorage(true);
        const activeFighters = [];
        const fightersById = new Map();
        const fightersByName = new Map();
        const seenFighterKeys = new Set();
        fighters.forEach(fighter => {
            if (!fighter || fighter.retired === true || !fighter.name) return;
            const nameKey = normalizeLookupKey(fighter.name);
            if (!nameKey || seenFighterKeys.has(nameKey)) return;
            seenFighterKeys.add(nameKey);
            activeFighters.push(fighter);
            if (fighter.id) fightersById.set(String(fighter.id), fighter);
            fightersByName.set(nameKey, fighter);
        });
        if (activeFighters.length < 2) {
            return customAlert('At least two active fighters are required to build a card.', 'Smart Book Card');
        }
        if (typeof window.getDivisionRankings !== 'function') {
            return customAlert('Division rankings are not available. Load the rankings script before smart booking.', 'Smart Book Card');
        }

        const divisionRankings = window.getDivisionRankings();
        const rankLookup = typeof window.getDivisionRankLookup === 'function'
            ? window.getDivisionRankLookup(divisionRankings)
            : new Map();
        const rankByName = new Map();
        (Array.isArray(divisionRankings) ? divisionRankings : []).forEach(group => {
            (group.rankings || []).forEach(entry => {
                const key = normalizeLookupKey(entry.fighter?.name);
                if (key) rankByName.set(key, entry);
            });
        });
        const getRankEntry = fighter => {
            const key = normalizeLookupKey(fighter?.name);
            return rankByName.get(key) ||
                (fighter?.id && rankLookup.get(String(fighter.id))) ||
                (fighter?.name && rankLookup.get(`name:${String(fighter.name).trim().toLowerCase()}`)) ||
                null;
        };
        const getRankNumber = fighter => {
            const entry = getRankEntry(fighter);
            if (!entry || entry.rank === 'C') return null;
            if (Number.isInteger(entry.rankNumber)) return entry.rankNumber;
            const match = String(entry.rank || '').match(/^#(\d+)$/);
            return match ? Number(match[1]) : null;
        };
        const getStreak = fighter => {
            if (typeof window.getCurrentWinStreak === 'function') {
                return window.getCurrentWinStreak(fighter);
            }
            const wins = Math.max(0, Number(fighter?.wins) || 0);
            const losses = Math.max(0, Number(fighter?.losses) || 0);
            return losses === 0 ? wins : Math.max(0, Number(fighter?.win_streak) || 0);
        };
        const isTitleEligible = fighter => getTitleEligibilityStatus(fighter).eligible;
        const getRecord = fighter => ({
            wins: Math.max(0, Number(fighter?.wins) || 0),
            losses: Math.max(0, Number(fighter?.losses) || 0),
            draws: Math.max(0, Number(fighter?.draws) || 0)
        });
        const getLosingStreak = fighter => {
            const historyCandidates = [
                fighter.compiled_history_deck,
                fighter.history_deck,
                fighter.history
            ];
            const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0) ||
                historyCandidates.find(entries => Array.isArray(entries)) ||
                [];
            const outcomes = Array.isArray(history)
                ? history.map(entry => String(entry?.outcome || '').toLowerCase())
                    .filter(outcome => ['win', 'loss', 'draw'].includes(outcome))
                : [];
            if (outcomes.length) {
                let streak = 0;
                for (let index = outcomes.length - 1; index >= 0; index--) {
                    const outcome = outcomes[index];
                    if (outcome !== 'loss') break;
                    streak++;
                }
                return streak;
            }
            const record = getRecord(fighter);
            return record.losses > record.wins ? record.losses - record.wins : 0;
        };
        const getFighterScore = fighter => {
            const record = getRecord(fighter);
            const koWins = Math.max(0, Number(fighter.win_ko ?? fighter.ko_wins) || 0);
            const subWins = Math.max(0, Number(fighter.win_submission ?? fighter.sub_wins) || 0);
            return (getStreak(fighter) * 15) + (record.wins * 5) - (record.losses * 4) + ((koWins + subWins) * 1.5);
        };
        const getGroupKey = gender => normalizeSmartBookGender(gender);
        const getFighterGroupKey = fighter => getGroupKey(fighter.gender);
        const activeGroups = new Map();
        activeFighters.forEach(fighter => {
            const key = getFighterGroupKey(fighter);
            if (!activeGroups.has(key)) {
                activeGroups.set(key, {
                    gender: normalizeSmartBookGender(fighter.gender),
                    division: 'Open Weight',
                    fighters: []
                });
            }
            activeGroups.get(key).fighters.push(fighter);
        });

        let titles = [];
        try {
            const parsedTitles = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
            if (!Array.isArray(parsedTitles)) throw new Error('Championship data is not an array.');
            titles = parsedTitles.filter(title => title && title.id && title.name);
        } catch (error) {
            console.error('Unable to read championship belts for smart booking.', error);
            return customAlert('Championship data could not be read. No matches were changed.', 'Smart Book Card');
        }

        const currentChampionForTitle = title => {
            const identity = title.championId || title.champion;
            if (!identity) return { hasHolder: false, fighter: null };
            const id = typeof identity === 'object' ? String(identity.id || '') : '';
            const name = typeof identity === 'object' ? identity.name : identity;
            const normalizedName = normalizeLookupKey(name);
            if ((!id && !normalizedName) || /^(vacant|null)$/i.test(String(name || '').trim())) {
                return { hasHolder: false, fighter: null };
            }
            return {
                hasHolder: true,
                fighter: (id && fightersById.get(id)) || fightersByName.get(normalizedName) || null
            };
        };
        const latestOpponentKey = fighter => {
            const history = fighter?.compiled_history_deck || fighter?.history_deck || fighter?.history || [];
            if (!Array.isArray(history)) return '';
            for (let index = history.length - 1; index >= 0; index--) {
                const opponent = normalizeLookupKey(history[index]?.opponent);
                if (opponent) return opponent;
            }
            return '';
        };
        const isImmediateRematch = (fighterA, fighterB) => {
            const keyA = normalizeLookupKey(fighterA.name);
            const keyB = normalizeLookupKey(fighterB.name);
            return latestOpponentKey(fighterA) === keyB || latestOpponentKey(fighterB) === keyA;
        };
        const bookedKeys = new Set();
        const plannedBookings = new Map();
        const assignPair = (row, pair, title = null) => {
            if (!row || !pair || pair.length !== 2) return false;
            if (pair.some(fighter => !fighter || fighter.retired === true) ||
                getFighterGroupKey(pair[0]) !== getFighterGroupKey(pair[1])) return false;
            if (!isFightNightMatchupAllowed(pair[0], pair[1])) return false;
            const keys = pair.map(fighter => normalizeLookupKey(fighter.name));
            if (!keys[0] || !keys[1] || keys[0] === keys[1] ||
                bookedKeys.has(keys[0]) || bookedKeys.has(keys[1])) return false;
            bookedKeys.add(keys[0]);
            bookedKeys.add(keys[1]);
            plannedBookings.set(row.id, { row, pair, title });
            return true;
        };
        const findBestPair = (predicate, scorePair, options = {}) => {
            const groups = new Map();
            activeFighters.forEach(fighter => {
                const key = normalizeLookupKey(fighter.name);
                if (bookedKeys.has(key) ||
                    (!options.allowTitleEligible && showTier === 'fight_night' && isTitleEligible(fighter)) ||
                    !predicate(fighter)) return;
                const groupKey = getFighterGroupKey(fighter);
                if (!groups.has(groupKey)) groups.set(groupKey, []);
                groups.get(groupKey).push(fighter);
            });
            let best = null;
            groups.forEach(group => {
                group.sort((a, b) => String(a.name).localeCompare(String(b.name)));
                for (let first = 0; first < group.length; first++) {
                    for (let second = first + 1; second < group.length; second++) {
                        const pair = [group[first], group[second]];
                        if (!isFightNightMatchupAllowed(pair[0], pair[1])) continue;
                        const score = scorePair(pair[0], pair[1]);
                        const tieKey = `${normalizeLookupKey(pair[0].name)}|${normalizeLookupKey(pair[1].name)}`;
                        if (!best || score < best.score || (score === best.score && tieKey < best.tieKey)) {
                            best = { pair, score, tieKey };
                        }
                    }
                }
            });
            return best ? best.pair : null;
        };
        const rankScoreForPair = (fighterA, fighterB) => {
            const rankA = getRankNumber(fighterA) || 16;
            const rankB = getRankNumber(fighterB) || 16;
            return rankA + rankB + (Math.abs(rankA - rankB) * 0.5) -
                ((getStreak(fighterA) + getStreak(fighterB)) * 0.2);
        };
        const fallbackScoreForPair = (fighterA, fighterB) => {
            const recordA = getRecord(fighterA);
            const recordB = getRecord(fighterB);
            const fightsA = recordA.wins + recordA.losses + recordA.draws;
            const fightsB = recordB.wins + recordB.losses + recordB.draws;
            const rateA = fightsA ? (recordA.wins + recordA.draws * 0.5) / fightsA : 0;
            const rateB = fightsB ? (recordB.wins + recordB.draws * 0.5) / fightsB : 0;
            return rankScoreForPair(fighterA, fighterB) +
                (Math.abs(rateA - rateB) * 8) +
                (Math.abs(fightsA - fightsB) * 0.15);
        };
        const bookWithFallback = (row, idealPredicate, idealScore) => {
            if (!row || plannedBookings.has(row.id)) return false;
            let pair = findBestPair(idealPredicate, idealScore);
            if (pair && assignPair(row, pair)) return true;

            pair = findBestPair(() => true, fallbackScoreForPair);
            if (pair && assignPair(row, pair)) return true;

            pair = findBestPair(() => true, fallbackScoreForPair, { allowTitleEligible: true });
            return pair ? assignPair(row, pair) : false;
        };
        const getVacantTitlePair = (gender, allowRelaxedCandidates = false) => {
            const group = activeGroups.get(getGroupKey(gender));
            if (!group) return null;
            return findBestPair(fighter => {
                const rank = getRankEntry(fighter);
                return getFighterGroupKey(fighter) === getGroupKey(gender) &&
                    (!rank || rank.rank !== 'C') &&
                    (allowRelaxedCandidates || isTitleEligible(fighter));
            }, (a, b) => rankScoreForPair(a, b) -
                ((getFighterScore(a) + getFighterScore(b)) * 0.01));
        };
        const findTitleMatch = (title, allowRelaxedCandidates = false) => {
            const holderInfo = currentChampionForTitle(title);
            if (holderInfo.hasHolder && !holderInfo.fighter) return null;
            const champion = holderInfo.fighter;
            const gender = normalizeSmartBookGender(title.gender || champion?.gender);
            if (champion && normalizeSmartBookGender(champion.gender) !== gender) return null;
            if (champion && getFighterGroupKey(champion) !== getGroupKey(gender)) return null;

            if (champion) {
                if (!allowRelaxedCandidates && !isTitleEligible(champion)) return null;
                const candidates = (activeGroups.get(getGroupKey(gender))?.fighters || [])
                    .filter(fighter => {
                        const rank = getRankEntry(fighter);
                        const rankNumber = getRankNumber(fighter);
                        return normalizeLookupKey(fighter.name) !== normalizeLookupKey(champion.name) &&
                            !bookedKeys.has(normalizeLookupKey(fighter.name)) &&
                            !getSharedAllianceForFighters(champion, fighter) &&
                            (!rank || rank.rank !== 'C') &&
                            (allowRelaxedCandidates ||
                                (isTitleEligible(fighter) && rank && rankNumber !== null && rankNumber <= 15));
                    })
                    .sort((a, b) => {
                        const rankA = getRankNumber(a) || 16;
                        const rankB = getRankNumber(b) || 16;
                        return rankA - rankB || getFighterScore(b) - getFighterScore(a);
                    });
                const nonRematchTopFive = candidates.filter(fighter =>
                    getRankNumber(fighter) <= 5 && !isImmediateRematch(champion, fighter)
                );
                const challenger = nonRematchTopFive[0] || candidates[0];
                return challenger ? { pair: [champion, challenger] } : null;
            }

            const pair = getVacantTitlePair(gender, allowRelaxedCandidates);
            return pair ? { pair } : null;
        };
        const currentShow = futureShows.find(show => show.id === activeShowId);
        const showTier = getShowTier(currentShow);
        const mainEventRow = tierRows.mainEvent[0];
        const coMainRow = tierRows.coMain[0];
        if (showTier === 'ppv' && titles.length) {
            const titleRows = [mainEventRow, coMainRow].filter(Boolean)
                .slice(0, titles.length >= 2 ? 2 : 1);
            const titleCandidates = titles.map(title => ({
                title,
                holder: currentChampionForTitle(title)
            })).sort((a, b) =>
                Number(b.holder.hasHolder) - Number(a.holder.hasHolder) ||
                String(a.title.name).localeCompare(String(b.title.name))
            );
            for (const candidate of titleCandidates) {
                if (plannedBookings.size >= titleRows.length) break;
                const titleMatch = findTitleMatch(candidate.title);
                if (!titleMatch) continue;
                assignPair(titleRows[plannedBookings.size], titleMatch.pair, candidate.title);
            }
            for (const candidate of titleCandidates) {
                if (plannedBookings.size >= titleRows.length) break;
                const titleMatch = findTitleMatch(candidate.title, true);
                if (!titleMatch) continue;
                const row = titleRows.find(titleRow => !plannedBookings.has(titleRow.id));
                if (row) assignPair(row, titleMatch.pair, candidate.title);
            }
        }

        const mainEventEligible = showTier === 'fight_night'
            ? fighter => {
                const rank = getRankNumber(fighter);
                return rank !== null && rank <= 5 && getStreak(fighter) > 0;
            }
            : fighter => {
                const rank = getRankNumber(fighter);
                return (rank !== null && rank <= 15) || getStreak(fighter) >= 2;
            };
        bookWithFallback(mainEventRow, mainEventEligible, rankScoreForPair);

        const mainCardEligible = fighter => {
            const rank = getRankNumber(fighter);
            return (rank !== null && rank <= 15) || getStreak(fighter) >= 2;
        };
        tierRows.coMain.forEach(row => bookWithFallback(row, mainCardEligible, rankScoreForPair));
        tierRows.mainCard.forEach(row => bookWithFallback(row, mainCardEligible, rankScoreForPair));

        tierRows.prelims.forEach(row => {
            bookWithFallback(row, fighter => {
                const record = getRecord(fighter);
                return record.wins + record.losses + record.draws > 0 && record.wins >= record.losses;
            }, (a, b) => {
                const recordA = getRecord(a);
                const recordB = getRecord(b);
                const rateA = recordA.wins / Math.max(1, recordA.wins + recordA.losses + recordA.draws);
                const rateB = recordB.wins / Math.max(1, recordB.wins + recordB.losses + recordB.draws);
                const fightsA = recordA.wins + recordA.losses + recordA.draws;
                const fightsB = recordB.wins + recordB.losses + recordB.draws;
                return (Math.abs(rateA - rateB) * 10) +
                    (Math.abs(fightsA - fightsB) * 0.15) +
                    (Math.abs(recordA.wins - recordB.wins) * 0.1);
            });
        });

        tierRows.earlyPrelims.forEach(row => {
            let pair = findBestPair(fighter => {
                const record = getRecord(fighter);
                return record.wins === 0 && record.losses === 0 && record.draws === 0;
            }, () => 0);
            if (!pair) {
                pair = findBestPair(fighter => getLosingStreak(fighter) > 0,
                    (a, b) => Math.abs(getLosingStreak(a) - getLosingStreak(b)) -
                        ((getLosingStreak(a) + getLosingStreak(b)) * 0.1));
            }
            if (pair && assignPair(row, pair)) return;
            pair = findBestPair(() => true, fallbackScoreForPair);
            if (pair && assignPair(row, pair)) return;
            pair = findBestPair(() => true, fallbackScoreForPair, { allowTitleEligible: true });
            if (pair) assignPair(row, pair);
        });

        if (!plannedBookings.size) {
            return customAlert('No eligible same-gender open-weight matchups were found. Your current card was left unchanged.', 'Smart Book Card');
        }

        const allCurrentRows = Object.values(tierRows).flat();
        allCurrentRows.forEach(row => {
            clearCardFighterSlot(row.id, 'slot1');
            clearCardFighterSlot(row.id, 'slot2');
        });

        plannedBookings.forEach(({ row, pair, title }) => {
            row.dataset.validationBatch = 'true';
            delete row.dataset.smartBookedTitle;
            resetMatchValidationState(row.id);
            setMatchRowSelectedGender(row.id, normalizeSmartBookGender(pair[0].gender));
            ['slot1', 'slot2'].forEach((slotType, index) => {
                const fighter = pair[index];
                const slot = document.getElementById(`${row.id}-${slotType}`);
                const input = slot?.querySelector('.fighter-search-input');
                const avatar = slot?.querySelector('.avatar-box');
                if (!slot || !input || !avatar) return;
                input.value = fighter.name;
                input.setAttribute('data-fighter-id', fighter.id || '');
                const photo = getEffectivePhotoFor(fighter);
                avatar.innerHTML = photo
                    ? `<img src="${photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;">`
                    : fighter.name.charAt(0);
                avatar.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
                avatar.onclick = function(event) {
                    event.stopPropagation();
                    if (fighter.id) uploadFighterPhotoFromCard(fighter.id);
                };
                applyStreakPortraitClass(slot.querySelector('.avatar-frame'), fighter);
                notifyFighterInputChanged(input);
                updateFighterRecordDisplay(row.id, slotType, fighter);
            });
            delete row.dataset.validationBatch;

            const titleCheckbox = document.getElementById(`${row.id}-title-check`);
            const titleInput = document.getElementById(`${row.id}-title-name-input`);
            if (title && titleCheckbox && titleInput) {
                row.dataset.smartBookedTitle = 'true';
                titleCheckbox.checked = true;
                titleCheckbox.disabled = false;
                titleInput.style.display = 'inline-block';
                populateTitleDropdown(row.id);
                let selectedOption = Array.from(titleInput.options).find(option =>
                    option.value === String(title.id)
                );
                if (!selectedOption) {
                    selectedOption = document.createElement('option');
                    selectedOption.value = String(title.id);
                    selectedOption.textContent = title.name;
                    selectedOption.setAttribute('data-name', title.name);
                    titleInput.appendChild(selectedOption);
                }
                selectedOption.disabled = false;
                titleInput.value = String(title.id);
                applyMatchRowTitleGlow(row);
                updateTitleDefenseMilestone(row.id);
            } else {
                delete row.dataset.smartBookedTitle;
                if (titleCheckbox) titleCheckbox.checked = false;
                if (titleInput) {
                    titleInput.style.display = 'none';
                    titleInput.value = '';
                }
                refreshTitleFightState(row.id);
            }
            updateWinnerDropdown(row.id);
            recheckMatchValidation(row.id, 'both');
        });

        saveCurrentCardDraft();
        if (typeof window.refreshDivisionRankings === 'function') {
            window.refreshDivisionRankings();
        }
        refreshFightCardPortraits().catch(error =>
            console.warn('Unable to refresh portraits after smart booking.', error)
        );
        updateFinalizedShowDropdownStyles();
        updateFinalizeButtonState();
        updateRandomizerState();
        updateFighterScheduleLocator();

        const titleCount = Array.from(plannedBookings.values()).filter(booking => booking.title).length;
        customAlert(
            `🧠 Smart booked ${plannedBookings.size} of ${allRows.length} matchups${titleCount ? `, including ${titleCount} title fight${titleCount === 1 ? '' : 's'}` : ''}.`,
            'Smart Book Card'
        );
    };

    if (hasExistingBookings) {
        customConfirm(
            'Smart Book Card will replace the current matchups on this show. Continue?',
            confirmed => { if (confirmed) startBooking(); },
            'Smart Book Card'
        );
    } else {
        startBooking();
    }
};

window.randomizeMatchup = function(matchId, options = {}) {
    const row = document.getElementById(matchId);
    if (isShowCompleted(activeShowId) || (!options.automatic && window.hasActiveShowResults()) ||
        (options.automatic && completedMatches[matchId])) {
        return customAlert('This show has already begun or been finalized. Reset the show or switch cards before randomizing.', 'Randomize Disabled');
    }
    const slot1 = document.getElementById(`${matchId}-slot1`);
    const slot2 = document.getElementById(`${matchId}-slot2`);
    
    if (!slot1 || !slot2) return customAlert('Match row not found.', 'Match Error');

    const performRandomization = function(confirmed) {
        if (!confirmed) return;

        // Keep fighters booked on other rows unavailable while allowing this row to reroll its own picks.
        let bookedFighterIds = [];
        const reservedPairs = new Set(getReservedOpponentPairsFromOtherShows());
        document.querySelectorAll('.fighter-search-input').forEach(inp => {
            if (inp.closest('.match-row') === row) return;
            const fighterId = inp.getAttribute('data-fighter-id');
            const typedName = inp.value.trim();
            const found = fighterId
                ? fighters.find(fighter => fighter.id === fighterId)
                : fighters.find(fighter => normalizeLookupKey(fighter.name) === normalizeLookupKey(typedName));
            if (found && !bookedFighterIds.includes(found.id)) {
                bookedFighterIds.push(found.id);
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
        
        const selectedGender = (slot1.dataset.gender || 'male').toLowerCase();
        const availableFighters = fighters.filter(f =>
            f.retired !== true &&
            (f.gender || 'male').toLowerCase() === selectedGender &&
            !bookedFighterIds.includes(f.id)
        );

        const chosenPair = pickCompetitiveMatchup(availableFighters, reservedPairs);
        if (!chosenPair) {
            return customAlert(`No fresh open-weight matchup is available for the ${selectedGender} division. Check booking and rematch restrictions.`, 'Randomize Matchup');
        }

        const [fighter1, fighter2] = chosenPair;
        resetMatchValidationState(matchId);
        row.dataset.validationBatch = 'true';
        
        // Populate slot 1
        const input1 = slot1.querySelector('.fighter-search-input');
        input1.value = fighter1.name;
        input1.setAttribute('data-fighter-id', fighter1.id);
        notifyFighterInputChanged(input1);
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
        notifyFighterInputChanged(input2);
        delete row.dataset.validationBatch;
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

        // Check the newly injected pair against both warning systems
        recheckMatchValidation(matchId, 'both');

        // Update winner dropdown
        updateWinnerDropdown(matchId);
        
        // Save draft
        saveCurrentCardDraft();
        updateFighterScheduleLocator();
        
        // Show confirmation
        if (!options.automatic) {
            customAlert(`🎲 Randomized!\n\n${fighter1.name} vs ${fighter2.name}\n(Open Weight · ${selectedGender === 'female' ? "Women's" : "Men's"} Division)`, 'Match Randomized');
        }
        return true;
    };

    if (options.automatic) {
        return performRandomization(true);
    }
    return customConfirm('Randomize this match? Current fighters will be replaced.', performRandomization, 'Randomize Match');
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
        if (c.retired === true) return;
        if (normalizeSmartBookGender(c.gender) !== normalizeSmartBookGender(f1.gender)) return;
        if (!isFightNightMatchupAllowed(f1, c)) return;

        // Check if fighter is already booked in another match (unless they're the current opponent)
        const isBookedElsewhere = bookedFighterIds.includes(c.id);
        if (isBookedElsewhere && !(currentOpponentId && c.id === currentOpponentId)) {
            return; // skip already-booked fighters
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
            const totalWins = Math.max(0, Number(c.wins || 0));
            const koWins = Math.min(Math.max(0, Number(c.win_ko || 0)), totalWins);
            const subWins = Math.min(Math.max(0, Number(c.win_submission || 0)), totalWins - koWins);
            const totalStandardWins = totalWins - koWins - subWins;
            
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
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${totalStandardWins}</span>PIN</div>
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${koWins}</span>KO</div>
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${subWins}</span>SUB</div>
              </div>
              <button onclick="bookSuggested('${c.id}')" style="width:100%; background:#10b981; border:none; color:white; font-weight:bold; padding:8px; border-radius:6px; margin-top:14px; font-size:0.75rem; cursor:pointer;">Book Fight</button>`;
            grid.appendChild(card);
        });
    }
    document.getElementById('suggestionModal').style.display = 'flex';
};

window.bookSuggested = function(fId) {
    if (!activeMatchId) return;
    const row = document.getElementById(activeMatchId);
    const slot2 = document.getElementById(`${activeMatchId}-slot2`);
    const input2 = slot2.querySelector('.fighter-search-input');
    const f2 = fighters.find(f => f.id === fId);
    if (input2 && f2) {
        resetMatchValidationState(activeMatchId);
        row.dataset.validationBatch = 'true';
        input2.value = f2.name;
        input2.setAttribute('data-fighter-id', f2.id);
        notifyFighterInputChanged(input2);
        delete row.dataset.validationBatch;
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
        recheckMatchValidation(activeMatchId, 'slot2');
        saveCurrentCardDraft();
    }
    window.closeSuggestionModal();
};
function getFighterDivisionRank(fighter, rankings = window.getDivisionRankings()) {
    for (const group of rankings) {
        const entry = group.rankings.find(item =>
            (fighter.id && String(item.fighter.id) === String(fighter.id)) ||
            normalizeLookupKey(item.fighter.name) === normalizeLookupKey(fighter.name)
        );
        if (entry) return entry.rank;
    }
    return '';
}

function getMatchUpsetStatus(winner, loser, rankings = window.getDivisionRankings()) {
    const winnerRank = getFighterDivisionRank(winner, rankings);
    const loserRank = getFighterDivisionRank(loser, rankings);
    const winnerRankNumber = Number(String(winnerRank).match(/^#(\d+)$/)?.[1]) || 0;
    const loserRankNumber = Number(String(loserRank).match(/^#(\d+)$/)?.[1]) || 0;
    const reasons = [];

    if (loserRank === 'C' &&
        (!winnerRank || (winnerRankNumber >= 8 && winnerRankNumber <= 15))) {
        reasons.push('Defeated Champion (C)');
    }
    if (loserRankNumber >= 1 && loserRankNumber <= 3 &&
        (!winnerRank || (winnerRankNumber >= 11 && winnerRankNumber <= 15))) {
        reasons.push(`Defeated #${loserRankNumber} Contender`);
    }

    const opponentStreak = typeof window.getCurrentWinStreak === 'function'
        ? window.getCurrentWinStreak(loser)
        : Math.max(0, Number(loser.win_streak) || 0);
    if (opponentStreak >= 10) reasons.push(`Snapped ${opponentStreak}W Streak`);

    return {
        upsetAlert: reasons.length > 0,
        upsetReason: reasons.join('; ')
    };
}

function normalizePerformanceBonusType(value) {
    const bonusType = String(value || '').trim().toUpperCase();
    return bonusType === 'FOTN' || bonusType === 'POTN' ? bonusType : '';
}

function adjustPerformanceBonusCounter(fighter, bonusType, delta) {
    if (!fighter) return;
    if (bonusType === 'FOTN') {
        fighter.fotn_bonuses = Math.max(0, Math.floor(Number(fighter.fotn_bonuses) || 0) + delta);
    } else if (bonusType === 'POTN') {
        fighter.potn_bonuses = Math.max(0, Math.floor(Number(fighter.potn_bonuses) || 0) + delta);
    }
    fighter.career_bonuses =
        Math.max(0, Math.floor(Number(fighter.fotn_bonuses) || 0)) +
        Math.max(0, Math.floor(Number(fighter.potn_bonuses) || 0));
}

function setMatchBonusDisplay(matchRowId, state) {
    const bonusType = normalizePerformanceBonusType(state?.bonusType);
    const controls = document.getElementById(`${matchRowId}-performance-bonus-controls`);
    const select = document.getElementById(`${matchRowId}-performance-bonus`);
    const badge = document.getElementById(`${matchRowId}-performance-bonus-badge`);
    if (controls) controls.hidden = !(state?.winnerName && state?.loserName);
    if (select) {
        select.value = bonusType;
        select.disabled = false;
        select.style.pointerEvents = 'auto';
    }
    if (!badge) return;
    badge.hidden = !bonusType;
    badge.className = `performance-bonus-pill${bonusType ? ` performance-bonus-pill--${bonusType.toLowerCase()}` : ''}`;
    badge.textContent = bonusType === 'FOTN'
        ? '🏆 FOTN'
        : bonusType === 'POTN'
            ? '💥 POTN'
            : '';
}

function updateFighterHistoryBonusType(fighter, outcome, opponentName, state, bonusType, showNameAliases = []) {
    const historyKeys = ['compiled_history_deck', 'history_deck', 'history'];
    const normalize = value => normalizeLookupKey(value);
    const showNames = new Set([state.showName, ...showNameAliases].map(normalize));
    historyKeys.forEach(key => {
        if (!Array.isArray(fighter[key])) return;
        fighter[key].forEach(entry => {
            if (!entry || typeof entry !== 'object') return;
            if (String(entry.outcome || '').toLowerCase() !== outcome ||
                normalize(entry.opponent) !== normalize(opponentName) ||
                !showNames.has(normalize(entry.showName)) ||
                normalize(entry.method) !== normalize(state.methodName) ||
                (Number(entry.rematchNumber) || 0) !== (Number(state.rematchNumber) || 0)) return;
            if (bonusType) entry.bonusType = bonusType;
            else delete entry.bonusType;
        });
    });
}

window.setMatchBonus = function(matchRowId, value) {
    const requestedType = String(value || '').trim().toUpperCase();
    if (requestedType && requestedType !== 'FOTN' && requestedType !== 'POTN') {
        return customAlert('Choose a valid performance bonus.', 'Award Bonus');
    }
    const bonusType = normalizePerformanceBonusType(requestedType);
    const currentState = completedMatches[matchRowId];
    if (!currentState || !currentState.winnerName || !currentState.loserName) {
        return customAlert('Log a match result before awarding a performance bonus.', 'Award Bonus');
    }
    const previousType = normalizePerformanceBonusType(currentState.bonusType);
    if (previousType === bonusType) {
        setMatchBonusDisplay(matchRowId, currentState);
        return;
    }

    const matchesStorageKey = getActiveShowMatchesStorageKey();
    if (!matchesStorageKey) {
        return customAlert('Select a show before awarding a performance bonus.', 'Award Bonus');
    }

    try {
        const updatedFighters = fighters.map(fighter => ({
            ...fighter,
            fotn_bonuses: Math.max(0, Math.floor(Number(fighter.fotn_bonuses) || 0)),
            potn_bonuses: Math.max(0, Math.floor(Number(fighter.potn_bonuses) || 0)),
            compiled_history_deck: Array.isArray(fighter.compiled_history_deck)
                ? fighter.compiled_history_deck.map(entry => ({ ...entry }))
                : fighter.compiled_history_deck,
            history_deck: Array.isArray(fighter.history_deck)
                ? fighter.history_deck.map(entry => ({ ...entry }))
                : fighter.history_deck,
            history: Array.isArray(fighter.history)
                ? fighter.history.map(entry => ({ ...entry }))
                : fighter.history
        }));
        updatedFighters.forEach(fighter => {
            fighter.career_bonuses = fighter.fotn_bonuses + fighter.potn_bonuses;
        });
        const findFighter = (fighterId, fighterName) => updatedFighters.find(fighter =>
            (fighterId && String(fighter.id) === String(fighterId)) ||
            normalizeLookupKey(fighter.name) === normalizeLookupKey(fighterName)
        );
        const winner = findFighter(currentState.winnerId, currentState.winnerName);
        const loser = findFighter(currentState.loserId, currentState.loserName);
        if (!winner || !loser) throw new Error('Could not resolve both fighters for this match.');
        const eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
        if (!Array.isArray(eventHistory)) throw new Error('Archived event history has an unexpected format.');
        const archivedEvent = eventHistory.find(event =>
            event.showId === activeShowId &&
            Array.isArray(event.matches) &&
            event.matches.some(match => match.matchId === matchRowId)
        );
        const archivedShowName = archivedEvent && (archivedEvent.showTitle || archivedEvent.name);

        const applyBonus = (type, delta) => {
            if (type === 'FOTN') {
                adjustPerformanceBonusCounter(winner, type, delta);
                adjustPerformanceBonusCounter(loser, type, delta);
            } else if (type === 'POTN') {
                adjustPerformanceBonusCounter(winner, type, delta);
            }
        };
        applyBonus(previousType, -1);
        applyBonus(bonusType, 1);
        updateFighterHistoryBonusType(winner, 'win', loser.name, currentState, bonusType, [archivedShowName]);
        updateFighterHistoryBonusType(loser, 'loss', winner.name, currentState, bonusType, [archivedShowName]);

        const savedMatches = JSON.parse(localStorage.getItem(matchesStorageKey) || '{}');
        if (!savedMatches || typeof savedMatches !== 'object' || Array.isArray(savedMatches)) {
            throw new Error('Saved match data has an unexpected format.');
        }
        const updatedState = { ...currentState };
        if (bonusType) updatedState.bonusType = bonusType;
        else delete updatedState.bonusType;
        savedMatches[matchRowId] = updatedState;

        let archivedMatchFound = false;
        const updatedEvents = eventHistory.map(event => {
            if (event.showId !== activeShowId || !Array.isArray(event.matches)) return event;
            let eventChanged = false;
            const matches = event.matches.map(match => {
                if (match.matchId !== matchRowId) return match;
                archivedMatchFound = true;
                eventChanged = true;
                const updatedMatch = { ...match };
                if (bonusType) updatedMatch.bonusType = bonusType;
                else delete updatedMatch.bonusType;
                return updatedMatch;
            });
            return eventChanged ? { ...event, matches } : event;
        });
        if (isShowCompleted(activeShowId) && !archivedMatchFound) {
            throw new Error('The archived match could not be found, so its bonus was not changed.');
        }

        const updates = new Map([
            ['wwe_fighters', JSON.stringify(updatedFighters)],
            [matchesStorageKey, JSON.stringify(savedMatches)]
        ]);
        if (archivedMatchFound) updates.set('wwe_event_history', JSON.stringify(updatedEvents));
        const previousValues = new Map();
        updates.forEach((_, key) => previousValues.set(key, localStorage.getItem(key)));
        const writtenKeys = [];
        try {
            updates.forEach((storedValue, key) => {
                localStorage.setItem(key, storedValue);
                writtenKeys.push(key);
            });
        } catch (error) {
            writtenKeys.reverse().forEach(key => {
                const previousValue = previousValues.get(key);
                try {
                    if (previousValue === null) localStorage.removeItem(key);
                    else localStorage.setItem(key, previousValue);
                } catch (rollbackError) {
                    console.error(`Unable to restore ${key} after a failed bonus update.`, rollbackError);
                }
            });
            throw error;
        }

        fighters = updatedFighters;
        window.fighters = fighters;
        completedMatches[matchRowId] = updatedState;
        setMatchBonusDisplay(matchRowId, updatedState);
        window.dispatchEvent(new CustomEvent('wwe_fighters:changed', {
            detail: { source: 'cards.js-bonus', count: updatedFighters.length }
        }));
    } catch (error) {
        console.error('Unable to save the performance bonus.', error);
        setMatchBonusDisplay(matchRowId, currentState);
        customAlert(`${error.message || 'The bonus could not be saved.'} No changes were kept.`, 'Award Bonus');
    }
};

function readTournamentArchiveForCard() {
    let raw;
    try {
        raw = localStorage.getItem('universeTournaments');
    } catch (error) {
        console.error('Unable to access the tournament archive from Fight Cards.', error);
        return null;
    }
    if (raw === null) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Tournament archive data must be an array.');
        return parsed;
    } catch (error) {
        console.error('Unable to read the tournament archive from Fight Cards.', error);
        return null;
    }
}

function getTournamentMatchForCard(archive, tournamentId, tournamentMatchId) {
    const tournament = archive.find(entry => String(entry?.id || '') === String(tournamentId || ''));
    if (!tournament || !Array.isArray(tournament.rounds)) return null;
    for (let roundIndex = 0; roundIndex < tournament.rounds.length; roundIndex++) {
        const matches = tournament.rounds[roundIndex]?.matches || [];
        const matchIndex = matches.findIndex(match => String(match?.id || '') === String(tournamentMatchId || ''));
        if (matchIndex >= 0) {
            return { tournament, roundIndex, matchIndex, match: matches[matchIndex] };
        }
    }
    return null;
}

function awardTournamentBeltFromCard(tournament, winner) {
    if (!tournament.prizeTitleId) return true;
    let titles;
    try {
        titles = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
        if (!Array.isArray(titles)) throw new Error('Championship data must be an array.');
    } catch (error) {
        console.error('Unable to read the tournament championship prize.', error);
        return false;
    }
    const title = titles.find(entry =>
        String(entry?.id || '') === String(tournament.prizeTitleId) &&
        entry.retired !== true &&
        entry.active !== false
    );
    if (!title) {
        console.warn(`Tournament prize ${tournament.prizeTitleName || tournament.prizeTitleId} is no longer active.`);
        return true;
    }
    const currentChampionId = String(title.championId || title.champion?.id || '');
    if (currentChampionId !== String(winner.id || '')) {
        tournament.prizeUndoSnapshot = {
            championId: title.championId,
            championName: title.championName,
            champion: title.champion,
            defenses: title.defenses,
            currentReignDefenses: title.currentReignDefenses,
            history: Array.isArray(title.history) ? JSON.parse(JSON.stringify(title.history)) : []
        };
        if (currentChampionId && Array.isArray(title.history) && title.history.length) {
            const priorReign = title.history[title.history.length - 1];
            if (String(priorReign?.fighterId || priorReign?.championId || '') === currentChampionId) {
                priorReign.defenses = Math.max(
                    0,
                    Number(title.defenses ?? title.currentReignDefenses) || 0,
                    Number(priorReign.reignDefenses ?? priorReign.defenses) || 0
                );
                priorReign.reignDefenses = priorReign.defenses;
            }
        }
        if (!Array.isArray(title.history)) title.history = [];
        title.history.push({
            fighterId: String(winner.id || ''),
            wrestlerName: String(winner.name || ''),
            showTitle: `Tournament: ${tournament.name}`,
            winMethod: 'Grand Prix Victory',
            defenses: 0,
            reignDefenses: 0
        });
        title.championId = String(winner.id || '');
        title.championName = String(winner.name || '');
        if (title.champion && typeof title.champion === 'object') {
            title.champion = { ...title.champion, id: String(winner.id || ''), name: String(winner.name || '') };
        } else if (typeof title.champion === 'string') {
            title.champion = String(winner.name || '');
        }
        title.defenses = 0;
        title.currentReignDefenses = 0;
    }
    try {
        localStorage.setItem('wwe_titles', JSON.stringify(titles));
    } catch (error) {
        console.error('Unable to award tournament championship prize from Fight Cards.', error);
        return false;
    }
    window.dispatchEvent(new CustomEvent('wwe_titles:changed'));
    return true;
}

function updateTournamentFromFightCard(matchState, undo = false) {
    const tournamentId = String(matchState?.tournamentId || '');
    const tournamentMatchId = String(matchState?.tournamentMatchId || '');
    if (!tournamentId || !tournamentMatchId) return;
    const archive = readTournamentArchiveForCard();
    if (!archive) return;
    const location = getTournamentMatchForCard(archive, tournamentId, tournamentMatchId);
    if (!location) {
        console.warn(`Tournament match ${tournamentMatchId} could not be found while updating Fight Card results.`);
        return;
    }
    const { tournament, roundIndex, matchIndex, match } = location;
    const loggedFighters = [matchState.slot1Id, matchState.slot2Id].map(String).sort();
    const bracketFighters = (match.fighters || []).map(fighter => String(fighter?.fighterId || '')).sort();
    const loggedNames = [matchState.slot1Name, matchState.slot2Name]
        .map(name => String(name || '').trim().toLowerCase()).sort();
    const bracketNames = (match.fighters || [])
        .map(fighter => String(fighter?.name || '').trim().toLowerCase()).sort();
    const samePair = loggedFighters.every(Boolean) && bracketFighters.every(Boolean)
        ? loggedFighters[0] === bracketFighters[0] && loggedFighters[1] === bracketFighters[1]
        : loggedNames[0] === bracketNames[0] && loggedNames[1] === bracketNames[1];

    if (!undo) {
        if (tournament.status !== 'active' || !samePair) {
            console.warn(`Fight Card result did not match active tournament matchup ${tournamentMatchId}; bracket was not advanced.`);
            return;
        }
        if (match.winnerId) {
            if (String(match.winnerId) !== String(matchState.winnerId || '') ||
                match.winnerSource !== 'fight-card') {
                console.warn(`Tournament matchup ${tournamentMatchId} already has a winner; Fight Card result was not applied.`);
            }
            return;
        }
        const winner = (match.fighters || []).find(fighter =>
            String(fighter?.fighterId || '') === String(matchState.winnerId || '') ||
            String(fighter?.name || '').trim().toLowerCase() === String(matchState.winnerName || '').trim().toLowerCase()
        );
        if (!winner) {
            console.warn(`Fight Card winner is not part of tournament matchup ${tournamentMatchId}.`);
            return;
        }
        match.winnerId = String(winner.fighterId || matchState.winnerId || '');
        match.winnerName = String(winner.name || matchState.winnerName || '');
        match.winnerSource = 'fight-card';
        match.booked = {
            ...(match.booked || {}),
            showName: String(matchState.showName || match.booked?.showName || ''),
            cardMatchId: String(matchState.cardMatchId || match.booked?.cardMatchId || ''),
            status: 'completed'
        };
        const nextRound = tournament.rounds[roundIndex + 1];
        if (nextRound) {
            const nextMatch = nextRound.matches[Math.floor(matchIndex / 2)];
            const nextSlot = matchIndex % 2;
            nextMatch.fighters[nextSlot] = { ...winner };
            nextMatch.sourceMatchIds[nextSlot] = match.id;
        } else {
            tournament.status = 'completed';
            tournament.completedAt = new Date().toISOString();
            tournament.championId = match.winnerId;
            tournament.championName = match.winnerName;
            tournament.completionSource = 'fight-card';
            tournament.completionMatchId = match.id;
            const winnerFighter = fighters.find(fighter =>
                String(fighter.id || '') === String(match.winnerId) ||
                String(fighter.name || '').trim().toLowerCase() === String(match.winnerName || '').trim().toLowerCase()
            );
            if (winnerFighter) awardTournamentBeltFromCard(tournament, winnerFighter);
        }
    } else {
        if (match.winnerSource !== 'fight-card' ||
            String(match.winnerId || '') !== String(matchState.winnerId || '')) return;
        match.winnerId = '';
        match.winnerName = '';
        match.winnerSource = '';
        if (match.booked) match.booked.status = 'booked';
        const nextRound = tournament.rounds[roundIndex + 1];
        if (nextRound) {
            const nextMatch = nextRound.matches[Math.floor(matchIndex / 2)];
            const nextSlot = matchIndex % 2;
            if (String(nextMatch.sourceMatchIds?.[nextSlot] || '') === String(match.id)) {
                nextMatch.fighters[nextSlot] = null;
                nextMatch.sourceMatchIds[nextSlot] = '';
                if (nextMatch.winnerId) {
                    nextMatch.winnerId = '';
                    nextMatch.winnerName = '';
                    nextMatch.winnerSource = '';
                }
            }
        } else if (tournament.completionSource === 'fight-card' &&
            String(tournament.completionMatchId || '') === String(match.id)) {
            const undoState = tournament.prizeUndoSnapshot;
            if (undoState && tournament.prizeTitleId) {
                try {
                    const titles = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
                    const title = Array.isArray(titles) && titles.find(entry =>
                        String(entry?.id || '') === String(tournament.prizeTitleId) &&
                        String(entry.championId || entry.champion?.id || '') === String(tournament.championId || '')
                    );
                    if (title) {
                        ['championId', 'championName', 'champion', 'defenses', 'currentReignDefenses'].forEach(key => {
                            if (Object.prototype.hasOwnProperty.call(undoState, key)) title[key] = undoState[key];
                            else delete title[key];
                        });
                        title.history = undoState.history || [];
                        localStorage.setItem('wwe_titles', JSON.stringify(titles));
                        window.dispatchEvent(new CustomEvent('wwe_titles:changed'));
                    }
                } catch (error) {
                    console.error('Unable to undo tournament championship prize.', error);
                }
            }
            tournament.status = 'active';
            tournament.completedAt = '';
            tournament.championId = '';
            tournament.championName = '';
            tournament.completionSource = '';
            tournament.completionMatchId = '';
            delete tournament.prizeUndoSnapshot;
        }
    }

    try {
        localStorage.setItem('universeTournaments', JSON.stringify(archive));
        window.dispatchEvent(new CustomEvent('universe:tournaments-updated'));
    } catch (error) {
        console.error('Unable to update tournament bracket from Fight Card result.', error);
    }
}

window.logMatchResult = function(id) {
    if (!activeShowId || !futureShows.find(s => s.id === activeShowId)) {
        ensureActiveShowSelected();
    }
    if (!activeShowId) return customAlert('No active show is selected. Please select or create a show before logging results.', 'Log Match Result');

    const row = document.getElementById(id); 
    const slot1 = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
    const winSelect = document.getElementById(`${id}-winner-select`); 
    const methodSelect = document.getElementById(`${id}-method-select`);
    
    if (!slot1 || !slot2 || !slot1.value || !slot2.value) return customAlert('Select both fighters before logging finishes!', 'Log Match Result');
    if (!winSelect || !winSelect.value) return customAlert('Please choose who won the fight!', 'Log Match Result');
    if (!methodSelect || !methodSelect.value) return customAlert('Please choose the method of victory!', 'Log Match Result');

    const resolveFighterInput = (input) => {
        const idValue = input.getAttribute('data-fighter-id');
        const nameValue = input.value.trim();
        let fighter = null;
        if (idValue) {
            fighter = fighters.find(f => f.id === idValue);
        }
        if (!fighter && nameValue) {
            fighter = getFighterByIdOrName(nameValue);
            if (fighter) {
                input.setAttribute('data-fighter-id', fighter.id);
            }
        }
        return fighter;
    };

    let f1 = resolveFighterInput(slot1);
    let f2 = resolveFighterInput(slot2);
    if (!f1 || !f2) return customAlert('Unable to resolve both fighters. Please select each fighter from the search results.', 'Log Match Result');

    let w = (winSelect.value === '1') ? f1 : f2; 
    let l = (winSelect.value === '1') ? f2 : f1;
    
    if (!w || !l) return customAlert('Please choose a valid winner before logging the result.', 'Log Match Result');
    if (typeof w[methodSelect.value] === 'undefined') return customAlert('The selected win method is invalid.', 'Log Match Result');
    const loggedAt = new Date().toISOString();
    const bossSlain = l.is_boss === true && w.is_boss !== true;

    if (typeof window.getDivisionRankings !== 'function') {
        return customAlert('Division rankings are unavailable, so the upset status could not be checked. Please reload the page and try again.', 'Log Match Result');
    }
    const rankings = window.getDivisionRankings();
    const upsetStatus = getMatchUpsetStatus(w, l, rankings);
    const opponentRank = String(getFighterDivisionRank(l, rankings) || '');
    const opponentRankNumber = Number(opponentRank.match(/^#(\d+)$/)?.[1]) || 0;
    const defeatedRankedOpponent = opponentRank === 'C' ||
        (opponentRankNumber >= 1 && opponentRankNumber <= 15);
    const fightTime = window.stopMatchTimer(id);
    const fightTimeMs = parseMatchFightTime(fightTime);
    const titleRules = getCardsTitleRules();
    const titleWinMinimum = titleRules.initialTitleWins;
    const titleCheck = document.getElementById(`${id}-title-check`);
    const titleInput = document.getElementById(`${id}-title-name-input`);
    const isTitleMatch = !!titleCheck?.checked;
    let currentReignDefenses = 0;
    if (isTitleMatch && titleInput?.value) {
        try {
            currentReignDefenses = getDominantTitleLossDefenseCount(l, titleInput.value);
        } catch (error) {
            console.error('Unable to verify title reign defenses before logging the match.', error);
            return customAlert('The current title reign could not be verified. No result was logged.', 'Title Gate');
        }
    }
    const dominantExChampionException = isTitleMatch && currentReignDefenses >= 3;
    const winnerWinStreakBefore = Math.max(0, Math.floor(Number(w.win_streak) || 0));
    const winnerLoseStreakBefore = Math.max(0, Math.floor(Number(w.lose_streak) || 0));
    const loserWinStreakBefore = Math.max(0, Math.floor(Number(l.win_streak) || 0));
    const loserLoseStreakBefore = Math.max(0, Math.floor(Number(l.lose_streak) || 0));
    const winnerRebuildWinsRequiredBefore = Math.max(0, Math.floor(Number(w.rebuild_wins_required) || 0));
    const loserRebuildWinsRequiredBefore = Math.max(0, Math.floor(Number(l.rebuild_wins_required) || 0));
    const winnerDominantExChampionRebuildBefore = w.dominant_ex_champ_rebuild === true;
    const loserDominantExChampionRebuildBefore = l.dominant_ex_champ_rebuild === true;
    const winnerRebuildLossCountBefore = getCardsRebuildLossCount(w, winnerRebuildWinsRequiredBefore);
    const loserRebuildLossCountBefore = getCardsRebuildLossCount(l, loserRebuildWinsRequiredBefore);
    const winnerTitleComebackCompletedBefore = w.title_comeback_completed === true;
    const loserTitleComebackCompletedBefore = l.title_comeback_completed === true;
    w.wins++;
    w.win_streak = Number(w.win_streak || 0) + 1;
    w.peak_win_streak = getCardsCareerPeakWinStreak(w);
    w.lose_streak = 0;
    applyTitleGateWin(w, titleRules);
    w[methodSelect.value]++; 
    l.losses++;
    l.win_streak = 0;
    l.lose_streak = loserLoseStreakBefore + 1;
    applyTitleGateLoss(l, titleRules, dominantExChampionException);
    w.fast_tracked = false;
    l.fast_tracked = false;
    const winnerActiveStreak = typeof window.getCurrentWinStreak === 'function'
        ? window.getCurrentWinStreak(w)
        : Math.max(0, Number(w.win_streak) || 0);
    const fastTrackAlert = defeatedRankedOpponent &&
        fightTimeMs > 0 &&
        fightTimeMs < 3 * 60 * 1000 &&
        !(Number(w.wins) >= titleWinMinimum && winnerActiveStreak > 0);
    if (fastTrackAlert) w.fast_tracked = true;

    const methodName = methodSelect.options[methodSelect.selectedIndex].text;
    const currentShow = futureShows.find(s => s.id === activeShowId);
    const showName = currentShow?.name || document.getElementById('eventNameInput')?.value.trim() || 'Show';
    const pastFightsCount = getPastFightsCount(w, l);
    const rivalryStatus = getRivalryStatus(f1, f2);
    const isRematch = pastFightsCount > 0;
    const rematchNumber = isRematch ? pastFightsCount + 1 : 0;
    updateRematchIndicator(id, pastFightsCount, rematchNumber);

    if (!w.compiled_history_deck) w.compiled_history_deck = [];
    if (!l.compiled_history_deck) l.compiled_history_deck = [];

    const winnerHistoryEntry = {
        outcome: 'win',
        opponent: l.name,
        method: methodName,
        showName,
        loggedAt,
        isRematch,
        rivalryTag: rivalryStatus.rivalryTag,
        upsetAlert: upsetStatus.upsetAlert,
        upsetReason: upsetStatus.upsetReason,
        fastTrackAlert,
        bossSlain,
        bossSlainName: bossSlain ? l.name : '',
        shortNotice: row?.dataset.shortNotice === 'true',
        shortNoticeFighter: row?.dataset.shortNoticeFighter || '',
        bonusType: '',
        rematchNumber: rematchNumber,
        rematchNumberIsMeeting: true,
        winStreak: Number(w.win_streak) || 0,
        winStreakBefore: winnerWinStreakBefore,
        rebuildWinsRequired: Math.max(0, Math.floor(Number(w.rebuild_wins_required) || 0)),
        rebuildWinsRequiredBefore: winnerRebuildWinsRequiredBefore,
        rebuildLossCount: Math.max(0, Math.floor(Number(w.rebuild_loss_count) || 0)),
        rebuildLossCountBefore: winnerRebuildLossCountBefore,
        dominantExChampionException: false,
        dominantExChampionRebuild: w.dominant_ex_champ_rebuild === true,
        dominantExChampionRebuildBefore: winnerDominantExChampionRebuildBefore,
        titleComebackCompleted: w.title_comeback_completed === true,
        titleComebackCompletedBefore: winnerTitleComebackCompletedBefore,
        loseStreak: 0,
        loseStreakBefore: winnerLoseStreakBefore,
        fightTime
    };
    const loserHistoryEntry = {
        outcome: 'loss',
        opponent: w.name,
        method: methodName,
        showName,
        loggedAt,
        isRematch,
        rivalryTag: rivalryStatus.rivalryTag,
        upsetAlert: upsetStatus.upsetAlert,
        upsetReason: upsetStatus.upsetReason,
        bossSlain,
        bossSlainName: bossSlain ? l.name : '',
        shortNotice: row?.dataset.shortNotice === 'true',
        shortNoticeFighter: row?.dataset.shortNoticeFighter || '',
        bonusType: '',
        rematchNumber: rematchNumber,
        rematchNumberIsMeeting: true,
        winStreak: 0,
        winStreakBefore: loserWinStreakBefore,
        rebuildWinsRequired: Math.max(0, Math.floor(Number(l.rebuild_wins_required) || 0)),
        rebuildWinsRequiredBefore: loserRebuildWinsRequiredBefore,
        rebuildLossCount: Math.max(0, Math.floor(Number(l.rebuild_loss_count) || 0)),
        rebuildLossCountBefore: loserRebuildLossCountBefore,
        dominantExChampionException,
        dominantExChampionRebuild: l.dominant_ex_champ_rebuild === true,
        dominantExChampionRebuildBefore: loserDominantExChampionRebuildBefore,
        titleComebackCompleted: l.title_comeback_completed === true,
        titleComebackCompletedBefore: loserTitleComebackCompletedBefore,
        loseStreak: Number(l.lose_streak) || 0,
        loseStreakBefore: loserLoseStreakBefore,
        fightTime
    };

    const winnerAlreadyLogged = w.compiled_history_deck.some(entry => entry.outcome === 'win' && entry.opponent === l.name && entry.showName === showName && entry.method === methodName && entry.rematchNumber === rematchNumber);
    const loserAlreadyLogged = l.compiled_history_deck.some(entry => entry.outcome === 'loss' && entry.opponent === w.name && entry.showName === showName && entry.method === methodName && entry.rematchNumber === rematchNumber);

    if (upsetStatus.upsetAlert && !winnerAlreadyLogged) {
        w.giant_kills = Math.max(0, Math.floor(Number(w.giant_kills) || 0)) + 1;
    }
    if (bossSlain && !winnerAlreadyLogged) {
        w.boss_slays = Math.max(0, Math.floor(Number(w.boss_slays) || 0)) + 1;
    }
    if (!winnerAlreadyLogged) w.compiled_history_deck.push(winnerHistoryEntry);
    if (!loserAlreadyLogged) l.compiled_history_deck.push(loserHistoryEntry);

    saveFighters(fighters);
    updateFighterRecordDisplay(id, 'slot1', f1);
    updateFighterRecordDisplay(id, 'slot2', f2);
    
    if (isTitleMatch) {
        w.total_title_fights = Number(w.total_title_fights ?? w.title_fights) || 0;
        l.total_title_fights = Number(l.total_title_fights ?? l.title_fights) || 0;
        w.total_title_fights += 1;
        l.total_title_fights += 1;
        w.title_fights = Number(w.title_fights) + 1 || 1;
        l.title_fights = Number(l.title_fights) + 1 || 1;
        saveFighters(fighters);
    }
    const rowGender = document.getElementById(`${id}-slot1`)?.getAttribute('data-gender') || document.getElementById(`${id}-slot2`)?.getAttribute('data-gender') || 'male';
    let matchSaveState = {
        winnerId: w.id,
        loserId: l.id,
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
        loggedAt,
        isTitle: isTitleMatch,
        titleId: '',
        titleName: '',
        titleRetained: false,
        totalTitleFightAppearanceCounted: isTitleMatch,
        isRematch,
        rivalryTag: rivalryStatus.rivalryTag,
        rivalryKind: rivalryStatus.rivalryKind,
        rivalryLabel: rivalryStatus.label,
        upsetAlert: upsetStatus.upsetAlert,
        upsetReason: upsetStatus.upsetReason,
        fastTrackAlert,
        bossSlain,
        bossSlainName: bossSlain ? l.name : '',
        shortNotice: row?.dataset.shortNotice === 'true',
        shortNoticeFighter: row?.dataset.shortNoticeFighter || '',
        tournamentId: row?.dataset.tournamentId || '',
        tournamentMatchId: row?.dataset.tournamentMatchId || '',
        cardMatchId: id,
        winnerWinStreakBefore,
        winnerLoseStreakBefore,
        loserWinStreakBefore,
        loserLoseStreakBefore,
        winnerRebuildWinsRequiredBefore,
        loserRebuildWinsRequiredBefore,
        winnerDominantExChampionRebuildBefore,
        loserDominantExChampionRebuildBefore,
        winnerRebuildLossCountBefore,
        loserRebuildLossCountBefore,
        winnerRebuildWinsRequired: Math.max(0, Math.floor(Number(w.rebuild_wins_required) || 0)),
        loserRebuildWinsRequired: Math.max(0, Math.floor(Number(l.rebuild_wins_required) || 0)),
        winnerDominantExChampionRebuild: w.dominant_ex_champ_rebuild === true,
        loserDominantExChampionRebuild: l.dominant_ex_champ_rebuild === true,
        dominantExChampionException,
        winnerRebuildLossCount: Math.max(0, Math.floor(Number(w.rebuild_loss_count) || 0)),
        loserRebuildLossCount: Math.max(0, Math.floor(Number(l.rebuild_loss_count) || 0)),
        winnerTitleComebackCompletedBefore,
        loserTitleComebackCompletedBefore,
        winnerTitleComebackCompleted: w.title_comeback_completed === true,
        loserTitleComebackCompleted: l.title_comeback_completed === true,
        rematchNumber: rematchNumber,
        rematchNumberIsMeeting: true,
        fightTime
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
                    defenses: 0,
                    currentReignDefenses: 0
                };
                championshipsRegistry.push(targetBelt);
            }

            const previousChampionId = String(
                targetBelt.championId ||
                (targetBelt.champion && typeof targetBelt.champion === 'object'
                    ? targetBelt.champion.id || targetBelt.champion.name
                    : targetBelt.champion) ||
                ''
            );
            const previousReign = Array.isArray(targetBelt.history)
                ? [...targetBelt.history].reverse().find(entry => entry && entry.wrestlerName)
                : null;
            const priorHolderName = previousChampionId || (previousReign && previousReign.wrestlerName);
            const previousChampion = fighters.find(fighter =>
                fighter.id === priorHolderName ||
                String(fighter.name || '').trim().toLowerCase() === String(priorHolderName || '').trim().toLowerCase()
            );
            const previousChampionName = previousChampion ? previousChampion.name : priorHolderName;
            const isRetained = previousChampionId === w.id ||
                String(previousChampionName || '').trim().toLowerCase() === String(w.name || '').trim().toLowerCase();
            matchSaveState.previousTitleChampionId = previousChampion?.id || previousChampionId;
            matchSaveState.previousTitleDefenses = Math.max(
                0,
                Number(targetBelt.defenses ?? targetBelt.currentReignDefenses) || 0
            );
            const winMethodText = methodSelect.value.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');
            // Score title fight/defense stats for this specific belt
            try {
                if (isRetained) {
                    // winner was already champion -> increment defenses for this belt
                    targetBelt.defenses = Math.max(0, Number(targetBelt.defenses ?? targetBelt.currentReignDefenses) || 0) + 1;
                    targetBelt.currentReignDefenses = targetBelt.defenses;
                    w.defenses = (Number(w.defenses) || 0) + 1;
                    w.lifetime_defenses = (Number(w.lifetime_defenses) || 0) + 1;
                    matchSaveState.titleRetained = true;
                    matchSaveState.lifetimeDefenseCounted = true;
                    matchSaveState.titleDefenseNumber = targetBelt.defenses;
                    const milestone = window.getDefenseMilestone?.(targetBelt.defenses);
                    matchSaveState.titleMilestoneUnlocked = [3, 5, 10].includes(targetBelt.defenses);
                    matchSaveState.titleMilestoneLabel = matchSaveState.titleMilestoneUnlocked
                        ? milestone?.label || ''
                        : '';
                    window.recordTitleReignDefenses?.(targetBelt, w, targetBelt.defenses, {
                        showTitle: showName,
                        winMethod: winMethodText
                    });
                } else {
                    // new champion or contested match -> reset defenses for this belt
                    const priorDefenseCount = Math.max(
                        0,
                        Number(targetBelt.defenses ?? targetBelt.currentReignDefenses) || 0
                    );
                    if (previousChampionId && typeof window.recordTitleReignDefenses === 'function') {
                        window.recordTitleReignDefenses(
                            targetBelt,
                            previousChampion || { id: '', name: String(previousChampionName || '') },
                            priorDefenseCount
                        );
                    }
                    targetBelt.defenses = 0;
                    targetBelt.currentReignDefenses = 0;
                    matchSaveState.titleRetained = false;
                }
            } catch (err) {
                console.error('Error updating roster title stats', err);
            }
            if (!isRetained) {
                // push new reign
                targetBelt.history = targetBelt.history || [];
                targetBelt.history.push({
                    fighterId: w.id,
                    wrestlerName: w.name,
                    showTitle: showName,
                    winMethod: winMethodText,
                    defenses: 0,
                    reignDefenses: 0
                });
            }
            targetBelt.championId = w.id;
            targetBelt.currentReignDefenses = Number(targetBelt.defenses) || 0;
            localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
            window.dispatchEvent(new CustomEvent('wwe_titles:changed'));
            // Update fighters storage with any modified defense counts
            saveFighters(fighters);
        } catch (e) {
            console.error('Error applying title transfer', e);
        }
    }
    completedMatches[id] = matchSaveState; 
    const storageKey = getActiveShowMatchesStorageKey();
    if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(completedMatches));
    }
    updateTournamentFromFightCard(matchSaveState);

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
            window.updateBettingMoney(winnings);
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
    clearRematchWarningStorage(id);
    clearWarningMatchState(id);
    clearDuplicateApproval(id);
    sessionStorage.removeItem(`match_${id}_rematch_warning_active`);
    sessionStorage.removeItem(`match_${id}_variant_approved`);
    delete activeRematchWarnings[id];
    if (row) delete row.dataset.rematchPending;
    if (typeof window.savePoundForPoundHistory === 'function') {
        window.savePoundForPoundHistory();
    }
    refreshFightCardView().catch(error => console.warn('Unable to refresh fight-card view after logging a result.', error));
};

function restoreWinStreakAfterUnlog(fighter) {
    if (!fighter) return;
    const losses = Number(fighter.losses || 0);
    if (losses === 0) {
        fighter.win_streak = Number(fighter.wins || 0);
        return;
    }

    const historyCandidates = [
        fighter.compiled_history_deck,
        fighter.history_deck,
        fighter.history
    ];
    const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0) ||
        historyCandidates.find(entries => Array.isArray(entries)) ||
        [];
    let streak = 0;
    for (let index = history.length - 1; index >= 0; index--) {
        if (String(history[index]?.outcome || '').toLowerCase() !== 'win') break;
        streak++;
    }
    fighter.win_streak = streak;
}

function restoreTitleGateAfterUnlog(fighter, fallbackState) {
    if (!fighter) return;
    const historyCandidates = [
        fighter.compiled_history_deck,
        fighter.history_deck,
        fighter.history
    ];
    const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0) ||
        historyCandidates.find(entries => Array.isArray(entries)) ||
        [];
    let required = 0;
    let lossCount = 0;
    let streak = 0;
    let comebackCompleted = false;
    let dominantExChampionRebuild = false;
    const rules = getCardsTitleRules();
    history.forEach(entry => {
        const outcome = String(entry?.outcome || '').toLowerCase();
        if (outcome === 'loss') {
            lossCount++;
            dominantExChampionRebuild = entry.dominantExChampionException === true;
            required = dominantExChampionRebuild
                ? 1
                : getCardsRebuildWinsRequired(lossCount, rules);
            streak = 0;
            comebackCompleted = false;
        } else if (outcome === 'win') {
            streak++;
            if (required > 0 && streak >= required) {
                required = 0;
                lossCount = 0;
                comebackCompleted = true;
                dominantExChampionRebuild = false;
            } else if (required === 0 && streak >= rules.initialTitleWins) {
                comebackCompleted = false;
            }
        }
    });
    if (!history.some(entry => ['win', 'loss'].includes(String(entry?.outcome || '').toLowerCase())) && fallbackState) {
        required = Math.max(0, Math.floor(Number(fallbackState.rebuildWinsRequired) || 0));
        lossCount = getCardsRebuildLossCount(fallbackState, required);
        comebackCompleted = fallbackState.titleComebackCompleted === true;
        dominantExChampionRebuild = fallbackState.dominantExChampionRebuild === true;
    }
    fighter.rebuild_wins_required = required;
    fighter.rebuild_loss_count = lossCount;
    fighter.title_comeback_completed = comebackCompleted;
    fighter.dominant_ex_champ_rebuild = dominantExChampionRebuild;
}

function restoreLoseStreakAfterUnlog(fighter, fallbackStreak) {
    if (!fighter) return;
    if (fallbackStreak !== undefined && fallbackStreak !== null && fallbackStreak !== '') {
        fighter.lose_streak = Math.max(0, Math.floor(Number(fallbackStreak) || 0));
        return;
    }
    const historyCandidates = [
        fighter.compiled_history_deck,
        fighter.history_deck,
        fighter.history
    ];
    const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0) ||
        historyCandidates.find(entries => Array.isArray(entries)) ||
        [];
    if (!Array.isArray(history) || !history.some(entry =>
        ['win', 'loss'].includes(String(entry?.outcome || '').toLowerCase())
    )) {
        fighter.lose_streak = Math.max(0, Math.floor(Number(fallbackStreak) || 0));
        return;
    }

    let streak = 0;
    for (let index = history.length - 1; index >= 0; index--) {
        if (String(history[index]?.outcome || '').toLowerCase() !== 'loss') break;
        streak++;
    }
    fighter.lose_streak = streak;
}

function restoreFastTrackedStatusFromHistory(fighter) {
    if (!fighter) return;
    const history = fighter.compiled_history_deck || fighter.history_deck || fighter.history || [];
    const latestEntry = Array.isArray(history) ? history[history.length - 1] : null;
    fighter.fast_tracked = latestEntry?.fastTrackAlert === true &&
        String(latestEntry.outcome || '').toLowerCase() === 'win';
}

window.unlogMatchResult = function(id) {
    if (!activeShowId || !futureShows.find(s => s.id === activeShowId)) {
        ensureActiveShowSelected();
    }
    if (!activeShowId) return customAlert('No active show is selected. Please select or create a show before unlogging results.', 'Unlog Match Result');

    const savedMatch = completedMatches[id];
    if (!savedMatch) return;

    const normalizeFighterName = name => String(name || '').trim().toLowerCase();
    const findSavedFighter = (id, name) => fighters.find(fighter =>
        (id && fighter.id === id) || normalizeFighterName(fighter.name) === normalizeFighterName(name)
    );
    const winner = findSavedFighter(savedMatch.winnerId, savedMatch.winnerName);
    const loser = findSavedFighter(savedMatch.loserId, savedMatch.loserName);
    const bonusType = normalizePerformanceBonusType(savedMatch.bonusType);

    if (winner) {
        winner.wins = Math.max(0, Number(winner.wins || 0) - 1);
        if (savedMatch.bossSlain === true) {
            winner.boss_slays = Math.max(0, Math.floor(Number(winner.boss_slays) || 0) - 1);
        }
        if (savedMatch.upsetAlert === true) {
            winner.giant_kills = Math.max(0, Math.floor(Number(winner.giant_kills) || 0) - 1);
        }
        if (savedMatch.methodId && typeof winner[savedMatch.methodId] !== 'undefined') {
            winner[savedMatch.methodId] = Math.max(0, Number(winner[savedMatch.methodId] || 0) - 1);
        }
        if (bonusType === 'POTN') adjustPerformanceBonusCounter(winner, bonusType, -1);
        if (winner.compiled_history_deck) {
            winner.compiled_history_deck = winner.compiled_history_deck.filter(entry => {
                return !(entry.outcome === 'win' && entry.opponent === savedMatch.loserName && entry.showName === savedMatch.showName && entry.method === savedMatch.methodName && entry.rematchNumber === savedMatch.rematchNumber);
            });
            restoreWinStreakAfterUnlog(winner);
            restoreTitleGateAfterUnlog(winner, {
                rebuildWinsRequired: savedMatch.winnerRebuildWinsRequiredBefore,
                rebuild_loss_count: savedMatch.winnerRebuildLossCountBefore,
                titleComebackCompleted: savedMatch.winnerTitleComebackCompletedBefore,
                dominantExChampionRebuild: savedMatch.winnerDominantExChampionRebuildBefore
            });
        }
        restoreLoseStreakAfterUnlog(winner, savedMatch.winnerLoseStreakBefore);
        restoreFastTrackedStatusFromHistory(winner);
        if (savedMatch.lifetimeDefenseCounted === true && winner) {
            winner.lifetime_defenses = Math.max(0, Number(winner.lifetime_defenses || 0) - 1);
            savedMatch.lifetimeDefenseCounted = false;
        }
    }
    if (loser) {
        loser.losses = Math.max(0, Number(loser.losses || 0) - 1);
        if (bonusType === 'FOTN') adjustPerformanceBonusCounter(loser, bonusType, -1);
        if (loser.compiled_history_deck) {
            loser.compiled_history_deck = loser.compiled_history_deck.filter(entry => {
                return !(entry.outcome === 'loss' && entry.opponent === savedMatch.winnerName && entry.showName === savedMatch.showName && entry.method === savedMatch.methodName && entry.rematchNumber === savedMatch.rematchNumber);
            });
        }
        restoreWinStreakAfterUnlog(loser);
        restoreTitleGateAfterUnlog(loser, {
            rebuildWinsRequired: savedMatch.loserRebuildWinsRequiredBefore,
            rebuild_loss_count: savedMatch.loserRebuildLossCountBefore,
            titleComebackCompleted: savedMatch.loserTitleComebackCompletedBefore,
            dominantExChampionRebuild: savedMatch.loserDominantExChampionRebuildBefore
        });
        restoreLoseStreakAfterUnlog(loser, savedMatch.loserLoseStreakBefore);
        restoreFastTrackedStatusFromHistory(loser);
    }
    if (savedMatch.isTitle && savedMatch.totalTitleFightAppearanceCounted === true) {
        if (winner) {
            winner.total_title_fights = Math.max(0, Number(winner.total_title_fights || 0) - 1);
            winner.title_fights = Math.max(0, Number(winner.title_fights || 0) - 1);
        }
        if (loser) {
            loser.total_title_fights = Math.max(0, Number(loser.total_title_fights || 0) - 1);
            loser.title_fights = Math.max(0, Number(loser.title_fights || 0) - 1);
        }
    }

    if (savedMatch.isTitle && savedMatch.titleId) {
        try {
            const championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];
            const targetBelt = championshipsRegistry.find(b => b.id === savedMatch.titleId);
            if (targetBelt) {
                const wasChampion = targetBelt.championId === (winner?.id || '') ||
                    normalizeFighterName(targetBelt.championId) === normalizeFighterName(winner?.name);
                if (wasChampion) {
                    targetBelt.defenses = Math.max(0, Number(targetBelt.defenses || 0) - 1);
                    targetBelt.currentReignDefenses = targetBelt.defenses;
                    if (savedMatch.titleRetained === true && winner) {
                        winner.defenses = Math.max(0, Number(winner.defenses || 0) - 1);
                    }
                }
                if (savedMatch.titleRetained !== true && targetBelt.history && targetBelt.history.length) {
                    targetBelt.history = targetBelt.history.filter(entry =>
                        !(normalizeFighterName(entry.wrestlerName) === normalizeFighterName(winner?.name) &&
                            normalizeFighterName(entry.showTitle) === normalizeFighterName(savedMatch.showName) &&
                            normalizeFighterName(entry.winMethod) === normalizeFighterName(savedMatch.methodName))
                    );
                }
                if (wasChampion) {
                    const priorReign = [...(targetBelt.history || [])].reverse().find(entry => entry && entry.wrestlerName);
                    const priorChampion = priorReign && fighters.find(fighter =>
                        (priorReign.fighterId && String(fighter.id) === String(priorReign.fighterId)) ||
                        normalizeFighterName(fighter.name) === normalizeFighterName(priorReign.wrestlerName)
                    );
                    if (savedMatch.titleRetained === true && winner) {
                        targetBelt.championId = winner.id;
                        if (typeof window.recordTitleReignDefenses === 'function') {
                            window.recordTitleReignDefenses(targetBelt, winner, targetBelt.defenses);
                        }
                    } else {
                        targetBelt.championId = savedMatch.previousTitleChampionId ||
                            (priorChampion ? priorChampion.id : String(priorReign?.fighterId || ''));
                        targetBelt.defenses = Math.max(0, Number(
                            savedMatch.previousTitleDefenses ??
                            priorReign?.reignDefenses ??
                            priorReign?.defenses
                        ) || 0);
                        targetBelt.currentReignDefenses = targetBelt.defenses;
                    }
                }
                localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
                window.dispatchEvent(new CustomEvent('wwe_titles:changed'));
            }
        } catch (err) {
            console.error('Error undoing title result', err);
        }
    }
    if (bonusType === 'FOTN' && winner) adjustPerformanceBonusCounter(winner, bonusType, -1);

    saveFighters(fighters);
    if (winner) refreshFighterRecordDisplaysForId(winner.id);
    if (loser) refreshFighterRecordDisplaysForId(loser.id);
    updateTournamentFromFightCard(savedMatch, true);
    delete completedMatches[id];
    const storageKey = getActiveShowMatchesStorageKey();
    if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(completedMatches));
    }

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
        const winSelect = document.getElementById(`${id}-winner-select`);
        const methodSelect = document.getElementById(`${id}-method-select`);
        if (winSelect) winSelect.value = '';
        if (methodSelect) methodSelect.value = '';
        setMatchBonusDisplay(id, {});
        updateWinnerDropdown(id);
    }

    refreshFightCardPortraits().catch(() => {});

    updateFinalizeButtonState();
    updateRandomizerState();
};

function getFinalizeEventButton() {
    return document.getElementById('finalizeEventButton');
}

window.hasActiveShowResults = function() {
    const storageKey = getActiveShowMatchesStorageKey();
    if (!storageKey) return false;
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
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
    refreshShowStateFromStorage();
    const button = getFinalizeEventButton();
    const activeShowCompleted = isShowCompleted(activeShowId);
    if (!button) return;

    const eventNameInput = getEventNameInput();
    const eventNameValue = eventNameInput?.value.trim() || '';
    if (eventNameInput && activeShowId) {
        const currentShow = futureShows.find(s => s.id === activeShowId);
        if (currentShow && currentShow.name && !eventNameInput.value.trim()) {
            eventNameInput.value = currentShow.name;
        }
    }
    const allMatchRows = Array.from(document.querySelectorAll('.match-row'));
    const activeShowSavedData = JSON.parse(localStorage.getItem(getActiveShowMatchesStorageKey() || '')) || {};
    const savedResultEntries = Object.entries(activeShowSavedData).filter(([id, saved]) => {
        return !!saved && !!saved.winnerName && !!saved.loserName && !!saved.methodName;
    });
    const incompleteSavedEntries = Object.entries(activeShowSavedData).filter(([id, saved]) => {
        return !saved || !saved.winnerName || !saved.loserName || !saved.methodName;
    });
    const hasLoggedResult = savedResultEntries.length > 0;
    const canEnable = !activeShowCompleted && eventNameValue.length > 0 && hasLoggedResult && incompleteSavedEntries.length === 0;
    button.disabled = !canEnable;
    button.style.opacity = canEnable ? '1' : '0.55';
    button.style.cursor = canEnable ? 'pointer' : 'not-allowed';
    if (activeShowCompleted) {
        button.title = 'This show has already been finalized and archived.';
    } else if (!eventNameValue) {
        button.title = 'Enter an Event/Show Title Name before finalizing.';
    } else if (!hasLoggedResult) {
        button.title = `Log at least one match before finalizing this card.`;
    } else if (incompleteSavedEntries.length > 0) {
        button.title = `Finish saving the current result before finalizing (${savedResultEntries.length}/${savedResultEntries.length + incompleteSavedEntries.length} complete).`;
    } else {
        button.title = 'Finalize and archive the event.';
    }
};

function normalizeArchivedMethod(method) {
    const value = String(method || '').trim().toLowerCase();
    if (value === 'win_pinfall') return 'pinfall';
    if (value === 'win_ko') return 'ko/tko';
    if (value === 'win_submission') return 'submission';
    return value;
}

function findArchivedTitleForMatch(match, titles) {
    if (match.titleId) {
        const byId = titles.find(title => title && title.id === match.titleId);
        if (byId) return byId;
    }
    const name = String(match.customTitleName || match.titleName || '').trim().toLowerCase();
    return name ? titles.find(title => title && String(title.name || '').trim().toLowerCase() === name) : null;
}

function rebuildArchivedTitleState(title, remainingEvents, remainingHistory, fallbackMatch) {
    const state = { championId: '', defenses: 0 };
    const orderedEvents = remainingEvents
        .map((event, index) => ({
            event,
            index,
            timestamp: Date.parse(event.completedAt || event.date || '')
        }))
        .sort((a, b) => Number.isFinite(a.timestamp) && Number.isFinite(b.timestamp)
            ? a.timestamp - b.timestamp || a.index - b.index
            : a.index - b.index);

    orderedEvents.forEach(({ event }) => {
        const showName = event.showTitle || event.name || '';
        event.matches.forEach(match => {
            if (!match || !match.isTitle || findArchivedTitleForMatch(match, [title]) !== title) return;
            const winnerName = match.winner || match.winnerName || '';
            const loserName = match.loser || match.loserName || '';
            const winner = fighters.find(fighter => fighter.id === match.winnerId || fighter.name === winnerName);
            const loser = fighters.find(fighter => fighter.id === match.loserId || fighter.name === loserName);
            if (!winner) return;

            const transferLogged = remainingHistory.some(entry =>
                entry &&
                String(entry.wrestlerName || '').trim().toLowerCase() === String(winner.name).trim().toLowerCase() &&
                String(entry.showTitle || '').trim().toLowerCase() === String(showName).trim().toLowerCase() &&
                normalizeArchivedMethod(entry.winMethod) === normalizeArchivedMethod(match.method || match.methodId)
            );

            if (match.titleRetained === true) {
                state.championId = winner.id;
                state.defenses += 1;
            } else if (match.titleRetained === false || transferLogged) {
                state.championId = winner.id;
                state.defenses = 0;
            } else if (state.championId && state.championId === winner.id) {
                state.defenses += 1;
            } else if (state.championId && loser && state.championId === loser.id) {
                state.championId = winner.id;
                state.defenses = 0;
            } else if (!state.championId) {
                state.championId = winner.id;
            }
        });
    });

    if (!state.championId) {
        const lastReign = remainingHistory[remainingHistory.length - 1];
        const previousChampion = lastReign && fighters.find(fighter =>
            String(fighter.name || '').trim().toLowerCase() === String(lastReign.wrestlerName || '').trim().toLowerCase()
        );
        if (previousChampion) state.championId = previousChampion.id;
        else if (fallbackMatch) {
            const fallbackName = fallbackMatch.titleRetained === true
                ? fallbackMatch.winner || fallbackMatch.winnerName
                : fallbackMatch.titleRetained === false
                    ? fallbackMatch.loser || fallbackMatch.loserName
                    : '';
            const fallbackId = fallbackMatch.titleRetained === true
                ? fallbackMatch.winnerId
                : fallbackMatch.titleRetained === false
                    ? fallbackMatch.loserId
                    : '';
            const fallbackChampion = fighters.find(fighter =>
                fighter.id === fallbackId ||
                String(fighter.name || '').trim().toLowerCase() === String(fallbackName || '').trim().toLowerCase()
            );
            if (fallbackChampion) state.championId = fallbackChampion.id;
        }
    }

    return state;
}

window.unfinalizeCurrentCard = function() {
    refreshShowStateFromStorage();
    const selector = document.getElementById('activeShowSelector');
    const showId = selector?.value || activeShowId;
    const show = futureShows.find(item => item.id === showId);
    if (!show || !showId) {
        return customAlert('Select a fight card before unfinalizing.', 'Unfinalize Card');
    }

    let eventHistory;
    let championshipsRegistry;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
        championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
    } catch (error) {
        console.error('Unable to read archived card data for unfinalizing.', error);
        return customAlert('The archived card data could not be read. No changes were made.', 'Unfinalize Card');
    }
    if (!Array.isArray(eventHistory) || !Array.isArray(championshipsRegistry)) {
        return customAlert('The archived card data is not in a valid format. No changes were made.', 'Unfinalize Card');
    }

    const archivedEvents = eventHistory.filter(event =>
        event && (event.showId === showId || (!event.showId && event.showTitle === show.name && event.type === 'fight-card'))
    );
    if (!show.completed && archivedEvents.length === 0) {
        return customAlert('This fight card is not finalized.', 'Unfinalize Card');
    }
    if (!confirm(`Unfinalize "${show.name}"? Its archived history and the stats recorded for this card will be removed. Logged match results will remain on the card.`)) return;

    const removedEvents = new Set(archivedEvents);
    const remainingEvents = eventHistory.filter(event => !removedEvents.has(event));
    const affectedTitles = new Map();
    const matchHistoryRemovals = new Map();
    const loseStreakFallbacks = new Map();

    archivedEvents.forEach(event => {
        const showName = event.showTitle || event.name || show.name;
        (Array.isArray(event.matches) ? event.matches : []).forEach(match => {
            if (!match) return;
            const winnerName = match.winner || match.winnerName || '';
            const loserName = match.loser || match.loserName || '';
            const winner = fighters.find(fighter => fighter.id === match.winnerId || (winnerName && fighter.name === winnerName));
            const loser = fighters.find(fighter => fighter.id === match.loserId || (loserName && fighter.name === loserName));

            if (winner) {
                winner.wins = Math.max(0, Number(winner.wins || 0) - 1);
                if (!loseStreakFallbacks.has(winner)) {
                    loseStreakFallbacks.set(winner, match.winnerLoseStreakBefore);
                }
                const normalizedMethod = normalizeArchivedMethod(match.method || match.methodName || '');
                const methodId = match.methodId || ({
                    pinfall: 'win_pinfall',
                    'ko/tko': 'win_ko',
                    submission: 'win_submission'
                })[normalizedMethod] || '';
                if (methodId && typeof winner[methodId] !== 'undefined') {
                    winner[methodId] = Math.max(0, Number(winner[methodId] || 0) - 1);
                }
                if (match.isTitle) {
                    winner.total_title_fights = Math.max(0, Number(winner.total_title_fights || 0) - 1);
                    winner.title_fights = Math.max(0, Number(winner.title_fights || 0) - 1);
                }
                matchHistoryRemovals.set(winner, (matchHistoryRemovals.get(winner) || []).concat({
                    outcome: 'win',
                    opponent: loserName,
                    showName,
                    method: match.method || match.methodName || '',
                    rematchNumber: match.rematchNumber
                }));
            }
            if (loser) {
                loser.losses = Math.max(0, Number(loser.losses || 0) - 1);
                if (!loseStreakFallbacks.has(loser)) {
                    loseStreakFallbacks.set(loser, match.loserLoseStreakBefore);
                }
                if (match.isTitle) {
                    loser.total_title_fights = Math.max(0, Number(loser.total_title_fights || 0) - 1);
                    loser.title_fights = Math.max(0, Number(loser.title_fights || 0) - 1);
                }
                matchHistoryRemovals.set(loser, (matchHistoryRemovals.get(loser) || []).concat({
                    outcome: 'loss',
                    opponent: winnerName,
                    showName,
                    method: match.method || match.methodName || '',
                    rematchNumber: match.rematchNumber
                }));
            }

            if (!match.isTitle) return;
            const title = findArchivedTitleForMatch(match, championshipsRegistry);
            if (!title) return;
            if (!affectedTitles.has(title.id)) affectedTitles.set(title.id, { title, fallbackMatch: match });

            if (match.titleRetained === true && winner) {
                winner.defenses = Math.max(0, Number(winner.defenses || 0) - 1);
            }
            if (match.lifetimeDefenseCounted === true && winner) {
                winner.lifetime_defenses = Math.max(0, Number(winner.lifetime_defenses || 0) - 1);
            }

            if (Array.isArray(title.history)) {
                const matchMethod = normalizeArchivedMethod(match.method || match.methodId);
                const historyIndex = title.history.findIndex(entry =>
                    entry &&
                    String(entry.wrestlerName || '').trim().toLowerCase() === String(winnerName).trim().toLowerCase() &&
                    String(entry.showTitle || '').trim().toLowerCase() === String(showName).trim().toLowerCase() &&
                    normalizeArchivedMethod(entry.winMethod) === matchMethod
                );
                if (historyIndex !== -1) title.history.splice(historyIndex, 1);
            }
        });
    });

    matchHistoryRemovals.forEach((removals, fighter) => {
        const history = Array.isArray(fighter.compiled_history_deck) ? fighter.compiled_history_deck
            : Array.isArray(fighter.history_deck) ? fighter.history_deck
            : Array.isArray(fighter.history) ? fighter.history : [];
        removals.forEach(removal => {
            const historyIndex = history.findIndex(entry =>
                entry &&
                String(entry.outcome || '').toLowerCase() === removal.outcome &&
                entry.opponent === removal.opponent &&
                entry.showName === removal.showName &&
                normalizeArchivedMethod(entry.method) === normalizeArchivedMethod(removal.method) &&
                (removal.rematchNumber == null || entry.rematchNumber === removal.rematchNumber)
            );
            if (historyIndex !== -1) history.splice(historyIndex, 1);
        });
        fighter.compiled_history_deck = history;
        restoreWinStreakAfterUnlog(fighter);
        restoreTitleGateAfterUnlog(fighter, null);
        restoreLoseStreakAfterUnlog(fighter, loseStreakFallbacks.get(fighter));
        restoreFastTrackedStatusFromHistory(fighter);
    });

    affectedTitles.forEach(({ title, fallbackMatch }) => {
        const remainingHistory = Array.isArray(title.history) ? title.history : [];
        const state = rebuildArchivedTitleState(title, remainingEvents, remainingHistory, fallbackMatch);
        title.championId = state.championId;
        title.defenses = state.defenses;
        title.currentReignDefenses = state.defenses;
        if (typeof window.getArchivedTitleReigns === 'function') {
            const archivedReigns = window.getArchivedTitleReigns(title, fighters, remainingEvents);
            const usedReigns = new Set();
            title.history.forEach(entry => {
                const entryId = String(entry?.fighterId || entry?.championId || '');
                const entryName = String(entry?.wrestlerName || entry?.fighterName || '').trim().toLowerCase();
                const showName = String(entry?.showTitle || '').trim().toLowerCase();
                const method = normalizeArchivedMethod(entry?.winMethod);
                let reignIndex = archivedReigns.findIndex((reign, index) =>
                    !usedReigns.has(index) &&
                    ((entryId && entryId === String(reign.fighterId || '')) ||
                        (entryName && entryName === String(reign.wrestlerName || '').trim().toLowerCase())) &&
                    showName && showName === String(reign.showTitle || '').trim().toLowerCase() &&
                    (!method || method === normalizeArchivedMethod(reign.winMethod))
                );
                if (reignIndex < 0) {
                    reignIndex = archivedReigns.findIndex((reign, index) =>
                        !usedReigns.has(index) &&
                        ((entryId && entryId === String(reign.fighterId || '')) ||
                            (entryName && entryName === String(reign.wrestlerName || '').trim().toLowerCase()))
                    );
                }
                if (reignIndex >= 0) {
                    usedReigns.add(reignIndex);
                    entry.defenses = Math.max(0, Number(archivedReigns[reignIndex].defenses) || 0);
                    entry.reignDefenses = entry.defenses;
                }
            });
        }
        const activeReign = [...title.history].reverse().find(entry =>
            String(entry?.fighterId || '') === state.championId ||
            (entry?.wrestlerName && fighters.some(fighter =>
                String(fighter.id) === state.championId &&
                String(fighter.name || '').trim().toLowerCase() === String(entry.wrestlerName).trim().toLowerCase()
            ))
        );
        if (activeReign) {
            activeReign.defenses = state.defenses;
            activeReign.reignDefenses = state.defenses;
        }
    });

    try {
        saveFighters(fighters);
        localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
        window.dispatchEvent(new CustomEvent('wwe_titles:changed'));
        localStorage.setItem('wwe_event_history', JSON.stringify(remainingEvents));
        const savedMatches = JSON.parse(localStorage.getItem(`wwe_matches_${showId}`) || '{}');
        archivedEvents.forEach(event => (Array.isArray(event.matches) ? event.matches : []).forEach(match => {
            if (!match?.isTitle || !match.matchId || !savedMatches[match.matchId]) return;
            savedMatches[match.matchId].totalTitleFightAppearanceCounted = false;
            savedMatches[match.matchId].lifetimeDefenseCounted = false;
        }));
        localStorage.setItem(`wwe_matches_${showId}`, JSON.stringify(savedMatches));
        setShowCompleted(showId, false);
        updateFinalizedShowDropdownStyles();
        updateFinalizeButtonState();
        location.reload();
    } catch (error) {
        console.error('Unable to persist the unfinalized card changes.', error);
        customAlert('The card could not be fully unfinalized. Check the browser console before retrying.', 'Unfinalize Card');
    }
};

function restoreLoggedResult(id, state) {
    const row = document.getElementById(id);
    if (row && state?.tournamentId && state?.tournamentMatchId) {
        row.dataset.tournamentId = state.tournamentId;
        row.dataset.tournamentMatchId = state.tournamentMatchId;
    }
    if (row && state?.shortNotice === true) {
        row.dataset.shortNotice = 'true';
        row.dataset.shortNoticeFighter = state.shortNoticeFighter || '';
    }
    const slot1 = document.getElementById(`${id}-slot1`);
    const slot2 = document.getElementById(`${id}-slot2`);
    const slot1Input = slot1?.querySelector('.fighter-search-input');
    const slot2Input = slot2?.querySelector('.fighter-search-input');
    const titleCheck = document.getElementById(`${id}-title-check`);
    const titleInput = document.getElementById(`${id}-title-name-input`);

    const restoreSlot = (slotEl, inputEl, fighterName, fighterId) => {
        if (!slotEl || !inputEl || !fighterName) return;
        inputEl.value = fighterName;
        let fighter = null;
        if (fighterId) {
            inputEl.setAttribute('data-fighter-id', fighterId);
            fighter = fighters.find(f => f.id === fighterId) || null;
        }
        if (!fighter) {
            fighter = fighters.find(f => f.name === fighterName) || null;
            if (fighter) {
                inputEl.setAttribute('data-fighter-id', fighter.id);
            } else {
                inputEl.setAttribute('data-fighter-id', '');
            }
        }
        const avatar = slotEl.querySelector('.avatar-box');
            if (avatar) {
            let avatarContent = '';
            const _eff = getEffectivePhotoFor(fighter) || '';
            if (_eff) {
                avatarContent = `<img src="${_eff}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarContent = fighterName.charAt(0);
            }
            avatar.innerHTML = avatarContent;
            avatar.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1; overflow:hidden; cursor:pointer;";
            avatar.onclick = function(e) { e.stopPropagation(); if (fighter && fighter.id) uploadFighterPhotoFromCard(fighter.id); };
        }
    };

    restoreSlot(slot1, slot1Input, state.slot1Name, state.slot1Id);
    restoreSlot(slot2, slot2Input, state.slot2Name, state.slot2Id);

    updateFighterRecordDisplay(id, 'slot1', fighters.find(f => f.id === state.slot1Id) || getFighterByIdOrName(state.slot1Name));
    updateFighterRecordDisplay(id, 'slot2', fighters.find(f => f.id === state.slot2Id) || getFighterByIdOrName(state.slot2Name));

    const rowGender = state.gender ||
        fighters.find(f => f.id === state.slot1Id || f.name === state.slot1Name)?.gender ||
        fighters.find(f => f.id === state.slot2Id || f.name === state.slot2Name)?.gender ||
        'male';
    setMatchRowSelectedGender(id, rowGender);

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

    if (titleCheck && titleCheck.checked) {
        applyMatchRowTitleGlow(row);
    } else if (row) {
        clearMatchRowTitleGlow(row);
    }

    const hasSlot1Value = slot1Input?.value?.trim();
    const hasSlot2Value = slot2Input?.value?.trim();
    const winSelect = document.getElementById(`${id}-winner-select`);
    const methodSelect = document.getElementById(`${id}-method-select`);
    const hasCompleteMatch = hasSlot1Value && hasSlot2Value && state.winnerName && state.loserName;
    const upsetBadge = document.getElementById(`${id}-upset-alert`);
    if (upsetBadge) {
        upsetBadge.hidden = !hasCompleteMatch || state.upsetAlert !== true;
        upsetBadge.textContent = state.upsetAlert === true ? '🚨 UPSET' : '';
        upsetBadge.title = state.upsetReason || '';
    }
    const fastTrackBadge = document.getElementById(`${id}-fast-track-alert`);
    if (fastTrackBadge) {
        fastTrackBadge.hidden = !hasCompleteMatch || state.fastTrackAlert !== true;
        fastTrackBadge.textContent = state.fastTrackAlert === true ? '⚡ FAST-TRACKED' : '';
    }
    const bossSlainBadge = document.getElementById(`${id}-boss-slain-alert`);
    if (bossSlainBadge) {
        bossSlainBadge.hidden = !hasCompleteMatch || state.bossSlain !== true;
        bossSlainBadge.textContent = state.bossSlain === true ? '💀 BOSS SLAYER' : '';
        bossSlainBadge.title = state.bossSlainName ? `Defeated ${state.bossSlainName}` : '';
    }
    setMatchBonusDisplay(id, hasCompleteMatch ? state : {});

    if (winSelect) {
        const ensureWinnerOption = (value, label) => {
            if (!value || !label) return;
            const exists = Array.from(winSelect.options).some(opt => opt.value === value || opt.text === label);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = value;
                opt.text = label;
                winSelect.appendChild(opt);
            }
        };
        if (state.slot1Name) ensureWinnerOption('1', state.slot1Name);
        if (state.slot2Name) ensureWinnerOption('2', state.slot2Name);

        if (slot1Input?.value === state.winnerName) winSelect.value = '1';
        else if (slot2Input?.value === state.winnerName) winSelect.value = '2';
        else if (state.slot1Name === state.winnerName) winSelect.value = '1';
        else if (state.slot2Name === state.winnerName) winSelect.value = '2';
    }
    if (methodSelect && state.methodId) {
        methodSelect.value = state.methodId;
    }

    if (state.isRematch === true) {
        const winner = getFighterByIdOrName(state.winnerName);
        const loser = getFighterByIdOrName(state.loserName);
        const savedMeetingNumber = Number(state.rematchNumber) || 0;
        const legacyMeetingNumber = state.rematchNumberIsMeeting === true
            ? savedMeetingNumber
            : savedMeetingNumber + 1;
        const meetingNumber = Math.max(
            2,
            legacyMeetingNumber,
            winner && loser ? getPastFightsCount(winner, loser) : 0
        );
        updateRematchIndicator(id, meetingNumber - 1, meetingNumber);
    } else {
        updateRematchIndicator(id, 0);
    }

    if (!hasCompleteMatch) {
        clearMatchWinnerBadges(id);
        updateTitleDefenseMilestone(id);
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

    const savedFightTimeMs = parseMatchFightTime(state.fightTime);
    const savedFightTime = savedFightTimeMs > 0 ? formatMatchTimerDisplay(savedFightTimeMs) : '';
    restoreMatchTimerFromSaved(id, savedFightTime);
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
    updateShortNoticeBadge(id);

    const unlogBtn = document.getElementById(`${id}-unlog-btn`);
    if (unlogBtn) {
        unlogBtn.style.display = 'inline-flex';
        unlogBtn.disabled = false;
        unlogBtn.style.opacity = '1';
        unlogBtn.style.cursor = 'pointer';
    }
    updateTitleDefenseMilestone(id);
}

function clearMatchWinnerBadges(matchId) {
    ['slot1','slot2'].forEach(slotType => {
        const slot = document.getElementById(`${matchId}-${slotType}`);
        if (!slot) return;
        const badge = slot.querySelector('.win-badge');
        const label = slot.querySelector('.win-method-label');
        const avatar = slot.querySelector('.avatar-box');
        if (badge) badge.style.display = 'none';
        if (badge) badge.classList.remove('winner-check-badge');
        if (label) label.style.display = 'none';
        if (avatar) {
            avatar.classList.remove('ufc-winner-border');
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
        if (el.classList && el.classList.contains('announce-btn')) {
            el.disabled = false;
            el.style.opacity = '1';
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
            el.title = 'Announce this match result.';
            return;
        }
        if (el.classList && el.classList.contains('performance-bonus-select')) {
            el.disabled = false;
            el.style.opacity = '1';
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
            el.title = 'Award or change a performance bonus for this match.';
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

    const titleCheck = document.getElementById(`${matchId}-title-check`);
    if (titleCheck && titleCheck.checked) {
        applyMatchRowTitleGlow(row);
    } else {
        clearMatchRowTitleGlow(row);
    }

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
    applyStreakPortraitClass(slot.querySelector('.avatar-frame'), getFighterByIdOrName(slotInput.value.trim()));
    const otherSlotType = slotType === 'slot1' ? 'slot2' : 'slot1';
    const otherSlot = document.getElementById(`${matchId}-${otherSlotType}`);
    const otherInput = otherSlot?.querySelector('.fighter-search-input');
    applyStreakPortraitClass(otherSlot?.querySelector('.avatar-frame'), otherInput ? getFighterByIdOrName(otherInput.value.trim()) : null);
    if (badge) {
        badge.classList.add('winner-check-badge');
        badge.style.display = 'flex';
        badge.style.opacity = '1';
    }
    if (label) {
        label.textContent = methodText || '';
        label.style.display = methodText ? 'block' : 'none';
    }
    if (avatar) {
        avatar.classList.add('ufc-winner-border');
    }
}

window.finalizeFullEventCard = function() {
    const topInput = getEventNameInput();
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

    const activeShowSavedData = JSON.parse(localStorage.getItem(getActiveShowMatchesStorageKey() || '')) || {};
    const allMatchRows = Array.from(document.querySelectorAll('.match-row'));
    const completeRows = Object.values(activeShowSavedData).filter(saved => saved && saved.winnerName && saved.loserName && saved.methodName).length;
    const incompleteRows = Object.entries(activeShowSavedData).filter(([id, saved]) => !saved || !saved.winnerName || !saved.loserName || !saved.methodName);

    if (completeRows === 0 || incompleteRows.length > 0) {
        const totalLogged = completeRows + incompleteRows.length;
        customAlert(`Archive Blocked!\nYou must finish saving at least one valid result before completing the event.\n\nCurrent Progress: ${completeRows}/${Math.max(1, totalLogged)}`, 'Finalize Event');
        return;
    }

    const finalizedAt = new Date().toISOString();
    Object.values(activeShowSavedData).forEach(savedState => {
        if (savedState && savedState.winnerName && savedState.loserName && !savedState.loggedAt) {
            savedState.loggedAt = finalizedAt;
        }
    });

    allMatchRows.forEach(row => clearWarningMatchState(row.id));

    // Award event archive bonus once per completed show. Legacy hook kept as a no-op when betting is disabled.
    if (typeof window.updateBettingMoney === 'function') {
        window.updateBettingMoney(1000);
    }
    customAlert('🏆 Live show finalized! You earned a $1,000 bonus for archiving the event.', 'Event Archived');

    let eventMatchesCompiled = allMatchRows.filter(row => {
        const savedState = activeShowSavedData[row.id];
        return savedState?.winnerName && savedState?.loserName && savedState?.methodName;
    }).map(row => {
        const savedState = activeShowSavedData[row.id];
        const titleCheck = document.getElementById(`${row.id}-title-check`);
        const titleNameInp = document.getElementById(`${row.id}-title-name-input`);
        const savedIsTitle = typeof savedState?.isTitle !== 'undefined' ? savedState.isTitle : (titleCheck ? titleCheck.checked : false);
        const savedTitleId = savedState?.titleId || '';
        const savedTitleName = savedState?.titleName || (titleNameInp ? (titleNameInp.options[titleNameInp.selectedIndex]?.getAttribute('data-name') || titleNameInp.value.trim()) : '');
        if (savedIsTitle && savedState.totalTitleFightAppearanceCounted !== true) {
            const winner = fighters.find(fighter => fighter.id === savedState.winnerId ||
                String(fighter.name || '').trim().toLowerCase() === String(savedState.winnerName || '').trim().toLowerCase());
            const loser = fighters.find(fighter => fighter.id === savedState.loserId ||
                String(fighter.name || '').trim().toLowerCase() === String(savedState.loserName || '').trim().toLowerCase());
            if (winner) {
                winner.total_title_fights = (Number(winner.total_title_fights ?? winner.title_fights) || 0) + 1;
                winner.title_fights = Number(winner.title_fights || 0) + 1;
            }
            if (loser) {
                loser.total_title_fights = (Number(loser.total_title_fights ?? loser.title_fights) || 0) + 1;
                loser.title_fights = Number(loser.title_fights || 0) + 1;
            }
            savedState.totalTitleFightAppearanceCounted = true;
        }

        return {
            matchId: row.id,
            tierName: row.parentNode.querySelector('.tier-title') ? row.parentNode.querySelector('.tier-title').textContent : "Match",
            winner: savedState.winnerName,
            loser: savedState.loserName,
            method: savedState.methodName,
            loggedAt: savedState.loggedAt || finalizedAt,
            fightTime: savedState.fightTime || '',
            methodId: savedState.methodId || '',
            isTitle: savedIsTitle,
            titleId: savedTitleId,
            customTitleName: savedTitleName,
            titleRetained: savedState.titleRetained === true,
            winnerId: savedState.winnerId || '',
            loserId: savedState.loserId || '',
            isRematch: savedState.isRematch === true,
            rematchNumber: Number(savedState.rematchNumber) || 0,
            rematchNumberIsMeeting: savedState.rematchNumberIsMeeting === true,
            rivalryTag: savedState.rivalryTag || '',
            upsetAlert: savedState.upsetAlert === true,
            upsetReason: savedState.upsetReason || '',
            fastTrackAlert: savedState.fastTrackAlert === true,
            bossSlain: savedState.bossSlain === true,
            bossSlainName: savedState.bossSlainName || '',
            shortNotice: savedState.shortNotice === true,
            shortNoticeFighter: savedState.shortNoticeFighter || '',
            bonusType: normalizePerformanceBonusType(savedState.bonusType),
            winnerWinStreak: Math.max(0, Math.floor(Number(savedState.winnerWinStreakBefore) || 0)) + 1,
            loserWinStreak: 0,
            winnerWinStreakBefore: Math.max(0, Math.floor(Number(savedState.winnerWinStreakBefore) || 0)),
            loserWinStreakBefore: Math.max(0, Math.floor(Number(savedState.loserWinStreakBefore) || 0)),
            winnerLoseStreak: 0,
            loserLoseStreak: Math.max(0, Math.floor(Number(savedState.loserLoseStreak) || 0)),
            winnerLoseStreakBefore: Math.max(0, Math.floor(Number(savedState.winnerLoseStreakBefore) || 0)),
            loserLoseStreakBefore: Math.max(0, Math.floor(Number(savedState.loserLoseStreakBefore) || 0)),
            winnerRebuildWinsRequired: Math.max(0, Math.floor(Number(savedState.winnerRebuildWinsRequired) || 0)),
            loserRebuildWinsRequired: Math.max(0, Math.floor(Number(savedState.loserRebuildWinsRequired) || 0)),
            winnerRebuildWinsRequiredBefore: Math.max(0, Math.floor(Number(savedState.winnerRebuildWinsRequiredBefore) || 0)),
            loserRebuildWinsRequiredBefore: Math.max(0, Math.floor(Number(savedState.loserRebuildWinsRequiredBefore) || 0)),
            winnerRebuildLossCount: Math.max(0, Math.floor(Number(savedState.winnerRebuildLossCount) || 0)),
            loserRebuildLossCount: Math.max(0, Math.floor(Number(savedState.loserRebuildLossCount) || 0)),
            winnerRebuildLossCountBefore: Math.max(0, Math.floor(Number(savedState.winnerRebuildLossCountBefore) || 0)),
            loserRebuildLossCountBefore: Math.max(0, Math.floor(Number(savedState.loserRebuildLossCountBefore) || 0)),
            dominantExChampionException: savedState.dominantExChampionException === true,
            winnerDominantExChampionRebuild: savedState.winnerDominantExChampionRebuild === true,
            loserDominantExChampionRebuild: savedState.loserDominantExChampionRebuild === true,
            winnerDominantExChampionRebuildBefore: savedState.winnerDominantExChampionRebuildBefore === true,
            loserDominantExChampionRebuildBefore: savedState.loserDominantExChampionRebuildBefore === true,
            winnerTitleComebackCompleted: savedState.winnerTitleComebackCompleted === true,
            loserTitleComebackCompleted: savedState.loserTitleComebackCompleted === true,
            winnerTitleComebackCompletedBefore: savedState.winnerTitleComebackCompletedBefore === true,
            loserTitleComebackCompletedBefore: savedState.loserTitleComebackCompletedBefore === true,
            totalTitleFightAppearanceCounted: savedState.totalTitleFightAppearanceCounted === true,
            lifetimeDefenseCounted: savedState.lifetimeDefenseCounted === true
        };
    });
    const activeMatchesStorageKey = getActiveShowMatchesStorageKey();
    if (activeMatchesStorageKey) localStorage.setItem(activeMatchesStorageKey, JSON.stringify(activeShowSavedData));

    let championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    eventMatchesCompiled.forEach(m => {
        if (!m.isTitle) return;
        // If this match already applied a title at log time (stored by match state), skip re-applying here
        const savedState = activeShowSavedData[m.matchId] || {};
        if (savedState && savedState.titleId) return;

        const champWinnerObj = fighters.find(f => String(f.name || '').trim().toLowerCase() === String(m.winner || '').trim().toLowerCase());
        const loserObj = fighters.find(f => String(f.name || '').trim().toLowerCase() === String(m.loser || '').trim().toLowerCase());
        const beltName = m.customTitleName;

        let targetBelt = championshipsRegistry.find(b => b.name.toLowerCase() === beltName.toLowerCase());
        if (!targetBelt) {
            targetBelt = {
                id: 'title-' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: beltName,
                gender: champWinnerObj ? champWinnerObj.gender : 'male',
                championId: '',
                history: [],
                defenses: 0,
                currentReignDefenses: 0
            };
            championshipsRegistry.push(targetBelt);
        }

        if (champWinnerObj) {
            const previousChampionId = targetBelt.championId;
            const previousChampion = fighters.find(fighter =>
                fighter.id === previousChampionId ||
                String(fighter.name || '').trim().toLowerCase() === String(previousChampionId || '').trim().toLowerCase()
            );
            const previousChampionName = previousChampion ? previousChampion.name : previousChampionId;
            const winnerRetainedTitle = previousChampionId === champWinnerObj.id ||
                String(champWinnerObj.name || '').trim().toLowerCase() === String(previousChampionName || '').trim().toLowerCase();
            const winMethodText = m.method.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');
            if (!Array.isArray(targetBelt.history)) targetBelt.history = [];
            if (!winnerRetainedTitle) {
                if (previousChampionId && typeof window.recordTitleReignDefenses === 'function') {
                    window.recordTitleReignDefenses(
                        targetBelt,
                        previousChampion || { id: '', name: String(previousChampionName || '') },
                        Math.max(0, Number(targetBelt.defenses ?? targetBelt.currentReignDefenses) || 0)
                    );
                }
                targetBelt.history.push({
                    fighterId: champWinnerObj.id,
                    wrestlerName: champWinnerObj.name,
                    showTitle: shownShowName,
                    winMethod: winMethodText,
                    defenses: 0,
                    reignDefenses: 0
                });
                targetBelt.defenses = 0;
                targetBelt.currentReignDefenses = 0;
                m.titleRetained = false;
            } else {
                targetBelt.defenses = Math.max(0, Number(targetBelt.defenses ?? targetBelt.currentReignDefenses) || 0) + 1;
                targetBelt.currentReignDefenses = targetBelt.defenses;
                champWinnerObj.defenses = (Number(champWinnerObj.defenses) || 0) + 1;
                m.titleRetained = true;
                m.titleDefenseNumber = targetBelt.defenses;
                m.titleMilestoneUnlocked = [3, 5, 10].includes(targetBelt.defenses);
                m.titleMilestoneLabel = m.titleMilestoneUnlocked
                    ? window.getDefenseMilestone?.(targetBelt.defenses)?.label || ''
                    : '';
                const matchSaveState = activeShowSavedData[m.matchId] || (activeShowSavedData[m.matchId] = {});
                Object.assign(matchSaveState, {
                    titleRetained: true,
                    titleDefenseNumber: targetBelt.defenses,
                    titleMilestoneUnlocked: m.titleMilestoneUnlocked,
                    titleMilestoneLabel: m.titleMilestoneLabel
                });
                window.recordTitleReignDefenses?.(targetBelt, champWinnerObj, targetBelt.defenses, {
                    showTitle: shownShowName,
                    winMethod: winMethodText
                });
                saveFighters(fighters);
            }
            targetBelt.championId = champWinnerObj.id;
        }
    });

    eventMatchesCompiled.forEach(match => {
        if (!match.isTitle || match.titleRetained !== true) return;
        const savedState = activeShowSavedData[match.matchId];
        if (!savedState) return;
        if (savedState.lifetimeDefenseCounted === true || match.lifetimeDefenseCounted === true) {
            savedState.lifetimeDefenseCounted = true;
            match.lifetimeDefenseCounted = true;
            return;
        }
        const champion = fighters.find(fighter => fighter.id === match.winnerId ||
            String(fighter.name || '').trim().toLowerCase() === String(match.winner || '').trim().toLowerCase());
        if (!champion) return;
        champion.lifetime_defenses = (Number(champion.lifetime_defenses) || 0) + 1;
        savedState.lifetimeDefenseCounted = true;
        match.lifetimeDefenseCounted = true;
    });
    saveFighters(fighters);

    if (activeMatchesStorageKey) localStorage.setItem(activeMatchesStorageKey, JSON.stringify(activeShowSavedData));
    localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
    window.dispatchEvent(new CustomEvent('wwe_titles:changed'));

    let eventHistoryCalendar = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    const eventDate = new Date(finalizedAt);
    eventHistoryCalendar.push({
        id: "event-" + Date.now(),
        name: shownShowName,
        showTitle: shownShowName,
        showId: activeShowId,
        date: eventDate.toLocaleString(),
        completedAt: finalizedAt,
        finalizedAt,
        type: 'fight-card',
        matches: eventMatchesCompiled
    });
    localStorage.setItem("wwe_event_history", JSON.stringify(eventHistoryCalendar));
    setShowCompleted(activeShowId, true, finalizedAt);
    updateFinalizedShowDropdownStyles();
    updateFinalizeButtonState();

    eventMatchesCompiled.forEach(m => {
        const winnerFighter = fighters.find(f => f.name === m.winner);
        const loserFighter = fighters.find(f => f.name === m.loser);
        if (!winnerFighter || !loserFighter) return;

        if (!winnerFighter.compiled_history_deck) winnerFighter.compiled_history_deck = [];
        if (!loserFighter.compiled_history_deck) loserFighter.compiled_history_deck = [];

        const methodSource = m.methodId || m.method || '';
        const cleanMethodName = methodSource.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');

        const winnerHistoryEntry = winnerFighter.compiled_history_deck.find(entry => entry.outcome === 'win' && entry.opponent === loserFighter.name && entry.showName === shownShowName && entry.method === cleanMethodName);
        const loserHistoryEntry = loserFighter.compiled_history_deck.find(entry => entry.outcome === 'loss' && entry.opponent === winnerFighter.name && entry.showName === shownShowName && entry.method === cleanMethodName);

        if (!winnerHistoryEntry) {
            winnerFighter.compiled_history_deck.push({
                outcome: 'win',
                opponent: loserFighter.name,
                method: cleanMethodName,
                showName: shownShowName,
                loggedAt: m.loggedAt,
                fightTime: m.fightTime || '',
                rivalryTag: m.rivalryTag || '',
                upsetAlert: m.upsetAlert === true,
                upsetReason: m.upsetReason || '',
                fastTrackAlert: m.fastTrackAlert === true,
                bossSlain: m.bossSlain === true,
                bossSlainName: m.bossSlainName || '',
                shortNotice: m.shortNotice === true,
                shortNoticeFighter: m.shortNoticeFighter || '',
                bonusType: normalizePerformanceBonusType(m.bonusType),
                winStreak: Number(m.winnerWinStreak) || 0,
                winStreakBefore: Math.max(0, Math.floor(Number(m.winnerWinStreakBefore) || 0)),
                rebuildWinsRequired: Math.max(0, Math.floor(Number(m.winnerRebuildWinsRequired) || 0)),
                rebuildWinsRequiredBefore: Math.max(0, Math.floor(Number(m.winnerRebuildWinsRequiredBefore) || 0)),
                rebuildLossCount: Math.max(0, Math.floor(Number(m.winnerRebuildLossCount) || 0)),
                rebuildLossCountBefore: Math.max(0, Math.floor(Number(m.winnerRebuildLossCountBefore) || 0)),
                titleComebackCompleted: m.winnerTitleComebackCompleted === true,
                titleComebackCompletedBefore: m.winnerTitleComebackCompletedBefore === true,
                loseStreak: Number(m.winnerLoseStreak) || 0,
                loseStreakBefore: Math.max(0, Math.floor(Number(m.winnerLoseStreakBefore) || 0)),
                rematchNumber: Number(m.rematchNumber) || 0
            });
        } else if (!winnerHistoryEntry.loggedAt) {
            winnerHistoryEntry.loggedAt = m.loggedAt;
        }
        if (!loserHistoryEntry) {
            loserFighter.compiled_history_deck.push({
                outcome: 'loss',
                opponent: winnerFighter.name,
                method: cleanMethodName,
                showName: shownShowName,
                loggedAt: m.loggedAt,
                fightTime: m.fightTime || '',
                rivalryTag: m.rivalryTag || '',
                upsetAlert: m.upsetAlert === true,
                upsetReason: m.upsetReason || '',
                bossSlain: m.bossSlain === true,
                bossSlainName: m.bossSlainName || '',
                shortNotice: m.shortNotice === true,
                shortNoticeFighter: m.shortNoticeFighter || '',
                bonusType: normalizePerformanceBonusType(m.bonusType),
                winStreak: Number(m.loserWinStreak) || 0,
                winStreakBefore: Math.max(0, Math.floor(Number(m.loserWinStreakBefore) || 0)),
                rebuildWinsRequired: Math.max(0, Math.floor(Number(m.loserRebuildWinsRequired) || 0)),
                rebuildWinsRequiredBefore: Math.max(0, Math.floor(Number(m.loserRebuildWinsRequiredBefore) || 0)),
                rebuildLossCount: Math.max(0, Math.floor(Number(m.loserRebuildLossCount) || 0)),
                rebuildLossCountBefore: Math.max(0, Math.floor(Number(m.loserRebuildLossCountBefore) || 0)),
                titleComebackCompleted: m.loserTitleComebackCompleted === true,
                titleComebackCompletedBefore: m.loserTitleComebackCompletedBefore === true,
                loseStreak: Number(m.loserLoseStreak) || 0,
                loseStreakBefore: Math.max(0, Math.floor(Number(m.loserLoseStreakBefore) || 0)),
                rematchNumber: Number(m.rematchNumber) || 0
            });
        } else if (!loserHistoryEntry.loggedAt) {
            loserHistoryEntry.loggedAt = m.loggedAt;
        }
    });
    saveFighters(fighters);

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
        const titleCheckbox = document.getElementById(`${id}-title-check`);
        const titleInput = document.getElementById(`${id}-title-name-input`);
        const rematchCheckbox = row.querySelector('input[data-rematch-indicator]');
        const rematchCountEl = document.getElementById(`${id}-rematch-count`);
        const timerState = matchTimerStates.get(id);
        
        draftData[id] = {
            f1Name: s1 ? s1.value : '',
            f1Id: s1 ? s1.getAttribute('data-fighter-id') : '',
            f2Name: s2 ? s2.value : '',
            f2Id: s2 ? s2.getAttribute('data-fighter-id') : '',
            gender: gender,
            titleChecked: titleCheckbox ? titleCheckbox.checked : false,
            titleSelected: titleInput ? titleInput.value : '',
            smartBookedTitle: row.dataset.smartBookedTitle === 'true',
            shortNotice: row.dataset.shortNotice === 'true',
            shortNoticeFighter: row.dataset.shortNoticeFighter || '',
            tournamentId: row.dataset.tournamentId || '',
            tournamentMatchId: row.dataset.tournamentMatchId || '',
            rematchChecked: rematchCheckbox ? rematchCheckbox.checked : false,
            rematchCount: rematchCountEl ? Number(rematchCountEl.value) : 1,
            rematchAccepted: acceptedRematch ? true : false,
            rematchF1Id: acceptedRematch ? acceptedRematch.fighter1Id : '',
            rematchF2Id: acceptedRematch ? acceptedRematch.fighter2Id : '',
            fightTimerElapsedMs: timerState ? timerState.elapsedMs : 0,
            fightTimerStartedAt: timerState ? timerState.startedAt : 0
        };
    });
    localStorage.setItem(getCurrentDraftStorageKey(), JSON.stringify(draftData));
    updateFinalizedShowDropdownStyles();
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
        restoreMatchTimerFromDraft(id, d);
        resetMatchValidationState(id);
        if (d.smartBookedTitle === true) row.dataset.smartBookedTitle = 'true';
        else delete row.dataset.smartBookedTitle;
        if (d.shortNotice === true) {
            row.dataset.shortNotice = 'true';
            row.dataset.shortNoticeFighter = d.shortNoticeFighter || '';
        } else {
            delete row.dataset.shortNotice;
            delete row.dataset.shortNoticeFighter;
        }
        if (d.tournamentId && d.tournamentMatchId) {
            row.dataset.tournamentId = String(d.tournamentId);
            row.dataset.tournamentMatchId = String(d.tournamentMatchId);
        } else {
            delete row.dataset.tournamentId;
            delete row.dataset.tournamentMatchId;
        }
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

        const titleCheckbox = document.getElementById(`${id}-title-check`);
        const titleInput = document.getElementById(`${id}-title-name-input`);

        if (titleCheckbox) {
            titleCheckbox.checked = !!d.titleChecked;
        }
        if (titleInput) {
            if (titleCheckbox && titleCheckbox.checked) {
                titleInput.style.display = 'inline-block';
                populateTitleDropdown(id);
                titleInput.value = d.titleSelected || '';
            } else {
                titleInput.style.display = 'none';
                titleInput.value = '';
            }
        }
        updateShortNoticeBadge(id);

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
            recheckMatchValidation(id, 'both');
        }
        refreshTitleFightState(id);
        updateTaleOfTheTapeButton(id);
    });
    restoreActiveRematchWarnings();
}

window.changeMatchGender = function(matchRowId, gender) {
    setMatchRowSelectedGender(matchRowId, gender);
    populateDropdownGenders(matchRowId, gender);
    saveCurrentCardDraft();
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
