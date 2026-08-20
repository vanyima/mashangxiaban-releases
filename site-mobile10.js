const complaintCopies = ['好想下班','不想干了','怎么都找我','催什么催','无语死了','好累啊','好想退休','又来活了','别艾特我','工资呢','饼吃不下','让我静静','明天再说','谁爱干谁干','心已下班','人快碎了','能别改吗','第几版了','我谢谢你','下班要紧'];

/* 手机首次打开官网固定从首屏开始；返回页面时仍保留用户原来的浏览位置。 */
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
if (matchMedia('(max-width: 980px)').matches && !location.hash && navigationType !== 'back_forward') {
  history.scrollRestoration = 'manual';
  const resetMobileEntry = () => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
  };
  resetMobileEntry();
  requestAnimationFrame(resetMobileEntry);
  addEventListener('load', resetMobileEntry, { once:true });
}

/* 读取官网同域的汇总结果，避免访客浏览器直连 GitHub API 被拦截或限流。 */
async function refreshDownloadCounts() {
  const counters = [...document.querySelectorAll('[data-download-count]')];
  if (!counters.length) return;
  try {
    const response = await fetch('download-counts.json', { cache:'no-store' });
    if (!response.ok) throw new Error(`download counts ${response.status}`);
    const counts = await response.json();
    counters.forEach((counter) => {
      const count = counts[counter.dataset.downloadCount];
      if (!Number.isFinite(count)) return;
      counter.textContent = `${new Intl.NumberFormat('zh-CN').format(count)} 次下载`;
    });
  } catch { /* 保留 HTML 里的最近一次统计值，不向用户显示“不可用”。 */ }
}
refreshDownloadCounts();

const muyuButton = document.querySelector('#muyu-button');
const muyuCopy = document.querySelector('#muyu-copy');
let lastComplaint = -1;
if (muyuButton && muyuCopy) {
  muyuButton.addEventListener('click', () => {
    let next;
    do next = Math.floor(Math.random() * complaintCopies.length); while (next === lastComplaint);
    lastComplaint = next;
    muyuCopy.textContent = complaintCopies[next];
    muyuButton.animate([{ transform:'rotate(0)' }, { transform:'rotate(-3deg) scale(.94)' }, { transform:'rotate(0)' }], { duration:360, easing:'cubic-bezier(.2,.8,.2,1)' });
  });
}

const heroMuyuDemo = document.querySelector('.hero-muyu-demo');
const heroComplaints = document.querySelector('#hero-complaints');
const heroHitCount = document.querySelector('#hero-hit-count');
let heroHitTotal = Number(heroHitCount?.textContent || 128);
let heroComplaintIndex = 0;

function strikeHeroMuyu() {
  if (!heroMuyuDemo || !heroComplaints || !heroHitCount) return;
  const copy = complaintCopies[heroComplaintIndex % complaintCopies.length];
  heroComplaintIndex += 1;
  heroHitTotal += 1;
  heroHitCount.textContent = String(heroHitTotal);
  const particle = document.createElement('i');
  particle.textContent = `${copy} +1`;
  particle.style.left = `${18 + (heroComplaintIndex % 3) * 24}px`;
  heroComplaints.appendChild(particle);
  particle.addEventListener('animationend', () => particle.remove(), { once:true });
  heroMuyuDemo.animate(
    [{ transform:'rotate(-2deg) scale(1)' }, { transform:'rotate(-3deg) scale(.96)' }, { transform:'rotate(-2deg) scale(1)' }],
    { duration:260, easing:'cubic-bezier(.2,.8,.2,1)' }
  );
}

if (heroMuyuDemo) {
  heroMuyuDemo.addEventListener('click', strikeHeroMuyu);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(strikeHeroMuyu, 780);
}

const AUTOPLAY_MS = 3000;
const CLICK_HOLD_MS = 10000;

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = [...carousel.querySelectorAll('.slide')];
  const dots = carousel.querySelector('.carousel-dots');
  const track = carousel.querySelector('.carousel-track');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer;
  let resumeTimer;
  let inView = false;
  let clickHeld = false;

  carousel.dataset.autoplay = 'true';
  carousel.style.setProperty('--carousel-duration', `${AUTOPLAY_MS}ms`);
  track.setAttribute('aria-live', 'polite');

  function stop() {
    clearInterval(timer);
    timer = undefined;
  }

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === index));
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
      dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
    });
  }

  function start() {
    stop();
    if (!reduced && inView && !clickHeld && !document.hidden) timer = setInterval(() => show(index + 1), AUTOPLAY_MS);
  }

  function holdAt(next) {
    show(next);
    stop();
    clearTimeout(resumeTimer);
    clickHeld = true;
    carousel.dataset.clickHeld = 'true';
    resumeTimer = setTimeout(() => {
      clickHeld = false;
      delete carousel.dataset.clickHeld;
      show(index + 1);
      start();
    }, CLICK_HOLD_MS);
  }

  slides.forEach((slide, slideIndex) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `固定第 ${slideIndex + 1} 张截图 10 秒`);
    dot.addEventListener('click', () => holdAt(slideIndex));
    dots.appendChild(dot);
    slide.querySelector('img').addEventListener('click', () => holdAt(slideIndex));
  });

  carousel.querySelector('.prev').addEventListener('click', () => holdAt(index - 1));
  carousel.querySelector('.next').addEventListener('click', () => holdAt(index + 1));

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    inView ? start() : stop();
  }, { threshold:.55 }).observe(carousel);

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  show(0);
});

