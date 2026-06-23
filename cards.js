let fighters = JSON.parse(localStorage.getItem('wwe_fighters')) || [];
let futureShows = JSON.parse(localStorage.getItem('wwe_future_shows')) || [
    { id: 'show-1', name: 'RAW (Current Card)' },
    { id: 'show-2', name: 'SmackDown (Upcoming)' },
    { id: 'show-3', name: 'Next Premium Live Event' }
];
let activeShowId = localStorage.getItem('wwe_active_show_id') || 'show-1';
let completedMatches = JSON.parse(localStorage.getItem("wwe_matches_" + activeShowId)) || {};
let activeMatchId = null;

document.addEventListener('DOMContentLoaded', () => {
    const tiers = ['mainEventContainer', 'coMainContainer', 'mainCardContainer', 'prelimsContainer', 'earlyPrelimsContainer'];
    tiers.forEach(id => {
        let box = document.getElementById(id);
        if (!box) return;
        let num = (id.includes('mainEvent') || id.includes('coMain')) ? 1 : 4;
        renderCardRows(box, num, id, id.includes('mainEvent'));
    });
    restoreCurrentCardDraft();
    buildShowSchedulerHeader();
    buildModalContainer();
        // LIVE WATCHER: Auto-clears title field blocks if a fighter name is ever deleted
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('fighter-search-input') && e.target.value === '') {
            const matchRow = e.target.closest('.match-row');
            if (matchRow) {
                const id = matchRow.id;
                const cb = document.getElementById(`${id}-title-check`);
                const titleInput = document.getElementById(`${id}-title-name-input`);
                
                if (cb && cb.checked) {
                    cb.checked = false;
                    matchRow.style.border = '1px solid #bae6fd';
                    matchRow.style.background = '#ffffff';
                    if (id.includes('mainEventContainer') || id.includes('coMainContainer')) {
                        matchRow.style.border = '1px solid #fca5a5';
                        matchRow.style.background = 'linear-gradient(to right, #ffffff, #fff5f5, #ffffff)';
                    }
                    if (titleInput) { titleInput.style.display = "none"; titleInput.value = ""; }
                }
            }
        }
    });

});

