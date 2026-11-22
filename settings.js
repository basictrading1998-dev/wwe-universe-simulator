(function () {
    const titleWinMinimumKey = 'titleWinMinimum';
    const titleRulesKey = 'universeTitleRules';
    const defaultTitleRules = {
        initialTitleWins: 5,
        baseRebuildWins: 3,
        extraLossPenalty: 2
    };

    function normalizeTitleRules(value) {
        const rules = value && typeof value === 'object' ? value : {};
        const legacyMinimum = localStorage.getItem(titleWinMinimumKey) === '10' ? 10 : 5;
        const initialTitleWins = Number(rules.initialTitleWins);
        const baseRebuildWins = Number(rules.baseRebuildWins);
        const extraLossPenalty = Number(rules.extraLossPenalty);
        return {
            initialTitleWins: initialTitleWins === 10 ? 10 : initialTitleWins === 5 ? 5 : legacyMinimum,
            baseRebuildWins: [3, 4, 5].includes(baseRebuildWins) ? baseRebuildWins : defaultTitleRules.baseRebuildWins,
            extraLossPenalty: [1, 2, 3].includes(extraLossPenalty) ? extraLossPenalty : defaultTitleRules.extraLossPenalty
        };
    }

    function getUniverseTitleRules() {
        const raw = localStorage.getItem(titleRulesKey);
        if (raw === null) return normalizeTitleRules({});
        try {
            return normalizeTitleRules(JSON.parse(raw));
        } catch (error) {
            console.error('Unable to read saved title eligibility rules; using defaults.', error);
            return normalizeTitleRules({});
        }
    }

    window.getUniverseTitleRules = getUniverseTitleRules;
    window.getTitleWinMinimum = function () {
        return getUniverseTitleRules().initialTitleWins;
    };

    function dispatchTitleRulesChanged(rules) {
        window.dispatchEvent(new CustomEvent('universeTitleRules:changed', {
            detail: { rules: rules }
        }));
        window.dispatchEvent(new CustomEvent('titleWinMinimum:changed', {
            detail: { minimum: rules.initialTitleWins }
        }));
    }

    function updateTitleRulesControls(rules) {
        document.querySelectorAll('.universe-title-rules-control').forEach(function (control) {
            control.querySelector('#titleWinMinimumSelect').value = String(rules.initialTitleWins);
            control.querySelector('[name="baseRebuildWins"]').value = String(rules.baseRebuildWins);
            control.querySelector('[name="extraLossPenalty"]').value = String(rules.extraLossPenalty);
        });
    }

    function saveTitleRulesFromControls() {
        const control = document.querySelector('.universe-title-rules-control');
        if (!control) return;
        const rules = normalizeTitleRules({
            initialTitleWins: Number(control.querySelector('#titleWinMinimumSelect').value),
            baseRebuildWins: Number(control.querySelector('[name="baseRebuildWins"]').value),
            extraLossPenalty: Number(control.querySelector('[name="extraLossPenalty"]').value)
        });
        const serializedRules = JSON.stringify(rules);
        try {
            localStorage.setItem(titleRulesKey, serializedRules);
            localStorage.setItem(titleWinMinimumKey, String(rules.initialTitleWins));
        } catch (error) {
            console.error('Unable to save title eligibility rules.', error);
            window.alert('Title eligibility rules could not be saved. Check browser storage and try again.');
            updateTitleRulesControls(getUniverseTitleRules());
            return;
        }
        updateTitleRulesControls(rules);
        dispatchTitleRulesChanged(rules);
    }

    function createRuleSelect(name, labelText, options, selectedValue) {
        const field = document.createElement('div');
        field.className = 'title-rules-field';
        const label = document.createElement('label');
        const select = document.createElement('select');
        select.name = name;
        label.htmlFor = name === 'initialTitleWins' ? 'titleWinMinimumSelect' : name;
        label.textContent = labelText;
        select.id = name === 'initialTitleWins' ? 'titleWinMinimumSelect' : name;
        select.setAttribute('aria-label', labelText);
        options.forEach(function (option) {
            const element = document.createElement('option');
            element.value = String(option.value);
            element.textContent = option.label;
            select.appendChild(element);
        });
        select.value = String(selectedValue);
        select.addEventListener('change', saveTitleRulesFromControls);
        field.appendChild(label);
        field.appendChild(select);
        return field;
    }

    function addTitleRulesControl(menu, rules) {
        if (menu.querySelector('.universe-title-rules-control')) return;

        const control = document.createElement('div');
        control.className = 'universe-title-rules-control';
        const heading = document.createElement('strong');
        heading.className = 'title-rules-heading';
        heading.textContent = '🏆 Title Eligibility Rules';
        control.appendChild(heading);
        control.appendChild(createRuleSelect('initialTitleWins', 'First Title Shot Wins', [
            { value: 5, label: '5 Wins' },
            { value: 10, label: '10 Wins' }
        ], rules.initialTitleWins));
        control.appendChild(createRuleSelect('baseRebuildWins', 'Rebuild Wins After 1st Loss', [
            { value: 3, label: '3 Wins' },
            { value: 4, label: '4 Wins' },
            { value: 5, label: '5 Wins' }
        ], rules.baseRebuildWins));
        control.appendChild(createRuleSelect('extraLossPenalty', 'Stacking Penalty Per Extra Loss', [
            { value: 1, label: '+1 Win' },
            { value: 2, label: '+2 Wins' },
            { value: 3, label: '+3 Wins' }
        ], rules.extraLossPenalty));
        menu.insertBefore(control, menu.firstChild);
    }

    function initializeTitleRulesControls() {
        const rules = getUniverseTitleRules();
        try {
            localStorage.setItem(titleRulesKey, JSON.stringify(rules));
            localStorage.setItem(titleWinMinimumKey, String(rules.initialTitleWins));
        } catch (error) {
            console.error('Unable to initialize title eligibility rules.', error);
        }
        document.querySelectorAll('.settings-menu').forEach(function (menu) {
            addTitleRulesControl(menu, rules);
        });
    }

    function exportFullBackup() {
        if (typeof window.saveEntireUniverseState === 'function') {
            window.saveEntireUniverseState();
            return;
        }
        if (typeof window.downloadAppBackup === 'function') {
            window.downloadAppBackup();
            return;
        }

        const storageSnapshot = Object.create(null);
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (key !== null) storageSnapshot[key] = localStorage.getItem(key);
        }
        const backup = {
            format: 'wwe-universe-master-backup',
            version: 1,
            exportedAt: new Date().toISOString(),
            localStorage: storageSnapshot
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wwe_universe_master_backup.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    }

    function readArray(key, fallbackKey) {
        let raw = localStorage.getItem(key);
        if (raw === null && fallbackKey) raw = localStorage.getItem(fallbackKey);
        if (raw === null) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error(key + ' must contain an array.');
        return parsed;
    }

    window.resetUniverseEra = function () {
        if (!confirm("Reset all fighter records, championship holders, and fight cards back to a clean slate? Your fighters, custom portraits, and title belts will NOT be deleted.")) return;
        if (!confirm("FINAL CHECK: Did you export a backup first? Type or click OK to reset everything to 0W / 0L and Fight Card 1.")) return;

        try {
            const roster = readArray('wwe_fighters', 'fighters');
            const titles = readArray('wwe_titles');

            roster.forEach(function (fighter) {
                if (!fighter || typeof fighter !== 'object') return;
                [
                    'wins', 'losses', 'draws', 'win_streak', 'lose_streak', 'rebuild_wins_required', 'rebuild_loss_count', 'pin_wins', 'ko_wins', 'sub_wins',
                    'countout_wins', 'dq_wins', 'total_title_fights', 'lifetime_defenses',
                    'current_titles', 'defenses', 'title_fights', 'win_pinfall', 'win_ko',
                    'win_submission', 'win_countout', 'win_dq', 'fotn_bonuses',
                    'potn_bonuses', 'career_bonuses', 'boss_slays'
                ].forEach(function (field) {
                    fighter[field] = field === 'current_titles' ? [] : 0;
                });
                fighter.fast_tracked = false;
                fighter.title_comeback_completed = false;
                ['compiled_history_deck', 'history_deck', 'history'].forEach(function (field) {
                    if (Array.isArray(fighter[field])) fighter[field] = [];
                });
            });

            titles.forEach(function (title) {
                if (!title || typeof title !== 'object') return;
                title.championId = '';
                if (Object.prototype.hasOwnProperty.call(title, 'champion')) title.champion = null;
                title.defenses = 0;
                title.history = [];
            });

            const resetShowId = 'show-reset-' + Date.now();
            const showStorageKeys = [];
            for (let index = 0; index < localStorage.length; index++) {
                const key = localStorage.key(index);
                if (key && (key.startsWith('wwe_matches_') || key.startsWith('wwe_draft_'))) {
                    showStorageKeys.push(key);
                }
            }
            showStorageKeys.forEach(function (key) { localStorage.removeItem(key); });

            window.wweUniverseResetInProgress = true;
            window.skipDraftSaveOnUnload = true;
            localStorage.setItem('wwe_fighters', JSON.stringify(roster));
            if (localStorage.getItem('fighters') !== null) {
                localStorage.setItem('fighters', JSON.stringify(roster));
            }
            localStorage.setItem('wwe_titles', JSON.stringify(titles));
            localStorage.setItem('wwe_event_history', '[]');
            localStorage.setItem('wwe_future_shows', JSON.stringify([
                { id: resetShowId, name: 'FIGHT CARD 1', completed: false }
            ]));
            localStorage.setItem('wwe_active_show_id', resetShowId);
            localStorage.setItem('wwe_matches_' + resetShowId, '{}');
            localStorage.setItem('wwe_draft_' + resetShowId, '{}');

            sessionStorage.clear();
            window.location.reload();
        } catch (error) {
            window.wweUniverseResetInProgress = false;
            window.skipDraftSaveOnUnload = false;
            console.error('Unable to reset the WWE Universe records safely.', error);
            alert('The reset could not be completed safely. No portrait database was changed. Check the browser console and storage, then try again.');
        }
    };

    function handleSettingsClick(event) {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;

        const toggle = target.closest('.settings-toggle');
        if (toggle) {
            const menu = document.getElementById(toggle.getAttribute('aria-controls'));
            if (!menu) return;
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!isExpanded));
            menu.hidden = isExpanded;
            return;
        }

        const action = target.closest('[data-settings-action]');
        if (action) {
            if (action.dataset.settingsAction === 'export') exportFullBackup();
            if (action.dataset.settingsAction === 'reset') window.resetUniverseEra();
            return;
        }

        if (target.closest('.universe-title-rules-control')) return;

        document.querySelectorAll('.settings-toggle[aria-expanded="true"]').forEach(function (button) {
            const menu = document.getElementById(button.getAttribute('aria-controls'));
            button.setAttribute('aria-expanded', 'false');
            if (menu) menu.hidden = true;
        });
    }

    function bindResetButtons() {
        document.querySelectorAll('[data-settings-action="reset"]').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                window.resetUniverseEra();
            });
        });
    }

    if (document.body) {
        initializeTitleRulesControls();
        document.body.addEventListener('click', handleSettingsClick);
        bindResetButtons();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            initializeTitleRulesControls();
            document.body.addEventListener('click', handleSettingsClick);
            bindResetButtons();
        }, { once: true });
    }

    window.addEventListener('storage', function (event) {
        if (event.key !== titleRulesKey && event.key !== titleWinMinimumKey) return;
        const rules = getUniverseTitleRules();
        if (event.key === titleWinMinimumKey && ['5', '10'].includes(event.newValue) &&
            Number(event.newValue) !== rules.initialTitleWins) {
            rules.initialTitleWins = Number(event.newValue);
            try {
                localStorage.setItem(titleRulesKey, JSON.stringify(rules));
            } catch (error) {
                console.error('Unable to synchronize the legacy title minimum setting.', error);
            }
        }
        updateTitleRulesControls(rules);
        dispatchTitleRulesChanged(rules);
    });
})();
