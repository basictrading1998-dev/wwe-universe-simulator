// Simple client-side privacy gate
(function(){
    const SECRET = 'brandon'; // case-insensitive
    function isUnlocked(){ return sessionStorage.getItem('wwe_site_unlocked') === '1'; }

    function createOverlay(){
        const overlay = document.createElement('div');
        overlay.id = 'site-auth-overlay';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(2,6,23,0.9); color:#fff; display:flex; align-items:center; justify-content:center; z-index:999999;';

        overlay.innerHTML = `
            <div style="max-width:440px; width:92%; padding:24px; background:linear-gradient(180deg,#0b1220,#071026); border-radius:12px; border:1px solid rgba(255,255,255,0.06); box-shadow:0 20px 40px rgba(2,6,23,0.6); text-align:center;">
                <h2 style="margin:0 0 8px 0; font-size:1.25rem; font-weight:800;">Private Site</h2>
                <p style="margin:0 0 12px 0; color:#94a3b8; font-size:0.9rem;">Enter your private word to unlock this site.</p>
                <input id="siteAuthInput" placeholder="Type your private word" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); color:#fff; font-weight:700; margin-bottom:12px; outline:none; font-size:0.95rem;">
                <div style="display:flex; gap:8px; justify-content:center;">
                    <button id="siteAuthBtn" style="background:#10b981; border:none; color:white; padding:10px 14px; border-radius:8px; font-weight:800; cursor:pointer;">Unlock</button>
                    <button id="siteAuthClear" style="background:#ef4444; border:none; color:white; padding:10px 14px; border-radius:8px; font-weight:800; cursor:pointer;">Cancel</button>
                </div>
                <p id="siteAuthMsg" style="margin-top:12px; color:#fca5a5; font-weight:700; display:none;"></p>
            </div>`;

        document.body.appendChild(overlay);

        const input = document.getElementById('siteAuthInput');
        const btn = document.getElementById('siteAuthBtn');
        const clr = document.getElementById('siteAuthClear');
        const msg = document.getElementById('siteAuthMsg');

        function unlock(){
            const val = (input.value || '').trim().toLowerCase();
            if(val === SECRET){
                sessionStorage.setItem('wwe_site_unlocked','1');
                overlay.remove();
            } else {
                msg.textContent = 'Incorrect word. Try again.'; msg.style.display = 'block';
                input.style.animation = 'site-shake 0.4s';
                setTimeout(()=>{ input.style.animation = ''; }, 420);
            }
        }

        btn.onclick = unlock;
        clr.onclick = function(){ input.value = ''; };
        input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ unlock(); } });

        const style = document.createElement('style');
        style.textContent = `@keyframes site-shake{0%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}100%{transform:translateX(0)}}`;
        document.head.appendChild(style);
    }

    document.addEventListener('DOMContentLoaded', function(){
        if(!isUnlocked()) createOverlay();
    });
})();