function buildShowSchedulerHeader() {
    const mainBox = document.getElementById('mainEventContainer');
    if (!mainBox || document.getElementById('schedulerControlRow')) return;

    const row = document.createElement('div');
    row.id = 'schedulerControlRow';
    row.style.cssText = "background:white; border:1px solid #bae6fd; border-radius:12px; padding:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; gap:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05); width:100%; box-sizing:border-box;";
    
    let opts = '';
    futureShows.forEach(s => {
        opts += `<option value="${s.id}" ${s.id === activeShowId ? 'selected' : ''}>${s.name}</option>`;
    });

    row.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="font-size:0.75rem; font-weight:800; color:#0369a1; text-transform:uppercase;">📅 Active Schedule:</span>
            <select id="activeShowSelector" onchange="switchActiveShowCard(this.value)" style="padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; font-size:0.85rem; color:#1e293b; background:white;">${opts}</select>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="newShowNameInput" placeholder="Create Future Show..." style="padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.8rem; font-weight:600; outline:none; width:160px; background:white; color:#1e293b;">
            <button onclick="createNewFutureShow()" style="background:#0369a1; border:none; color:white; font-weight:bold; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer; text-transform:uppercase;">+ Add Show</button>
        </div>`;
        
    if (mainBox && mainBox.parentNode) {
        mainBox.parentNode.insertBefore(row, mainBox);
    }

    const currentShow = futureShows.find(s => s.id === activeShowId);
    const bottomInput = document.getElementById('eventShowNameInput');
    if (bottomInput && currentShow) bottomInput.value = currentShow.name;
}

window.switchActiveShowCard = function(showId) {
    localStorage.setItem('wwe_active_show_id', showId);
    location.reload();
};

window.createNewFutureShow = function() {
    const input = document.getElementById('newShowNameInput');
    const name = input ? input.value.trim() : '';
    if (!name) return alert('Type a name to book an upcoming event card!');

    const newId = 'show-' + Date.now();
    futureShows.push({ id: newId, name: name });
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    localStorage.setItem('wwe_active_show_id', newId);
    
    alert(`Success! "${name}" added to your future show calendar.`);
    location.reload();
};
function renderCardRows(box, num, tierId, isMain) {
    for (let i = 1; i <= num; i++) {
        const uId = `${tierId}-m${i}`;
        const matchRow = document.createElement('div');
        matchRow.className = 'match-row';
        matchRow.id = uId;
        matchRow.style.cssText = "background:#fff; border:1px solid #bae6fd; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px; margin-bottom:12px; position:relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width:100%; box-sizing:border-box;";
        if (isMain) { matchRow.style.background = "linear-gradient(to right, #fff, #fff5f5, #fff)"; matchRow.style.borderColor = "#fca5a5"; }

        matchRow.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px dashed #e2e8f0; padding-bottom:6px; font-size:0.65rem; font-weight:bold; color:#64748b;">
                <span>MATCH VARIANT</span>
                <div style="display:flex; gap:4px; background:#f1f5f9; padding:2px; border-radius:6px;">
                    <button onclick="changeMatchGender('${uId}', 'male')" id="${uId}-btn-male" style="background:#0369a1; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;">MALE</button>
                    <button onclick="changeMatchGender('${uId}', 'female')" id="${uId}-btn-female" style="background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;">FEMALE</button>
                </div>
            </div>
            <div id="${uId}-booking-panel" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                
                <div class="fighter-slot" id="${uId}-slot1" data-gender="male" style="width:38%; display:flex; align-items:center; gap:8px; position:relative;">
                    <div class="avatar-box" style="width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b;">👤</div>
                    <div class="dropdown-search-container">
                        <input type="text" class="fighter-search-input" data-fighter-id="" placeholder="Type Fighter 1..." onfocus="triggerSearchFill('${uId}', 'slot1')" onkeyup="triggerSearchFill('${uId}', 'slot1')" style="width:100%; padding:6px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; font-weight:600;">
                        <div class="search-results-floating-panel" style="display:none;"></div>
                    </div>
                </div>

                <div class="vs-badge" style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:20%;">
                    <span style="font-size:0.75rem; font-weight:900; background:#64748b; color:white; padding:4px 10px; border-radius:4px; letter-spacing:0.05em; ${isMain?'background:#dc2626;':''}">VS</span>
                    <button onclick="suggestOpponent('${uId}')" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:0.65rem; font-weight:bold; margin-top:6px;">💡 Suggest</button>
                </div>

                <div class="fighter-slot" id="${uId}-slot2" data-gender="male" style="width:38%; text-align:right; display:flex; flex-direction:row-reverse; align-items:center; gap:8px; position:relative;">
                    <div class="avatar-box" style="width:36px; height:36px; background:#e2e8f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #cbd5e1; color:#64748b;">👤</div>
                    <div class="dropdown-search-container">
                        <input type="text" class="fighter-search-input" data-fighter-id="" placeholder="Type Fighter 2..." onfocus="triggerSearchFill('${uId}', 'slot2')" onkeyup="triggerSearchFill('${uId}', 'slot2')" style="width:100%; padding:6px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; font-weight:600; text-align:right;">
                        <div class="search-results-floating-panel" style="display:none;"></div>
                    </div>
                </div>

            </div>
            <div id="${uId}-result-panel" style="display:none; flex-direction:column; align-items:center; width:100%; background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; text-align:center; box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">
                <div style="font-size:0.6rem; font-weight:800; color:#64748b; tracking-letter:0.1em; text-transform:uppercase; margin-bottom:4px;">Official Ring Result</div>
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; font-size:1.1rem; font-weight:900;">
                    <div id="${uId}-showcase-winner" style="width:40%; text-align:left; font-weight:bold;"></div>
                    <div style="width:20%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span style="font-size:0.65rem; color:#64748b; font-weight:bold; font-style:italic;">DEFEATED BY</span>
                        <span id="${uId}-showcase-method" style="font-size:0.85rem; color:#38bdf8; font-weight:800; letter-spacing:0.05em; margin-top:1px;"></span>
                    </div>
                    <div id="${uId}-showcase-loser" style="width:40%; text-align:right; color:#ef4444; text-decoration:line-through; font-size:0.95rem; font-weight:700; opacity:0.6;"></div>
                </div>
            </div>
            <div class="controls-area" style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:4px; border-top:1px solid #f1f5f9; padding-top:8px;">
                <div style="width:70%; display:flex; gap:8px; align-items:center;">
                    <select id="${uId}-winner-select" style="padding:4px 8px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.7rem; font-weight:bold; color:#334155; width:140px;">
                        <option value="">Winner...</option>
                    </select>
                    <select id="${uId}-method-select" style="padding:4px 8px; border-radius:6px; background:white; border:1px solid #cbd5e1; font-size:0.7rem; font-weight:bold; color:#334155; width:110px;">
                        <option value="">How?</option>
                        <option value="win_pinfall">PINFALL</option>
                        <option value="win_ko">KO/TKO</option>
                        <option value="win_submission">SUBMISSION</option>
                    </select>
                    <button onclick="logMatchResult('${uId}')" style="background:#ef4444; border:none; color:white; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">Log Result</button>
                </div>
                                <div style="width:30%; display:flex; justify-content:flex-end; gap:12px; font-size:0.7rem; font-weight:bold; color:#475569; align-items:center;">
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" id="${uId}-title-check" onchange="toggleTitleFight('${uId}', this)"> 🏆 TITLE</label>
                    <input type="text" id="${uId}-title-name-input" placeholder="Name the title..." style="display:none; padding:4px 6px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.65rem; font-weight:bold; width:120px; outline:none; background:white; color:#1e293b;">
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" onchange="toggleRematchCounter('${uId}', this)"> 🔄 REMATCH <input type="number" min="1" value="1" id="${uId}-rematch-count" style="display:none; width:32px; font-size:0.65rem; margin-left:2px;"></label>
                </div>

            </div>`;
        box.appendChild(matchRow);
        
        if (completedMatches[uId]) { restoreLoggedResult(uId, completedMatches[uId]); }
    }
}

