const STORAGE = {
  shift: 'ma-xiexie-active-shift-v1',
  records: 'ma-xiexie-attendance-v1',
  notifications: 'ma-xiexie-notifications-v1',
  notificationReady: 'ma-xiexie-notification-ready-v2',
  notificationOnboardingSeen: 'ma-xiexie-notification-onboarding-seen-v1',
  notificationSkipDate: 'ma-xiexie-notification-skip-date-v1',
  sound: 'ma-xiexie-sound-v1',
  ventCounts: 'ma-xiexie-vent-counts-v1',
  ledgerMode: 'ma-xiexie-ledger-mode-v1',
  todos: 'ma-xiexie-todos-v1',
  retirementPlan: 'ma-xiexie-retirement-plan-v1',
  petEnabled: 'ma-xiexie-pet-enabled-v1',
  radarMode: 'ma-xiexie-radar-mode-v1',
  radarName: 'ma-xiexie-radar-name-v1',
  radarDiscovery: 'ma-xiexie-radar-discovery-v1',
  radarRadius: 'ma-xiexie-radar-radius-v1'
};

const app = document.querySelector('#app');
const $ = (selector) => document.querySelector(selector);
document.documentElement.dataset.platform = window.desktop?.platform || 'web';
const els = {
  statePill: $('#state-pill'), heroTitle: $('#hero-title'), heroCopy: $('#hero-copy'), timer: $('#timer-value'),
  timerLabel: $('#timer-label'), timerNote: $('#timer-note'), topStatus: $('#top-status-text'), heroAvatar: $('#hero-avatar'),
  iconBadge: $('#icon-badge'), progressFill: $('#progress-fill'), progressPerson: $('#progress-person'),
  progressTitle: $('#progress-title'), progressCopy: $('#progress-copy'),
  notification: $('#notification-card'), restore: $('#notification-restore'), notificationTitle: $('#notification-title'),
  notificationCopy: $('#notification-copy'), overtimeTitle: $('#overtime-alert-title'), overtimeCopy: $('#overtime-alert-copy'),
  startTime: $('#start-time'), startDate: $('#start-date'), workedDuration: $('#worked-duration'), sideProgress: $('#side-progress'), sideProgressLabel: $('#side-progress-label'), planTime: $('#plan-time'), planDate: $('#plan-date'), planTimeControl: $('.plan-time-control'), planStepCopy: $('#plan-step-copy'),
  notificationSettings: $('#notification-settings'), notificationShortcut: $('#notification-shortcut'), notificationOnboarding: $('#notification-onboarding'), notificationOnboardingClose: $('#notification-onboarding-close'), notificationEnable: $('#notification-enable'), notificationLater: $('#notification-later'), sideActionZone: $('.side-action-zone'), settingsToggle: $('#settings-toggle'), settingsMenu: $('#settings-menu'), soundToggle: $('#sound-toggle'), updateCheck: $('#update-check'), audioPreview: $('#audio-preview'), checkoutVoice: $('#checkout-voice'),
  ventButton: $('#vent-button'), ventFloats: $('#vent-floats'), ventCount: $('#vent-count'),
  ledger: $('#ledger'), dataModeLabel: $('#data-mode-label'), dataModeToggle: $('#data-mode-toggle'), emptyLedger: $('#empty-ledger'),
  userDashboard: $('#user-dashboard'), clearAttendanceData: $('#clear-attendance-data'), epitaph: $('#epitaph-text'), ledgerPersonaTitle: $('#ledger-persona-title'), ledgerPersonaCopy: $('#ledger-persona-copy'),
  healthShortcut: $('#health-shortcut'), healthMiniText: $('#health-mini-text'), healthMiniScore: $('#health-mini-score'),
  healthShell: $('.health-shell'), healthMascot: $('#health-mascot'), healthTitle: $('#health-title'), healthStamp: $('#health-stamp'),
  healthScore: $('#health-score'), healthSummary: $('#health-summary'), healthStageName: $('#health-stage-name'),
  healthStageCopy: $('#health-stage-copy'), healthHours: $('#health-hours'), healthMeterFill: $('#health-meter-fill'),
  healthPreviewNotice: $('#health-preview-notice'), healthPreviewCopy: $('#health-preview-copy'), healthPreviewReset: $('#health-preview-reset'),
  offSummaryDuration: $('#off-summary-duration'), checkoutReportCard: $('#checkout-report-card'), reportDate: $('#report-date'), reportStamp: $('#report-stamp'), reportStart: $('#report-start'), reportEnd: $('#report-end'), reportOvertime: $('#report-overtime'), reportVent: $('#report-vent'), reportHealth: $('#report-health'), reportEpitaph: $('#report-epitaph'), reportTodos: $('#report-todos'), reportSave: $('#report-save'), reportAttendance: $('#report-attendance'), todoAdd: $('#todo-add'), todoClear: $('#todo-clear'), todoComposer: $('#todo-composer'), todoInput: $('#todo-input'), todoList: $('#todo-list'), shutdownShield: $('#shutdown-shield'), deferTodos: $('#defer-todos'),
  bootLoader: $('#boot-loader'), bootCopy: $('#boot-copy'), bootPercent: $('#boot-percent'),
  petToggle: $('#pet-toggle'), petToggleState: $('#pet-toggle-state'), petGuideOpen: $('#pet-guide-open'), petResetPosition: $('#pet-reset-position'), petGuide: $('#pet-guide'), petGuideClose: $('#pet-guide-close'),
  autoCheckInOption: $('#auto-check-in-option'), autoCheckInToggle: $('#auto-check-in-toggle'), autoCheckInStatus: $('#auto-check-in-status'),
  retirementShell: $('#retirement-shell'), retirementForm: $('#retirement-form'), retirementCurrentAge: $('#retirement-current-age'), retirementTargetAge: $('#retirement-target-age'), retirementAgeError: $('#retirement-age-error'), retirementDays: $('#retirement-days'), retirementYears: $('#retirement-years'), retirementAgeSummary: $('#retirement-age-summary'), retirementEdit: $('#retirement-edit'), retirementPreviewOpen: $('#retirement-preview-open'), retirementPreview: $('#retirement-preview'), retirementPreviewImage: $('#retirement-preview-image'), retirementPreviewMeta: $('#retirement-preview-meta'), retirementPreviewCopyline: $('#retirement-preview-copyline'), retirementPreviewShuffle: $('#retirement-preview-shuffle'), retirementPreviewClose: $('#retirement-preview-close'),
  radarShell: $('#radar-shell'), radarModeLabel: $('#radar-mode-label'), radarModeToggle: $('#radar-mode-toggle'), radarShowMock: $('#radar-show-mock'), radarSelfName: $('#radar-self-name'), radarNameInput: $('#radar-name-input'), radarNameDice: $('#radar-name-dice'), radarNameSave: $('#radar-name-save'), radarBlips: $('#radar-blips'), radarPeople: $('#radar-people'), radarInbox: $('#radar-inbox'), radarDiscoveryToggle: $('#radar-discovery-toggle'), radarDiscoveryStatus: $('#radar-discovery-status'), radarRangeLabel: $('#radar-range-label'), radarNearbyCount: $('#radar-nearby-count'), radarMoyuCount: $('#radar-moyu-count'), radarWorkingCount: $('#radar-working-count')
};
els.todayDate = $('#today-date');
els.ticketNumber = $('#ticket-number');

const stateContent = {
  ready: { shell: 'ready', pill: '早安工位 · 副本已刷新', title: '新的一天\n又被生活精准投放', copy: '电脑可以先开，灵魂不必秒到。准备好了就记录今天几点被工位捕获。', label: '当前时间', top: '等待今日肉身签收', position: '50% 4.2%', mascot: '马歇歇靠奶茶开机', progress: '尚未到案 · 请珍惜最后空气' },
  working: { shell: 'working', pill: '工位在线 · 情绪省电', title: '距离停止营业\n还有一会儿', copy: '电脑已经开机，灵魂仍在尝试连接。今天的目标不是燃烧，是完整地活到下班。', label: '距离自由', top: '肉身已到岗 · 灵魂登录中', position: '2.2% 4.2%', mascot: '马歇歇正在键盘上活人微死', progress: '键盘营业中 · 工资保持冷静' },
  near: { shell: 'working', pill: '最后半小时 · 禁止开新坑', title: '马上自由\n别被“顺手”拖下水', copy: '现在只允许保存、同步和优雅消失。“顺手再改一个”通常是加班事故的第一现场。', label: '距离自由', top: '撤离程序正在预热', position: '50% 95.8%', mascot: '马歇歇已经提前拿包', progress: '包已拿好 · 拒绝加戏' },
  checkout: { shell: 'checkout', pill: '准点到达 · 撤离通道已开', title: '下班请注意\n下班请注意', copy: '工作时间已到站，请带好手机、钥匙和尚未完全消失的自尊，有序撤离工位。', label: '下班时间', top: '营业结束 · 拒绝续杯', position: '97.8% 4.2%', mascot: '马歇歇迫不及待地撤离', progress: '今日服务已到期 · 明天再来' },
  overtime: { shell: 'overtime', pill: '工位滞留 · 已超过释放时间', title: '你怎么还在\n明天不过了吗', copy: '别人正在过夜生活，你正在给白天写续集。顺计时已经开始，什么时候走，由你亲手按下下班。', label: '已超时', top: '已超时 · 公司正在白嫖加钟', position: '97.8% 95.8%', mascot: '马歇歇已被加班放倒', progress: '老板已超额消费 · 工资保持原速' },
  off: { shell: 'off', pill: '今日收工 · 恢复自然人', title: '下班成功\n今晚归你所有', copy: '工位暂时失去你的监护权。未读消息不会消失，但你可以。', label: '今日下班', top: '今日已收工 · 消息明天再审', position: '97.8% 4.2%', mascot: '马歇歇正在奔向自由', progress: '肉身与灵魂已成功汇合' }
};

const HERO_SHEET_URL = 'url("mascot/ma-xiexie-sheet-v1.png")';
const HERO_WORKING_URL = 'url("mascot/ma-xiexie-working-v2/00.png")';

function heroMascotVisual(stateInfo, now = new Date()) {
  if (stateInfo?.name === 'working' && stateInfo.shift?.startedAt) {
    const workedHours = Math.max(0, (now - new Date(stateInfo.shift.startedAt)) / 3600000);
    if (workedHours < 2) return { key: 'early', image: HERO_SHEET_URL, size: '330% 220%', position: '50% 4.2%', label: '马歇歇拿奶茶正常开机' };
    if (workedHours < 6) return { key: 'steady', image: HERO_WORKING_URL, size: 'contain', position: 'center', label: '马歇歇正在正常敲电脑' };
    return { key: 'tired', image: HERO_SHEET_URL, size: '330% 220%', position: '2.2% 4.2%', label: '马歇歇工作六小时后开始疲惫' };
  }
  const content = stateContent[stateInfo?.name] || stateContent.ready;
  return { key: stateInfo?.name || 'ready', image: HERO_SHEET_URL, size: '330% 220%', position: content.position, label: content.mascot };
}

function renderHeroMascot(stateInfo, now = new Date()) {
  const visual = heroMascotVisual(stateInfo, now);
  els.heroAvatar.dataset.workStage = visual.key;
  els.heroAvatar.style.backgroundImage = visual.image;
  els.heroAvatar.style.backgroundSize = visual.size;
  els.heroAvatar.style.backgroundPosition = visual.position;
  els.heroAvatar.setAttribute('aria-label', visual.label);
}

const copyBanks = {
  working: [
    ['离自由尚远，事业心请分期付款', '一次性燃烧容易提前报废。今天的目标是稳定活到下班。'],
    ['公司今日续费成功，你的灵魂仍是试用版', '喝口水，看看窗外。维持生命体征也属于必要的系统维护。'],
    ['任务可以无限刷新，你的电量不行', '把力气留到下班，不要让一个普通工作日拥有史诗级牺牲。'],
    ['看起来很忙，是现代工位的基础礼仪', '真正的进度可以慢一点，眉头不必跟着项目排期一起加速。'],
    ['工位把你租走了八小时，没买断你的人生', '任务做不完是排期问题，不是你今晚必须献祭的理由。'],
    ['消息红点很多，工资小数点很稳', '别让通知数量制造虚假繁荣，先把自己的呼吸调回正常速度。'],
    ['今天也在用全职工资，表演股东责任', '适度负责，拒绝入戏。老板的商业版图不需要你用颈椎手绘。']
  ],
  near: [
    ['最后 30 分钟：不要碰新需求', '这时候来的“简单小改”，通常拥有连续剧般的生命周期。'],
    ['最后 5 分钟：鼠标请保持克制', '每一次双击都可能成为新的事故。保存、同步、拿包。'],
    ['自由已经到楼下，请勿让它久等', '现在发来的“在吗”，可以理解为对方在确认你明天还会不会来。'],
    ['工位进入垃圾时间，请停止追加剧情', '此刻最专业的操作是保存文件，而不是证明自己还能再扛一个需求。'],
    ['下班倒计时不是建议，是劳动合同的片尾字幕', '字幕已经滚起来了，临时需求请等待下一集。']
  ],
  checkout: [
    ['到点了，请立即停止出售人生', '今天的工作已经获得了足够多的你。后面的时间，请归还给你自己。'],
    ['撤离通道已开，工位无权扣留', '保存文件，合上电脑，把“再顺手一下”留给明天那个同样倒霉的你。'],
    ['公司今日使用额已尽', '继续坐着不会触发股权彩蛋，只会触发颈椎和晚饭的联合抗议。']
  ],
  overtime: [
    ['加班不会让你成为合伙人，只会让你更像耗材', '老板用一句“辛苦了”完成零成本激励，你用整个夜晚支付实际账单。'],
    ['公司没有离不开你，只是习惯了免费使用你的晚上', '你越沉默，临时需求越懂得挑软柿子。合上电脑，是今天最后一次需求管理。'],
    ['需求很急，奖金却表现得非常冷静', '既然回报没有进入紧急流程，你的私人时间也没有义务绿色通行。'],
    ['老板的梦想正在融资，你的晚饭正在失温', '别用自己的生活给别人的商业计划做无息贷款。现在撤资，还来得及。'],
    ['你以为在救项目，项目以为这是你的正常产能', '今晚的英雄主义，会变成下周排期表里理所当然的一行数字。'],
    ['再坐一会儿不会触发股权彩蛋', '最多触发保洁阿姨看你的眼神：这家公司到底给了你多少？'],
    ['工作终于拥有了无限生命，可惜你没有', '把无限任务留给明天，把有限的晚上还给自己。'],
    ['公司让你把这里当家，你可别真住下', '家里至少不会用“顺手改一下”测试你对边界的理解。'],
    ['你多改一版，老板不会多分你一份', '公司拿走的是成品，你留下的是胃疼、凌晨和一句轻飘飘的“不错”。'],
    ['继续免费加班，是在训练公司如何更便宜地使用你', '今天送出去的一小时，明天就会被写进你的基础服务。'],
    ['别把能者多劳听成能者多熬', '任务落到你头上，不一定因为你最强，也可能因为你最不好意思拒绝。'],
    ['你不是项目的最后一道防线，你是被忘记下班的人', '系统不会被你的牺牲感动，只会把这次透支记成下一次的正常速度。']
  ],
  ready: [
    ['早上好，新的工位副本已刷新', '昨天没做完的事今天还在，说明你昨晚按时走完全没有耽误宇宙运行。'],
    ['电脑可以先开，灵魂不必秒到', '给自己几分钟缓冲。公司不会因为你少皱一次眉就立刻倒闭。'],
    ['恭喜再次被生活精准投放到工位', '记下到岗时间，然后进入科学省电模式。'],
    ['晨会还没开始，精神损耗已经预加载', '先记录到岗。至于热爱工作，等公司把它列进工资明细再说。'],
    ['新一天，新文档，新一轮假装一切尽在掌握', '点击到岗以后，马歇歇负责陪你把今天安全熬完。']
  ],
  off: [
    ['今日工作停止营业', '你已经不是在线客服。所有“在吗”统一由明天的你接待。'],
    ['自由到账，请查收', '今晚的 KPI：吃饭、发呆、拒绝回复收到。'],
    ['肉身与灵魂重新合并', '下班不是逃跑，是对明天还能来的一种必要保护。'],
    ['公司今天对你的使用权已经过期', '过期续费需要本人同意。今晚建议直接拒绝自动续订。'],
    ['工位已失去你的实时定位', '去吃饭、散步、发呆。任何不产生周报的事情都值得认真做。']
  ]
};

const healthStages = [
  { score: 100, title: '精神抖擞\n尚未被榨干', name: '健康 · 毛色发亮', stamp: '状态尚佳', copy: '眼睛有光，四蹄有力，看到下班按钮仍会条件反射般加速。', position: '97.8% 4.2%', color: '#43d38d' },
  { score: 78, title: '尚能营业\n但不建议加码', name: '疲惫 · 活人微死', stamp: '轻度掉血', copy: '眼神开始失焦，奶茶从饮料升级为维持系统运行的外接电源。', position: '2.2% 4.2%', color: '#ffdf32' },
  { score: 52, title: '真的病了\n别再歌颂奋斗', name: '生病 · 系统报警', stamp: '需要休养', copy: '持续疲惫、状态低落。这不是敬业勋章，是休息欠款。', position: '50% 4.2%', color: '#ff9f2e' },
  { score: 28, title: '慢性损耗\n工位拒不赔偿', name: '重度透支 · 强制劝退', stamp: '停止加班', copy: '加班正在从事件变成生活方式，马歇歇拒绝配合美化。', position: '2.2% 95.8%', color: '#ff6b43' },
  { score: 8, title: '癌症警报\n公司照常营业', name: '重症红区 · 癌症警报', stamp: '立即停工', copy: '你把身体熬成了红色预警，公司只会温柔地劝你“注意休息”，然后把需求转给下一个人。', position: '97.8% 95.8%', color: '#ff4c3e' },
  { score: 0, title: '马歇歇已下线\n需求仍没做完', name: '猝死结局 · 墓碑已送达', stamp: '停止压榨', copy: '马歇歇没等到年终奖，先等到了一块碑。', position: '50% 95.8%', color: '#11131a' }
];

const epitaphs = [
  '“今天不是你输给工作，是晚饭终于赢回了你。”', '“需求没有做完，但今天已经被你做完了。”',
  '“电脑还想留你，门禁说它不配。”', '“你没有抛弃工作，只是决定明天继续互相折磨。”',
  '“准时下班不是逃跑，是停止无息贷款自己的生命。”'
];

