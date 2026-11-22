(function () {
    function parseStorageArray(key, fallbackKey) {
        let raw = localStorage.getItem(key);
        if (raw === null && fallbackKey) raw = localStorage.getItem(fallbackKey);
        if (raw === null) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            console.error(`Ranking data in ${key} is not an array.`);
        } catch (error) {
            console.error(`Unable to read ranking data from ${key}.`, error);
        }
        return [];
    }

    function numberOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function normalizeGender(value) {
        const gender = String(value || '').trim().toLowerCase();
        return /^(f|female|w|woman|women)/.test(gender) ? 'female' : 'male';
    }

    function championIdentity(title) {
        const champion = title.championId || title.champion;
        if (champion && typeof champion === 'object') {
            return { id: String(champion.id || ''), name: String(champion.name || '') };
        }
        const value = String(champion || '').trim();
        if (!value || /^(vacant|null)$/i.test(value)) return null;
        return { id: value, name: value };
    }

    function getDivisionRankings() {
        const fighters = parseStorageArray('wwe_fighters', 'fighters')
            .filter(fighter => fighter && typeof fighter === 'object' && fighter.retired !== true);
        const titles = parseStorageArray('wwe_titles');
        const groups = new Map([
            ['male', { gender: 'male', division: 'Open Weight', fighters: [], championIds: new Set() }],
            ['female', { gender: 'female', division: 'Open Weight', fighters: [], championIds: new Set() }]
        ]);
        const fighterById = new Map();
        const fighterByName = new Map();

        fighters.forEach(fighter => {
            const gender = normalizeGender(fighter.gender);
            groups.get(gender).fighters.push(fighter);
            if (fighter.id) fighterById.set(String(fighter.id), fighter);
            if (fighter.name) fighterByName.set(String(fighter.name).trim().toLowerCase(), fighter);
        });

        titles.forEach(title => {
            if (!title || typeof title !== 'object') return;
            const identity = championIdentity(title);
            if (!identity) return;
            const champion = fighterById.get(identity.id) || fighterByName.get(identity.name.toLowerCase());
            if (!champion) return;

            const titleGender = title.gender ? normalizeGender(title.gender) : '';
            if (titleGender && titleGender !== normalizeGender(champion.gender)) return;
            const group = groups.get(normalizeGender(champion.gender));
            if (!group) return;
            if (champion.id) group.championIds.add(String(champion.id));
            else group.championIds.add(String(champion.name || '').trim().toLowerCase());
        });

        return Array.from(groups.values())
            .map(group => {
                const champions = [];
                const contenders = [];

                group.fighters.forEach(fighter => {
                    const isChampion = fighter.id
                        ? group.championIds.has(String(fighter.id))
                        : group.championIds.has(String(fighter.name || '').trim().toLowerCase());
                    const wins = numberOrZero(fighter.wins);
                    const losses = numberOrZero(fighter.losses);
                    const draws = numberOrZero(fighter.draws);
                    const winStreak = numberOrZero(fighter.win_streak);
                    const koWins = numberOrZero(fighter.win_ko ?? fighter.ko_wins);
                    const subWins = numberOrZero(fighter.win_submission ?? fighter.sub_wins);
                    const score = (winStreak * 15) + (wins * 5) - (losses * 4) + ((koWins + subWins) * 1.5);
                    const entry = { fighter, rank: isChampion ? 'C' : '', score };

                    if (isChampion) champions.push(entry);
                    else if (wins + losses + draws > 0) contenders.push(entry);
                });

                const scoreOrder = (a, b) =>
                    b.score - a.score ||
                    numberOrZero(b.fighter.wins) - numberOrZero(a.fighter.wins) ||
                    numberOrZero(a.fighter.losses) - numberOrZero(b.fighter.losses) ||
                    String(a.fighter.name || '').localeCompare(String(b.fighter.name || ''));
                champions.sort(scoreOrder);
                contenders.sort(scoreOrder);
                contenders.splice(15);
                contenders.forEach((entry, index) => {
                    entry.rank = `#${index + 1}`;
                    entry.rankNumber = index + 1;
                });

                return {
                    gender: group.gender,
                    division: group.division,
                    label: `${group.gender === 'female' ? "Women's" : "Men's"} Division`,
                    champions,
                    contenders,
                    rankings: champions.concat(contenders)
                };
            });
    }

    function getDivisionRankLookup(rankings) {
        const lookup = new Map();
        (rankings || getDivisionRankings()).forEach(group => {
            group.rankings.forEach(entry => {
                if (entry.fighter.id) lookup.set(String(entry.fighter.id), entry);
                if (entry.fighter.name) lookup.set(`name:${String(entry.fighter.name).trim().toLowerCase()}`, entry);
            });
        });
        return lookup;
    }

    function findFighterRanking(fighter, lookup) {
        if (!fighter || !lookup) return null;
        if (fighter.id && lookup.has(String(fighter.id))) return lookup.get(String(fighter.id));
        if (fighter.name) return lookup.get(`name:${String(fighter.name).trim().toLowerCase()}`) || null;
        return null;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function rankBadgeClass(rank) {
        return rank === 'C' ? 'division-rank-badge is-champion' : 'division-rank-badge is-contender';
    }

    window.getDivisionRankings = getDivisionRankings;
    window.getDivisionRankLookup = getDivisionRankLookup;
    window.getDivisionRankBadgeHtml = function (fighter, lookup) {
        const entry = findFighterRanking(fighter, lookup || getDivisionRankLookup());
        const fighterId = escapeHtml(fighter && fighter.id || '');
        const fighterName = escapeHtml(fighter && fighter.name || '');
        if (!entry) {
            return `<span class="division-rank-badge" data-rank-fighter-id="${fighterId}" data-rank-fighter-name="${fighterName}" hidden></span>`;
        }
        const title = entry.rank === 'C' ? 'Division Champion' : `Division rank ${entry.rank}`;
        return `<span class="${rankBadgeClass(entry.rank)}" data-rank-fighter-id="${fighterId}" data-rank-fighter-name="${fighterName}" title="${title}">${entry.rank}</span>`;
    };
    window.updateDivisionRankBadgeElement = function (element, fighter, lookup) {
        if (!element) return;
        const entry = findFighterRanking(fighter, lookup || getDivisionRankLookup());
        if (!entry) {
            element.hidden = true;
            element.textContent = '';
            element.className = 'division-rank-badge';
            if (fighter && fighter.id) element.setAttribute('data-rank-fighter-id', String(fighter.id));
            else element.removeAttribute('data-rank-fighter-id');
            if (fighter && fighter.name) element.setAttribute('data-rank-fighter-name', String(fighter.name));
            else element.removeAttribute('data-rank-fighter-name');
            return;
        }
        element.hidden = false;
        element.textContent = entry.rank;
        element.className = rankBadgeClass(entry.rank);
        if (entry.fighter.id) element.setAttribute('data-rank-fighter-id', String(entry.fighter.id));
        if (entry.fighter.name) element.setAttribute('data-rank-fighter-name', String(entry.fighter.name));
        element.title = entry.rank === 'C' ? 'Division Champion' : `Division rank ${entry.rank}`;
    };

    function renderRankingEntry(entry) {
        const fighter = entry.fighter;
        const photo = fighter.photo || fighter.image || fighter.profile_pic || '';
        const portrait = photo
            ? `<img src="${escapeHtml(photo)}" alt="" loading="lazy">`
            : `<span>${escapeHtml(String(fighter.name || '?').trim().charAt(0).toUpperCase())}</span>`;
        const wins = numberOrZero(fighter.wins);
        const losses = numberOrZero(fighter.losses);
        const streak = numberOrZero(fighter.win_streak);
        return `<article class="division-ranking-row">
            <span class="${rankBadgeClass(entry.rank)}">${entry.rank}</span>
            <div class="division-ranking-portrait">${portrait}</div>
            <div class="division-ranking-fighter">
                <strong>${escapeHtml(fighter.name || 'Unknown Fighter')}</strong>
                <span>${wins}-${losses} record · ${streak} win streak</span>
            </div>
        </article>`;
    }

    function renderDivisionRankingWidget() {
        const select = document.getElementById('divisionRankingSelect');
        const list = document.getElementById('divisionRankingsList');
        if (!select || !list) return;

        const priorSelection = select.value;
        const rankings = getDivisionRankings();
        select.replaceChildren();
        rankings.forEach(group => select.add(new Option(group.label, `${group.gender}|${group.division}`)));

        if (!rankings.length) {
            list.innerHTML = '<p class="division-rankings-empty">No active fighters are available to rank.</p>';
            return;
        }

        if (rankings.some(group => `${group.gender}|${group.division}` === priorSelection)) {
            select.value = priorSelection;
        }
        const selected = rankings.find(group => `${group.gender}|${group.division}` === select.value) || rankings[0];
        const entries = selected.champions.concat(selected.contenders);
        list.innerHTML = entries.length
            ? entries.map(renderRankingEntry).join('')
            : '<p class="division-rankings-empty">No champion or ranked contenders in this division yet.</p>';
    }

    function refreshDivisionRankBadges() {
        const fighters = parseStorageArray('wwe_fighters', 'fighters');
        const byId = new Map(fighters.filter(fighter => fighter && fighter.id).map(fighter => [String(fighter.id), fighter]));
        const byName = new Map(fighters.filter(fighter => fighter && fighter.name)
            .map(fighter => [String(fighter.name).trim().toLowerCase(), fighter]));
        const lookup = getDivisionRankLookup();

        document.querySelectorAll('[data-rank-fighter-id], .fighter-slot .division-rank-badge').forEach(element => {
            const slot = element.closest('.fighter-slot');
            const input = slot && slot.querySelector('.fighter-search-input');
            const fighter = byId.get(element.getAttribute('data-rank-fighter-id') || '') ||
                (input && byName.get(input.value.trim().toLowerCase())) ||
                byName.get((element.getAttribute('data-rank-fighter-name') || '').trim().toLowerCase());
            window.updateDivisionRankBadgeElement(element, fighter, lookup);
        });
        renderDivisionRankingWidget();
    }

    window.refreshDivisionRankings = refreshDivisionRankBadges;
    window.addEventListener('wwe_fighters:changed', refreshDivisionRankBadges);
    window.addEventListener('wwe_titles:changed', refreshDivisionRankBadges);
    window.addEventListener('storage', event => {
        if (event.key === 'wwe_fighters' || event.key === 'fighters' || event.key === 'wwe_titles') {
            refreshDivisionRankBadges();
        }
    });

    function initializeRankings() {
        const select = document.getElementById('divisionRankingSelect');
        if (select && !select.dataset.rankingsBound) {
            select.dataset.rankingsBound = 'true';
            select.addEventListener('change', renderDivisionRankingWidget);
        }
        refreshDivisionRankBadges();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRankings, { once: true });
    } else {
        initializeRankings();
    }
})();
