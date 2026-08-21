const API_BASE = 'https://mashangxiaban-radar.vanyima1126.workers.dev';
const CLIENT_KEY = 'ma-xiexie-feedback-client-v1';
const LOCAL_IDEAS_KEY = 'ma-xiexie-feedback-local-ideas-v1';
const LOCAL_VOTES_KEY = 'ma-xiexie-feedback-local-votes-v1';
const fallbackIdeas = [
  { content: '开会超过 45 分钟，马歇歇自动开始刨地。', size: 'large', votes: 18 },
  { content: '准点下班也要有连续打卡。', size: 'small', votes: 0 },
  { content: '下班倒计时最后一分钟，播放火箭发射音。', size: 'medium', votes: 7 },
  { content: '老板已读不回', size: 'small', votes: 0 },
  { content: '检测到周末开电脑，马直接瞪到全屏，直到我把电脑合上。', size: 'large', votes: 12 },
  { content: '做一个“今天没被工作定义”勋章。', size: 'medium', votes: 0 },
  { content: '工时太长时，桌宠替我原地躺平。', size: 'small', votes: 4 },
  { content: '加一个假装掉线按钮，名字就叫精神离职。', size: 'medium', votes: 0 },
  { content: '周报能不能自动翻译成：这周也活下来了。', size: 'small', votes: 9 },
  { content: '下班！', size: 'large', votes: 0 },
  { content: '加班超过两小时，直接进入工位静默保护模式。', size: 'medium', votes: 3 }
];

const form = document.querySelector('#feedback-form');
const input = document.querySelector('#feedback-input');
const lengthLabel = document.querySelector('#feedback-length');
const status = document.querySelector('#feedback-status');
const submit = document.querySelector('#feedback-submit');
const lanes = document.querySelector('#idea-lanes');
const count = document.querySelector('#idea-count');
const empty = document.querySelector('#idea-empty');
let usingLocalFallback = false;

function readLocalJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function fallbackIdeaList() {
  const votes = readLocalJson(LOCAL_VOTES_KEY, {});
  const samples = fallbackIdeas.map((idea, index) => {
    const id = `mock-${index + 1}`;
    const hasLocalVote = Object.prototype.hasOwnProperty.call(votes, id);
    return { ...idea, id, createdAt: Date.now() - index * 370000, mine: false, votes: hasLocalVote ? Number(votes[id]) : Number(idea.votes || 0), voted: hasLocalVote, local: true };
  });
  return [...readLocalJson(LOCAL_IDEAS_KEY, []), ...samples];
}

function clientId() {
  let value = localStorage.getItem(CLIENT_KEY);
  if (!value) {
    value = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(CLIENT_KEY, value);
  }
  return value;
}

