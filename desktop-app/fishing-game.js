(() => {
  'use strict';

  const GAME_SECONDS = 60;
  const TARGET_SCORE = 1500;
  const BEST_KEY = 'ma-xiexie-fishing-best-v1';
  const fishTypes = [
    { id:'weekly', name:'周报小黄鱼', score:110, difficulty:1, color:'#ffd44a', size:58, weight:38 },
    { id:'change', name:'需求变更鱼', score:220, difficulty:2, color:'#ff806e', size:68, weight:29 },
    { id:'meeting', name:'会议河豚', score:350, difficulty:3, color:'#8fe0a9', size:76, weight:19 },
    { id:'p0', name:'P0 大鲨鱼', score:600, difficulty:4, color:'#a9c6ff', size:96, weight:9 },
    { id:'checkout', name:'准点下班锦鲤', score:800, difficulty:4.5, color:'#ffeb78', size:82, weight:5 }
  ];

  const $ = (selector) => document.querySelector(selector);
  const page = $('#page-playground');
  const entry = $('#playground-entry');
  if (!page || !entry) return;

  const ui = {
    back: $('#playground-back'), docButton: $('#playground-doc-button'), cover: $('#work-cover'), coverReturn: $('#work-cover-return'), pond: $('#fishing-pond'),
    entryStatus: $('#playground-entry-status'), entryHint: $('#playground-entry-hint'), entryKicker: $('#playground-entry-kicker'), entryTitle: $('#playground-entry-title'), entryDescription: $('#playground-entry-description'), entryAction: $('#playground-entry-action'),
    layer: $('#fishing-fish-layer'), line: $('#fishing-line'), marker: $('#fishing-cast-marker'), callout: $('#fishing-callout'),
    tension: $('#fishing-tension'), tensionMarker: $('#fishing-tension-marker'), tensionCopy: $('#fishing-tension-copy'),
    missionFill: $('#fishing-mission-fill'), missionScore: $('#fishing-mission-score'), score: $('#fishing-score'),
    time: $('#fishing-time'), combo: $('#fishing-combo'), best: $('#fishing-best'), catches: $('#fishing-catch-list'),
    overlay: $('#fishing-overlay'), overlayKicker: $('#fishing-overlay-kicker'), overlayTitle: $('#fishing-overlay-title'),
    overlayCopy: $('#fishing-overlay-copy'), overlayAction: $('#fishing-overlay-action')
  };

  const state = {
    phase:'idle', score:0, combo:1, remaining:GAME_SECONDS, fish:[], target:null, catches:[],
    castX:50, castY:50, biteAt:0, biteEnds:0, hookedAt:0, reeling:false, tension:40,
    reelProgress:0, dangerFor:0, slackFor:0, lastFrame:0, nextFishId:1, paused:false,
    resumePhase:null, overlayMode:'start', calloutTimer:0, best:0, coverFromPlayground:false
  };

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  }

  function loadBest() {
    try {
      const saved = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      state.best = saved.date === todayKey() ? Math.max(0,Number(saved.score) || 0) : 0;
    } catch { state.best = 0; }
    ui.best.textContent = String(state.best);
  }

  function saveBest() {
    if (state.score <= state.best) return;
    state.best = state.score;
    localStorage.setItem(BEST_KEY, JSON.stringify({ date:todayKey(), score:state.best }));
    ui.best.textContent = String(state.best);
  }

  function setCallout(text, duration = 0) {
    clearTimeout(state.calloutTimer);
    ui.callout.textContent = text;
    ui.callout.hidden = !text;
    if (duration) state.calloutTimer = window.setTimeout(() => {
      if (state.phase === 'aiming') ui.callout.hidden = true;
    }, duration);
  }

  function playTone(kind = 'tap') {
    if (localStorage.getItem('ma-xiexie-sound-v1') === 'off') return;
    const context = typeof getAudioContext === 'function' ? getAudioContext() : null;
    if (!context) return;
    if (context.state === 'suspended') context.resume();
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const notes = { tap:[280,.05,.07], bite:[620,.08,.11], catch:[420,.18,.14], fail:[150,.16,.11], perfect:[760,.22,.12] };
    const [frequency,duration,volume] = notes[kind] || notes.tap;
    oscillator.type = kind === 'fail' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency,start);
    if (kind === 'catch' || kind === 'perfect') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.55,start + duration);
    gain.gain.setValueAtTime(volume,start);
    gain.gain.exponentialRampToValueAtTime(.0001,start + duration);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
  }

  function weightedType() {
    const elapsedRatio = 1 - state.remaining / GAME_SECONDS;
    const weighted = fishTypes.map((type) => ({ type, weight:type.weight * (type.difficulty >= 3 ? .65 + elapsedRatio * 1.5 : 1) }));
    let roll = Math.random() * weighted.reduce((sum,item) => sum + item.weight,0);
    for (const item of weighted) { roll -= item.weight; if (roll <= 0) return item.type; }
    return fishTypes[0];
  }

  function spawnFish(type = weightedType()) {
    const fromLeft = Math.random() > .5;
    const fish = {
      id:state.nextFishId++, type, x:fromLeft ? -8 : 108, y:34 + Math.random() * 49,
      direction:fromLeft ? 1 : -1, speed:(4.5 + Math.random() * 3.5 + type.difficulty * .5),
      wave:Math.random() * Math.PI * 2, node:null
    };
    const node = document.createElement('span');
    node.className = 'pond-fish';
    node.dataset.fishId = String(fish.id);
    node.style.setProperty('--fish-size',`${type.size}px`);
    node.style.setProperty('--fish-color',type.color);
    node.innerHTML = `<i class="pond-fish-body"></i><span class="pond-fish-label">${type.name} · ${type.score}</span>`;
    ui.layer.appendChild(node);
    fish.node = node;
    state.fish.push(fish);
    positionFish(fish);
    return fish;
  }

  function positionFish(fish) {
    fish.node.style.left = `${fish.x}%`;
    fish.node.style.top = `${fish.y}%`;
    fish.node.style.setProperty('--direction',String(fish.direction));
  }

  function removeFish(fish) {
    fish?.node?.remove();
    state.fish = state.fish.filter((item) => item !== fish);
    if (state.target === fish) state.target = null;
  }

  function resetFish() {
    state.fish.forEach((fish) => fish.node.remove());
    state.fish = [];
    state.target = null;
    for (let index = 0; index < 8; index += 1) {
      const fish = spawnFish();
      fish.x = 8 + index * 12 + Math.random() * 5;
      positionFish(fish);
    }
  }

  function updateHud() {
    ui.score.textContent = String(Math.round(state.score));
    ui.time.textContent = Math.max(0,state.remaining).toFixed(1);
    ui.combo.textContent = `×${state.combo}`;
    ui.missionScore.textContent = `${Math.round(state.score)} / ${TARGET_SCORE}`;
    ui.missionFill.style.width = `${Math.min(100,state.score / TARGET_SCORE * 100)}%`;
    ui.tensionMarker.style.left = `${Math.max(0,Math.min(100,state.tension))}%`;
    ui.tensionCopy.textContent = state.tension > 86 ? '快松手！' : state.tension < 16 ? '快收线！' : state.reeling ? '正在收线' : '稳住';
    ui.line.classList.toggle('is-hot',state.tension > 82);
  }

  function renderCatches() {
    ui.catches.innerHTML = state.catches.length
      ? state.catches.slice(-7).reverse().map((item) => `<span>${item.name} +${item.points}</span>`).join('')
      : '<span>还空着，先钓一条</span>';
  }

  function showOverlay(mode, details = {}) {
    state.overlayMode = mode;
    ui.overlay.hidden = false;
    if (mode === 'start') {
      ui.overlayKicker.textContent = '60 秒工位挑战';
      ui.overlayTitle.textContent = '差一点，才最上头。';
      ui.overlayCopy.textContent = '瞄准鱼头下钩；咬钩时再次点击；按住鼠标收线、松开降张力。空格随时打开工作文档。';
      ui.overlayAction.textContent = '开始带薪钓鱼 →';
    } else if (mode === 'pause') {
      ui.overlayKicker.textContent = '进度已安全保管';
      ui.overlayTitle.textContent = '老板走了吗？';
      ui.overlayCopy.textContent = '鱼群和倒计时都停在原地。确认安全后再继续。';
      ui.overlayAction.textContent = '继续摸鱼 →';
    } else {
      const passed = state.score >= TARGET_SCORE;
      const gap = Math.max(0,TARGET_SCORE - state.score);
      ui.overlayKicker.textContent = passed ? '今日带薪指标达成' : '本局摸鱼结算';
      ui.overlayTitle.textContent = passed ? `${state.score} 分 · 准予摸鱼` : `只差 ${gap} 分`;
      ui.overlayCopy.textContent = passed
        ? `钓到 ${state.catches.length} 条，最高连击 ×${details.maxCombo || state.combo}。今日最高分已经记下。`
        : `本局 ${state.score} 分，钓到 ${state.catches.length} 条。再稳住一次鱼线，就可能过关。`;
      ui.overlayAction.textContent = '再摸一局 →';
    }
  }

  function hideOverlay() { ui.overlay.hidden = true; }

  function startGame() {
    state.phase = 'aiming'; state.score = 0; state.combo = 1; state.remaining = GAME_SECONDS;
    state.catches = []; state.reeling = false; state.paused = false; state.resumePhase = null;
    state.tension = 40; state.reelProgress = 0; state.dangerFor = 0; state.slackFor = 0;
    ui.marker.hidden = true; ui.line.style.height = '0'; ui.tension.hidden = true;
    resetFish(); renderCatches(); updateHud(); hideOverlay();
    setCallout('移动鼠标瞄准鱼头，单击下钩',2100);
    state.lastFrame = performance.now();
  }

  function pauseForCover() {
    if (!['aiming','waiting','bite','hooked'].includes(state.phase)) return;
    state.resumePhase = state.phase;
    state.paused = true;
    state.reeling = false;
  }

  function resumeFromCover() {
    if (!state.resumePhase) return;
    state.paused = true;
    showOverlay('pause');
  }

  function resumeGame() {
    state.phase = state.resumePhase || state.phase || 'aiming';
    state.resumePhase = null;
    state.paused = false;
    state.lastFrame = performance.now();
    hideOverlay();
  }

  function endGame() {
    state.remaining = 0; state.phase = 'result'; state.reeling = false; state.paused = false;
    ui.tension.hidden = true; ui.marker.hidden = true; ui.line.style.height = '0';
    saveBest(); updateHud(); playTone(state.score >= TARGET_SCORE ? 'perfect' : 'fail');
    showOverlay('result',{ maxCombo:state.combo });
  }

  function lineTo(x,y) {
    const rect = ui.pond.getBoundingClientRect();
    const anchorX = rect.width * .5;
    const dx = x - anchorX;
    const dy = y;
    const length = Math.sqrt(dx * dx + dy * dy);
    ui.line.style.height = `${length}px`;
    ui.line.style.transform = `rotate(${Math.atan2(dy,dx) * 180 / Math.PI - 90}deg)`;
  }

  function nearestFish(x,y) {
    const rect = ui.pond.getBoundingClientRect();
    let nearest = null; let bestDistance = Infinity;
    state.fish.forEach((fish) => {
      const fishX = rect.width * fish.x / 100;
      const fishY = rect.height * fish.y / 100;
      const distance = Math.hypot(fishX - x,fishY - y);
      if (distance < bestDistance) { nearest = fish; bestDistance = distance; }
    });
    return bestDistance <= 42 + (nearest?.type.size || 0) * .22 ? nearest : null;
  }

  function castAt(x,y) {
    if (state.phase !== 'aiming') return;
    state.castX = x; state.castY = y; state.phase = 'waiting';
    ui.marker.hidden = false; ui.marker.style.left = `${x}px`; ui.marker.style.top = `${y}px`;
    lineTo(x,y); playTone('tap');
    state.target = nearestFish(x,y);
    if (!state.target) {
      setCallout('落空了 · 预判鱼头前方再试一次');
      window.setTimeout(() => resetCast(true),540);
      return;
    }
    setCallout('鱼在试探……盯紧水花');
    const now = performance.now();
    state.biteAt = now + 280 + Math.random() * 470;
    state.biteEnds = state.biteAt + Math.max(440,850 - state.target.type.difficulty * 80);
  }

  function hookFish() {
    if (state.phase !== 'bite' || !state.target) return;
    const reactionRatio = Math.max(0,(performance.now() - state.biteAt) / (state.biteEnds - state.biteAt));
    const perfect = reactionRatio < .38;
    state.phase = 'hooked'; state.hookedAt = performance.now(); state.tension = perfect ? 30 : 43;
    state.reelProgress = perfect ? 16 : 0; state.dangerFor = 0; state.slackFor = 0; state.reeling = false;
    state.target.node.classList.add('is-hooked');
    ui.marker.hidden = true; ui.tension.hidden = false;
    setCallout(perfect ? '完美起竿！按住收线，红了就松手' : '上钩！按住收线，红了就松手',1500);
    playTone(perfect ? 'perfect' : 'bite');
  }

  function resetCast(keepTarget = false) {
    if (state.phase === 'result') return;
    state.phase = 'aiming'; state.reeling = false;
    ui.marker.hidden = true; ui.line.style.height = '0'; ui.line.classList.remove('is-hot'); ui.tension.hidden = true;
    if (!keepTarget) state.target = null;
    else state.target = null;
  }

  function loseFish(reason) {
    const fish = state.target;
    fish?.node?.classList.remove('is-hooked');
    state.combo = 1; playTone('fail'); setCallout(reason,1300);
    if (fish) { fish.speed *= 1.55; fish.direction *= -1; }
    resetCast(); updateHud();
  }

  function catchFish() {
    const fish = state.target;
    if (!fish) return resetCast();
    const points = Math.round(fish.type.score * state.combo);
    state.score += points;
    state.catches.push({ name:fish.type.name, points });
    const nextCombo = Math.min(4,state.combo + 1);
    setCallout(`${fish.type.name} +${points} · 连钓 ×${nextCombo}`,1200);
    playTone('catch'); removeFish(fish); spawnFish();
    state.combo = nextCombo; saveBest(); renderCatches(); resetCast(); updateHud();
  }

  function updateFish(delta,now) {
    const difficultyBoost = 1 + (1 - state.remaining / GAME_SECONDS) * .42;
    state.fish.forEach((fish) => {
      if (fish === state.target && state.phase === 'hooked') return;
      fish.x += fish.speed * fish.direction * delta * difficultyBoost;
      fish.y += Math.sin(now / 520 + fish.wave) * delta * (1.1 + fish.type.difficulty * .2);
      if (fish.x > 114 || fish.x < -14) {
        fish.direction *= -1;
        fish.x = Math.max(-12,Math.min(112,fish.x));
        fish.y = 34 + Math.random() * 48;
      }
      fish.y = Math.max(31,Math.min(87,fish.y));
      positionFish(fish);
    });
  }

  function updateHooked(delta,now) {
    const fish = state.target;
    if (!fish) return resetCast();
    const difficulty = fish.type.difficulty;
    const pulse = Math.max(0,Math.sin(now / (230 - difficulty * 18) + fish.wave));
    const struggle = difficulty * (1.2 + pulse * 2.4);
    state.tension += (state.reeling ? 30 + struggle * 2.1 : -25 + struggle * .55) * delta;
    state.reelProgress += (state.reeling ? 22 - difficulty * 1.7 - pulse * 3 : -3.8 - difficulty * .25) * delta;
    state.tension = Math.max(0,Math.min(112,state.tension));
    state.reelProgress = Math.max(0,Math.min(100,state.reelProgress));
    if (state.tension >= 100) state.dangerFor += delta; else state.dangerFor = Math.max(0,state.dangerFor - delta * 1.8);
    if (state.tension <= 5) state.slackFor += delta; else state.slackFor = Math.max(0,state.slackFor - delta * 2);
    if (state.dangerFor > .34) return loseFish('鱼线断了 · 再早一点松手');
    if (state.slackFor > .75) return loseFish('鱼脱钩了 · 张力别完全放空');
    if (state.reelProgress >= 100) return catchFish();
    const rect = ui.pond.getBoundingClientRect();
    const startX = rect.width * state.castX / rect.width;
    const targetX = rect.width * .5;
    const progress = state.reelProgress / 100;
    fish.x = (startX + (targetX - startX) * progress) / rect.width * 100;
    fish.y = Math.max(7,(state.castY * (1 - progress) + 28 * progress) / rect.height * 100);
    positionFish(fish);
    lineTo(rect.width * fish.x / 100,rect.height * fish.y / 100);
    updateHud();
  }

  function frame(now) {
    const delta = Math.min(.04,Math.max(0,(now - (state.lastFrame || now)) / 1000));
    state.lastFrame = now;
    const active = page.classList.contains('is-active') && !state.paused && ui.cover.hidden;
    if (active && ['aiming','waiting','bite','hooked'].includes(state.phase)) {
      state.remaining -= delta;
      if (state.remaining <= 0) endGame();
      else {
        updateFish(delta,now);
        if (state.phase === 'waiting' && state.target && now >= state.biteAt) {
          state.phase = 'bite'; setCallout('咬钩！现在点击！'); playTone('bite');
        }
        if (state.phase === 'bite' && now > state.biteEnds) {
          state.combo = 1; setCallout('慢了一步 · 它把饵吃完了',1100); playTone('fail'); resetCast();
        }
        if (state.phase === 'hooked') updateHooked(delta,now);
        updateHud();
      }
    }
    requestAnimationFrame(frame);
  }

  function activatePlayground() {
    if (entry.disabled) return;
    document.querySelectorAll('.page').forEach((item) => item.classList.toggle('is-active',item === page));
    document.querySelectorAll('.nav-tab').forEach((button) => button.classList.remove('is-active'));
    ui.cover.hidden = true;
    loadBest();
    if (state.phase === 'idle' || state.phase === 'result') showOverlay('start');
    window.setTimeout(() => ui.overlayAction.focus(),0);
  }

  function leavePlayground() {
    ui.cover.hidden = true;
    state.paused = true; state.reeling = false;
    const todayTab = document.querySelector('.nav-tab[data-page="today"]');
    document.querySelectorAll('.nav-tab').forEach((button) => button.classList.toggle('is-active',button === todayTab));
    document.querySelectorAll('.page').forEach((item) => item.classList.toggle('is-active',item.id === 'page-today'));
  }

  function toggleWorkCover(force) {
    const shouldShow = typeof force === 'boolean' ? force : ui.cover.hidden;
    if (shouldShow) {
      state.coverFromPlayground = page.classList.contains('is-active');
      if (state.coverFromPlayground) pauseForCover();
      ui.cover.hidden = false; ui.cover.scrollTop = 0;
    } else {
      ui.cover.hidden = true;
      if (state.coverFromPlayground) resumeFromCover();
      state.coverFromPlayground = false;
    }
  }

  let entryClosed = null;
  function syncEntryAvailability() {
    const phase = document.querySelector('#app')?.dataset.phase || 'ready';
    const closed = ['checkout','overtime','off'].includes(phase);
    entry.disabled = closed;
    entry.setAttribute('aria-disabled',String(closed));
    entry.setAttribute('aria-label',closed ? '摸鱼乐园已打烊，请立刻下班' : '进入摸鱼乐园，玩带薪钓鱼');
    ui.entryStatus.textContent = closed ? 'PAID BREAK · CLOSED' : 'PAID BREAK · 01';
    ui.entryHint.textContent = closed ? '到点打烊' : '空格键可伪装';
    ui.entryKicker.textContent = closed ? '下班时间已到' : '今日摸鱼项目';
    ui.entryTitle.textContent = closed ? '摸鱼乐园已打烊' : '摸鱼乐园';
    ui.entryDescription.textContent = closed ? '别摸鱼了。保存工作，带上自己，立刻撤离工位。' : '《带薪钓鱼》限时开放。看准、起竿、稳住鱼线，差一点就能刷新纪录。';
    ui.entryAction.textContent = closed ? '禁止摸鱼' : '开始摸鱼';
    if (closed && entryClosed === false && page.classList.contains('is-active')) {
      leavePlayground();
      if (typeof showToast === 'function') showToast('摸鱼乐园已打烊','下班时间到了。别再钓了，保存工作，立刻撤离工位。');
    }
    entryClosed = closed;
  }

  entry.addEventListener('click',activatePlayground);
  ui.back.addEventListener('click',leavePlayground);
  ui.docButton.addEventListener('click',() => toggleWorkCover(true));
  ui.coverReturn.addEventListener('click',() => toggleWorkCover(false));
  ui.overlayAction.addEventListener('click',() => {
    if (state.overlayMode === 'pause') resumeGame(); else startGame();
  });

  ui.pond.addEventListener('pointermove',(event) => {
    if (state.phase !== 'aiming' || state.paused) return;
    const rect = ui.pond.getBoundingClientRect();
    const x = Math.max(0,Math.min(rect.width,event.clientX - rect.left));
    const y = Math.max(rect.height * .28,Math.min(rect.height - 50,event.clientY - rect.top));
    ui.marker.hidden = false; ui.marker.style.left = `${x}px`; ui.marker.style.top = `${y}px`;
  });
  ui.pond.addEventListener('pointerleave',() => { if (state.phase === 'aiming') ui.marker.hidden = true; });
  ui.pond.addEventListener('pointerdown',(event) => {
    if (event.button !== 0 || state.paused || !ui.overlay.hidden) return;
    event.preventDefault();
    const rect = ui.pond.getBoundingClientRect();
    if (state.phase === 'aiming') return castAt(event.clientX - rect.left,event.clientY - rect.top);
    if (state.phase === 'bite') return hookFish();
    if (state.phase === 'hooked') { state.reeling = true; ui.pond.setPointerCapture?.(event.pointerId); updateHud(); }
  });
  const stopReeling = () => { if (state.phase === 'hooked') { state.reeling = false; updateHud(); } };
  ui.pond.addEventListener('pointerup',stopReeling); ui.pond.addEventListener('pointercancel',stopReeling);

  document.addEventListener('keydown',(event) => {
    if (event.code === 'Space' && !event.repeat) { event.preventDefault(); toggleWorkCover(); return; }
    if (event.key === 'Escape' && !ui.cover.hidden) { event.preventDefault(); toggleWorkCover(false); return; }
    if (event.key === 'Escape' && page.classList.contains('is-active')) { event.preventDefault(); leavePlayground(); }
  });
  document.querySelectorAll('.nav-tab').forEach((button) => button.addEventListener('click',() => {
    if (!page.classList.contains('is-active')) return;
    ui.cover.hidden = true; state.coverFromPlayground = false; state.paused = true; state.reeling = false;
  }));

  const appShell = document.querySelector('#app');
  new MutationObserver(syncEntryAvailability).observe(appShell,{ attributes:true, attributeFilter:['data-phase','data-state'] });

  syncEntryAvailability(); loadBest(); updateHud(); renderCatches(); requestAnimationFrame(frame);
})();