const stamp = document.querySelector('.cursor-stamp');
if (matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', (event) => {
    stamp.style.left = `${event.clientX}px`;
    stamp.style.top = `${event.clientY}px`;
    stamp.style.opacity = '1';
  });
  document.addEventListener('mouseleave', () => stamp.style.opacity = '0');
}

const observed = document.querySelectorAll('.feature-copy,.radar-copy,.retirement-copy,.health-card,.download-copy');
const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  entry.target.animate([{ opacity:0, transform:'translateY(28px)' }, { opacity:1, transform:'translateY(0)' }], { duration:560, fill:'both', easing:'cubic-bezier(.2,.8,.2,1)' });
  reveal.unobserve(entry.target);
}), { threshold:.2 });
observed.forEach((node) => reveal.observe(node));

/* 顶部功能导航：点击时给图标和标签一个短促的 Q 弹反馈。 */
document.querySelectorAll('.site-nav nav a').forEach((link) => {
  link.addEventListener('click', () => {
    link.classList.remove('is-boinging');
    void link.offsetWidth;
    link.classList.add('is-boinging');
    setTimeout(() => link.classList.remove('is-boinging'), 560);
  });
});

const navSections = [...document.querySelectorAll('.site-nav .nav-feature[href^="#"]')]
  .map((link) => ({ link, section:document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);
if (navSections.length) {
  const navHighlight = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navSections.forEach(({ link, section }) => link.classList.toggle('is-current', section === entry.target));
    });
  }, { rootMargin:'-24% 0px -60% 0px', threshold:0 });
  navSections.forEach(({ section }) => navHighlight.observe(section));
}

/* 通知演示区的两条语音互斥播放，避免同时播报。 */
const voiceTracks = [...document.querySelectorAll('.voice-track')];
const voiceAudios = voiceTracks.map((track) => track.dataset.audioTarget ? document.querySelector(`#${track.dataset.audioTarget}`) : null);
let activeSpeechTrack = null;

function renderVoiceTrack(activeTrack = null) {
  voiceTracks.forEach((track) => {
    const isPlaying = track === activeTrack;
    track.classList.toggle('is-playing', isPlaying);
    track.setAttribute('aria-pressed', String(isPlaying));
    track.setAttribute('aria-label', `${isPlaying ? '暂停' : '播放'}${track.querySelector('.voice-copy b')?.textContent || '语音'}语音`);
  });
}

voiceTracks.forEach((track, index) => {
  const audio = voiceAudios[index];
  track.addEventListener('click', async () => {
    if ((audio && !audio.paused) || track === activeSpeechTrack) {
      audio?.pause();
      window.speechSynthesis?.cancel();
      activeSpeechTrack = null;
      renderVoiceTrack();
      return;
    }
    voiceAudios.forEach((item) => {
      if (!item || item === audio) return;
      item.pause();
      item.currentTime = 0;
    });
    window.speechSynthesis?.cancel();
    activeSpeechTrack = null;
    try {
      if (audio) {
        await audio.play();
        renderVoiceTrack(track);
      } else if (track.dataset.speech && 'speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(track.dataset.speech);
        speech.lang = 'zh-CN';
        speech.rate = .98;
        speech.pitch = 1.02;
        speech.voice = window.speechSynthesis.getVoices().find((voice) => /^zh/i.test(voice.lang)) || null;
        speech.addEventListener('end', () => {
          activeSpeechTrack = null;
          renderVoiceTrack();
        }, { once:true });
        speech.addEventListener('error', () => {
          activeSpeechTrack = null;
          track.classList.add('is-error');
          renderVoiceTrack();
        }, { once:true });
        activeSpeechTrack = track;
        window.speechSynthesis.speak(speech);
        renderVoiceTrack(track);
      } else {
        throw new Error('Voice playback is unavailable');
      }
    } catch {
      track.classList.add('is-error');
      track.setAttribute('aria-label', '语音加载失败，点击重试');
    }
  });
  if (!audio) return;
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    renderVoiceTrack();
  });
  audio.addEventListener('playing', () => track.classList.remove('is-error'));
});