window.triggerSearchFill = function(uId, slotType) {
    const slot = document.getElementById(`${uId}-${slotType}`);
    const input = slot.querySelector('.fighter-search-input');
    const panel = slot.querySelector('.search-results-floating-panel');
    const gender = slot.getAttribute('data-gender');
    const filter = input.value.toLowerCase();
    
        let busyFighterIds = [];
    
    // Scan all active, unplayed input selections currently open on screen
    document.querySelectorAll('.fighter-search-input').forEach(inp => {
        if(inp !== input && inp.getAttribute('data-fighter-id')) {
            busyFighterIds.push(inp.getAttribute('data-fighter-id'));
        }
    });

    // Scan all logged, completed matches stored in memory for this active show
    Object.keys(completedMatches).forEach(matchId => {
        const state = completedMatches[matchId];
        if (state) {
            let fWin = fighters.find(f => f.name === state.winnerName);
            let fLos = fighters.find(f => f.name === state.loserName);
            if (fWin) busyFighterIds.push(fWin.id);
            if (fLos) busyFighterIds.push(fLos.id);
        }
    });


    panel.innerHTML = '';
    const matchingFighters = fighters.filter(f => f.gender === gender && f.name.toLowerCase().includes(filter));

    if(matchingFighters.length === 0) {
        panel.style.display = 'none';
        return;
    }

    matchingFighters.forEach(f => {
        const item = document.createElement('div');
        item.className = 'search-result-item-row';
        
        const isAlreadyBooked = busyFighterIds.includes(f.id);
        if(isAlreadyBooked) {
            item.className += ' is-already-booked';
            item.textContent = `❌ ${f.name} (BOOKED)`;
        } else {
            item.textContent = `👤 ${f.name} (${f.division})`;
            item.onclick = function() {
                input.value = f.name;
                input.setAttribute('data-fighter-id', f.id);
                panel.style.display = 'none';
                
                const av = slot.querySelector('.avatar-box');
                av.textContent = f.name.charAt(0);
                av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1;";
                updateWinnerDropdown(uId);
            };
        }
        panel.appendChild(item);
    });
    panel.style.display = 'block';
};

document.addEventListener('click', (e) => {
    if(!e.target.classList.contains('fighter-search-input')) {
        document.querySelectorAll('.search-results-floating-panel').forEach(p => p.style.display = 'none');
    }
});

window.populateDropdownGenders = function(matchRowId, genderVariant) {
    const slot1 = document.getElementById(`${matchRowId}-slot1`);
    const slot2 = document.getElementById(`${matchRowId}-slot2`);
    if(slot1 && slot2) {
        slot1.setAttribute('data-gender', genderVariant);
        slot2.setAttribute('data-gender', genderVariant);
        slot1.querySelector('.fighter-search-input').value = '';
        slot2.querySelector('.fighter-search-input').value = '';
        slot1.querySelector('.fighter-search-input').setAttribute('data-fighter-id', '');
        slot2.querySelector('.fighter-search-input').setAttribute('data-fighter-id', '');
    }
};



window.toggleRematchCounter = function(id, cb) {
    const el = document.getElementById(`${id}-rematch-count`); if (el) el.style.display = cb.checked ? "inline-block" : "none";
};

function buildModalContainer() {
    if (document.getElementById('suggestionModal')) return;
    let modal = document.createElement('div'); modal.id = 'suggestionModal';
    modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(9,15,28,0.75); z-index:1000; align-items:center; justify-content:center; backdrop-filter:blur(4px); font-family:sans-serif;';
    modal.innerHTML = `
      <div style="background:#111c2e; border-radius:12px; width:95%; max-width:750px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); border:1px solid #1e293b; overflow:hidden; display:flex; flex-direction:column;">
          <div style="background:#1a2638; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b;">
              <div><h3 style="margin:0; color:#ffffff; font-size:1.05rem; font-weight:bold;">👑 Suggested Opponents</h3><span id="modalF1Header" style="font-size:0.75rem; color:#94a3b8; font-weight:600; text-transform:uppercase; margin-top:2px; display:block;">Best skill-level matches</span></div>
              <button onclick="closeSuggestionModal()" style="background:none; border:none; color:#64748b; font-size:1.3rem; cursor:pointer; font-weight:bold;">✕</button>
          </div>
          <div id="suggestionModalGrid" style="padding:20px; max-height:480px; overflow-y:auto; display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:16px; background:#0f172a;"></div>
      </div>`;
    document.body.appendChild(modal);
}

