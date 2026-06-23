let fighters = JSON.parse(localStorage.getItem('wwe_fighters')) || [];

document.addEventListener('DOMContentLoaded', () => {
    fighters = JSON.parse(localStorage.getItem('wwe_fighters')) || [];
    renderRosterGrid();
    buildMasterRankingsPanel();
    setupSidebarFormEngine();
    setupLiveSearchEngine();
});

function renderRosterGrid() {
    const grid = document.getElementById('rosterGrid');
    const countBadge = document.getElementById('rosterCount');
    if (!grid) return;

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];

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

        let totalDefenses = f.defenses || 0;
        let titleFightsCount = f.title_fights || 0;

        card.innerHTML = `
            <div style="width: 44px; height: 44px; background: #f1f5f9; border: 2px solid ${genderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: ${genderColor}; margin-bottom: 8px;">${f.name.charAt(0)}</div>
            <h4 class="fighter-name-target" style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">${f.name}</h4>
            <span style="font-size: 0.65rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-top: 2px;">${f.division} • ${f.gender}</span>
            
            <div style="margin-top: 2px; display: flex; flex-direction: column; gap: 2px; align-items: center;">${goldBadgesHtml}</div>

            <div style="margin: 12px 0 6px 0; background: #f8fafc; width: 100%; border-radius: 8px; padding: 8px 4px; box-sizing: border-box;">
                <span style="font-size: 1.4rem; font-weight: 900; color: #10b981; display: block;">${f.wins} - ${f.losses}</span>
                <span style="font-size: 0.65rem; font-weight: bold; color: #94a3b8; display: block;">${rate}% Win Rate • 🛡️ ${totalDefenses} Defenses</span>
                <span style="font-size: 0.62rem; font-weight: 800; color: #0284c7; display: block; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.02em;">🏅 BELTS: ${heldBelts.length} • 🥊 TITLE FIGHTS: ${titleFightsCount}</span>
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
}

function buildMasterRankingsPanel() {
    if (document.getElementById('rosterLeaderboardFilters')) return;

    const gridElement = document.getElementById('rosterGrid');
    if (!gridElement || !gridElement.parentNode) return;

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
        <button onclick="sortRosterByMetric('win_rate')" style="background: #ecfeff; border: 1px solid #cffafe; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold;
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
            
            const nameInput = document.querySelector('input[placeholder*="Roman"]') || document.querySelector('input[placeholder*="Superstar"]') || document.querySelector('input[type="text"]');
            const divisionInput = document.querySelector('input[placeholder*="Heavyweight"]') || document.querySelector('input[placeholder*="Weight"]');
            const genderSelect = document.querySelector('select');

            const nameValue = nameInput ? nameInput.value.trim() : "";
            if (!nameValue) return alert("Please enter a Superstar name before signing their contract!");

            const newFighter = {
                id: 'f-' + Date.now(),
                name: nameValue,
                gender: genderSelect ? genderSelect.value.toLowerCase() : 'male',
                division: (divisionInput && divisionInput.value.trim()) ? divisionInput.value.trim() : 'Heavyweight',
                wins: 0, losses: 0, defenses: 0, title_fights: 0, win_pinfall: 0, win_ko: 0, win_submission: 0
            };

            fighters.push(newFighter);
            localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
            
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
    searchBar.onkeyup = function() {
        const query = searchBar.value.toLowerCase();
        document.querySelectorAll('#rosterGrid > div').forEach(card => {
            const nameEl = card.querySelector('.fighter-name-target');
            if (nameEl) {
                const nameText = nameEl.textContent.toLowerCase();
                card.style.display = nameText.includes(query) ? 'flex' : 'none';
            }
        });
    };
}

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
        f.wins = parseInt(winsInput.value) || 0;
        f.losses = parseInt(lossesInput.value) || 0;
        f.win_pinfall = parseInt(pinsInput.value) || 0;
        f.win_ko = parseInt(kosInput.value) || 0;
        f.win_submission = parseInt(subsInput.value) || 0;
        f.title_fights = parseInt(fightsInput.value) || 0;

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
    } else {
        fighters.sort((a, b) => (b[metricType] || 0) - (a[metricType] || 0));
    }
    renderRosterGrid();
};

window.fireSuperstar = function(id) {
    if (confirm("Release this competitor from their contract? This will remove them completely from your Universe roster!")) {
        fighters = fighters.filter(f => f.id !== id);
        localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
        renderRosterGrid();
    }
};
