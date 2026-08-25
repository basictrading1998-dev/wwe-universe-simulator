window.suggestOpponent = function(matchRowId) {
    const row = document.getElementById(matchRowId);
    const selects = row.querySelectorAll('.fighter-select');
    const f1Select = selects[0];
    const f2Select = selects[1];
    if (!f1Select.value) {
        alert("Please select Fighter 1 first so the engine knows who to match up!");
        return;
    }
    const fighter1 = fighters.find(f => f.id === f1Select.value);
    if (!fighter1) return;
    const f1TotalGames = fighter1.wins + fighter1.losses;
    const f1Ratio = f1TotalGames === 0 ? 0 : (fighter1.wins / f1TotalGames);
    let bestMatch = null;
    let smallestDifference = Infinity;
    fighters.forEach(candidate => {
        if (candidate.id === fighter1.id) return;
        if (candidate.division.toLowerCase() !== fighter1.division.toLowerCase()) return;
        const candTotal = candidate.wins + candidate.losses;
        const candRatio = candTotal === 0 ? 0 : (candidate.wins / candTotal);
        const difference = Math.abs(f1Ratio - candRatio);
        if (difference < smallestDifference) {
            smallestDifference = difference;
            bestMatch = candidate;
        }
    });
    if (bestMatch) {
        f2Select.value = bestMatch.id;
        updateFighterAvatar(f2Select);
        alert(`Engine Pick: Based on records, ${bestMatch.name} (${bestMatch.wins}W-${bestMatch.losses}L) matches perfectly!`);
    } else {
        alert("No other fighters found in the same division yet. Add more characters to the Master Roster!");
    }
};

window.logMatchResult = function(matchRowId) {
    const row = document.getElementById(matchRowId);
    const selects = row.querySelectorAll('.fighter-select');
    const f1Select = selects[0];
    const f2Select = selects[1];
    const id1 = f1Select.value;
    const id2 = f2Select.value;
    if (!id1 || !id2) {
        alert("Select both fighters before logging the match finish!");
        return;
    }
    if (id1 === id2) {
        alert("A fighter cannot wrestle themselves! Select two different roster members.");
        return;
    }
    const f1 = fighters.find(f => f.id === id1);
    const f2 = fighters.find(f => f.id === id2);
    const winnerChoice = prompt(`Who won the match?\nType 1 for: ${f1.name}\nType 2 for: ${f2.name}`);
    if (winnerChoice !== '1' && winnerChoice !== '2') {
        alert("Invalid selection. Match not logged.");
        return;
    }
    const methodChoice = prompt(`What was the method of victory?\nType 1 for: PINFALL\nType 2 for: KO/TKO\nType 3 for: SUBMISSION`);
    let methodKey = "";
    let methodName = "";
    if (methodChoice === '1') { methodKey = "win_pinfall"; methodName = "PINFALL"; }
    else if (methodChoice === '2') { methodKey = "win_ko"; methodName = "KO/TKO"; }
    else if (methodChoice === '3') { methodKey = "win_submission"; methodName = "SUBMISSION"; }
    else {
        alert("Invalid method. Match not logged.");
        return;
    }
    let winnerFighter = (winnerChoice === '1') ? f1 : f2;
    let loserFighter = (winnerChoice === '1') ? f2 : f1;
    winnerFighter.wins += 1;
    winnerFighter[methodKey] += 1;
    loserFighter.losses += 1;
    saveData();
    const slot1 = document.getElementById(`${matchRowId}-slot1`);
    const slot2 = document.getElementById(`${matchRowId}-slot2`);
    f1Select.style.display = "none";
    f2Select.style.display = "none";
    const display1 = slot1.querySelector('.name-display');
    const display2 = slot2.querySelector('.name-display');
    display1.textContent = f1.name;
    display2.textContent = f2.name;
    display1.style.display = "block";
    display2.style.display = "block";
    if (winnerChoice === '1') {
        display1.className = `name-display ${f1.gender === 'male' ? 'winner-male' : 'winner-female'}`;
        display2.className = "name-display loser";
        slot1.querySelector('.avatar-box').innerHTML = `${f1.name.charAt(0)}<div class="check-badge">✓</div>`;
    } else {
        display2.className = `name-display ${f2.gender === 'male' ? 'winner-male' : 'winner-female'}`;
        display1.className = "name-display loser";
        slot2.querySelector('.avatar-box').innerHTML = `${f2.name.charAt(0)}<div class="check-badge">✓</div>`;
    }
    row.querySelector('.controls-area').style.display = "none";
    const methodDisplay = document.getElementById(`${matchRowId}-final-method`);
    methodDisplay.textContent = methodName;
    methodDisplay.style.display = "block";
    alert(`Result Saved! Roster sheets updated for ${f1.name} and ${f2.name}.`);
};

function saveData() {
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
}

window.deleteFighter = function(id) {
    if (confirm("Are you sure you want to remove this fighter?")) {
        fighters = fighters.filter(f => f.id !== id);
        saveData();
        renderRoster();
    }
};
