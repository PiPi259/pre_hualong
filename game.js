(() => {
  const G = GAME, $ = id => document.getElementById(id);
  const st = {
    scene: G.start, scale: 1, inv: Array(G.slots).fill(null),
    basket: null, board: null, overlay: null,   // 籃子裡的水果 / 圖板上的板塊 / 海報上的▲片
    sel: null, drag: -1, inspect: null, subTimer: null,
  };
  const give = id => ({ id, ...G.items[id] });
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const px = r => Object.entries(r).map(([k, v]) => `${k}:${v}px`).join(';');

  /* ---------- 字幕 / 縮放 ---------- */
  function say(text) {
    const s = $('game-subtitle'); s.textContent = text; s.style.opacity = 1;
    clearTimeout(st.subTimer); st.subTimer = setTimeout(() => s.style.opacity = 0, 2500);
  }
  function resize() {
    st.scale = Math.min(innerWidth / 1680, innerHeight / 1026);
    $('game-viewport').style.transform = `scale(${st.scale})`;
  }
  $('fullscreen-btn').onclick = () => document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen().catch(() => say('無法啟用全螢幕'));

  /* ---------- 道具欄 ---------- */
  function addItem(item, force) {
    let i = st.inv.indexOf(null);
    if (i < 0) { if (!force) { say(G.msg.full); return false; } i = 0; }
    st.inv[i] = item; renderInv(); return true;
  }
  function renderInv() {
    st.inv.forEach((it, i) => $('slot-' + i).innerHTML = it ? `<img src="${IMG + it.img}" alt="">` : '');
  }
  function buildInv() {
    for (let i = 0; i < G.slots; i++) {
      const s = el('div', 'inv-slot'); s.id = 'slot-' + i;
      s.onpointerdown = e => startDrag(e, i);
      s.onclick = () => clickSlot(i);
      $('inventory').appendChild(s);
    }
    G.startItems.forEach(id => addItem(give(id)));
  }
  function clickSlot(i) {
    const it = st.inv[i];
    if (!it) { st.sel = null; return; }
    if (st.sel !== i) { st.sel = i; return; }
    st.sel = null; st.inspect = it;
    if (it.board) { say(it.name); $('modal-tile-board').style.display = 'flex'; }
    else {
      $('detail-item-img').src = IMG + it.img;
      $('detail-ctrl-panel').style.display = it.flip ? 'block' : 'none';
      $('modal-item-detail').style.display = 'flex';
    }
  }
  $('modal-item-detail').onclick = () => $('modal-item-detail').style.display = 'none';
  $('detail-box').onclick = e => { e.stopPropagation(); if (st.inspect) say(st.inspect.name); };
  $('detail-ctrl-panel').onclick = e => e.stopPropagation();
  $('flip-btn').onclick = () => {
    const it = st.inspect; if (!it || !it.flip) return;
    it.img = it.img === it.flip[0] ? it.flip[1] : it.flip[0];
    $('detail-item-img').src = IMG + it.img;
    if (st.board === it) $('placed-tile-img').src = IMG + it.img;
    renderInv();
  };

  /* ---------- 場景 ---------- */
  function pick(id, node) {
    if (addItem(give(id))) node.style.display = 'none';
  }
  function hotspot(h) {
    const d = el('div', 'hotspot'); d.style.cssText = px(h.r);
    if (h.item) {
      d.innerHTML = `<img src="${IMG + G.items[h.item].img}" alt="" ${h.opacity ? `style="opacity:${h.opacity}"` : ''}>`;
      d.onclick = () => pick(h.item, d);
    } else d.onclick = () => h.go ? goTo(h.go) : say(h.say);
    return d;
  }
  function buildScenes() {
    for (const [id, sc] of Object.entries(G.scenes)) {
      const w = el('div', 'wall'); w.id = 'wall-' + id;
      w.style.backgroundImage = `url('${IMG}bg_${sc.bg}.jpg')`;
      (sc.hotspots || []).forEach(h => w.appendChild(hotspot(h)));
      if (sc.down) { const b = el('div', 'nav-down-btn', '&or;'); b.onclick = () => goTo(sc.back); w.appendChild(b); }
      $('walls').appendChild(w);
    }
    buildSafe(); buildBasket(); buildBaseboard();
  }
  const onLeave = { safe: () => { $('safe-box').style.display = 'none'; $('safe-hotspot').style.display = 'block'; $('safe-input').value = ''; },
                    baseboard: () => returnOverlay() };
  const onEnter = { basket: () => renderBasket() };
  function goTo(id) {
    if (onLeave[st.scene]) onLeave[st.scene]();
    st.scene = id;
    document.querySelectorAll('.wall').forEach(w => w.classList.toggle('active', w.id === 'wall-' + id));
    const nav = G.ring.includes(id) ? 'flex' : 'none';
    $('nav-left').style.display = $('nav-right').style.display = nav;
    if (onEnter[id]) onEnter[id]();
  }
  const turn = d => goTo(G.ring[(G.ring.indexOf(st.scene) + d + G.ring.length) % G.ring.length]);
  $('nav-left').onclick = () => turn(-1);
  $('nav-right').onclick = () => turn(1);

  /* ---------- 保險箱 ---------- */
  function buildSafe() {
    const w = $('wall-safe');
    const hs = el('div', 'hotspot'); hs.id = 'safe-hotspot'; hs.style.cssText = px({ top: 520, left: 700, width: 280, height: 120 });
    const box = el('div', '', `<input type="text" id="safe-input" maxlength="4" placeholder="${G.safePlaceholder}"><button>開啟</button>`);
    box.id = 'safe-box';
    hs.onclick = () => { hs.style.display = 'none'; box.style.display = 'flex'; $('safe-input').focus(); };
    box.querySelector('button').onclick = () => $('safe-input').value.trim() === G.password ? finishGame() : say(G.msg.wrong);
    w.append(hs, box);
  }

  /* ---------- 果籃 ---------- */
  function buildBasket() {
    const a = el('div', '', '<img id="basket-fruit" alt="">'); a.id = 'basket-area';
    a.onclick = () => {
      if (st.basket && addItem(st.basket)) { st.basket = null; renderBasket(); }
    };
    $('wall-basket').appendChild(a);
    st.basket = give('strawberry');
  }
  function renderBasket() {
    const f = $('basket-fruit');
    f.style.display = st.basket ? 'block' : 'none';
    if (st.basket) f.src = IMG + (st.basket.inBasket || st.basket.img);
  }
  function dropBasket(i) {
    const it = st.inv[i];
    if (!it.fruit) return;
    if (st.basket) return say(G.msg.oneFruit);
    st.basket = it; st.inv[i] = null; renderInv(); renderBasket();
  }

  /* ---------- 拖曳 / 旋轉（已把畫面縮放算進去） ---------- */
  function manip(layer, edge, get, set) {
    layer.onpointerdown = e => {
      const rc = layer.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
      const ang = ev => Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      const rotating = Math.hypot(e.clientX - cx, e.clientY - cy) > rc.width / 2 * edge;
      const a0 = ang(e), r0 = get();
      const ox = e.clientX / st.scale - layer.offsetLeft, oy = e.clientY / st.scale - layer.offsetTop;
      const move = ev => {
        if (rotating) { set(r0 + ang(ev) - a0); }
        else { layer.style.left = ev.clientX / st.scale - ox + 'px'; layer.style.top = ev.clientY / st.scale - oy + 'px'; }
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
      e.stopPropagation(); e.preventDefault();
    };
  }
  let boardRot = 0, overlayRot = 0;
  const setBoardRot = r => { boardRot = r; $('tile-board-placed-layer').style.transform = `rotate(${r}deg)`; };
  const setOverlayRot = r => { overlayRot = r; $('overlay-layer').style.transform = `rotate(${r}deg)`; };

  /* ---------- ▲海報 ---------- */
  function buildBaseboard() {
    const l = el('div', 'manipulate-layer', `<img src="${IMG}${G.items.overlay.img}" alt="">`); l.id = 'overlay-layer';
    $('wall-baseboard').appendChild(l);
    manip(l, 0.5, () => overlayRot, setOverlayRot);
  }
  function dropBaseboard(i, x, y) {
    if (st.inv[i].id !== 'overlay') return;
    st.overlay = st.inv[i]; st.inv[i] = null; renderInv(); setOverlayRot(0);
    const r = $('wall-baseboard').getBoundingClientRect(), l = $('overlay-layer');
    l.style.display = 'flex';
    l.style.left = (x - r.left) / st.scale - 280 + 'px';
    l.style.top = (y - r.top) / st.scale - 280 + 'px';
  }
  function returnOverlay() {
    if (!st.overlay) return;
    addItem(st.overlay, true); st.overlay = null;
    $('overlay-layer').style.display = 'none';
  }

  /* ---------- ◆圖板 ---------- */
  manip($('tile-board-placed-layer'), 0.4, () => boardRot, setBoardRot);
  $('board-img').src = IMG + G.items.tile_board.img;
  $('tile-board-wrapper').onclick = e => e.stopPropagation();
  $('modal-tile-board').onclick = () => {
    $('modal-tile-board').style.display = 'none';
    if (st.board) { addItem(st.board, true); st.board = null; $('tile-board-placed-layer').style.display = 'none'; }
  };
  function dropBoard(i) {
    const it = st.inv[i];
    if (!it.tile) return;
    st.inv[i] = st.board; st.board = it; renderInv(); setBoardRot(0);
    $('placed-tile-img').src = IMG + it.img;
    $('tile-board-placed-layer').style.display = 'flex';
  }

  /* ---------- 從道具欄拖出去 ---------- */
  const inRect = (node, x, y) => { const r = node.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  function startDrag(e, i) {
    if (!st.inv[i]) return;
    st.drag = i;
    $('ghost-img').src = IMG + st.inv[i].img;
    moveGhost(e); $('custom-drag-ghost').style.display = 'block'; e.preventDefault();
  }
  function moveGhost(e) { const g = $('custom-drag-ghost'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
  document.addEventListener('pointermove', e => { if (st.drag >= 0) moveGhost(e); });
  document.addEventListener('pointerup', e => {
    if (st.drag < 0) return;
    const i = st.drag, x = e.clientX, y = e.clientY; st.drag = -1;
    $('custom-drag-ghost').style.display = 'none';
    if (st.scene === 'basket' && inRect($('wall-basket'), x, y)) dropBasket(i);
    else if (st.scene === 'baseboard' && inRect($('wall-baseboard'), x, y)) dropBaseboard(i, x, y);
    else if ($('modal-tile-board').style.display === 'flex' && inRect($('tile-board-wrapper'), x, y)) dropBoard(i);
  });

  /* ---------- 開場 / 通關 ---------- */
  function showScreen(c, done) {
    if (!c) return done && done();
    const s = $('screen');
    s.innerHTML = (c.img ? `<img src="${IMG + c.img}" alt="">` : '') + `<p>${c.text || ''}</p><button>${c.button || '開始'}</button>`;
    s.style.display = 'flex';
    s.querySelector('button').onclick = () => { s.style.display = 'none'; done && done(); };
  }
  function finishGame() { G.ending ? showScreen(G.ending) : say(G.endingFallback); }

  /* ---------- 啟動 ---------- */
  [...new Set([
    ...Object.values(G.scenes).map(s => `bg_${s.bg}.jpg`),
    ...Object.values(G.items).flatMap(i => [i.img, i.inBasket, ...(i.flip || [])]),
  ])].filter(Boolean).forEach(f => { new Image().src = IMG + f; });

  buildScenes(); buildInv();
  addEventListener('resize', resize); resize();
  goTo(G.start);
  showScreen(G.intro);
})();