window.closeSuggestionModal = function() { document.getElementById('suggestionModal').style.display = 'none'; };
window.suggestOpponent = function(id) {
    activeMatchId = id; 
    const row = document.getElementById(id); 
    const sel1 = row.querySelector('.fighter-search-input');
    
    if (!sel1 || !sel1.getAttribute('data-fighter-id')) {
        return alert('Select Fighter 1 first!');
    }
    
    const f1 = fighters.find(f => f.id === sel1.getAttribute('data-fighter-id'));
    document.getElementById('modalF1Header').textContent = `Matches for ${f1.name} (${f1.wins}W-${f1.losses}L)`;
    
    let historyLog = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    let totalPastEvents = historyLog.length;
    let candidates = []; 
    let t1 = f1.wins + f1.losses; 
    let r1 = t1 === 0 ? 0 : f1.wins / t1;

    fighters.forEach(c => {
        if (c.id === f1.id || c.gender !== f1.gender || c.division.toLowerCase() !== f1.division.toLowerCase()) return;
        
        let t2 = c.wins + c.losses; 
        let r2 = t2 === 0 ? 0 : c.wins / t2; 
        let diff = Math.abs(r1 - r2);

        let lastEventIndex = -1;
        for (let i = 0; i < historyLog.length; i++) {
            let matchFound = historyLog[i].matches.some(m => m.winner === c.name || m.loser === c.name);
            if (matchFound) { lastEventIndex = i; break; }
        }
        
        let showsBenched = (lastEventIndex === -1) ? totalPastEvents : lastEventIndex;
        candidates.push({ fighter: c, diff: diff, ratio: r2, benchedCount: showsBenched });
    });

    candidates.sort((a, b) => b.benchedCount - a.benchedCount || a.diff - b.diff);
    let grid = document.getElementById('suggestionModalGrid'); 
    grid.innerHTML = '';
    
    if (candidates.length === 0) { 
        grid.innerHTML = `<p style="color:#94a3b8; text-align:center; grid-column:span 3; padding:12px 0;">No matching contenders found.</p>`; 
    } else {
        candidates.forEach((item, idx) => {
            let c = item.fighter; 
            let card = document.createElement('div');
            card.style.cssText = 'background:#1e293b; border:1px solid #334155; border-radius:10px; padding:16px; display:flex; flex-direction:column; align-items:center; position:relative;';
            
            let rustBadgeHtml = '';
            if (item.benchedCount >= 5) {
                rustBadgeHtml = `<span style="position:absolute; top:8px; right:8px; font-size:0.58rem; font-weight:800; background:#ef4444; color:white; padding:2px 6px; border-radius:4px;">⚠️ INACTIVE (${item.benchedCount} SHOWS)</span>`;
            } else if (item.benchedCount > 0) {
                rustBadgeHtml = `<span style="position:absolute; top:8px; right:8px; font-size:0.58rem; font-weight:bold; background:#475569; color:#cbd5e1; padding:2px 6px; border-radius:4px;">💤 Idle ${item.benchedCount} shows</span>`;
            }

            let tagColor = idx === 0 ? '#eab308' : '#334155'; 
            let tagText = idx === 0 ? '#0f172a' : '#94a3b8';
            let tot = c.wins + c.losses; 
            let rate = tot === 0 ? 0 : Math.round(item.ratio * 100);
            
            card.innerHTML = `
              <span style="position:absolute; top:8px; left:8px; font-size:0.6rem; font-weight:800; background:${tagColor}; color:${tagText}; padding:2px 6px; border-radius:4px;">#${idx + 1} RANK</span>
              ${rustBadgeHtml}
              <div style="width:48px; height:48px; background:#334155; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-top:20px; margin-bottom:10px; border:2px solid #475569; color:#94a3b8;">👤</div>
              <h4 style="margin:0; font-size:0.95rem; color:#fff; font-weight:bold;">${c.name}</h4>
              <span style="font-size:0.65rem; color:#38bdf8; font-weight:bold; text-transform:uppercase;">${c.division}</span>
              <div style="margin:12px 0 6px 0;"><span style="font-size:1.3rem; font-weight:900; color:#10b981; display:block;">${c.wins} - ${c.losses}</span></div>
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; width:100%; border-top:1px solid #334155; padding-top:8px; font-size:0.6rem; color:#64748b; gap:4px; text-align:center;">
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${c.win_pinfall||0}</span>PINS</div>
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${c.win_ko||0}</span>KO</div>
                  <div><span style="color:#fff; display:block; font-weight:800; font-size:0.75rem;">${c.win_submission||0}</span>SUB</div>
              </div>
              <button onclick="bookSuggested('${c.id}')" style="width:100%; background:#10b981; border:none; color:white; font-weight:bold; padding:8px; border-radius:6px; margin-top:14px; font-size:0.75rem; cursor:pointer;">Book Fight</button>`;
            grid.appendChild(card);
        });
    }
    document.getElementById('suggestionModal').style.display = 'flex';
};

