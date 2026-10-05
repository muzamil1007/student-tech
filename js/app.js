/* ==========================================================
   app.js — النواة المشتركة بين كل الصفحات
   - الحالة (تقدم الطالب) تُحفظ الآن في localStorage.
     عند إضافة Backend: استبدل load()/save() باستدعاءات API.
   - XP والمستويات والـStreak والشارات.
   - رأس الصفحة والتذييل والوضع الداكن.
   ========================================================== */
(function () {
  'use strict';
  const D = window.DATA;

  const CONFIG = {
    lang: 'ar',
    dir: 'rtl',
    ads: false,                 // فعّلها لاحقًا لإظهار أماكن الإعلانات (.ad-slot)
    passScore: 0.6,             // نسبة النجاح في الاختبار
    xp: { lessonRead: 20, practice: 5, nodeComplete: 100, correct: 5 }
  };

  const LEVELS = [
    { xp: 0, ar: 'مبتدئ فضولي', en: 'Curious Beginner', icon: '🌱' },
    { xp: 150, ar: 'متعلم نشط', en: 'Active Learner', icon: '📘' },
    { xp: 400, ar: 'مستكشف', en: 'Explorer', icon: '🧭' },
    { xp: 1000, ar: 'مستكشف الشبكات', en: 'Network Explorer', icon: '🌐' },
    { xp: 1800, ar: 'ممارس', en: 'Practitioner', icon: '🛠️' },
    { xp: 3000, ar: 'متخصص', en: 'Specialist', icon: '🎯' },
    { xp: 5000, ar: 'خبير', en: 'Expert', icon: '👑' }
  ];

  const BADGES = [
    { id: 'first-lesson', icon: '🏆', ar: 'أول درس', desc: 'أنهِ درسك الأول', test: s => Object.keys(s.lessonRead).length >= 1 },
    { id: 'first-node', icon: '🚩', ar: 'أول محطة', desc: 'أكمل محطة كاملة', test: s => Object.keys(s.completed).length >= 1 },
    { id: 'net-beginner', icon: '⭐', ar: 'مبتدئ الشبكات', desc: 'أكمل محطة الشبكات', test: s => !!(s.completed['cyber-2'] || s.completed['networking-1']) },
    { id: 'perfect', icon: '💯', ar: 'علامة كاملة', desc: 'أجب كل أسئلة اختبار بشكل صحيح', test: s => Object.values(s.quizBest).some(b => b.correct === b.total) },
    { id: 'streak7', icon: '🔥', ar: 'أسبوع متواصل', desc: 'تعلّم 7 أيام متتالية', test: s => s.streak >= 7 },
    { id: 'xp500', icon: '💎', ar: '500 XP', desc: 'اجمع 500 نقطة خبرة', test: s => s.xp >= 500 }
  ];

  /* ---------- أدوات صغيرة ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n).toLocaleString('en-US');
  const dayStr = d => d.toLocaleDateString('en-CA');
  const today = () => dayStr(new Date());
  const yesterday = () => dayStr(new Date(Date.now() - 864e5));

  /* ---------- الحالة ---------- */
  const KEY = 'mst:v1';
  const defaults = () => ({
    name: '', xp: 0, streak: 0, lastActive: null, track: 'cyber',
    completed: {}, lessonRead: {}, quizBest: {}, practice: {},
    daily: { date: today(), lessons: 0, questions: 0, practice: 0 }, badges: {}
  });
  function load() {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { return defaults(); }
  }
  let state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* التخزين غير متاح */ } }

  function touch() {
    const t = today();
    if (state.daily.date !== t) state.daily = { date: t, lessons: 0, questions: 0, practice: 0 };
    if (state.lastActive !== t) {
      state.streak = state.lastActive === yesterday() ? state.streak + 1 : 1;
      state.lastActive = t;
    }
  }
  function shownStreak() {
    return (state.lastActive === today() || state.lastActive === yesterday()) ? state.streak : 0;
  }
  function dailyNow() {
    return state.daily.date === today() ? state.daily : { date: today(), lessons: 0, questions: 0, practice: 0 };
  }

  /* ---------- المستويات ---------- */
  function levelInfo(xp) {
    let i = 0;
    LEVELS.forEach((l, k) => { if (xp >= l.xp) i = k; });
    const cur = LEVELS[i], next = LEVELS[i + 1] || null;
    const pct = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100;
    return { n: i + 1, cur, next, pct, toNext: next ? next.xp - xp : 0 };
  }

  /* ---------- رسائل وإشعارات ---------- */
  function toast(msg) {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  const queue = [];
  function celebrate(o) {
    queue.push(o);
    if (!$('#celebrate-dlg')) {
      const dlg = document.createElement('dialog');
      dlg.id = 'celebrate-dlg';
      dlg.addEventListener('close', () => { if (queue.length) showCelebration(); });
      document.body.appendChild(dlg);
    }
    if (!$('#celebrate-dlg').open) showCelebration();
  }
  function showCelebration() {
    const o = queue.shift(); if (!o) return;
    const dlg = $('#celebrate-dlg');
    const acts = (o.actions || []).map(a => `<a class="btn" href="${a.href}">${a.label}</a>`).join('');
    dlg.innerHTML = `<div class="celebrate"><div class="big" aria-hidden="true">${o.icon || '🎉'}</div>
      <h2>${o.title}</h2><p>${o.text || ''}</p>
      ${o.xp ? `<div class="xp-gain">+${o.xp} XP</div>` : ''}
      <div class="acts">${acts}<button class="btn btn-ghost" data-close>${o.closeLabel || 'متابعة'}</button></div></div>`;
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.showModal();
  }

  /* ---------- XP والشارات ---------- */
  function addXP(n, reason) {
    touch();
    const before = levelInfo(state.xp).n;
    state.xp += n;
    const after = levelInfo(state.xp);
    save();
    if (n > 0) toast('+' + n + ' XP ' + (reason ? '— ' + reason : ''));
    if (after.n > before) {
      celebrate({ icon: after.cur.icon, title: 'Level Up! 🎉', text: `وصلت إلى المستوى ${after.n} — <b dir="ltr">${after.cur.en}</b>` });
    }
    checkBadges();
    updateChip();
  }
  function checkBadges() {
    let changed = false;
    BADGES.forEach(b => {
      if (!state.badges[b.id] && b.test(state)) {
        state.badges[b.id] = today(); changed = true;
        toast('🏅 شارة جديدة: ' + b.ar);
      }
    });
    if (changed) save();
  }
  function bump(key, n = 1) { touch(); state.daily[key] += n; save(); }

  /* ---------- المسارات والمحطات ---------- */
  const getTrack = id => D.TRACKS.find(t => t.id === id);
  function getNode(id) {
    for (const t of D.TRACKS) {
      const i = t.nodes.findIndex(n => n.id === id);
      if (i >= 0) return { track: t, node: t.nodes[i], index: i };
    }
    return null;
  }
  function nodeStatus(track, i) {
    const n = track.nodes[i];
    if (state.completed[n.id]) return 'done';
    if (i === 0 || state.completed[track.nodes[i - 1].id]) return 'current';
    return 'locked';
  }
  function trackProgress(t) {
    const done = t.nodes.filter(n => state.completed[n.id]).length;
    return { done, total: t.nodes.length, pct: Math.round(done / t.nodes.length * 100) };
  }
  function nextNode(t) {
    const i = t.nodes.findIndex(n => !state.completed[n.id]);
    return i < 0 ? null : { node: t.nodes[i], index: i };
  }

  function trackCard(t) {
    const p = trackProgress(t);
    return `<article class="track-card" style="--h:${t.hue}">
      <div class="tc-top"><span class="tc-ico" aria-hidden="true">${t.icon}</span><span class="chip">${t.level}</span></div>
      <h3><bdi>${t.en}</bdi></h3>
      <p>${t.desc}</p>
      ${p.done ? `<div class="bar sm" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.pct}%"></i></div><small>${p.done} من ${p.total} محطات</small>`
        : `<small>${t.nodes.length} محطة</small>`}
      <a class="btn btn-sm" href="roadmap.html?track=${t.id}">${p.done ? 'تابع المسار' : 'ابدأ المسار'}</a>
    </article>`;
  }

  /* مسار منحنٍ بين نقاط (يُستخدم في الصفحة الرئيسية وفي Roadmap) */
  function trailPath(pts) {
    let d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], ym = (y0 + y1) / 2;
      d += ` C ${x0} ${ym}, ${x1} ${ym}, ${x1} ${y1}`;
    }
    return d;
  }

  /* ---------- الرأس والتذييل ---------- */
  const NAV = [
    ['home', 'index.html', 'الرئيسية'], ['roadmap', 'roadmap.html', 'المسارات'], ['lessons', 'lessons.html', 'الدروس'],
    ['quizzes', 'quizzes.html', 'الاختبارات'], ['tools', 'tools.html', 'الأدوات'], ['dictionary', 'dictionary.html', 'القاموس'],
    ['library', 'library.html', 'المكتبة'], ['dashboard', 'dashboard.html', 'لوحتي']
  ];
  const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--brand)"/><path d="M8 24 C8 15 24 17 24 8" fill="none" stroke="var(--brand-ink)" stroke-width="2.6" stroke-linecap="round"/><circle cx="8" cy="24" r="3" fill="var(--brand-ink)"/><circle cx="24" cy="8" r="3" fill="var(--xp)"/></svg>`;

  function chipHTML() {
    const L = levelInfo(state.xp);
    return `<span title="نقاط الخبرة">⭐ <b id="chip-xp">${fmt(state.xp)}</b> XP</span><span title="أيام متتالية">🔥 <b id="chip-streak">${shownStreak()}</b></span><span class="lvl" title="المستوى">${L.cur.icon} ${L.n}</span>`;
  }
  function updateChip() { const c = $('#xp-pill'); if (c) c.innerHTML = chipHTML(); }

  function renderChrome(active) {
    const h = $('#app-header');
    if (h) {
      h.innerHTML = `<header class="site-header"><div class="wrap">
        <div class="hd-row"><a class="logo" href="index.html">${LOGO}<span>مساعد الطالب التقني</span></a></div>
        <nav class="main-nav" aria-label="التنقل الرئيسي">${NAV.map(n => `<a href="${n[1]}" ${n[0] === active ? 'aria-current="page"' : ''}>${n[2]}</a>`).join('')}</nav>
        <div class="hd-tools"><a class="xp-pill" id="xp-pill" href="dashboard.html" title="لوحتي">${chipHTML()}</a>
        <button class="icon-btn" id="theme-btn" aria-label="تبديل الوضع الداكن"></button></div>
      </div></header>`;
      const btn = $('#theme-btn');
      const sync = () => { btn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'; };
      sync();
      btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('mst:theme', next); } catch (e) { }
        sync();
      });
    }
    const f = $('#app-footer');
    if (f) {
      f.innerHTML = `<footer class="site-footer"><div class="wrap">
        <div class="ad-slot" data-slot="footer-banner">مساحة إعلانية</div>
        <div class="foot"><div><b>مساعد الطالب التقني</b><br>منصة تعليمية تفاعلية للمبتدئين في التقنية.<br><small class="muted">نسخة MVP التعليمية — المحتوى قابل للتوسع</small></div>
        <nav aria-label="روابط التذييل">${NAV.map(n => `<a href="${n[1]}">${n[2]}</a>`).join('')}</nav></div></div></footer>`;
    }
  }

  function init(active) {
    document.documentElement.lang = CONFIG.lang;
    document.documentElement.dir = CONFIG.dir;
    if (CONFIG.ads) document.documentElement.dataset.ads = 'on';
    renderChrome(active);
  }

  /* ---------- نسخ إلى الحافظة ---------- */
  function copy(text) {
    const done = () => toast('تم النسخ ✓');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);
    else {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { } ta.remove(); done();
    }
  }

  /* ---------- بيانات تجريبية وإعادة ضبط ---------- */
  function seedDemo() {
    const t = today();
    state = Object.assign(defaults(), {
      name: 'سارة', xp: 1240, streak: 7, lastActive: t, track: 'cyber',
      completed: { 'cyber-1': 1, 'cyber-2': 1, 'cyber-3': 1 },
      lessonRead: { 'cyber-1': 1, 'cyber-2': 1, 'cyber-3': 1 },
      quizBest: { 'cyber-1': { correct: 5, total: 5 }, 'cyber-2': { correct: 4, total: 5 }, 'cyber-3': { correct: 4, total: 5 } },
      practice: { 'cyber-1': [0, 1, 2], 'cyber-2': [0, 1], 'cyber-3': [0] },
      daily: { date: t, lessons: 1, questions: 3, practice: 0 }
    });
    BADGES.forEach(b => { if (b.test(state)) state.badges[b.id] = t; });
    save();
  }
  function reset() { state = defaults(); save(); }

  window.App = {
    CONFIG, LEVELS, BADGES, $, $$, esc, fmt, S: () => state, save, touch, shownStreak, dailyNow,
    levelInfo, toast, celebrate, addXP, checkBadges, bump, getTrack, getNode, nodeStatus, trackProgress, nextNode,
    trackCard, trailPath, init, copy, seedDemo, reset, updateChip, D
  };
})();
