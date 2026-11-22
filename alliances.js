(() => {
    'use strict';

    const ALLIANCES_KEY = 'universeAlliances';
    const TYPE_META = {
        romantic: { label: '❤️ ROMANTIC COUPLE' },
        family: { label: '🩸 FAMILY / BLOODLINE' },
        friends: { label: '🤝 FRIENDS / ALLIES' }
    };
    const elements = {
        type: document.getElementById('allianceRelationshipType'),
        name: document.getElementById('allianceName'),
        memberSearch: document.getElementById('allianceMemberSearch'),
        options: document.getElementById('allianceFighterOptions'),
        addMember: document.getElementById('addAllianceMember'),
        pending: document.getElementById('pendingAllianceMembers'),
        save: document.getElementById('saveAlliance'),
        cancelEdit: document.getElementById('cancelAllianceEdit'),
        feedback: document.getElementById('allianceBuilderFeedback'),
        search: document.getElementById('allianceSearch'),
        filterPills: Array.from(document.querySelectorAll('.alliance-filter-pill')),
        count: document.getElementById('allianceLibraryCount'),
        grid: document.getElementById('allianceGrid')
    };

    let fighters = [];
    let titles = [];
    let alliances = [];
    let pendingMembers = [];
    let editingId = '';
    let activeFilter = 'all';
    let allianceStorageInvalid = false;

    function normalizeName(value) {
        return String(value || '').normalize('NFC').trim().toLocaleLowerCase();
    }

    function setFeedback(message, isError = true) {
        elements.feedback.textContent = message;
        elements.feedback.style.color = isError ? '#fda4af' : '#86efac';
    }

    function readRoster() {
        const raw = localStorage.getItem('wwe_fighters') || localStorage.getItem('fighters') || '[]';
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error('Stored fighter roster is not an array.');
            return parsed.filter(fighter => fighter && fighter.name);
        } catch (error) {
            console.error('Unable to load the Master Roster for Alliances & Couples.', error);
            setFeedback('The Master Roster could not be read. Repair the roster data before editing groups.');
            return [];
        }
    }

    function readTitles() {
        const raw = localStorage.getItem('wwe_titles') || '[]';
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error('Saved championship data is not an array.');
            return parsed.filter(title => title && typeof title === 'object');
        } catch (error) {
            console.error('Unable to load championships for alliance stats.', error);
            setFeedback('Championship data could not be read. Belt totals may be incomplete.');
            return [];
        }
    }

    function readAlliances() {
        const raw = localStorage.getItem(ALLIANCES_KEY);
        if (raw === null) {
            allianceStorageInvalid = false;
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error('Saved alliance data is not an array.');
            allianceStorageInvalid = false;
            return parsed.filter(alliance =>
                alliance && typeof alliance === 'object' &&
                typeof alliance.id === 'string' &&
                typeof alliance.name === 'string' &&
                Array.isArray(alliance.members)
            ).map(alliance => ({
                id: alliance.id,
                name: alliance.name,
                type: Object.prototype.hasOwnProperty.call(TYPE_META, alliance.type) ? alliance.type : 'friends',
                members: alliance.members.map(member => String(member || '').trim()).filter(Boolean)
            }));
        } catch (error) {
            allianceStorageInvalid = true;
            console.error('Unable to read saved alliances. Existing data was left untouched.', error);
            setFeedback('Saved alliance data is invalid. It was not overwritten; repair or remove the universeAlliances value to continue.');
            return [];
        }
    }

    function refreshData() {
        fighters = readRoster();
        titles = readTitles();
        alliances = readAlliances();
        populateFighterOptions();
        renderAlliances();
    }

    function getFighterByName(name) {
        const key = normalizeName(name);
        return fighters.find(fighter => normalizeName(fighter.name) === key) || null;
    }

    function populateFighterOptions() {
        elements.options.replaceChildren();
        fighters.filter(fighter => fighter.retired !== true)
            .slice()
            .sort((a, b) => String(a.name).localeCompare(String(b.name)))
            .forEach(fighter => {
                const option = document.createElement('option');
                option.value = fighter.name;
                option.label = `${fighter.name} • ${fighter.gender || 'Unknown'} • ${fighter.division || fighter.weightClass || 'Open Weight'}`;
                elements.options.appendChild(option);
            });
    }

    function renderPendingMembers() {
        elements.pending.replaceChildren();
        if (!pendingMembers.length) {
            const empty = document.createElement('span');
            empty.className = 'alliance-pending-empty';
            empty.textContent = 'Add at least two fighters to create this group.';
            elements.pending.appendChild(empty);
            return;
        }

        pendingMembers.forEach((name, index) => {
            const chip = document.createElement('span');
            chip.className = 'alliance-member-chip';
            const label = document.createElement('span');
            label.textContent = name;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = '×';
            remove.setAttribute('aria-label', `Remove ${name}`);
            remove.addEventListener('click', () => {
                pendingMembers.splice(index, 1);
                renderPendingMembers();
            });
            chip.append(label, remove);
            elements.pending.appendChild(chip);
        });
    }

    function updateMemberPickerState() {
        const isRomantic = elements.type.value === 'romantic';
        elements.addMember.disabled = isRomantic && pendingMembers.length >= 2;
        elements.addMember.title = elements.addMember.disabled
            ? 'A romantic couple has exactly two members.'
            : 'Add the selected fighter to this group.';
    }

    function addPendingMember() {
        const requestedName = elements.memberSearch.value.trim();
        const fighter = getFighterByName(requestedName);
        if (!fighter || fighter.retired === true) {
            setFeedback('Choose an active fighter from the roster suggestions.');
            return;
        }
        if (pendingMembers.some(name => normalizeName(name) === normalizeName(fighter.name))) {
            setFeedback(`${fighter.name} is already in this group.`);
            return;
        }
        if (elements.type.value === 'romantic' && pendingMembers.length >= 2) {
            setFeedback('Romantic couples can contain exactly two members.');
            return;
        }
        pendingMembers.push(fighter.name);
        elements.memberSearch.value = '';
        setFeedback('');
        renderPendingMembers();
        updateMemberPickerState();
    }

    function makeAllianceId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return `alliance-${window.crypto.randomUUID()}`;
        }
        return `alliance-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function saveAlliance() {
        if (allianceStorageInvalid) {
            setFeedback('The existing alliance data is invalid and has not been changed.');
            return;
        }
        const name = elements.name.value.trim();
        const type = elements.type.value;
        const members = pendingMembers.slice();
        if (!name) {
            setFeedback('Enter a group or couple name.');
            elements.name.focus();
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(TYPE_META, type)) {
            setFeedback('Choose a valid relationship type.');
            return;
        }
        if (members.length < 2) {
            setFeedback('Every alliance needs at least two members.');
            return;
        }
        if (type === 'romantic' && members.length !== 2) {
            setFeedback('Romantic couples require exactly two members. Remove extra members or change the relationship type.');
            return;
        }
        if (new Set(members.map(normalizeName)).size !== members.length) {
            setFeedback('Remove duplicate fighters before saving.');
            return;
        }
        if (alliances.some(alliance =>
            alliance.id !== editingId && normalizeName(alliance.name) === normalizeName(name)
        )) {
            setFeedback('Another group already uses that name.');
            return;
        }

        const updatedAlliance = {
            id: editingId || makeAllianceId(),
            name,
            type,
            members
        };
        const updated = editingId
            ? alliances.map(alliance => alliance.id === editingId ? updatedAlliance : alliance)
            : [...alliances, updatedAlliance];
        try {
            localStorage.setItem(ALLIANCES_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Unable to save Alliances & Couples.', error);
            setFeedback(`The group could not be saved: ${error.message || 'storage is unavailable'}`);
            return;
        }
        alliances = updated;
        resetBuilder();
        renderAlliances();
        setFeedback(`${updatedAlliance.name} saved.`, false);
    }

    function resetBuilder() {
        elements.type.value = 'romantic';
        elements.name.value = '';
        elements.memberSearch.value = '';
        pendingMembers = [];
        editingId = '';
        elements.save.textContent = '💾 Save Group / Couple';
        elements.cancelEdit.hidden = true;
        renderPendingMembers();
        updateMemberPickerState();
    }

    function editAlliance(allianceId) {
        const alliance = alliances.find(item => item.id === allianceId);
        if (!alliance) return;
        editingId = alliance.id;
        elements.type.value = alliance.type;
        elements.name.value = alliance.name;
        pendingMembers = alliance.members.slice();
        elements.save.textContent = '💾 Save Group / Couple';
        elements.cancelEdit.hidden = false;
        setFeedback(`Editing ${alliance.name}. Save to apply member changes.`, false);
        renderPendingMembers();
        updateMemberPickerState();
        elements.name.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteAlliance(allianceId) {
        const alliance = alliances.find(item => item.id === allianceId);
        if (!alliance || !window.confirm(`Delete "${alliance.name}"? This will not change any fighter records.`)) return;
        const updated = alliances.filter(item => item.id !== allianceId);
        try {
            localStorage.setItem(ALLIANCES_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Unable to delete the saved alliance.', error);
            setFeedback(`The group could not be deleted: ${error.message || 'storage is unavailable'}`);
            return;
        }
        alliances = updated;
        if (editingId === allianceId) resetBuilder();
        setFeedback(`${alliance.name} deleted.`, false);
        renderAlliances();
    }

    function getChampionIdentity(title) {
        const holder = title.championId || title.champion;
        if (holder && typeof holder === 'object') {
            return {
                id: String(holder.id || ''),
                name: String(holder.name || '')
            };
        }
        return { id: String(holder || ''), name: String(holder || '') };
    }

    function getHeldTitlesForFighter(fighter) {
        return titles.filter(title => {
            const holder = getChampionIdentity(title);
            return (holder.id && String(fighter.id || '') === holder.id) ||
                normalizeName(holder.name) === normalizeName(fighter.name);
        });
    }

    function calculateStats(alliance) {
        const memberProfiles = alliance.members.map(name => ({
            name,
            fighter: getFighterByName(name)
        }));
        const totals = memberProfiles.reduce((stats, item) => {
            const fighter = item.fighter;
            if (!fighter) return stats;
            const heldTitles = getHeldTitlesForFighter(fighter);
            const beltDefenses = heldTitles.reduce((sum, title) =>
                sum + Math.max(0, Number(title.defenses) || 0), 0
            );
            stats.wins += Math.max(0, Number(fighter.wins) || 0);
            stats.losses += Math.max(0, Number(fighter.losses) || 0);
            stats.belts += heldTitles.length;
            stats.defenses += Math.max(
                0,
                Number(fighter.lifetime_defenses) || 0,
                beltDefenses
            );
            stats.pin += Math.max(0, Number(fighter.win_pinfall ?? fighter.pin_wins) || 0);
            stats.ko += Math.max(0, Number(fighter.win_ko ?? fighter.ko_wins) || 0);
            stats.sub += Math.max(0, Number(fighter.win_submission ?? fighter.sub_wins) || 0);
            return stats;
        }, { wins: 0, losses: 0, belts: 0, defenses: 0, pin: 0, ko: 0, sub: 0 });
        const fights = totals.wins + totals.losses;
        totals.winRate = fights ? Math.round((totals.wins / fights) * 100) : 0;
        return { totals, memberProfiles };
    }

    function makeStat(label, value) {
        const wrapper = document.createElement('div');
        wrapper.className = 'alliance-stat';
        const statLabel = document.createElement('span');
        statLabel.className = 'alliance-stat__label';
        statLabel.textContent = label;
        const statValue = document.createElement('strong');
        statValue.className = 'alliance-stat__value';
        statValue.textContent = value;
        wrapper.append(statLabel, statValue);
        return wrapper;
    }

    function getRankLookup() {
        if (typeof window.getDivisionRankings !== 'function' ||
            typeof window.getDivisionRankLookup !== 'function') return null;
        try {
            return window.getDivisionRankLookup(window.getDivisionRankings());
        } catch (error) {
            console.error('Unable to load division ranks for alliance portraits.', error);
            setFeedback('Division ranks are temporarily unavailable; group stats remain available.');
            return null;
        }
    }

    function makeMemberCard(member, rankLookup) {
        const fighter = member.fighter;
        const card = document.createElement('div');
        card.className = `alliance-member${fighter ? '' : ' alliance-member--missing'}`;
        const portraitWrap = document.createElement('div');
        portraitWrap.className = 'alliance-member__portrait-wrap';
        const portrait = document.createElement('div');
        portrait.className = 'alliance-member__portrait portrait-frame-base';
        if (fighter) {
            const photo = String(fighter.photo || fighter.image || fighter.profile_pic || '').trim();
            if (photo) {
                const image = document.createElement('img');
                image.src = photo;
                image.alt = `${member.name} portrait`;
                image.loading = 'lazy';
                image.addEventListener('error', () => {
                    image.remove();
                    portrait.textContent = member.name.trim().charAt(0).toUpperCase() || '?';
                }, { once: true });
                portrait.appendChild(image);
            } else {
                portrait.textContent = member.name.trim().charAt(0).toUpperCase() || '?';
            }
            if (typeof window.applyWinStreakPortraitClass === 'function') {
                window.applyWinStreakPortraitClass(portrait, fighter);
            }
            const rankBadge = document.createElement('span');
            rankBadge.className = 'division-rank-badge';
            if (typeof window.updateDivisionRankBadgeElement === 'function') {
                window.updateDivisionRankBadgeElement(rankBadge, fighter, rankLookup);
            } else {
                rankBadge.hidden = true;
            }
            portraitWrap.append(portrait, rankBadge);
        } else {
            portrait.textContent = member.name.trim().charAt(0).toUpperCase() || '?';
            portraitWrap.appendChild(portrait);
        }

        const name = document.createElement('span');
        name.className = 'alliance-member__name';
        name.textContent = member.name;
        if (!fighter) name.title = 'This member is not currently on the Master Roster.';
        const record = document.createElement('span');
        record.className = 'alliance-member__record';
        record.textContent = fighter
            ? `${Number(fighter.wins) || 0}W - ${Number(fighter.losses) || 0}L`
            : 'Not on roster';
        card.append(portraitWrap, name, record);
        return card;
    }

    function makeFinishCircle(label, value, modifier) {
        const circle = document.createElement('div');
        circle.className = `alliance-finish-circle alliance-finish-circle--${modifier}`;
        const number = document.createElement('strong');
        number.textContent = String(value);
        const finishLabel = document.createElement('span');
        finishLabel.textContent = label;
        circle.append(number, finishLabel);
        return circle;
    }

    function makeAllianceCard(alliance, rankLookup) {
        const card = document.createElement('article');
        card.className = 'alliance-card';
        const { totals, memberProfiles } = calculateStats(alliance);
        const type = TYPE_META[alliance.type] || TYPE_META.friends;

        const header = document.createElement('header');
        header.className = 'alliance-card__header';
        const titleBlock = document.createElement('div');
        titleBlock.className = 'alliance-card__title';
        const title = document.createElement('h3');
        title.textContent = alliance.name;
        const badges = document.createElement('div');
        badges.className = 'alliance-card__badges';
        const typeBadge = document.createElement('span');
        typeBadge.className = `alliance-type-badge alliance-type-badge--${alliance.type}`;
        typeBadge.textContent = type.label;
        const memberCount = document.createElement('span');
        memberCount.className = 'alliance-member-count';
        memberCount.textContent = `${alliance.members.length} ${alliance.members.length === 1 ? 'MEMBER' : 'MEMBERS'}`;
        badges.append(typeBadge, memberCount);
        titleBlock.append(title, badges);

        const actions = document.createElement('div');
        actions.className = 'alliance-card__actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'alliance-edit-button';
        edit.dataset.action = 'edit';
        edit.dataset.allianceId = alliance.id;
        edit.textContent = '✏️ Edit Members';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'alliance-delete-button';
        remove.dataset.action = 'delete';
        remove.dataset.allianceId = alliance.id;
        remove.textContent = '🗑️ Delete';
        actions.append(edit, remove);
        header.append(titleBlock, actions);

        const memberStrip = document.createElement('div');
        memberStrip.className = 'alliance-member-strip';
        memberProfiles.forEach(member => memberStrip.appendChild(makeMemberCard(member, rankLookup)));

        const stats = document.createElement('div');
        stats.className = 'alliance-stats';
        stats.append(
            makeStat('Combined W - L Scoreboard', `${totals.wins} - ${totals.losses}`),
            makeStat('Combined Win Rate', `${totals.winRate}%`),
            makeStat('🏆 Total Belts Held', String(totals.belts)),
            makeStat('🛡️ Total Title Defenses', String(totals.defenses))
        );

        const finishes = document.createElement('div');
        finishes.className = 'alliance-finishes';
        finishes.append(
            makeFinishCircle('PIN', totals.pin, 'pin'),
            makeFinishCircle('KO', totals.ko, 'ko'),
            makeFinishCircle('SUB', totals.sub, 'sub')
        );
        card.append(header, memberStrip, stats, finishes);
        return { card, hasChampionship: totals.belts > 0 };
    }

    function renderAlliances() {
        if (!elements.grid) return;
        const query = normalizeName(elements.search.value);
        const rankLookup = getRankLookup();
        const filtered = alliances.map(alliance => ({
            alliance,
            stats: calculateStats(alliance)
        })).filter(({ alliance, stats }) => {
            const matchesFilter = activeFilter === 'all' ||
                (activeFilter === 'championship'
                    ? stats.totals.belts > 0
                    : alliance.type === activeFilter);
            const searchableText = normalizeName(`${alliance.name} ${alliance.members.join(' ')}`);
            return matchesFilter && (!query || searchableText.includes(query));
        });

        elements.grid.replaceChildren();
        elements.count.textContent = `${filtered.length} ${filtered.length === 1 ? 'GROUP' : 'GROUPS'} SHOWN`;
        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'alliance-empty-state';
            empty.textContent = alliances.length
                ? 'No groups match those filters.'
                : 'No alliances yet. Create a couple, family, or friend faction above.';
            elements.grid.appendChild(empty);
            return;
        }

        filtered.forEach(({ alliance }) => {
            const rendered = makeAllianceCard(alliance, rankLookup);
            elements.grid.appendChild(rendered.card);
        });
    }

    function setActiveFilter(filter) {
        activeFilter = filter;
        elements.filterPills.forEach(pill => {
            const isActive = pill.dataset.filter === filter;
            pill.classList.toggle('is-active', isActive);
            pill.setAttribute('aria-pressed', String(isActive));
        });
        renderAlliances();
    }

    elements.addMember.addEventListener('click', addPendingMember);
    elements.memberSearch.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addPendingMember();
        }
    });
    elements.type.addEventListener('change', updateMemberPickerState);
    elements.save.addEventListener('click', saveAlliance);
    elements.cancelEdit.addEventListener('click', () => {
        resetBuilder();
        setFeedback('Edit cancelled.', false);
    });
    elements.search.addEventListener('input', renderAlliances);
    elements.filterPills.forEach(pill =>
        pill.addEventListener('click', () => setActiveFilter(pill.dataset.filter))
    );
    elements.grid.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        if (button.dataset.action === 'edit') editAlliance(button.dataset.allianceId);
        if (button.dataset.action === 'delete') deleteAlliance(button.dataset.allianceId);
    });
    window.addEventListener('storage', event => {
        if ([ALLIANCES_KEY, 'wwe_fighters', 'fighters', 'wwe_titles'].includes(event.key)) refreshData();
    });
    window.addEventListener('wwe_fighters:changed', refreshData);
    window.addEventListener('wwe_titles:changed', refreshData);

    refreshData();
    renderPendingMembers();
    updateMemberPickerState();
})();