window.bookSuggested = function(fId) {
    if (!activeMatchId) return;
    const slot2 = document.getElementById(`${activeMatchId}-slot2`);
    const input2 = slot2.querySelector('.fighter-search-input');
    const f2 = fighters.find(f => f.id === fId);
    if (input2 && f2) {
        input2.value = f2.name;
        input2.setAttribute('data-fighter-id', f2.id);
        const av = slot2.querySelector('.avatar-box');
        av.textContent = f2.name.charAt(0);
        av.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1;";
        updateWinnerDropdown(activeMatchId);
    }
    window.closeSuggestionModal();
};
window.logMatchResult = function(id) {
    const row = document.getElementById(id); 
    const slot1 = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
    const winSelect = document.getElementById(`${id}-winner-select`); 
    const methodSelect = document.getElementById(`${id}-method-select`);
    
    if (!slot1 || !slot2 || !slot1.value || !slot2.value) return alert('Select both fighters before logging finishes!');
    if (!winSelect || !winSelect.value) return alert('Please choose who won the fight!');
    if (!methodSelect || !methodSelect.value) return alert('Please choose the method of victory!');
    
    let f1 = fighters.find(f => f.id === slot1.getAttribute('data-fighter-id')); 
    let f2 = fighters.find(f => f.id === slot2.getAttribute('data-fighter-id'));
    let w = (winSelect.value === '1') ? f1 : f2; 
    let l = (winSelect.value === '1') ? f2 : f1;
    
    w.wins++; 
    w[methodSelect.value]++; 
    l.losses++;
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
    
    let matchSaveState = { winnerName: w.name, loserName: l.name, winnerGender: w.gender, methodName: methodSelect.options[methodSelect.selectedIndex].text };
    completedMatches[id] = matchSaveState; 
    localStorage.setItem("wwe_matches_" + activeShowId, JSON.stringify(completedMatches));
    restoreLoggedResult(id, matchSaveState);
};

function restoreLoggedResult(id, state) {
    const row = document.getElementById(id);
    const bookingPanel = document.getElementById(`${id}-booking-panel`); if (bookingPanel) bookingPanel.style.display = 'none';
    const controlsArea = row.querySelector('.controls-area'); if (controlsArea) controlsArea.style.display = 'none';
    const winnerShowcase = document.getElementById(`${id}-showcase-winner`);
    const loserShowcase = document.getElementById(`${id}-showcase-loser`);
    const methodShowcase = document.getElementById(`${id}-showcase-method`);
    if (winnerShowcase && loserShowcase && methodShowcase) {
        winnerShowcase.textContent = state.winnerName; winnerShowcase.style.color = state.winnerGender === 'male' ? '#22c55e' : '#f472b6';
        loserShowcase.textContent = state.loserName; methodShowcase.textContent = state.methodName;
        const resultPanel = document.getElementById(`${id}-result-panel`); if (resultPanel) resultPanel.style.display = 'flex';
    }
}

