(function() {
    const HISTORY_KEY = 'universeP4PHistory';
    const TOP_COUNT = 15;

    function normalizeName(value) {
        return String(value || '').trim().toLowerCase();
    }

    function normalizeMethod(value) {
        const method = normalizeName(value);
        if (method === 'win_pinfall') return 'pinfall';
        if (method === 'win_ko') return 'ko/tko';
        if (method === 'win_submission') return 'submission';
        return method;
    }

    function numberOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function getFighterGender(fighter) {
        const gender = String(fighter?.gender || '').trim().toLowerCase();
        if (/^(f|female|w|woman|women)/.test(gender)) return 'female';
        if (/^(m|male|man|men)/.test(gender)) return 'male';
        return '';
    }

    function readArrayStorage(key, label) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (!Array.isArray(parsed)) throw new Error(`${label} data is not a list.`);
            return parsed;
        } catch (error) {
            console.error(`Unable to read ${label} for P4P rankings.`, error);
            return [];
        }
    }

    function getDefenseMilestone(defenses) {
        const count = Math.max(0, Math.floor(numberOrZero(defenses)));
        if (count >= 10) {
            return {
                count,
                tier: 3,
                label: '🥇 10x ALL-TIME GREAT',
                className: 'defense-milestone--gold'
            };
        }
        if (count >= 5) {
            return {
                count,
                tier: 2,
                label: '🥈 5x DOMINANT REIGN',
                className: 'defense-milestone--silver'
            };
        }
        if (count >= 3) {
            return {
                count,
                tier: 1,
                label: '🥉 3x PROVEN CHAMPION',
                className: 'defense-milestone--bronze'
            };
        }
        return {
            count,
            tier: 0,
            label: `Defenses: ${count}`,
            className: ''
        };
    }

    window.getDefenseMilestone = getDefenseMilestone;

    function titleIdentity(title) {
        const champion = title?.champion && typeof title.champion === 'object'
            ? title.champion
            : null;
        const id = String(title?.championId || champion?.id || '');
        const name = normalizeName(
            champion?.name ||
            (typeof title?.champion === 'string' ? title.champion : '') ||
            title?.championName
        );
        return { id, name };
    }

    function identityForReign(reign, fighters) {
        const id = String(reign?.fighterId || reign?.championId || '');
        const name = normalizeName(reign?.wrestlerName || reign?.fighterName || reign?.championName);
        const fighter = fighters.find(entry =>
            (id && String(entry?.id || '') === id) ||
            (name && normalizeName(entry?.name) === name)
        );
        return {
            id: String(fighter?.id || id),
            name: normalizeName(fighter?.name || name),
            displayName: String(fighter?.name || reign?.wrestlerName || reign?.fighterName || reign?.championName || '')
        };
    }

    function titleMatchBelongsTo(match, title) {
        if (!match || match.isTitle !== true) return false;
        const matchId = String(match.titleId || '');
        if (matchId && String(title?.id || '') === matchId) return true;
        const matchName = normalizeName(match.customTitleName || match.titleName || '');
        return !!matchName && matchName === normalizeName(title?.name);
    }

    function getArchivedTitleReigns(title, fighters, events) {
        const orderedMatches = [];
        events.forEach((event, eventIndex) => {
            const timestamp = Date.parse(event?.completedAt || event?.date || '');
            (Array.isArray(event?.matches) ? event.matches : []).forEach((match, matchIndex) => {
                if (!titleMatchBelongsTo(match, title)) return;
                orderedMatches.push({
                    event,
                    match,
                    eventIndex,
                    matchIndex,
                    timestamp: Number.isFinite(timestamp) ? timestamp : null
                });
            });
        });
        orderedMatches.sort((a, b) => {
            if (a.timestamp !== null && b.timestamp !== null && a.timestamp !== b.timestamp) {
                return a.timestamp - b.timestamp;
            }
            return a.eventIndex - b.eventIndex || a.matchIndex - b.matchIndex;
        });

        const fighterById = new Map(fighters.map(fighter => [String(fighter?.id || ''), fighter]));
        const fighterByName = new Map(fighters.map(fighter => [normalizeName(fighter?.name), fighter]));
        const resolve = (id, name) => fighterById.get(String(id || '')) ||
            fighterByName.get(normalizeName(name)) || null;
        const reigns = [];
        let current = null;
        const beginReign = (fighter, event, match) => ({
            fighterId: String(fighter?.id || match.winnerId || ''),
            wrestlerName: String(fighter?.name || match.winner || match.winnerName || ''),
            showTitle: String(event?.showTitle || event?.name || ''),
            winMethod: String(match.methodName || match.method || ''),
            defenses: 0
        });

        orderedMatches.forEach(({ event, match }) => {
            const winner = resolve(match.winnerId, match.winner || match.winnerName);
            const loser = resolve(match.loserId, match.loser || match.loserName);
            if (!winner) return;
            const winnerId = String(winner.id || '');
            const sameChampion = current && (
                (winnerId && current.fighterId && winnerId === current.fighterId) ||
                normalizeName(winner.name) === normalizeName(current.wrestlerName)
            );

            if (match.titleRetained === true || (match.titleRetained !== false && sameChampion)) {
                if (!sameChampion) {
                    if (current) reigns.push(current);
                    current = beginReign(winner, event, match);
                }
                current.defenses += 1;
                return;
            }

            if (current) reigns.push(current);
            current = beginReign(winner, event, match);
            if (match.titleRetained !== false && loser && current.fighterId === String(loser.id || '')) {
                current.defenses = 0;
            }
        });
        if (current) reigns.push(current);
        return reigns;
    }

    window.getArchivedTitleReigns = function(title, fighters, events) {
        const data = readTitleData(null, fighters, events);
        return getArchivedTitleReigns(title, data.fighters, data.events);
    };

    function getTitleReignRecords(title, fighters, events) {
        const storedHistory = Array.isArray(title?.history) ? title.history : [];
        const archivedReigns = getArchivedTitleReigns(title, fighters, events);
        const usedArchived = new Set();
        const records = storedHistory.map(reign => {
            const identity = identityForReign(reign, fighters);
            const showName = normalizeName(reign?.showTitle);
            const method = normalizeMethod(reign?.winMethod);
            let archivedIndex = archivedReigns.findIndex((entry, index) =>
                !usedArchived.has(index) &&
                ((identity.id && entry.fighterId && identity.id === entry.fighterId) ||
                    (identity.name && normalizeName(entry.wrestlerName) === identity.name)) &&
                showName && normalizeName(entry.showTitle) === showName &&
                (!method || normalizeMethod(entry.winMethod) === method)
            );
            if (archivedIndex < 0) {
                archivedIndex = archivedReigns.findIndex((entry, index) =>
                    !usedArchived.has(index) &&
                    ((identity.id && entry.fighterId && identity.id === entry.fighterId) ||
                        (identity.name && normalizeName(entry.wrestlerName) === identity.name))
                );
            }
            const archived = archivedIndex >= 0 ? archivedReigns[archivedIndex] : null;
            if (archivedIndex >= 0) usedArchived.add(archivedIndex);
            const savedCount = Math.max(
                0,
                numberOrZero(reign?.reignDefenses),
                numberOrZero(reign?.defenses)
            );
            return {
                ...reign,
                fighterId: identity.id || archived?.fighterId || '',
                wrestlerName: identity.displayName || archived?.wrestlerName || '',
                defenses: Math.max(savedCount, numberOrZero(archived?.defenses))
            };
        });

        archivedReigns.forEach((reign, index) => {
            if (!usedArchived.has(index)) records.push(reign);
        });

        const activeIdentity = titleIdentity(title);
        if (activeIdentity.id || activeIdentity.name) {
            const activeCount = Math.max(
                0,
                numberOrZero(title?.defenses),
                numberOrZero(title?.currentReignDefenses)
            );
            const activeIndex = records.findLastIndex
                ? records.findLastIndex(reign =>
                    (activeIdentity.id && String(reign.fighterId || '') === activeIdentity.id) ||
                    (activeIdentity.name && normalizeName(reign.wrestlerName) === activeIdentity.name)
                )
                : (() => {
                    for (let index = records.length - 1; index >= 0; index--) {
                        const reign = records[index];
                        if ((activeIdentity.id && String(reign.fighterId || '') === activeIdentity.id) ||
                            (activeIdentity.name && normalizeName(reign.wrestlerName) === activeIdentity.name)) return index;
                    }
                    return -1;
                })();
            if (activeIndex >= 0) {
                records[activeIndex].defenses = Math.max(records[activeIndex].defenses, activeCount);
            } else {
                records.push({
                    fighterId: activeIdentity.id,
                    wrestlerName: title?.champion?.name ||
                        (typeof title?.champion === 'string' ? title.champion : '') ||
                        title?.championName || '',
                    showTitle: '',
                    winMethod: '',
                    defenses: activeCount
                });
            }
        }
        return records;
    }

    function readTitleData(titles, fighters, events) {
        return {
            titles: Array.isArray(titles) ? titles : readArrayStorage('wwe_titles', 'championship'),
            fighters: Array.isArray(fighters) ? fighters : readArrayStorage('wwe_fighters', 'fighter roster'),
            events: Array.isArray(events) ? events : readArrayStorage('wwe_event_history', 'event history')
        };
    }

    window.getTitleReignDefenseCounts = function(title, fighters, events) {
        const roster = Array.isArray(fighters) ? fighters : readArrayStorage('wwe_fighters', 'fighter roster');
        const archived = Array.isArray(events) ? events : readArrayStorage('wwe_event_history', 'event history');
        return getTitleReignRecords(title, roster, archived).map(reign => reign.defenses);
    };

    window.getTitleReignDefenseCountsByTitle = function(titles, fighters, events) {
        const data = readTitleData(titles, fighters, events);
        const counts = new Map();
        data.titles.forEach(title => {
            counts.set(
                String(title?.id || ''),
                getTitleReignRecords(title, data.fighters, data.events).map(reign => reign.defenses)
            );
        });
        return counts;
    };

    window.recordTitleReignDefenses = function(title, fighter, defenses, details = {}) {
        if (!title || !fighter) return null;
        if (!Array.isArray(title.history)) title.history = [];
        const fighterId = String(fighter.id || '');
        const fighterName = normalizeName(fighter.name);
        const latestReign = title.history[title.history.length - 1];
        let reign = latestReign && (
            (fighterId && String(latestReign?.fighterId || latestReign?.championId || '') === fighterId) ||
            (fighterName && normalizeName(latestReign?.wrestlerName || latestReign?.fighterName) === fighterName)
        )
            ? latestReign
            : null;
        if (!reign) {
            reign = {
                fighterId,
                wrestlerName: String(fighter.name || ''),
                showTitle: String(details.showTitle || ''),
                winMethod: String(details.winMethod || ''),
                defenses: 0,
                reignDefenses: 0
            };
            title.history.push(reign);
        }
        reign.fighterId = fighterId || reign.fighterId || '';
        reign.wrestlerName = String(fighter.name || reign.wrestlerName || '');
        reign.defenses = Math.max(0, Math.floor(numberOrZero(defenses)));
        reign.reignDefenses = reign.defenses;
        if (details.showTitle) reign.showTitle = String(details.showTitle);
        if (details.winMethod) reign.winMethod = String(details.winMethod);
        return reign;
    };

    window.getBestTitleReignDefenses = function(fighter, titles, fighters, events) {
        if (!fighter) return 0;
        const data = readTitleData(titles, fighters, events);
        const fighterId = String(fighter.id || '');
        const fighterName = normalizeName(fighter.name);
        return data.titles.reduce((best, title) =>
            Math.max(best, ...getTitleReignRecords(title, data.fighters, data.events)
                .filter(reign =>
                    (fighterId && String(reign.fighterId || '') === fighterId) ||
                    (fighterName && normalizeName(reign.wrestlerName) === fighterName)
                )
                .map(reign => reign.defenses)),
        0);
    };

    window.getTitleReignDefenseCountsByFighter = function(titles, fighters, events) {
        const data = readTitleData(titles, fighters, events);
        const counts = new Map();
        const record = (id, name, defenses) => {
            const count = Math.max(0, numberOrZero(defenses));
            const keys = [];
            if (id) keys.push(`id:${id}`);
            if (name) keys.push(`name:${normalizeName(name)}`);
            keys.forEach(key => counts.set(key, Math.max(counts.get(key) || 0, count)));
        };
        data.titles.forEach(title => {
            getTitleReignRecords(title, data.fighters, data.events).forEach(reign => {
                record(reign.fighterId, reign.wrestlerName, reign.defenses);
            });
        });
        return counts;
    };

    window.getLongestTitleReign = function(titles, fighters, events) {
        const data = readTitleData(titles, fighters, events);
        let longest = null;
        data.titles.forEach(title => {
            getTitleReignRecords(title, data.fighters, data.events).forEach(reign => {
                if (reign.defenses <= (longest?.defenses || 0)) return;
                longest = {
                    fighterId: reign.fighterId || '',
                    fighterName: reign.wrestlerName || '',
                    titleName: String(title.name || 'Championship'),
                    defenses: reign.defenses,
                    active: false
                };
            });
            const active = titleIdentity(title);
            const activeCount = Math.max(
                0,
                numberOrZero(title.defenses),
                numberOrZero(title.currentReignDefenses)
            );
            if (activeCount > (longest?.defenses || 0)) {
                const fighter = data.fighters.find(entry =>
                    (active.id && String(entry.id || '') === active.id) ||
                    (active.name && normalizeName(entry.name) === active.name)
                );
                longest = {
                    fighterId: String(fighter?.id || active.id),
                    fighterName: String(fighter?.name || active.name || 'Unknown Champion'),
                    titleName: String(title.name || 'Championship'),
                    defenses: activeCount,
                    active: true
                };
            }
        });
        return longest;
    };

    window.renderLongestTitleReign = function(titles, fighters, events) {
        const panel = document.getElementById('longestTitleReignRecord');
        if (!panel) return;
        const record = window.getLongestTitleReign(titles, fighters, events);
        panel.replaceChildren();

        const heading = document.createElement('strong');
        heading.className = 'longest-reign-heading';
        heading.textContent = '👑 ALL-TIME LONGEST TITLE REIGN';
        const details = document.createElement('span');
        details.className = 'longest-reign-details';
        if (!record || record.defenses <= 0) {
            details.textContent = 'No title defenses have been recorded yet.';
        } else {
            details.textContent = `${record.fighterName} • ${record.defenses} Defenses — ${record.titleName}`;
        }
        panel.append(heading, details);

        if (record && record.defenses > 0) {
            const milestone = getDefenseMilestone(record.defenses);
            if (milestone.tier > 0) {
                const badge = document.createElement('span');
                badge.className = `defense-milestone-badge ${milestone.className}`;
                badge.textContent = milestone.label;
                panel.appendChild(badge);
            }
        }
        panel.hidden = false;
    };

    function readP4PHistory() {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw === null) return null;
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.entries)) return parsed.entries;
            throw new Error('P4P history data has an unexpected format.');
        } catch (error) {
            console.error('Unable to read saved P4P positions.', error);
            return [];
        }
    }

    function getPreviousPosition(fighter, entries) {
        const fighterId = String(fighter?.id || '');
        if (fighterId) {
            const matchById = entries.find(entry => String(entry?.id || '') === fighterId);
            if (matchById) return matchById;
        }
        const fighterName = normalizeName(fighter?.name);
        return fighterName
            ? entries.find(entry => normalizeName(entry?.name) === fighterName) || null
            : null;
    }

    function getMovementLabel(previousEntry, rank, preserveSavedMovement = false) {
        if (!previousEntry || !Number.isInteger(Number(previousEntry.rank))) {
            return { type: 'new', label: 'NEW', delta: null };
        }
        const previousRank = Number(previousEntry.rank);
        if (previousRank > rank) {
            const delta = previousRank - rank;
            return { type: 'up', label: `▲ +${delta}`, delta };
        }
        if (previousRank < rank) {
            const delta = rank - previousRank;
            return { type: 'down', label: `▼ -${delta}`, delta: -delta };
        }
        if (preserveSavedMovement &&
            previousEntry.movement &&
            typeof previousEntry.movement.label === 'string') {
            return previousEntry.movement;
        }
        return { type: 'same', label: '—', delta: 0 };
    }

    function countCurrentBelts(fighter, titles) {
        const fighterId = String(fighter?.id || '');
        const fighterName = normalizeName(fighter?.name);
        return titles.filter(title => {
            if (!title || title.retired === true || title.active === false) return false;
            const champion = title.champion && typeof title.champion === 'object'
                ? title.champion
                : null;
            const championId = String(title.championId || champion?.id || '');
            const championName = normalizeName(
                champion?.name ||
                (typeof title.champion === 'string' ? title.champion : '') ||
                title.championName
            );
            if (championId) return !!fighterId && championId === fighterId;
            return !!fighterName && championName === fighterName;
        }).length;
    }

    function calculatePoundForPoundRankings() {
        const fighters = readArrayStorage('wwe_fighters', 'fighter roster');
        const titles = readArrayStorage('wwe_titles', 'championship');
        return fighters
            .filter(fighter =>
                fighter &&
                fighter.retired !== true &&
                numberOrZero(fighter.wins) >= 1 &&
                !!getFighterGender(fighter)
            )
            .map(fighter => {
                const wins = Math.max(0, numberOrZero(fighter.wins));
                const losses = Math.max(0, numberOrZero(fighter.losses));
                const winStreak = Math.max(0, numberOrZero(fighter.win_streak));
                const currentBeltsCount = countCurrentBelts(fighter, titles);
                const score =
                    (currentBeltsCount * 35) +
                    (Math.max(0, numberOrZero(fighter.lifetime_defenses)) * 12) +
                    (winStreak * 6) +
                    (wins * 2) +
                    (Math.max(0, numberOrZero(fighter.boss_slays)) * 10) +
                    (Math.max(0, numberOrZero(fighter.giant_kills)) * 6) -
                    (losses * 3);
                const winRate = wins / Math.max(1, wins + losses);
                return {
                    fighter,
                    division: getFighterGender(fighter),
                    currentBeltsCount,
                    winRate,
                    winStreak,
                    p4pScore: score
                };
            })
            .sort((a, b) =>
                b.p4pScore - a.p4pScore ||
                b.winRate - a.winRate ||
                b.winStreak - a.winStreak ||
                String(a.fighter.name || '').localeCompare(String(b.fighter.name || ''))
            )
            .slice(0, TOP_COUNT)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }

    window.getPoundForPoundRankings = function() {
        const previousEntries = readP4PHistory() || [];
        return calculatePoundForPoundRankings().map(entry => ({
            ...entry,
            movement: getMovementLabel(getPreviousPosition(entry.fighter, previousEntries), entry.rank, true)
        }));
    };

    window.savePoundForPoundHistory = function() {
        const previousEntries = readP4PHistory() || [];
        const rankings = calculatePoundForPoundRankings();
        const entries = rankings.map(entry => ({
            id: String(entry.fighter.id || ''),
            name: String(entry.fighter.name || ''),
            rank: entry.rank,
            movement: getMovementLabel(getPreviousPosition(entry.fighter, previousEntries), entry.rank)
        }));
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify({
                version: 1,
                updatedAt: new Date().toISOString(),
                entries
            }));
        } catch (error) {
            console.error('Unable to save P4P ranking history.', error);
            return false;
        }
        window.dispatchEvent(new CustomEvent('universe:p4p-updated'));
        return true;
    };

    function makeMovementBadge(movement) {
        const badge = document.createElement('span');
        badge.className = `p4p-movement p4p-movement--${movement.type || 'same'}`;
        badge.textContent = movement.label || '—';
        return badge;
    }

    function makePoundForPoundRow(entry) {
        const row = document.createElement('li');
        row.className = `p4p-ranking-row${entry.rank === 1 ? ' p4p-ranking-row--first' : ''}`;
        row.dataset.rank = String(entry.rank);

        const position = document.createElement('span');
        position.className = 'p4p-ranking-position';
        position.textContent = `#${entry.rank}`;

        const movement = makeMovementBadge(entry.movement || { type: 'same', label: '—' });
        const portrait = document.createElement('div');
        portrait.className = `p4p-ranking-portrait${entry.winStreak > 0 ? ' has-active-streak' : ''}`;
        const name = document.createElement('strong');
        name.className = 'p4p-ranking-name';
        const details = document.createElement('div');
        details.className = 'p4p-ranking-details';
        const content = document.createElement('div');
        content.className = 'p4p-ranking-content';

        const fighter = entry.fighter;
        const photo = String(fighter.photo || fighter.image || fighter.profile_pic || '').trim();
        const initials = document.createElement('span');
        initials.className = 'p4p-ranking-initials';
        initials.textContent = String(fighter.name || '?').trim().split(/\s+/)
            .slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
        portrait.appendChild(initials);
        if (photo) {
            const image = document.createElement('img');
            image.src = photo;
            image.alt = '';
            image.addEventListener('error', () => image.remove(), { once: true });
            initials.hidden = true;
            portrait.appendChild(image);
        }

        name.textContent = String(fighter.name || 'Unknown Fighter');
        const gender = document.createElement('span');
        gender.className = `p4p-division-pill p4p-division-pill--${entry.division}`;
        gender.textContent = entry.division === 'female' ? 'WOMEN' : 'MEN';
        const wins = Math.max(0, numberOrZero(fighter.wins));
        const losses = Math.max(0, numberOrZero(fighter.losses));
        const record = document.createElement('span');
        record.className = 'p4p-record';
        record.textContent = `${wins} - ${losses}`;
        const career = document.createElement('span');
        career.className = 'p4p-career-pill';
        career.textContent = `🏆 ${entry.currentBeltsCount} ${entry.currentBeltsCount === 1 ? 'BELT' : 'BELTS'} • 🔥 ${entry.winStreak}W STREAK`;
        const score = document.createElement('span');
        score.className = 'p4p-score';
        score.textContent = `${Math.round(entry.p4pScore)} PTS`;
        details.append(gender, record, career, score);
        content.append(name, details);
        row.append(position, movement, portrait, content);
        return row;
    }

    window.renderPoundForPoundRankings = function() {
        const list = document.getElementById('poundForPoundRankingsList');
        if (!list) return;
        const rankings = window.getPoundForPoundRankings();
        list.replaceChildren();
        if (rankings.length === 0) {
            const emptyNote = document.createElement('li');
            emptyNote.className = 'p4p-rankings-empty';
            emptyNote.textContent = 'No ranked fighters yet';
            list.appendChild(emptyNote);
            return;
        }
        rankings.forEach(entry => list.appendChild(makePoundForPoundRow(entry)));
    };

    function initializePoundForPoundRankings() {
        if (localStorage.getItem(HISTORY_KEY) === null) {
            window.savePoundForPoundHistory();
        }
        window.renderPoundForPoundRankings();
        window.renderLongestTitleReign();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePoundForPoundRankings, { once: true });
    } else {
        initializePoundForPoundRankings();
    }

    window.addEventListener('storage', event => {
        if (event.key === 'wwe_fighters' || event.key === 'wwe_titles' || event.key === HISTORY_KEY) {
            window.renderPoundForPoundRankings();
            window.renderLongestTitleReign();
        }
        if (event.key === 'wwe_event_history') {
            window.renderLongestTitleReign();
        }
    });
    window.addEventListener('universe:p4p-updated', window.renderPoundForPoundRankings);
    window.addEventListener('wwe_titles:changed', window.renderPoundForPoundRankings);
    window.addEventListener('wwe_titles:changed', window.renderLongestTitleReign);
    window.addEventListener('wwe_fighters:changed', window.renderLongestTitleReign);
    window.addEventListener('wwe_event_history:changed', window.renderLongestTitleReign);
})();
