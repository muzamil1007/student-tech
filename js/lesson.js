/* lesson.js — فهرس الدروس + صفحة الدرس (8 أقسام) */
(function () {
  'use strict';
  App.init('lessons');
  const { $, $$, esc } = App;
  const S = App.S();
  const root = $('#lesson-root');
  const id = new URLSearchParams(location.search).get('node');
  const found = id && App.getNode(id);
  const lesson = found && App.D.LESSONS[id];

  if (!found || !lesson) renderIndex(); else renderLesson(found, lesson);

  /* ---------- الفهرس ---------- */
  function renderIndex() {
    let html = `<div class="page-head"><h1>الدروس</h1>
      <p>كل درس يتبع الهيكل نفسه: مصطلح، فكرة، آلية عمل، أمثلة، تطبيق ثم اختبار قصير.</p></div>`;
    App.D.TRACKS.forEach(t => {
      const items = t.nodes.map((n, i) => ({ n, i })).filter(x => x.n.hasContent);
      if (!items.length) return;
      html += `<h2 class="group-title"><span>${t.icon}</span><bdi>${t.en}</bdi></h2><div class="list-grid" style="--h:${t.hue}">` +
        items.map(({ n, i }) => {
          const st = App.nodeStatus(t, i);
          const L = App.D.LESSONS[n.id];
          const tag = st === 'done' ? '<span class="chip ok">✅ مكتمل</span>' : st === 'locked' ? '<span class="chip">🔒 مقفل</span>' : '<span class="chip brand">متاح</span>';
          return `<a class="item-card" href="lessons.html?node=${n.id}"><span class="ic">${t.icon}</span>
            <div><h3>${esc(n.ar)}</h3><p>${esc(L.term.en)} · ~${L.minutes} دقيقة</p><div style="margin-block-start:6px">${tag}</div></div></a>`;
        }).join('') + '</div>';
    });
    html += `<p class="muted" style="margin-block:28px 60px">باقي المحطات في كل مسار قيد الإعداد. ستجدها على <a href="roadmap.html">خريطة المسار</a> فور إضافتها.</p>`;
    root.innerHTML = html;
  }

  /* ---------- صفحة الدرس ---------- */
  function renderLesson({ track, node, index }, L) {
    document.title = node.ar + ' — مساعد الطالب التقني';
    const st = App.nodeStatus(track, index);
    if (st === 'locked') {
      root.innerHTML = `<div class="page-head"><h1>${esc(node.ar)}</h1></div>
        <p class="note" style="max-width:560px">🔒 هذا الدرس مقفل. أكمل «${esc(track.nodes[index - 1].ar)}» أولًا.</p>
        <p><a class="btn" href="roadmap.html?track=${track.id}">العودة إلى الخريطة</a></p>`;
      return;
    }

    const codes = [];
    const codeBlock = txt => { codes.push(txt); return `<pre class="code" dir="ltr"><button class="copy" data-copy="${codes.length - 1}">نسخ</button>${esc(txt)}</pre>`; };
    const sections = [
      ['term', 'المصطلح', `<div class="term-box"><div class="t">${esc(L.term.en)}</div><div><b>${esc(L.term.ar)}</b></div></div><p>${L.term.def}</p>`],
      ['simple', 'الفكرة ببساطة', `<p>${L.simple}</p>`],
      ['how', 'كيف يعمل؟', `<ol class="how">${L.how.map(h => `<li>${h}</li>`).join('')}</ol>`],
      ['real', 'مثال واقعي', `<p>${L.real}</p>`],
      ['example', 'مثال عملي', `<p>${L.example.intro}</p>${codeBlock(L.example.code)}`],
      ['practice', 'تطبيق', `<p>نفّذ هذه التمارين بنفسك. كل تمرين تُنجزه يمنحك +${App.CONFIG.xp.practice} XP.</p><ul class="tasks">${L.practice.map((p, k) => {
        const done = (S.practice[node.id] || []).includes(k);
        return `<li><label><input type="checkbox" data-k="${k}" ${done ? 'checked disabled' : ''}><span>${esc(p)}</span></label></li>`;
      }).join('')}</ul>`],
      ['relation', 'علاقته بالتخصص', `<p>${L.relation}</p>`],
      ['quiz', 'اختبار قصير', `<p>اختبر فهمك بخمسة أسئلة. النجاح فيه يُكمل المحطة ويفتح التي بعدها.</p>
        <div class="cta-row"><button class="btn btn-xp" id="read-btn"></button><a class="btn" href="quizzes.html?node=${node.id}">ابدأ الاختبار</a></div>`]
    ];

    root.innerHTML = `<div class="page-head" style="padding-block-end:10px">
        <div class="crumbs"><a href="roadmap.html?track=${track.id}"><bdi>${track.en}</bdi></a> / ${esc(node.ar)}</div>
        <h1>${esc(node.ar)}</h1>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-block-start:10px"><span class="chip">⏱ ~${L.minutes} دقيقة</span>
        <span class="chip xp">⭐ +${App.CONFIG.xp.lessonRead} XP عند الإنهاء</span>${st === 'done' ? '<span class="chip ok">✅ مكتمل</span>' : ''}</div></div>
      <div class="lesson-grid">
        <aside class="toc" aria-label="أقسام الدرس"><ol>${sections.map((s, k) => `<li><a href="#${s[0]}">${k + 1}. ${s[1]}</a></li>`).join('')}</ol>
          <div class="ad-slot" data-slot="lesson-sidebar">مساحة إعلانية</div></aside>
        <article>${sections.map((s, k) => `<section class="lsec" id="${s[0]}"><h2><span class="n">${k + 1}</span>${s[1]}</h2>${s[2]}</section>`).join('')}</article>
      </div>`;

    // نسخ الأكواد
    $$('[data-copy]').forEach(b => b.addEventListener('click', () => App.copy(codes[+b.dataset.copy])));

    // تمارين
    $$('.tasks input').forEach(inp => inp.addEventListener('change', () => {
      if (!inp.checked) return;
      const k = +inp.dataset.k;
      S.practice[node.id] = S.practice[node.id] || [];
      if (!S.practice[node.id].includes(k)) {
        S.practice[node.id].push(k); inp.disabled = true;
        App.bump('practice'); App.addXP(App.CONFIG.xp.practice, 'تمرين منجز');
      }
    }));

    // إنهاء قراءة الدرس
    const btn = $('#read-btn');
    const sync = () => {
      const r = !!S.lessonRead[node.id];
      btn.textContent = r ? '✓ أنهيت قراءة الدرس' : 'أنهيت قراءة الدرس';
      btn.disabled = r;
    };
    sync();
    btn.addEventListener('click', () => {
      if (S.lessonRead[node.id]) return;
      S.lessonRead[node.id] = 1; App.save(); App.bump('lessons');
      App.addXP(App.CONFIG.xp.lessonRead, 'أنهيت الدرس'); sync();
    });
  }
})();