const radarMockPeople = Object.freeze([
  { name:'Excel在逃单元格·07', status:'摸鱼中', copy:'正在用条件格式假装很忙。', distance:'约 40m', distanceKm:.04, x:48, y:47, tone:'moyu' },
  { name:'键盘带薪呼吸员·53', status:'搬砖中', copy:'敲得很响，进度保持神秘。', distance:'约 90m', distanceKm:.09, x:54, y:45, tone:'work' },
  { name:'会议静音艺术家·21', status:'开会神游', copy:'摄像头关了，灵魂也顺便关了。', distance:'约 1.6km', distanceKm:1.6, x:72, y:29, tone:'moyu' },
  { name:'咖啡续命合伙人·44', status:'搬砖中', copy:'第三杯已经不是饮料，是外接电源。', distance:'约 2.7km', distanceKm:2.7, x:77, y:69, tone:'work' },
  { name:'需求第八版受害者·18', status:'加班中', copy:'嘴上说最后一版，文件名写着 final_8。', distance:'约 4.2km', distanceKm:4.2, x:26, y:73, tone:'late' },
  { name:'周报赛博难民·32', status:'摸鱼中', copy:'在写周报，也在怀疑这一周是否存在。', distance:'约 7.8km', distanceKm:7.8, x:54, y:17, tone:'moyu' }
]);

const radarMockMessages = Object.freeze([
  { from:'Excel在逃单元格·07', icon:'水', text:'给你递了一杯赛博温水：忙归忙，先喝两口。', time:'刚刚', distance:'约 40 米', unread:true },
  { from:'会议静音艺术家·21', icon:'鱼', text:'向你发送摸鱼暗号：老板来了就咳嗽。', time:'6 分钟前', distance:'约 1.6 公里', unread:true },
  { from:'下班撤退预备役·66', icon:'撤', text:'对你说：今天也要把完整的自己带回家。', time:'18 分钟前', distance:'约 2.1 公里', unread:true },
  { from:'咖啡续命合伙人·44', icon:'咖', text:'回应了你的“辛苦了”：收到，电量勉强续上。', time:'31 分钟前', distance:'约 2.7 公里', unread:false }
]);

const radarSignalCopy = Object.freeze({
  water: { label:'递杯水', icon:'水', text:'给你递了一杯赛博温水：忙归忙，先喝两口。' },
  moyu: { label:'摸鱼暗号', icon:'鱼', text:'向你发送摸鱼暗号：老板来了就咳嗽。' },
  encourage: { label:'辛苦了', icon:'撑', text:'对你说：辛苦了，今天也要把完整的自己带回家。' },
  reply: { label:'回个信号', icon:'收', text:'回了一个“收到”，你的工位电波已送达。' }
});

// 24 × 24 = 576 种基础搭配，再附加两位设备号；覆盖职场、松弛、文艺、社恐、赛博等气质。
const radarNameHeads = Object.freeze([
  '工位','摸鱼','咖啡','奶茶','周报','会议','需求','通勤','午休','下班','工资','灵魂',
  '赛博','文件','键盘','情绪','自由','月亮','海盐','霓虹','小狗','猫猫','蘑菇','宇宙'
]);
const radarNameTails = Object.freeze([
  '带薪呼吸员','在逃单元格','静音艺术家','续命合伙人','反卷特派员','退堂鼓鼓手',
  '摆烂哲学家','截止日浪人','发呆研究员','工位观察员','灵感流浪者','低电量选手',
  '社恐潜水员','E人播报员','朋克打卡人','佛系执行官','氛围组组长','周一幸存者',
  '下班守门员','文件考古员','已读不回侠','需求翻译官','心流失踪者','梦想临时工'
]);

function randomRadarName(previous = '') {
  let name = '';
  for (let attempt = 0; attempt < 8 && (!name || name === previous); attempt += 1) {
    const head = radarNameHeads[Math.floor(Math.random() * radarNameHeads.length)];
    const tail = radarNameTails[Math.floor(Math.random() * radarNameTails.length)];
    const suffix = String(Math.floor(Math.random() * 90) + 10);
    name = `${head}${tail}·${suffix}`;
  }
  return name;
}

function deviceRadarName() {
  const stored = localStorage.getItem(STORAGE.radarName)?.trim();
  if (stored) return stored;
  const name = randomRadarName();
  localStorage.setItem(STORAGE.radarName, name);
  return name;
}

function saveRadarName(value, { announce = true } = {}) {
  const name = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 18);
  if (!name) {
    if (announce) showToast('名称还没写', '输入一个匿名名称，或者点骰子随机生成。');
    els.radarNameInput?.focus();
    return false;
  }
  localStorage.setItem(STORAGE.radarName, name);
  if (els.radarNameInput) els.radarNameInput.value = name;
  if (els.radarSelfName) els.radarSelfName.textContent = name;
  if (announce) showToast('匿名工牌已更新', `附近工友会看到“${name}”。`);
  return true;
}

function radarRadius() {
  const value = Number(localStorage.getItem(STORAGE.radarRadius));
  return [1, 5, 50].includes(value) ? value : 5;
}

function renderRadarFeed(tab = els.radarShell?.dataset.feed || 'nearby') {
  if (!els.radarShell) return;
  const nextTab = tab === 'inbox' ? 'inbox' : 'nearby';
  els.radarShell.dataset.feed = nextTab;
  document.querySelectorAll('[data-radar-tab]').forEach((button) => {
    const active = button.dataset.radarTab === nextTab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  els.radarPeople.hidden = nextTab !== 'nearby';
  els.radarInbox.hidden = nextTab !== 'inbox';
}

const radarRealState = {
  status: 'idle',
  people: [],
  messages: [],
  unreadCount: 0,
  reason: '',
  errorCode: '',
  source: 'Cloudflare 私有数据库',
  writeConfigured: true,
  lastPosition: null
};
let radarSyncInFlight = false;
let radarRefreshTimer = null;
let radarSelectedPersonKey = '';
let radarLocationSettingsAwaitingFocus = false;

function radarPersonKey(person) {
  return String(person?.peerId || person?.id || person?.name || '');
}

function radarMessageTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', { month:'numeric', day:'numeric' });
}

function radarMessageDistance(message) {
  if (message?.distanceMeters == null) return '距离暂不可用';
  const meters = Number(message?.distanceMeters);
  if (!Number.isFinite(meters)) return '距离暂不可用';
  if (meters < 1000) return `约 ${Math.max(10, meters)} 米`;
  return `约 ${(meters / 1000).toFixed(1)} 公里`;
}

function radarProximity(person) {
  if (['within-50m', 'within-100m'].includes(person?.proximity)) return person.proximity;
  const distanceKm = Number(person?.distanceKm);
  if (Number.isFinite(distanceKm) && distanceKm <= .05) return 'within-50m';
  if (Number.isFinite(distanceKm) && distanceKm <= .1) return 'within-100m';
  return '';
}

function radarProximityLabel(proximity) {
  if (proximity === 'within-50m') return '就在身边 · 50米内';
  if (proximity === 'within-100m') return '很近 · 100米内';
  return '';
}

function radarPresence() {
  if (currentState === 'overtime') return { status:'加班中', copy:'工位续费中，晚饭正在失温。', tone:'late' };
  if (currentState === 'off' || currentState === 'checkout') return { status:'已下班', copy:'肉身已撤离，精神正在恢复出厂设置。', tone:'moyu' };
  if (currentState === 'ready') return { status:'摸鱼中', copy:'电脑已开，灵魂仍在尝试连接。', tone:'moyu' };
  return { status:'搬砖中', copy:'键盘营业中，工资保持冷静。', tone:'work' };
}

function radarEmptyCopy(mode, discovery, radius) {
  if (!discovery) return ['附近发现尚未开启', '点击上方开关；只有真实数据模式会读取并同步定位。'];
  if (mode === 'mock') return [`${radius}km 内暂时没信号`, '可以扩大扫描范围，或者安心独享这片摸鱼区。'];
  if (radarRealState.status === 'locating') return ['正在获取系统位置', 'Windows 首次定位可能需要几秒，请稍候。'];
  if (radarRealState.status === 'syncing') return ['位置已获取，正在连接云端', '正在上传匿名位置并获取附近工友。'];
  if (radarRealState.status === 'denied') return ['没有定位权限', radarRealState.reason || '请在系统设置中允许“马上下班”使用位置后再试。'];
  if (radarRealState.status === 'location-error') return ['系统暂时无法定位', radarRealState.reason || '请检查系统定位设置后重试。'];
  if (radarRealState.status === 'error') return ['真实数据暂时不可用', radarRealState.reason || '请检查网络后重试。'];
  return [`${radius}km 内暂时没有在线工友`, '仅显示最近 30 分钟主动开启附近发现的匿名用户。'];
}

function radarTroubleshootingSteps() {
  if (!['denied', 'location-error', 'error'].includes(radarRealState.status)) return [];
  if (['denied', 'location-error'].includes(radarRealState.status)) {
    if (window.desktop?.platform === 'win32') return [
      '打开 Windows 设置 → 隐私和安全性 → 位置',
      '开启“定位服务”和“允许应用访问你的位置”',
      '继续向下开启“允许桌面应用访问你的位置”',
      '完全关闭并重新打开马上下班，再点“重新尝试”'
    ];
    return [
      '打开系统设置 → 隐私与安全性 → 定位服务',
      '开启“定位服务”，并允许“马上下班”使用位置',
      '如果列表中没有马上下班，请完全退出应用后重新打开',
      '返回应用后点击“重新尝试”'
    ];
  }
  if (/cloudflare-timeout/.test(radarRealState.errorCode)) return [
    '确认电脑能够正常打开网页',
    '公司或校园网络可能拦截云端地址，可换手机热点测试',
    '网络恢复后点击“重新尝试”'
  ];
  return [
    '确认电脑已连接互联网',
    '换一个网络或手机热点后重试',
    '若其他设备也失败，请稍后再试'
  ];
}

function renderRadar(mode = localStorage.getItem(STORAGE.radarMode) || 'mock') {
  if (!els.radarShell) return;
  const nextMode = mode === 'real' ? 'real' : 'mock';
  const discovery = localStorage.getItem(STORAGE.radarDiscovery) === 'on';
  const radius = radarRadius();
  const sourcePeople = nextMode === 'mock' ? radarMockPeople : radarRealState.people;
  const people = discovery ? sourcePeople.filter((person) => person.distanceKm <= radius) : [];
  if (radarSelectedPersonKey && !people.some((person) => radarPersonKey(person) === radarSelectedPersonKey)) radarSelectedPersonKey = '';
  localStorage.setItem(STORAGE.radarMode, nextMode);
  els.radarShell.dataset.mode = nextMode;
  els.radarShell.dataset.discovery = discovery ? 'on' : 'off';
  els.radarShell.dataset.syncStatus = nextMode === 'real' ? radarRealState.status : 'mock';
  els.radarModeLabel.textContent = nextMode === 'mock' ? '本地示例数据' : '云端真实数据';
  els.radarModeToggle.textContent = nextMode === 'mock' ? '查看真实数据' : '查看 Mock 数据';
  const radarName = deviceRadarName();
  els.radarSelfName.textContent = radarName;
  if (document.activeElement !== els.radarNameInput) els.radarNameInput.value = radarName;
  els.radarDiscoveryToggle.setAttribute('aria-pressed', String(discovery));
  els.radarDiscoveryToggle.querySelector('strong').textContent = '附近发现';
  if (!discovery) els.radarDiscoveryStatus.textContent = nextMode === 'mock' ? '本地示例关闭 · 不读取真实位置' : '关闭时不读取位置，也不会出现在云端';
  else if (nextMode === 'mock') els.radarDiscoveryStatus.textContent = '本地示例已开启 · 不读取、不上传真实位置';
  else if (radarRealState.status === 'locating') els.radarDiscoveryStatus.textContent = '正在获取系统位置…';
  else if (radarRealState.status === 'syncing') els.radarDiscoveryStatus.textContent = '位置已获取 · 正在连接云端…';
  else if (radarRealState.status === 'denied') els.radarDiscoveryStatus.textContent = '定位未授权 · 未上传任何位置';
  else if (radarRealState.status === 'location-error') els.radarDiscoveryStatus.textContent = '系统定位失败 · 未上传任何位置';
  else if (radarRealState.status === 'error') els.radarDiscoveryStatus.textContent = '定位已开启 · 云端同步失败';
  else els.radarDiscoveryStatus.textContent = '定位已开启 · 已同步云端真实数据';
  els.radarRangeLabel.textContent = `扫描范围 · ${radius} KM`;
  document.querySelectorAll('[data-radar-radius]').forEach((button) => {
    const active = Number(button.dataset.radarRadius) === radius;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  els.radarNearbyCount.textContent = String(people.length);
  els.radarMoyuCount.textContent = String(people.filter((person) => person.tone === 'moyu').length);
  els.radarWorkingCount.textContent = String(people.filter((person) => person.tone !== 'moyu').length);
  els.radarBlips.innerHTML = people.map((person) => { const key = radarPersonKey(person); const proximity = radarProximity(person); return `<button class="radar-blip${key === radarSelectedPersonKey ? ' is-selected' : ''}" type="button" data-person-key="${escapeHTML(key)}" data-proximity="${escapeHTML(proximity)}" data-tone="${escapeHTML(person.tone)}" style="--x:${Number(person.x)}%;--y:${Number(person.y)}%" aria-pressed="${key === radarSelectedPersonKey}" aria-label="${escapeHTML(person.name)}，${escapeHTML(radarProximityLabel(proximity) || person.distance)}"><i></i><span>${escapeHTML(radarProximityLabel(proximity) || person.distance)}</span></button>`; }).join('');
  const [emptyTitle, emptyCopy] = radarEmptyCopy(nextMode, discovery, radius);
  const canRetry = nextMode === 'real' && discovery && ['denied', 'location-error', 'error'].includes(radarRealState.status);
  const troubleshootingSteps = canRetry ? radarTroubleshootingSteps() : [];
  const troubleshooting = troubleshootingSteps.length ? `<ol class="radar-troubleshooting">${troubleshootingSteps.map((step) => `<li>${escapeHTML(step)}</li>`).join('')}</ol>` : '';
  els.radarPeople.innerHTML = people.length
    ? people.map((person) => { const key = radarPersonKey(person); const proximity = radarProximity(person); const proximityLabel = radarProximityLabel(proximity); const target = nextMode === 'real' ? ` data-peer-id="${escapeHTML(person.peerId)}"` : ''; return `<article class="radar-person${key === radarSelectedPersonKey ? ' is-selected' : ''}" data-person-key="${escapeHTML(key)}"><div class="radar-person-top"><div class="radar-person-titleline"><strong class="radar-person-name">${escapeHTML(person.name)} · ${escapeHTML(person.status)}</strong>${proximityLabel ? `<span class="radar-proximity" data-proximity="${escapeHTML(proximity)}">${escapeHTML(proximityLabel)}</span>` : ''}</div><span class="radar-distance">${escapeHTML(person.distance)}</span></div><p>${escapeHTML(person.copy)}</p><div class="radar-person-actions"><button type="button" data-radar-action="递杯水" data-radar-signal="water" data-person="${escapeHTML(person.name)}"${target}>递杯水</button><button type="button" data-radar-action="摸鱼暗号" data-radar-signal="moyu" data-person="${escapeHTML(person.name)}"${target}>摸鱼暗号</button><button type="button" data-radar-action="辛苦了" data-radar-signal="encourage" data-person="${escapeHTML(person.name)}"${target}>辛苦了</button></div></article>`; }).join('')
    : `<div class="radar-list-empty"><strong>${escapeHTML(emptyTitle)}</strong><span>${escapeHTML(emptyCopy)}</span>${troubleshooting}${canRetry ? '<button class="radar-retry" type="button" data-radar-retry>重新尝试</button>' : ''}</div>`;
  els.radarInbox.innerHTML = nextMode === 'mock'
    ? radarMockMessages.map((message) => `<article class="radar-message${message.unread ? ' is-unread' : ''}"><span class="radar-message-icon">${message.icon}</span><div><div class="radar-message-meta"><strong>${message.from}</strong><time>${message.time}</time></div><span class="radar-message-distance">${message.distance}</span><p>${message.text}</p><button type="button" data-radar-reply="${message.from}">回个信号</button></div></article>`).join('')
    : (radarRealState.messages.length ? radarRealState.messages.map((message) => { const signal = radarSignalCopy[message.type] || radarSignalCopy.encourage; return `<article class="radar-message${message.unread ? ' is-unread' : ''}"><span class="radar-message-icon">${escapeHTML(signal.icon)}</span><div><div class="radar-message-meta"><strong>${escapeHTML(message.from)}</strong><time>${escapeHTML(radarMessageTime(message.createdAt))}</time></div><span class="radar-message-distance">${escapeHTML(radarMessageDistance(message))}</span><p>${escapeHTML(signal.text)}</p><button type="button" data-radar-reply="${escapeHTML(message.from)}" data-peer-id="${escapeHTML(message.fromDeviceId)}">回个信号</button></div></article>`; }).join('') : '<div class="radar-list-empty"><strong>收件箱还没有信号</strong><span>附近工友发来的匿名招呼会出现在这里。</span></div>');
  const inboxBadge = document.querySelector('[data-radar-tab="inbox"] b');
  if (inboxBadge) inboxBadge.textContent = String(nextMode === 'mock' ? 3 : radarRealState.unreadCount);
  const privacy = document.querySelector('.radar-privacy');
  if (privacy) privacy.textContent = nextMode === 'mock'
    ? '本地示例模式完全不读取定位。查看真实数据并主动开启后，才连接云端。'
    : '真实数据在云端约化到约 10 米网格并私密保存；消息保留 30 天，只返回约化距离，不返回对方经纬度。';
  renderRadarFeed();
}

function getRadarPosition() {
  return new Promise((resolve, reject) => {
    let settled = false;
    const guardTimeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(Object.assign(new Error('location-timeout'), { code:3 }));
    }, 12000);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(guardTimeout);
      callback(value);
    };
    navigator.geolocation.getCurrentPosition(
      (position) => finish(resolve, position),
      (error) => finish(reject, error),
      { enableHighAccuracy:false, timeout:10000, maximumAge:300000 }
    );
  });
}

function radarFailureCopy(reason) {
  if (/invalid-location/.test(reason)) return '系统返回的位置无效，请关闭后重新开启定位。';
  if (/cloudflare-timeout/.test(reason)) return '连接云端超时，请按下方步骤检查网络后重试。';
  if (/cloudflare-429|too-many-requests/.test(reason)) return '同步过于频繁，请稍等片刻后重试。';
  if (/cloudflare-5\d\d|server-error/.test(reason)) return '云端服务暂时繁忙，请稍后重试。';
  return '无法连接云端真实数据，请检查网络后重试。';
}

