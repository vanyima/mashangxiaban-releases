(() => {
  'use strict';

  const body = document.body;
  const pet = document.getElementById('pet');
  const stageEl = document.getElementById('pet-stage');
  const speechBubble = document.getElementById('speech-bubble');
  const speechCopy = document.getElementById('speech-copy');
  const actionMark = document.getElementById('action-mark');
  const helpChip = document.getElementById('help-chip');
  const spriteCanvas = document.getElementById('pet-sprite');
  const spriteContext = spriteCanvas.getContext('2d', { alpha: true, willReadFrequently: true });
  const bridge = window.petDesktop || {};
  const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STAGES = {
    ready: { pose: 'neutral', action: 'idle' },
    early: { pose: 'neutral', action: 'working' },
    working: { pose: 'neutral', action: 'working' },
    mid: { pose: 'cookie', action: 'working' },
    tired: { pose: 'exhausted', action: 'tired' },
    late: { pose: 'exhausted', action: 'tired' },
    near: { pose: 'happy', action: 'pack' },
    checkout: { pose: 'running', action: 'run' },
    overtime: { pose: 'collapsed', action: 'collapse' },
    off: { pose: 'happy', action: 'celebrate' }
  };

  const STAGE_ALIASES = {
    waiting: 'ready', unclocked: 'ready', prework: 'ready',
    morning: 'early', focus: 'working', normal: 'working', steady: 'working', afternoon: 'mid',
    exhausted: 'tired', weary: 'tired', closing: 'near', leaving: 'checkout', due: 'checkout',
    overtime1: 'overtime', overtime2: 'overtime', overtime3: 'overtime', overtime4: 'overtime',
    done: 'off', checkedout: 'off'
  };

  const FALLBACK_COPY = {
    ready: ['我先在这儿等你，别急着把灵魂交给工位。', '开工前喝口水。身体上线了，脑子可以慢一点。'],
    early: ['刚开工也要喝水，别等嘴巴报警。', '肩膀放下来。工作不是靠耸肩完成的。', '看远处二十秒，屏幕不会趁机跑路。'],
    working: ['喝两口水吧，我替你盯着进度。', '站起来走一小圈，回来再和需求讲道理。', '眨眨眼，看看窗外，让眼睛也下个早班。'],
    mid: ['先吃点东西。空腹硬撑不算敬业。', '坐太久啦，起来活动两分钟。', '累了就歇一会儿，你不是永动机。'],
    tired: ['今天已经很努力了，肩颈也该被照顾一下。', '喝水、伸腰、深呼吸。先把自己捞回来。', '如果脑子开始转圈，休息五分钟比硬熬更快。'],
    near: ['快到点了，先保存，再收尾，别开新坑。', '开始整理桌面吧，自由正在门口探头。', '剩下的交给明天，今晚先还给自己。'],
    checkout: ['到点了。慢慢收好东西，回家吧。', '辛苦了，今天的你已经交付完成。', '下班通道已开启，请带上水杯和灵魂有序撤离。'],
    overtime: ['先温柔提醒：该下班了。', '你不走，老板会误以为这叫正常产能。', '工位不会孤单，真的。现在。立刻。回家。', '还在加班？需求有九条命，你只有一条。', '警告：继续坐着，马歇歇将启动阴阳怪气无限续杯。'],
    off: ['下班成功。今晚别再偷偷打开工作消息。', '自由到账，先吃饭，再做一个完整的人。', '回去好好休息，明天的事让明天的马操心。'],
    health_low: ['马生健康有点低。你和我都先休息一下。', '今天别硬撑，身体的提醒比红点重要。'],
    health_zero: ['今日离线。你也休息一会儿，好吗？', '马生电量归零，拒绝用意志力强行开机。'],
    hydration: ['整点补水，喝两口再继续。', '水杯该上班了，喝口水吧。', '别只给电脑散热，你也喝点水。', '保存文件，顺手喝口水。'],
    tap: ['摸到了。记得也照顾一下自己。', '收到一份摸摸，回赠你一次伸懒腰。', '这一摸算带薪安抚，我收下了。', '手感不错吧？记得顺便放松手腕。', '摸摸有效，今日马生健康 +0，但心情 +1。'],
    double: ['隐藏动作解锁：短暂快乐！', '蹦完了。你也转转肩膀？', '双击确认：你现在确实没有在认真上班。', '快乐弹射一次，不能报销。', '再来一次，我就当你在做交互测试。'],
    rapid: ['嚯！鼠标有急事可以先走。', '吓我一跳。你也慢一点，别着急。', '刚才什么东西飞过去了？是你的耐心吗？', '慢点划，我的马眼不支持高刷。', '你再闪现一次，我就申请工伤。'],
    circle: ['天旋地转……你赢了。', '别画了，马生已经出现加载圈。', '你画的是圈，我看到的是眩晕 KPI。', '方向感已离职，请稍后再试。', '再绕一圈，我就把你鼠标拴在工位上。'],
    annoyed: ['摸摸可以，连点不算按摩。', '刷新按钮不在我脸上。', '点够了吗？没够我先替你生气。', '这是桌宠，不是年会抽奖按钮。', '再点，我就把你的待办也连击五遍。', '手速挺快，下班按钮怎么没见你这么积极？', '已进入不耐烦模式：请把手从马脸上移开。']
  };

  const HINTS = window.PET_DISCOVERY_HINTS || [
    '靠近我，眼睛和头会跟着鼠标看。',
    '点一下是摸摸，双击会触发稀有动作。',
    '在我身边画一圈试试，但别把我转晕。',
    '快速划过会吓我一跳，慢一点嘛。',
    '按住再拖，可以把我挪到喜欢的位置。',
    '右键打开菜单，可以关闭桌宠。'
  ];

  const state = {
    stage: 'ready',
    copyStage: 'ready',
    pose: 'neutral',
    healthScore: 100,
    healthLevel: 0,
    reducedMotion: mediaReduced.matches,
    interactionLevel: 'standard',
    lastCopy: new Map(),
    speechTimer: 0,
    ambientTimer: 0,
    watchingTimer: 0,
    reactTimer: 0,
    clickTimer: 0,
    clickCount: 0,
    hintIndex: 0,
    pointerDown: null,
    dragging: false,
    recentMoves: [],
    circleAngle: 0,
    circleLastAngle: null,
    circleLastAt: 0,
    lastRapidAt: 0,
    lastHealthAnnounceAt: 0,
    shiftId: null,
    workedMinutes: 0,
    lastHydrationHour: 0,
    packingComplete: false,
    collapseComplete: false,
    walking: false,
    walkKind: null,
    walkDirection: 'right',
    ignoringMouse: null
  };

  const ANIMATIONS = {
    idle: { row: 0, durations: [280, 110, 110, 140, 140, 320] },
    walkingRight: { external: 'walkRightStrip', durations: [190, 190, 190, 190, 190, 190, 190, 190] },
    walkingLeft: { external: 'walkLeftStrip', durations: [190, 190, 190, 190, 190, 190, 190, 190] },
    waving: { row: 3, durations: [140, 140, 140, 280] },
    jumping: { row: 4, durations: [140, 140, 140, 140, 280] },
    failed: { row: 5, durations: [140, 140, 140, 140, 140, 140, 140, 240] },
    waiting: { row: 6, durations: [150, 150, 150, 150, 150, 260] },
    running: { row: 7, durations: [120, 120, 120, 120, 120, 220] },
    review: { row: 8, durations: [150, 150, 150, 150, 150, 280] },
    packing: { external: 'packing', durations: [260, 230, 230, 230, 260, 280, 340, 900] },
    workingLaptop: { external: 'workingLaptop', durations: [240, 140, 140, 180, 220, 300, 420, 260] },
    lunch: { external: 'lunch', durations: [420, 380, 280, 300, 520, 300, 620, 900] },
    angry: { external: 'angry', durations: [220, 150, 170, 150, 190, 260, 210, 260] },
    collapse: { external: 'collapse', durations: [260, 220, 220, 230, 240, 250, 300, 1000] }
  };
  const STAGE_ANIMATION = { ready: 'waiting', early: 'workingLaptop', working: 'workingLaptop', mid: 'workingLaptop', tired: 'workingLaptop', checkout: 'jumping', overtime: 'failed', off: 'waving' };
  const spriteImage = new Image();
  const packingFrames = Array.from({ length: 8 }, (_, index) => {
    const image = new Image();
    image.src = `mascot/ma-xiexie-packing-v2/${String(index).padStart(2, '0')}.png`;
    return image;
  });
  const workingFrames = Array.from({ length: 8 }, (_, index) => {
    const image = new Image();
    image.src = `mascot/ma-xiexie-working-v2/${String(index).padStart(2, '0')}.png`;
    return image;
  });
  const externalFrames = (folder) => Array.from({ length: 8 }, (_, index) => {
    const image = new Image();
    image.src = `mascot/${folder}/${String(index).padStart(2, '0')}.png`;
    return image;
  });
  const angryFrames = externalFrames('ma-xiexie-angry-v2');
  const collapseFrames = externalFrames('ma-xiexie-collapse-v2');
  const lunchFrames = externalFrames('ma-xiexie-lunch-v2');
  const workingGazeFrames = externalFrames('ma-xiexie-working-gaze-v2');
  const packedGazeFrames = externalFrames('ma-xiexie-packed-gaze-v2');
  const tiredGazeFrames = externalFrames('ma-xiexie-tired-gaze-v2');
  const angryGazeFrames = externalFrames('ma-xiexie-angry-gaze-v2');
  const walkRightStrip = new Image();
  const walkLeftStrip = new Image();
  const frontGlareImage = new Image();
  walkRightStrip.src = 'mascot/ma-xiexie-walk-right-strip-v1.png';
  walkLeftStrip.src = 'mascot/ma-xiexie-walk-left-strip-v1.png';
  frontGlareImage.src = 'mascot/ma-xiexie-front-glare-v1.png';
  let spriteReady = false;
  let packingReady = false;
  let workingReady = false;
  let angryReady = false;
  let collapseReady = false;
  let lunchReady = false;
  let workingGazeReady = false;
  let packedGazeReady = false;
  let tiredGazeReady = false;
  let angryGazeReady = false;
  let walkRightReady = false;
  let walkLeftReady = false;
  let frontGlareReady = false;
  let motionTimer = 0;
  let motionToken = 0;
  let currentMotion = { name: 'idle', frame: 0, loop: false, resting: false };

  function drawSprite(row, frame) {
    if (!spriteReady) return;
    spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
    spriteContext.drawImage(spriteImage, frame * 192, row * 208, 192, 208, 0, 0, spriteCanvas.width, spriteCanvas.height);
  }

  function drawMotionFrame(name, motion, frame) {
    if (motion.external === 'walkRightStrip' || motion.external === 'walkLeftStrip') {
      const strip = motion.external === 'walkLeftStrip' ? walkLeftStrip : walkRightStrip;
      const ready = motion.external === 'walkLeftStrip' ? walkLeftReady : walkRightReady;
      if (!ready) return drawSprite(motion.external === 'walkLeftStrip' ? 2 : 1, frame);
      const sourceWidth = strip.naturalWidth / 8;
      const sourceTop = Math.round(strip.naturalHeight * .276);
      const sourceHeight = Math.round(strip.naturalHeight * .442);
      const stepScale = frame >= 4 ? 1.055 : 1;
      const targetWidth = spriteCanvas.width * stepScale;
      const targetHeight = spriteCanvas.height * stepScale;
      const targetLeft = (spriteCanvas.width - targetWidth) / 2;
      const targetTop = spriteCanvas.height - targetHeight;
      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.drawImage(strip, frame * sourceWidth, sourceTop, sourceWidth, sourceHeight, targetLeft, targetTop, targetWidth, targetHeight);
      return;
    }
    if (motion.external === 'packing') {
      if (!packingReady) return drawSprite(ANIMATIONS.waiting.row, 0);
      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.drawImage(packingFrames[frame], 0, 0, 192, 208, 0, 0, spriteCanvas.width, spriteCanvas.height);
      return;
    }
    if (motion.external === 'workingLaptop') {
      if (!workingReady) return drawSprite(ANIMATIONS.running.row, frame % ANIMATIONS.running.durations.length);
      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.drawImage(workingFrames[frame], 0, 0, 192, 208, 0, 0, spriteCanvas.width, spriteCanvas.height);
      return;
    }
    const set = motion.external === 'angry' ? angryFrames
      : motion.external === 'collapse' ? collapseFrames
        : motion.external === 'lunch' ? lunchFrames : null;
    const ready = motion.external === 'angry' ? angryReady
      : motion.external === 'collapse' ? collapseReady
        : motion.external === 'lunch' ? lunchReady : false;
    if (set) {
      if (!ready) return drawSprite(ANIMATIONS.failed.row, frame % ANIMATIONS.failed.durations.length);
      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.drawImage(set[frame], 0, 0, 192, 208, 0, 0, spriteCanvas.width, spriteCanvas.height);
      return;
    }
    drawSprite(motion.row, frame);
  }

  function drawFrontGlare() {
    if (!frontGlareReady) {
      if (angryReady) return drawMotionFrame('angry', ANIMATIONS.angry, 0);
      return drawSprite(0, 0);
    }
    // Crop only transparent padding, preserve the generated pose's proportions,
    // and align the shoes with the same baseline as the walking frames.
    const source = { x: 340, y: 40, width: 532, height: 1190 };
    const scale = Math.min(spriteCanvas.width / source.width, spriteCanvas.height / source.height);
    const targetWidth = source.width * scale;
    const targetHeight = source.height * scale;
    const targetLeft = (spriteCanvas.width - targetWidth) / 2;
    const targetTop = spriteCanvas.height - targetHeight;
    spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
    spriteContext.drawImage(frontGlareImage, source.x, source.y, source.width, source.height, targetLeft, targetTop, targetWidth, targetHeight);
  }

  function motionSpeed() {
    return [1, 1.08, 1.2, 1.38, 1.6, 1][state.healthLevel] || 1;
  }

  function playMotion(name, { loop = false, resume = true, restRange = null } = {}) {
    const motion = ANIMATIONS[name] || ANIMATIONS.idle;
    clearTimeout(motionTimer);
    const token = ++motionToken;
    currentMotion = { name, frame: 0, loop, resting: false };
    const advance = () => {
      if (token !== motionToken || !spriteReady) return;
      drawMotionFrame(name, motion, currentMotion.frame);
      if (state.reducedMotion || state.healthLevel >= 5) {
        currentMotion.resting = true;
        return;
      }
      const delay = motion.durations[currentMotion.frame] * motionSpeed();
      motionTimer = window.setTimeout(() => {
        if (token !== motionToken) return;
        const last = currentMotion.frame >= motion.durations.length - 1;
        if (last && !loop) {
          if (name === 'packing') state.packingComplete = true;
          if (name === 'collapse') state.collapseComplete = true;
          if (Array.isArray(restRange)) {
            currentMotion.resting = true;
            const minimum = Math.max(0, Number(restRange[0]) || 0);
            const maximum = Math.max(minimum, Number(restRange[1]) || minimum);
            motionTimer = window.setTimeout(() => {
              if (token === motionToken) resumeStageMotion();
            }, minimum + Math.random() * (maximum - minimum));
            return;
          }
          if (resume) resumeStageMotion();
          return;
        }
        currentMotion.frame = last ? 0 : currentMotion.frame + 1;
        advance();
      }, delay);
    };
    advance();
  }

  function stageRestRange(name) {
    if (name === 'angry') return [10000, 22000];
    if (name === 'failed') return [16000, 32000];
    if (state.stage === 'ready') return [12000, 28000];
    if (['early', 'working', 'mid'].includes(state.stage)) return [15000, 35000];
    if (state.stage === 'tired') return [22000, 45000];
    if (state.stage === 'checkout') return [8000, 18000];
    if (state.stage === 'off') return [18000, 40000];
    return [14000, 30000];
  }

  function playStageCadence(name) {
    playMotion(name, { loop: false, resume: false, restRange: stageRestRange(name) });
  }

  function resumeStageMotion() {
    if (!spriteReady || state.walking || pet.classList.contains('is-watching')) return;
    if (state.stage === 'near' && packingReady) {
      if (state.packingComplete || state.reducedMotion) {
        state.packingComplete = true;
        ++motionToken;
        clearTimeout(motionTimer);
        drawMotionFrame('packing', ANIMATIONS.packing, 7);
      } else {
        playMotion('packing', { loop: false, resume: false });
      }
      return;
    }
    if (state.stage === 'overtime') {
      if (state.copyStage === 'overtime4' && collapseReady) {
        if (state.collapseComplete || state.reducedMotion) {
          state.collapseComplete = true;
          ++motionToken;
          clearTimeout(motionTimer);
          drawMotionFrame('collapse', ANIMATIONS.collapse, 7);
        } else {
          playMotion('collapse', { loop: false, resume: false });
        }
        return;
      }
      if (['overtime2', 'overtime3'].includes(state.copyStage) && angryReady) {
        playStageCadence('angry');
        return;
      }
      playStageCadence('failed');
      return;
    }
    const name = state.healthLevel >= 4 ? 'failed' : (STAGE_ANIMATION[state.stage] || 'idle');
    playStageCadence(name);
  }

  function playLunch(text) {
    if (text) showSpeech(text, { force: true, duration: 7200 });
    if (!lunchReady) return false;
    playMotion('lunch', { loop: false, resume: true });
    return true;
  }

  function setWalkDirection(direction) {
    if (!state.walking) return false;
    const next = direction === 'left' ? 'left' : 'right';
    state.walkDirection = next;
    clearTimeout(state.speechTimer);
    speechBubble.hidden = true;
    ++motionToken;
    clearTimeout(motionTimer);
    currentMotion = { name: next === 'left' ? 'walkingLeft' : 'walkingRight', frame: 0, loop: true, resting: false };
    drawMotionFrame(currentMotion.name, ANIMATIONS[currentMotion.name], 0);
    return true;
  }

  function showWalkStep(frame) {
    if (!state.walking) return false;
    const motionName = state.walkDirection === 'left' ? 'walkingLeft' : 'walkingRight';
    const motion = ANIMATIONS[motionName];
    const nextFrame = clamp(Math.round(finiteNumber(frame, 0)), 0, motion.durations.length - 1);
    ++motionToken;
    clearTimeout(motionTimer);
    currentMotion = { name: motionName, frame: nextFrame, loop: true, resting: false };
    drawMotionFrame(motionName, motion, nextFrame);
    return true;
  }

  function startReminderWalk(payload = {}) {
    state.walking = true;
    state.walkKind = payload.kind || 'reminder';
    body.dataset.walkMode = payload.mode || 'cross-screen';
    body.classList.add('is-walking');
    pet.classList.remove('is-watching');
    clearTimeout(state.watchingTimer);
    clearTimeout(state.speechTimer);
    speechBubble.hidden = true;
    setWalkDirection(payload.direction);
  }

  function lookAtUserWhileWalking(payload = {}) {
    if (!state.walking) return;
    ++motionToken;
    clearTimeout(motionTimer);
    currentMotion = { name: 'front-glare', frame: 0, loop: false, resting: true };
    drawFrontGlare();
    if (payload.text) showSpeech(payload.text, { force: true, duration: 1450 });
    pet.classList.add('is-looking-at-user');
    window.setTimeout(() => pet.classList.remove('is-looking-at-user'), 980);
  }

  function stopReminderWalk(payload = {}) {
    const completedKind = payload.kind || state.walkKind;
    state.walking = false;
    state.walkKind = null;
    body.classList.remove('is-walking');
    pet.classList.remove('is-looking-at-user');
    delete body.dataset.walkMode;
    document.documentElement.style.setProperty('--walk-depth-scale', '1');
    if (completedKind === 'lunch' && payload.reason === 'complete') playLunch();
    else resumeStageMotion();
  }

  function setWalkDepth(value) {
    const scale = clamp(finiteNumber(value, 1), .78, 1);
    document.documentElement.style.setProperty('--walk-depth-scale', String(scale));
    return scale;
  }

  function showLookDirection(x, y) {
    const degrees = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
    let gazeFrames = null;
    let gazeName = 'look';
    if (['early', 'working', 'mid', 'tired'].includes(state.stage) && workingGazeReady) {
      gazeFrames = workingGazeFrames; gazeName = 'look-working';
    } else if (state.stage === 'near' && packedGazeReady) {
      gazeFrames = packedGazeFrames; gazeName = 'look-packed';
    } else if (state.stage === 'overtime' && ['overtime2', 'overtime3'].includes(state.copyStage) && angryGazeReady) {
      gazeFrames = angryGazeFrames; gazeName = 'look-angry';
    } else if ((state.stage === 'overtime' || state.healthLevel >= 3) && tiredGazeReady) {
      gazeFrames = tiredGazeFrames; gazeName = 'look-tired';
    }
    if (gazeFrames) {
      const direction = Math.round(degrees / 45) % 8;
      ++motionToken;
      clearTimeout(motionTimer);
      currentMotion = { name: gazeName, frame: direction, loop: false };
      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.drawImage(gazeFrames[direction], 0, 0, 192, 208, 0, 0, spriteCanvas.width, spriteCanvas.height);
      return;
    }
    const direction = Math.round(degrees / 22.5) % 16;
    ++motionToken;
    clearTimeout(motionTimer);
    currentMotion = { name: 'look', frame: direction, loop: false };
    drawSprite(direction < 8 ? 9 : 10, direction < 8 ? direction : direction - 8);
  }

  spriteImage.addEventListener('load', () => {
    spriteReady = true;
    resumeStageMotion();
  }, { once: true });
  spriteImage.src = 'mascot/ma-xiexie-animated-v2.webp';
  Promise.all(packingFrames.map((image) => new Promise((resolve) => {
    if (image.complete && image.naturalWidth) resolve();
    else image.addEventListener('load', resolve, { once: true });
  }))).then(() => {
    packingReady = true;
    if (state.stage === 'near') resumeStageMotion();
  });
  Promise.all(workingFrames.map((image) => new Promise((resolve) => {
    if (image.complete && image.naturalWidth) resolve();
    else image.addEventListener('load', resolve, { once: true });
  }))).then(() => {
    workingReady = true;
    if (['early', 'working', 'mid', 'tired'].includes(state.stage)) resumeStageMotion();
  });
  function whenFramesReady(frames, callback) {
    Promise.all(frames.map((image) => new Promise((resolve) => {
      if (image.complete && image.naturalWidth) resolve();
      else image.addEventListener('load', resolve, { once: true });
    }))).then(callback);
  }
  whenFramesReady(angryFrames, () => { angryReady = true; if (state.stage === 'overtime') resumeStageMotion(); });
  whenFramesReady(collapseFrames, () => { collapseReady = true; if (state.stage === 'overtime') resumeStageMotion(); });
  whenFramesReady(lunchFrames, () => { lunchReady = true; });
  whenFramesReady(workingGazeFrames, () => { workingGazeReady = true; });
  whenFramesReady(packedGazeFrames, () => { packedGazeReady = true; });
  whenFramesReady(tiredGazeFrames, () => { tiredGazeReady = true; });
  whenFramesReady(angryGazeFrames, () => { angryGazeReady = true; });
  const whenImageReady = (image, callback) => {
    if (image.complete && image.naturalWidth) callback();
    else image.addEventListener('load', callback, { once: true });
  };
  whenImageReady(walkRightStrip, () => { walkRightReady = true; });
  whenImageReady(walkLeftStrip, () => { walkLeftReady = true; });
  whenImageReady(frontGlareImage, () => { frontGlareReady = true; });

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeStage(value) {
    const key = String(value || 'ready').toLowerCase().replace(/[\s_-]+/g, '');
    if (STAGES[key]) return key;
    return STAGE_ALIASES[key] || 'ready';
  }

  function normalizeCopyStage(value) {
    const key = String(value || 'ready').toLowerCase().replace(/[\s_-]+/g, '');
    const supported = ['ready', 'early', 'steady', 'tired', 'weary', 'near', 'checkout', 'overtime1', 'overtime2', 'overtime3', 'overtime4', 'off'];
    return supported.includes(key) ? key : normalizeStage(key);
  }

  function healthLevelFrom(payload) {
    const explicit = Number(payload.healthLevel ?? payload.healthIndex);
    if (Number.isFinite(explicit)) return clamp(Math.round(explicit), 0, 5);
    const score = clamp(finiteNumber(payload.healthScore, state.healthScore), 0, 100);
    if (score <= 0) return 5;
    if (score <= 20) return 4;
    if (score <= 40) return 3;
    if (score <= 60) return 2;
    if (score <= 80) return 1;
    return 0;
  }

  function choosePose(stage, healthLevel) {
    if (healthLevel >= 5) return 'collapsed';
    if (healthLevel >= 4) return 'collapsed';
    if (healthLevel >= 3 && !['checkout', 'off'].includes(stage)) return 'exhausted';
    if (healthLevel >= 2 && ['ready', 'early', 'working'].includes(stage)) return 'cookie';
    return STAGES[stage]?.pose || 'neutral';
  }

  function setState(payload = {}) {
    if (!payload || typeof payload !== 'object') return;
    const displayScale = Number(payload.displayScale);
    if (Number.isFinite(displayScale) && displayScale > 0) document.documentElement.style.setProperty('--pet-scale', String(displayScale));
    const sourceStage = payload.stage ?? payload.state ?? state.copyStage;
    const nextStage = normalizeStage(sourceStage);
    const score = clamp(finiteNumber(payload.healthScore, state.healthScore), 0, 100);
    const level = healthLevelFrom({ ...payload, healthScore: score });
    const previousHealthLevel = state.healthLevel;
    const nextShiftId = payload.shiftId || null;
    const workedMinutes = Math.max(0, finiteNumber(payload.workedMinutes, 0));
    if (nextShiftId !== state.shiftId) {
      state.shiftId = nextShiftId;
      state.lastHydrationHour = Math.floor(workedMinutes / 60);
    }
    state.workedMinutes = workedMinutes;
    if (nextStage !== state.stage || sourceStage !== state.copyStage) {
      state.packingComplete = false;
      state.collapseComplete = false;
    }
    state.stage = nextStage;
    state.copyStage = normalizeCopyStage(sourceStage);
    state.healthScore = score;
    state.healthLevel = level;
    state.pose = choosePose(nextStage, level);
    state.reducedMotion = Boolean(payload.reducedMotion ?? state.reducedMotion ?? mediaReduced.matches);
    state.interactionLevel = payload.interactionLevel || payload.intensity || state.interactionLevel;

    body.dataset.stage = nextStage;
    body.dataset.pose = state.pose;
    body.dataset.healthLevel = String(level);
    body.dataset.healthScore = String(Math.round(score));
    body.classList.toggle('is-reduced-motion', state.reducedMotion);
    pet.setAttribute('aria-label', accessibilityLabel());
    resumeStageMotion();

    const healthChanged = level !== previousHealthLevel;
    const announceReady = Date.now() - state.lastHealthAnnounceAt > 20 * 60 * 1000;
    if (level >= 5 && (healthChanged || announceReady)) {
      state.lastHealthAnnounceAt = Date.now();
      showSpeech(pickCopy('health_zero'), { duration: 5200, force: true });
    } else if (level >= 4 && payload.announceHealth !== false && (healthChanged || announceReady)) {
      state.lastHealthAnnounceAt = Date.now();
      showSpeech(pickCopy('health_low'), { duration: 4400 });
    }
    maybeShowHydrationReminder();
  }

  function maybeShowHydrationReminder() {
    const activeStages = ['early', 'working', 'mid', 'tired', 'near', 'overtime'];
    const completedHours = Math.floor(state.workedMinutes / 60);
    if (!state.shiftId || !activeStages.includes(state.stage) || state.healthLevel >= 5 || state.interactionLevel === 'quiet') return false;
    if (completedHours < 1 || completedHours <= state.lastHydrationHour || !speechBubble.hidden) return false;
    state.lastHydrationHour = completedHours;
    showSpeech(pickCopy('hydration'), { duration: 5200 });
    return true;
  }

  function accessibilityLabel() {
    const stageNames = { ready: '等待上班', early: '刚刚上班', working: '工作中', mid: '工作一段时间', tired: '有些疲惫', near: '准备下班', checkout: '催你下班', overtime: '正在加班', off: '已经下班' };
    if (state.healthLevel >= 5) return '马歇歇今日离线休息。右键可以关闭桌宠。';
    return `马歇歇，${stageNames[state.stage] || '陪伴中'}，马生健康 ${Math.round(state.healthScore)}。点击互动，拖动可以移动，右键打开菜单。`;
  }

  function banksFor(key) {
    if (key === 'health_low' || key === 'health_zero' || key === 'health') {
      const healthBank = window.PET_HEALTH_COPY_BANKS?.[state.healthLevel];
      if (Array.isArray(healthBank) && healthBank.length) return healthBank;
    }
    const external = window.PET_COPY_BANKS;
    if (external && typeof external === 'object') {
      const copyKey = key === state.stage ? state.copyStage : key;
      const direct = external[copyKey] || external[key];
      if (Array.isArray(direct) && direct.length) return direct;
      const stageBank = external.stages?.[copyKey] || external.copy?.[copyKey] || external.stages?.[key] || external.copy?.[key];
      if (Array.isArray(stageBank) && stageBank.length) return stageBank;
      if (stageBank && Array.isArray(stageBank.lines)) return stageBank.lines;
    }
    return FALLBACK_COPY[key] || FALLBACK_COPY[state.stage] || FALLBACK_COPY.working;
  }

  function pickCopy(key = state.stage) {
    const bank = banksFor(key).filter((line) => typeof line === 'string' && line.trim());
    if (!bank.length) return '';
    const previous = state.lastCopy.get(key);
    const candidates = bank.length > 1 ? bank.filter((line) => line !== previous) : bank;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || bank[0];
    state.lastCopy.set(key, chosen);
    return chosen;
  }

  function showSpeech(text, options = {}) {
    const copy = String(text || '').trim();
    if (!copy) return;
    if (state.interactionLevel === 'quiet' && !options.force) return;
    clearTimeout(state.speechTimer);
    speechCopy.textContent = copy;
    speechBubble.hidden = false;
    speechBubble.style.animation = 'none';
    requestAnimationFrame(() => { speechBubble.style.animation = ''; });
    state.speechTimer = window.setTimeout(() => { speechBubble.hidden = true; }, options.duration || 3800);
  }

  function showMark(mark) {
    actionMark.textContent = mark;
    actionMark.classList.remove('is-visible');
    void actionMark.offsetWidth;
    actionMark.classList.add('is-visible');
  }

  function react(name, copyKey, mark) {
    if (state.healthLevel >= 5) {
      showSpeech(pickCopy('health_zero'), { force: true });
      return;
    }
    const motions = { tap: 'waving', double: 'jumping', startle: 'failed', dizzy: 'jumping', annoyed: 'failed' };
    playMotion(motions[name] || 'waving', { loop: false, resume: true });
    if (mark) showMark(mark);
    if (copyKey) showSpeech(pickCopy(copyKey));
  }

  function scheduleAmbient() {
    clearTimeout(state.ambientTimer);
    if (state.interactionLevel === 'quiet') return;
    const noisy = state.interactionLevel === 'lively' || state.interactionLevel === 'active';
    const delay = (noisy ? 24 : 42) * 1000 + Math.random() * (noisy ? 22 : 34) * 1000;
    state.ambientTimer = window.setTimeout(() => {
      const key = state.healthLevel >= 4 ? 'health_low' : state.copyStage;
      showSpeech(pickCopy(key));
      scheduleAmbient();
    }, delay);
  }

  function updateGaze(event) {
    if (state.healthLevel >= 5 || state.dragging || state.walking) return;
    const rect = pet.getBoundingClientRect();
    const cx = rect.left + rect.width * .52;
    const cy = rect.top + rect.height * .42;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    const range = 245;
    if (distance > range) {
      pet.classList.remove('is-watching');
      resumeStageMotion();
      return;
    }
    const strength = 1 - clamp((distance - 30) / range, 0, .74);
    showLookDirection(dx * strength, dy * strength);
    pet.classList.add('is-watching');
    clearTimeout(state.watchingTimer);
    state.watchingTimer = window.setTimeout(() => {
      pet.classList.remove('is-watching');
      resumeStageMotion();
    }, 520);
  }

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function pointHitsPetArt(x, y) {
    const rect = pet.getBoundingClientRect();
    const scaleX = rect.width / 288;
    const scaleY = rect.height / 268;
    const artLeft = rect.left + 52 * scaleX;
    const artTop = rect.bottom - 204 * scaleY;
    const artWidth = 184 * scaleX;
    const artHeight = 200 * scaleY;
    const localX = x - artLeft;
    const localY = y - artTop;
    if (localX < 0 || localY < 0 || localX >= artWidth || localY >= artHeight) return false;
    if (!spriteReady || !spriteContext) {
      const nx = (localX - artWidth / 2) / (artWidth * .48);
      const ny = (localY - artHeight / 2) / (artHeight * .49);
      return nx * nx + ny * ny <= 1;
    }
    const sourceX = Math.min(spriteCanvas.width - 1, Math.max(0, Math.floor(localX / artWidth * spriteCanvas.width)));
    const sourceY = Math.min(spriteCanvas.height - 1, Math.max(0, Math.floor(localY / artHeight * spriteCanvas.height)));
    return spriteContext.getImageData(sourceX, sourceY, 1, 1).data[3] > 28;
  }

  function pointIsInteractive(x, y) {
    if (state.dragging || state.pointerDown) return true;
    const helpRect = helpChip.getBoundingClientRect();
    const helpApproachRect = {
      left: helpRect.left - 24,
      right: helpRect.right + 24,
      top: helpRect.top - 20,
      bottom: helpRect.bottom + 16
    };
    if (pointInRect(x, y, helpApproachRect)) return true;
    if (!speechBubble.hidden && pointInRect(x, y, speechBubble.getBoundingClientRect())) return true;
    return pointHitsPetArt(x, y);
  }

  function setMousePassthrough(ignore) {
    if (!bridge.setIgnoreMouseEvents || state.ignoringMouse === ignore) return;
    state.ignoringMouse = ignore;
    bridge.markPointerActivity?.(!ignore);
    Promise.resolve(bridge.setIgnoreMouseEvents(ignore, { forward: true })).catch(() => {
      state.ignoringMouse = null;
    });
  }

  function updateMousePassthrough(event) {
    setMousePassthrough(!pointIsInteractive(event.clientX, event.clientY));
  }

  function detectRapid(event, now) {
    state.recentMoves.push({ x: event.clientX, y: event.clientY, t: now });
    while (state.recentMoves.length && now - state.recentMoves[0].t > 110) state.recentMoves.shift();
    if (state.recentMoves.length < 2 || now - state.lastRapidAt < 2600) return;
    const first = state.recentMoves[0];
    const distance = Math.hypot(event.clientX - first.x, event.clientY - first.y);
    if (distance > 125 && pet.matches(':hover')) {
      state.lastRapidAt = now;
      react('startle', 'rapid', '!');
    }
  }

  function detectCircle(event, now) {
    const rect = pet.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.hypot(event.clientX - cx, event.clientY - cy);
    if (radius < 45 || radius > 185 || now - state.circleLastAt > 220) {
      state.circleAngle = 0;
      state.circleLastAngle = null;
    }
    const angle = Math.atan2(event.clientY - cy, event.clientX - cx);
    if (state.circleLastAngle !== null) {
      let delta = angle - state.circleLastAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      if (Math.abs(delta) < .85) state.circleAngle += delta;
      else state.circleAngle = 0;
      if (Math.abs(state.circleAngle) > Math.PI * 1.75) {
        state.circleAngle = 0;
        react('dizzy', 'circle', '✦');
      }
    }
    state.circleLastAngle = angle;
    state.circleLastAt = now;
  }

  function pointerMove(event) {
    const now = performance.now();
    updateMousePassthrough(event);
    updateGaze(event);
    detectRapid(event, now);
    detectCircle(event, now);

    if (!state.pointerDown) return;
    const moved = Math.hypot(event.screenX - state.pointerDown.x, event.screenY - state.pointerDown.y);
    if (!state.dragging && moved > 7) {
      state.dragging = true;
      pet.classList.add('is-dragging');
      pet.setPointerCapture?.(event.pointerId);
      bridge.startDrag?.({ screenX: state.pointerDown.x, screenY: state.pointerDown.y });
    }
    if (state.dragging) bridge.dragMove?.({ screenX: event.screenX, screenY: event.screenY });
  }

  function pointerUp(event) {
    if (!state.pointerDown) return;
    const wasDragging = state.dragging;
    state.pointerDown = null;
    state.dragging = false;
    pet.classList.remove('is-dragging');
    if (wasDragging) {
      bridge.endDrag?.({ screenX: event.screenX, screenY: event.screenY });
      resumeStageMotion();
      showSpeech('新位置不错。这里的工位风水暂时合格。');
      updateMousePassthrough(event);
      return;
    }
    handleClickGesture();
  }

  function handleClickGesture() {
    state.clickCount += 1;
    clearTimeout(state.clickTimer);
    if (state.clickCount >= 5) {
      state.clickCount = 0;
      react('annoyed', 'annoyed', '…');
      return;
    }
    state.clickTimer = window.setTimeout(() => {
      const count = state.clickCount;
      state.clickCount = 0;
      if (count >= 3) react('annoyed', 'annoyed', '…');
      else if (count >= 2) react('double', 'double', '★');
      else react('tap', 'tap', '♥');
    }, 380);
  }

  function requestContextMenu(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    bridge.showContextMenu?.({
      x: Math.round(event?.screenX || 0),
      y: Math.round(event?.screenY || 0),
      stage: state.stage,
      healthScore: Math.round(state.healthScore),
      healthLevel: state.healthLevel
    });
  }

  document.addEventListener('pointermove', pointerMove, { passive: true });
  document.addEventListener('mouseleave', () => {
    if (!state.dragging) setMousePassthrough(true);
  });
  pet.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    bridge.markPointerActivity?.(true);
    state.pointerDown = { x: event.screenX, y: event.screenY, pointerId: event.pointerId };
  });
  pet.addEventListener('pointerup', pointerUp);
  pet.addEventListener('pointercancel', pointerUp);
  pet.addEventListener('click', (event) => {
    if (event.detail === 0) handleClickGesture();
  });
  pet.addEventListener('contextmenu', requestContextMenu);
  stageEl.addEventListener('contextmenu', requestContextMenu);
  pet.addEventListener('keydown', (event) => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) requestContextMenu(event);
  });
  helpChip.addEventListener('click', () => {
    showSpeech(HINTS[state.hintIndex % HINTS.length], { force: true, duration: 4800 });
    state.hintIndex += 1;
  });
  helpChip.addEventListener('pointerenter', () => setMousePassthrough(false));

  mediaReduced.addEventListener?.('change', (event) => setState({ reducedMotion: event.matches }));
  window.addEventListener('message', (event) => {
    if (event.source !== window && event.source !== window.parent) return;
    if (event.data?.type === 'pet-state') setState(event.data.payload || event.data);
    if (event.data?.type === 'pet-speak') showSpeech(event.data.text, { force: true });
  });
  window.addEventListener('pet-state', (event) => setState(event.detail || {}));
  window.addEventListener('pet-speak', (event) => showSpeech(event.detail?.text || event.detail, { force: true }));

  bridge.onState?.(setState);
  bridge.onSpeak?.((payload) => showSpeech(payload?.text || payload, { force: true }));
  bridge.onAction?.((payload) => {
    if (payload?.action === 'lunch') playLunch(payload.text);
    if (payload?.action === 'walk-start') startReminderWalk(payload);
    if (payload?.action === 'walk-direction') setWalkDirection(payload.direction);
    if (payload?.action === 'walk-step') showWalkStep(payload.frame);
    if (payload?.action === 'walk-look-user') lookAtUserWhileWalking(payload);
    if (payload?.action === 'walk-depth') setWalkDepth(payload.scale);
    if (payload?.action === 'walk-stop') stopReminderWalk(payload);
  });
  bridge.onReducedMotion?.((reducedMotion) => setState({ reducedMotion }));
  bridge.onDisplayScale?.((scale) => {
    const next = Number(scale);
    if (Number.isFinite(next) && next > 0) document.documentElement.style.setProperty('--pet-scale', String(next));
  });

  window.MA_XIEXIE_PET = Object.freeze({
    setState,
    playLunch,
    startReminderWalk,
    setWalkDirection,
    lookAtUserWhileWalking,
    stopReminderWalk,
    setWalkDepth,
    showWalkStep,
    showSpeech: (text, options) => showSpeech(text, { ...options, force: true }),
    close: () => bridge.close?.(),
    getState: () => ({
      stage: state.stage,
      copyStage: state.copyStage,
      pose: state.pose,
      healthScore: state.healthScore,
      healthLevel: state.healthLevel,
      shiftId: state.shiftId,
      workedMinutes: state.workedMinutes,
      lastHydrationHour: state.lastHydrationHour,
      reducedMotion: state.reducedMotion,
      renderer: 'frame-atlas-v2',
      motion: currentMotion.name,
      frame: currentMotion.frame,
      resting: Boolean(currentMotion.resting),
      hintIndex: state.hintIndex,
      speechVisible: !speechBubble.hidden,
      speechText: speechCopy.textContent,
      packingReady,
      workingReady,
      angryReady,
      collapseReady,
      lunchReady,
      walkReady: { left: walkLeftReady, right: walkRightReady },
      frontGlareReady,
      gazeReady: { working: workingGazeReady, packed: packedGazeReady, tired: tiredGazeReady, angry: angryGazeReady },
      packingComplete: state.packingComplete,
      collapseComplete: state.collapseComplete,
      walking: state.walking,
      walkKind: state.walkKind,
      walkDirection: state.walkDirection,
      walkDepthScale: finiteNumber(getComputedStyle(document.documentElement).getPropertyValue('--walk-depth-scale'), 1),
      spriteLayers: document.querySelectorAll('#pet-sprite').length,
      fakeEyeLayers: document.querySelectorAll('.gaze-eye, .gaze-eyes, .sprite-head, .head-follow').length
    })
  });

  setState({ stage: 'ready', healthScore: 100, reducedMotion: mediaReduced.matches });
  setMousePassthrough(true);
  Promise.resolve(bridge.getState?.()).then((payload) => payload && setState(payload)).catch(() => {});
  window.setTimeout(() => showSpeech('我是马歇歇。靠近看看，拖我可以换个地方。', { force: true, duration: 5200 }), 650);
  scheduleAmbient();
})();