window.finalizeFullEventCard = function() {
    const showNameInput = document.getElementById('eventNameInput');
    const shownShowName = showNameInput ? showNameInput.value.trim() : "";
    if (!shownShowName) {
        alert("Archive Blocked!\nYou must enter an Event/Show Title Name at the bottom before finalizing.");
        return;
    }

    // FIXED DATABASE HOOK: Safely reads your active match draft data records out of live storage
    const activeShowSavedData = JSON.parse(localStorage.getItem("wwe_matches_" + activeShowId)) || {};

    let completedCount = 0;
    let eventMatchesCompiled = [];
    const allMatchContainers = document.querySelectorAll('.match-row');
    const totalMatches = allMatchContainers.length;

    allMatchContainers.forEach(row => {
        const id = row.id;
        const savedState = activeShowSavedData[id];
        if (savedState) {
            completedCount++;
            
            const titleCheck = document.getElementById(`${id}-title-check`);
            const isTitleFight = titleCheck ? titleCheck.checked : false;
            
            const titleNameInp = document.getElementById(`${id}-title-name-input`);
            const finalTitleName = (isTitleFight && titleNameInp && titleNameInp.value.trim()) ? titleNameInp.value.trim() : "Championship";

            eventMatchesCompiled.push({
                tierName: row.parentNode.querySelector('.tier-title') ? row.parentNode.querySelector('.tier-title').textContent : "Match",
                winner: savedState.winnerName,
                loser: savedState.loserName,
                method: savedState.methodName,
                isTitle: isTitleFight,
                customTitleName: finalTitleName
            });
        }
    });

    if (completedCount < totalMatches) {
        alert(`Archive Blocked!\nYou must log all ${totalMatches} matches before completing the event.\n\nCurrent Progress: ${completedCount}/${totalMatches}`);
        return;
    }

    // --- ISSUE 1 FIXED: CUSTOM CHAMPIONSHIP TIMELINE LEDGER AUTO-ENGRAVER ---
    let championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    eventMatchesCompiled.forEach(m => {
        if (m.isTitle) {
            let champWinnerObj = fighters.find(f => f.name === m.winner);
            let loserObj = fighters.find(f => f.name === m.loser);
            
            if (champWinnerObj) {
                if (champWinnerObj.defenses === undefined) champWinnerObj.defenses = 0;
                if (champWinnerObj.title_fights === undefined) champWinnerObj.title_fights = 0;
                champWinnerObj.title_fights++;
            }
            if (loserObj) {
                if (loserObj.title_fights === undefined) loserObj.title_fights = 0;
                loserObj.title_fights++;
            }

            let targetBelt = championshipsRegistry.find(b => b.name.toLowerCase() === m.customTitleName.toLowerCase());
            
            if (!targetBelt) {
                targetBelt = {
                    id: 'title-' + Date.now() + Math.random().toString(36).substr(2, 5),
                    name: m.customTitleName,
                    gender: champWinnerObj ? champWinnerObj.gender : 'male',
                    championId: '',
                    history: []
                };
                championshipsRegistry.push(targetBelt);
            }

            if (targetBelt.championId !== champWinnerObj.id) {
                targetBelt.history.push({
                    wrestlerName: champWinnerObj.name,
                    showTitle: shownShowName,
                    winMethod: m.method.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION')
                });
                champWinnerObj.defenses = 0;
            } else {
                champWinnerObj.defenses++;
            }

            targetBelt.championId = champWinnerObj.id;
        }
    });

    localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));

    // --- ISSUE 2 FIXED: SAVE SHOW TIMELINE STRAIGHT TO MASTER EVENT HISTORY ---
    let eventHistoryCalendar = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    eventHistoryCalendar.push({
        id: "event-" + Date.now(),
        showTitle: shownShowName,
        showId: activeShowId,
        matches: eventMatchesCompiled
    });
    localStorage.setItem("wwe_event_history", JSON.stringify(eventHistoryCalendar));

    // --- ISSUE 3 FIXED: AUTOMATICALLY GENERATE COLORED HISTORY SLIDER DECKS FOR ROSTERS ---
    eventMatchesCompiled.forEach(m => {
        let f1 = fighters.find(f => f.name === m.winner);
        let f2 = fighters.find(f => f.name === m.loser);
        if (f1 && f2) {
            if (!f1.compiled_history_deck) f1.compiled_history_deck = [];
            if (!f2.compiled_history_deck) f2.compiled_history_deck = [];
            
            let cleanMethod = m.method.replace('win_pinfall','PINFALL').replace('win_ko','KO/TKO').replace('win_submission','SUBMISSION');
            
            f1.compiled_history_deck.push({ outcome: 'win', opponent: f2.name, method: cleanMethod, showName: shownShowName });
            f2.compiled_history_deck.push({ outcome: 'loss', opponent: f1.name, method: cleanMethod, showName: shownShowName });
        }
    });
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));

    // Wipe out draft fields cleanly to prepare a clean canvas for your next event show card
    localStorage.removeItem("wwe_matches_" + activeShowId);
    localStorage.removeItem("wwe_draft_" + activeShowId);

    alert(`Show Card Successfully Archived!\n\n"${shownShowName}" data loops synchronized, belts pushed, and rivalries logged seamlessly across all systems!`);
    location.reload();
};


    // Commit your updated arrays right back to live local memory spaces
    localStorage.setItem('wwe_titles', JSON.stringify(championshipsRegistry));
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));

    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));

    let eventHistoryCalendar = JSON.parse(localStorage.getItem("wwe_event_history")) || [];
    eventHistoryCalendar.push({ 
        id: 'evt-' + Date.now(), 
        name: showName, 
        date: new Date().toLocaleDateString(), 
        matches: eventMatchesCompiled 
    });
    localStorage.setItem("wwe_event_history", JSON.stringify(eventHistoryCalendar));
    localStorage.removeItem("wwe_matches_" + activeShowId);
    localStorage.removeItem("wwe_draft_" + activeShowId);
    // --- DYNAMIC CHAMPIONSHIP TIMELINE LEDGER AUTO-ENGRAVER ---
    let championshipsRegistry = JSON.parse(localStorage.getItem('wwe_titles')) || [];

   
    futureShows = futureShows.filter(s => s.id !== activeShowId);
    if (futureShows.length === 0) { 
        futureShows = [{ id: 'show-' + Date.now(), name: 'Next Card' }]; 
    }
    localStorage.setItem('wwe_future_shows', JSON.stringify(futureShows));
    localStorage.setItem('wwe_active_show_id', futureShows.id);

    alert(`Success! "${showName}" has been locked down and saved to your Event History logs.\n\nLoading your next scheduled card!`);
    location.reload();
    




