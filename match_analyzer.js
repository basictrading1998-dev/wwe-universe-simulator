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

function createFighterNameLabel(name, fightersByName) {
    const label = document.createElement('span');
    const normalizedName = String(name || '').normalize('NFC').trim().toLocaleLowerCase();
    const fighter = fightersByName.get(normalizedName);
    label.className = 'romantic-partner-name';
    label.setAttribute('data-romantic-fighter-name', name);
    if (fighter?.id) label.setAttribute('data-fighter-id', String(fighter.id));
    label.textContent = name;
    return label;
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
    const resultsContainer = document.getElementById('fighterTitleMatchResults');
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    selectedName = String(selectedName || '');
    let titleMatchCount = 0;
    const exactName = selectedName.trim();
    if (!exactName) return;

    const fightersByName = new Map(loadRosterFighters().map(fighter => [
        String(fighter.name || '').normalize('NFC').trim().toLocaleLowerCase(),
        fighter
    ]));
    const championships = loadChampionships();
    const matchHistoryArray = getArchivedMatchHistory()
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

    matchHistoryArray.forEach(({ event, index }) => {
        const showName = event.showTitle || event.name || `Fight Card ${index + 1}`;
        event.matches.forEach(savedMatch => {
            if (!savedMatch || savedMatch.isTitle !== true) return;
            const match = {
                ...savedMatch,
                fighterA: String(savedMatch.fighterA || savedMatch.winner || savedMatch.winnerName || ''),
                fighterB: String(savedMatch.fighterB || savedMatch.loser || savedMatch.loserName || '')
            };
            let isSelectedMatch = false;
            if (selectedName.trim() === match.fighterA.trim() || selectedName.trim() === match.fighterB.trim()) {
                isSelectedMatch = true;
            }
            if (!isSelectedMatch) return;
            titleMatchCount++;

            const winner = String(match.winner || match.winnerName || '').trim();
            const loser = String(match.loser || match.loserName || '').trim();
            if (!winner || !loser) return;

            let title = match.titleId ? championships.find(item => item && item.id === match.titleId) : null;
            if (!title) {
                const normalizedTitle = String(match.customTitleName || match.titleName || '').trim().toLowerCase();
                title = championships.find(item => item && String(item.name || '').trim().toLowerCase() === normalizedTitle);
            }
            const titleName = title?.name || match.customTitleName || match.titleName || 'Championship';
            const state = title ? titleStates.get(title.id) : null;
            const championBeforeMatch = state?.championName || '';
            const lineageChange = state?.lineageChanges.find(entry =>
                String(entry.showTitle || '').trim().toLowerCase() === String(showName).trim().toLowerCase() &&
                String(entry.wrestlerName || '').trim() === winner
            );
            const winnerIsChampion = match.titleRetained === true ||
                (match.titleRetained !== false && championBeforeMatch === winner && !lineageChange);
            const loserIsChampion = championBeforeMatch === loser;
            const selectedIsWinner = exactName === winner;
            let outcomeClass;
            if (selectedIsWinner) {
                if (winnerIsChampion) {
                    outcomeClass = 'defended';
                } else {
                    outcomeClass = 'won';
                }
            } else if (loserIsChampion) {
                outcomeClass = 'lost';
            } else {
                outcomeClass = 'challenger-fail';
            }

            const line = document.createElement('div');
            line.className = `title-match-result ${outcomeClass}`;
            line.append(document.createTextNode(`${showName} - `));
            if (selectedIsWinner) {
                if (winnerIsChampion) {
                    line.append(document.createTextNode(`DEFENDED the ${titleName} against `));
                    line.append(createFighterNameLabel(loser, fightersByName));
                } else {
                    line.append(document.createTextNode(`WON the ${titleName} by defeating `));
                    line.append(createFighterNameLabel(loser, fightersByName));
                }
            } else if (loserIsChampion) {
                line.append(document.createTextNode(`LOST the ${titleName} to `));
                line.append(createFighterNameLabel(winner, fightersByName));
            } else {
                line.append(document.createTextNode(`Challenged for the ${titleName} but lost to `));
                line.append(createFighterNameLabel(winner, fightersByName));
            }
            line.append(document.createTextNode(` via ${formatTitleMatchMethod(match)}`));
            resultsContainer.appendChild(line);

            if (state) {
                state.championName = winner;
                if (match.titleRetained === false || lineageChange) {
                    state.lineageChanges = state.lineageChanges.filter(entry => entry !== lineageChange);
                }
            }
        });
    });

    if (selectedName.trim() !== "" && titleMatchCount === 0) {
        const safeSelectedName = selectedName.replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
        resultsContainer.innerHTML = `
            <div class="no-matches-found" style="color: #a0aec0; padding: 20px; text-align: center; font-style: italic;">
                No championship matches on record for ${safeSelectedName}.
            </div>
        `;
    }
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
