function safeParse(json) {
    try { return JSON.parse(json); } catch (error) { return null; }
}

function loadRosterFighters() {
    const stored = safeParse(localStorage.getItem('wwe_fighters')) || safeParse(localStorage.getItem('fighters')) || [];
    return Array.isArray(stored) ? stored.filter(item => item && item.name) : [];
}

function loadChampionships() {
    const stored = safeParse(localStorage.getItem('wwe_titles')) || [];
    return Array.isArray(stored) ? stored : [];
}

function getArchivedMatchHistory() {
    const stored = safeParse(localStorage.getItem('wwe_event_history')) || [];
    return Array.isArray(stored) ? stored : [];
}

function formatTitleMatchMethod(match) {
    const method = String(match.method || match.methodName || match.methodId || '').trim();
    const knownMethods = {
        win_pinfall: 'PINFALL',
        win_ko: 'KO/TKO',
        win_submission: 'SUBMISSION'
    };
    return knownMethods[method.toLowerCase()] || method || 'Unknown method';
}

function populateFighterTitleMatchNames() {
    const datalist = document.getElementById('fighterTitleMatchNames');
    if (!datalist) return;
    datalist.replaceChildren(...loadRosterFighters()
        .map(fighter => fighter.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map(name => new Option(name, name)));
}

function lookupFighterTitleMatches(selectedName) {
    const fighterTitleMatchResults = document.getElementById('fighterTitleMatchResults');
    if (!fighterTitleMatchResults) return;
    fighterTitleMatchResults.innerHTML = '';
    selectedName = String(selectedName || '');
    const exactName = selectedName.trim();
    if (!exactName) return;

    const championships = loadChampionships();
    const events = getArchivedMatchHistory()
        .map((event, index) => ({
            event,
            index,
            timestamp: Date.parse(event.completedAt || event.date || '')
        }))
        .filter(item => item.event && Array.isArray(item.event.matches))
        .sort((a, b) => Number.isFinite(a.timestamp) && Number.isFinite(b.timestamp)
            ? a.timestamp - b.timestamp || a.index - b.index
            : a.index - b.index);
    const titleStates = new Map();
    championships.forEach(title => {
        if (!title || !title.id) return;
        titleStates.set(title.id, {
            championName: '',
            lineageChanges: (Array.isArray(title.history) ? title.history : [])
                .filter(entry => entry && entry.wrestlerName)
        });
    });

    const fighterMatches = [];
    events.forEach(({ event, index }) => {
        const showName = event.showTitle || event.name || `Fight Card ${index + 1}`;
        event.matches.forEach(savedMatch => {
            if (!savedMatch) return;
            const match = {
                ...savedMatch,
                fighterA: String(savedMatch.fighterA || savedMatch.winner || savedMatch.winnerName || ''),
                fighterB: String(savedMatch.fighterB || savedMatch.loser || savedMatch.loserName || '')
            };
            let isSelectedMatch = false;
            if (selectedName.trim() === match.fighterA.trim() || selectedName.trim() === match.fighterB.trim()) {
                isSelectedMatch = true;
            }
            if (!match.isTitle) return;
            const winner = String(match.winner || match.winnerName || '');
            const loser = String(match.loser || match.loserName || '');
            if (!winner.trim() || !loser.trim()) return;

            let title = match.titleId ? championships.find(item => item && item.id === match.titleId) : null;
            if (!title) {
                const normalizedTitle = String(match.customTitleName || match.titleName || '').trim().toLowerCase();
                title = championships.find(item => item && String(item.name || '').trim().toLowerCase() === normalizedTitle);
            }
            const titleName = title?.name || match.customTitleName || match.titleName || 'Championship';
            const state = title ? titleStates.get(title.id) : null;
            const method = formatTitleMatchMethod(match);
            const lineageChange = state?.lineageChanges.find(entry =>
                String(entry.showTitle || '').trim().toLowerCase() === String(showName).trim().toLowerCase() &&
                entry.wrestlerName === winner
            );
            const isNewChampion = match.titleRetained === false || Boolean(lineageChange);
            const championBeforeMatch = state?.championName || '';
            let outcomeClass;
            let message;

            if (isNewChampion) {
                state.championName = winner;
                if (exactName === winner) {
                    outcomeClass = 'won';
                    message = `${showName} - WON the ${titleName} by defeating ${loser} via ${method}`;
                } else if (exactName === loser) {
                    if (championBeforeMatch && championBeforeMatch === loser) {
                        outcomeClass = 'lost';
                        message = `${showName} - LOST the ${titleName} to ${winner} via ${method}`;
                    } else {
                        outcomeClass = 'challenger-fail';
                        message = `${showName} - Challenged for the ${titleName} but lost to ${winner} via ${method}`;
                    }
                }
            } else if (match.titleRetained === true || (championBeforeMatch && championBeforeMatch === winner)) {
                if (!state.championName) state.championName = winner;
                if (exactName === winner) {
                    outcomeClass = 'defended';
                    message = `${showName} - DEFENDED the ${titleName} against ${loser} via ${method}`;
                } else if (exactName === loser) {
                    outcomeClass = 'challenger-fail';
                    message = `${showName} - Challenged for the ${titleName} but lost to ${winner} via ${method}`;
                }
            } else if (championBeforeMatch && championBeforeMatch === loser) {
                state.championName = winner;
                if (exactName === loser) {
                    outcomeClass = 'lost';
                    message = `${showName} - LOST the ${titleName} to ${winner} via ${method}`;
                } else if (exactName === winner) {
                    outcomeClass = 'won';
                    message = `${showName} - WON the ${titleName} by defeating ${loser} via ${method}`;
                }
            } else {
                if (state && !state.championName) state.championName = winner;
                if (exactName === winner) {
                    outcomeClass = 'defended';
                    message = `${showName} - DEFENDED the ${titleName} against ${loser} via ${method}`;
                } else if (exactName === loser) {
                    outcomeClass = 'challenger-fail';
                    message = `${showName} - Challenged for the ${titleName} but lost to ${winner} via ${method}`;
                }
            }

            if (message && isSelectedMatch) fighterMatches.push({ index, outcomeClass, message });
        });
    });

    fighterMatches.sort((a, b) => a.index - b.index);
    if (fighterMatches.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'title-match-empty';
        emptyMessage.textContent = 'No title matches on record for this fighter.';
        fighterTitleMatchResults.appendChild(emptyMessage);
        return;
    }
    fighterMatches.forEach(match => {
        const line = document.createElement('div');
        line.className = `title-match-result ${match.outcomeClass}`;
        line.textContent = match.message;
        fighterTitleMatchResults.appendChild(line);
    });
}

window.lookupFighterTitleMatches = lookupFighterTitleMatches;

function initFighterTitleMatchAnalyzer() {
    const input = document.getElementById('fighterTitleMatchLookup');
    if (!input) return;
    populateFighterTitleMatchNames();
    input.addEventListener('input', () => lookupFighterTitleMatches(input.value));
    input.addEventListener('change', () => lookupFighterTitleMatches(input.value));
}

document.addEventListener('DOMContentLoaded', initFighterTitleMatchAnalyzer);