function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - Number(value || Date.now())) / 60000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 1440)} 天前`;
}

function renderIdeas(ideas) {
  lanes.replaceChildren();
  empty.hidden = ideas.length > 0;
  count.textContent = `${ideas.length} 条正在漂浮`;
  const visibleIdeas = ideas.slice(0, innerWidth < 1150 ? 8 : 12);
  const mineTotal = visibleIdeas.filter((idea) => idea.mine).length;
  const othersTotal = visibleIdeas.length - mineTotal;
  let mineIndex = 0;
  let otherIndex = 0;
  visibleIdeas.forEach((idea, index) => {
    const pill = document.createElement('article');
    pill.dataset.ideaId = String(idea.id || `idea-${index}`);
    const mine = Boolean(idea.mine);
    const track = mine ? 0 : otherIndex % 2;
    const lanePosition = mine ? mineIndex++ : Math.floor(otherIndex++ / 2);
    const laneTotal = mine ? mineTotal : Math.ceil((othersTotal - track) / 2);
    const laneTop = mine
      ? Math.max(112, Math.round((lanes.clientHeight - 88) / 2))
      : track === 0 ? 3 : Math.max(3, lanes.clientHeight - 94);
    const visualSize = mine ? 'large' : idea.size || (idea.content.length > 24 ? 'small' : index % 5 === 0 ? 'large' : 'medium');
    const supportState = idea.voted ? ' is-supported-mine' : Number(idea.votes || 0) > 0 ? ' is-supported-others' : ' is-unclaimed';
    pill.className = `idea-pill idea-pill-${visualSize}${supportState}${idea.mine ? ' is-mine' : ''}`;
    pill.style.setProperty('--vote-scale', String(1 + Math.min(Number(idea.votes || 0), 20) * .0125));
    pill.style.setProperty('--lane', `${laneTop}px`);
    const duration = mine ? 34 : 31 + track * 3;
    const progress = (lanePosition + .12) / Math.max(1, laneTotal);
    pill.style.setProperty('--duration', `${duration}s`);
    pill.style.setProperty('--delay', `${-(duration * progress).toFixed(2)}s`);
    pill.style.setProperty('--tilt', `${[-1.6,.8,-.5,1.2][index % 4]}deg`);
    const copy = document.createElement('span');
    copy.className = 'idea-copy';
    if (idea.mine) {
      const mine = document.createElement('b');
      mine.textContent = '我';
      copy.append(mine);
    }
    copy.append(document.createTextNode(idea.content));
    pill.append(copy);
    const meta = document.createElement('span');
    meta.className = 'idea-meta';
    const time = document.createElement('time');
    time.textContent = relativeTime(idea.createdAt);
    meta.append(time);
    const vote = document.createElement('button');
    vote.className = 'idea-vote';
    vote.type = 'button';
    vote.disabled = Boolean(idea.voted);
    vote.textContent = `${idea.voted ? '俺也要了' : '俺也要'} +${Number(idea.votes || 0)}`;
    vote.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (idea.voted) return;
      const previousVotes = Number(idea.votes || 0);
      idea.votes = previousVotes + 1;
      idea.voted = true;
      pill.classList.remove('is-unclaimed', 'is-supported-others');
      pill.classList.add('is-supported-mine');
      vote.disabled = true;
      vote.textContent = `俺也要了 +${idea.votes}`;
      pill.style.setProperty('--vote-scale', String(1 + Math.min(idea.votes, 20) * .0125));
      if (usingLocalFallback || idea.local) {
        const votes = readLocalJson(LOCAL_VOTES_KEY, {});
        votes[idea.id] = idea.votes;
        localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
        if (String(idea.id).startsWith('local-')) {
          const localIdeas = readLocalJson(LOCAL_IDEAS_KEY, []);
          const saved = localIdeas.find((item) => item.id === idea.id);
          if (saved) { saved.votes = idea.votes; saved.voted = true; localStorage.setItem(LOCAL_IDEAS_KEY, JSON.stringify(localIdeas)); }
        }
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/v1/feedback/${idea.id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: clientId() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'vote-failed');
        idea.votes = Number(data.votes || idea.votes);
        vote.textContent = `俺也要了 +${idea.votes}`;
        pill.style.setProperty('--vote-scale', String(1 + Math.min(idea.votes, 20) * .0125));
      } catch {
        idea.votes = previousVotes;
        idea.voted = false;
        pill.classList.remove('is-supported-mine');
        pill.classList.add(previousVotes > 0 ? 'is-supported-others' : 'is-unclaimed');
        vote.disabled = false;
        vote.textContent = `俺也要 +${previousVotes}`;
        pill.style.setProperty('--vote-scale', String(1 + Math.min(previousVotes, 20) * .0125));
        status.textContent = '这次“俺也要”没送到，公共空域可能正在开会。';
      }
    });
    meta.append(vote);
    pill.append(meta);
    lanes.append(pill);
  });
}

function revealLaunchedIdea(ideaId) {
  const target = [...lanes.querySelectorAll('.idea-pill')].find((pill) => pill.dataset.ideaId === String(ideaId));
  if (!target) return;
  const airspace = document.querySelector('#airspace');
  const navHeight = document.querySelector('.feedback-nav')?.offsetHeight || 0;
  window.scrollTo({ top: Math.max(0, airspace.offsetTop - navHeight), behavior: 'smooth' });
  target.classList.add('is-launch-focus');
  setTimeout(() => {
    if (!target.isConnected) return;
    target.classList.replace('is-launch-focus', 'is-launch-departing');
    setTimeout(() => {
      if (target.isConnected) target.classList.remove('is-launch-departing');
    }, 5200);
  }, 2800);
}

async function loadIdeas() {
  try {
    const response = await fetch(`${API_BASE}/v1/feedback?clientId=${encodeURIComponent(clientId())}`);
    if (!response.ok) throw new Error('load-failed');
    const data = await response.json();
    usingLocalFallback = false;
    renderIdeas(data.ideas || []);
  } catch {
    usingLocalFallback = true;
    renderIdeas(fallbackIdeaList());
    count.textContent = '公共空域暂时离线 · 先看示例脑洞';
  }
}

input.addEventListener('input', () => { lengthLabel.textContent = input.value.length; });
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content) return;
  submit.disabled = true;
  status.textContent = '正在发射，注意避让工位上空…';
  try {
    const response = await fetch(`${API_BASE}/v1/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: clientId(), content })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'send-failed');
    input.value = '';
    lengthLabel.textContent = '0';
    status.textContent = '已进入公共空域。那条带【我】的就是你。';
    await loadIdeas();
    revealLaunchedIdea(data.idea?.id);
  } catch (error) {
    if (error.message === 'too-many-requests') {
      status.textContent = '脑洞太密了，先让马喘一分钟。';
    } else {
      const localIdeas = readLocalJson(LOCAL_IDEAS_KEY, []);
      const localId = `local-${Date.now()}`;
      localIdeas.unshift({ id: localId, content, createdAt: Date.now(), mine: true, votes: 0, voted: false, local: true });
      localStorage.setItem(LOCAL_IDEAS_KEY, JSON.stringify(localIdeas.slice(0, 20)));
      input.value = '';
      lengthLabel.textContent = '0';
      usingLocalFallback = true;
      renderIdeas(fallbackIdeaList());
      count.textContent = '公共空域暂时离线 · 你的脑洞已留在本机';
      status.textContent = '已先留在这台电脑的预览空域，暂时不会同步给其他人。';
      revealLaunchedIdea(localId);
    }
  } finally {
    submit.disabled = false;
  }
});

