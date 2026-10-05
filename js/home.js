/* home.js — الصفحة الرئيسية: خريطة الرحلة المتحركة + بطاقات التخصصات */
(function () {
  'use strict';
  App.init('home');

  // بطاقات التخصصات
  const grid = App.$('#track-grid');
  grid.innerHTML = App.D.TRACKS.map(App.trackCard).join('');

  // رسم الرحلة في الـ Hero: تُرسم مرة واحدة عند التحميل
  const currentTrack = App.getTrack(App.S().track) || App.D.TRACKS[0];
  const pts = [[90, 50], [300, 125], [105, 220], [305, 315], [105, 410], [290, 490]];
  const sample = currentTrack.nodes.slice(0, 6);
  const nodes = sample.map((n, i) => {
    const st = App.nodeStatus(currentTrack, i);
    return [n.ar, st === 'done' ? 'done' : st === 'current' ? 'now' : 'lock', st === 'done' ? '✓' : st === 'current' ? String(i + 1) : '🔒'];
  });
  const full = App.trailPath(pts);
  const doneD = App.trailPath(pts.slice(0, 4));

  const g = nodes.map((n, i) => {
    const [x, y] = pts[i];
    const flag = n[1] === 'now'
      ? `<g class="flag" transform="translate(${x - 52} ${y - 62})"><rect width="104" height="28" rx="14"/><text x="52" y="14.5">أنت هنا</text></g>`
      : '';
    return `<g class="hn ${n[1]}" style="--i:${i}">
      <circle cx="${x}" cy="${y}" r="26"/>
      <text class="glyph" x="${x}" y="${y}">${n[2]}</text>
      <text class="lbl" x="${x}" y="${y + 46}">${n[0]}</text>${flag}</g>`;
  }).join('');

  App.$('#hero-trail').innerHTML = `
    <svg viewBox="0 0 400 540" role="img" aria-label="معاينة لمسار التعلم الحالي">
      <path class="hz-base" d="${full}"/>
      <path class="hz-done" pathLength="1" d="${doneD}"/>
      ${g}
      <g class="hxp" transform="translate(150 292)"><rect width="84" height="32" rx="16"/><text x="42" y="16.5">+100 XP</text></g>
    </svg>`;
})();