async function refreshRealRadar({ announce = false } = {}) {
  if (radarSyncInFlight || localStorage.getItem(STORAGE.radarMode) !== 'real' || localStorage.getItem(STORAGE.radarDiscovery) !== 'on') return;
  if (!navigator.geolocation || !window.desktop?.syncRadarLocation) {
    radarRealState.status = 'error';
    radarRealState.reason = '真实数据模式需要在桌面应用中运行。';
    renderRadar('real');
    return;
  }
  radarSyncInFlight = true;
  radarRealState.status = 'locating';
  radarRealState.reason = '';
  radarRealState.errorCode = '';
  renderRadar('real');
  try {
    const position = await getRadarPosition();
    radarRealState.lastPosition = { latitude:position.coords.latitude, longitude:position.coords.longitude };
    radarRealState.status = 'syncing';
    renderRadar('real');
    const presence = radarPresence();
    const result = await window.desktop.syncRadarLocation({
      ...radarRealState.lastPosition,
      name: deviceRadarName(),
      radius: radarRadius(),
      ...presence
    });
    radarRealState.people = Array.isArray(result?.people) ? result.people : [];
    radarRealState.messages = Array.isArray(result?.messages) ? result.messages : [];
    radarRealState.unreadCount = Number(result?.unreadCount) || 0;
    radarRealState.writeConfigured = Boolean(result?.writeConfigured);
    const failureCode = String(result?.reason || '');
    radarRealState.status = result?.ok ? 'ready' : 'error';
    radarRealState.errorCode = result?.ok ? '' : failureCode;
    radarRealState.reason = result?.ok ? '' : radarFailureCopy(failureCode);
    renderRadar('real');
    if (announce) showToast(result?.ok ? '真实数据已同步' : '真实数据同步失败', result?.ok ? `已更新位置，并找到 ${radarRealState.people.length} 位附近工友。` : radarRealState.reason);
  } catch (error) {
    radarRealState.people = [];
    const denied = error?.code === 1;
    radarRealState.status = denied ? 'denied' : 'location-error';
    radarRealState.errorCode = denied ? 'location-denied' : String(error?.message || 'location-unavailable');
    radarRealState.reason = denied
      ? '系统未授予定位权限。'
      : (window.desktop?.platform === 'win32'
        ? '请在 Windows“位置”设置中开启定位服务、应用位置权限和桌面应用位置权限。'
        : '系统定位服务未开启或暂时不可用。');
    renderRadar('real');
    if (announce && window.desktop?.openLocationSettings) {
      const settingsResult = window.desktop?.platform === 'win32' && window.desktop?.showLocationGuide
        ? await window.desktop.showLocationGuide()
        : await window.desktop.openLocationSettings();
      radarLocationSettingsAwaitingFocus = Boolean(settingsResult?.ok);
      if (settingsResult?.ok) showToast('已打开定位设置', window.desktop?.platform === 'win32' ? '请开启定位服务、允许应用访问位置、允许桌面应用访问位置；返回应用后会自动重试。' : '请开启“定位服务”并允许“马上下班”，返回应用后会自动重试。');
      else if (settingsResult?.canceled) showToast('暂未打开定位设置', '需要开启三个 Windows 定位选项后，其他设备才能看到你。');
      else showToast('无法自动打开定位设置', '请前往“系统设置 → 隐私与安全性 → 定位服务”手动开启。');
    } else if (announce) showToast('定位没有开启', radarRealState.reason);
  } finally {
    radarSyncInFlight = false;
  }
}

async function hideRealRadarPresence({ announce = false } = {}) {
  radarRealState.people = [];
  radarRealState.status = 'idle';
  renderRadar();
  if (!window.desktop?.hideRadarSelf) return;
  const result = await window.desktop.hideRadarSelf();
  radarRealState.writeConfigured = Boolean(result?.writeConfigured);
  if (announce && !result?.ok) showToast('本机已关闭附近发现', '云端暂时未能删除记录；记录超过 30 分钟后会自动离线。');
}

async function toggleRadarDiscovery() {
  const enabled = localStorage.getItem(STORAGE.radarDiscovery) === 'on';
  if (enabled) {
    localStorage.setItem(STORAGE.radarDiscovery, 'off');
    const wasReal = els.radarShell.dataset.mode === 'real';
    renderRadar();
    if (wasReal) await hideRealRadarPresence({ announce:true });
    showToast('附近发现已关闭', '位置不会继续读取，你也不会出现在别人的雷达里。');
    return;
  }
  if (els.radarShell.dataset.mode === 'mock') {
    localStorage.setItem(STORAGE.radarDiscovery, 'on');
    renderRadar();
    showToast('示例定位已开启', '这是 Mock 数据，不会读取或上传你的真实位置。');
    return;
  }
  localStorage.setItem(STORAGE.radarDiscovery, 'on');
  await refreshRealRadar({ announce:true });
}

function radarSendFailureCopy(reason) {
  if (/recipient-offline|recipient-unavailable/.test(reason)) return '对方已经离线，这次信号没能送达。';
  if (/too-many-requests|cloudflare-429/.test(reason)) return '信号发得太快了，等一分钟再试。';
  if (/sender-not-visible/.test(reason)) return '请先开启真实数据的“附近发现”。';
  return '云端暂时没收到信号，请稍后重试。';
}

async function sendRealRadarSignal({ type, toDeviceId, toName, button }) {
  if (!window.desktop?.sendRadarSignal || !toDeviceId) return showToast('无法发送', '真实通信需要在桌面应用中运行。');
  if (localStorage.getItem(STORAGE.radarDiscovery) !== 'on') return showToast('附近发现未开启', '开启后才能向附近工友发送信号。');
  if (button) button.disabled = true;
  const signal = radarSignalCopy[type] || radarSignalCopy.encourage;
  try {
    const result = await window.desktop.sendRadarSignal({ toDeviceId, fromName:deviceRadarName(), type });
    if (!result?.ok) return showToast('信号发送失败', radarSendFailureCopy(String(result?.reason || '')));
    showToast(`${signal.label}已发出`, `${toName || '对方'} 会在真实收件箱收到这条工位电波。`);
  } finally {
    if (button) button.disabled = false;
  }
}

async function markRealRadarInboxRead() {
  if (!radarRealState.unreadCount || !window.desktop?.markRadarMessagesRead) return;
  const result = await window.desktop.markRadarMessagesRead();
  if (!result?.ok) return;
  radarRealState.unreadCount = 0;
  radarRealState.messages = radarRealState.messages.map((message) => ({ ...message, unread:false }));
  renderRadar('real');
}

let currentState = 'ready';
let copyIndex = 0;
let lastCopyIndex = -1;
let shiftTimeEditing = false;
let startTimeBeforeEdit = '';
let planTimeBeforeEdit = '';
let audioContext;
let alarmPlaying = false;
let alarmKey = '';
let previousRemaining = null;
let iconImage;
let defaultIconImage;
let lastDockIconKey = '';
let lastHealthMinute = -1;
let actualHealthIndex = 0;
let actualHealthMinutes = 0;
let soundEnabled = localStorage.getItem(STORAGE.sound) !== 'off';
let voicePreviewIndex = 0;
let voiceRequestId = 0;
let availableUpdate = null;
let updateCheckTimer = null;
let notificationPromptVisible = false;
let notificationNeedsSettings = false;
let notificationSettingsAwaitingFocus = false;
let petEnabled = window.desktop?.getPetSettings ? false : localStorage.getItem(STORAGE.petEnabled) === 'on';
let petSettingsReady = Promise.resolve({ enabled: petEnabled });
let petTogglePending = false;
let autoCheckInEnabled = false;
let autoCheckInPending = false;
let lastPetStateKey = '';
let lastTodoDate = '';

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const timeText = (date = new Date()) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const parseJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } };
const getShift = () => parseJSON(STORAGE.shift, null);
const saveShift = (shift) => shift ? localStorage.setItem(STORAGE.shift, JSON.stringify(shift)) : localStorage.removeItem(STORAGE.shift);
const getRecords = () => { const value = parseJSON(STORAGE.records, []); return Array.isArray(value) ? value : []; };
const saveRecords = (records) => localStorage.setItem(STORAGE.records, JSON.stringify(records));
const getVentCounts = () => {
  const value = parseJSON(STORAGE.ventCounts, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};
const ventCountFor = (key = dateKey()) => Math.max(0, Number(getVentCounts()[key]) || 0);
function saveVentCount(key, count) {
  const counts = getVentCounts();
  counts[key] = Math.max(0, Number(count) || 0);
  localStorage.setItem(STORAGE.ventCounts, JSON.stringify(counts));
  renderVentCount();
}
function renderVentCount() {
  if (els.ventCount) els.ventCount.textContent = String(ventCountFor());
}
const minutesText = (minutes) => { const safe = Math.max(0, Math.round(minutes)); const h = Math.floor(safe / 60); const m = safe % 60; return h ? (m ? `${h} 小时 ${m} 分钟` : `${h} 小时`) : `${m} 分钟`; };
const compactDuration = (minutes) => `${pad(Math.floor(Math.max(0, minutes) / 60))}h ${pad(Math.max(0, Math.round(minutes)) % 60)}m`;

function getRetirementPlan() {
  const plan = parseJSON(STORAGE.retirementPlan, null);
  if (!plan || !Number.isInteger(Number(plan.currentAge)) || !Number.isInteger(Number(plan.targetAge))) return null;
  const currentAge = Number(plan.currentAge);
  const targetAge = Number(plan.targetAge);
  if (currentAge < 16 || currentAge > 99 || targetAge <= currentAge || targetAge > 100) return null;
  return { currentAge, targetAge, createdAt: plan.createdAt || new Date().toISOString() };
}

function retirementDaysLeft(plan, now = new Date()) {
  const startedAt = new Date(plan.createdAt);
  const safeStart = Number.isNaN(startedAt.getTime()) ? now : startedAt;
  const estimate = new Date(safeStart);
  estimate.setFullYear(estimate.getFullYear() + (plan.targetAge - plan.currentAge));
  return Math.max(0, Math.ceil((estimate - now) / 86400000));
}

function updateRetirementQuickAges() {
  const currentAge = Number(els.retirementCurrentAge?.value);
  const targetAge = Number(els.retirementTargetAge?.value);
  document.querySelectorAll('[data-retirement-age]').forEach((button) => {
    const age = Number(button.dataset.retirementAge);
    button.disabled = Number.isFinite(currentAge) && age <= currentAge;
    button.classList.toggle('is-selected', age === targetAge);
  });
}

function renderRetirementPlan({ editing = false } = {}) {
  if (!els.retirementShell) return;
  const plan = getRetirementPlan();
  const configured = Boolean(plan) && !editing;
  els.retirementShell.dataset.configured = String(configured);
  els.retirementAgeError.textContent = '';
  if (plan) {
    els.retirementCurrentAge.value = String(plan.currentAge);
    els.retirementTargetAge.value = String(plan.targetAge);
    els.retirementAgeSummary.textContent = `现在 ${plan.currentAge} 岁 · 计划 ${plan.targetAge} 岁退休`;
    els.retirementDays.textContent = new Intl.NumberFormat('zh-CN').format(retirementDaysLeft(plan));
    els.retirementYears.textContent = `大约还有 ${plan.targetAge - plan.currentAge} 年 · 不追求精确到某一天`;
  } else {
    els.retirementCurrentAge.value = '';
    els.retirementTargetAge.value = '';
    els.retirementDays.textContent = '—';
    els.retirementYears.textContent = '先设定一个大概年龄';
  }
  els.retirementPreviewOpen.disabled = !plan;
  els.retirementPreview.hidden = true;
  updateRetirementQuickAges();
  if (editing) requestAnimationFrame(() => els.retirementCurrentAge.focus());
}

const retirementBlindBoxes = [
  { key:'beach', day:365, label:'海边躺平', copy:'班味？不存在', image:'assets/retirement/beach-chair-v2.png', alt:'马歇歇戴着墨镜笑着躺在海边沙滩椅上喝冰饮' },
  { key:'ski', day:47, label:'雪山开溜', copy:'人生下坡路，我先滑为敬。', image:'assets/retirement/ski-v2.png', alt:'马歇歇笑着穿越雪山滑雪' },
  { key:'dive', day:128, label:'海底摸鱼', copy:'下潜两万里，烦恼已失联。', image:'assets/retirement/dive-v2.png', alt:'马歇歇开心地在珊瑚礁间潜水' },
  { key:'tv', day:23, label:'沙发包场', copy:'沙发登基，遥控器传国玉玺。', image:'assets/retirement/tv-v2.png', alt:'马歇歇穿着睡衣在沙发上大笑着看电视' },
  { key:'park', day:188, label:'公园巡视', copy:'公园走一圈，烦恼自动掉线。', image:'assets/retirement/park-v2.png', alt:'马歇歇笑着在阳光下的公园池塘边散步' },
  { key:'absurd', day:777, label:'宇宙出走', copy:'退休星球已登录，地球稍后回。', image:'assets/retirement/absurd-space-v2.png', alt:'马歇歇坐着喷气办公椅在宇宙中得意喝茶' },
  { key:'phone', day:58, label:'被窝续费', copy:'被窝续费成功，起床申请驳回。', image:'assets/retirement/bed-phone-v2.png', alt:'马歇歇笑着躺在床上盖着被子玩手机' },
  { key:'space', day:1001, label:'太空散步', copy:'地球太挤，出来透口气。', image:'assets/retirement/space-travel-v1.png', alt:'马歇歇开心地遨游太空' },
  { key:'river-run', day:92, label:'江边撒欢', copy:'江风负责吹，我负责撒欢。', image:'assets/retirement/river-run-v1.png', alt:'马歇歇笑着沿江边跑步' },
  { key:'concert', day:520, label:'现场蹦迪', copy:'前排已到位，青春重新开机。', image:'assets/retirement/concert-back-v2.png', alt:'马歇歇背对画面举手机观看红色灯光下的乐队演出' },
  { key:'aurora', day:666, label:'极光长夜', location:'冰岛 · 斯托克角', copy:'极光开灯，今晚宇宙请客。', image:'assets/retirement/iceland-aurora-v2.png', alt:'小小的马歇歇背对画面站在冰湖边仰望极光与群山' },
  { key:'volcano', day:404, label:'火山围观', location:'美国 · 夏威夷火山', copy:'地球在冒泡，我在看热闹。', image:'assets/retirement/us-volcano-v2.png', alt:'小小的马歇歇背对画面站在远处观看熔岩喷泉' },
  { key:'norway', day:818, label:'雪城出片', location:'挪威 · 特罗姆瑟', copy:'这座城很冷，快门很热。', image:'assets/retirement/norway-photographer-back-v1.png', alt:'马歇歇背对画面拍摄挪威峡湾雪城与大桥' },
  { key:'reading', day:216, label:'窗边翻书', copy:'书翻到哪，日子就过到哪。', image:'assets/retirement/reading-window-v1.png', alt:'马歇歇坐在绿景落地窗与白色纱帘旁看书' },
  { key:'bar', day:330, label:'小酌一下', copy:'今晚微醺，明天继续自由。', image:'assets/retirement/bar-v1.png', alt:'马歇歇在酒吧里开心喝酒' },
  { key:'robot', day:909, label:'家务托管', copy:'家务外包，快乐全款到账。', image:'assets/retirement/robot-cleaning-v1.png', alt:'马歇歇在家休息时机器人帮忙打扫卫生' },
  { key:'fuji', day:315, label:'湖畔出片', location:'日本 · 河口湖', copy:'富士山营业，我负责出片。', image:'assets/retirement/fuji-cherry-v2.png', alt:'小小的马歇歇站在河口湖栈桥尽头拍摄晨光中的富士山' },
  { key:'egypt', day:712, label:'沙漠巡游', location:'埃及 · 吉萨金字塔', copy:'金字塔很稳，我更悠闲。', image:'assets/retirement/egypt-pyramids-v2.png', alt:'小小的马歇歇背对画面骑在落日驼队末尾远望吉萨金字塔' },
  { key:'paris', day:260, label:'蓝调漫步', location:'法国 · 塞纳河', copy:'雨落塞纳河，铁塔替黄昏亮灯。', image:'assets/retirement/paris-eiffel-v2.png', alt:'小小的马歇歇背对画面沿雨后的塞纳河畔走向埃菲尔铁塔' },
  { key:'socotra', day:1314, label:'异星徒步', location:'也门 · 迪克萨姆高原', copy:'地球隐藏地图，已被我刷到。', image:'assets/retirement/socotra-dragon-blood-v3.png', alt:'马歇歇背对画面站在迪克萨姆高原的龙血树山路上' },
  { key:'cappadocia', day:5200, label:'热气球清晨', location:'土耳其 · 卡帕多奇亚', copy:'风从峡谷醒来，热气球飘向天光。', image:'assets/retirement/cappadocia-balloon-v3.png', alt:'穿浅米白外套的马歇歇站在卡帕多奇亚观景坡上看热气球升空' },
  { key:'antarctica', day:888, label:'邮轮巡游', location:'南极半岛', copy:'雪山负责壮观，我负责发呆。', image:'assets/retirement/antarctica-cruise-v2.png', alt:'小小的马歇歇坐在南极邮轮甲板上欣赏辽阔雪山与浮冰海面' },
  { key:'phuket-town', day:413, label:'老街散步', location:'泰国 · 普吉镇', copy:'晚霞落街，今天只逛不赶。', image:'assets/retirement/phuket-town-v1.png', alt:'马歇歇在粉橙晚霞与串灯下漫步普吉镇老街' },
  { key:'phi-phi', day:621, label:'海岛泡夏天', location:'泰国 · 皮皮岛', copy:'泰兰德夏天永不停歇。', image:'assets/retirement/phi-phi-island-v1.png', alt:'马歇歇背对画面走进皮皮岛碧绿浅海与石灰岩海湾' },
  { key:'diamond-beach', day:319, label:'踏冰看海', location:'冰岛 · 钻石沙滩', copy:'冰块在晒太阳，我在旁边发光。', image:'assets/retirement/iceland-diamond-beach-v1.png', alt:'马歇歇背对画面站在冰岛钻石沙滩的冰块上张开双手' },
  { key:'desert-rose', day:1315, label:'沙漠花开', location:'也门 · 索科特拉岛', copy:'沙漠开花，荒凉也有浪漫。', image:'assets/retirement/socotra-desert-rose-v1.png', alt:'马歇歇坐在索科特拉岛海湾旁欣赏盛开的沙漠玫瑰' }
];
retirementBlindBoxes.forEach((scene) => { const image = new Image(); image.src = scene.image; });
let retirementBlindBoxIndex = -1;
let retirementBlindBoxDeck = [];

function retirementRandomIndex(limit) {
  if (limit <= 1) return 0;
  if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * limit);
  const range = 0x100000000;
  const cutoff = range - (range % limit);
  const value = new Uint32Array(1);
  do window.crypto.getRandomValues(value); while (value[0] >= cutoff);
  return value[0] % limit;
}

