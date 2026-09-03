const NEWS_WIRE_STORAGE_KEY = 'wwe_news_wire_entries';
const LOCAL_FEUD_REGISTRY_KEY = 'localFeudRegistry';
const MATCH_HISTORY_STORAGE_KEY = 'matchHistoryArray';

const reactiveCommentTemplates = [
    'Delete this, you got lucky!',
    'Match of the year energy!',
    'Can\'t wait to see the rematch!',
    'The whole division is watching this rivalry.',
    'Respectfully, I saw that finish coming.'
];

const reporterHeadlineTemplates = [
    '[Winner] absolutely dominated [Loser] to secure a victory via [Method] on Fight Card [CardNum]!',
    'Breaking: [Winner] outlasted [Loser] by [Method] in a hard-fought Fight Card [CardNum] showdown.',
    '[Winner] has the whole division talking after defeating [Loser] via [Method] on Fight Card [CardNum].',
    'Upset alert! [Winner] stopped [Loser] with [Method] and changed the conversation on Fight Card [CardNum].'
];

const maleTrashTalkTemplates = [
    { role: 'winner', text: 'I told everyone what would happen. [Loser], you just got outclassed.' },
    { role: 'winner', text: '[Loser] can talk about excuses. I will talk about another win.' },
    { role: 'loser', text: '[Winner], enjoy the win while it lasts. I demand a rematch.' },
    { role: 'loser', text: 'That result does not settle this. [Winner], give me another fight.' }
];

const femaleTrashTalkTemplates = [
    { role: 'winner', text: '[Loser], take notes. This is what a real main-event performance looks like.' },
    { role: 'winner', text: 'I delivered exactly what I promised. The division belongs to me now.' },
    { role: 'loser', text: '[Winner], you caught me once. I demand a rematch on my terms.' },
    { role: 'loser', text: 'This is not over. [Winner], I want another shot and everyone knows it.' }
];

const teammateTrashTalkTemplates = [
    { role: 'winner', text: 'We may share a locker room, [Loser], but I will not share the spotlight.' },
    { role: 'winner', text: 'That was business, not betrayal. [Loser], you know I had to prove myself.' },
    { role: 'loser', text: '[Winner], we are teammates, but I will remember this. The rematch is coming.' },
    { role: 'loser', text: 'Respect earned, respect tested. [Winner], our team will be talking about this for a long time.' }
];

const feudFollowupTemplates = [
    { role: 'winner', text: 'I told you last week that your [TargetRecord] record was a joke, and tonight I proved it.' },
    { role: 'winner', text: '[Target], I already called my shot. Consider tonight another receipt.' },
    { role: 'loser', text: '[Target], I remember your call-out. This loss does not end our business.' },
    { role: 'loser', text: 'You made this personal first, [Target]. I am coming for the answer in our next fight.' }
];