/* 桌面端一次滚轮手势只切换一个 Part；手机保留原生触摸惯性。 */
if (matchMedia('(min-width: 981px) and (pointer: fine)').matches) {
  const parts = [...document.querySelectorAll('main > section')];
  let sectionLocked = false;
  window.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 18 || sectionLocked || event.ctrlKey) return;
    const navHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
    const current = parts.reduce((best, part, partIndex) => {
      const distance = Math.abs(part.getBoundingClientRect().top - navHeight);
      return distance < best.distance ? { index:partIndex, distance } : best;
    }, { index:0, distance:Infinity }).index;
    const next = Math.max(0, Math.min(parts.length - 1, current + Math.sign(event.deltaY)));
    if (next === current) return;
    event.preventDefault();
    sectionLocked = true;
    parts[next].scrollIntoView({ behavior:'smooth', block:'start' });
    setTimeout(() => sectionLocked = false, 720);
  }, { passive:false });
}

/* 退休旅行轨道：自动巡航；悬停或键盘聚焦的图片会变速滑到正中央。 */
const retirementOrbit = document.querySelector('.retirement-orbit');
if (retirementOrbit) {
  const orbitShots = [...retirementOrbit.querySelectorAll('.retirement-shot')];
  const reduceOrbitMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let orbitIndex = 0;
  let orbitTimer = null;
  let orbitInView = true;

  const orbitOffset = (index) => {
    let offset = index - orbitIndex;
    const half = orbitShots.length / 2;
    if (offset > half) offset -= orbitShots.length;
    if (offset < -half) offset += orbitShots.length;
    return offset;
  };

  const renderRetirementOrbit = (mode = 'auto') => {
    const stageWidth = retirementOrbit.clientWidth || 900;
    const stageHeight = retirementOrbit.clientHeight || 640;
    retirementOrbit.classList.toggle('is-hover-steering', mode === 'hover');
    orbitShots.forEach((shot, index) => {
      const offset = orbitOffset(index);
      const distance = Math.abs(offset);
      const angle = offset * (Math.PI * 2 / orbitShots.length);
      const depth = Math.cos(angle);
      const side = Math.sin(angle);
      const x = side * stageWidth * .415;
      /* 椭圆轨道向右下倾斜：后排整体抬高，左右两翼产生可见的高度差。 */
      const y = -(1 - depth) * stageHeight * .205 + side * stageHeight * .085 + stageHeight * .035;
      const scale = distance === 0 ? 1 : distance === 1 ? .68 : distance === 2 ? .47 : distance === 3 ? .32 : .27;
      const opacity = distance === 0 ? 1 : distance === 1 ? .86 : distance === 2 ? .73 : distance === 3 ? .64 : .58;
      const rotate = side * -31;
      const isFront = Math.abs(offset) < .1;
      shot.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${depth * 300}px) scale(${scale}) rotateY(${rotate}deg) rotateZ(-6deg)`;
      shot.style.opacity = String(opacity);
      shot.style.zIndex = String(Math.round((depth + 1) * 50));
      shot.style.pointerEvents = 'auto';
      shot.classList.toggle('is-front', isFront);
      shot.setAttribute('aria-current', isFront ? 'true' : 'false');
      shot.setAttribute('aria-label', `${shot.querySelector('figcaption')?.textContent || '旅行图片'}${isFront ? '，当前图片' : '，移到中央查看'}`);
    });
  };

  const setOrbitIndex = (index, mode = 'auto') => {
    orbitIndex = (index + orbitShots.length) % orbitShots.length;
    renderRetirementOrbit(mode);
  };

  const stopOrbit = () => {
    if (!orbitTimer) return;
    clearInterval(orbitTimer);
    orbitTimer = null;
  };

  const startOrbit = () => {
    stopOrbit();
    if (reduceOrbitMotion || !orbitInView || document.hidden) return;
    orbitTimer = setInterval(() => setOrbitIndex(orbitIndex + 1, 'auto'), 1500);
  };

  orbitShots.forEach((shot, index) => {
    shot.addEventListener('pointerenter', () => {
      stopOrbit();
      setOrbitIndex(index, 'hover');
    });
    shot.addEventListener('focus', () => {
      stopOrbit();
      setOrbitIndex(index, 'hover');
    });
    shot.addEventListener('keydown', (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      setOrbitIndex(index, 'hover');
    });
  });

  retirementOrbit.addEventListener('pointerleave', () => {
    retirementOrbit.classList.remove('is-hover-steering');
    startOrbit();
  });
  retirementOrbit.addEventListener('focusout', (event) => {
    if (retirementOrbit.contains(event.relatedTarget)) return;
    retirementOrbit.classList.remove('is-hover-steering');
    startOrbit();
  });
  window.addEventListener('resize', () => renderRetirementOrbit('resize'));
  document.addEventListener('visibilitychange', startOrbit);
  new IntersectionObserver(([entry]) => {
    orbitInView = entry.isIntersecting;
    if (orbitInView) startOrbit(); else stopOrbit();
  }, { threshold:.18 }).observe(retirementOrbit);

  renderRetirementOrbit('initial');
  startOrbit();
}