function drawRetirementBlindBox() {
  if (!retirementBlindBoxDeck.length) {
    retirementBlindBoxDeck = retirementBlindBoxes.map((_, index) => index);
    for (let index = retirementBlindBoxDeck.length - 1; index > 0; index -= 1) {
      const swapIndex = retirementRandomIndex(index + 1);
      [retirementBlindBoxDeck[index], retirementBlindBoxDeck[swapIndex]] = [retirementBlindBoxDeck[swapIndex], retirementBlindBoxDeck[index]];
    }
    if (retirementBlindBoxDeck.length > 1 && retirementBlindBoxDeck[0] === retirementBlindBoxIndex) {
      const swapIndex = 1 + retirementRandomIndex(retirementBlindBoxDeck.length - 1);
      [retirementBlindBoxDeck[0], retirementBlindBoxDeck[swapIndex]] = [retirementBlindBoxDeck[swapIndex], retirementBlindBoxDeck[0]];
    }
  }
  const nextIndex = retirementBlindBoxDeck.shift();
  retirementBlindBoxIndex = nextIndex;
  const scene = retirementBlindBoxes[nextIndex];
  els.retirementPreview.dataset.scene = scene.key;
  els.retirementPreviewImage.src = scene.image;
  els.retirementPreviewImage.alt = scene.alt;
  els.retirementPreviewMeta.textContent = scene.location
    ? `退休第 ${scene.day} 天 · 📍 ${scene.location} · ${scene.label}`
    : `退休第 ${scene.day} 天 · ${scene.label}`;
  els.retirementPreviewCopyline.textContent = scene.copy;
}

const workPersonas = [
  { max: 60, title: '工位闪现型选手', copy: '来过，坐过，主打一个不留证据。' },
  { max: 240, title: '半日体验卡用户', copy: '工作浅尝一下，生活才是正式服。' },
  { max: 360, title: '带薪呼吸守门员', copy: '活干了一些，命成功保住大半。' },
  { max: 480, title: '标准工位人质', copy: '卡着合理区间，拒绝主动加戏。' },
  { max: 540, title: '班味轻度腌制', copy: '再泡一会儿，就该彻底入味了。' },
  { max: 600, title: '工位钉子户预备役', copy: '人已经想走，椅子坚持续约。' },
  { max: 660, title: '需求区常驻 NPC', copy: '谁路过都能顺手给你派个任务。' },
  { max: 720, title: '人形加班包月卡', copy: '公司付一份工资，解锁全天候使用。' },
  { max: 840, title: '赛博拉磨永动马', copy: '眼里没光，企业微信倒是一直亮着。' },
  { max: Infinity, title: '年终奖赛博守灵人', copy: '奖还没影，你已经提前开始守夜。' }
];
function renderWorkPersona(minutes, hasWorkData = true) {
  if (!hasWorkData) {
    els.ledgerPersonaTitle.textContent = '打工人格尚未生成';
    els.ledgerPersonaCopy.textContent = '先完成一次打卡，让工时替你做人格鉴定。';
    return;
  }
  const persona = workPersonas.find((item) => minutes < item.max) || workPersonas.at(-1);
  els.ledgerPersonaTitle.textContent = persona.title;
  els.ledgerPersonaCopy.textContent = persona.copy;
}
const humanDuration = (minutes) => { const safe = Math.max(0, Math.round(minutes)); return `${Math.floor(safe / 60)} 小时 ${safe % 60} 分钟`; };
const overtimeWords = (seconds) => {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
};

const WORKDAY_DURATION_MS = 9 * 60 * 60 * 1000;

function isWeekend(dateLike = new Date()) {
  const date = new Date(dateLike);
  return !Number.isNaN(date.getTime()) && (date.getDay() === 0 || date.getDay() === 6);
}

function plannedEndFor(startedAt) {
  const start = new Date(startedAt);
  return new Date(start.getTime() + WORKDAY_DURATION_MS);
}

function overtimeMinutesForShift(shift, endedAt = new Date()) {
  const start = new Date(shift?.startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (isWeekend(start)) return Math.max(0, Math.round((end - start) / 60000));
  const plannedEnd = new Date(shift?.plannedEndAt);
  if (Number.isNaN(plannedEnd.getTime())) return 0;
  return Math.max(0, Math.round((end - plannedEnd) / 60000));
}

function calendarDayOffset(from, to) {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toDay - fromDay) / 86400000);
}

function renderShiftDates(shift, now = new Date()) {
  const storedStart = new Date(shift?.startedAt);
  const start = !shift || Number.isNaN(storedStart.getTime()) ? now : storedStart;
  const storedEnd = new Date(shift?.plannedEndAt);
  const end = !shift || Number.isNaN(storedEnd.getTime()) ? plannedEndFor(start) : storedEnd;
  const endOffset = calendarDayOffset(start, end);
  els.startDate.textContent = '今天';
  els.planDate.textContent = endOffset > 0 ? '明天' : '今天';
  els.startDate.dataset.relative = 'today';
  els.planDate.dataset.relative = endOffset > 0 ? 'next' : 'today';
  els.planDate.setAttribute('aria-label', `计划下班日期：${els.planDate.textContent}。点击切换为${endOffset > 0 ? '今天' : '明天'}`);
  els.startTime.setAttribute('aria-label', `上班打卡时间，日期 ${els.startDate.textContent}，可点击修改时间`);
  els.planTime.setAttribute('aria-label', `计划下班时间，日期 ${els.planDate.textContent}，默认按上班时间加九小时，可点击修改时间`);
}

function plannedEndFromClock(startedAt, plan, preferredDayOffset = null) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(plan)) return null;
  const [hours, minutes] = plan.split(':').map(Number);
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const plannedEnd = new Date(start);
  plannedEnd.setHours(hours, minutes, 0, 0);
  if (preferredDayOffset === 0 || preferredDayOffset === 1) {
    plannedEnd.setDate(start.getDate() + preferredDayOffset);
  } else if (plannedEnd <= start) {
    plannedEnd.setDate(plannedEnd.getDate() + 1);
  }
  return plannedEnd;
}

function startFromClock(shift, clock) {
  if (!shift?.startedAt || !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) return null;
  const [hours, minutes] = clock.split(':').map(Number);
  const original = new Date(shift.startedAt);
  const plannedEnd = new Date(shift.plannedEndAt);
  if (Number.isNaN(original.getTime()) || Number.isNaN(plannedEnd.getTime())) return null;
  const candidate = new Date(original);
  candidate.setHours(hours, minutes, 0, 0);
  // The control edits a clock, not a calendar date. Keep the original local
  // check-in date even for a shift that continues past midnight; otherwise an
  // invalid late clock could silently jump back to the previous day.
  return candidate < plannedEnd ? candidate : null;
}

function defaultResetAtForStart(startedAt) {
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const resetAt = new Date(start);
  resetAt.setHours(8, 0, 0, 0);
  if (start >= resetAt) resetAt.setDate(resetAt.getDate() + 1);
  return resetAt;
}

function resetAtAfterPlannedEnd(plannedEndAt) {
  const plannedEnd = new Date(plannedEndAt);
  if (Number.isNaN(plannedEnd.getTime())) return null;
  const resetAt = new Date(plannedEnd);
  resetAt.setHours(8, 0, 0, 0);
  if (resetAt <= plannedEnd) resetAt.setDate(resetAt.getDate() + 1);
  return resetAt;
}

function normalizeShiftPlan(shift) {
  if (!shift?.startedAt || Number.isNaN(new Date(shift.startedAt).getTime())) return shift;
  if (!shift.shiftId) {
    shift = { ...shift, shiftId: `shift-${new Date(shift.startedAt).getTime()}` };
    saveShift(shift);
  }
  if (!shift.resetAt || Number.isNaN(new Date(shift.resetAt).getTime())) {
    const resetAt = defaultResetAtForStart(shift.startedAt);
    shift = { ...shift, resetAt: resetAt?.toISOString() };
    saveShift(shift);
  }
  const storedEnd = new Date(shift.plannedEndAt);
  if (!Number.isNaN(storedEnd.getTime())) {
    const storedPlan = timeText(storedEnd);
    if (shift.plan === storedPlan) return shift;
    const normalized = { ...shift, plan: storedPlan };
    saveShift(normalized);
    return normalized;
  }
  const plannedEnd = plannedEndFromClock(shift.startedAt, shift.plan, shift.planDayOffset) || plannedEndFor(shift.startedAt);
  const plan = timeText(plannedEnd);
  const normalized = { ...shift, plan, plannedEndAt: plannedEnd.toISOString() };
  saveShift(normalized);
  return normalized;
}

function resetAtForShift(shift) {
  const stored = new Date(shift?.resetAt);
  if (!Number.isNaN(stored.getTime())) return stored;
  return defaultResetAtForStart(shift?.startedAt);
}

function archiveMissedCheckout(shift) {
  const records = getRecords();
  if (records.some((record) => record.startedAt === shift.startedAt)) return;
  records.push({ ...shift, endedAt: null, overtimeMinutes: 0, missedCheckout: true });
  saveRecords(records);
}

function getState(now = new Date(), { preserveActiveShift = false } = {}) {
  let shift = getShift();
  if (!shift) return { name: 'ready', seconds: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(), shift: null };
  shift = normalizeShiftPlan(shift);
  if (!preserveActiveShift && now >= resetAtForShift(shift)) {
    if (!shift.endedAt) archiveMissedCheckout(shift);
    saveShift(null);
    window.desktop?.syncReminderSchedule?.(null);
    return { name: 'ready', seconds: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(), shift: null };
  }
  if (shift.endedAt) {
    return { name: 'off', seconds: new Date(shift.endedAt).getHours() * 3600 + new Date(shift.endedAt).getMinutes() * 60, shift };
  }
  const end = new Date(shift.plannedEndAt);
  const difference = Math.round((end - now) / 1000);
  if (difference > 30 * 60) return { name: 'working', seconds: difference, shift };
  if (difference > 0) return { name: 'near', seconds: difference, shift };
  if (difference > -60) return { name: 'checkout', seconds: 0, shift };
  return { name: 'overtime', seconds: Math.abs(difference), shift };
}

function formatOvertimeIconDuration(seconds) {
  const totalMinutes = Math.max(0, Math.floor(Number(seconds) / 60));
  if (totalMinutes < 60) return `${totalMinutes}分钟`;
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}小时`;
}

function renderTimer(seconds, state) {
  const clockMode = state === 'ready' || state === 'off';
  if (state === 'overtime') {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    els.timer.innerHTML = hours
      ? `<span>${pad(hours)}</span><i class="colon">:</i><span>${pad(minutes)}</span>`
      : `<span>${pad(minutes)}</span><i class="colon">:</i><span>${pad(secs)}</span>`;
    els.timerNote.textContent = '';
    els.iconBadge.textContent = formatOvertimeIconDuration(seconds);
    return;
  }
  const hours = clockMode ? Math.floor(seconds / 3600) % 24 : Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  els.timer.innerHTML = `<span>${pad(hours)}</span><i class="colon">:</i><span>${pad(minutes)}</span><i class="colon">:</i><span>${pad(secs)}</span>`;
  els.timerNote.textContent = '';
}

function applyState(name) {
  const data = stateContent[name];
  currentState = name;
  app.dataset.state = data.shell;
  app.dataset.phase = name;
  els.statePill.textContent = data.pill;
  els.heroTitle.innerHTML = data.title.replace('\n', '<br>');
  els.heroCopy.textContent = data.copy;
  els.timerLabel.textContent = data.label;
  els.topStatus.textContent = data.top;
  els.heroAvatar.style.backgroundPosition = data.position;
  els.heroAvatar.setAttribute('aria-label', data.mascot);
  els.progressCopy.textContent = data.progress;
  const offButtonLabels = $('#off-button')?.querySelectorAll('span');
  if (offButtonLabels?.length) {
    const early = name === 'working' || name === 'near';
    offButtonLabels[0].textContent = early ? '提前下班' : '能下班了吗？';
    offButtonLabels[1].textContent = early ? '提前打烊 →' : '我要下班了 →';
    $('#off-button').classList.remove('is-armed');
  }
  if (['near', 'checkout', 'overtime'].includes(name)) els.todoComposer.classList.remove('is-open');
  updateCopy();
  renderNotificationExperience();
}

function updateCopy() {
  const bank = copyBanks[currentState === 'checkout' ? 'checkout' : currentState] || copyBanks.working;
  let index = currentState === 'overtime' ? Math.floor(Math.random() * bank.length) : copyIndex % bank.length;
  if (bank.length > 1 && index === lastCopyIndex) index = (index + 1) % bank.length;
  lastCopyIndex = index;
  const item = bank[index];
  els.heroCopy.textContent = `${item[0]}。${item[1]}`;
  els.notificationTitle.textContent = item[0];
  els.notificationCopy.textContent = item[1];
  if (currentState === 'overtime') {
    els.overtimeTitle.textContent = item[0];
    els.overtimeCopy.textContent = item[1];
  }
}

function updateProgress(now, stateInfo) {
  const shift = stateInfo.shift;
  if (!shift) {
    els.progressFill.style.width = '0%'; els.progressPerson.style.left = '4%'; els.progressTitle.textContent = '老板今日已消耗你 0%';
    els.workedDuration.textContent = '00h 00m'; els.sideProgress.textContent = '0%'; els.sideProgressLabel.textContent = 'DAY PROGRESS / 真实进度';
    if (document.activeElement !== els.startTime) els.startTime.value = '';
    return;
  }
  const start = new Date(shift.startedAt);
  const end = new Date(shift.plannedEndAt);
  const total = Math.max(1, end - start);
  const until = shift.endedAt ? new Date(shift.endedAt) : now;
  const worked = Math.max(0, Math.round((until - start) / 60000));
  const rawProgress = Math.max(0, ((until - start) / total) * 100);
  const progress = Math.min(100, rawProgress);
  els.progressFill.style.width = `${progress}%`; els.progressPerson.style.left = `${Math.min(96, Math.max(4, progress))}%`;
  els.workedDuration.textContent = compactDuration(worked);
  if (document.activeElement !== els.startTime) els.startTime.value = timeText(start);
  if (stateInfo.name === 'off') {
    renderCheckoutReport(shift);
  }
  if (stateInfo.name === 'overtime') {
    const overtime = `超时 ${overtimeWords(stateInfo.seconds)}`;
    els.progressTitle.textContent = overtime;
    els.sideProgress.textContent = overtime;
    els.sideProgressLabel.textContent = 'OVERTIME / 超时计时';
  } else {
    els.progressTitle.textContent = `老板今日已消耗你 ${Math.round(rawProgress)}%`;
    els.sideProgress.textContent = `${Math.round(rawProgress)}%`;
    els.sideProgressLabel.textContent = 'DAY PROGRESS / 真实进度';
  }
}

function fitOffSummaryDuration() {
  const max = 15;
  const min = 8;
  document.querySelectorAll('.report-metric strong').forEach((element) => {
    if (!element.clientWidth) return;
    element.style.fontSize = `${max}px`;
    const available = element.clientWidth;
    const required = element.scrollWidth;
    const fitted = required > available ? Math.max(min, Math.floor(max * available / required)) : max;
    element.style.fontSize = `${fitted}px`;
  });
}

function stageForMinutes(minutes) {
  const hours = minutes / 60;
  return hours < 5 ? 0 : hours < 15 ? 1 : hours < 25 ? 2 : hours < 40 ? 3 : hours < 50 ? 4 : 5;
}

function healthScoreForMinutes(minutes) {
  return Math.max(0, Math.round(100 - (Math.max(0, minutes) / 60) * 2));
}

function monthlyOvertimeMinutes() {
  const prefix = dateKey().slice(0, 7);
  const recorded = getRecords().filter((record) => String(record.date || '').startsWith(prefix)).reduce((sum, record) => {
    const minutes = record.endedAt && !record.missedCheckout
      ? overtimeMinutesForShift(record, new Date(record.endedAt))
      : Math.max(0, Number(record.overtimeMinutes) || 0);
    return sum + minutes;
  }, 0);
  const shift = getShift();
  const live = shift && !shift.endedAt && String(shift.date || '').startsWith(prefix)
    ? overtimeMinutesForShift(shift)
    : 0;
  return recorded + live;
}

function renderHealthView(index, minutes, preview = false) {
  const stage = healthStages[index];
  const liveScore = healthScoreForMinutes(minutes);
  els.healthShell.dataset.severity = String(index); els.healthMascot.dataset.severity = String(index);
  els.healthTitle.innerHTML = stage.title.replace('\n', '<br>');
  els.healthStamp.textContent = stage.stamp; els.healthScore.textContent = liveScore;
  els.healthSummary.textContent = `本月累计加班 ${minutesText(minutes)}。${index === 0 ? '马歇歇目前状态正常，请不要把这理解成可以继续加码。' : stage.copy}`;
  els.healthStageName.textContent = stage.name; els.healthStageCopy.textContent = stage.copy;
  els.healthHours.textContent = `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)}h`; els.healthMeterFill.style.width = `${liveScore}%`;
  els.healthMeterFill.style.background = stage.color;
  document.querySelectorAll('.health-stage-button').forEach((item, itemIndex) => {
    item.classList.toggle('is-current', itemIndex === actualHealthIndex);
    item.classList.toggle('is-active', itemIndex === index);
    item.classList.toggle('is-previewing', preview && itemIndex === index);
  });
  els.healthPreviewNotice.hidden = !preview;
  if (preview) els.healthPreviewCopy.textContent = `正在预览「${stage.name.split(' · ')[0]}」；你的真实状态仍是「${healthStages[actualHealthIndex].name.split(' · ')[1] || healthStages[actualHealthIndex].name}」。`;
}

function renderHealth() {
  actualHealthMinutes = monthlyOvertimeMinutes();
  actualHealthIndex = stageForMinutes(actualHealthMinutes);
  const actualScore = healthScoreForMinutes(actualHealthMinutes);
  els.healthMiniScore.textContent = String(actualScore);
  els.healthMiniScore.setAttribute('aria-label', `马生生命值 ${actualScore}`);
  els.healthShortcut.dataset.healthLevel = actualHealthIndex >= 5 ? 'dead' : actualHealthIndex >= 3 ? 'danger' : actualHealthIndex >= 1 ? 'warning' : 'good';
  els.healthMiniText.textContent = `本月加班 ${minutesText(actualHealthMinutes)} · 去看看你马还好吗`;
  renderHealthView(actualHealthIndex, actualHealthMinutes, false);
}

function checkoutReportForShift(shift) {
  if (!shift?.startedAt || !shift?.endedAt) return null;
  const start = new Date(shift.startedAt);
  const end = new Date(shift.endedAt);
  const plannedEnd = new Date(shift.plannedEndAt);
  const actualMinutes = Math.max(0, Math.round((end - start) / 60000));
  const overtimeMinutes = overtimeMinutesForShift(shift, end);
  const saved = shift.report || {};
  const healthAfter = Number.isFinite(Number(saved.healthAfter)) ? Number(saved.healthAfter) : healthScoreForMinutes(monthlyOvertimeMinutes());
  const healthBefore = Number.isFinite(Number(saved.healthBefore)) ? Number(saved.healthBefore) : Number.isFinite(Number(shift.healthScoreAtStart)) ? Number(shift.healthScoreAtStart) : healthAfter;
  return {
    date: shift.date || dateKey(start),
    start: timeText(start),
    end: timeText(end),
    actualMinutes,
    overtimeMinutes,
    ventCount: Math.max(0, Number(saved.ventCount ?? ventCountFor(shift.date)) || 0),
    healthBefore,
    healthAfter,
    completedTodos: Math.max(0, Number(saved.completedTodos) || 0),
    deferredTodos: Math.max(0, Number(saved.deferredTodos) || 0),
    epitaph: saved.epitaph || shift.epitaph || epitaphs[0],
    stamp: isWeekend(start) && overtimeMinutes > 0 ? '周末加班' : saved.stamp || (overtimeMinutes > 0 ? '加班收工' : end < plannedEnd ? '提前收工' : '准点下班')
  };
}

function renderCheckoutReport(shift) {
  const report = checkoutReportForShift(shift);
  if (!report) return;
  els.reportDate.textContent = report.date.replaceAll('-', ' / ');
  els.reportStamp.textContent = report.stamp;
  els.reportStart.textContent = report.start;
  els.reportEnd.textContent = report.end;
  els.offSummaryDuration.textContent = humanDuration(report.actualMinutes);
  els.reportOvertime.textContent = report.overtimeMinutes ? `+${minutesText(report.overtimeMinutes)}` : '0 分钟';
  els.reportVent.textContent = `${report.ventCount} 敲`;
  els.reportHealth.textContent = `${report.healthBefore} → ${report.healthAfter}`;
  els.reportEpitaph.textContent = report.epitaph;
  els.reportTodos.textContent = `完成 ${report.completedTodos} 件 · 延期 ${report.deferredTodos} 件`;
  requestAnimationFrame(fitOffSummaryDuration);
}

function desktopPetStage(stateInfo, now = new Date()) {
  const shift = stateInfo.shift;
  if (stateInfo.name === 'ready') return 'ready';
  if (stateInfo.name === 'off') return 'off';
  if (stateInfo.name === 'near') return 'near';
  if (stateInfo.name === 'checkout') return 'checkout';
  if (stateInfo.name === 'overtime') {
    const minutes = stateInfo.seconds / 60;
    return minutes < 30 ? 'overtime1' : minutes < 60 ? 'overtime2' : minutes < 120 ? 'overtime3' : 'overtime4';
  }
  const workedHours = shift?.startedAt ? Math.max(0, (now - new Date(shift.startedAt)) / 3600000) : 0;
  return workedHours < 2 ? 'early' : workedHours < 4 ? 'steady' : workedHours < 6 ? 'tired' : 'weary';
}

function desktopPetPayload(stateInfo = getState(), now = new Date()) {
  const shift = stateInfo.shift;
  const workedMinutes = shift?.startedAt ? Math.max(0, Math.round((now - new Date(shift.startedAt)) / 60000)) : 0;
  return {
    stage: desktopPetStage(stateInfo, now),
    appState: stateInfo.name,
    shiftId: shift?.shiftId || shift?.startedAt || null,
    workedMinutes,
    remainingSeconds: stateInfo.name === 'overtime' ? -stateInfo.seconds : stateInfo.seconds,
    healthScore: Math.max(0, Math.round(100 - (actualHealthMinutes / 60) * 2)),
    healthLevel: actualHealthIndex,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    updatedAt: now.toISOString()
  };
}

function syncDesktopPet(stateInfo = getState(), now = new Date(), force = false) {
  if (!window.desktop?.syncPetState) return;
  const payload = desktopPetPayload(stateInfo, now);
  const key = `${payload.stage}:${payload.healthLevel}:${payload.reducedMotion}:${Math.floor(payload.workedMinutes / 5)}:${Math.floor(payload.remainingSeconds / 60)}`;
  if (!force && key === lastPetStateKey) return;
  lastPetStateKey = key;
  window.desktop.syncPetState(payload);
}

function formatRecordDay(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return `${dateString.slice(5).replace('-', '/')} · ${['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]}`;
}

function recordDuration(record) {
  if (!record.startedAt) return 0;
  if (record.missedCheckout) return 0;
  return Math.max(0, Math.round(((record.endedAt ? new Date(record.endedAt) : new Date()) - new Date(record.startedAt)) / 60000));
}

function chartRow(record) {
  const start = new Date(record.startedAt); const end = record.missedCheckout ? new Date(record.plannedEndAt) : record.endedAt ? new Date(record.endedAt) : new Date();
  const overtimeMinutes = record.missedCheckout ? 0 : overtimeMinutesForShift(record, end);
  const startHour = start.getHours() + start.getMinutes() / 60; const endHour = end.getHours() + end.getMinutes() / 60 + (dateKey(end) !== dateKey(start) ? 24 : 0);
  const left = Math.max(0, Math.min(96, ((startHour - 8) / 14) * 100)); const width = Math.max(3, Math.min(100 - left, ((endHour - startHour) / 14) * 100));
  return `<div class="day-row"><div class="day-name"><strong>${formatRecordDay(record.date).split(' · ')[1]}</strong><span>${record.date.slice(5).replace('-', '/')}</span></div><div class="time-line"><span class="work-bar${overtimeMinutes > 0 ? ' is-late' : ''}" style="left:${left}%;width:${width}%"></span></div><div class="day-time">${timeText(start)} → ${record.missedCheckout ? '漏打卡' : record.endedAt ? timeText(end) : '在岗中'}</div></div>`;
}

function attendanceRecordDate(record) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(record?.date || '')) return record.date;
  const startedAt = new Date(record?.startedAt);
  return Number.isNaN(startedAt.getTime()) ? '' : dateKey(startedAt);
}

