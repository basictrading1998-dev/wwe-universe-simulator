let fighters = [];

function normalizeFighterRecord(fighter) {
    if (!fighter || typeof fighter !== 'object') return null;
    const normalized = { ...fighter };
    normalized.id = normalized.id || `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    normalized.name = (normalized.name || `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim() || normalized.alias || 'Unnamed Fighter').trim();
    normalized.gender = (normalized.gender || 'male').toString().toLowerCase();
    normalized.division = (normalized.division || normalized.weightClass || 'Heavyweight').toString();
    normalized.wins = Number(normalized.wins || 0);
    normalized.losses = Number(normalized.losses || 0);
    normalized.defenses = Number(normalized.defenses || 0);
    normalized.title_fights = Number(normalized.title_fights || 0);
    normalized.win_pinfall = Number(normalized.win_pinfall || 0);
    normalized.win_ko = Number(normalized.win_ko || 0);
    normalized.win_submission = Number(normalized.win_submission || 0);
    normalized.photo = normalized.photo || '';
    return normalized;
}

function migrateLegacyFighters() {
    const legacy = localStorage.getItem('fighters');
    const current = localStorage.getItem('wwe_fighters');
    if (!legacy || current) return;
    try {
        const parsedLegacy = JSON.parse(legacy);
        if (!Array.isArray(parsedLegacy)) return;
        const normalizedLegacy = parsedLegacy.map(normalizeFighterRecord).filter(Boolean);
        localStorage.setItem('wwe_fighters', JSON.stringify(normalizedLegacy));
        localStorage.removeItem('fighters');
    } catch {
        // keep current state if legacy parse fails
    }
}

function loadFighters() {
    migrateLegacyFighters();
    const stored = localStorage.getItem('wwe_fighters');
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeFighterRecord).filter(Boolean);
    } catch {
        return [];
    }
}

function saveFighters(list = fighters) {
    const normalized = (list || []).map(normalizeFighterRecord).filter(Boolean);
    localStorage.setItem('wwe_fighters', JSON.stringify(normalized));
}

