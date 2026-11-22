(function() {
    const lightningOverlayMarkup = `<svg class="lightning-overlay" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path class="lightning-bolt lightning-bolt--cyan lightning-bolt--one" d="M24 5 31 16 25 22 34 27 29 38"/>
        <path class="lightning-bolt lightning-bolt--white lightning-bolt--two" d="M68 4 63 16 71 21 65 27 74 39"/>
        <path class="lightning-bolt lightning-bolt--cyan lightning-bolt--three" d="M96 34 84 40 90 47 78 53 89 60"/>
        <path class="lightning-bolt lightning-bolt--white lightning-bolt--four" d="M77 95 72 83 79 77 69 70 74 59"/>
        <path class="lightning-bolt lightning-bolt--cyan lightning-bolt--five" d="M23 96 29 84 21 79 32 72 26 61"/>
        <path class="lightning-bolt lightning-bolt--white lightning-bolt--six" d="M4 37 16 42 11 49 23 54 14 62"/>
    </svg>`;
    const masterPrestigeOverlayMarkup = `<svg class="prestige-skull-overlay" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <g class="prestige-skull prestige-skull--one" transform="translate(7 5)">
            <path class="prestige-skull__shell" d="M12 2.5C6.8 2.5 3 6.4 3 11.1c0 3 1.5 5.3 4 6.5v3.2h10v-3.2c2.5-1.2 4-3.5 4-6.5 0-4.7-3.8-8.6-9-8.6Z"/>
            <path class="prestige-skull__jaw" d="M7 17.6h10m-9.5 2.1v2m3-2v2m3-2v2m3-2v2"/>
            <circle class="prestige-skull__eye" cx="8.5" cy="11.5" r="1.7"/><circle class="prestige-skull__eye" cx="15.5" cy="11.5" r="1.7"/>
        </g>
        <g class="prestige-skull prestige-skull--two" transform="translate(69 5)">
            <path class="prestige-skull__shell" d="M12 2.5C6.8 2.5 3 6.4 3 11.1c0 3 1.5 5.3 4 6.5v3.2h10v-3.2c2.5-1.2 4-3.5 4-6.5 0-4.7-3.8-8.6-9-8.6Z"/>
            <path class="prestige-skull__jaw" d="M7 17.6h10m-9.5 2.1v2m3-2v2m3-2v2m3-2v2"/>
            <circle class="prestige-skull__eye" cx="8.5" cy="11.5" r="1.7"/><circle class="prestige-skull__eye" cx="15.5" cy="11.5" r="1.7"/>
        </g>
        <g class="prestige-skull prestige-skull--three" transform="translate(7 69)">
            <path class="prestige-skull__shell" d="M12 2.5C6.8 2.5 3 6.4 3 11.1c0 3 1.5 5.3 4 6.5v3.2h10v-3.2c2.5-1.2 4-3.5 4-6.5 0-4.7-3.8-8.6-9-8.6Z"/>
            <path class="prestige-skull__jaw" d="M7 17.6h10m-9.5 2.1v2m3-2v2m3-2v2m3-2v2"/>
            <circle class="prestige-skull__eye" cx="8.5" cy="11.5" r="1.7"/><circle class="prestige-skull__eye" cx="15.5" cy="11.5" r="1.7"/>
        </g>
        <g class="prestige-skull prestige-skull--four" transform="translate(69 69)">
            <path class="prestige-skull__shell" d="M12 2.5C6.8 2.5 3 6.4 3 11.1c0 3 1.5 5.3 4 6.5v3.2h10v-3.2c2.5-1.2 4-3.5 4-6.5 0-4.7-3.8-8.6-9-8.6Z"/>
            <path class="prestige-skull__jaw" d="M7 17.6h10m-9.5 2.1v2m3-2v2m3-2v2m3-2v2"/>
            <circle class="prestige-skull__eye" cx="8.5" cy="11.5" r="1.7"/><circle class="prestige-skull__eye" cx="15.5" cy="11.5" r="1.7"/>
        </g>
    </svg>`;
    const coldStreakOverlayMarkup = `<svg class="cold-streak-overlay" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <g class="cold-crystal cold-crystal--one" transform="translate(15 18)"><path d="M0-8v16M-7-4l14 8M7-4-7 4M0-8l-2 3m2-3 2 3M0 8l-2-3m2 3 2-3"/></g>
        <g class="cold-crystal cold-crystal--two" transform="translate(84 23)"><path d="M0-7v14M-6-3.5l12 7M6-3.5-6 3.5M0-7l-2 3m2-3 2 3M0 7l-2-3m2 3 2-3"/></g>
        <g class="cold-crystal cold-crystal--three" transform="translate(18 82)"><path d="M0-6v12M-5-3l10 6M5-3-5 3"/></g>
        <g class="cold-crystal cold-crystal--four" transform="translate(82 79)"><path d="M0-8v16M-7-4l14 8M7-4-7 4"/></g>
        <circle class="cold-snowflake cold-snowflake--one" cx="47" cy="8" r="1.6"/>
        <circle class="cold-snowflake cold-snowflake--two" cx="91" cy="57" r="1.3"/>
        <circle class="cold-snowflake cold-snowflake--three" cx="8" cy="56" r="1.5"/>
        <circle class="cold-snowflake cold-snowflake--four" cx="52" cy="94" r="1.2"/>
    </svg>`;

    const portraitClasses = [
        'streak-tier-purple',
        'streak-tier-green',
        'streak-tier-blue',
        'streak-tier-gold',
        'streak-tier-rainbow',
        'streak-tier-lightning',
        'streak-tier-hellfire',
        'streak-tier-cosmic',
        'streak-tier-cyber',
        'streak-tier-blood-moon',
        'streak-tier-master-prestige',
        'streak-purple',
        'streak-green',
        'streak-blue',
        'streak-rainbow-diamond',
        'border-tier-1',
        'border-tier-2',
        'border-tier-3',
        'border-tier-4'
    ];

    function getCurrentWinStreak(fighter) {
        if (!fighter || typeof fighter !== 'object') return 0;

        const wins = Number(fighter.wins) || 0;
        const losses = Number(fighter.losses) || 0;
        const hasSavedStreak = fighter.win_streak !== undefined &&
            fighter.win_streak !== null &&
            fighter.win_streak !== '';
        const hasManualStreakOverride = fighter.manual_win_streak_override === true ||
            (fighter.manual_stats_override === true && losses > 0);
        if (hasSavedStreak && hasManualStreakOverride) {
            const manualStreak = Number(fighter.win_streak);
            if (Number.isFinite(manualStreak)) return Math.max(0, Math.floor(manualStreak));
        }
        if (losses === 0) return Math.max(0, Math.floor(wins));

        if (fighter.win_streak !== undefined && fighter.win_streak !== null && fighter.win_streak !== '') {
            const streak = Number(fighter.win_streak);
            if (Number.isFinite(streak)) return Math.max(0, Math.floor(streak));
        }

        const historyCandidates = [
            fighter.compiled_history_deck,
            fighter.history_deck,
            fighter.history
        ];
        const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0) ||
            historyCandidates.find(Array.isArray) ||
            [];
        if (!Array.isArray(history)) return 0;
        let streak = 0;
        for (let index = history.length - 1; index >= 0; index--) {
            if (String(history[index]?.outcome || '').toLowerCase() !== 'win') break;
            streak++;
        }
        return streak;
    }

    function getCurrentLoseStreak(fighter) {
        if (!fighter || typeof fighter !== 'object') return 0;
        const savedStreak = fighter.lose_streak;
        if (savedStreak !== undefined && savedStreak !== null && savedStreak !== '') {
            const streak = Number(savedStreak);
            if (Number.isFinite(streak)) return Math.max(0, Math.floor(streak));
        }

        const history = fighter.compiled_history_deck || fighter.history_deck || fighter.history || [];
        if (!Array.isArray(history)) return 0;
        let streak = 0;
        for (let index = history.length - 1; index >= 0; index--) {
            if (String(history[index]?.outcome || '').toLowerCase() !== 'loss') break;
            streak++;
        }
        return streak;
    }

    function getLoseStreakTier(fighterOrStreak) {
        const streak = typeof fighterOrStreak === 'number'
            ? Math.max(0, Math.floor(fighterOrStreak))
            : getCurrentLoseStreak(fighterOrStreak);
        if (streak >= 8) return 'hot-seat';
        if (streak >= 5) return 'freeze';
        if (streak >= 3) return 'slump';
        return 'standard';
    }

    function getLoseStreakPortraitClass(fighterOrStreak) {
        const tier = getLoseStreakTier(fighterOrStreak);
        return tier === 'standard' ? '' : `cold-streak-${tier}`;
    }

    function getLoseStreakBadgeHtml(fighterOrStreak) {
        const streak = typeof fighterOrStreak === 'number'
            ? Math.max(0, Math.floor(fighterOrStreak))
            : getCurrentLoseStreak(fighterOrStreak);
        const tier = getLoseStreakTier(streak);
        if (tier === 'standard') return '';
        const labels = {
            slump: { icon: '❄️', name: 'SLUMP' },
            freeze: { icon: '🥶', name: 'FREEZE' },
            'hot-seat': { icon: '🧊', name: 'HOT SEAT' }
        };
        const badge = labels[tier];
        return `<span class="cold-streak-badge cold-streak-badge--${tier}" aria-label="${streak} consecutive losses">${badge.icon} ${streak}L ${badge.name}</span>`;
    }

    function getLoseStreakOverlayHtml(fighterOrStreak) {
        return getLoseStreakTier(fighterOrStreak) === 'freeze'
            ? coldStreakOverlayMarkup
            : '';
    }

    function applyLoseStreakPortraitEffects(target, fighter) {
        if (!target?.classList) return;
        const oldClasses = ['cold-streak-slump', 'cold-streak-freeze', 'cold-streak-hot-seat'];
        target.classList.remove(...oldClasses);
        target.classList.add('portrait-frame-base');
        const streakClass = getLoseStreakPortraitClass(fighter);
        if (streakClass) target.classList.add(streakClass);

        const existingOverlay = Array.from(target.children).find(child =>
            child.classList?.contains('cold-streak-overlay')
        );
        const markup = getLoseStreakOverlayHtml(fighter);
        if (!markup) {
            existingOverlay?.remove();
        } else if (!existingOverlay) {
            target.insertAdjacentHTML('beforeend', markup);
        }
    }

    function getWinStreakTier(fighter) {
        const streak = getCurrentWinStreak(fighter);
        if (streak >= 47) return 'master-prestige';
        if (streak >= 43) return 'blood-moon';
        if (streak >= 39) return 'cyber';
        if (streak >= 35) return 'cosmic';
        if (streak >= 31) return 'hellfire';
        if (streak >= 26) return 'lightning';
        if (streak >= 22) return 'rainbow';
        if (streak >= 18) return 'gold';
        if (streak >= 13) return 'blue';
        if (streak >= 7) return 'green';
        if (streak >= 3) return 'purple';
        return 'standard';
    }

    function getWinStreakPortraitClass(fighter) {
        const tier = getWinStreakTier(fighter);
        return tier === 'standard' ? '' : `streak-tier-${tier}`;
    }

    function getWinStreakBadgeHtml(fighter) {
        const streak = getCurrentWinStreak(fighter);
        if (streak < 1) return '';
        const tier = getWinStreakTier(fighter);
        const tierIcons = {
            lightning: '⚡',
            hellfire: '🔥',
            cosmic: '🌌',
            cyber: '💠',
            'blood-moon': '🩸',
            'master-prestige': '💀'
        };
        const icon = tierIcons[tier] || '🔥';
        return `<span class="win-streak-badge win-streak-badge--${tier}" aria-label="${streak} consecutive wins">${icon} ${streak}W STREAK</span>`;
    }

    function getFighterStyleBadge(fighter) {
        if (!fighter || typeof fighter !== 'object') return '';

        const getWins = (canonicalKey, legacyKey) => {
            const canonicalWins = Number(fighter[canonicalKey]) || 0;
            return Math.max(0, canonicalWins || Number(fighter[legacyKey]) || 0);
        };
        const pin = getWins('win_pinfall', 'pin_wins');
        const ko = getWins('win_ko', 'ko_wins');
        const sub = getWins('win_submission', 'sub_wins');
        const totalWins = Number(fighter.wins) || 0;
        if (totalWins <= 0 || pin + ko + sub === 0) return '';

        const highest = Math.max(pin, ko, sub);
        const leaders = [
            pin === highest ? 'pin' : null,
            ko === highest ? 'ko' : null,
            sub === highest ? 'sub' : null
        ].filter(Boolean);
        const style = leaders.length > 1 ? 'all-rounder' : leaders[0];
        const badges = {
            ko: {
                label: 'KO ARTIST',
                icon: '<path d="M12 3.25a7.75 7.75 0 0 0-5.75 12.95v2.55h11.5V16.2A7.75 7.75 0 0 0 12 3.25Z"/><circle cx="9.25" cy="10.5" r="1.15"/><circle cx="14.75" cy="10.5" r="1.15"/><path d="M9 15h6m-5.5 0v2m2.5-2v2m2.5-2v2"/>'
            },
            sub: {
                label: 'SUB ARTIST',
                icon: '<circle cx="6.5" cy="6.5" r="2.25"/><path d="m8.3 8.3 3.2 3.2 4.5-.2m-6.1-1.4-2.4 3.6 3.2 2.4h4.1"/><rect x="15.5" y="12" width="6" height="8" rx="1.4"/><path d="M17 12v-1.2a1.5 1.5 0 0 1 3 0V12"/>'
            },
            pin: {
                label: 'PIN ARTIST',
                icon: '<path d="M4 13.5c1.5-2.3 4-3.5 7-3.5h2c3 0 5.5 1.2 7 3.5l-1 3H5l-1-3Z"/><path d="M7.5 10 6 7.5m10.5 2.5L18 7.5M7 18.5v2m5-2v2m5-2v2"/><path d="M3 4v3m-1.5-1.5h3M21 4v3m-1.5-1.5h3"/>'
            },
            'all-rounder': {
                label: 'ALL-ROUNDER',
                icon: '<path d="m5 4 15 16M19 4 4 20"/><path d="m5 4 4 1-3 3-1-4Zm14 0-4 1 3 3 1-4ZM4 20l1-4 3 3-4 1Zm16 0-1-4-3 3 4 1Z"/>'
            }
        };
        const badge = badges[style];
        return `<span class="fighting-style-badge fighting-style-badge--${style}" aria-label="${badge.label}" title="${badge.label}"><svg class="fighting-style-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${badge.icon}</svg><span>${badge.label}</span></span>`;
    }

    function getWinStreakOverlayHtml(fighter) {
        const tier = getWinStreakTier(fighter);
        if (tier === 'lightning') return lightningOverlayMarkup;
        if (tier === 'master-prestige') return masterPrestigeOverlayMarkup;
        return '';
    }

    function applyWinStreakEffects(target, fighter) {
        if (!target?.classList) return;
        const existingOverlays = Array.from(target.children).filter(child =>
            child.classList?.contains('lightning-overlay') ||
            child.classList?.contains('prestige-skull-overlay')
        );
        const tier = getWinStreakTier(fighter);
        const markup = getWinStreakOverlayHtml(fighter);
        const overlayClass = tier === 'lightning' ? 'lightning-overlay' : 'prestige-skull-overlay';
        const activeOverlay = markup
            ? existingOverlays.find(overlay => overlay.classList.contains(overlayClass))
            : null;
        existingOverlays.forEach(overlay => {
            if (overlay !== activeOverlay) overlay.remove();
        });
        target.classList.remove('streak-effects-active', 'lightning-tier-active', 'prestige-tier-active');
        if (!markup) return;

        target.classList.add('streak-effects-active');
        target.classList.add(tier === 'lightning' ? 'lightning-tier-active' : 'prestige-tier-active');
        if (!activeOverlay) target.insertAdjacentHTML('beforeend', markup);
    }

    function applyWinStreakPortraitClass(frame, fighter) {
        if (!frame?.classList) return;
        frame.classList.add('portrait-frame-base');
        frame.classList.remove(...portraitClasses);
        const streakClass = getWinStreakPortraitClass(fighter);
        if (streakClass) frame.classList.add(streakClass);
    }

    window.getCurrentWinStreak = getCurrentWinStreak;
    window.getCurrentLoseStreak = getCurrentLoseStreak;
    window.getWinStreakTier = getWinStreakTier;
    window.getWinStreakPortraitClass = getWinStreakPortraitClass;
    window.getWinStreakBadgeHtml = getWinStreakBadgeHtml;
    window.getFighterStyleBadge = getFighterStyleBadge;
    window.getWinStreakOverlayHtml = getWinStreakOverlayHtml;
    window.getWinStreakLightningOverlayHtml = getWinStreakOverlayHtml;
    window.applyWinStreakEffects = applyWinStreakEffects;
    window.applyWinStreakLightningOverlay = applyWinStreakEffects;
    window.applyWinStreakPortraitClass = applyWinStreakPortraitClass;
    window.getLoseStreakTier = getLoseStreakTier;
    window.getLoseStreakPortraitClass = getLoseStreakPortraitClass;
    window.getLoseStreakBadgeHtml = getLoseStreakBadgeHtml;
    window.getLoseStreakOverlayHtml = getLoseStreakOverlayHtml;
    window.applyLoseStreakPortraitEffects = applyLoseStreakPortraitEffects;
})();
