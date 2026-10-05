/* library.js — مكتبة الطالب: بحث + تصنيف حسب النوع والتخصص
   الملفات الحقيقية تُربط لاحقًا بحقل url لكل مورد في data.js */
(function () {
  'use strict';
  App.init('library');
  const { $, $$, esc } = App;
  const { LIBRARY, TYPES, TRACKS } = App.D;

  const q = $('#lq'), grid = $('#lib-grid'), types = $('#types'), sel = $('#ltrack');
  let type = 'all';

  types.innerHTML = [['all', 'الكل'], ...Object.entries(TYPES)]
    .map(([k, v]) => `<button data-t="${k}" aria-pressed="${k === 'all'}">${v}</button>`).join('');
  sel.innerHTML = '<option value="all">كل التخصصات</option>' + TRACKS.map(t => `<option value="${t.id}">${t.icon} ${t.en}</option>`).join('');

  types.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    type = b.dataset.t;
    $$('[data-t]', types).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  q.addEventListener('input', render);
  sel.addEventListener('change', render);

  function render() {
    const s = q.value.trim().toLowerCase();
    const list = LIBRARY.filter(r =>
      (type === 'all' || r.t === type) && (sel.value === 'all' || r.track === sel.value) &&
      (!s || r.title.toLowerCase().includes(s) || r.ar.includes(s)));

    if (!list.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">لا توجد موارد مطابقة. غيّر البحث أو التصنيف.</div>'; return; }

    grid.innerHTML = list.map((r, i) => {
      const t = App.getTrack(r.track);
      return `<div class="item-card" style="--h:${t.hue}"><span class="ic" aria-hidden="true">${t.icon}</span>
        <div><h3 dir="ltr" style="text-align:start">${esc(r.title)}</h3><p>${esc(r.ar)}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-block:8px">
            <span class="chip">${TYPES[r.t]}</span>${r.premium ? '<span class="chip premium">👑 Premium</span>' : '<span class="chip ok">مجاني</span>'}</div>
          <button class="btn btn-sm ${r.premium ? 'btn-ghost' : ''}" data-i="${LIBRARY.indexOf(r)}">${r.premium ? 'متاح مع Premium' : 'فتح'}</button></div></div>`;
    }).join('');
  }

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const r = LIBRARY[+b.dataset.i];
    App.toast(r.premium ? 'هذا المورد سيكون ضمن Premium لاحقًا' : 'الملف الفعلي سيُضاف في النسخة القادمة');
  });

  render();
})();
