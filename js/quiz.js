/* quiz.js — الاختبارات
   - سؤال واحد في كل مرة، مع تفسير بعد كل إجابة (وليس صح/خطأ فقط)
   - النجاح (60%+) يُكمل المحطة ويمنح +100 XP ويفتح التالية */
(function () {
  'use strict';
  App.init('quizzes');
  const { $, $$, esc } = App;
  const S = App.S();
  const root = $('#quiz-root');
  const id = new URLSearchParams(location.search).get('node');
  const found = id && App.getNode(id);
  const bank = id && App.D.QUIZZES[id];

  if (!found || !bank) renderIndex(); else start();

  /* ---------- الفهرس ---------- */
  function renderIndex() {
    let html = `<div class="page-head"><h1>الاختبارات</h1><p>اختبار لكل محطة. أجب، اقرأ التفسير، وافتح المحطة التالية.</p></div>`;
    App.D.TRACKS.forEach(t => {
      const items = t.nodes.map((n, i) => ({ n, i })).filter(x => App.D.QUIZZES[x.n.id]);
      if (!items.length) return;
      html += `<h2 class="group-title"><span>${t.icon}</span><bdi>${t.en}</bdi></h2><div class="list-grid" style="--h:${t.hue}">` +
        items.map(({ n, i }) => {
          const st = App.nodeStatus(t, i), b = S.quizBest[n.id];
          const tag = st === 'locked' ? '<span class="chip">🔒 مقفل</span>' : b ? `<span class="chip ok">أفضل نتيجة ${b.correct}/${b.total}</span>` : '<span class="chip brand">جديد</span>';
          const href = st === 'locked' ? 'roadmap.html?track=' + t.id : 'quizzes.html?node=' + n.id;
          return `<a class="item-card" href="${href}"><span class="ic">📝</span><div><h3>${esc(n.en)} Quiz</h3><p>${esc(n.ar)} · ${App.D.QUIZZES[n.id].length} أسئلة</p><div style="margin-block-start:6px">${tag}</div></div></a>`;
        }).join('') + '</div>';
    });
    root.innerHTML = html;
  }

  /* ---------- الاختبار ---------- */
  function shuffle(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

  function start() {
    const { track, node, index } = found;
    if (App.nodeStatus(track, index) === 'locked') {
      root.innerHTML = `<div class="page-head"><h1>${esc(node.en)} Quiz</h1></div><p class="note" style="max-width:560px">🔒 أكمل «${esc(track.nodes[index - 1].ar)}» أولًا لتفتح هذا الاختبار.</p>
        <p><a class="btn" href="roadmap.html?track=${track.id}">العودة إلى الخريطة</a></p>`;
      return;
    }
    document.title = node.en + ' Quiz — مساعد الطالب التقني';

    // نخلط ترتيب الخيارات لكل سؤال مع الحفاظ على الإجابة الصحيحة
    const qs = bank.map(q => {
      const opts = shuffle(q.o.map((t, k) => ({ t, ok: k === q.a })));
      return { q: q.q, why: q.why, opts };
    });
    let i = 0, correct = 0; const log = [];

    function show() {
      const q = qs[i];
      root.innerHTML = `<div class="page-head" style="padding-block-end:14px"><div class="crumbs"><a href="roadmap.html?track=${track.id}"><bdi>${track.en}</bdi></a> / ${esc(node.ar)}</div></div>
        <div class="quiz-card">
          <div class="q-top"><span><bdi>${esc(node.en)}</bdi> Quiz</span><span class="chip">${i + 1} / ${qs.length}</span></div>
          <div class="bar sm" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="${qs.length}"><i style="width:${(i / qs.length) * 100}%"></i></div>
          <h2 class="q-text">${esc(q.q)}</h2>
          <div class="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${'ABCD'[k]}</span><span>${esc(o.t)}</span></button>`).join('')}</div>
          <div id="fb" aria-live="polite"></div></div>`;
      $$('.opt').forEach(b => b.addEventListener('click', () => answer(+b.dataset.k)));
    }

    function answer(k) {
      const q = qs[i], ok = q.opts[k].ok;
      if (ok) correct++;
      log.push({ q: q.q, ok });
      App.bump('questions');
      $$('.opt').forEach((b, n) => {
        b.disabled = true;
        if (q.opts[n].ok) b.classList.add('right');
        else if (n === k) b.classList.add('wrong');
      });
      const last = i === qs.length - 1;
      $('#fb').innerHTML = `<div class="why ${ok ? '' : 'bad'}"><b>${ok ? 'إجابة صحيحة 👏' : 'ليست هذه الإجابة'}</b><p style="margin:6px 0 0">${esc(q.why)}</p></div>
        <div class="cta-row" style="margin-block-start:16px"><button class="btn" id="next">${last ? 'عرض النتيجة' : 'السؤال التالي'}</button></div>`;
      $('#next').focus();
      $('#next').addEventListener('click', () => { if (last) finish(); else { i++; show(); } });
    }

    function finish() {
      const total = qs.length, pct = correct / total;
      const prev = S.quizBest[node.id];
      const gain = Math.max(0, correct - (prev ? prev.correct : 0)) * App.CONFIG.xp.correct;
      if (!prev || correct > prev.correct) S.quizBest[node.id] = { correct, total };
      App.save();

      const passed = pct >= App.CONFIG.passScore;
      const firstTime = passed && !S.completed[node.id];
      const msg = pct === 1 ? 'مثالي! علامة كاملة 🎉' : pct >= 0.8 ? 'Excellent! 🎉' : passed ? 'أحسنت، تجاوزت الاختبار 👍' : 'اقتربت. راجع الدرس وجرّب مرة أخرى 💪';
      const next = track.nodes[index + 1];

      root.innerHTML = `<div class="quiz-card score">
        <div class="lbl-t muted">Your Score</div>
        <div class="num">${correct} / ${total}</div>
        <h2>${msg}</h2>
        ${gain ? `<p><span class="chip xp">⭐ +${gain} XP للإجابات الصحيحة</span></p>` : ''}
        ${passed ? '' : `<p class="muted">تحتاج ${Math.ceil(total * App.CONFIG.passScore)} إجابات صحيحة على الأقل لإكمال المحطة.</p>`}
        <div class="review">${log.map(l => `<div class="r"><span>${l.ok ? '✅' : '❌'}</span><span>${esc(l.q)}</span></div>`).join('')}</div>
        <div class="cta-row" style="justify-content:center;margin-block-start:22px">
          <button class="btn btn-ghost" id="retry">إعادة الاختبار</button>
          <a class="btn btn-ghost" href="lessons.html?node=${node.id}">مراجعة الدرس</a>
          <a class="btn" href="roadmap.html?track=${track.id}">العودة إلى الخريطة</a></div></div>`;
      $('#retry').addEventListener('click', () => location.reload());

      // XP الإجابات أولًا، ثم إكمال المحطة
      if (gain) App.addXP(gain, 'إجابات صحيحة');
      if (firstTime) {
        S.completed[node.id] = App.today ? App.today() : 1; App.save();
        App.addXP(App.CONFIG.xp.nodeComplete, '');
        App.checkBadges();
        App.celebrate({
          icon: '🎉', title: 'Great Job!',
          text: `لقد أكملت <b>${esc(node.en)}</b>${next ? `<br>تم فتح المحطة التالية: <b>${esc(next.ar)}</b> 🔓` : '<br>أنهيت كل محطات هذا المسار.'}`,
          xp: App.CONFIG.xp.nodeComplete,
          actions: [{ label: 'عرض الخريطة', href: 'roadmap.html?track=' + track.id }],
          closeLabel: 'إغلاق'
        });
      }
    }
    show();
  }
})();
