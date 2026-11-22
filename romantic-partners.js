(function () {
    'use strict';

    const ALLIANCES_KEY = 'universeAlliances';
    const PRIMARY_ROSTER_KEY = 'wwe_fighters';
    const NAME_SELECTOR = [
        '.fighter-name-target',
        '.fighter-name',
        '.history-fighter-name',
        '.winner-line',
        '.loser-line',
        '.champion-name',
        '.romantic-partner-name',
        '.fighter-analytics-copy h3',
        '.fighter-search-input',
        '#fighterTitleMatchLookup'
    ].join(',');
    const describedByValues = new WeakMap();
    let cachedAllianceRaw;
    let cachedRosterRaw;
    let lookup = {
        fightersById: new Map(),
        fightersByName: new Map(),
        partnersById: new Map(),
        partnersByName: new Map()
    };
    let tooltip;
    let activeTarget = null;
    let touchHideTimer = 0;

    function normalizeName(value) {
        return String(value || '').normalize('NFC').trim().toLocaleLowerCase();
    }

    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Unable to read ${key} for romantic partner tooltips.`, error);
            return null;
        }
    }

    function parseArray(raw, key) {
        if (raw === null) return [];
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error('Stored value must be an array.');
            return parsed;
        } catch (error) {
            console.error(`Unable to parse ${key} for romantic partner tooltips.`, error);
            return [];
        }
    }

    function mapPartner(map, key, partner, groupName) {
        if (!key || !partner.name) return;
        const partners = map.get(key) || [];
        const partnerKey = partner.id || normalizeName(partner.name);
        if (!partners.some(item =>
            (item.id || normalizeName(item.name)) === partnerKey &&
            item.groupName === groupName
        )) {
            partners.push({
                id: partner.id,
                name: partner.name,
                groupName
            });
        }
        map.set(key, partners);
    }

    function isRomanticAlliance(alliance) {
        const type = alliance.type || alliance.relationshipType || alliance.relationship || '';
        return alliance.isRomantic === true ||
            String(type).toLocaleLowerCase().includes('romantic');
    }

    function buildLookup(roster, alliances) {
        const next = {
            fightersById: new Map(),
            fightersByName: new Map(),
            partnersById: new Map(),
            partnersByName: new Map()
        };
        roster.forEach(fighter => {
            if (!fighter || !fighter.name) return;
            const name = String(fighter.name).trim();
            const id = String(fighter.id || '').trim();
            const normalizedName = normalizeName(name);
            if (id) next.fightersById.set(id, fighter);
            if (normalizedName && !next.fightersByName.has(normalizedName)) {
                next.fightersByName.set(normalizedName, fighter);
            }
        });

        function resolveMember(member) {
            const memberObject = member && typeof member === 'object' ? member : null;
            const id = String(memberObject
                ? (memberObject.id || memberObject.fighterId || memberObject.fighter_id || '')
                : member || '').trim();
            if (id && next.fightersById.has(id)) {
                const fighter = next.fightersById.get(id);
                return { id, name: String(fighter.name).trim() };
            }
            const name = String(memberObject
                ? (memberObject.name || memberObject.fighterName || memberObject.fighter_name || '')
                : member || '').trim();
            const fighter = name ? next.fightersByName.get(normalizeName(name)) : null;
            return {
                id: String(fighter?.id || id || '').trim(),
                name: String(fighter?.name || name).trim()
            };
        }

        alliances.filter(alliance => alliance && typeof alliance === 'object' && isRomanticAlliance(alliance))
            .forEach(alliance => {
                const sourceMembers = Array.isArray(alliance.members)
                    ? alliance.members.slice()
                    : Array.isArray(alliance.fighters)
                        ? alliance.fighters.slice()
                        : [];
                if (Array.isArray(alliance.memberIds)) sourceMembers.push(...alliance.memberIds);
                const members = sourceMembers.map(resolveMember).filter(member => member.name);
                const uniqueMembers = members.filter((member, index) =>
                    members.findIndex(other => member.id && other.id
                        ? member.id === other.id
                        : normalizeName(member.name) === normalizeName(other.name)
                    ) === index
                );
                const groupName = String(alliance.name || alliance.groupName || '').trim();

                uniqueMembers.forEach((member, index) => {
                    uniqueMembers.forEach((partner, partnerIndex) => {
                        if (partnerIndex === index) return;
                        if (member.id) mapPartner(next.partnersById, member.id, partner, groupName);
                        mapPartner(next.partnersByName, normalizeName(member.name), partner, groupName);
                    });
                });
            });

        return next;
    }

    function refreshLookup(force) {
        const allianceRaw = readStorage(ALLIANCES_KEY);
        const primaryRosterRaw = readStorage(PRIMARY_ROSTER_KEY);
        const rosterRaw = primaryRosterRaw === null
            ? readStorage('fighters')
            : primaryRosterRaw;
        if (!force && allianceRaw === cachedAllianceRaw && rosterRaw === cachedRosterRaw) return false;

        cachedAllianceRaw = allianceRaw;
        cachedRosterRaw = rosterRaw;
        lookup = buildLookup(
            parseArray(rosterRaw, PRIMARY_ROSTER_KEY),
            parseArray(allianceRaw, ALLIANCES_KEY)
        );
        return true;
    }

    function getTargetId(target) {
        const idElement = target.closest('[data-fighter-id], [data-rank-fighter-id], [data-champion-id]');
        if (idElement) {
            const id = idElement.getAttribute('data-fighter-id') ||
                idElement.getAttribute('data-rank-fighter-id') ||
                idElement.getAttribute('data-champion-id');
            if (id) return id.trim();
        }
        const card = target.closest('[id^="fighter-card-"]');
        return card ? card.id.slice('fighter-card-'.length) : '';
    }

    function getTargetName(target) {
        if (target.matches('input')) return target.value.trim();
        const explicitName = target.getAttribute('data-romantic-fighter-name');
        if (explicitName) return explicitName.trim();
        return target.textContent.trim().replace(/^(?:👑\s*|Defeated\s+)/i, '').trim();
    }

    function resolveTargetFighter(target) {
        const id = getTargetId(target);
        if (id && lookup.fightersById.has(id)) return lookup.fightersById.get(id);
        const name = normalizeName(getTargetName(target));
        return name ? lookup.fightersByName.get(name) || null : null;
    }

    function getPartners(fighter) {
        if (!fighter) return [];
        const id = String(fighter.id || '').trim();
        const byId = id ? lookup.partnersById.get(id) : null;
        if (byId && byId.length) return byId;
        const name = normalizeName(fighter.name);
        return name ? lookup.partnersByName.get(name) || [] : [];
    }

    function isNaturallyFocusable(target) {
        return target.hasAttribute('tabindex') ||
            /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName);
    }

    function setDescription(target) {
        if (!describedByValues.has(target)) {
            describedByValues.set(target, target.getAttribute('aria-describedby'));
        }
        const previous = describedByValues.get(target);
        const ids = String(previous || '').split(/\s+/).filter(Boolean);
        if (!ids.includes(tooltip.id)) ids.push(tooltip.id);
        target.setAttribute('aria-describedby', ids.join(' '));
    }

    function restoreDescription(target) {
        if (!describedByValues.has(target)) return;
        const previous = describedByValues.get(target);
        if (previous === null) target.removeAttribute('aria-describedby');
        else target.setAttribute('aria-describedby', previous);
        describedByValues.delete(target);
    }

    function updateTarget(target) {
        const partners = getPartners(resolveTargetFighter(target));
        if (!partners.length) {
            target.classList.remove('romantic-partner-trigger');
            target.removeAttribute('data-romantic-partner-tooltip-target');
            restoreDescription(target);
            if (target.dataset.romanticPartnerAddedTabindex === 'true') {
                target.removeAttribute('tabindex');
                delete target.dataset.romanticPartnerAddedTabindex;
            }
            if (activeTarget === target) hideTooltip();
            return [];
        }

        target.classList.add('romantic-partner-trigger');
        target.setAttribute('data-romantic-partner-tooltip-target', 'true');
        setDescription(target);
        if (!isNaturallyFocusable(target)) {
            target.tabIndex = 0;
            target.dataset.romanticPartnerAddedTabindex = 'true';
        }
        return partners;
    }

    function findTarget(element) {
        const target = element instanceof Element ? element : element?.parentElement;
        return target ? target.closest(NAME_SELECTOR) : null;
    }

    function processTree(node) {
        const element = node instanceof Element ? node : node?.parentElement;
        if (!element) return;
        if (element.matches(NAME_SELECTOR)) updateTarget(element);
        element.querySelectorAll(NAME_SELECTOR).forEach(updateTarget);
    }

    function refreshAllTargets() {
        document.querySelectorAll(NAME_SELECTOR).forEach(updateTarget);
        if (activeTarget) {
            const partners = updateTarget(activeTarget);
            if (partners.length) renderTooltip(activeTarget, partners);
        }
    }

    function renderTooltip(target, partners) {
        const labels = [];
        partners.forEach(partner => {
            const label = `${partner.name}${partner.groupName ? ` (${partner.groupName})` : ''}`;
            if (!labels.some(existing => normalizeName(existing) === normalizeName(label))) {
                labels.push(label);
            }
        });
        tooltip.replaceChildren();
        const heart = document.createElement('span');
        heart.className = 'romantic-partner-tooltip__heart';
        heart.setAttribute('aria-hidden', 'true');
        heart.textContent = '♥';
        const text = document.createElement('span');
        text.textContent = `Partner: ${labels.join(', ')}`;
        tooltip.append(heart, text);
        tooltip.hidden = false;
        activeTarget = target;
        positionTooltip(target);
    }

    function positionTooltip(target) {
        if (!target || !target.isConnected || tooltip.hidden) return;
        const rect = target.getBoundingClientRect();
        const margin = 12;
        const gap = 8;
        const box = tooltip.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            hideTooltip();
            return;
        }
        const left = Math.max(margin, Math.min(rect.left, window.innerWidth - box.width - margin));
        const below = rect.top < box.height + gap + margin;
        const top = below
            ? Math.min(window.innerHeight - box.height - margin, rect.bottom + gap)
            : rect.top - box.height - gap;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${Math.max(margin, top)}px`;
    }

    function showTooltip(target) {
        refreshLookup(false);
        const partners = updateTarget(target);
        if (partners.length) renderTooltip(target, partners);
        else hideTooltip();
    }

    function hideTooltip() {
        window.clearTimeout(touchHideTimer);
        if (tooltip) tooltip.hidden = true;
        activeTarget = null;
    }

    function init() {
        tooltip = document.createElement('div');
        tooltip.id = 'romantic-partner-tooltip';
        tooltip.className = 'romantic-partner-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.hidden = true;
        document.body.appendChild(tooltip);

        refreshLookup(true);
        processTree(document.body);

        document.addEventListener('mouseover', event => {
            const target = findTarget(event.target);
            if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
            showTooltip(target);
        });
        document.addEventListener('mouseout', event => {
            const target = findTarget(event.target);
            if (target && activeTarget === target &&
                !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) {
                hideTooltip();
            }
        });
        document.addEventListener('focusin', event => {
            const target = findTarget(event.target);
            if (target) showTooltip(target);
        });
        document.addEventListener('focusout', event => {
            const target = findTarget(event.target);
            if (target && activeTarget === target &&
                !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) {
                hideTooltip();
            }
        });
        document.addEventListener('input', event => {
            const target = findTarget(event.target);
            if (target) updateTarget(target);
        });
        document.addEventListener('touchstart', event => {
            const target = findTarget(event.target);
            if (!target) return;
            showTooltip(target);
            window.clearTimeout(touchHideTimer);
            touchHideTimer = window.setTimeout(hideTooltip, 4000);
        }, { passive: true });
        document.addEventListener('pointerdown', event => {
            if (activeTarget && !activeTarget.contains(event.target)) hideTooltip();
        });

        const observer = new MutationObserver(records => {
            records.forEach(record => {
                if (record.type === 'childList') {
                    record.addedNodes.forEach(processTree);
                    if (record.addedNodes.length === 0) processTree(record.target);
                }
            });
            if (activeTarget && !activeTarget.isConnected) hideTooltip();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('storage', event => {
            if (!event.key || [ALLIANCES_KEY, PRIMARY_ROSTER_KEY, 'fighters'].includes(event.key)) {
                refreshLookup(true);
                refreshAllTargets();
            }
        });
        window.addEventListener('pageshow', () => {
            if (refreshLookup(false)) refreshAllTargets();
        });
        window.addEventListener('focus', () => {
            if (refreshLookup(false)) refreshAllTargets();
        });
        window.addEventListener('resize', () => positionTooltip(activeTarget));
        window.addEventListener('scroll', () => positionTooltip(activeTarget), true);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && refreshLookup(false)) refreshAllTargets();
        });
    }

    if (document.body) init();
    else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