window.updateWinnerDropdown = function(matchRowId) {
    const slot1 = document.getElementById(`${matchRowId}-slot1`).querySelector('.fighter-search-input');
    const slot2 = document.getElementById(`${matchRowId}-slot2`).querySelector('.fighter-search-input');
    const winSelect = document.getElementById(`${matchRowId}-winner-select`);
    if (!winSelect) return;
    
    let winOpts = '<option value="">Winner...</option>';
    if (slot1 && slot1.value) winOpts += `<option value="1">${slot1.value}</option>`;
    if (slot2 && slot2.value) winOpts += `<option value="2">${slot2.value}</option>`;
    winSelect.innerHTML = winOpts;
    
    saveCurrentCardDraft();
};

function saveCurrentCardDraft() {
    let draftData = {};
    document.querySelectorAll('.match-row').forEach(row => {
        const id = row.id;
        const s1 = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
        const s2 = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
        
        draftData[id] = {
            f1Name: s1 ? s1.value : '',
            f1Id: s1 ? s1.getAttribute('data-fighter-id') : '',
            f2Name: s2 ? s2.value : '',
            f2Id: s2 ? s2.getAttribute('data-fighter-id') : ''
        };
    });
    localStorage.setItem("wwe_draft_" + activeShowId, JSON.stringify(draftData));
}

function restoreCurrentCardDraft() {
    let draftData = JSON.parse(localStorage.getItem("wwe_draft_" + activeShowId)) || {};
    Object.keys(draftData).forEach(id => {
        const row = document.getElementById(id);
        if (!row || completedMatches[id]) return;
        
        const d = draftData[id];
        const s1 = document.getElementById(`${id}-slot1`);
        const s2 = document.getElementById(`${id}-slot2`);
        
        if (s1 && d.f1Name) {
            const inp1 = s1.querySelector('.fighter-search-input');
            inp1.value = d.f1Name; inp1.setAttribute('data-fighter-id', d.f1Id);
            const av1 = s1.querySelector('.avatar-box'); av1.textContent = d.f1Name.charAt(0);
            av1.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1;";
        }
        if (s2 && d.f2Name) {
            const inp2 = s2.querySelector('.fighter-search-input');
            inp2.value = d.f2Name; inp2.setAttribute('data-fighter-id', d.f2Id);
            const av2 = s2.querySelector('.avatar-box'); av2.textContent = d.f2Name.charAt(0);
            av2.style.cssText = "width:36px; height:36px; background:#bae6fd; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #0284c7; color:#0369a1;";
        }
        if (d.f1Name || d.f2Name) {
            const winSelect = document.getElementById(`${id}-winner-select`);
            if (winSelect) {
                let winOpts = '<option value="">Winner...</option>';
                if (d.f1Name) winOpts += `<option value="1">${d.f1Name}</option>`;
                if (d.f2Name) winOpts += `<option value="2">${d.f2Name}</option>`;
                winSelect.innerHTML = winOpts;
            }
        }
    });
}

window.changeMatchGender = function(matchRowId, gender) {
    const btnMale = document.getElementById(`${matchRowId}-btn-male`);
    const btnFemale = document.getElementById(`${matchRowId}-btn-female`);
    if(gender === 'male') {
        btnMale.style.cssText = "background:#0369a1; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;";
        btnFemale.style.cssText = "background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;";
    } else {
        btnFemale.style.cssText = "background:#db2777; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;";
        btnMale.style.cssText = "background:transparent; color:#64748b; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.6rem;";
    }
    populateDropdownGenders(matchRowId, gender);
};
window.resetActiveShowDraft = function() {
    if (confirm("Are you sure you want to clear this entire card layout?\n\nThis will empty out all selected fighters and wipe logged match results for this specific show, but your Master Roster stats and Championship Lineage will stay completely safe!")) {
        // Only deletes the draft and logged results for the active show card
        localStorage.removeItem("wwe_matches_" + activeShowId);
        localStorage.removeItem("wwe_draft_" + activeShowId);
        
        alert("Active card layout has been completely reset back to its clean draft state!");
        location.reload();
    }
};