function readNewsWireEntries() {
    try {
        const stored = JSON.parse(localStorage.getItem(NEWS_WIRE_STORAGE_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function saveNewsWireEntries(entries) {
    localStorage.setItem(NEWS_WIRE_STORAGE_KEY, JSON.stringify(entries));
}

function readLocalFeudRegistry() {
    try {
        const stored = JSON.parse(localStorage.getItem(LOCAL_FEUD_REGISTRY_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function saveLocalFeudRegistry(registry) {
    localStorage.setItem(LOCAL_FEUD_REGISTRY_KEY, JSON.stringify(registry.slice(-250)));
}

function recordFeudMemory(speaker, target, text, cardNum) {
    const speakerDetails = getFighterDetails(speaker);
    const targetDetails = getFighterDetails(target);
    const registry = readLocalFeudRegistry();
    registry.push({
        speaker: speakerDetails.name,
        target: targetDetails.name,
        targetRecord: `${Number(target?.wins || 0)}-${Number(target?.losses || 0)}`,
        text,
        cardNum: cardNum || '',
        timestamp: new Date().toISOString(),
        pending: true
    });
    saveLocalFeudRegistry(registry);
}

function findPendingFeud(speaker, target) {
    const speakerName = getFighterDetails(speaker).name.toLowerCase();
    const targetName = getFighterDetails(target).name.toLowerCase();
    return readLocalFeudRegistry().slice().reverse().find(memory => (
        memory.pending !== false
        && String(memory.speaker).toLowerCase() === speakerName
        && String(memory.target).toLowerCase() === targetName
    ));
}

function readMatchHistoryArray() {
    const storedHistory = [];
    if (Array.isArray(window.matchHistoryArray)) storedHistory.push(...window.matchHistoryArray);
    try {
        const savedMatches = JSON.parse(localStorage.getItem(MATCH_HISTORY_STORAGE_KEY) || '[]');
        if (Array.isArray(savedMatches)) storedHistory.push(...savedMatches);
    } catch {}

    try {
        const eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
        eventHistory.forEach(event => {
            if (Array.isArray(event.matches)) storedHistory.push(...event.matches);
        });
    } catch {}
        const uniqueHistory = new Map();
        storedHistory.forEach(match => {
            const key = [match?.winner || match?.winnerName || '', match?.loser || match?.loserName || '', match?.showName || '', match?.method || ''].join('|').toLowerCase();
            uniqueHistory.set(key, match);
        });
        return Array.from(uniqueHistory.values());
}

function pairHasMatchHistory(fighterA, fighterB, history = readMatchHistoryArray()) {
    const names = [String(fighterA || '').trim().toLowerCase(), String(fighterB || '').trim().toLowerCase()];
    return history.some(match => {
        const participants = [
            match?.winner, match?.loser, match?.winnerName, match?.loserName,
            match?.fighterA, match?.fighterB, match?.slot1Name, match?.slot2Name
        ].filter(Boolean).map(name => String(name).trim().toLowerCase());
        return participants.includes(names[0]) && participants.includes(names[1]);
    });
}

function getFighterDetails(fighter) {
    if (fighter && typeof fighter === 'object') {
        return {
            name: fighter.name || 'Unknown Fighter',
            gender: fighter.gender || 'male',
            photo: fighter.photo || '',
            team: typeof fighter.team === 'string' ? fighter.team.trim() : '',
            partner: typeof fighter.partner === 'string' ? fighter.partner.trim() : '',
            wins: Number(fighter.wins || 0),
            losses: Number(fighter.losses || 0)
        };
    }
    const name = String(fighter || 'Unknown Fighter');
    const rosterFighter = Array.isArray(window.fighters) ? window.fighters.find(item => item.name === name) : null;
    return {
        name,
        gender: rosterFighter?.gender || 'male',
        photo: rosterFighter?.photo || '',
        team: rosterFighter?.team || '',
        partner: rosterFighter?.partner || '',
        wins: Number(rosterFighter?.wins || 0),
        losses: Number(rosterFighter?.losses || 0)
    };
}

function findRosterFighter(name) {
    const roster = Array.isArray(window.fighters) ? window.fighters : [];
    const normalizedName = String(name || '').trim().toLowerCase();
    return roster.find(fighter => String(fighter.name || '').trim().toLowerCase() === normalizedName) || null;
}

function sharedTeamFor(winner, loser) {
    const winnerTeam = String(winner.team || '').trim();
    const loserTeam = String(loser.team || '').trim();
    return winnerTeam && loserTeam && winnerTeam.toLowerCase() === loserTeam.toLowerCase() ? winnerTeam : '';
}

function chooseRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function randomLikeCount() {
    return Math.floor(Math.random() * 146) + 5;
}

function getNewsWireFighterPool() {
    if (Array.isArray(window.fighters) && window.fighters.length) return window.fighters;
    try {
        const stored = JSON.parse(localStorage.getItem('wwe_fighters') || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function createRandomCommentData(fighterPool, postAuthor) {
    const availableFighters = (fighterPool || []).filter(fighter => fighter?.name && fighter.name !== postAuthor);
    const commentCount = Math.min(Math.floor(Math.random() * 3) + 1, availableFighters.length);
    const selectedFighters = [];
    while (selectedFighters.length < commentCount) {
        const fighter = chooseRandom(availableFighters);
        if (!fighter || selectedFighters.some(selected => selected.id === fighter.id)) break;
        selectedFighters.push(fighter);
    }
    return selectedFighters.map(fighter => ({
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: fighter.name,
        authorPhoto: fighter.photo || '',
        text: chooseRandom(reactiveCommentTemplates),
        likes: randomLikeCount()
    }));
}

function generateRandomComments(postElement, fighterPool) {
    if (!postElement) return [];
    const comments = postElement.newsWireComments || createRandomCommentData(fighterPool, postElement.dataset.postAuthor || '');
    postElement.newsWireComments = comments;
    postElement.querySelector('.post-comments')?.remove();

    const commentSection = document.createElement('div');
    commentSection.className = 'post-comments';
    const heading = document.createElement('span');
    heading.className = 'comments-heading';
    heading.textContent = 'Comments';
    commentSection.append(heading);

    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'wire-comment';
        const avatar = document.createElement('div');
        avatar.className = 'comment-avatar';
        avatar.textContent = (comment.author || '?').charAt(0).toUpperCase();
        if (comment.authorPhoto) {
            const image = document.createElement('img');
            image.src = comment.authorPhoto;
            image.alt = `${comment.author} portrait`;
            image.onerror = () => image.remove();
            avatar.replaceChildren(image);
        }
        const body = document.createElement('div');
        const author = document.createElement('strong');
        author.textContent = comment.author || 'Unknown Fighter';
        const text = document.createElement('p');
        text.textContent = comment.text;
        body.append(author, text, createLikeControl(postElement.dataset.postId, comment.likes, comment.id));
        commentElement.append(avatar, body);
        commentSection.append(commentElement);
    });
    postElement.append(commentSection);
    return comments;
}

function createLikeControl(entryId, likes, commentId = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'like-button';
    button.textContent = `♥ ${Number(likes || 0)} Likes`;
    button.title = 'Like this post';
    button.addEventListener('click', () => {
        const updatedLikes = incrementNewsWireLikes(entryId, commentId);
        if (updatedLikes !== null) {
            button.textContent = `♥ ${updatedLikes} Likes`;
            button.classList.add('is-liked');
            button.setAttribute('aria-pressed', 'true');
        }
    });
    return button;
}

function incrementNewsWireLikes(entryId, commentId = '') {
    const entries = readNewsWireEntries();
    const entry = entries.find(item => item.id === entryId);
    if (!entry) return null;
    let target = entry;
    if (commentId) target = (entry.comments || []).find(comment => comment.id === commentId);
    if (!target) return null;
    target.likes = Number(target.likes || 0) + 1;
    saveNewsWireEntries(entries);
    return target.likes;
}

function addEngagementDefaults(entries) {
    let changed = false;
    const fighterPool = getNewsWireFighterPool();
    entries.forEach(entry => {
        if (typeof entry.likes !== 'number') {
            entry.likes = randomLikeCount();
            changed = true;
        }
        if (entry.type === 'social' && !Array.isArray(entry.comments)) {
            entry.comments = createRandomCommentData(fighterPool, entry.author || '');
            changed = true;
        }
    });
    if (changed) saveNewsWireEntries(entries);
}

function addNewsWireEntry(entry) {
    const entries = readNewsWireEntries();
    const newEntry = {
        ...entry,
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        likes: randomLikeCount()
    };
    if (newEntry.type === 'social') {
        newEntry.comments = createRandomCommentData(getNewsWireFighterPool(), newEntry.author || '');
    }
    entries.unshift(newEntry);
    saveNewsWireEntries(entries.slice(0, 250));
    renderNewsWireFeeds();
}

function generateReporterHeadline(winner, loser, method, cardNum) {
    const winnerDetails = getFighterDetails(winner);
    const loserDetails = getFighterDetails(loser);
    const team = sharedTeamFor(winnerDetails, loserDetails);
    const headlineTemplate = team
        ? `Civil War erupts in ${team} as [Winner] defeats teammate [Loser] via [Method] on Fight Card [CardNum]!`
        : chooseRandom(reporterHeadlineTemplates);
    const headline = headlineTemplate
        .replaceAll('[Winner]', winnerDetails.name)
        .replaceAll('[Loser]', loserDetails.name)
        .replaceAll('[Method]', method || 'a decisive finish')
        .replaceAll('[CardNum]', cardNum || 'the latest card');

    addNewsWireEntry({
        type: 'reporter',
        text: headline,
        showName: cardNum || 'Fight Card'
    });
}

function generateFighterTrashTalk(winner, loser, gender, cardNum) {
    const winnerDetails = getFighterDetails(winner);
    const loserDetails = getFighterDetails(loser);
    const team = sharedTeamFor(winnerDetails, loserDetails);
    const previousFeud = findPendingFeud(winnerDetails, loserDetails) || findPendingFeud(loserDetails, winnerDetails);
    const templates = previousFeud
        ? feudFollowupTemplates
        : team
        ? teammateTrashTalkTemplates
        : String(gender || winnerDetails.gender).toLowerCase() === 'female'
            ? femaleTrashTalkTemplates
            : maleTrashTalkTemplates;
    const selected = chooseRandom(templates);
    const author = selected.role === 'winner' ? winnerDetails : loserDetails;
    const target = selected.role === 'winner' ? loserDetails : winnerDetails;
    const text = selected.text
        .replaceAll('[Winner]', winnerDetails.name)
        .replaceAll('[Loser]', loserDetails.name);
    const followupText = text
        .replaceAll('[Target]', target.name)
        .replaceAll('[TargetRecord]', previousFeud?.targetRecord || `${Number(target.wins || 0)}-${Number(target.losses || 0)}`);

    addNewsWireEntry({
        type: 'social',
        author: author.name,
        authorPhoto: author.photo,
        authorGender: author.gender,
        text: followupText
    });
    recordFeudMemory(author, target, followupText, cardNum);

    const winnerPartner = winnerDetails.partner ? findRosterFighter(winnerDetails.partner) : null;
    if (winnerPartner) {
        addNewsWireEntry({
            type: 'social',
            author: winnerPartner.name,
            authorPhoto: winnerPartner.photo || '',
            authorGender: winnerPartner.gender || 'male',
            text: `So incredibly proud of ${winnerDetails.name} taking care of business tonight on Fight Card ${cardNum || 'tonight'}!`,
            relationship: 'supportive-partner'
        });
    }

    const loserPartner = loserDetails.partner ? findRosterFighter(loserDetails.partner) : null;
    if (loserPartner) {
        addNewsWireEntry({
            type: 'social',
            author: loserPartner.name,
            authorPhoto: loserPartner.photo || '',
            authorGender: loserPartner.gender || 'male',
            text: `${loserDetails.name} is not alone. ${winnerDetails.name}, you will answer for what happened on Fight Card ${cardNum || 'tonight'}.`,
            relationship: 'retaliatory-partner'
        });
    }
}

function generateReporterSuggestions() {
    const roster = Array.isArray(window.fighters) ? window.fighters.filter(fighter => fighter?.name) : [];
    const history = readMatchHistoryArray();
    const candidates = roster.slice().sort((first, second) => {
        const firstStreak = Number(first.wins || 0) - Number(first.losses || 0);
        const secondStreak = Number(second.wins || 0) - Number(second.losses || 0);
        return secondStreak - firstStreak;
    });

    for (let firstIndex = 0; firstIndex < candidates.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex++) {
            const first = candidates[firstIndex];
            const second = candidates[secondIndex];
            const matchingRecord = Number(first.wins || 0) === Number(second.wins || 0)
                && Number(first.losses || 0) === Number(second.losses || 0);
            const impressiveStreak = Number(first.wins || 0) >= 3 || Number(second.wins || 0) >= 3;
            if ((matchingRecord || impressiveStreak) && !pairHasMatchHistory(first.name, second.name, history)) {
                addNewsWireEntry({
                    type: 'suggestion',
                    text: `The reporters are calling for a clash between ${first.name} and ${second.name}!`,
                    showName: 'News Wire'
                });
                return true;
            }
        }
    }
    return false;
}

function renderNewsWireFeeds() {
    const reporterFeed = document.getElementById('reporterHeadlinesFeed');
    const socialFeed = document.getElementById('fighterSocialFeed');
    if (!reporterFeed && !socialFeed) return;

    const entries = readNewsWireEntries();
    addEngagementDefaults(entries);
    const reporters = entries.filter(entry => entry.type === 'reporter');
    const socialPosts = entries.filter(entry => entry.type === 'social');

    if (reporterFeed) {
        reporterFeed.replaceChildren();
        if (!reporters.length) reporterFeed.append(createEmptyFeedMessage('Reporter headlines will appear after the next match.'));
        reporters.forEach(entry => reporterFeed.append(createReporterPost(entry)));
    }
    if (socialFeed) {
        socialFeed.replaceChildren();
        if (!socialPosts.length) socialFeed.append(createEmptyFeedMessage('Fighter posts will appear after the next match.'));
        socialPosts.forEach(entry => socialFeed.append(createSocialPost(entry)));
    }
}

function createEmptyFeedMessage(message) {
    const empty = document.createElement('p');
    empty.className = 'feed-empty';
    empty.textContent = message;
    return empty;
}

function createReporterPost(entry) {
    const article = document.createElement('article');
    article.className = 'wire-post reporter-post';
    const label = document.createElement('span');
    label.className = 'post-label';
    label.textContent = entry.type === 'suggestion' ? 'MATCHMAKER ALERT' : 'LIVE REPORT';
    const text = document.createElement('p');
    text.textContent = entry.text;
    const time = document.createElement('time');
    time.textContent = formatNewsTimestamp(entry.timestamp);
    article.dataset.postId = entry.id;
    article.append(label, text, time, createLikeControl(entry.id, entry.likes));
    return article;
}

function createSocialPost(entry) {
    const article = document.createElement('article');
    article.className = 'wire-post social-post';
    const avatar = document.createElement('div');
    avatar.className = 'social-avatar';
    avatar.textContent = (entry.author || '?').charAt(0).toUpperCase();
    if (entry.authorPhoto) {
        const image = document.createElement('img');
        image.src = entry.authorPhoto;
        image.alt = `${entry.author} portrait`;
        image.onerror = () => image.remove();
        avatar.replaceChildren(image);
    }
    const content = document.createElement('div');
    const header = document.createElement('div');
    header.className = 'social-post-header';
    const author = document.createElement('strong');
    author.textContent = entry.author || 'Unknown Fighter';
    const handle = document.createElement('span');
    handle.textContent = `@${(entry.author || 'fighter').toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    header.append(author, handle);
    const text = document.createElement('p');
    text.textContent = entry.text;
    const time = document.createElement('time');
    time.textContent = formatNewsTimestamp(entry.timestamp);
    content.append(header, text, time, createLikeControl(entry.id, entry.likes));
    article.dataset.postId = entry.id;
    article.dataset.postAuthor = entry.author || '';
    article.newsWireComments = entry.comments || [];
    article.append(avatar, content);
    generateRandomComments(article, getNewsWireFighterPool());
    return article;
}

function formatNewsTimestamp(timestamp) {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

window.generateReporterHeadline = generateReporterHeadline;
window.generateFighterTrashTalk = generateFighterTrashTalk;
window.generateReporterSuggestions = generateReporterSuggestions;
window.generateRandomComments = generateRandomComments;
window.recordMatchForNewsWire = match => {
    const history = readMatchHistoryArray();
    history.push(match);
    localStorage.setItem(MATCH_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(-500)));
    window.matchHistoryArray = history;
};
window.renderNewsWireFeeds = renderNewsWireFeeds;

if (!Array.isArray(window.matchHistoryArray)) {
    window.matchHistoryArray = readMatchHistoryArray();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNewsWireFeeds);
} else {
    renderNewsWireFeeds();
}
