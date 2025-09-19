(function(){
  // Simple badge system persisted in localStorage under 'aurraa:badgeCount'
  const KEY = 'aurraa:badgeCount';
  function read(){
    try{const raw=localStorage.getItem(KEY);return raw?parseInt(raw,10)||0:0}catch(e){return 0}
  }
  function write(n){try{localStorage.setItem(KEY,String(n))}catch(e){}}

  // Create DOM element
  function create(){
    if (document.getElementById('aurraa-badge')) return document.getElementById('aurraa-badge');
    const wrap = document.createElement('div');
    wrap.id = 'aurraa-badge';
    wrap.className = 'aurraa-badge bronze';
    const count = document.createElement('div');
    count.className = 'count';
    count.textContent = '0';
    wrap.appendChild(count);
    document.body.appendChild(wrap);
    return wrap;
  }

  function updateUI(n){
    const el = create();
    const countEl = el.querySelector('.count');
    countEl.textContent = String(n);
    // choose class based on thresholds
    el.classList.remove('bronze','silver','gold');
    if (n >= 100) el.classList.add('gold');
    else if (n >= 25) el.classList.add('silver');
    else el.classList.add('bronze');
  }

  function inc(by){
    const current = read();
    const next = current + (typeof by === 'number' ? by : 1);
    write(next);
    updateUI(next);
    // dispatch a global event so other code can react
    window.dispatchEvent(new CustomEvent('aurraa:badgeUpdated',{detail:{count:next}}));
    return next;
  }

  function set(n){
    const v = Number(n)||0; write(v); updateUI(v); window.dispatchEvent(new CustomEvent('aurraa:badgeUpdated',{detail:{count:v}}));
  }

  // public API
  const api = { inc, set, get: read };

  // attach to window.AURRAA if present
  if (typeof window !== 'undefined'){
    window.AURRAA = window.AURRAA || {};
    window.AURRAA.badge = api;
    // initialize UI on DOM ready
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=> updateUI(read()));
    else updateUI(read());
    // listen for a generic event 'aurraa:levelCompleted' to increment
    window.addEventListener('aurraa:levelCompleted', ()=> inc(1));
  }
})();