function attendanceRecordPriority(record) {
  if (record?.endedAt) return 3;
  if (!record?.missedCheckout) return 2;
  return 1;
}

function attendanceRecordTimestamp(record) {
  return new Date(record?.endedAt || record?.startedAt || 0).getTime() || 0;
}

function dedupeAttendanceRecords(records) {
  const byDate = new Map();
  (Array.isArray(records) ? records : []).forEach((source) => {
    const date = attendanceRecordDate(source);
    if (!date) return;
    const record = { ...source, date };
    const current = byDate.get(date);
    if (!current || attendanceRecordPriority(record) > attendanceRecordPriority(current) ||
      (attendanceRecordPriority(record) === attendanceRecordPriority(current) && attendanceRecordTimestamp(record) > attendanceRecordTimestamp(current))) {
      byDate.set(date, record);
    }
  });
  return [...byDate.values()].sort((left, right) => String(right.startedAt).localeCompare(String(left.startedAt)));
}

function hasUserLedgerData() {
  const ventCounts = getVentCounts();
  return Boolean(getShift() || getRecords().length || Object.values(ventCounts).some((count) => Number(count) > 0));
}

function renderUserData() {
  const rawStored = getRecords();
  const stored = dedupeAttendanceRecords(rawStored).map((record) => record.endedAt && !record.missedCheckout
    ? { ...record, overtimeMinutes: overtimeMinutesForShift(record, new Date(record.endedAt)) }
    : record);
  if (stored.length !== rawStored.length || stored.some((record, index) => record.date !== rawStored[index]?.date || record.startedAt !== rawStored[index]?.startedAt || record.overtimeMinutes !== rawStored[index]?.overtimeMinutes)) {
    saveRecords(stored);
  }
  const shift = getShift();
  const live = shift && !shift.endedAt ? [{ ...shift, date: attendanceRecordDate(shift), endedAt: null, overtimeMinutes: overtimeMinutesForShift(shift) }] : [];
  const liveDate = live[0]?.date;
  const historical = liveDate ? stored.filter((record) => attendanceRecordDate(record) !== liveDate) : stored;
  const now = new Date();
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekStored = historical.filter((record) => { const date = new Date(record.startedAt); return date >= weekStart && date < weekEnd; });
  const weekRecords = [...live, ...weekStored];
  const allRecords = [...live, ...historical];
  const ventCounts = getVentCounts();
  const hasVentData = Object.values(ventCounts).some((count) => Number(count) > 0);
  const hasUserData = allRecords.length > 0 || hasVentData;
  els.emptyLedger.classList.toggle('is-hidden', hasUserData); els.userDashboard.classList.toggle('is-hidden', !hasUserData);
  const personaRecords = weekRecords.filter((record) => record.startedAt && !record.missedCheckout);
  const personaAverage = personaRecords.length ? Math.round(personaRecords.reduce((sum, record) => sum + recordDuration(record), 0) / personaRecords.length) : 0;
  renderWorkPersona(personaAverage, personaRecords.length > 0);
  if (!hasUserData) return;
  const completed = weekStored.filter((record) => record.endedAt);
  const total = completed.reduce((sum, record) => sum + recordDuration(record), 0);
  const latest = completed.reduce((value, record) => !value || timeText(new Date(record.endedAt)) > value ? timeText(new Date(record.endedAt)) : value, '');
  const earliest = weekRecords.reduce((value, record) => !value || timeText(new Date(record.startedAt)) < value ? timeText(new Date(record.startedAt)) : value, '');
  const onTime = completed.filter((record) => Number(record.overtimeMinutes) === 0).length;
  const weeklyVentCount = Object.entries(ventCounts).reduce((sum, [key, count]) => {
    const day = new Date(`${key}T12:00:00`);
    return day >= weekStart && day < weekEnd ? sum + Math.max(0, Number(count) || 0) : sum;
  }, 0);
  const visible = allRecords.slice(0, 5);
  if (!visible.length) {
    const ventOnly = Object.entries(ventCounts)
      .filter(([, count]) => Number(count) > 0)
      .sort(([left], [right]) => right.localeCompare(left))
      .slice(0, 5)
      .map(([key, count]) => `<tr><td>${formatRecordDay(key)}</td><td>—</td><td>—</td><td>—</td><td>${Math.max(0, Number(count) || 0)}</td><td><span class="record-status">只疯没打卡</span></td></tr>`).join('');
    els.userDashboard.innerHTML = `<section class="kpi-grid" aria-label="我的本周敲疯案底"><article class="kpi"><small>本周敲疯值<br>WOODFISH MELTDOWN</small><strong>${weeklyVentCount}</strong><em>工位没留痕，木鱼留了</em></article><article class="kpi"><small>完整打卡<br>COMPLETE SHIFTS</small><strong>0</strong><em>今天只记录到情绪</em></article></section><section class="records"><table><thead><tr><th>日期</th><th>上班</th><th>下班</th><th>肉身占用</th><th>敲疯值</th><th>下班评价</th></tr></thead><tbody>${ventOnly}</tbody></table></section>`;
    return;
  }
  const rows = visible.map(chartRow).join('');
  const table = visible.map((record) => `<tr><td>${formatRecordDay(record.date)}</td><td>${timeText(new Date(record.startedAt))}</td><td>${record.missedCheckout ? '未打卡' : record.endedAt ? timeText(new Date(record.endedAt)) : '在岗中'}</td><td>${record.missedCheckout ? '—' : compactDuration(recordDuration(record))}</td><td>${Math.max(0, Number(ventCounts[record.date]) || 0)}</td><td><span class="record-status${record.overtimeMinutes > 0 || record.missedCheckout ? ' is-late' : ''}">${record.missedCheckout ? '漏打下班卡' : record.endedAt ? (record.overtimeMinutes > 0 ? `${isWeekend(record.startedAt) ? '周末加班' : '超时'} ${minutesText(record.overtimeMinutes)}` : '准点释放') : '等待下班'}</span></td></tr>`).join('');
  els.userDashboard.innerHTML = `<section class="kpi-grid" aria-label="我的本周工位案底"><article class="kpi"><small>累计服刑时长<br>TOTAL OCCUPIED</small><strong>${completed.length ? compactDuration(total) : '进行中'}</strong><em>${completed.length} 次完整打卡</em></article><article class="kpi"><small>最晚释放纪录<br>LATEST RELEASE</small><strong>${latest || '—'}</strong><em>来自真实记录</em></article><article class="kpi"><small>最早到案时间<br>EARLIEST ARRIVAL</small><strong>${earliest || '—'}</strong><em>肉身到案证据</em></article><article class="kpi"><small>平均肉身占用<br>AVG. CAPTURED</small><strong>${completed.length ? compactDuration(Math.round(total / completed.length)) : '待下班'}</strong><em>完整记录平均值</em></article><article class="kpi"><small>本周敲疯值<br>WOODFISH MELTDOWN</small><strong>${weeklyVentCount}</strong><em>情绪没解决，木鱼先工伤</em></article></section><div class="ledger-grid"><section class="panel"><div class="panel-title"><strong>我的工位案底</strong><span>08:00 — 22:00</span></div><div class="week-chart"><div class="chart-axis"><span></span><span>08</span><span>10</span><span>12</span><span>14</span><span>16</span><span>18</span><span>20</span></div>${rows}</div></section><aside class="feature-stack"><article class="feature-card"><span class="feature-tag">本周反卷报告</span><h3>${completed.length ? `已完成 ${completed.length} 次打卡` : '第一条数据正在长出来'}</h3><p>这里只统计你的真实打卡，不拿示例数据替你制造工伤。</p></article><article class="feature-card"><span class="feature-tag">加班遗言</span><h3>${completed.length ? completed[0].epitaph || epitaphs[0] : '今天还没下班'}</h3><p>真实下班后自动生成。</p></article><article class="feature-card"><span class="feature-tag">敲疯现场</span><span class="streak-number">${weeklyVentCount}</span><h3>本周累计 ${weeklyVentCount} 敲</h3><p>问题没有消失，但至少木鱼知道你尽力疯过。</p></article></aside></div><section class="records"><table><thead><tr><th>日期</th><th>上班</th><th>下班</th><th>肉身占用</th><th>敲疯值</th><th>下班评价</th></tr></thead><tbody>${table}</tbody></table></section>`;
}

function renderLedgerMode(mode) {
  els.ledger.dataset.mode = mode;
  els.dataModeLabel.textContent = mode === 'mock' ? '示例数据' : '我的数据';
  els.dataModeToggle.textContent = mode === 'mock' ? '看看我的数据 →' : '查看示例数据';
  els.dataModeToggle.classList.toggle('is-primary', mode === 'mock');
  if (mode === 'user') renderUserData();
  else renderWorkPersona(9 * 60 + 19, true);
}

function showToast(title, body) {
  $('.toast')?.remove(); const toast = document.createElement('div'); toast.className = 'toast';
  toast.innerHTML = `<strong>${title}</strong><span>${body}</span>`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4200);
}

function getTodos() {
  const value = parseJSON(STORAGE.todos, []);
  if (!Array.isArray(value)) return [];
  let changed = false;
  const today = dateKey();
  const normalized = value.map((todo) => {
    if (!todo.deferredTo || todo.deferredTo > today) return todo;
    changed = true;
    const next = { ...todo, carriedFrom: todo.deferredTo };
    delete next.deferredTo;
    return next;
  });
  if (changed) localStorage.setItem(STORAGE.todos, JSON.stringify(normalized));
  return normalized;
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE.todos, JSON.stringify(todos));
  renderTodos();
}

function renderTodos() {
  const todos = getTodos();
  els.todoClear.disabled = todos.length === 0;
  if (!todos.length) { els.todoList.innerHTML = '<div class="todo-empty">这里还没贴东西。脑子暂时不用替公司免费托管。</div>'; return; }
  const ordered = [...todos].sort((left, right) => Number(left.done) - Number(right.done) || Number(Boolean(left.deferredTo)) - Number(Boolean(right.deferredTo)));
  els.todoList.innerHTML = ordered.map((todo) => {
    const status = todo.deferredTo ? '明天继续' : todo.carriedFrom ? '昨日遗留' : '';
    return `<article class="todo-note${todo.done ? ' is-done' : ''}${todo.deferredTo ? ' is-deferred' : ''}" data-todo-id="${todo.id}"><input class="todo-check" type="checkbox" ${todo.done ? 'checked' : ''} aria-label="${todo.done ? '标记未完成' : '标记已完成'}"><p class="todo-text">${escapeHTML(todo.text)}</p>${status ? `<span class="todo-note-status">${status}</span>` : ''}<div class="todo-tools"><button type="button" data-action="edit" aria-label="编辑待办">✎</button><button type="button" data-action="delete" aria-label="删除待办">×</button></div></article>`;
  }).join('');
}

function shutdownBoundaryActive() {
  return ['near', 'checkout', 'overtime'].includes(currentState);
}

function tomorrowDateKey(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateKey(tomorrow);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));
}

const bootCopies = [
  '正在检查老板有没有突然良心发现……没有。',
  '正在加载工位，顺便卸载不切实际的升职幻想。',
  '正在同步工资。数据量太小，几乎瞬间完成。',
  '正在恢复职业微笑，真实情绪已安全隔离。',
  '正在连接公司网络，你的人生稍后再连接。'
];

function runBootLoader() {
  const copy = bootCopies[Math.floor(Math.random() * bootCopies.length)];
  els.bootCopy.textContent = copy;
  const started = performance.now();
  const update = () => {
    const elapsed = performance.now() - started;
    els.bootPercent.textContent = `${Math.min(100, Math.round(elapsed / 18.5))}%`;
    if (elapsed < 1850) requestAnimationFrame(update);
  };
  update();
  setTimeout(() => els.bootLoader.classList.add('is-done'), 2050);
  setTimeout(() => els.bootLoader.remove(), 2550);
}

async function notify(title, body) {
  if (localStorage.getItem(STORAGE.notifications) !== 'on') return { ok: false, reason: 'disabled' };
  if (window.desktop?.notify) return window.desktop.notify(title, body);
  return { ok: false, reason: 'native-unavailable' };
}

