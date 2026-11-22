(function () {
    'use strict';

    const TOURNAMENTS_KEY = 'universeTournaments';
    const ROSTER_KEY = 'wwe_fighters';
    const TITLES_KEY = 'wwe_titles';
    const ROUND_LABELS = {
        8: ['Quarterfinals', 'Semifinals', 'Finals'],
        16: ['Round of 16', 'Quarterfinals', 'Semifinals', 'Finals']
    };
    const DEFAULT_MATCH_IDS = [
        'mainEventContainer-m1',
        'coMainContainer-m1',
        'mainCardContainer-m1',
        'mainCardContainer-m2',
        'mainCardContainer-m3',
        'mainCardContainer-m4',
        'prelimsContainer-m1',
        'prelimsContainer-m2',
        'prelimsContainer-m3',
        'prelimsContainer-m4',
        'earlyPrelimsContainer-m1',
        'earlyPrelimsContainer-m2',
        'earlyPrelimsContainer-m3',
        'earlyPrelimsContainer-m4'
    ];

    let roster = [];
    let titles = [];
    let tournaments = [];
    let seedIds = [];
    let selectedTournamentId = '';

    function readArray(key, label) {
        let raw;
        try {
            raw = localStorage.getItem(key);
        } catch (error) {
            console.error(`Unable to access ${label} storage.`, error);
            return [];
        }
        if (raw === null) return [];
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error(`${label} data must be an array.`);
            return parsed;
        } catch (error) {
            console.error(`Unable to read ${label} storage.`, error);
            return [];
        }
    }

    function readObject(key, label) {
        let raw;
        try {
            raw = localStorage.getItem(key);
        } catch (error) {
            console.error(`Unable to access ${label} storage.`, error);
            return {};
        }
        if (raw === null) return {};
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error(`${label} data must be an object.`);
            }
            return parsed;
        } catch (error) {
            console.error(`Unable to read ${label} storage.`, error);
            return {};
        }
    }

    function normalizeName(value) {
        return String(value || '').trim().toLowerCase();
    }

    function fighterKey(fighter) {
        const id = String(fighter?.id || '').trim();
        return id || `name:${normalizeName(fighter?.name)}`;
    }

    function isFemale(fighter) {
        return /^(f|female|w|woman|women)/i.test(String(fighter?.gender || '').trim());
    }

    function getEligibleFighters() {
        const division = document.getElementById('tournamentDivision').value;
        return roster.filter(fighter =>
            fighter &&
            fighter.retired !== true &&
            fighter.name &&
            (division === 'open' || (division === 'female') === isFemale(fighter))
        );
    }

    function activeTitle(title) {
        return title && title.retired !== true && title.active !== false;
    }

    function renderPrizeOptions() {
        const select = document.getElementById('tournamentPrize');
        const previousValue = select.value;
        select.replaceChildren(new Option('🏆 Tournament Trophy / #1 Contender', ''));
        titles.filter(activeTitle).forEach(title => {
            const option = new Option(title.name || 'Untitled Championship', String(title.id || ''));
            if (!option.value) return;
            select.add(option);
        });
        if (Array.from(select.options).some(option => option.value === previousValue)) {
            select.value = previousValue;
        }
    }

    function getDivisionRankEntries() {
        if (typeof window.getDivisionRankings !== 'function') return [];
        const groups = window.getDivisionRankings();
        return groups.flatMap(group => (group.rankings || []).map((entry, index) => ({
            fighter: entry.fighter,
            rank: index,
            score: Number(entry.score) || 0,
            gender: group.gender
        })));
    }

    function recordOrder(a, b) {
        const aWins = Number(a.wins) || 0;
        const bWins = Number(b.wins) || 0;
        const aLosses = Number(a.losses) || 0;
        const bLosses = Number(b.losses) || 0;
        const aRate = aWins / Math.max(1, aWins + aLosses);
        const bRate = bWins / Math.max(1, bWins + bLosses);
        return bRate - aRate ||
            bWins - aWins ||
            (Number(b.win_streak) || 0) - (Number(a.win_streak) || 0) ||
            aLosses - bLosses ||
            String(a.name || '').localeCompare(String(b.name || ''));
    }

    function getAutoSeedOrder() {
        const division = document.getElementById('tournamentDivision').value;
        const entries = getDivisionRankEntries();
        const byId = new Map();
        entries.forEach(entry => {
            const id = String(entry.fighter?.id || '');
            if (id) byId.set(id, entry);
        });
        const eligible = getEligibleFighters();
        if (division === 'open') {
            return eligible.sort((a, b) => {
                const rankA = byId.get(String(a.id || ''));
                const rankB = byId.get(String(b.id || ''));
                if (rankA && rankB && rankA.score !== rankB.score) return rankB.score - rankA.score;
                if (rankA && !rankB) return -1;
                if (!rankA && rankB) return 1;
                return recordOrder(a, b);
            });
        }
        return eligible.sort((a, b) => {
            const rankA = byId.get(String(a.id || ''));
            const rankB = byId.get(String(b.id || ''));
            if (rankA && rankB) return rankA.rank - rankB.rank;
            if (rankA) return -1;
            if (rankB) return 1;
            return recordOrder(a, b);
        });
    }

    function getFighterByKey(key) {
        return roster.find(fighter => fighterKey(fighter) === String(key || '')) || null;
    }

    function findFighterByName(name) {
        const normalized = normalizeName(name);
        if (!normalized) return null;
        return getEligibleFighters().find(fighter => normalizeName(fighter.name) === normalized) || null;
    }

    function updateSeedStatus(message) {
        const size = Number(document.getElementById('tournamentSize').value);
        const selected = seedIds.filter(Boolean);
        const hasDuplicates = new Set(selected).size !== selected.length;
        const complete = selected.length === size && !hasDuplicates;
        const status = document.getElementById('tournamentSeedStatus');
        status.textContent = message || (complete
            ? `${size} unique fighters are ready to seed.`
            : `${selected.length} of ${size} seeds filled${hasDuplicates ? ' • Remove duplicate fighters' : ''}.`);
        status.classList.toggle('is-ready', complete);
        updateSeedPreview();
        document.querySelector('.tournament-create-button').disabled = !complete;
    }

    function updateSeedPreview() {
        const preview = document.getElementById('tournamentSeedPreview');
        preview.replaceChildren();
        seedIds.forEach((key, index) => {
            const fighter = getFighterByKey(key);
            const chip = document.createElement('span');
            chip.className = `tournament-seed-chip${fighter ? '' : ' is-empty'}`;
            chip.textContent = `#${index + 1} ${fighter?.name || 'Select fighter'}`;
            preview.appendChild(chip);
        });
    }

    function renderManualInputs() {
        const list = document.getElementById('tournamentSeedInputs');
        list.replaceChildren();
        const eligible = getEligibleFighters()
            .slice()
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        const size = Number(document.getElementById('tournamentSize').value);
        seedIds = Array.from({ length: size }, (_, index) => seedIds[index] || '');
        for (let index = 0; index < size; index++) {
            const field = document.createElement('label');
            field.className = 'tournament-seed-field';
            const label = document.createElement('span');
            label.textContent = `Seed #${index + 1}`;
            const input = document.createElement('input');
            const listId = `tournament-fighter-options-${index + 1}`;
            input.type = 'search';
            input.autocomplete = 'off';
            input.setAttribute('list', listId);
            input.placeholder = 'Search active fighters';
            input.dataset.seedIndex = String(index);
            const selected = getFighterByKey(seedIds[index]);
            if (selected) input.value = selected.name;
            const options = document.createElement('datalist');
            options.id = listId;
            eligible.forEach(fighter => {
                const option = document.createElement('option');
                option.value = String(fighter.name);
                options.appendChild(option);
            });
            input.addEventListener('input', () => {
                const fighter = findFighterByName(input.value);
                seedIds[index] = fighter ? fighterKey(fighter) : '';
                updateSeedStatus();
            });
            field.append(label, input, options);
            list.appendChild(field);
        }
        updateSeedStatus();
    }

    function shuffle(values) {
        const result = values.slice();
        for (let index = result.length - 1; index > 0; index--) {
            const other = Math.floor(Math.random() * (index + 1));
            [result[index], result[other]] = [result[other], result[index]];
        }
        return result;
    }

    function roundName(size, index) {
        return ROUND_LABELS[size][index] || `Round ${index + 1}`;
    }

    function createBracket(size, fighters) {
        const seedOrder = size === 8
            ? [1, 8, 4, 5, 2, 7, 3, 6]
            : [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
        const bySeed = new Map(fighters.map((fighter, index) => [
            index + 1,
            {
                fighterId: String(fighter.id || ''),
                name: String(fighter.name || ''),
                seed: index + 1
            }
        ]));
        const rounds = [];
        const firstRoundMatches = [];
        for (let index = 0; index < seedOrder.length; index += 2) {
            firstRoundMatches.push({
                id: `r1m${firstRoundMatches.length + 1}`,
                fighters: [bySeed.get(seedOrder[index]), bySeed.get(seedOrder[index + 1])],
                sourceMatchIds: ['', ''],
                winnerId: '',
                winnerSource: '',
                booked: null
            });
        }
        rounds.push({ name: roundName(size, 0), matches: firstRoundMatches });
        let matchCount = firstRoundMatches.length / 2;
        for (let roundIndex = 1; matchCount >= 1; roundIndex++) {
            const matches = Array.from({ length: matchCount }, (_, index) => ({
                id: `r${roundIndex + 1}m${index + 1}`,
                fighters: [null, null],
                sourceMatchIds: ['', ''],
                winnerId: '',
                winnerSource: '',
                booked: null
            }));
            rounds.push({ name: roundName(size, roundIndex), matches });
            if (matchCount === 1) break;
            matchCount = Math.floor(matchCount / 2);
        }
        return rounds;
    }

    function setFeedback(message, isError) {
        const feedback = document.getElementById('tournamentFeedback');
        feedback.textContent = message || '';
        feedback.classList.toggle('is-error', !!isError);
        feedback.classList.toggle('is-success', !!message && !isError);
    }

    function setBracketFeedback(message, isError) {
        const feedback = document.getElementById('tournamentBracketFeedback');
        feedback.textContent = message || '';
        feedback.classList.toggle('is-error', !!isError);
        feedback.classList.toggle('is-success', !!message && !isError);
    }

    function persistTournaments() {
        try {
            localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
        } catch (error) {
            console.error('Unable to save tournament archive.', error);
            setFeedback('Tournament changes could not be saved. Check browser storage and try again.', true);
            return false;
        }
        window.dispatchEvent(new CustomEvent('universe:tournaments-updated'));
        return true;
    }

    function renderTournamentSelector() {
        const select = document.getElementById('tournamentArchiveSelect');
        const prior = selectedTournamentId;
        select.replaceChildren();
        if (!tournaments.length) {
            select.add(new Option('No saved tournaments', ''));
            select.disabled = true;
            return;
        }
        select.disabled = false;
        tournaments
            .slice()
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
            .forEach(tournament => {
                const prefix = tournament.status === 'completed' ? 'COMPLETED' : 'ACTIVE';
                select.add(new Option(`${prefix} • ${tournament.name}`, tournament.id));
            });
        if (tournaments.some(tournament => tournament.id === prior)) {
            select.value = prior;
        } else {
            const preferred = tournaments.find(tournament => tournament.status === 'active') || tournaments[0];
            selectedTournamentId = preferred.id;
            select.value = preferred.id;
        }
    }

    function resolveTournamentFighter(entry) {
        if (!entry) return null;
        return roster.find(fighter =>
            (entry.fighterId && String(fighter.id || '') === String(entry.fighterId)) ||
            normalizeName(fighter.name) === normalizeName(entry.name)
        ) || null;
    }

    function makeFighterRow(tournament, match, fighterEntry, side) {
        const row = document.createElement('div');
        const winnerId = String(match.winnerId || '');
        const fighterId = String(fighterEntry?.fighterId || '');
        const isWinner = !!winnerId && (winnerId === fighterId ||
            normalizeName(fighterEntry?.name) === normalizeName(match.winnerName));
        row.className = `tournament-fighter-slot${isWinner ? ' is-winner' : ''}`;
        if (!fighterEntry) {
            const empty = document.createElement('span');
            empty.className = 'tournament-fighter-tbd';
            empty.textContent = 'TBD';
            row.appendChild(empty);
            return row;
        }

        const fighter = resolveTournamentFighter(fighterEntry);
        const portrait = document.createElement('span');
        portrait.className = 'tournament-fighter-portrait';
        const photo = fighter && (fighter.photo || fighter.image || fighter.profile_pic);
        if (photo) {
            const image = document.createElement('img');
            image.src = photo;
            image.alt = '';
            image.addEventListener('error', () => image.remove(), { once: true });
            portrait.appendChild(image);
        } else {
            portrait.textContent = String(fighterEntry.name || '?').trim().charAt(0).toUpperCase();
        }
        const seed = document.createElement('span');
        seed.className = 'tournament-fighter-seed';
        seed.textContent = fighterEntry.seed ? `#${fighterEntry.seed}` : '—';
        const name = document.createElement('strong');
        name.className = 'tournament-fighter-name';
        name.textContent = fighter?.name || fighterEntry.name || 'Unknown Fighter';
        const win = document.createElement('button');
        win.type = 'button';
        win.className = 'tournament-win-button';
        win.textContent = 'Win';
        win.disabled = tournament.status !== 'active' || !match.fighters?.[0] || !match.fighters?.[1] || !!match.winnerId;
        win.addEventListener('click', () => setTournamentWinner(tournament.id, match.id, fighterEntry.fighterId, side));
        row.append(seed, portrait, name, win);
        return row;
    }

    function renderMatch(tournament, roundIndex, match, matchIndex) {
        const card = document.createElement('article');
        card.className = 'tournament-match';
        card.dataset.matchId = match.id;
        const heading = document.createElement('div');
        heading.className = 'tournament-match__heading';
        heading.textContent = `Match ${matchIndex + 1}`;
        const fighters = document.createElement('div');
        fighters.className = 'tournament-match__fighters';
        fighters.append(
            makeFighterRow(tournament, match, match.fighters?.[0], 0),
            makeFighterRow(tournament, match, match.fighters?.[1], 1)
        );
        card.append(heading, fighters);

        if (match.winnerId) {
            const winner = match.fighters?.find(fighter =>
                String(fighter?.fighterId || '') === String(match.winnerId)
            );
            const result = document.createElement('p');
            result.className = 'tournament-match__result';
            result.textContent = `Winner: ${winner?.name || match.winnerName || 'Winner recorded'}`;
            card.appendChild(result);
        } else if (tournament.status === 'active' && match.fighters?.[0] && match.fighters?.[1]) {
            const booked = match.booked;
            const bookButton = document.createElement('button');
            bookButton.type = 'button';
            bookButton.className = 'tournament-book-button';
            bookButton.textContent = booked ? '↗ Go to Fight Card' : '📤 Book on Fight Card';
            bookButton.addEventListener('click', () => bookTournamentMatch(tournament.id, match.id));
            card.appendChild(bookButton);
            if (booked?.showName) {
                const bookedStatus = document.createElement('p');
                bookedStatus.className = 'tournament-match__booked';
                bookedStatus.textContent = `Booked • ${booked.showName}`;
                card.appendChild(bookedStatus);
            }
        }
        return card;
    }

    function renderTournament(tournament) {
        const emptyState = document.getElementById('tournamentEmptyState');
        const display = document.getElementById('tournamentDisplay');
        if (!tournament) {
            emptyState.hidden = false;
            display.hidden = true;
            return;
        }
        emptyState.hidden = true;
        display.hidden = false;
        const summary = document.getElementById('tournamentSummary');
        summary.replaceChildren();
        const title = document.createElement('strong');
        title.className = 'tournament-summary__name';
        title.textContent = tournament.name;
        const status = document.createElement('span');
        status.className = `tournament-status-pill tournament-status-pill--${tournament.status === 'completed' ? 'completed' : 'active'}`;
        status.textContent = tournament.status === 'completed' ? 'COMPLETED' : 'ACTIVE';
        const division = document.createElement('span');
        division.className = 'tournament-summary__pill';
        division.textContent = tournament.division === 'open' ? 'OPEN-WEIGHT' : tournament.division === 'female' ? 'WOMEN' : 'MEN';
        const size = document.createElement('span');
        size.className = 'tournament-summary__pill';
        size.textContent = `${tournament.bracketSize} FIGHTERS`;
        const prize = document.createElement('span');
        prize.className = 'tournament-summary__pill tournament-summary__pill--prize';
        prize.textContent = tournament.prizeTitleName
            ? `🏆 ${tournament.prizeTitleName}`
            : '🏆 Tournament Trophy / #1 Contender';
        summary.append(title, status, division, size, prize);

        const bracket = document.getElementById('tournamentBracket');
        bracket.replaceChildren();
        tournament.rounds.forEach((round, roundIndex) => {
            const column = document.createElement('section');
            column.className = 'tournament-round-column';
            const heading = document.createElement('h4');
            heading.className = 'tournament-round-heading';
            heading.textContent = round.name;
            const matches = document.createElement('div');
            matches.className = 'tournament-round-matches';
            round.matches.forEach((match, matchIndex) => {
                matches.appendChild(renderMatch(tournament, roundIndex, match, matchIndex));
            });
            column.append(heading, matches);
            bracket.appendChild(column);
        });
        const championColumn = document.createElement('section');
        championColumn.className = 'tournament-champion-column';
        const championHeading = document.createElement('h4');
        championHeading.className = 'tournament-round-heading';
        championHeading.textContent = 'Champion';
        const championCard = document.createElement('div');
        championCard.className = `tournament-champion-card${tournament.championId ? ' is-crowned' : ''}`;
        const crown = document.createElement('span');
        crown.className = 'tournament-champion-card__crown';
        crown.textContent = '👑 TOURNAMENT CHAMPION';
        const winner = roster.find(fighter => String(fighter.id || '') === String(tournament.championId || '')) ||
            roster.find(fighter => normalizeName(fighter.name) === normalizeName(tournament.championName));
        const portrait = document.createElement('span');
        portrait.className = 'tournament-champion-card__portrait';
        const championPhoto = winner && (winner.photo || winner.image || winner.profile_pic);
        if (championPhoto) {
            const image = document.createElement('img');
            image.src = championPhoto;
            image.alt = '';
            image.addEventListener('error', () => image.remove(), { once: true });
            portrait.appendChild(image);
        } else {
            portrait.textContent = winner ? String(winner.name || '?').trim().charAt(0).toUpperCase() : '🏆';
        }
        const championName = document.createElement('strong');
        championName.className = 'tournament-champion-card__name';
        championName.textContent = winner?.name || tournament.championName || 'Awaiting final winner';
        const championPrize = document.createElement('span');
        championPrize.className = 'tournament-champion-card__prize';
        championPrize.textContent = tournament.prizeTitleName || 'Tournament Trophy / #1 Contender';
        championCard.append(crown, portrait, championName, championPrize);
        championColumn.append(championHeading, championCard);
        bracket.appendChild(championColumn);
        setBracketFeedback('', false);
    }

    function renderArchive() {
        renderTournamentSelector();
        const select = document.getElementById('tournamentArchiveSelect');
        const tournament = tournaments.find(entry => entry.id === select.value);
        selectedTournamentId = tournament?.id || '';
        renderTournament(tournament);
    }

    function getTournamentLocation(tournamentId, matchId) {
        const tournament = tournaments.find(entry => String(entry.id) === String(tournamentId));
        if (!tournament || !Array.isArray(tournament.rounds)) return null;
        for (let roundIndex = 0; roundIndex < tournament.rounds.length; roundIndex++) {
            const matches = tournament.rounds[roundIndex]?.matches || [];
            const matchIndex = matches.findIndex(match => String(match.id) === String(matchId));
            if (matchIndex >= 0) return { tournament, roundIndex, matchIndex, match: matches[matchIndex] };
        }
        return null;
    }

    function awardTournamentPrize(tournament, winner) {
        if (!tournament.prizeTitleId) return true;
        const currentTitles = readArray(TITLES_KEY, 'championship');
        const title = currentTitles.find(entry =>
            String(entry?.id || '') === String(tournament.prizeTitleId) && activeTitle(entry)
        );
        if (!title) {
            setBracketFeedback('The linked championship is no longer active; the tournament champion was still crowned.', true);
            return true;
        }
        const currentChampionId = String(title.championId || title.champion?.id || '');
        if (currentChampionId !== String(winner.id || '')) {
            const priorHistory = Array.isArray(title.history) ? title.history : [];
            const priorReign = priorHistory[priorHistory.length - 1];
            if (currentChampionId && priorReign &&
                String(priorReign.fighterId || priorReign.championId || '') === currentChampionId) {
                priorReign.defenses = Math.max(
                    0,
                    Number(title.defenses ?? title.currentReignDefenses) || 0,
                    Number(priorReign.reignDefenses ?? priorReign.defenses) || 0
                );
                priorReign.reignDefenses = priorReign.defenses;
            }
            title.history = priorHistory;
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
            localStorage.setItem(TITLES_KEY, JSON.stringify(currentTitles));
        } catch (error) {
            console.error('Unable to award tournament championship prize.', error);
            setBracketFeedback('The tournament was completed, but its championship prize could not be saved.', true);
            return false;
        }
        window.dispatchEvent(new CustomEvent('wwe_titles:changed'));
        return true;
    }

    function setTournamentWinner(tournamentId, matchId, fighterId) {
        const location = getTournamentLocation(tournamentId, matchId);
        if (!location) return setBracketFeedback('This bracket match could not be found.', true);
        const { tournament, roundIndex, matchIndex, match } = location;
        if (tournament.status !== 'active') return;
        if (match.winnerId) return;
        const winner = match.fighters?.find(fighter =>
            String(fighter?.fighterId || '') === String(fighterId || '')
        );
        if (!winner) return setBracketFeedback('The selected fighter is not in this matchup.', true);

        match.winnerId = String(winner.fighterId || '');
        match.winnerName = String(winner.name || '');
        match.winnerSource = 'manual';
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
            const winnerFighter = resolveTournamentFighter(winner) || { id: winner.fighterId, name: winner.name };
            awardTournamentPrize(tournament, winnerFighter);
        }
        if (!persistTournaments()) return;
        renderArchive();
        setFeedback(`${winner.name} advances in ${tournament.name}.`, false);
    }

    function getOpenCardMatchIds(draft) {
        const fromDraft = Object.keys(draft).filter(id => /Container-m\d+$/.test(id));
        return Array.from(new Set([...fromDraft, ...DEFAULT_MATCH_IDS]));
    }

    function bookTournamentMatch(tournamentId, matchId) {
        const location = getTournamentLocation(tournamentId, matchId);
        if (!location || location.tournament.status !== 'active') return;
        const { tournament, match } = location;
        if (!match.fighters?.[0] || !match.fighters?.[1] || match.winnerId) return;
        if (match.booked?.showId) {
            window.location.href = 'index.html';
            return;
        }

        const shows = readArray('wwe_future_shows', 'Fight Card shows');
        const activeShowId = String(localStorage.getItem('wwe_active_show_id') || '');
        const activeShow = shows.find(show => String(show.id) === activeShowId);
        if (!activeShow) {
            setBracketFeedback('Select or create an active Fight Card before booking this matchup.', true);
            return;
        }
        const draftKey = `wwe_draft_${activeShowId}`;
        const draft = readObject(draftKey, 'Fight Card draft');
        const loggedMatches = readObject(`wwe_matches_${activeShowId}`, 'Fight Card results');
        const slotId = getOpenCardMatchIds(draft).find(id => {
            if (loggedMatches[id]) return false;
            const entry = draft[id] || {};
            if (entry.tournamentId || entry.tournamentMatchId) return false;
            const fighter1Name = String(entry.f1Name || entry.slot1Name || '').trim();
            const fighter2Name = String(entry.f2Name || entry.slot2Name || '').trim();
            return !fighter1Name && !fighter2Name;
        });
        if (!slotId) {
            setBracketFeedback('There are no empty match slots on the active card. Clear a slot or add more matches first.', true);
            return;
        }

        const fighter1 = resolveTournamentFighter(match.fighters[0]);
        const fighter2 = resolveTournamentFighter(match.fighters[1]);
        if (!fighter1 || !fighter2) {
            setBracketFeedback('A fighter in this matchup is no longer on the active roster.', true);
            return;
        }
        const previousDraft = localStorage.getItem(draftKey);
        const previousBooking = match.booked;
        draft[slotId] = {
            ...(draft[slotId] || {}),
            f1Name: fighter1.name,
            f1Id: String(fighter1.id || ''),
            f2Name: fighter2.name,
            f2Id: String(fighter2.id || ''),
            gender: isFemale(fighter1) ? 'female' : 'male',
            titleChecked: false,
            titleSelected: '',
            tournamentId: tournament.id,
            tournamentMatchId: match.id
        };
        match.booked = {
            showId: String(activeShow.id),
            showName: String(activeShow.name || 'Active Fight Card'),
            cardMatchId: slotId,
            status: 'booked'
        };
        try {
            localStorage.setItem(draftKey, JSON.stringify(draft));
            localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
        } catch (error) {
            console.error('Unable to book tournament match on the active Fight Card.', error);
            match.booked = previousBooking || null;
            try {
                if (previousDraft === null) localStorage.removeItem(draftKey);
                else localStorage.setItem(draftKey, previousDraft);
            } catch (restoreError) {
                console.error('Unable to restore the prior Fight Card draft after booking failed.', restoreError);
            }
            setBracketFeedback('The matchup could not be booked. Check browser storage and try again.', true);
            return;
        }
        setBracketFeedback(`${fighter1.name} vs. ${fighter2.name} booked on ${activeShow.name || 'the active card'}. Opening Fight Cards…`, false);
        window.location.href = 'index.html';
    }

    function createTournament(event) {
        event.preventDefault();
        const name = document.getElementById('tournamentName').value.trim();
        const size = Number(document.getElementById('tournamentSize').value);
        const division = document.getElementById('tournamentDivision').value;
        const selectedIds = seedIds.slice(0, size);
        const selectedKeys = new Set(selectedIds);
        if (!name) return setFeedback('Enter a tournament name before creating the bracket.', true);
        if (![8, 16].includes(size)) return setFeedback('Choose an 8- or 16-fighter bracket.', true);
        if (selectedIds.length !== size || selectedIds.some(key => !key) || selectedKeys.size !== size) {
            return setFeedback(`Choose ${size} different active fighters before creating the bracket.`, true);
        }
        const selectedFighters = selectedIds.map(getFighterByKey);
        if (selectedFighters.some(fighter => !fighter)) {
            return setFeedback('One or more selected fighters are no longer available. Reseed the bracket.', true);
        }
        const eligibleKeys = new Set(getEligibleFighters().map(fighterKey));
        if (selectedFighters.some(fighter =>
            fighter.retired === true || !eligibleKeys.has(fighterKey(fighter))
        )) {
            return setFeedback('Only active fighters in the selected division can enter this tournament.', true);
        }
        const prizeTitleId = document.getElementById('tournamentPrize').value;
        const prizeTitle = titles.find(title =>
            String(title.id || '') === prizeTitleId && activeTitle(title)
        );
        const id = `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const tournament = {
            id,
            name,
            bracketSize: size,
            division,
            prizeTitleId: prizeTitle ? String(prizeTitle.id) : '',
            prizeTitleName: prizeTitle ? String(prizeTitle.name || 'Championship') : '',
            status: 'active',
            createdAt: new Date().toISOString(),
            completedAt: '',
            entrants: selectedFighters.map((fighter, index) => ({
                fighterId: String(fighter.id || ''),
                name: String(fighter.name || ''),
                seed: index + 1
            })),
            rounds: createBracket(size, selectedFighters),
            championId: '',
            championName: ''
        };
        tournaments.push(tournament);
        selectedTournamentId = tournament.id;
        if (!persistTournaments()) {
            tournaments = tournaments.filter(entry => entry.id !== tournament.id);
            return;
        }
        renderArchive();
        setFeedback(`${name} is ready. Seed #1 opens against seed #${size}.`, false);
    }

    function initialize() {
        roster = readArray(ROSTER_KEY, 'Master Roster');
        titles = readArray(TITLES_KEY, 'championship');
        tournaments = readArray(TOURNAMENTS_KEY, 'tournament archive');
        const sizeSelect = document.getElementById('tournamentSize');
        seedIds = Array.from({ length: Number(sizeSelect.value) }, () => '');
        renderPrizeOptions();
        renderManualInputs();
        renderArchive();

        document.getElementById('tournamentCreatorForm').addEventListener('submit', createTournament);
        document.getElementById('autoSeedTournament').addEventListener('click', () => {
            const size = Number(sizeSelect.value);
            const ordered = getAutoSeedOrder().slice(0, size);
            seedIds = Array.from({ length: size }, (_, index) =>
                ordered[index] ? fighterKey(ordered[index]) : ''
            );
            renderManualInputs();
            const count = seedIds.filter(Boolean).length;
            updateSeedStatus(count < size
                ? `Only ${count} active fighters are eligible; ${size} are required.`
                : `${size} top contenders seeded by division ranking and record.`);
        });
        document.getElementById('randomizeTournament').addEventListener('click', () => {
            const size = Number(sizeSelect.value);
            const selected = shuffle(getEligibleFighters()).slice(0, size);
            seedIds = Array.from({ length: size }, (_, index) =>
                selected[index] ? fighterKey(selected[index]) : ''
            );
            renderManualInputs();
            const count = seedIds.filter(Boolean).length;
            updateSeedStatus(count < size
                ? `Only ${count} active fighters are eligible; ${size} are required.`
                : `Randomized ${size} active ${document.getElementById('tournamentDivision').selectedOptions[0].text.toLowerCase()} fighters.`);
        });
        document.getElementById('toggleManualSetup').addEventListener('click', event => {
            const panel = document.getElementById('manualTournamentSetup');
            panel.hidden = !panel.hidden;
            event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
            if (!panel.hidden) panel.querySelector('input')?.focus();
        });
        sizeSelect.addEventListener('change', () => {
            seedIds = Array.from({ length: Number(sizeSelect.value) }, (_, index) => seedIds[index] || '');
            renderManualInputs();
            updateSeedStatus();
        });
        document.getElementById('tournamentDivision').addEventListener('change', () => {
            seedIds = [];
            renderManualInputs();
            updateSeedStatus('Division changed. Reseed or choose fighters for the new division.');
        });
        document.getElementById('tournamentArchiveSelect').addEventListener('change', event => {
            selectedTournamentId = event.target.value;
            renderArchive();
        });
    }

    window.addEventListener('storage', event => {
        if (event.key === ROSTER_KEY) {
            roster = readArray(ROSTER_KEY, 'Master Roster');
            renderManualInputs();
        } else if (event.key === TITLES_KEY) {
            titles = readArray(TITLES_KEY, 'championship');
            renderPrizeOptions();
        } else if (event.key === TOURNAMENTS_KEY) {
            tournaments = readArray(TOURNAMENTS_KEY, 'tournament archive');
            renderArchive();
        }
    });

    document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
