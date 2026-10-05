/* tools.js — أدوات IT
   لإضافة أداة جديدة: أضف عنصرًا إلى مصفوفة TOOLS (id, icon, name, html, init). */
(function () {
  'use strict';
  App.init('tools');
  const { $, $$, esc } = App;

  /* ---------- دوال IPv4 مشتركة ---------- */
  function ip2int(s) {
    const p = s.trim().split('.');
    if (p.length !== 4) return null;
    let n = 0;
    for (const x of p) { if (!/^\d{1,3}$/.test(x) || +x > 255) return null; n = n * 256 + (+x); }
    return n;
  }
  const int2ip = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
  const bin32 = n => [24, 16, 8, 0].map(s => ((n >>> s) & 255).toString(2).padStart(8, '0')).join('.');
  const row = (k, v) => `<div><span>${k}</span><span>${esc(v)}</span></div>`;

  /* ---------- الأدوات ---------- */
  const TOOLS = [
    {
      id: 'subnet', icon: '🧮', name: 'Subnet Calculator',
      html: `<h2>Subnet Calculator</h2><p class="muted">أدخل عنوان IP وطول البادئة (CIDR) لتعرف حدود الشبكة وعدد الأجهزة.</p>
        <div class="row2"><div class="field"><label for="sn-ip">عنوان IP</label><input id="sn-ip" class="mono" type="text" value="192.168.1.77" inputmode="decimal" autocomplete="off"></div>
        <div class="field"><label for="sn-cidr">CIDR /</label><input id="sn-cidr" class="mono" type="number" min="0" max="32" value="24"></div></div>
        <div id="sn-out"></div>`,
      init(p) {
        const ipEl = $('#sn-ip', p), cEl = $('#sn-cidr', p), out = $('#sn-out', p);
        const calc = () => {
          const ip = ip2int(ipEl.value), c = parseInt(cEl.value, 10);
          if (ip === null) { out.innerHTML = '<p class="err">عنوان IP غير صالح. مثال: 192.168.1.10</p>'; return; }
          if (!(c >= 0 && c <= 32)) { out.innerHTML = '<p class="err">CIDR يجب أن يكون بين 0 و32.</p>'; return; }
          const mask = c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0;
          const net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
          const hosts = c >= 31 ? (c === 32 ? 1 : 2) : Math.pow(2, 32 - c) - 2;
          const first = c >= 31 ? net : net + 1, last = c >= 31 ? bc : bc - 1;
          out.innerHTML = `<div class="kv">${row('عنوان الشبكة', int2ip(net) + '/' + c)}${row('قناع الشبكة', int2ip(mask))}${row('Wildcard', int2ip(~mask >>> 0))}
            ${row('أول جهاز', int2ip(first))}${row('آخر جهاز', int2ip(last))}${row('Broadcast', int2ip(bc))}${row('عدد الأجهزة المتاحة', hosts.toLocaleString('en-US'))}
            ${row('القناع بالثنائي', bin32(mask))}</div>`;
        };
        p.addEventListener('input', calc); calc();
      }
    },

    {
      id: 'convert', icon: '🔢', name: 'Binary / Decimal',
      html: `<h2>Binary / Decimal / Hex</h2><p class="muted">اكتب في أي حقل وستتحدث الحقول الأخرى مباشرة.</p>
        <div class="field"><label for="cv-dec">عشري (Decimal)</label><input id="cv-dec" class="mono" type="text" value="192" inputmode="numeric" autocomplete="off"></div>
        <div class="field"><label for="cv-bin">ثنائي (Binary)</label><input id="cv-bin" class="mono" type="text" autocomplete="off"></div>
        <div class="field"><label for="cv-hex">سداسي عشري (Hex)</label><input id="cv-hex" class="mono" type="text" autocomplete="off"></div>
        <p class="err" id="cv-err"></p>`,
      init(p) {
        const f = { dec: $('#cv-dec', p), bin: $('#cv-bin', p), hex: $('#cv-hex', p) }, err = $('#cv-err', p);
        const rules = { dec: [/^\d+$/, v => BigInt(v)], bin: [/^[01]+$/, v => BigInt('0b' + v)], hex: [/^[0-9a-fA-F]+$/, v => BigInt('0x' + v)] };
        const upd = src => {
          const val = f[src].value.trim().replace(/\s+/g, '');
          err.textContent = '';
          if (!val) { Object.keys(f).forEach(k => { if (k !== src) f[k].value = ''; }); return; }
          if (!rules[src][0].test(val)) { err.textContent = 'قيمة غير صالحة لهذا النظام.'; return; }
          const n = rules[src][1](val);
          if (src !== 'dec') f.dec.value = n.toString(10);
          if (src !== 'bin') f.bin.value = n.toString(2);
          if (src !== 'hex') f.hex.value = n.toString(16).toUpperCase();
        };
        Object.keys(f).forEach(k => f[k].addEventListener('input', () => upd(k)));
        upd('dec');
      }
    },

    {
      id: 'ipinfo', icon: '📍', name: 'IP Information',
      html: `<h2>IP Information</h2><p class="muted">تحليل عنوان IPv4: نوعه، فئته، وتمثيله بأشكال مختلفة. هذا التحليل محلي، أما تحديد الموقع الجغرافي فيحتاج خدمة خارجية تُضاف مع الـ Backend.</p>
        <div class="field"><label for="ii-ip">عنوان IPv4</label><input id="ii-ip" class="mono" type="text" value="10.0.0.5" autocomplete="off"></div><div id="ii-out"></div>`,
      init(p) {
        const el = $('#ii-ip', p), out = $('#ii-out', p);
        const calc = () => {
          const n = ip2int(el.value);
          if (n === null) { out.innerHTML = '<p class="err">عنوان IPv4 غير صالح.</p>'; return; }
          const a = n >>> 24, b = (n >>> 16) & 255;
          let type = 'عام (Public)';
          if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) type = 'خاص (Private)';
          else if (a === 127) type = 'Loopback (الجهاز نفسه)';
          else if (a === 169 && b === 254) type = 'Link-local (APIPA)';
          else if (a === 100 && b >= 64 && b <= 127) type = 'CGNAT (مشاركة مزود الخدمة)';
          else if (a >= 224 && a <= 239) type = 'Multicast';
          else if (a >= 240) type = 'محجوز';
          else if (a === 0) type = 'غير محدد (0.0.0.0/8)';
          const cls = a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D' : 'E';
          const rev = el.value.trim().split('.').reverse().join('.') + '.in-addr.arpa';
          out.innerHTML = `<div class="kv">${row('النوع', type)}${row('الفئة (Class)', cls)}${row('كرقم صحيح', String(n))}${row('Hex', '0x' + n.toString(16).toUpperCase().padStart(8, '0'))}${row('Binary', bin32(n))}${row('Reverse DNS', rev)}</div>`;
        };
        el.addEventListener('input', calc); calc();
      }
    },

    {
      id: 'password', icon: '🔑', name: 'Password Generator',
      html: `<h2>Password Generator</h2><p class="muted">كلمة مرور عشوائية تُولَّد داخل متصفحك بمولّد آمن تشفيريًا.</p>
        <div class="out"><span id="pw-out"></span><button class="btn btn-sm btn-ghost" id="pw-copy">نسخ</button></div>
        <div class="meter"><i id="pw-meter"></i></div><small id="pw-str" class="muted"></small>
        <div class="field" style="margin-block-start:16px"><label for="pw-len">الطول: <b id="pw-len-v">16</b></label><input id="pw-len" type="range" min="8" max="64" value="16"></div>
        <div class="checks"><label><input type="checkbox" id="pw-lo" checked> a-z</label><label><input type="checkbox" id="pw-up" checked> A-Z</label><label><input type="checkbox" id="pw-di" checked> 0-9</label><label><input type="checkbox" id="pw-sy" checked> رموز !@#</label></div>
        <button class="btn" id="pw-gen">توليد كلمة جديدة</button>`,
      init(p) {
        const sets = { lo: 'abcdefghijklmnopqrstuvwxyz', up: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', di: '0123456789', sy: '!@#$%^&*()-_=+[]{};:,.?' };
        const rnd = n => { const max = Math.floor(4294967296 / n) * n, a = new Uint32Array(1); let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= max); return x % n; };
        const out = $('#pw-out', p), meter = $('#pw-meter', p), str = $('#pw-str', p), len = $('#pw-len', p);
        const gen = () => {
          const L = +len.value; $('#pw-len-v', p).textContent = L;
          const chosen = Object.keys(sets).filter(k => $('#pw-' + k, p).checked);
          if (!chosen.length) { out.textContent = ''; str.textContent = 'اختر نوع أحرف واحدًا على الأقل.'; meter.style.width = '0'; return; }
          const pool = chosen.map(k => sets[k]).join('');
          const chars = chosen.map(k => sets[k][rnd(sets[k].length)]);
          while (chars.length < L) chars.push(pool[rnd(pool.length)]);
          for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
          out.textContent = chars.join('');
          const bits = Math.round(L * Math.log2(pool.length));
          const lv = bits < 40 ? ['ضعيفة', 'var(--bad)', 25] : bits < 60 ? ['متوسطة', 'var(--xp)', 50] : bits < 80 ? ['قوية', 'var(--brand)', 75] : ['قوية جدًا', 'var(--ok)', 100];
          meter.style.width = lv[2] + '%'; meter.style.background = lv[1];
          str.textContent = `${lv[0]} — حوالي ${bits} بت من العشوائية`;
        };
        p.addEventListener('input', gen);
        $('#pw-gen', p).addEventListener('click', gen);
        $('#pw-copy', p).addEventListener('click', () => out.textContent && App.copy(out.textContent));
        gen();
      }
    },

    {
      id: 'hash', icon: '#️⃣', name: 'Hash Generator',
      html: `<h2>Hash Generator</h2><p class="muted">اكتب نصًا لترى بصمته. جرّب تغيير حرف واحد وراقب كيف يتغير كل شيء.</p>
        <div class="field"><label for="h-in">النص</label><textarea id="h-in" class="mono" style="min-height:90px">hello</textarea></div><div id="h-out"></div>`,
      init(p) {
        const inp = $('#h-in', p), out = $('#h-out', p);
        const algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        if (!(window.crypto && crypto.subtle)) { out.innerHTML = '<p class="err">هذه الأداة تتطلب متصفحًا حديثًا وصفحة آمنة (https أو localhost).</p>'; return; }
        let tick = 0;
        const run = async () => {
          const my = ++tick, data = new TextEncoder().encode(inp.value);
          const res = await Promise.all(algos.map(async a => {
            const buf = await crypto.subtle.digest(a, data);
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
          }));
          if (my !== tick) return;
          out.innerHTML = algos.map((a, i) => `<div class="field"><span class="lbl-t">${a}</span><div class="out"><span>${res[i]}</span><button class="btn btn-sm btn-ghost" data-h="${i}">نسخ</button></div></div>`).join('');
          $$('[data-h]', out).forEach(b => b.addEventListener('click', () => App.copy(res[+b.dataset.h])));
        };
        inp.addEventListener('input', run); run();
      }
    },

    {
      id: 'json', icon: '🧾', name: 'JSON Formatter',
      html: `<h2>JSON Formatter</h2><p class="muted">الصق JSON لتنسيقه أو ضغطه أو التحقق من صحته.</p>
        <div class="field"><label for="j-in">JSON</label><textarea id="j-in" class="mono" spellcheck="false">{"name":"Sara","track":"cyber","xp":1240,"badges":["first-lesson","streak7"]}</textarea></div>
        <div class="cta-row"><button class="btn btn-sm" id="j-fmt">تنسيق</button><button class="btn btn-sm btn-ghost" id="j-min">ضغط</button><button class="btn btn-sm btn-ghost" id="j-copy">نسخ</button></div>
        <p id="j-msg" aria-live="polite"></p>`,
      init(p) {
        const t = $('#j-in', p), msg = $('#j-msg', p);
        const go = fn => {
          try { const o = JSON.parse(t.value); t.value = fn(o); msg.className = ''; msg.textContent = '✅ JSON صالح'; }
          catch (e) { msg.className = 'err'; msg.textContent = '❌ ' + e.message; }
        };
        $('#j-fmt', p).addEventListener('click', () => go(o => JSON.stringify(o, null, 2)));
        $('#j-min', p).addEventListener('click', () => go(o => JSON.stringify(o)));
        $('#j-copy', p).addEventListener('click', () => App.copy(t.value));
      }
    },

    {
      id: 'linux', icon: '🐧', name: 'Linux Command Helper',
      html: `<h2>Linux Command Helper</h2><p class="muted">ابحث بالأمر أو بوصفه (عربي أو English).</p>
        <div class="search-bar" style="margin-block-end:8px"><input id="lx-q" type="search" placeholder="مثال: نسخ، grep، network" autocomplete="off"></div><div id="lx-out"></div>`,
      init(p) {
        const q = $('#lx-q', p), out = $('#lx-out', p);
        const render = () => {
          const s = q.value.trim().toLowerCase();
          const list = App.D.LINUX.filter(c => !s || c[0].includes(s) || c[1].toLowerCase().includes(s) || c[2].toLowerCase().includes(s));
          out.innerHTML = list.length ? list.map((c, i) => `<div class="cmd"><span class="c">${esc(c[0])}</span> <span class="muted">— ${esc(c[1])}</span>
            <pre class="code" dir="ltr"><button class="copy" data-c="${i}">نسخ</button>${esc(c[2])}</pre></div>`).join('') : '<div class="empty">لا توجد أوامر مطابقة. جرّب كلمة أخرى.</div>';
          $$('[data-c]', out).forEach(b => b.addEventListener('click', () => App.copy(list[+b.dataset.c][2])));
        };
        q.addEventListener('input', render); render();
      }
    }
  ];

  /* ---------- بناء الواجهة ---------- */
  const tabs = $('#tabs'), panels = $('#panels');
  tabs.innerHTML = TOOLS.map(t => `<button role="tab" id="tab-${t.id}" aria-controls="pn-${t.id}" data-id="${t.id}">${t.icon} ${t.name}</button>`).join('');
  panels.innerHTML = TOOLS.map(t => `<section class="tool-panel" role="tabpanel" id="pn-${t.id}" aria-labelledby="tab-${t.id}" hidden>${t.html}</section>`).join('');
  TOOLS.forEach(t => t.init($('#pn-' + t.id)));

  function select(id) {
    if (!TOOLS.some(t => t.id === id)) id = TOOLS[0].id;
    $$('[role="tab"]', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    $$('.tool-panel', panels).forEach(pn => { pn.hidden = pn.id !== 'pn-' + id; });
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) select(b.dataset.id); });
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  select(location.hash.slice(1));
})();
