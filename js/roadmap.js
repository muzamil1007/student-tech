/* roadmap.js — اختيار التخصص + الخريطة التفاعلية
   بدون ?track=...  → صفحة اختيار التخصص
   مع ?track=cyber  → خريطة المسار */
(function () {
  'use strict';
  App.init('roadmap');
  const { $, $$, esc } = App;
  const S = App.S();
  const root = $('#roadmap-root');
  const track = App.getTrack(new URLSearchParams(location.search).get('track'));

  if (!track) renderChooser(); else renderTrail(track);

  /* ---------- اختيار التخصص ---------- */
  function renderChooser() {
    root.innerHTML = `<div class="page-head"><h1>اختر تخصصك</h1>
      <p>كل تخصص له خريطة تبدأ من الأساسيات. اختر ما يثير فضولك الآن، ويمكنك تغييره لاحقًا.</p></div>
      <div class="track-grid" style="padding-block-end:60px">${App.D.TRACKS.map(App.trackCard).join('')}</div>`;
  }

  /* ---------- الخريطة ---------- */
  const XS = [50, 28, 72, 30, 70, 32, 72, 30, 66, 42];

  function renderTrail(t) {
    S.track = t.id; App.save();
    const p = App.trackProgress(t);
    document.title = t.en + ' — مساعد الطالب التقني';

    root.innerHTML = `<div class="page-head" style="padding-block-end:16px">
        <div class="crumbs"><a href="roadmap.html">كل المسارات</a></div></div>
      <section class="rm-head" style="--h:${t.hue}">
        <div><h1><span class="tc-ico" style="background:color-mix(in srgb,hsl(${t.hue} 75% 48%) 15%,var(--surface))" aria-hidden="true">${t.icon}</span><bdi>${t.en}</bdi></h1>
          <p class="muted" style="margin:8px 0 0">${t.desc}</p></div>
        <div><div class="rm-meta"><span>تقدمك في المسار</span><span id="rm-pct">${p.pct}%</span></div>
          <div class="bar" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.pct}%"></i></div>
          <small class="muted">${p.done} من ${p.total} محطات مكتملة · اضغط أي محطة لفتحها</small></div>
      </section>
      <ol class="trail" id="trail"><svg id="trail-svg" aria-hidden="true"></svg>
        ${t.nodes.map((n, i) => nodeHTML(t, n, i)).join('')}</ol>`;

    const trail = $('#trail');
    $$('.node', trail).forEach(b => b.addEventListener('click', () => openSheet(t, +b.dataset.i)));

    draw(t);
    let tmr; window.addEventListener('resize', () => { clearTimeout(tmr); tmr = setTimeout(() => draw(t), 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(t));
  }

  function nodeHTML(t, n, i) {
    const st = App.nodeStatus(t, i);
    const glyph = st === 'done' ? '✓' : st === 'locked' ? '🔒' : (i + 1);
    const label = { done: 'مكتملة', current: 'متاحة الآن', locked: 'مقفلة' }[st];
    return `<li><button class="node ${st} ${n.premium ? 'premium' : ''}" style="left:${XS[i % XS.length]}%" data-i="${i}" aria-label="${esc(n.ar)} — ${label}">
      ${st === 'current' ? '<span class="here">أنت هنا</span>' : ''}
      <span class="dot" aria-hidden="true">${glyph}</span>
      <span class="nm">${esc(n.ar)}</span>
      <span class="en">${esc(n.en)}</span>
      ${n.premium ? '<span class="chip premium">👑 Premium</span>' : ''}
    </button></li>`;
  }

  /* يرسم الخطوط بين مراكز الدوائر حسب أماكنها الفعلية */
  function draw(t) {
    const trail = $('#trail'), svg = $('#trail-svg');
    if (!trail || !svg) return;
    const box = trail.getBoundingClientRect();
    const pts = $$('.node .dot', trail).map(d => {
      const r = d.getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    });
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    let out = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const cls = S.completed[t.nodes[i].id] ? 'done' : (App.nodeStatus(t, i) === 'current' ? 'next' : 'locked');
      out += `<path class="seg ${cls}" d="${App.trailPath([pts[i], pts[i + 1]])}"/>`;
    }
    svg.innerHTML = out;
  }

  /* ---------- لوحة المحطة ---------- */
  function nodePct(n) {
    const total = (App.D.LESSONS[n.id] || { practice: [] }).practice.length;
    const pr = total ? (S.practice[n.id] || []).length / total : 0;
    return Math.round(100 * ((S.lessonRead[n.id] ? 1 : 0) + pr + (S.completed[n.id] ? 1 : 0)) / 3);
  }

  function openSheet(t, i) {
    const n = t.nodes[i], st = App.nodeStatus(t, i), L = App.D.LESSONS[n.id];
    const dlg = $('#sheet');
    const chip = { done: '<span class="chip ok">✅ مكتملة</span>', current: '<span class="chip brand">🔄 متاحة الآن</span>', locked: '<span class="chip">🔒 مقفلة</span>' }[st];
    let body;

    if (st === 'locked') {
      body = `<p class="note">🔒 أكمل «${esc(t.nodes[i - 1].ar)}» أولًا لتفتح هذه المحطة. هكذا تبني فوق أساس متين.</p>`;
    } else if (!L) {
      body = `<p class="note">🛠️ محتوى هذه المحطة قيد الإعداد وسيُضاف قريبًا.</p>`;
    } else {
      const q = S.quizBest[n.id];
      const pr = S.practice[n.id] || [];
      const pct = nodePct(n);
      body = `<div class="tiles">
          <a class="tile" href="lessons.html?node=${n.id}"><span class="ti">📖</span><b>Learn</b><small>درس ~${L.minutes} دقيقة ${S.lessonRead[n.id] ? '· ✓ قرأته' : ''}</small></a>
          <a class="tile" href="lessons.html?node=${n.id}#practice"><span class="ti">🧪</span><b>Practice</b><small>${pr.length} من ${L.practice.length} تمارين</small></a>
          <a class="tile" href="quizzes.html?node=${n.id}"><span class="ti">📝</span><b>Quiz</b><small>${q ? `أفضل نتيجة ${q.correct}/${q.total}` : 'لم تجرّبه بعد'}</small></a>
          <div class="tile"><span class="ti">🎯</span><b>Progress</b><small>${pct}% من المحطة</small>
            <div class="bar sm" style="margin-block-start:6px"><i style="width:${pct}%"></i></div></div>
        </div>
        <p class="muted" style="font-size:.9rem;margin:0">لإكمال المحطة وفتح التالية: انجح في الاختبار بنسبة ${Math.round(App.CONFIG.passScore * 100)}% أو أكثر.</p>`;
    }

    dlg.innerHTML = `<div class="dlg">
      <button class="icon-btn dlg-close" data-close aria-label="إغلاق">✕</button>
      <div class="sheet-head">${chip}${n.premium ? ' <span class="chip premium">👑 Premium</span>' : ''}
        <h2 id="sheet-title">${esc(n.ar)}</h2><p class="en">${esc(n.en)}</p></div>${body}</div>`;
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }, { once: true });
    dlg.showModal();
  }
})();