loadIdeas();
setInterval(loadIdeas, 30000);

/* 桌面端一次滚轮只翻一块完整内容，手机端保留原生触摸滚动。 */
if (matchMedia('(min-width: 901px) and (pointer: fine)').matches) {
  const screens = [...document.querySelectorAll('.feedback-stage > section')];
  let screenLocked = false;
  let screenLockUntil = 0;
  let screenUnlockTimer = 0;
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return;
    if (screenLocked) {
      event.preventDefault();
      clearTimeout(screenUnlockTimer);
      screenUnlockTimer = setTimeout(() => { screenLocked = false; }, Math.max(260, screenLockUntil - Date.now()));
      return;
    }
    if (Math.abs(event.deltaY) < 18) {
      event.preventDefault();
      return;
    }
    const navHeight = document.querySelector('.feedback-nav')?.offsetHeight || 0;
    const current = screens.reduce((best, screen, index) => {
      const distance = Math.abs(screen.getBoundingClientRect().top - navHeight);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity }).index;
    const next = Math.max(0, Math.min(screens.length - 1, current + Math.sign(event.deltaY)));
    if (next === current) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    screenLocked = true;
    screenLockUntil = Date.now() + 900;
    window.scrollTo({ top: Math.max(0, screens[next].offsetTop - navHeight), behavior: 'smooth' });
    clearTimeout(screenUnlockTimer);
    screenUnlockTimer = setTimeout(() => { screenLocked = false; }, screenLockUntil - Date.now());
  }, { passive: false });
}
