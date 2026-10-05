/* dictionary.js — قاموس IT: بحث عربي/English + تصنيفات + مصطلحات مرتبطة */
(function () {
  'use strict';
  App.init('dictionary');
  const { $, $$, esc } = App;
  const { DICT, CATS } = App.D;

  const q = $('#q'), box = $('#terms'), filters = $('#filters');
  let cat = 'all';
  let openTerm = null; // اسم المصطلح الذي يجب أن يظهر مفتوحًا بعد الانتقال إليه

  // توحيد النص العربي: إزالة التشكيل وتوحيد الهمزات والتاء المربوطة والياء
  const norm = s => String(s).toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

  filters.innerHTML = Object.entries(CATS).map(([k, v]) => `<button data-cat="${k}" aria-pressed="${k === 'all'}">${v}</button>`).join('');
  filters.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat;
    $$('[data-cat]', filters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  q.addEventListener('input', () => { openTerm = null; render(); });

  function render() {
    const s = norm(q.value);
    const list = DICT
      .filter(t => (cat === 'all' || t.cat === cat) &&
        (!s || norm(t.en).includes(s) || norm(t.ar).includes(s) || norm(t.def).includes(s)))
      .sort((a, b) => a.en.localeCompare(b.en));

    if (!list.length) {
      box.innerHTML = `<div class="empty">لم نجد مصطلحًا مطابقًا لـ «${esc(q.value)}».<br>جرّب كلمة أقصر، أو غيّر التصنيف إلى «الكل».</div>`;
      return;
    }

    box.innerHTML = list.map(t => `<details class="term" ${openTerm === t.en || (s && list.length === 1) ? 'open' : ''}>
        <summary><b>${esc(t.en)}</b><span class="ar">${esc(t.ar)}</span><span class="chip">${CATS[t.cat]}</span></summary>
        <div class="body"><p>${esc(t.def)}</p>
          ${t.rel.length ? `<div class="rel"><span class="muted">Related Terms:</span>${t.rel.map(r => `<button data-go="${esc(r)}">${esc(r)}</button>`).join('')}</div>` : ''}
        </div></details>`).join('');
  }

  // الانتقال إلى مصطلح مرتبط
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    const name = b.dataset.go;
    const target = DICT.find(t => t.en === name);
    q.value = ''; cat = 'all';
    $$('[data-cat]', filters).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.cat === 'all')));
    openTerm = target ? target.en : null;
    render();
    if (!target) { App.toast('هذا المصطلح سيُضاف قريبًا'); return; }
    const el = $$('.term', box).find(d => $('summary b', d).textContent === target.en);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  render();
})();
