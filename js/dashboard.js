/* dashboard.js — لوحة الطالب
   لا يوجد تسجيل دخول في النسخة الأولى: التقدم محفوظ على الجهاز.
   لاحقًا: استبدل App.S() ببيانات المستخدم القادمة من الـ Backend. */
(function () {
  'use strict';
  App.init('dashboard');
  const { $, $$, esc, fmt } = App;
  const S = App.S();
  const root = $('#dash-root');

  const L = App.levelInfo(S.xp);
  const dy = App.dailyNow();
  const isNew = S.xp === 0 && !Object.keys(S.completed).length;

  const goals = [
    { t: 'أنهِ درسًا واحدًا', v: dy.lessons, max: 1 },
    { t: 'أجب عن 5 أسئلة', v: dy.questions, max: 5 },
    { t: 'أنجز تمرينًا عمليًا', v: dy.practice, max: 1 }
  ];

  // أين يكمل الطالب؟
  const track = App.getTrack(S.track) || App.D.TRACKS[0];
  const nx = App.nextNode(track);
  let cont = '';
  if (nx) {
    const has = nx.node.hasContent;
    cont = `<div class="continue"><div><div class="muted" style="font-size:.9rem">Continue Learning · <bdi>${track.en}</bdi></div>
      <b style="font-size:1.15rem">${esc(nx.node.ar)}</b></div>
      <a class="btn" href="${has ? 'lessons.html?node=' + nx.node.id : 'roadmap.html?track=' + track.id}">${has ? 'تابع التعلم' : 'افتح الخريطة'}</a></div>`;
  } else {
    cont = `<div class="continue"><b>🏁 أنهيت كل محطات هذا المسار!</b><a class="btn" href="roadmap.html">اختر مسارًا جديدًا</a></div>`;
  }

  // المسارات التي بدأها الطالب (وأيضًا المسار الحالي)
  const started = App.D.TRACKS.filter(t => t.id === track.id || App.trackProgress(t).done > 0);

  root.innerHTML = `
    <div class="page-head">
      <h1>Welcome back 👋 ${S.name ? esc(S.name) : ''}</h1>
      <form class="name-form" id="name-form" style="margin-block-start:10px">
        <label class="sr-only" for="nm">اسمك</label>
        <input type="text" id="nm" placeholder="اكتب اسمك ليظهر هنا" value="${esc(S.name)}" maxlength="24" style="max-width:240px">
        <button class="btn btn-ghost btn-sm" type="submit">حفظ الاسم</button>
      </form>
    </div>

    ${isNew ? `<div class="panel full" style="margin-block-end:20px"><h2>ابدأ من هنا</h2>
      <p class="muted">لم تبدأ أي مسار بعد. اختر تخصصك وأنهِ أول درس لتظهر هنا نقاطك وإنجازاتك.</p>
      <div class="cta-row"><a class="btn" href="roadmap.html">اختر تخصصك</a><button class="btn btn-ghost" id="demo">شاهد لوحة بيانات تجريبية</button></div></div>` : ''}

    <div class="dash-grid">
      <section class="panel">
        <h2>Your Learning Progress <span class="chip xp">${L.cur.icon} Level ${L.n}</span></h2>
        <div class="lvl-name"><bdi>${L.cur.en}</bdi> · ${L.cur.ar}</div>
        <div class="bar xp" style="margin-block:10px 6px" role="progressbar" aria-valuenow="${L.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${L.pct}%"></i></div>
        <small class="muted">${L.next ? `باقي ${fmt(L.toNext)} XP للوصول إلى ${L.next.ar}` : 'وصلت لأعلى مستوى 👑'}</small>
        <div class="stat-row">
          <div class="stat"><b>${fmt(S.xp)}</b><small>⭐ XP</small></div>
          <div class="stat"><b>${App.shownStreak()}</b><small>🔥 أيام متتالية</small></div>
          <div class="stat"><b>${Object.keys(S.completed).length}</b><small>✅ محطات مكتملة</small></div>
        </div>
        ${cont}
      </section>

      <section class="panel">
        <h2>Today's Goal</h2>
        ${goals.map(g => { const done = g.v >= g.max; return `<div class="goal ${done ? 'done' : ''}"><span class="ck">${done ? '✓' : ''}</span><span>${g.t}</span><small>${Math.min(g.v, g.max)}/${g.max}</small></div>`; }).join('')}
        <p class="muted" style="font-size:.88rem;margin:14px 0 0">${goals.every(g => g.v >= g.max) ? '🎯 حققت هدف اليوم. أحسنت!' : 'أنجز الأهداف الثلاثة للحفاظ على سلسلتك.'}</p>
      </section>

      <section class="panel">
        <h2>مساراتي</h2>
        ${started.map(t => { const p = App.trackProgress(t); return `<div class="tp"><div class="l"><a href="roadmap.html?track=${t.id}"><bdi>${t.icon} ${t.en}</bdi></a><span>${p.pct}%</span></div>
          <div class="bar sm" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.pct}%"></i></div>
          <small class="muted">${p.done} من ${p.total} محطات</small></div>`; }).join('')}
        <p style="margin:12px 0 0"><a href="roadmap.html">+ ابدأ مسارًا آخر</a></p>
      </section>

      <section class="panel">
        <h2>Achievements <span class="chip">${Object.keys(S.badges).length} / ${App.BADGES.length}</span></h2>
        <div class="badges">${App.BADGES.map(b => { const on = !!S.badges[b.id]; return `<div class="badge ${on ? 'on' : 'off'}"><span class="bi" aria-hidden="true">${b.icon}</span><b>${b.ar}</b><small>${on ? 'تم الحصول عليها' : b.desc}</small></div>`; }).join('')}</div>
      </section>

      <section class="panel full" style="display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;align-items:center">
        <div><b>👑 Premium قريبًا</b><div class="muted" style="font-size:.92rem">مختبرات عملية، مشاريع، اختبارات متقدمة وشهادات.</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isNew ? '' : '<button class="btn btn-ghost btn-sm" id="demo">تحميل بيانات تجريبية</button>'}
          <button class="btn btn-ghost btn-sm" id="reset">مسح تقدمي</button></div>
      </section>
    </div>`;

  $('#name-form').addEventListener('submit', e => {
    e.preventDefault(); S.name = $('#nm').value.trim(); App.save(); location.reload();
  });
  const demo = $('#demo');
  if (demo) demo.addEventListener('click', () => { App.seedDemo(); location.reload(); });
  $('#reset').addEventListener('click', () => {
    if (confirm('سيتم مسح كل تقدمك المحفوظ على هذا الجهاز. هل أنت متأكد؟')) { App.reset(); location.reload(); }
  });
})();