window.toggleTitleFight = function(id, cb) {
    const row = document.getElementById(id);
    if (!row) return;

    const s1Input = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
    const s2Input = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
    const titleInput = document.getElementById(`${id}-title-name-input`);

    if (cb.checked) {
        // EXTRA SHIELD 1: Instantly unchecks and blocks if either slot field is empty
        if (!s1Input || !s2Input || !s1Input.getAttribute('data-fighter-id') || !s2Input.getAttribute('data-fighter-id')) {
            alert("Archive Blocked!\nYou must select both competitors first before activating a title match.");
            cb.checked = false;
            return;
        }

        const f1 = fighters.find(f => f.id === s1Input.getAttribute('data-fighter-id'));
        const f2 = fighters.find(f => f.id === s2Input.getAttribute('data-fighter-id'));

        // EXTRA SHIELD 2: Strict win verification rule lock
        if (!f1 || !f2 || (f1.wins || 0) < 5 || (f2.wins || 0) < 5) {
            const w1 = f1 ? f1.wins : 0;
            const w2 = f2 ? f2.wins : 0;
            const n1 = f1 ? f1.name : "Fighter 1";
            const n2 = f2 ? f2.name : "Fighter 2";
            
            alert(`Blocked! Both need 5 wins or more to qualify for a Championship fight.\n\n${n1}: ${w1} wins\n${n2}: ${w2} wins`);
            cb.checked = false;
            return;
        }

        // SUCCESS STATE: Fired when both competitors strictly meet or clear the 5-win check
        row.style.border = '3px solid #eab308';
        row.style.background = 'linear-gradient(to right, #ffffff, #fef9c3, #ffffff)';
        if (titleInput) {
            titleInput.style.display = "inline-block"; // REVEALS CUSTOM TITLE TEXT INPUT FIELD
            titleInput.focus();
        }
    } else {
        // WIPE STATE: Returns card row styling variables back to original clean layout settings
        row.style.border = '1px solid #bae6fd';
        row.style.background = '#ffffff';
        if (id.includes('mainEventContainer') || id.includes('coMainContainer')) {
            row.style.border = '1px solid #fca5a5';
            row.style.background = 'linear-gradient(to right, #ffffff, #fff5f5, #ffffff)';
        }
        if (titleInput) {
            titleInput.style.display = "none"; 
            titleInput.value = ""; // Clears name string data out
        }
    }
};
window.toggleTitleFight = function(id, cb) {
    const row = document.getElementById(id);
    if (!row) return;

    const s1Input = document.getElementById(`${id}-slot1`).querySelector('.fighter-search-input');
    const s2Input = document.getElementById(`${id}-slot2`).querySelector('.fighter-search-input');
    const titleInput = document.getElementById(`${id}-title-name-input`);

    // If a user manually clears text, clear out the hidden data attribute completely
    if (s1Input && s1Input.value === '') s1Input.removeAttribute('data-fighter-id');
    if (s2Input && s2Input.value === '') s2Input.removeAttribute('data-fighter-id');

    if (cb.checked) {
        // ULTIMATE SHIELD: Rejects if text values or hidden database IDs are missing or blank
        if (!s1Input || !s2Input || !s1Input.value || !s2Input.value || !s1Input.getAttribute('data-fighter-id') || !s2Input.getAttribute('data-fighter-id')) {
            alert("Archive Blocked!\nYou must select both competitors first before activating a title match.");
            cb.checked = false;
            return;
        }

        const f1 = fighters.find(f => f.id === s1Input.getAttribute('data-fighter-id'));
        const f2 = fighters.find(f => f.id === s2Input.getAttribute('data-fighter-id'));

        if (!f1 || !f2 || (f1.wins || 0) < 5 || (f2.wins || 0) < 5) {
            const w1 = f1 ? f1.wins : 0;
            const w2 = f2 ? f2.wins : 0;
            const n1 = f1 ? f1.name : "Fighter 1";
            const n2 = f2 ? f2.name : "Fighter 2";
            
            alert(`Blocked! Both need 5 wins or more to qualify for a Championship fight.\n\n${n1}: ${w1} wins\n${n2}: ${w2} wins`);
            cb.checked = false;
            return;
        }

        row.style.border = '3px solid #eab308';
        row.style.background = 'linear-gradient(to right, #ffffff, #fef9c3, #ffffff)';
        if (titleInput) {
            titleInput.style.display = "inline-block";
            titleInput.focus();
        }
       } else {
        row.style.border = '1px solid #bae6fd';
        row.style.background = '#ffffff';
        if (id.includes('mainEventContainer') || id.includes('coMainContainer')) {
            row.style.border = '1px solid #fca5a5';
            row.style.background = 'linear-gradient(to right, #ffffff, #fff5f5, #ffffff)';
        }
        if (titleInput) {
            titleInput.style.display = "none";
            titleInput.value = "";
        }
    }
};

window.resetActiveShowDraft = function() {
    if (confirm("Are you sure you want to clear this entire card layout?\n\nThis will empty out all selected fighters and wipe logged match results for this specific show, but your Master Roster stats and Championship Lineage will stay completely safe!")) {
        localStorage.removeItem("wwe_matches_" + activeShowId);
        localStorage.removeItem("wwe_draft_" + activeShowId);
        
        alert("Active card layout has been completely reset back to its clean draft state!");
        location.reload();
    }
};


         

