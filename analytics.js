(function () {
    'use strict';

    const SHOWS_PER_SEASON = 20;
    const awardsGrid = document.getElementById('seasonAwardsGrid');
    const seasonSelector = document.getElementById('seasonAwardsSelector');
    const seasonStatus = document.getElementById('seasonAwardsStatus');
    const awardsContent = document.getElementById('seasonAwardsContent');
    const awardsToggle = document.getElementById('seasonAwardsToggle');
    const awardsCollapsedStorageKey = 'wwe_season_awards_collapsed';

    if (!awardsGrid || !seasonSelector || !seasonStatus || !awardsContent || !awardsToggle) return;

    function setAwardsCollapsed(collapsed, persist) {
        awardsContent.hidden = collapsed;
        awardsToggle.setAttribute('aria-expanded', String(!collapsed));
        awardsToggle.textContent = collapsed ? '▸ Expand Awards' : '▾ Minimize';
        if (!persist) return;

        try {
            localStorage.setItem(awardsCollapsedStorageKey, String(collapsed));
        } catch (error) {
            console.error('Unable to save the Season Awards panel state.', error);
            window.alert('The Season Awards panel preference could not be saved.');
        }
    }

    setAwardsCollapsed(localStorage.getItem(awardsCollapsedStorageKey) === 'true', false);
    awardsToggle.addEventListener('click', () => {
        setAwardsCollapsed(!awardsContent.hidden, true);
    });

    function readArray(storageKey) {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];

        try {
            const value = JSON.parse(raw);
            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.warn(`Season Awards could not parse ${storageKey}.`, error);
            return [];
        }
    }

    function readStoredMatches(storageKey) {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];

        try {
            const value = JSON.parse(raw);
            if (Array.isArray(value)) return value;
            return value && typeof value === 'object' ? Object.values(value) : [];
        } catch (error) {
            console.warn(`Season Awards could not parse ${storageKey}.`, error);
            return [];
        }
    }

    function normalizeName(value) {
        return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function normalizeMatch(source, showName) {
        if (!source || typeof source !== 'object') return null;

        const winner = String(source.winner || source.winnerName || '').trim();
        const loser = String(source.loser || source.loserName || '').trim();
        if (!winner || !loser) return null;

        return {
            ...source,
            winner,
            loser,
            winnerId: String(source.winnerId || ''),
            loserId: String(source.loserId || ''),
            method: String(source.method || source.methodName || source.methodId || 'Result').trim(),
            methodId: String(source.methodId || ''),
            showName: String(source.showName || source.showTitle || showName || 'Show').trim(),
            fightTime: String(source.fightTime || '').trim(),
            bonusType: String(source.bonusType || '').trim().toUpperCase(),
            rivalryTag: String(source.rivalryTag || '').trim().toLowerCase()
        };
    }

    function normalizeMatches(sources, showName) {
        const entries = Array.isArray(sources)
            ? sources
            : sources && typeof sources === 'object'
                ? Object.values(sources)
                : [];
        return entries.map(match => normalizeMatch(match, showName)).filter(Boolean);
    }

    function parseTimestamp(...values) {
        for (const value of values) {
            if (!value) continue;
            const timestamp = Date.parse(String(value));
            if (Number.isFinite(timestamp)) return timestamp;
        }
        return 0;
    }

    function getShowName(record) {
        return String(record.showTitle || record.name || record.title || 'Show').trim();
    }

    function getFinalizedShows() {
        const records = new Map();
        let insertionOrder = 0;
        const futureShows = readArray('wwe_future_shows');
        const archivedEvents = readArray('wwe_event_history');

        futureShows.forEach((show, index) => {
            if (!show || show.completed !== true) return;

            const showId = String(show.id || '');
            const showName = getShowName(show);
            const key = showId
                ? `show:${showId}`
                : `legacy-show:${normalizeName(showName)}:${index}`;
            records.set(key, {
                key,
                showId,
                name: showName,
                completedAt: show.completedAt || show.date || show.createdAt || '',
                timestamp: parseTimestamp(show.completedAt, show.date, show.createdAt),
                matches: showId ? normalizeMatches(readStoredMatches(`wwe_matches_${showId}`), showName) : [],
                sourceOrder: insertionOrder++,
                archivedEventId: ''
            });
        });

        archivedEvents.forEach((event, index) => {
            if (!event || !Array.isArray(event.matches)) return;

            const showName = getShowName(event);
            const showId = String(event.showId || '');
            const eventId = String(event.id || `${normalizeName(showName)}:${event.completedAt || event.date || index}`);
            const eventMatches = normalizeMatches(event.matches, showName);
            let record = showId ? records.get(`show:${showId}`) : null;

            if (!record && !showId) {
                const eventTimestamp = parseTimestamp(event.completedAt, event.date);
                record = [...records.values()].find(candidate => {
                    if (candidate.archivedEventId || normalizeName(candidate.name) !== normalizeName(showName)) return false;
                    if (!eventTimestamp || !candidate.timestamp) return true;
                    return Math.abs(eventTimestamp - candidate.timestamp) <= 24 * 60 * 60 * 1000;
                }) || null;
            }

            if (!record) {
                const key = showId ? `show:${showId}` : `archive:${eventId}`;
                record = {
                    key,
                    showId,
                    name: showName,
                    completedAt: event.completedAt || event.date || '',
                    timestamp: parseTimestamp(event.completedAt, event.date),
                    matches: [],
                    sourceOrder: insertionOrder++,
                    archivedEventId: ''
                };
                records.set(key, record);
            }

            record.archivedEventId = eventId;
            record.name = showName || record.name;
            record.completedAt = event.completedAt || event.date || record.completedAt;
            record.timestamp = parseTimestamp(event.completedAt, event.date) || record.timestamp;
            if (eventMatches.length) record.matches = eventMatches;
        });

        return [...records.values()].sort((a, b) => {
            if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
            if (a.timestamp && !b.timestamp) return -1;
            if (!a.timestamp && b.timestamp) return 1;
            return a.sourceOrder - b.sourceOrder;
        });
    }

    function buildFighterLookup(fighters) {
        const byId = new Map();
        const byName = new Map();
        fighters.forEach(fighter => {
            if (!fighter || !fighter.name) return;
            if (fighter.id != null) byId.set(String(fighter.id), fighter);
            const nameKey = normalizeName(fighter.name);
            if (nameKey && !byName.has(nameKey)) byName.set(nameKey, fighter);
        });
        return { byId, byName };
    }

    function resolveFighter(name, id, lookup) {
        return (id && lookup.byId.get(String(id))) || lookup.byName.get(normalizeName(name)) || null;
    }

    function getFightTimeSeconds(value) {
        const parts = String(value || '').trim().split(':');
        if (parts.length !== 2 && parts.length !== 3) return null;
        if (!parts.every(part => /^\d+$/.test(part))) return null;

        const numbers = parts.map(Number);
        if (numbers.slice(1).some(part => part > 59)) return null;
        const seconds = parts.length === 2
            ? numbers[0] * 60 + numbers[1]
            : numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
        return seconds > 0 ? seconds : null;
    }

    function formatFightTime(value) {
        const seconds = getFightTimeSeconds(value);
        if (seconds == null) return '';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;
        return hours
            ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
            : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    }

    function classifyFinish(match) {
        const finish = `${match.methodId} ${match.method}`.toLowerCase();
        if (finish.includes('win_ko') || /\bko\b|\btko\b/.test(finish)) return 'ko';
        if (finish.includes('win_submission') || /\bsubmission\b|\bsub\b/.test(finish)) return 'submission';
        return '';
    }

    function getStatsKey(name, id, fighter) {
        if (fighter && fighter.id != null) return `id:${fighter.id}`;
        if (id) return `id:${id}`;
        return `name:${normalizeName(name)}`;
    }

    function buildSeasonStats(matches, lookup) {
        const stats = new Map();

        function ensureStats(name, id) {
            const fighter = resolveFighter(name, id, lookup);
            const key = getStatsKey(name, id, fighter);
            if (!stats.has(key)) {
                stats.set(key, {
                    key,
                    name: fighter ? fighter.name : name,
                    fighter,
                    gender: String(fighter?.gender || 'male').toLowerCase(),
                    wins: 0,
                    losses: 0,
                    titleWins: 0,
                    bonuses: 0,
                    kos: 0,
                    submissions: 0,
                    fastestKoSeconds: null,
                    fastestKoTime: '',
                    fastestSubmissionSeconds: null,
                    fastestSubmissionTime: '',
                    score: 0
                });
            }
            return stats.get(key);
        }

        matches.forEach(match => {
            const winner = ensureStats(match.winner, match.winnerId);
            const loser = ensureStats(match.loser, match.loserId);
            winner.wins += 1;
            loser.losses += 1;

            if (match.isTitle === true || match.titleFight === true) winner.titleWins += 1;
            const finish = classifyFinish(match);
            const fightTimeSeconds = getFightTimeSeconds(match.fightTime);

            if (finish === 'ko') {
                winner.kos += 1;
                if (fightTimeSeconds != null && (winner.fastestKoSeconds == null || fightTimeSeconds < winner.fastestKoSeconds)) {
                    winner.fastestKoSeconds = fightTimeSeconds;
                    winner.fastestKoTime = match.fightTime;
                }
            } else if (finish === 'submission') {
                winner.submissions += 1;
                if (fightTimeSeconds != null &&
                    (winner.fastestSubmissionSeconds == null || fightTimeSeconds < winner.fastestSubmissionSeconds)) {
                    winner.fastestSubmissionSeconds = fightTimeSeconds;
                    winner.fastestSubmissionTime = match.fightTime;
                }
            }

            if (match.bonusType === 'FOTN') {
                winner.bonuses += 1;
                loser.bonuses += 1;
            } else if (match.bonusType === 'POTN') {
                winner.bonuses += 1;
            }
        });

        stats.forEach(fighter => {
            fighter.score = fighter.wins * 10 + fighter.titleWins * 15 + fighter.bonuses * 5;
        });
        return stats;
    }

    function compareNames(a, b) {
        return a.name.localeCompare(b.name);
    }

    function getFighterOfYear(stats, gender) {
        return [...stats.values()]
            .filter(fighter => fighter.wins > 0 && fighter.gender === gender)
            .sort((a, b) =>
                b.score - a.score ||
                b.wins - a.wins ||
                b.titleWins - a.titleWins ||
                b.bonuses - a.bonuses ||
                compareNames(a, b)
            )[0] || null;
    }

    function getFinishLeader(stats, finishType) {
        const countKey = finishType === 'ko' ? 'kos' : 'submissions';
        const timeKey = finishType === 'ko' ? 'fastestKoSeconds' : 'fastestSubmissionSeconds';
        return [...stats.values()]
            .filter(fighter => fighter[countKey] > 0)
            .sort((a, b) =>
                b[countKey] - a[countKey] ||
                (a[timeKey] == null ? Infinity : a[timeKey]) - (b[timeKey] == null ? Infinity : b[timeKey]) ||
                compareNames(a, b)
            )[0] || null;
    }

    function getUpsetScore(match) {
        const reason = String(match.upsetReason || '').toLowerCase();
        let score = match.upsetAlert === true ? 10 : 0;
        if (match.bossSlain === true) score += 25;
        if (reason.includes('champion')) score += 100;
        const rankedOpponent = reason.match(/#(\d+)\s+contender/);
        if (rankedOpponent) score += Math.max(1, 50 - Number(rankedOpponent[1]));
        if (reason.includes('streak')) score += 5;
        return score;
    }

    function getUpsetOfYear(matches) {
        return matches
            .filter(match => match.upsetAlert === true || match.bossSlain === true)
            .sort((a, b) => getUpsetScore(b) - getUpsetScore(a))[0] || null;
    }

    function getFightOfYear(matches) {
        return matches
            .filter(match => match.bonusType === 'FOTN' || match.rivalryTag === 'trilogy')
            .sort((a, b) =>
                Number(b.bonusType === 'FOTN') - Number(a.bonusType === 'FOTN') ||
                Number(b.rivalryTag === 'trilogy') - Number(a.rivalryTag === 'trilogy')
            )[0] || null;
    }

    function createPortrait(name, fighter) {
        const portrait = document.createElement('div');
        portrait.className = 'season-award-portrait';
        const initials = String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
        const photo = fighter && (fighter.photo || fighter.image);

        if (typeof photo === 'string' && photo.trim()) {
            const image = document.createElement('img');
            image.src = photo;
            image.alt = `${name} portrait`;
            image.loading = 'lazy';
            image.addEventListener('error', () => {
                portrait.replaceChildren(document.createTextNode(initials));
            }, { once: true });
            portrait.appendChild(image);
        } else {
            portrait.textContent = initials;
        }
        return portrait;
    }

    function createAwardCard(award) {
        const card = document.createElement('article');
        card.className = 'season-award-card';

        const header = document.createElement('div');
        header.className = 'season-award-card__header';
        const title = document.createElement('h3');
        title.className = 'season-award-card__title';
        title.textContent = award.title;
        const badge = document.createElement('span');
        badge.className = `season-award-badge${award.hasWinner ? (award.isCurrent ? ' season-award-badge--live' : '') : ' season-award-badge--empty'}`;
        badge.textContent = award.hasWinner
            ? (award.isCurrent ? 'LIVE LEADER' : 'OFFICIAL WINNER')
            : 'AWAITING RESULTS';
        header.append(title, badge);

        const body = document.createElement('div');
        body.className = 'season-award-card__body';
        body.appendChild(createPortrait(award.name || 'Awaiting results', award.fighter));
        const identity = document.createElement('div');
        identity.className = 'season-award-card__winner';
        const winner = document.createElement('strong');
        winner.textContent = award.name || 'No qualifying winner yet';
        identity.appendChild(winner);

        const supportingText = [award.detail, award.stats].filter(Boolean).join(' • ');
        if (supportingText) {
            const stats = document.createElement('span');
            stats.className = 'season-award-card__stats';
            stats.textContent = supportingText;
            identity.appendChild(stats);
        }
        body.appendChild(identity);

        card.append(header, body);
        return card;
    }

    function getMatchFighter(match, side, lookup) {
        return resolveFighter(match[side], match[`${side}Id`], lookup);
    }

    function makeAwards(matches, fighters, lookup, isCurrent) {
        const stats = buildSeasonStats(matches, lookup);
        const men = getFighterOfYear(stats, 'male');
        const women = getFighterOfYear(stats, 'female');
        const koLeader = getFinishLeader(stats, 'ko');
        const submissionLeader = getFinishLeader(stats, 'submission');
        const upset = getUpsetOfYear(matches);
        const fight = getFightOfYear(matches);

        function fighterAward(title, fighter) {
            return {
                title,
                isCurrent,
                hasWinner: Boolean(fighter),
                name: fighter?.name || '',
                fighter: fighter?.fighter || fighters.find(item => normalizeName(item.name) === normalizeName(fighter?.name)) || null,
                detail: fighter ? `${fighter.titleWins} title wins • ${fighter.bonuses} bonuses` : '',
                stats: fighter ? `${fighter.wins}W - ${fighter.losses}L • ${fighter.kos} KOs • ${fighter.score} season points` : ''
            };
        }

        function finishAward(title, fighter, type) {
            const count = type === 'ko' ? fighter?.kos : fighter?.submissions;
            const fastestTime = type === 'ko' ? fighter?.fastestKoTime : fighter?.fastestSubmissionTime;
            const fastestLabel = type === 'ko' ? 'Fastest KO' : 'Fastest submission';
            return {
                title,
                isCurrent,
                hasWinner: Boolean(fighter),
                name: fighter?.name || '',
                fighter: fighter?.fighter || fighters.find(item => normalizeName(item.name) === normalizeName(fighter?.name)) || null,
                detail: fighter ? `${count} ${type === 'ko' ? 'KO' : 'submission'} win${count === 1 ? '' : 's'}` : '',
                stats: fighter
                    ? `${fighter.wins}W - ${fighter.losses}L • ${fastestLabel}: ${formatFightTime(fastestTime) || 'No recorded time'}`
                    : ''
            };
        }

        function matchAward(title, match, isUpset) {
            if (!match) return { title, isCurrent, hasWinner: false, name: '', fighter: null, detail: '', stats: '' };
            const winnerFighter = getMatchFighter(match, 'winner', lookup);
            const mark = isUpset
                ? (match.bossSlain === true ? '☠️ BOSS SLAYER' : '🚨 UPSET')
                : [
                    match.bonusType === 'FOTN' ? '🏆 FOTN' : '',
                    match.rivalryTag === 'trilogy' ? '🔥 TRILOGY' : ''
                ].filter(Boolean).join(' • ');
            const result = `${match.loser} • ${match.showName}`;
            const method = match.method || 'Result';
            const fightTime = formatFightTime(match.fightTime);
            return {
                title,
                isCurrent,
                hasWinner: true,
                name: match.winner,
                fighter: winnerFighter,
                detail: `${result} • ${method}`,
                stats: `${mark}${fightTime ? ` • ${fightTime}` : ''}${match.upsetReason && isUpset ? ` • ${match.upsetReason}` : ''}`
            };
        }

        return [
            fighterAward("🏆 Men's Fighter of the Year", men),
            fighterAward("👑 Women's Fighter of the Year", women),
            finishAward('💥 KO Artist of the Season', koLeader, 'ko'),
            finishAward('🔒 Submission Specialist of the Season', submissionLeader, 'submission'),
            matchAward('🚨 Upset of the Year', upset, true),
            matchAward('🔥 Fight / Rivalry of the Year', fight, false)
        ];
    }

    function refreshSeasonSelector(shows, currentSeason) {
        const previousValue = seasonSelector.value || 'current';
        seasonSelector.replaceChildren();

        const currentOption = document.createElement('option');
        currentOption.value = 'current';
        const currentStart = (currentSeason - 1) * SHOWS_PER_SEASON + 1;
        const currentEnd = currentSeason * SHOWS_PER_SEASON;
        currentOption.textContent = `Current Season (Live Race) — Season ${currentSeason} • Shows ${currentStart}–${currentEnd}`;
        seasonSelector.appendChild(currentOption);

        for (let season = 1; season < currentSeason; season += 1) {
            const option = document.createElement('option');
            option.value = String(season);
            const firstShow = (season - 1) * SHOWS_PER_SEASON + 1;
            const lastShow = season * SHOWS_PER_SEASON;
            option.textContent = `Season ${season} • Shows ${firstShow}–${lastShow} — Official Winner`;
            seasonSelector.appendChild(option);
        }

        const previousSeason = Number(previousValue);
        seasonSelector.value = previousValue !== 'current' &&
            Number.isInteger(previousSeason) &&
            previousSeason > 0 &&
            previousSeason < currentSeason
            ? previousValue
            : 'current';
    }

    function getLeaderboardFighters() {
        const primaryRoster = readArray('wwe_fighters');
        const roster = primaryRoster.length ? primaryRoster : readArray('fighters');
        return roster.filter(fighter => fighter && fighter.name);
    }

    function getInitialTitleWins() {
        if (typeof window.getUniverseTitleRules === 'function') {
            return Number(window.getUniverseTitleRules().initialTitleWins) === 10 ? 10 : 5;
        }

        const legacyMinimum = localStorage.getItem('titleWinMinimum') === '10' ? 10 : 5;
        const rawRules = localStorage.getItem('universeTitleRules');
        if (!rawRules) return legacyMinimum;

        try {
            const rules = JSON.parse(rawRules);
            return Number(rules?.initialTitleWins) === 10 ? 10
                : Number(rules?.initialTitleWins) === 5 ? 5 : legacyMinimum;
        } catch (error) {
            console.warn('Roster Leaders could not parse universeTitleRules.', error);
            return legacyMinimum;
        }
    }

    function getLeaderCount(fighter, field) {
        return Math.max(0, Math.floor(Number(fighter?.[field]) || 0));
    }

    function getLeaderTitleBonusCount(fighter) {
        return getLeaderCount(fighter, 'fotn_bonuses') + getLeaderCount(fighter, 'potn_bonuses');
    }

    function getLeaderStreakTier(streak) {
        if (streak >= 47) return 'MASTER PRESTIGE';
        if (streak >= 43) return 'BLOOD MOON';
        if (streak >= 39) return 'CYBER';
        if (streak >= 35) return 'COSMIC';
        if (streak >= 31) return 'HELLFIRE';
        if (streak >= 26) return 'LIGHTNING';
        if (streak >= 22) return 'RAINBOW';
        if (streak >= 18) return 'GOLD';
        if (streak >= 13) return 'BLUE';
        if (streak >= 7) return 'GREEN';
        if (streak >= 3) return 'PURPLE';
        return 'CONTENDER';
    }

    function getTopLeader(fighters, metric) {
        return [...fighters].sort((a, b) =>
            metric(b) - metric(a) ||
            getLeaderCount(b, 'wins') - getLeaderCount(a, 'wins') ||
            String(a.name).localeCompare(String(b.name))
        )[0] || null;
    }

    function createLeaderPortrait(fighter, name, useInitials) {
        const portrait = document.createElement('div');
        portrait.className = 'leader-card__portrait';
        const cachedPhoto = fighter?.photo_key && window._fighterPhotoCache
            ? window._fighterPhotoCache[String(fighter.photo_key)]
            : '';
        const photo = fighter && (
            fighter.photo ||
            fighter.image ||
            fighter.profile_pic ||
            cachedPhoto
        );

        function showFallback() {
            const initials = useInitials
                ? String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?'
                : '—';
            const fallback = document.createElement('span');
            fallback.textContent = initials;
            fallback.setAttribute('aria-hidden', 'true');
            portrait.replaceChildren(fallback);
        }

        if (typeof photo === 'string' && photo.trim()) {
            const image = document.createElement('img');
            image.src = photo;
            image.alt = `${name} portrait`;
            image.loading = 'lazy';
            image.addEventListener('error', showFallback, { once: true });
            portrait.appendChild(image);
        } else {
            showFallback();
        }
        return portrait;
    }

    function createLeaderCard(leader) {
        const card = document.createElement('article');
        card.className = 'leader-card';
        const copy = document.createElement('div');
        copy.className = 'leader-card__copy';
        const category = document.createElement('span');
        category.className = 'leader-card__category';
        category.textContent = leader.category;
        const name = document.createElement('strong');
        name.className = 'leader-card__name';
        name.textContent = leader.name;
        const stat = document.createElement('span');
        stat.className = 'leader-card__stat';
        stat.textContent = leader.stat;
        copy.append(category, name, stat);
        card.append(createLeaderPortrait(leader.fighter, leader.name, leader.useInitials), copy);
        return card;
    }

    function getFastestRecordedFinish(fighters) {
        const lookup = buildFighterLookup(fighters);
        const matches = getFinalizedShows().flatMap(show => show.matches);
        const fastest = matches
            .map(match => ({ match, seconds: getFightTimeSeconds(match.fightTime) }))
            .filter(entry => entry.seconds != null)
            .sort((a, b) => a.seconds - b.seconds)[0];

        if (!fastest) return null;

        const match = fastest.match;
        const finishText = `${match.methodId} ${match.method}`.toLowerCase();
        const method = finishText.includes('win_ko') || /\bko\b|\btko\b/.test(finishText)
            ? 'KO'
            : finishText.includes('win_submission') || /\bsubmission\b|\bsub\b/.test(finishText)
                ? 'SUB'
                : finishText.includes('win_pinfall') || /\bpin(?:fall)?\b/.test(finishText)
                    ? 'PIN'
                    : String(match.method || 'FINISH').toUpperCase();
        return {
            fighter: resolveFighter(match.winner, match.winnerId, lookup),
            name: match.winner,
            stat: `${formatFightTime(match.fightTime)} • ${method}`,
            useInitials: true
        };
    }

    function renderRosterLeaders() {
        const target = document.getElementById('topLeaders');
        if (!target) return;

        const fighters = getLeaderboardFighters();
        const activeFighters = fighters.filter(fighter => fighter.retired !== true);
        const longestStreak = getTopLeader(activeFighters, fighter => getLeaderCount(fighter, 'win_streak'));
        const bonusLeader = getTopLeader(fighters, getLeaderTitleBonusCount);
        const giantKiller = getTopLeader(fighters, fighter => getLeaderCount(fighter, 'giant_kills'));
        const bossSlayer = getTopLeader(fighters, fighter => getLeaderCount(fighter, 'boss_slays'));
        const titleMinimum = getInitialTitleWins();
        const eligibleFighters = activeFighters.filter(fighter =>
            getLeaderCount(fighter, 'rebuild_wins_required') === 0 &&
            (fighter.title_comeback_completed === true ||
                getLeaderCount(fighter, 'win_streak') >= titleMinimum)
        );
        const titleLeader = getTopLeader(eligibleFighters, fighter => getLeaderCount(fighter, 'win_streak'));
        const fastest = getFastestRecordedFinish(fighters);
        const leaders = [
            {
                category: '🔥 LONGEST ACTIVE STREAK',
                fighter: longestStreak,
                name: longestStreak?.name || 'No active fighters yet',
                stat: longestStreak
                    ? `${getLeaderCount(longestStreak, 'win_streak')}W STREAK • ${getLeaderStreakTier(getLeaderCount(longestStreak, 'win_streak'))} TIER`
                    : 'No active fighters yet',
                useInitials: Boolean(longestStreak)
            },
            {
                category: '🏅 MOST PERFORMANCE BONUSES',
                fighter: bonusLeader,
                name: bonusLeader?.name || 'No fighters yet',
                stat: bonusLeader
                    ? `${getLeaderTitleBonusCount(bonusLeader)} Bonuses • ${getLeaderCount(bonusLeader, 'fotn_bonuses')} FOTN / ${getLeaderCount(bonusLeader, 'potn_bonuses')} POTN`
                    : '0 Bonuses',
                useInitials: Boolean(bonusLeader)
            },
            {
                category: '⚔️ TOP GIANT KILLER',
                fighter: giantKiller,
                name: giantKiller?.name || 'No fighters yet',
                stat: `${getLeaderCount(giantKiller, 'giant_kills')} Giant Kills`,
                useInitials: Boolean(giantKiller)
            },
            {
                category: '🗡️ TOP BOSS SLAYER',
                fighter: bossSlayer,
                name: bossSlayer?.name || 'No fighters yet',
                stat: `${getLeaderCount(bossSlayer, 'boss_slays')} Boss Slays`,
                useInitials: Boolean(bossSlayer)
            },
            {
                category: '⚡ FASTEST RECORDED FINISH',
                fighter: fastest?.fighter || null,
                name: fastest?.name || 'No timed fights yet',
                stat: fastest?.stat || 'No timed fights yet',
                useInitials: Boolean(fastest)
            },
            {
                category: '🟢 TITLE ELIGIBLE CONTENDERS',
                fighter: titleLeader,
                name: titleLeader?.name || 'No eligible contenders',
                stat: `🟢 ${eligibleFighters.length} Fighters Eligible`,
                useInitials: Boolean(titleLeader)
            }
        ];

        target.replaceChildren(...leaders.map(createLeaderCard));
    }

    function renderSeasonAwards() {
        const shows = getFinalizedShows();
        const fighters = readArray('wwe_fighters');
        const roster = fighters.length ? fighters : readArray('fighters');
        const lookup = buildFighterLookup(roster);
        const currentSeason = Math.floor(shows.length / SHOWS_PER_SEASON) + 1;
        refreshSeasonSelector(shows, currentSeason);

        const isCurrent = seasonSelector.value === 'current';
        const selectedSeason = isCurrent ? currentSeason : Number(seasonSelector.value);
        const start = (selectedSeason - 1) * SHOWS_PER_SEASON;
        const selectedShows = shows.slice(start, isCurrent ? shows.length : start + SHOWS_PER_SEASON);
        const selectedMatches = selectedShows.flatMap(show =>
            show.matches.map(match => ({ ...match, showName: match.showName || show.name }))
        );

        seasonStatus.textContent = isCurrent
            ? `Season ${currentSeason} • Shows ${start + 1}–${start + SHOWS_PER_SEASON} • LIVE RACE • ${selectedShows.length} of ${SHOWS_PER_SEASON} finalized shows`
            : `Season ${selectedSeason} • Shows ${start + 1}–${start + SHOWS_PER_SEASON} • OFFICIAL WINNERS • ${selectedShows.length} finalized shows`;
        awardsGrid.replaceChildren(...makeAwards(selectedMatches, roster, lookup, isCurrent).map(createAwardCard));
    }

    seasonSelector.addEventListener('change', renderSeasonAwards);
    window.addEventListener('storage', event => {
        if (event.key === 'wwe_future_shows' || event.key === 'wwe_event_history' || event.key === 'wwe_fighters' || event.key === 'fighters') {
            renderSeasonAwards();
            renderRosterLeaders();
        }
    });
    window.addEventListener('universeTitleRules:changed', renderRosterLeaders);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            renderSeasonAwards();
            renderRosterLeaders();
        }, { once: true });
    } else {
        renderSeasonAwards();
        renderRosterLeaders();
    }
})();