window.downloadAppBackup = function() {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wwe_')) {
            backup[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wwe-universe-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

window.importAppBackup = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            try {
                const imported = JSON.parse(loadEvent.target.result);
                if (!imported || typeof imported !== 'object') throw new Error('Invalid backup format');
                let importedCount = 0;
                Object.keys(imported).forEach(key => {
                    if (key && key.startsWith('wwe_')) {
                        localStorage.setItem(key, imported[key]);
                        importedCount++;
                    }
                });
                if (importedCount === 0) {
                    return alert('No valid WWE backup data found in that file.');
                }
                alert(`Imported ${importedCount} WWE storage item${importedCount !== 1 ? 's' : ''}. Refreshing page now.`);
                location.reload();
            } catch (err) {
                console.error(err);
                alert('Backup import failed. Please select a valid JSON backup file.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

window.restoreLegacyRoster = function() {
    fighters = loadFighters();
    const legacyKeys = ['fighters'];
    let restored = 0;

    legacyKeys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;

            parsed.map(normalizeFighterRecord).filter(Boolean).forEach(legacyFighter => {
                const exists = fighters.some(current => current.id === legacyFighter.id || current.name.toLowerCase() === legacyFighter.name.toLowerCase());
                if (!exists) {
                    fighters.push(legacyFighter);
                    restored++;
                }
            });
        } catch {
            return;
        }
    });

    if (restored > 0) {
        saveFighters(fighters);
        renderRosterGrid();
        alert(`Restored ${restored} missing fighter${restored === 1 ? '' : 's'} from your legacy roster.`);
    } else {
        alert('No additional fighters were found in legacy roster data. Your current roster already has everything loaded.');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fighters = loadFighters();
    renderRosterGrid();
    buildMasterRankingsPanel();
    setupSidebarFormEngine();
    setupLiveSearchEngine();
    window.addEventListener('beforeunload', () => saveFighters(fighters));
});

function renderRosterGrid() {
    const grid = document.getElementById('rosterGrid');
    const countBadge = document.getElementById('rosterCount');
    if (!grid) return;

    fighters = loadFighters();
    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    buildMasterRankingsPanel();

    grid.innerHTML = '';
    if (countBadge) countBadge.textContent = `${fighters.length} Superstars`;

    if (fighters.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 4; background: white; border: 1px dashed #cbd5e1; padding: 40px; text-align: center; font-weight: bold; color: #64748b; border-radius: 12px;">Your locker room is empty. Use the roster form to add your very first wrestler!</div>`;
        return;
    }

    fighters.forEach(f => {
        const card = document.createElement('div');
        card.style.cssText = "background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;";
        card.id = `fighter-card-${f.id}`;
        
        let rate = (f.wins + f.losses) === 0 ? 0 : Math.round((f.wins / (f.wins + f.losses)) * 100);
        let genderColor = f.gender === 'male' ? '#0284c7' : '#db2777';

        let heldBelts = championships.filter(b => b.championId === f.id);
        let goldBadgesHtml = '';
        
        if (heldBelts.length > 0) {
            card.style.border = '2px solid #eab308';
            card.style.boxShadow = '0 4px 12px rgba(234, 179, 8, 0.15)';
            
            heldBelts.forEach(b => {
                goldBadgesHtml += `<div style="background: #fef9c3; border: 1px solid #fef08a; color: #a16207; font-size: 0.58rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 4px; text-transform: uppercase; display: inline-block;">🏆 ${b.name.replace(' Championship', '')}</div>`;
            });
        }

        let totalDefenses = championships.filter(b => b.championId === f.id).reduce((sum, b) => sum + (b.defenses || 0), 0);
        let titleFightsCount = f.title_fights || 0;

        let avatarContent = '';
        if (f.photo) {
            avatarContent = `<img src="${f.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${f.name}">`;
        } else {
            avatarContent = `<span style="font-size: 1.25rem; font-weight: bold;">${f.name.charAt(0)}</span>`;
        }

        card.innerHTML = `
            <div onclick="uploadFighterPhoto('${f.id}')" style="width: 44px; height: 44px; background: #f1f5f9; border: 2px solid ${genderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: ${genderColor}; margin-bottom: 8px; cursor: pointer; position: relative; overflow: hidden; transition: 0.2s;">${avatarContent}</div>
            <h4 class="fighter-name-target" style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">${f.name}</h4>
            <span style="font-size: 0.65rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-top: 2px;">${f.division} • ${f.gender}</span>
            
            <div style="margin-top: 2px; display: flex; flex-direction: column; gap: 2px; align-items: center;">${goldBadgesHtml}</div>

            <div style="margin-top:8px; display:flex; flex-direction:column; align-items:center; width:100%; box-sizing:border-box;">
                <div style="display:flex; gap:8px; align-items:center;">
                    <span style="background:#052e17; color:#d1fae5; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.wins}W</span>
                    <span style="background:#3b0b0b; color:#fecaca; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.losses}L</span>
                    <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-left:6px;">${rate}%</span>
                </div>
                <div style="margin-top:6px; font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; display:flex; gap:8px;">
                    <span>🛡️ Defenses: <strong style="color:#0f172a; margin-left:4px;">${totalDefenses}</strong></span>
                    <span>🏅 Belts: <strong style="color:#0f172a; margin-left:4px;">${heldBelts.length}</strong></span>
                    <span>🥊 Title Fights: <strong style="color:#0f172a; margin-left:4px;">${titleFightsCount}</strong></span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 0.58rem; color: #64748b; gap: 2px;">
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_pinfall || 0}</span>PINS</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_ko || 0}</span>KO</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_submission || 0}</span>SUB</div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 4px; width: 100%;">
                <button onclick="editSuperstar('${f.id}')" style="flex: 1; background: #f1f5f9; border: none; padding: 4px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #475569; cursor: pointer;">✏️ Edit</button>
                <button onclick="fireSuperstar('${f.id}')" style="background: #fee2e2; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #ef4444; cursor: pointer;">✕</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // If a fighter was selected from another page (lineage), scroll and highlight
    const sel = localStorage.getItem('wwe_selected_fighter');
    if (sel) {
        const el = document.getElementById(`fighter-card-${sel}`);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const prevBox = el.style.boxShadow;
                el.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.12)';
                el.style.transition = 'box-shadow 0.3s ease';
                setTimeout(() => { el.style.boxShadow = prevBox || ''; }, 3500);
            }, 200);
        }
        localStorage.removeItem('wwe_selected_fighter');
    }
}

function renderRosterGridWithoutReload() {
    const grid = document.getElementById('rosterGrid');
    const countBadge = document.getElementById('rosterCount');
    if (!grid) return;

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    buildMasterRankingsPanel();

    grid.innerHTML = '';
    if (countBadge) countBadge.textContent = `${fighters.length} Superstars`;

    if (fighters.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 4; background: white; border: 1px dashed #cbd5e1; padding: 40px; text-align: center; font-weight: bold; color: #64748b; border-radius: 12px;">Your locker room is empty. Use the roster form to add your very first wrestler!</div>`;
        return;
    }

    fighters.forEach(f => {
        const card = document.createElement('div');
        card.style.cssText = "background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;";
        card.id = `fighter-card-${f.id}`;
        
        let rate = (f.wins + f.losses) === 0 ? 0 : Math.round((f.wins / (f.wins + f.losses)) * 100);
        let genderColor = f.gender === 'male' ? '#0284c7' : '#db2777';

        let heldBelts = championships.filter(b => b.championId === f.id);
        let goldBadgesHtml = '';
        
        if (heldBelts.length > 0) {
            card.style.border = '2px solid #eab308';
            card.style.boxShadow = '0 4px 12px rgba(234, 179, 8, 0.15)';
            
            heldBelts.forEach(b => {
                goldBadgesHtml += `<div style="background: #fef9c3; border: 1px solid #fef08a; color: #a16207; font-size: 0.58rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 4px; text-transform: uppercase; display: inline-block;">🏆 ${b.name.replace(' Championship', '')}</div>`;
            });
        }

        let totalDefenses = championships.filter(b => b.championId === f.id).reduce((sum, b) => sum + (b.defenses || 0), 0);
        let titleFightsCount = f.title_fights || 0;

        let avatarContent = '';
        if (f.photo) {
            avatarContent = `<img src="${f.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${f.name}">`;
        } else {
            avatarContent = `<span style="font-size: 1.25rem; font-weight: bold;">${f.name.charAt(0)}</span>`;
        }

        card.innerHTML = `
            <div onclick="uploadFighterPhoto('${f.id}')" style="width: 44px; height: 44px; background: #f1f5f9; border: 2px solid ${genderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: ${genderColor}; margin-bottom: 8px; cursor: pointer; position: relative; overflow: hidden; transition: 0.2s;">${avatarContent}</div>
            <h4 class="fighter-name-target" style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">${f.name}</h4>
            <span style="font-size: 0.65rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-top: 2px;">${f.division} • ${f.gender}</span>
            
            <div style="margin-top: 2px; display: flex; flex-direction: column; gap: 2px; align-items: center;">${goldBadgesHtml}</div>

            <div style="margin-top:8px; display:flex; flex-direction:column; align-items:center; width:100%; box-sizing:border-box;">
                <div style="display:flex; gap:8px; align-items:center;">
                    <span style="background:#052e17; color:#d1fae5; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.wins}W</span>
                    <span style="background:#3b0b0b; color:#fecaca; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.losses}L</span>
                    <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-left:6px;">${rate}%</span>
                </div>
                <div style="margin-top:6px; font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; display:flex; gap:8px;">
                    <span>🛡️ Defenses: <strong style="color:#0f172a; margin-left:4px;">${totalDefenses}</strong></span>
                    <span>🏅 Belts: <strong style="color:#0f172a; margin-left:4px;">${heldBelts.length}</strong></span>
                    <span>🥊 Title Fights: <strong style="color:#0f172a; margin-left:4px;">${titleFightsCount}</strong></span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 0.58rem; color: #64748b; gap: 2px;">
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_pinfall || 0}</span>PINS</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_ko || 0}</span>KO</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_submission || 0}</span>SUB</div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 4px; width: 100%;">
                <button onclick="editSuperstar('${f.id}')" style="flex: 1; background: #f1f5f9; border: none; padding: 4px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #475569; cursor: pointer;">✏️ Edit</button>
                <button onclick="fireSuperstar('${f.id}')" style="background: #fee2e2; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #ef4444; cursor: pointer;">✕</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // If a fighter was selected from another page (lineage), scroll and highlight
    const sel = localStorage.getItem('wwe_selected_fighter');
    if (sel) {
        const el = document.getElementById(`fighter-card-${sel}`);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const prevBox = el.style.boxShadow;
                el.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.12)';
                el.style.transition = 'box-shadow 0.3s ease';
                setTimeout(() => { el.style.boxShadow = prevBox || ''; }, 3500);
            }, 200);
        }
        localStorage.removeItem('wwe_selected_fighter');
    }
}

function buildMasterRankingsPanel() {
    const existingPanel = document.getElementById('rosterLeaderboardFilters');
    if (existingPanel) existingPanel.remove();

    const gridElement = document.getElementById('rosterGrid');
    if (!gridElement || !gridElement.parentNode) return;

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    const fightersCopy = [...fighters];

    const mostTitleFights = fightersCopy.reduce((best, fighter) => {
        const count = fighter.title_fights || 0;
        return count > (best.count || 0) ? { fighter, count } : best;
    }, { fighter: null, count: 0 });

    const mostDefenses = fightersCopy.reduce((best, fighter) => {
        const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
        const count = championships.filter(b => b.championId === fighter.id).reduce((s, bb) => s + (bb.defenses || 0), 0);
        return count > (best.count || 0) ? { fighter, count } : best;
    }, { fighter: null, count: 0 });

    const mostBelts = fightersCopy.reduce((best, fighter) => {
        const beltCount = championships.filter(b => b.championId === fighter.id).length;
        return beltCount > (best.count || 0) ? { fighter, count: beltCount } : best;
    }, { fighter: null, count: 0 });

    const filterPanel = document.createElement('div');
    filterPanel.id = 'rosterLeaderboardFilters';
    filterPanel.style.cssText = "background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 0 0 24px 0; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: sans-serif; width: 100%; box-sizing: border-box;";

    filterPanel.innerHTML = `
        <span style="font-size: 0.75rem; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">📊 Roster Rankings:</span>
        <button onclick="sortRosterByMetric('alphabetical')" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #475569; cursor: pointer;">🔤 A-Z</button>
        <button onclick="sortRosterByMetric('wins')" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #16a34a; cursor: pointer;">👑 Most Wins</button>
        <button onclick="sortRosterByMetric('losses')" style="background: #fff5f5; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #dc2626; cursor: pointer;">📉 Most Losses</button>
        <button onclick="sortRosterByMetric('win_pinfall')" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">📌 Pinfall Leaders</button>
        <button onclick="sortRosterByMetric('win_ko')" style="background: #fff7ed; border: 1px solid #ffedd5; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #ea580c; cursor: pointer;">💥 KO Masters</button>
        <button onclick="sortRosterByMetric('win_submission')" style="background: #fbf7ff; border: 1px solid #f3e8ff; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #7c3aed; cursor: pointer;">🥋 Submission Experts</button>
        <button onclick="sortRosterByMetric('win_rate')" style="background: #ecfeff; border: 1px solid #cffafe; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">📈 Win Rate</button>
        <button onclick="sortRosterByMetric('title_fights')" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🏆 Most Title Fights</button>
        <button onclick="sortRosterByMetric('defenses')" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🛡️ Most Title Defenses</button>
        <button onclick="sortRosterByMetric('current_belts')" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🎖️ Most Current Belts</button>
    `;

    gridElement.parentNode.insertBefore(filterPanel, gridElement);
}

function setupSidebarFormEngine() {
    let addBtn = null;
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.toLowerCase().includes('add to roster')) addBtn = btn;
    });
    
    if (addBtn) {
        addBtn.removeAttribute('onclick');
        addBtn.onclick = function(e) {
            e.preventDefault();
            fighters = loadFighters();

            const nameInput = document.getElementById('fighterName') || document.querySelector('input[placeholder*="Roman"]') || document.querySelector('input[placeholder*="Superstar"]') || document.querySelector('input[type="text"]');
            const divisionInput = document.getElementById('fighterDivision') || document.querySelector('input[placeholder*="Heavyweight"]') || document.querySelector('input[placeholder*="Weight"]');
            const genderSelect = document.getElementById('fighterGender') || document.querySelector('select');

            const nameValue = nameInput ? nameInput.value.trim() : "";
            if (!nameValue) return alert("Please enter a Superstar name before signing their contract!");

            const newFighter = {
                id: 'f-' + Date.now(),
                name: nameValue,
                gender: genderSelect ? genderSelect.value.toLowerCase() : 'male',
                division: (divisionInput && divisionInput.value.trim()) ? divisionInput.value.trim() : 'Heavyweight',
                wins: 0, losses: 0, defenses: 0, title_fights: 0, win_pinfall: 0, win_ko: 0, win_submission: 0
            };

            fighters.push(normalizeFighterRecord(newFighter));
            saveFighters(fighters);
            
            if (nameInput) nameInput.value = '';
            if (divisionInput) divisionInput.value = '';
            
            alert(`Contract Signed! "${newFighter.name}" has officially been added back to your Universe roster!`);
            renderRosterGrid();
        };
    }
}

function setupLiveSearchEngine() {
    const searchBar = document.querySelector('input[placeholder*="Search"]') || document.querySelector('input[id*="Search"]') || document.querySelector('input[type="text"]:nth-of-type(2)');
    if (!searchBar) return;

    searchBar.id = 'rosterSearchInput';
    searchBar.onkeyup = filterRosterCards;
}

window.filterRosterCards = function() {
    const query = document.getElementById('rosterSearchInput')?.value.toLowerCase() || '';
    document.querySelectorAll('#rosterGrid > div').forEach(card => {
        const nameEl = card.querySelector('.fighter-name-target');
        if (nameEl) {
            const nameText = nameEl.textContent.toLowerCase();
            card.style.display = nameText.includes(query) ? 'flex' : 'none';
        }
    });
};

window.toggleBulkImporter = function() {
    const wrapper = document.getElementById('bulkImporterWrapper');
    if (!wrapper) return;
    wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
};

window.importBulkSuperstars = function() {
    fighters = loadFighters();
    const textarea = document.getElementById('bulkNamesInput');
    const genderSelect = document.getElementById('bulkGender');
    const divisionSelect = document.getElementById('bulkDivision');
    if (!textarea) return alert('Bulk importer is unavailable right now.');

    const names = textarea.value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
    if (names.length === 0) return alert('Enter at least one fighter name to import.');

    const gender = genderSelect ? genderSelect.value : 'male';
    const division = divisionSelect ? divisionSelect.value : 'Heavyweight';
    const timestamp = Date.now();
    let added = 0;

    names.forEach((name, index) => {
        const exists = fighters.some(f => f.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
            fighters.push(normalizeFighterRecord({
                id: `f-${timestamp}-${index}`,
                name,
                gender,
                division,
                wins: 0,
                losses: 0,
                defenses: 0,
                title_fights: 0,
                win_pinfall: 0,
                win_ko: 0,
                win_submission: 0
            }));
            added++;
        }
    });

    saveFighters(fighters);
    renderRosterGrid();
    textarea.value = '';
    alert(`${added} ${added === 1 ? 'superstar' : 'superstars'} imported successfully.`);
};

window.editSuperstar = function(id) {
    const card = document.getElementById(`fighter-card-${id}`);
    const f = fighters.find(fighter => fighter.id === id);
    if (!card || !f) return;

    const oldPanel = document.getElementById(`inline-editor-${id}`);
    if (oldPanel) oldPanel.remove();

    if (f.title_fights === undefined) f.title_fights = 0;

    const editPanel = document.createElement('div');
    editPanel.id = `inline-editor-${id}`;
    editPanel.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 10px; box-sizing: border-box; z-index: 100; border: 2px solid #eab308; align-content: center;";

    editPanel.innerHTML = `
        <span style="grid-column: span 2; font-size: 0.68rem; font-weight: 800; color: #eab308; text-transform: uppercase; margin-bottom: 2px;">✏️ Adjust ${f.name}</span>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Wins:</label>
            <input type="number" id="edit-wins-${id}" value="${f.wins}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Losses:</label>
            <input type="number" id="edit-losses-${id}" value="${f.losses}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Pin victories:</label>
            <input type="number" id="edit-pins-${id}" value="${f.win_pinfall || 0}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">KO victories:</label>
            <input type="number" id="edit-kos-${id}" value="${f.win_ko || 0}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Sub victories:</label>
            <input type="number" id="edit-subs-${id}" value="${f.win_submission || 0}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Title Fights:</label>
            <input type="number" id="edit-fights-${id}" value="${f.title_fights}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="grid-column: span 2; display: flex; gap: 4px; width: 100%; margin-top: 4px;">
            <button onclick="saveInlineEdit('${id}')" style="flex: 1; background: #10b981; border: none; color: white; font-weight: bold; padding: 4px; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">Save Changes</button>
            <button onclick="deleteFighterPhoto('${id}', true)" style="flex: 1; background: #f97316; border: none; color: white; font-weight: bold; padding: 4px; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">🗑️ Delete Photo</button>
            <button onclick="document.getElementById('inline-editor-${id}').remove()" style="background: #475569; border: none; color: white; font-weight: bold; padding: 4px; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">Cancel</button>
        </div>
    `;
    card.appendChild(editPanel);
};

window.saveInlineEdit = function(id) {
    const f = fighters.find(fighter => fighter.id === id);
    if (!f) return;

    const winsInput = document.getElementById(`edit-wins-${id}`);
    const lossesInput = document.getElementById(`edit-losses-${id}`);
    const pinsInput = document.getElementById(`edit-pins-${id}`);
    const kosInput = document.getElementById(`edit-kos-${id}`);
    const subsInput = document.getElementById(`edit-subs-${id}`);
    const fightsInput = document.getElementById(`edit-fights-${id}`);

    if (winsInput && lossesInput && pinsInput && kosInput && subsInput && fightsInput) {
        const newWins = parseInt(winsInput.value) || 0;
        const newLosses = parseInt(lossesInput.value) || 0;
        const newPinfalls = parseInt(pinsInput.value) || 0;
        const newKOs = parseInt(kosInput.value) || 0;
        const newSubs = parseInt(subsInput.value) || 0;
        const newTitleFights = parseInt(fightsInput.value) || 0;

        const statsChanged = (
            newWins !== f.wins ||
            newLosses !== f.losses ||
            newPinfalls !== (f.win_pinfall || 0) ||
            newKOs !== (f.win_ko || 0) ||
            newSubs !== (f.win_submission || 0) ||
            newTitleFights !== (f.title_fights || 0)
        );

        f.wins = newWins;
        f.losses = newLosses;
        f.win_pinfall = newPinfalls;
        f.win_ko = newKOs;
        f.win_submission = newSubs;
        f.title_fights = newTitleFights;

        if (statsChanged) {
            f.compiled_history_deck = [];
            f.history_deck = [];
            f.history = [];
        }

        localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
        renderRosterGrid();
    }
};

window.sortRosterByMetric = function(metricType) {
    if (!fighters || fighters.length === 0) return;

    if (metricType === 'alphabetical') {
        fighters.sort((a, b) => a.name.localeCompare(b.name));
    } else if (metricType === 'win_rate') {
        fighters.sort((a, b) => {
            let totalA = a.wins + a.losses;
            let totalB = b.wins + b.losses;
            let rateA = totalA === 0 ? 0 : a.wins / totalA;
            let rateB = totalB === 0 ? 0 : b.wins / totalB;
            return rateB - rateA || b.wins - a.wins;
        });
    } else if (metricType === 'current_belts') {
        const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
        fighters.sort((a, b) => {
            const beltsA = championships.filter(c => c.championId === a.id).length;
            const beltsB = championships.filter(c => c.championId === b.id).length;
            return beltsB - beltsA || b.wins - a.wins;
        });
    } else {
        fighters.sort((a, b) => (b[metricType] || 0) - (a[metricType] || 0));
    }
    renderRosterGridWithoutReload();
};

window.fireSuperstar = function(id) {
    if (confirm("Release this competitor from their contract? This will remove them completely from your Universe roster!")) {
        fighters = fighters.filter(f => f.id !== id);
        localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
        renderRosterGrid();
    }
};

window.uploadFighterPhoto = function(fighterId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            openPhotoCropDialog(event.target.result, fighterId, true);
        };
        reader.readAsDataURL(file);
    };
    input.click();
};

window.openPhotoCropDialog = function(imageSrc, fighterId, isRoster) {
    if (document.getElementById('photoCropDialog')) {
        document.getElementById('photoCropDialog').remove();
    }

    const dialog = document.createElement('div');
    dialog.id = 'photoCropDialog';
    dialog.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:5000; display:flex; align-items:center; justify-content:center;';

    dialog.innerHTML = `
        <div style="background:white; border-radius:12px; padding:20px; max-width:500px; width:90%; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 16px 0; color:#0f172a; font-weight:800;">Crop Fighter Photo</h3>
            <div style="position:relative; width:100%; height:300px; background:#f1f5f9; border-radius:8px; overflow:hidden; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
                <img id="cropImagePreview" src="${imageSrc}" style="max-width:150%; max-height:150%; cursor:grab; user-select:none;" draggable="false">
            </div>
            <div style="position:relative; width:100%; height:150px; border:2px solid #0284c7; border-radius:50%; overflow:hidden; margin-bottom:16px; display:flex; align-items:center; justify-content:center; background:#f8fafc;">
                <img src="${imageSrc}" id="cropCirclePreview" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div style="display:flex; gap:8px; font-size:0.75rem; color:#64748b; margin-bottom:16px; align-items:center;">
                <span>📏 Position:</span>
                <input type="range" id="cropOffsetX" min="-100" max="100" value="0" style="flex:1;">
                <input type="range" id="cropOffsetY" min="-100" max="100" value="0" style="flex:1;">
                <input type="range" id="cropZoom" min="50" max="200" value="100" style="flex:1;">
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="saveCroppedPhoto('${fighterId}', ${isRoster ? 'true' : 'false'})" style="flex:1; background:#10b981; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✓ Save Photo</button>
                <button onclick="deleteFighterPhoto('${fighterId}', ${isRoster ? 'true' : 'false'})" style="flex:1; background:#f97316; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">🗑️ Delete Photo</button>
                <button onclick="document.getElementById('photoCropDialog').remove()" style="flex:1; background:#ef4444; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✕ Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const previewImg = document.getElementById('cropImagePreview');
    const circlePreview = document.getElementById('cropCirclePreview');
    const offsetXSlider = document.getElementById('cropOffsetX');
    const offsetYSlider = document.getElementById('cropOffsetY');
    const zoomSlider = document.getElementById('cropZoom');
    let isGrabbing = false;
    let grabStartX = 0, grabStartY = 0;

    const updatePreview = () => {
        const offsetX = parseInt(offsetXSlider.value);
        const offsetY = parseInt(offsetYSlider.value);
        const zoom = parseInt(zoomSlider.value);
        circlePreview.style.objectPosition = `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
        circlePreview.style.transform = `scale(${zoom / 100})`;
    };

    previewImg.addEventListener('mousedown', (e) => {
        isGrabbing = true;
        grabStartX = e.clientX;
        grabStartY = e.clientY;
        previewImg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isGrabbing) return;
        const deltaX = e.clientX - grabStartX;
        const deltaY = e.clientY - grabStartY;
        offsetXSlider.value = Math.max(-100, Math.min(100, parseInt(offsetXSlider.value) + deltaX / 2));
        offsetYSlider.value = Math.max(-100, Math.min(100, parseInt(offsetYSlider.value) + deltaY / 2));
        grabStartX = e.clientX;
        grabStartY = e.clientY;
        updatePreview();
    });

    document.addEventListener('mouseup', () => {
        isGrabbing = false;
        previewImg.style.cursor = 'grab';
    });

    offsetXSlider.addEventListener('input', updatePreview);
    offsetYSlider.addEventListener('input', updatePreview);
    zoomSlider.addEventListener('input', updatePreview);

    updatePreview();
};

window.saveCroppedPhoto = function(fighterId, isRoster) {
    const circlePreview = document.getElementById('cropCirclePreview');
    const offsetXSlider = document.getElementById('cropOffsetX');
    const offsetYSlider = document.getElementById('cropOffsetY');
    const zoomSlider = document.getElementById('cropZoom');

    const offsetX = parseInt(offsetXSlider.value);
    const offsetY = parseInt(offsetYSlider.value);
    const zoom = parseInt(zoomSlider.value);

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.clip();

    const img = new Image();
    img.onload = function() {
        const scale = zoom / 100;
        const x = 100 - (img.width * scale) / 2 + (offsetX / 100) * 50;
        const y = 100 - (img.height * scale) / 2 + (offsetY / 100) * 50;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const croppedPhoto = canvas.toDataURL('image/jpeg');
        const fighter = fighters.find(f => f.id === fighterId);
        if (fighter) {
            fighter.photo = croppedPhoto;
            localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
            
            if (isRoster) {
                renderRosterGrid();
            }
        }
        document.getElementById('photoCropDialog').remove();
    };
    img.src = circlePreview.src;
};

window.deleteFighterPhoto = function(fighterId, isRoster) {
    const fighter = fighters.find(f => f.id === fighterId);
    if (!fighter) return;
    if (!confirm(`Delete ${fighter.name}'s photo? This cannot be undone.`)) return;
    delete fighter.photo;
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
    if (document.getElementById('photoCropDialog')) document.getElementById('photoCropDialog').remove();
    if (isRoster) {
        renderRosterGrid();
    }
};