function reminderKey(shift, kind) { return `ma-xiexie-reminder-${shift.startedAt}-${kind}`; }
async function fireOnce(shift, kind, title, body) {
  const key = reminderKey(shift, kind); if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, 'pending');
  const result = await notify(title, body);
  if (result?.ok !== false) localStorage.setItem(key, '1'); else localStorage.removeItem(key);
  showToast(title, body);
  return true;
}

const voiceScenes = {
  lunch: { label: '午饭提醒', text: '十二点了，请去吃饭。' },
  checkout: { label: '准点下班', text: '下班，请注意。下班，请注意。' },
  overtime: { label: '超时催离', text: '已经超时。该下班了。' },
  overtime1h: { label: '超时一小时', text: '已经超时一小时。请立刻下班。' },
  overtime2h: { label: '超时两小时', text: '加班已经两小时。红色警报。请马上离开工位。你怎么还在，明天不过了吗？' }
};
const voicePreviewOrder = ['lunch', 'checkout', 'overtime', 'overtime1h', 'overtime2h'];

async function playVoiceAnnouncement(kind) {
  if (!soundEnabled) return false;
  const scene = voiceScenes[kind];
  if (!scene) return false;
  const requestId = ++voiceRequestId;
  const nativeResult = await window.desktop?.speak?.(scene.text);
  if (requestId !== voiceRequestId || !soundEnabled) return false;
  if (nativeResult?.ok) return true;
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(scene.text);
  speech.lang = 'zh-CN'; speech.rate = .98; speech.pitch = 1.02;
  const voices = window.speechSynthesis.getVoices();
  speech.voice = voices.find((voice) => /^zh/i.test(voice.lang)) || null;
  window.speechSynthesis.speak(speech);
  return true;
}

function checkLunchReminder(now = new Date()) {
  if (now.getHours() !== 12 || now.getMinutes() > 14) return;
  const key = `ma-xiexie-lunch-${dateKey(now)}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  playVoiceAnnouncement('lunch');
}

function checkReminders(stateInfo, now = new Date()) {
  checkLunchReminder(now);
  const shift = stateInfo.shift; if (!shift || shift.endedAt) return;
  const remaining = (new Date(shift.plannedEndAt) - now) / 1000;
  const overtime = -remaining;
  const previousOvertime = previousRemaining === null ? -Infinity : -previousRemaining;
  const voicePoint = [[600,'overtime'],[3600,'overtime1h'],[7200,'overtime2h']]
    .filter(([threshold]) => previousOvertime < threshold && overtime >= threshold)
    .at(-1);
  if (voicePoint) {
    const [, kind] = voicePoint;
    const key = `ma-xiexie-voice-${shift.startedAt}-${kind}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      playVoiceAnnouncement(kind);
    }
  }
  previousRemaining = remaining;
}

function getAudioContext() { if (!audioContext) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) audioContext = new Ctx(); } return audioContext; }
async function playOpeningBell() {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') await context.resume();
  const start = context.currentTime + .015;
  [[740, 0, .92, .27], [1110, .01, .76, .16], [1480, .02, .52, .08]].forEach(([frequency, offset, duration, volume]) => {
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, start + offset); oscillator.frequency.exponentialRampToValueAtTime(frequency * .92, start + offset + duration);
    gain.gain.setValueAtTime(.0001, start + offset); gain.gain.exponentialRampToValueAtTime(volume, start + offset + .008); gain.gain.exponentialRampToValueAtTime(.0001, start + offset + duration);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start + offset); oscillator.stop(start + offset + duration + .03);
  });
  const knock = context.createOscillator(); const knockGain = context.createGain();
  knock.type = 'triangle'; knock.frequency.setValueAtTime(185, start); knock.frequency.exponentialRampToValueAtTime(74, start + .12);
  knockGain.gain.setValueAtTime(.32, start); knockGain.gain.exponentialRampToValueAtTime(.0001, start + .16);
  knock.connect(knockGain); knockGain.connect(context.destination); knock.start(start); knock.stop(start + .18);
}
async function playAlarm() {
  if (!soundEnabled || alarmPlaying) return;
  alarmPlaying = true;
  setTimeout(() => { alarmPlaying = false; }, 7600);
  const context = getAudioContext();
  if (context) {
    if (context.state === 'suspended') await context.resume();
    const notes = [[523,.0,.24],[659,.3,.24],[784,.6,.34],[659,1.04,.2],[698,1.3,.2],[880,1.56,.32],[784,2.02,.2],[880,2.28,.2],[1046,2.54,.5]];
    notes.forEach(([frequency, offset, duration]) => { const oscillator = context.createOscillator(); const gain = context.createGain(); const start = context.currentTime + .04; oscillator.type = 'triangle'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, start + offset); gain.gain.exponentialRampToValueAtTime(.18, start + offset + .02); gain.gain.exponentialRampToValueAtTime(.0001, start + offset + duration); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start + offset); oscillator.stop(start + offset + duration + .03); });
  }
}

function createDockIconDataUrl(stateInfo) {
  if (!iconImage) { iconImage = new Image(); iconImage.src = 'mascot/ma-xiexie-sheet-v1.png'; iconImage.onload = () => updateDockIcon(stateInfo); }
  if (!defaultIconImage) { defaultIconImage = new Image(); defaultIconImage.src = 'app-icon.png'; defaultIconImage.onload = () => updateDockIcon(stateInfo); }
  if (!iconImage?.complete || !defaultIconImage?.complete) return null;
  const isIdle = stateInfo.name === 'ready' || stateInfo.name === 'off';
  let label = '';
  const overtime = stateInfo.name === 'overtime';
  if (!isIdle) {
    const hours = Math.floor(stateInfo.seconds / 3600);
    const minutes = Math.floor((stateInfo.seconds % 3600) / 60);
    const seconds = Math.floor(stateInfo.seconds % 60);
    label = overtime
      ? formatOvertimeIconDuration(stateInfo.seconds)
      : hours > 0 ? `${pad(hours)}:${pad(minutes)}` : `${pad(minutes)}:${pad(seconds)}`;
  }
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512; const ctx = canvas.getContext('2d');
  if (isIdle) {
    ctx.drawImage(defaultIconImage, 0, 0, 512, 512);
    return { dataUrl: canvas.toDataURL('image/png'), label: '' };
  }
  ctx.fillStyle = overtime ? '#ff4c3e' : '#2448df';
  ctx.strokeStyle = '#11131a'; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.roundRect(9, 9, 494, 494, 88); ctx.fill(); ctx.stroke();
  const frame = { ready:[1,0], working:[0,0], near:[1,1], checkout:[2,0], overtime:[2,1], off:[2,0] }[stateInfo.name];
  // The mascot stays recognizable, but the timer owns the lower 40% of the
  // icon so it remains legible at small Dock sizes.
  ctx.drawImage(iconImage, frame[0] * 512, frame[1] * 512, 512, 512, 76, 0, 360, 360);
  if (overtime) {
    // Keep the warning symbol in the free upper-right corner. It reinforces
    // overtime without competing with the enlarged one-line timer ticket.
    ctx.fillStyle = '#ffdf32'; ctx.strokeStyle = '#11131a'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(420, 35); ctx.lineTo(486, 151); ctx.lineTo(354, 151); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#11131a'; ctx.font = '950 72px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 420, 112);
  }
  ctx.fillStyle = '#ffdf32'; ctx.strokeStyle = '#11131a'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.roundRect(22, 286, 468, 208, 38); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#11131a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fontSize = overtime ? 116 : 132;
  do {
    ctx.font = `950 ${fontSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    if (ctx.measureText(label).width <= 420) break;
    fontSize -= 4;
  } while (fontSize > 76);
  ctx.fillText(label, 256, 394);
  return { dataUrl: canvas.toDataURL('image/png'), label };
}

function updateDockIcon(stateInfo) {
  if (!window.desktop?.setDynamicIcon) return;
  const rendered = createDockIconDataUrl(stateInfo);
  if (!rendered) return;
  const iconKey = `${stateInfo.name}:${rendered.label}`;
  if (iconKey === lastDockIconKey) return;
  lastDockIconKey = iconKey;
  window.desktop.setDynamicIcon(rendered.dataUrl, rendered.label);
}

function tick() {
  const now = new Date(); const stateInfo = getState(now, { preserveActiveShift: shiftTimeEditing });
  if (stateInfo.name !== currentState) { applyState(stateInfo.name); copyIndex += 1; }
  renderHeroMascot(stateInfo, now);
  renderTimer(stateInfo.seconds, stateInfo.name); updateProgress(now, stateInfo);
  if (document.activeElement !== els.planTime) els.planTime.value = stateInfo.shift?.plan || '';
  if (document.activeElement !== els.startTime) els.startTime.value = stateInfo.shift?.startedAt ? timeText(new Date(stateInfo.shift.startedAt)) : '';
  renderShiftDates(stateInfo.shift, now);
  const shiftEditable = Boolean(stateInfo.shift && !stateInfo.shift.endedAt);
  els.startTime.disabled = !shiftEditable;
  els.planTime.disabled = !shiftEditable;
  els.planDate.disabled = !shiftEditable;
  const weekday = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
  els.todayDate.textContent = `${now.getFullYear()} / ${pad(now.getMonth() + 1)} / ${pad(now.getDate())} · ${weekday}`;
  els.ticketNumber.textContent = `NO. ${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const epochMinute = Math.floor(now.getTime() / 60000);
  if (epochMinute !== lastHealthMinute) { lastHealthMinute = epochMinute; renderHealth(); }
  if (dateKey(now) !== lastTodoDate) { lastTodoDate = dateKey(now); renderTodos(); }
  if (stateInfo.name === 'checkout' && stateInfo.shift) {
    const key = stateInfo.shift.startedAt;
    if (alarmKey !== key) { alarmKey = key; playAlarm(); }
  }
  updateDockIcon(stateInfo);
  syncDesktopPet(stateInfo, now);
}

function startWork({ now = new Date(), automatic = false } = {}) {
  if (getState(now).name !== 'ready') return false;
  const plannedEnd = plannedEndFor(now);
  const shift = { shiftId: `shift-${now.getTime()}`, date: dateKey(now), startedAt: now.toISOString(), endedAt: null, plan: timeText(plannedEnd), plannedEndAt: plannedEnd.toISOString(), planMode: 'automatic', resetAt: defaultResetAtForStart(now).toISOString(), healthScoreAtStart: healthScoreForMinutes(monthlyOvertimeMinutes()) };
  saveShift(shift); window.desktop?.syncReminderSchedule?.(shift); previousRemaining = null; renderUserData(); renderHealth(); renderTodos(); tick(); showToast(automatic ? '早安，已自动打卡' : '今日到案登记完成', isWeekend(now)
    ? `${timeText(now)} 周末手动打卡，计划 ${timeText(plannedEnd)} 下班。今日全部工时都会计入加班。`
    : `${timeText(now)} 上班，计划 ${timeText(plannedEnd)} 下班。九小时工位体验卡已开始计时。`);
  setTimeout(() => renderNotificationExperience({ reveal: true }), 650);
  return true;
}

function renderAutoCheckInSetting(settings = {}) {
  autoCheckInEnabled = settings.enabled === true;
  if (!els.autoCheckInToggle) return;
  els.autoCheckInToggle.checked = autoCheckInEnabled;
  els.autoCheckInToggle.disabled = autoCheckInPending || settings.supported === false;
  els.autoCheckInOption?.classList.toggle('is-pending', autoCheckInPending);
  if (settings.supported === false) els.autoCheckInStatus.textContent = '当前系统暂不支持随登录启动';
  else if (autoCheckInEnabled && isWeekend()) els.autoCheckInStatus.textContent = '周末不自动打卡；今天请手动敲钟（工作日设置仍保留）';
  else if (autoCheckInEnabled && settings.openAtLogin === false) els.autoCheckInStatus.textContent = '已开启自动打卡；请在系统设置中允许本应用登录时启动';
  else els.autoCheckInStatus.textContent = autoCheckInEnabled ? '已开启：工作日 08:00–11:00 开机或解锁后自动打卡' : '仅工作日 08:00–11:00 开机或解锁后自动打卡';
}

function tryAutomaticCheckIn(payload = {}) {
  if (!autoCheckInEnabled) return false;
  const now = payload.requestedAt ? new Date(payload.requestedAt) : new Date();
  if (Number.isNaN(now.getTime()) || isWeekend(now) || now.getHours() < 8 || now.getHours() >= 11) return false;
  return startWork({ now, automatic: true });
}

function updatePlannedEnd(plan) {
  const shift = getShift();
  const plannedEnd = plannedEndFromClock(shift?.startedAt, plan, shift?.planDayOffset);
  if (!shift || shift.endedAt || !plannedEnd) return false;
  shift.plan = plan;
  shift.plannedEndAt = plannedEnd.toISOString();
  shift.resetAt = resetAtAfterPlannedEnd(plannedEnd)?.toISOString() || shift.resetAt;
  shift.planMode = 'manual';
  saveShift(shift);
  previousRemaining = null;
  window.desktop?.syncReminderSchedule?.(shift);
  tick();
  showToast('下班时间已修改', `${plan} 开始撤离；倒计时和桌面提醒已重新排好。`);
  return true;
}

function togglePlanDay() {
  const shift = getShift();
  if (!shift || shift.endedAt) return false;
  const start = new Date(shift.startedAt);
  if (Number.isNaN(start.getTime())) return false;
  const currentOffset = calendarDayOffset(start, new Date(shift.plannedEndAt)) > 0 ? 1 : 0;
  const nextOffset = currentOffset === 1 ? 0 : 1;
  const plannedEnd = plannedEndFromClock(shift.startedAt, shift.plan, nextOffset);
  if (!plannedEnd) return false;
  shift.plannedEndAt = plannedEnd.toISOString();
  shift.planDayOffset = nextOffset;
  shift.planMode = 'manual';
  shift.resetAt = resetAtAfterPlannedEnd(plannedEnd)?.toISOString() || shift.resetAt;
  saveShift(shift);
  previousRemaining = null;
  alarmKey = '';
  window.desktop?.syncReminderSchedule?.(shift);
  tick();
  showToast('下班日期已修改', `${nextOffset ? '明天' : '今天'} ${shift.plan} 下班；倒计时和提醒已重新排好。`);
  return true;
}

function updateStartTime(clock) {
  const shift = getShift();
  if (!shift || shift.endedAt) return false;
  const previousStart = new Date(shift.startedAt);
  const nextStart = startFromClock(shift, clock);
  if (!nextStart || nextStart > new Date()) return false;
  const automaticPlan = shift.planMode !== 'manual' && Math.abs(new Date(shift.plannedEndAt) - plannedEndFor(previousStart)) < 60000;
  shift.shiftId ||= `shift-${previousStart.getTime()}`;
  shift.startedAt = nextStart.toISOString();
  shift.date = dateKey(nextStart);
  let resetAt = resetAtForShift(shift);
  const now = new Date();
  if (!resetAt || Number.isNaN(resetAt.getTime())) resetAt = defaultResetAtForStart(previousStart);
  // Old versions could leave an already-expired reset boundary behind. If the
  // user is actively correcting this shift, keep it alive through the next
  // valid 08:00 boundary instead of throwing them back to the check-in page.
  while (resetAt && resetAt <= now) resetAt.setDate(resetAt.getDate() + 1);
  if (resetAt) shift.resetAt = resetAt.toISOString();
  if (automaticPlan) {
    const plannedEnd = plannedEndFor(nextStart);
    shift.plan = timeText(plannedEnd);
    shift.plannedEndAt = plannedEnd.toISOString();
    shift.planMode = 'automatic';
  } else if (new Date(shift.plannedEndAt) <= nextStart) {
    return false;
  }
  saveShift(shift);
  previousRemaining = null;
  alarmKey = '';
  window.desktop?.syncReminderSchedule?.(shift);
  renderUserData(); renderHealth(); tick();
  showToast('上班时间已修改', automaticPlan
    ? `${clock} 到岗，计划下班同步调整为 ${shift.plan}。倒计时和提醒已重新排好。`
    : `${clock} 到岗；你手动设置的 ${shift.plan} 下班保持不变。`);
  return true;
}

function finishWork() {
  const shift = getShift(); if (!shift || shift.endedAt) return;
  const now = new Date(); shift.endedAt = now.toISOString(); const overtimeMinutes = overtimeMinutesForShift(shift, now);
  const epitaph = epitaphs[Math.floor(Math.random() * epitaphs.length)];
  const todos = getTodos();
  const healthAfter = healthScoreForMinutes(monthlyOvertimeMinutes());
  const actualMinutes = Math.max(0, Math.round((now - new Date(shift.startedAt)) / 60000));
  shift.overtimeMinutes = overtimeMinutes;
  shift.epitaph = epitaph;
  shift.report = {
    actualMinutes,
    overtimeMinutes,
    ventCount: ventCountFor(shift.date),
    healthBefore: Number.isFinite(Number(shift.healthScoreAtStart)) ? Number(shift.healthScoreAtStart) : healthAfter,
    healthAfter,
    completedTodos: todos.filter((todo) => todo.done).length,
    deferredTodos: todos.filter((todo) => todo.deferredTo).length,
    epitaph,
    stamp: isWeekend(shift.startedAt) && overtimeMinutes > 0 ? '周末加班' : overtimeMinutes > 0 ? '加班收工' : now < new Date(shift.plannedEndAt) ? '提前收工' : '准点下班'
  };
  const records = getRecords().filter((record) => record.date !== shift.date);
  records.push({ ...shift }); saveRecords(records); saveShift(shift); window.desktop?.syncReminderSchedule?.(shift); els.epitaph.textContent = epitaph;
  renderUserData(); renderHealth(); tick(); showToast('今日正式收工', `${timeText(now)} 已记录到考勤簿。${epitaph}`);
}

els.retirementForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const currentAge = Number(els.retirementCurrentAge.value);
  const targetAge = Number(els.retirementTargetAge.value);
  let error = '';
  if (!Number.isInteger(currentAge) || currentAge < 16 || currentAge > 99) error = '请输入 16–99 之间的当前年龄。';
  else if (!Number.isInteger(targetAge) || targetAge < 17 || targetAge > 100) error = '请输入 17–100 之间的退休年龄。';
  else if (targetAge <= currentAge) error = '退休年龄要比现在年龄大一点。';
  els.retirementAgeError.textContent = error;
  if (error) return;
  localStorage.setItem(STORAGE.retirementPlan, JSON.stringify({
    currentAge,
    targetAge,
    createdAt: new Date().toISOString()
  }));
  renderRetirementPlan();
  showToast('永久下班计划已启程', `先朝 ${targetAge} 岁走，不必精确到某一天。`);
});

document.querySelectorAll('[data-retirement-age]').forEach((button) => button.addEventListener('click', () => {
  els.retirementTargetAge.value = button.dataset.retirementAge;
  els.retirementAgeError.textContent = '';
  updateRetirementQuickAges();
}));
els.retirementCurrentAge?.addEventListener('input', updateRetirementQuickAges);
els.retirementTargetAge?.addEventListener('input', updateRetirementQuickAges);
els.retirementEdit?.addEventListener('click', () => renderRetirementPlan({ editing: true }));
els.retirementPreviewOpen?.addEventListener('click', () => {
  drawRetirementBlindBox();
  els.retirementPreview.hidden = false;
  requestAnimationFrame(() => els.retirementPreviewClose.focus());
});
els.retirementPreviewShuffle?.addEventListener('click', () => {
  drawRetirementBlindBox();
  els.retirementPreview.classList.remove('is-redrawing');
  void els.retirementPreview.offsetWidth;
  els.retirementPreview.classList.add('is-redrawing');
});
els.retirementPreviewClose?.addEventListener('click', () => {
  els.retirementPreview.hidden = true;
  els.retirementPreviewOpen.focus();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.retirementPreview?.hidden) els.retirementPreviewClose.click();
});

document.querySelectorAll('.nav-tab').forEach((button) => button.addEventListener('click', () => {
  if (button.classList.contains('is-active')) return;
  document.querySelectorAll('.nav-tab').forEach((item) => item.classList.toggle('is-active', item === button));
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('is-active', page.id === `page-${button.dataset.page}`));
  if (button.dataset.page === 'health') renderHealth();
  if (button.dataset.page === 'attendance' && els.ledger.dataset.mode === 'user') renderUserData();
  if (button.dataset.page === 'radar') renderRadar();
  if (button.dataset.page === 'retirement') renderRetirementPlan();
}));

$('#health-shortcut').addEventListener('click', () => $('.nav-tab[data-page="health"]').click());
els.reportAttendance.addEventListener('click', () => $('.nav-tab[data-page="attendance"]').click());
els.reportSave.addEventListener('click', async () => {
  if (!window.desktop?.saveReportCard) {
    showToast('当前预览无法保存图片', '请在桌面应用中使用“保存小结图片”。');
    return;
  }
  const rect = els.checkoutReportCard.getBoundingClientRect();
  els.reportSave.disabled = true;
  els.reportSave.textContent = '正在生成图片…';
  const result = await window.desktop.saveReportCard({
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    date: getShift()?.date || dateKey()
  });
  els.reportSave.disabled = false;
  els.reportSave.textContent = '保存小结图片';
  if (result?.ok) showToast('小结图片已保存', '今日工伤证据已妥善留存。');
  else if (!result?.canceled) showToast('小结图片保存失败', '截图通道开小差了，请稍后再试。');
});
let earlyCheckoutArmed = false; let earlyCheckoutTimer;
$('#off-button').addEventListener('click', () => {
  if ((currentState === 'working' || currentState === 'near') && !earlyCheckoutArmed) {
    earlyCheckoutArmed = true;
    const button = $('#off-button'); const labels = button.querySelectorAll('span');
    labels[0].textContent = '确认提前下班？'; labels[1].textContent = '再点一次 →'; button.classList.add('is-armed');
    showToast('提前打烊需要确认', '再点一次，当前时间才会被记录为真实下班时间。');
    earlyCheckoutTimer = setTimeout(() => { earlyCheckoutArmed = false; applyState(currentState); }, 3600);
    return;
  }
  clearTimeout(earlyCheckoutTimer); earlyCheckoutArmed = false; finishWork();
});
$('#work-button').addEventListener('click', () => {
  const button = $('#work-button');
  button.classList.remove('is-ringing'); void button.offsetWidth; button.classList.add('is-ringing');
  playOpeningBell();
  setTimeout(() => { button.classList.remove('is-ringing'); startWork(); }, 560);
});
els.autoCheckInToggle?.addEventListener('change', async () => {
  if (autoCheckInPending) return;
  autoCheckInPending = true;
  const requested = els.autoCheckInToggle.checked;
  renderAutoCheckInSetting({ enabled: requested, supported: true, openAtLogin: requested });
  const result = await window.desktop?.setAutoCheckInEnabled?.(requested);
  autoCheckInPending = false;
  renderAutoCheckInSetting(result || { enabled: false, supported: false });
  if (result?.ok === false) showToast('自动打卡开启失败', '系统没有允许应用随登录启动，请检查系统登录项设置。');
  else showToast(result?.enabled ? '自动打卡已开启' : '自动打卡已关闭', result?.enabled ? '仅工作日 08:00–11:00 首次开机、唤醒或解锁时自动打卡；周末必须手动打卡。' : '以后仍由你手动敲钟打卡。');
});
$('#go-check-in').addEventListener('click', () => $('.nav-tab[data-page="today"]').click());
$('#close-notification').addEventListener('click', () => { els.notification.classList.add('is-hidden'); els.restore.classList.add('is-visible'); });
els.restore.addEventListener('click', () => { els.notification.classList.remove('is-hidden'); els.restore.classList.remove('is-visible'); });
window.addEventListener('resize', () => { if (currentState === 'off') fitOffSummaryDuration(); });
window.addEventListener('focus', () => {
  tick();
  if (radarLocationSettingsAwaitingFocus) {
    radarLocationSettingsAwaitingFocus = false;
    window.setTimeout(() => refreshRealRadar(), 500);
  }
  if (notificationSettingsAwaitingFocus) {
    notificationSettingsAwaitingFocus = false;
    notificationNeedsSettings = false;
    // Returning from system settings must not erase an already verified state.
    // If the renderer can confirm permission, remember it persistently so the
    // onboarding does not reappear on the next day or next launch.
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') setNotificationReady(true);
  }
  renderNotificationExperience({ reveal: true });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  tick();
  if (localStorage.getItem(STORAGE.radarMode) === 'real' && localStorage.getItem(STORAGE.radarDiscovery) === 'on') refreshRealRadar();
});
const previewMinutes = [120, 600, 1200, 1920, 2700, 3300];
document.querySelectorAll('.health-stage-button').forEach((button) => button.addEventListener('click', () => {
  const index = Number(button.dataset.healthStage);
  if (index === actualHealthIndex) { renderHealth(); return; }
  renderHealthView(index, previewMinutes[index], true);
}));
els.healthPreviewReset.addEventListener('click', renderHealth);

els.dataModeToggle.addEventListener('click', () => renderLedgerMode(els.ledger.dataset.mode === 'mock' ? 'user' : 'mock'));
async function switchRadarMode(nextMode) {
  const mode = nextMode === 'real' ? 'real' : 'mock';
  if (els.radarShell.dataset.mode === 'real' && localStorage.getItem(STORAGE.radarDiscovery) === 'on') {
    localStorage.setItem(STORAGE.radarDiscovery, 'off');
    await hideRealRadarPresence();
  }
  // Mock 不读取位置，默认展示示例工友；真实模式始终等待用户主动授权。
  localStorage.setItem(STORAGE.radarDiscovery, mode === 'mock' ? 'on' : 'off');
  renderRadar(mode);
}
els.radarModeToggle?.addEventListener('click', () => {
  switchRadarMode(els.radarShell.dataset.mode === 'mock' ? 'real' : 'mock');
});
els.radarShowMock?.addEventListener('click', () => switchRadarMode('mock'));
els.radarDiscoveryToggle?.addEventListener('click', toggleRadarDiscovery);
els.radarNameSave?.addEventListener('click', () => {
  if (!saveRadarName(els.radarNameInput.value)) return;
  if (els.radarShell.dataset.mode === 'real' && localStorage.getItem(STORAGE.radarDiscovery) === 'on') refreshRealRadar();
});
els.radarNameDice?.addEventListener('click', () => {
  const name = randomRadarName(deviceRadarName());
  saveRadarName(name, { announce:false });
  showToast('骰子落地', `你的新匿名工牌是“${name}”。`);
});
els.radarNameInput?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  saveRadarName(els.radarNameInput.value);
});
document.querySelectorAll('[data-radar-radius]').forEach((button) => button.addEventListener('click', () => {
  localStorage.setItem(STORAGE.radarRadius, button.dataset.radarRadius);
  renderRadar();
  if (els.radarShell.dataset.mode === 'real' && localStorage.getItem(STORAGE.radarDiscovery) === 'on') refreshRealRadar();
}));
document.querySelectorAll('[data-radar-tab]').forEach((button) => button.addEventListener('click', async () => {
  renderRadarFeed(button.dataset.radarTab);
  if (button.dataset.radarTab === 'inbox' && els.radarShell.dataset.mode === 'real') await markRealRadarInboxRead();
}));
els.radarPeople?.addEventListener('click', (event) => {
  if (event.target.closest('[data-radar-retry]')) {
    refreshRealRadar({ announce:true });
    return;
  }
  const button = event.target.closest('[data-radar-action]');
  if (!button) return;
  if (els.radarShell.dataset.mode === 'real') {
    sendRealRadarSignal({ type:button.dataset.radarSignal, toDeviceId:button.dataset.peerId, toName:button.dataset.person, button });
    return;
  }
  showToast(`${button.dataset.radarAction}已发出`, `${button.dataset.person} 收到了一条匿名工位电波。示例模式不会真的发送。`);
});
els.radarBlips?.addEventListener('click', (event) => {
  const blip = event.target.closest('.radar-blip');
  if (!blip) return;
  radarSelectedPersonKey = blip.dataset.personKey || '';
  renderRadarFeed('nearby');
  els.radarBlips.querySelectorAll('.radar-blip').forEach((item) => { const selected = item === blip; item.classList.toggle('is-selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  els.radarPeople.querySelectorAll('.radar-person').forEach((card) => card.classList.toggle('is-selected', card.dataset.personKey === radarSelectedPersonKey));
  els.radarPeople.querySelector(`[data-person-key="${CSS.escape(radarSelectedPersonKey)}"]`)?.scrollIntoView({ behavior:'smooth', block:'center' });
});
els.radarInbox?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-radar-reply]');
  if (!button) return;
  if (els.radarShell.dataset.mode === 'real') {
    sendRealRadarSignal({ type:'reply', toDeviceId:button.dataset.peerId, toName:button.dataset.radarReply, button });
    return;
  }
  showToast('匿名信号已回复', `已向 ${button.dataset.radarReply} 回了一个“收到”。示例模式不会真的发送。`);
});
let clearArmed = false; let clearTimer;
els.clearAttendanceData.addEventListener('click', () => {
  if (!clearArmed) { clearArmed = true; els.clearAttendanceData.classList.add('is-armed'); els.clearAttendanceData.textContent = '再点一次，确认清空'; clearTimer = setTimeout(() => { clearArmed = false; els.clearAttendanceData.classList.remove('is-armed'); els.clearAttendanceData.textContent = '清空我的数据'; }, 3200); return; }
  clearTimeout(clearTimer); saveRecords([]); saveShift(null); localStorage.removeItem('ma-xiexie-plan-time-v1'); localStorage.removeItem(STORAGE.ventCounts); localStorage.removeItem(STORAGE.notifications); localStorage.removeItem(STORAGE.notificationReady); localStorage.removeItem(STORAGE.notificationOnboardingSeen); localStorage.removeItem(STORAGE.notificationSkipDate); localStorage.removeItem(STORAGE.retirementPlan); els.planTime.value = ''; clearArmed = false; els.clearAttendanceData.classList.remove('is-armed'); els.clearAttendanceData.textContent = '清空我的数据'; els.settingsMenu.classList.remove('is-open'); els.settingsToggle.setAttribute('aria-expanded', 'false'); window.desktop?.syncReminderSchedule?.(null); renderVentCount(); renderUserData(); renderHealth(); renderRetirementPlan(); tick(); notificationNeedsSettings = false; notificationPromptVisible = false; renderNotificationExperience({ reveal: true }); showToast('我的数据已清空', '考勤、退休计划与通知引导已重置。');
});

els.settingsToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = els.settingsMenu.classList.toggle('is-open');
  els.settingsToggle.setAttribute('aria-expanded', String(open));
});
els.settingsMenu.addEventListener('click', (event) => event.stopPropagation());
document.addEventListener('click', () => { els.settingsMenu.classList.remove('is-open'); els.settingsToggle.setAttribute('aria-expanded', 'false'); });

function setTopAction(button, name, pressed) {
  button.dataset.tooltip = name; button.setAttribute('aria-label', name);
  if (typeof pressed === 'boolean') button.setAttribute('aria-pressed', String(pressed));
}

function isNotificationReady() {
  return localStorage.getItem(STORAGE.notificationReady) === dateKey() || localStorage.getItem(STORAGE.notifications) === 'on';
}

function setNotificationReady(ready) {
  if (ready) {
    localStorage.setItem(STORAGE.notificationReady, dateKey());
    localStorage.setItem(STORAGE.notifications, 'on');
    localStorage.removeItem(STORAGE.notificationSkipDate);
  } else {
    localStorage.removeItem(STORAGE.notificationReady);
    localStorage.removeItem(STORAGE.notifications);
  }
}

function hasSeenNotificationOnboarding() {
  if (localStorage.getItem(STORAGE.notificationOnboardingSeen) === '1') return true;
  // 兼容升级前的用户：曾经开启、验证或关闭过旧引导，均视为已展示。
  const legacySeen = localStorage.getItem(STORAGE.notifications) === 'on'
    || Boolean(localStorage.getItem(STORAGE.notificationReady))
    || Boolean(localStorage.getItem(STORAGE.notificationSkipDate));
  if (legacySeen) localStorage.setItem(STORAGE.notificationOnboardingSeen, '1');
  return legacySeen;
}

function markNotificationOnboardingSeen() {
  localStorage.setItem(STORAGE.notificationOnboardingSeen, '1');
  localStorage.removeItem(STORAGE.notificationSkipDate);
}

function canShowNotificationPrompt() {
  const shift = getShift();
  return Boolean(
    (currentState === 'ready' || (shift && !shift.endedAt && (currentState === 'working' || currentState === 'near'))) &&
    !isNotificationReady() &&
    !hasSeenNotificationOnboarding()
  );
}

function reconcileNotificationPermission() {
  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unknown';
  if (permission === 'denied') setNotificationReady(false);
  return permission;
}

function renderNotificationExperience({ reveal = false } = {}) {
  reconcileNotificationPermission();
  const ready = isNotificationReady();
  if (ready || !canShowNotificationPrompt()) notificationPromptVisible = false;
  else if (reveal) {
    notificationPromptVisible = true;
    markNotificationOnboardingSeen();
  }

  els.notificationOnboarding?.classList.toggle('is-visible', notificationPromptVisible);
  els.notificationOnboarding?.setAttribute('aria-hidden', String(!notificationPromptVisible));
  els.notificationShortcut?.classList.toggle('is-ready', ready);
  els.notificationShortcut?.classList.toggle('is-off', !ready);
  els.notificationShortcut?.removeAttribute('aria-pressed');
  setTopAction(els.notificationShortcut, ready ? '今天已验证 · 再测一次' : '桌面通知待确认', ready);

  if (els.notificationEnable) {
    // 浮层主按钮始终直接带用户去系统通知设置；测试通知只由顶部铃铛负责。
    els.notificationEnable.textContent = notificationNeedsSettings ? '去系统设置开启' : '开启桌面通知';
  }
}

function notificationPlatformCopy(kind) {
  const isWindows = window.desktop?.platform === 'win32';
  if (kind === 'success') {
    return isWindows
      ? '如果没看到桌面横幅，请在设置里的「开启桌面通知」中检查“马上下班”和专注助手。'
      : '如果没看到桌面横幅，请在设置里的「开启桌面通知」中检查“马上下班”的横幅权限。';
  }
  return isWindows
    ? '请先在 Windows 通知设置中允许“马上下班”发送通知。'
    : '请先在 macOS 通知设置中允许“马上下班”发送横幅。';
}

async function requestBrowserNotificationPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'denied') return 'denied';
    if ('Notification' in window && Notification.permission !== 'granted' && typeof Notification.requestPermission === 'function') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return permission;
    }
  } catch { return 'request-failed'; }
  if (window.desktop?.notify) return 'native';
  if ('Notification' in window) return Notification.permission;
  return 'unavailable';
}

async function sendTestNotification() {
  const tests = [
    ['马上下班 · 即时通知测试', '通道正常。饭点和下班点，我会来喊你。'],
    ['马歇歇敲了敲通知栏', '看见这条，说明下班提醒已经成功占座。'],
    ['桌面通知已送达', '以后不用盯着倒计时，时间到了我负责出现。']
  ];
  const item = tests[Math.floor(Math.random() * tests.length)];
  const permission = await requestBrowserNotificationPermission();
  if (permission === 'denied' || permission === 'request-failed' || permission === 'unavailable') {
    setNotificationReady(false);
    notificationNeedsSettings = true;
    notificationPromptVisible = canShowNotificationPrompt();
    renderNotificationExperience({ reveal: true });
    showToast('桌面通知还没开启', notificationPlatformCopy('failure'));
    return { ok: false, reason: permission };
  }
  els.notificationShortcut.disabled = true;
  els.notificationEnable.disabled = true;
  els.notificationShortcut.classList.add('is-testing');
  setTopAction(els.notificationShortcut, '正在投递系统通知…');
  const result = window.desktop?.notify
    ? await window.desktop.notify(item[0], item[1])
    : ('Notification' in window && Notification.permission === 'granted'
      ? (new Notification(item[0], { body: item[1] }), { ok: true, reason: 'browser' })
      : { ok: false, reason: permission });

  els.notificationShortcut.disabled = false;
  els.notificationEnable.disabled = false;
  els.notificationShortcut.classList.remove('is-testing');
  els.settingsMenu.classList.remove('is-open');
  els.settingsToggle.setAttribute('aria-expanded', 'false');

  if (result?.ok) {
    setNotificationReady(true);
    notificationNeedsSettings = false;
    notificationPromptVisible = false;
    renderNotificationExperience();
    showToast('系统通知已发出', notificationPlatformCopy('success'));
  } else {
    setNotificationReady(false);
    notificationNeedsSettings = true;
    notificationPromptVisible = canShowNotificationPrompt();
    renderNotificationExperience();
    showToast('系统通知没有出现', notificationPlatformCopy('failure'));
  }
  return result;
}

async function openNotificationPreferences() {
  els.settingsMenu.classList.remove('is-open');
  els.settingsToggle.setAttribute('aria-expanded', 'false');
  notificationSettingsAwaitingFocus = true;
  const opened = await window.desktop?.openNotificationSettings?.();
  if (!opened) notificationSettingsAwaitingFocus = false;
  notificationNeedsSettings = Boolean(opened);
  // 系统级开关无法可靠回读。用户已主动处理过设置时，今天不再反复弹引导；
  // 需要确认时可随时点顶部铃铛发送一条测试通知。
  if (opened) markNotificationOnboardingSeen();
  notificationPromptVisible = !opened && canShowNotificationPrompt();
  renderNotificationExperience({ reveal: !opened });
  showToast(
    opened ? '已打开通知设置' : '请手动打开通知设置',
    opened ? '设置完成后，点右上角铃铛试一条通知。' : notificationPlatformCopy('failure')
  );
}

function renderSoundState() {
  els.soundToggle.classList.toggle('is-muted', !soundEnabled);
  els.soundToggle.setAttribute('aria-pressed', String(!soundEnabled));
  els.soundToggle.textContent = soundEnabled ? '关闭音效' : '开启音效';
}

els.soundToggle.addEventListener('click', async () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem(STORAGE.sound, soundEnabled ? 'on' : 'off');
  if (!soundEnabled) {
    els.checkoutVoice.pause(); els.checkoutVoice.currentTime = 0;
    window.speechSynthesis?.cancel();
    if (audioContext?.state === 'running') await audioContext.suspend();
  } else if (audioContext?.state === 'suspended') await audioContext.resume();
  await window.desktop?.setSoundEnabled?.(soundEnabled);
  renderSoundState();
});

function renderUpdateState(result = availableUpdate) {
  const hasUpdate = Boolean(result?.ok && result.available);
  els.updateCheck.classList.toggle('has-update', hasUpdate);
  setTopAction(els.updateCheck, hasUpdate ? `发现 ${result.latestVersion} · 点击更新` : '检查更新');
}

async function checkUpdates({ silent = false } = {}) {
  if (!window.desktop?.checkForUpdate) return null;
  if (!silent) { els.updateCheck.disabled = true; setTopAction(els.updateCheck, '正在检查更新…'); }
  const result = await window.desktop.checkForUpdate();
  availableUpdate = result?.ok && result.available ? result : null;
  els.updateCheck.disabled = false; renderUpdateState();
  if (result?.ok && result.available) {
    if (silent) showToast(`发现新版 ${result.latestVersion}`, '右上角已亮灯。点更新按钮，马歇歇会自动下载安装包。');
    return result;
  }
  if (!silent) {
    if (!result?.ok && result?.reason === 'not-configured') showToast('更新地址待发布', '自动更新功能已接好；配置 HTTPS 版本清单后即可自动识别新版本。');
    else if (!result?.ok && result?.reason === 'platform-unavailable') showToast('当前系统暂无新版', '官网还没有发布适合这个系统的安装包。');
    else if (!result?.ok) showToast('暂时没查到新版', `检查失败：${result?.reason || '网络开小差'}。`);
    else showToast('已经是最新版', `当前版本 ${result.currentVersion}，暂时不用折腾。`);
  }
  return result;
}

els.updateCheck.addEventListener('click', async () => {
  if (els.updateCheck.disabled) return;
  const result = availableUpdate || await checkUpdates();
  if (!result?.ok || !result.available) return;
  els.updateCheck.disabled = true; els.updateCheck.classList.add('is-downloading'); els.updateCheck.classList.remove('has-update');
  setTopAction(els.updateCheck, '正在下载新版…');
  const onProgress = (_event, progress) => {
    const percent = Math.max(0, Math.min(100, Number(progress?.percent) || 0));
    els.updateCheck.style.setProperty('--update-progress', `${percent * 3.6}deg`);
    setTopAction(els.updateCheck, `正在下载 ${Math.round(percent)}%`);
  };
  window.desktop.onUpdateProgress?.(onProgress);
  const download = await window.desktop.downloadUpdate(result);
  window.desktop.offUpdateProgress?.(onProgress);
  els.updateCheck.disabled = false; els.updateCheck.classList.remove('is-downloading'); els.updateCheck.style.removeProperty('--update-progress');
  if (download?.ok) {
    availableUpdate = null; renderUpdateState();
    const installCopy = window.desktop?.platform === 'win32'
      ? 'Windows 安装程序已经打开，请按提示完成覆盖安装。'
      : '安装窗口已经打开。把“马上下班”拖进应用程序，即可覆盖旧版。';
    showToast('新版安装包已下载', installCopy);
  } else {
    availableUpdate = result; renderUpdateState();
    showToast('新版下载失败', download?.reason || '网络开小差了，请稍后再试。');
  }
});

els.notificationShortcut.addEventListener('click', sendTestNotification);
els.notificationEnable.addEventListener('click', async () => {
  await openNotificationPreferences();
});
function dismissNotificationOnboarding(showFeedback = false) {
  markNotificationOnboardingSeen();
  notificationPromptVisible = false;
  notificationNeedsSettings = false;
  renderNotificationExperience();
  if (showFeedback) showToast('今天先算了', '提醒入口还在右上角；想起来时，点铃铛就能再试。');
}
els.notificationLater.addEventListener('click', () => dismissNotificationOnboarding(true));
els.notificationOnboardingClose.addEventListener('click', () => dismissNotificationOnboarding(false));
els.notificationSettings.addEventListener('click', openNotificationPreferences);

function commitStartTimeEdit() {
  if (els.startTime.value === startTimeBeforeEdit) return true;
  if (!updateStartTime(els.startTime.value)) {
    const shift = getShift();
    els.startTime.value = shift?.startedAt ? timeText(new Date(shift.startedAt)) : '';
    showToast('这个上班时间不能使用', '上班时间要早于计划下班时间，也不能晚于现在。');
    return false;
  }
  startTimeBeforeEdit = els.startTime.value;
  return true;
}

function commitPlanTimeEdit() {
  if (els.planTime.value === planTimeBeforeEdit) return true;
  if (!updatePlannedEnd(els.planTime.value)) {
    const shift = getShift();
    els.planTime.value = shift?.plan || '';
    return false;
  }
  planTimeBeforeEdit = els.planTime.value;
  return true;
}

// Native time inputs may emit a complete-looking value as soon as the first
// hour digit is typed (for example “1” becomes “01:xx”). Never recalculate the
// other endpoint from that intermediate value; commit only on Enter or blur.
els.startTime.addEventListener('focus', () => { shiftTimeEditing = true; startTimeBeforeEdit = els.startTime.value; });
els.planTime.addEventListener('focus', () => { shiftTimeEditing = true; planTimeBeforeEdit = els.planTime.value; });
els.planDate.addEventListener('click', togglePlanDay);
els.startTime.addEventListener('blur', () => {
  commitStartTimeEdit();
  shiftTimeEditing = false;
  tick();
});
els.planTime.addEventListener('blur', () => {
  commitPlanTimeEdit();
  shiftTimeEditing = false;
  tick();
});
[els.startTime, els.planTime].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (input === els.startTime) commitStartTimeEdit();
    else commitPlanTimeEdit();
    input.blur();
  });
});

function renderPetSetting(enabled = petEnabled) {
  petEnabled = Boolean(enabled);
  localStorage.setItem(STORAGE.petEnabled, petEnabled ? 'on' : 'off');
  els.petToggle?.setAttribute('aria-pressed', String(petEnabled));
  if (els.petToggleState) els.petToggleState.textContent = petEnabled ? '开启' : '关闭';
}

els.petToggle?.addEventListener('click', async () => {
  if (petTogglePending) return;
  petTogglePending = true;
  els.petToggle.setAttribute('aria-busy', 'true');
  await petSettingsReady.catch(() => null);
  const requested = !petEnabled;
  const result = await window.desktop?.setPetEnabled?.(requested);
  renderPetSetting(typeof result?.enabled === 'boolean' ? result.enabled : requested);
  if (petEnabled) syncDesktopPet(getState(), new Date(), true);
  showToast(petEnabled ? '桌面宠物已开启' : '桌面宠物已关闭', petEnabled ? '马歇歇回到桌面了。右键它可以随时关闭。' : '需要陪伴时，可从设置再次打开。');
  petTogglePending = false;
  els.petToggle.removeAttribute('aria-busy');
});
els.petGuideOpen?.addEventListener('click', () => {
  els.settingsMenu.classList.remove('is-open'); els.settingsToggle.setAttribute('aria-expanded', 'false');
  els.petGuide.hidden = false; els.petGuideClose.focus();
});
els.petGuideClose?.addEventListener('click', () => { els.petGuide.hidden = true; els.petGuideOpen.focus(); });
els.petGuide?.addEventListener('click', (event) => { if (event.target === els.petGuide) els.petGuideClose.click(); });
els.petResetPosition?.addEventListener('click', async () => {
  els.settingsMenu.classList.remove('is-open'); els.settingsToggle.setAttribute('aria-expanded', 'false');
  await window.desktop?.resetPetPosition?.();
  showToast('宠物位置已重置', '马歇歇已经回到主屏幕右下角。');
});
window.desktop?.onPetSettingChanged?.((setting) => {
  if (typeof setting?.enabled === 'boolean') renderPetSetting(setting.enabled);
});

els.audioPreview.addEventListener('click', () => {
  els.settingsMenu.classList.remove('is-open');
  els.settingsToggle.setAttribute('aria-expanded', 'false');
  if (!soundEnabled) {
    showToast('当前处于静音模式', '先在设置里开启音效，再来试听语音播报。');
    return;
  }
  const kind = voicePreviewOrder[voicePreviewIndex % voicePreviewOrder.length];
  const scene = voiceScenes[kind];
  voicePreviewIndex = (voicePreviewIndex + 1) % voicePreviewOrder.length;
  playVoiceAnnouncement(kind);
  showToast(`正在试听：${scene.label}`, `再次点击，将试听下一条（${voicePreviewIndex + 1} / ${voicePreviewOrder.length}）。`);
});

const ventCopies = [
  '好想下班',
  '不想干了',
  '怎么都找我',
  '催什么催',
  '无语死了',
  '好累啊',
  '好想退休',
  '又来活了',
  '别艾特我',
  '工资呢',
  '饼吃不下',
  '让我静静',
  '明天再说',
  '谁爱干谁干',
  '心已下班',
  '人快碎了',
  '能别改吗',
  '第几版了',
  '我谢谢你',
  '下班要紧'
];
let lastVentCopy = '';
els.ventButton.addEventListener('click', () => {
  let copy;
  do { copy = ventCopies[Math.floor(Math.random() * ventCopies.length)]; } while (copy === lastVentCopy && ventCopies.length > 1);
  lastVentCopy = copy;
  els.ventButton.classList.remove('is-struck');
  void els.ventButton.offsetWidth;
  els.ventButton.classList.add('is-struck');
  setTimeout(() => els.ventButton.classList.remove('is-struck'), 460);
  saveVentCount(dateKey(), ventCountFor() + 1);
  if (els.ledger.dataset.mode === 'user') renderUserData();
  const float = document.createElement('span');
  float.className = 'vent-float-copy';
  float.style.setProperty('--drift-start', `${Math.round(Math.random() * 20 - 10)}px`);
  float.style.setProperty('--drift-end', `${Math.round(Math.random() * 48 - 24)}px`);
  float.style.marginLeft = `${Math.round(Math.random() * 28 - 14)}px`;
  float.innerHTML = `${escapeHTML(copy)} <b>+1</b>`;
  els.ventFloats.appendChild(float);
  setTimeout(() => float.remove(), 1850);
  const context = soundEnabled ? getAudioContext() : null;
  if (context) {
    if (context.state === 'suspended') context.resume();
    const start = context.currentTime;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    const knock = context.createOscillator(); const knockGain = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(196, start); oscillator.frequency.exponentialRampToValueAtTime(112, start + .32);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.3, start + .008); gain.gain.exponentialRampToValueAtTime(.0001, start + .55);
    knock.type = 'triangle'; knock.frequency.setValueAtTime(680, start); knock.frequency.exponentialRampToValueAtTime(210, start + .045);
    knockGain.gain.setValueAtTime(.18, start); knockGain.gain.exponentialRampToValueAtTime(.0001, start + .07);
    oscillator.connect(gain); gain.connect(context.destination); knock.connect(knockGain); knockGain.connect(context.destination);
    oscillator.start(start); oscillator.stop(start + .58); knock.start(start); knock.stop(start + .08);
  }
});

els.todoAdd.addEventListener('click', () => {
  if (shutdownBoundaryActive()) {
    els.todoComposer.classList.remove('is-open');
    showToast('下班结界已启动', '最后半小时禁止开新坑。真有急事，让明天那个你来接。');
    return;
  }
  els.todoComposer.classList.toggle('is-open');
  if (els.todoComposer.classList.contains('is-open')) els.todoInput.focus();
});
els.todoComposer.addEventListener('submit', (event) => {
  event.preventDefault();
  if (shutdownBoundaryActive()) {
    els.todoComposer.classList.remove('is-open');
    showToast('新坑已被结界弹回', '保存、交接、下班。现在不接受新的支线任务。');
    return;
  }
  const text = els.todoInput.value.trim(); if (!text) return;
  saveTodos([{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, done: false }, ...getTodos()]);
  els.todoInput.value = ''; els.todoComposer.classList.remove('is-open');
});
els.deferTodos.addEventListener('click', () => {
  const todos = getTodos();
  const tomorrow = tomorrowDateKey();
  let deferred = 0;
  const next = todos.map((todo) => {
    if (todo.done || todo.deferredTo) return todo;
    deferred += 1;
    return { ...todo, deferredTo: tomorrow };
  });
  if (!deferred) {
    showToast('没有需要延期的事项', '该完成的完成了，该放下的也已经放下。可以走了。');
    return;
  }
  saveTodos(next);
  showToast(`${deferred} 件事项已交给明天`, '今天的你正式停止背锅，明天会自动恢复这些便利贴。');
});
let clearTodosArmed = false;
let clearTodosTimer;
els.todoClear.addEventListener('click', () => {
  if (!getTodos().length) return;
  if (!clearTodosArmed) {
    clearTodosArmed = true;
    els.todoClear.textContent = '确认清空';
    els.todoClear.classList.add('is-armed');
    clearTodosTimer = setTimeout(() => {
      clearTodosArmed = false;
      els.todoClear.textContent = '清空全部';
      els.todoClear.classList.remove('is-armed');
    }, 3200);
    return;
  }
  clearTimeout(clearTodosTimer);
  clearTodosArmed = false;
  els.todoClear.textContent = '清空全部';
  els.todoClear.classList.remove('is-armed');
  saveTodos([]);
  showToast('便利贴已清空', '待办全撕了。工作未必消失，桌面至少清净了。');
});
els.todoList.addEventListener('click', (event) => {
  const note = event.target.closest('.todo-note'); if (!note) return;
  const todos = getTodos(); const index = todos.findIndex((todo) => todo.id === note.dataset.todoId); if (index < 0) return;
  if (event.target.matches('.todo-check')) { todos[index].done = event.target.checked; saveTodos(todos); return; }
  const action = event.target.closest('button')?.dataset.action;
  if (action === 'delete') { todos.splice(index, 1); saveTodos(todos); return; }
  if (action === 'edit') {
    const text = note.querySelector('.todo-text'); text.contentEditable = 'true'; text.focus();
    const range = document.createRange(); range.selectNodeContents(text); range.collapse(false); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    const finish = () => { const next = text.textContent.trim().slice(0, 80); if (next) todos[index].text = next; saveTodos(todos); };
    text.addEventListener('blur', finish, { once: true });
    text.addEventListener('keydown', (keyboardEvent) => { if (keyboardEvent.key === 'Enter') { keyboardEvent.preventDefault(); text.blur(); } if (keyboardEvent.key === 'Escape') renderTodos(); }, { once: true });
  }
});

document.addEventListener('pointerdown', async () => { const context = getAudioContext(); if (context?.state === 'suspended') await context.resume(); }, { once: true, capture: true });

els.planTime.value = '';
els.startTime.value = '';
// 每次启动都展示已开启附近发现的 Mock 雷达；Mock 不读取位置也不联网。
localStorage.setItem(STORAGE.radarMode, 'mock');
localStorage.setItem(STORAGE.radarDiscovery, 'on');
renderSoundState(); renderVentCount(); window.desktop?.setSoundEnabled?.(soundEnabled);
renderLedgerMode(hasUserLedgerData() ? 'user' : 'mock'); renderRadar(); renderHealth(); renderTodos(); renderRetirementPlan(); applyState(getState().name); tick(); renderNotificationExperience(); runBootLoader();
window.desktop?.getRadarConfig?.().then((config) => {
  radarRealState.source = config?.source || radarRealState.source;
  radarRealState.writeConfigured = Boolean(config?.writeConfigured);
  renderRadar();
  if (localStorage.getItem(STORAGE.radarMode) === 'real' && localStorage.getItem(STORAGE.radarDiscovery) === 'on') refreshRealRadar();
});
radarRefreshTimer = window.setInterval(() => {
  if (!document.hidden && localStorage.getItem(STORAGE.radarMode) === 'real' && localStorage.getItem(STORAGE.radarDiscovery) === 'on') refreshRealRadar();
}, 5 * 60 * 1000);
renderPetSetting(petEnabled);
if (window.desktop?.getAutoCheckInSettings) {
  window.desktop.getAutoCheckInSettings().then((settings) => {
    renderAutoCheckInSetting(settings);
    tryAutomaticCheckIn();
  });
} else {
  renderAutoCheckInSetting({ enabled: false, supported: false });
}
window.desktop?.onAutoCheckInRequest?.((payload) => tryAutomaticCheckIn(payload));
if (window.desktop?.getPetSettings) {
  petSettingsReady = window.desktop.getPetSettings().then((settings) => {
    if (typeof settings?.enabled === 'boolean') renderPetSetting(settings.enabled);
    if (settings?.enabled) syncDesktopPet(getState(), new Date(), true);
    return settings;
  });
} else {
  window.desktop?.setPetEnabled?.(petEnabled).then?.((result) => {
    if (typeof result?.enabled === 'boolean') renderPetSetting(result.enabled);
    if (result?.enabled) syncDesktopPet(getState(), new Date(), true);
  });
}
window.desktop?.syncReminderSchedule?.(getShift());
window.desktop?.onDailyReset?.(() => { tick(); renderUserData(); renderHealth(); renderTodos(); renderNotificationExperience(); });
setTimeout(() => renderNotificationExperience({ reveal: true }), 2300);
setTimeout(() => checkUpdates({ silent: true }), 7000);
updateCheckTimer = setInterval(() => checkUpdates({ silent: true }), 6 * 60 * 60 * 1000);
setInterval(tick, 1000);
setInterval(() => { copyIndex += 1; updateCopy(); }, 6500);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => syncDesktopPet(getState(), new Date(), true));
