/* 首頁示範區的播放器：把 demo-data.js 的情境播成一段可以看的操作過程。
   外框（情境切換、步驟列、播放控制、狀態列）共用；每個情境各自負責畫面與劇本，
   寫在下方 SCENARIOS 裡，回傳 { reset, run }。

   載入或切換情境時直接把最終畫面跑完（沒按播放的人也看得到結果），按「播放」才從頭演一次。
   每個情境有自己的網址 #demo-<key>，打開就直接進到那個情境；切換分頁時網址跟著換。
   每一輪播放都拿一個 token；重播或切換情境時舊的那一輪看到 token 變了就立刻停手，
   不會兩輪同時往畫面寫。系統開啟「減少動態效果」時，等待一律為 0。 */
(function () {
  'use strict';

  var root = document.getElementById('wsDemo');
  var D = window.WS_DEMO;
  if (!root || !D) return;
  var lang = (document.documentElement.lang || '').indexOf('zh') === 0 ? 'zh' : 'en';
  var U = D.ui[lang];

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* 舊瀏覽器 */ }

  var S = { token: 0, playing: false, paused: false, skip: false, done: false, key: null };
  var SVG = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------------- 工具 */

  function fmt(n) { return n.toLocaleString('en-US'); }
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs, text) {
    var n = document.createElementNS(SVG, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function panel(title, cls) {
    var p = h('div', 'demo-panel ' + cls);
    p.appendChild(h('div', 'demo-ph', title));
    return p;
  }
  function addRow(dl, k, v, cls) {
    var row = h('div', cls || null);
    row.appendChild(h('dt', null, k));
    row.appendChild(h('dd', null, v));
    dl.appendChild(row);
    return row;
  }
  function headRow(table, cols) {
    var tr = h('tr');
    cols.forEach(function (t) {
      var th = h('th', null, t);
      th.scope = 'col';
      tr.appendChild(th);
    });
    var thead = h('thead');
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  /** 依門檻填入 H／L 旗標或「平常範圍」。旗標旁的文字在窄螢幕會藏起來，只留 H／L。 */
  function flagCell(td, ratio, T) {
    td.innerHTML = '';
    if (ratio >= D.flagHigh) {
      td.appendChild(h('span', 'flag h', 'H'));
      td.appendChild(h('span', 'flag-text', T.high));
    } else if (ratio <= D.flagLow) {
      td.appendChild(h('span', 'flag l', 'L'));
      td.appendChild(h('span', 'flag-text', T.low));
    } else {
      td.textContent = T.normal;
    }
  }
  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
  }

  /** 折線圖的座標軸與格線。x 為第 0～xMax 天；yTicks 的第一個值是圖的底線。
      回傳 el（svg）、x()／y() 換算，以及 line(arr, upto) 產生前 upto 天的路徑。 */
  function axes(o) {
    var X0 = o.left || 44, X1 = 388, Y0 = 150, Y1 = 16;
    var yMin = o.yTicks[0], yMax = o.yTicks[o.yTicks.length - 1];
    function x(d) { return X0 + (X1 - X0) * d / o.xMax; }
    function y(v) { return Y0 - (Y0 - Y1) * (v - yMin) / (yMax - yMin); }
    var s = svg('svg', { viewBox: '0 0 400 176', role: 'img', 'aria-label': o.label });
    o.yTicks.forEach(function (v, i) {
      s.appendChild(svg('line', { x1: X0, x2: X1, y1: y(v), y2: y(v), 'class': i ? 'grid' : 'grid zero' }));
      s.appendChild(svg('text', { x: X0 - 6, y: y(v) + 4, 'text-anchor': 'end', 'class': 'axis' }, fmt(v)));
    });
    o.xTicks.forEach(function (d) {
      s.appendChild(svg('text', { x: x(d), y: 170, 'text-anchor': 'middle', 'class': 'axis' }, 'D' + d));
    });
    function line(arr, upto) {
      return arr.slice(0, upto + 1).map(function (v, i) {
        return (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1);
      }).join(' ');
    }
    return { el: s, x: x, y: y, line: line };
  }

  /** 可暫停、可跳過、可作廢的等待。回傳 false 代表這一輪已作廢，呼叫端要立刻收手。 */
  function wait(ms, token) {
    if (reduceMotion) ms = 0;
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() {
        if (token !== S.token) return res(false);
        if (S.skip) return res(true);
        if (S.paused) { t0 += 100; return setTimeout(tick, 100); }
        if (Date.now() - t0 >= ms) return res(true);
        setTimeout(tick, Math.min(40, ms));
      })();
    });
  }

  /** 逐字打進 el（輸入框則寫進 value）；被作廢時回傳 false。 */
  async function type(el, text, token) {
    var prop = el.tagName === 'INPUT' ? 'value' : 'textContent';
    for (var i = 1; i <= text.length; i++) {
      el[prop] = text.slice(0, i);
      if (!await wait(22, token)) return false;
    }
    return true;
  }

  /* ---------------------------------------------------------------- 外框 */

  var shell = {};
  var visited = [];
  var T = null;
  var current = null;

  function buildShell() {
    root.innerHTML = '';

    if (D.order.length > 1) {
      var tabs = h('div', 'demo-tabs');
      tabs.setAttribute('role', 'group');
      tabs.setAttribute('aria-label', U.tabs);
      D.order.forEach(function (key) {
        var t = D[key][lang];
        var b = h('button', 'demo-tab', t.tab);
        b.type = 'button';
        b.dataset.key = key;
        if (t.tag) b.appendChild(h('span', 'demo-tag', t.tag));
        b.addEventListener('click', function () { if (S.key !== key) select(key, true); });
        tabs.appendChild(b);
      });
      root.appendChild(tabs);
      shell.tabs = tabs;
    }

    var top = h('div', 'demo-top');
    shell.rail = h('ol', 'demo-rail');
    top.appendChild(shell.rail);
    var ctl = h('div', 'demo-controls');
    shell.play = control('btn demo-play', play);
    shell.pause = control('btn ghost demo-pause', function () { S.paused = !S.paused; sync(); });
    shell.skip = control('btn ghost demo-skip', function () { S.paused = false; S.skip = true; });
    ctl.appendChild(shell.play);
    ctl.appendChild(shell.pause);
    ctl.appendChild(shell.skip);
    top.appendChild(ctl);
    root.appendChild(top);

    var status = h('div', 'demo-status');
    status.setAttribute('aria-live', 'polite');
    shell.stamp = h('span', 'demo-day');
    shell.desc = h('span', 'demo-desc');
    status.appendChild(shell.stamp);
    status.appendChild(shell.desc);
    root.appendChild(status);

    shell.stage = h('div', 'demo-stage');
    root.appendChild(shell.stage);
    var foot = h('div', 'demo-foot');
    shell.note = h('p', 'demo-note');
    shell.cta = h('a', 'demo-cta');
    foot.appendChild(shell.note);
    foot.appendChild(shell.cta);
    root.appendChild(foot);
  }

  function control(cls, fn) {
    var b = h('button', cls);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  var ctx = {
    setStep: function (i) {
      if (visited.indexOf(i) < 0) visited.push(i);
      shell.rail.querySelectorAll('li').forEach(function (li, k) {
        li.className = k === i ? 'is-on' : (visited.indexOf(k) >= 0 ? 'is-done' : '');
      });
      shell.desc.textContent = T.steps[i].desc;
    },
    stamp: function (text) { shell.stamp.textContent = text; },
    wait: wait,
    type: type
  };

  /** 切換情境。fromUser 時把網址換成 #demo-<key>，方便直接分享這個情境。 */
  function select(key, fromUser) {
    S.token++;
    S.key = key;
    T = D[key][lang];
    if (shell.tabs) {
      shell.tabs.querySelectorAll('.demo-tab').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.key === key));
      });
      revealTab();
      /* 字型載入後分頁會變寬，位置要重算一次（頁面 load 時也會再算，見檔尾）。 */
      if (document.fonts) document.fonts.ready.then(revealTab);
    }
    shell.rail.innerHTML = '';
    T.steps.forEach(function (st, i) {
      var li = h('li');
      li.appendChild(h('span', 'demo-rail-num', String(i + 1)));
      li.appendChild(document.createTextNode(st.title));
      shell.rail.appendChild(li);
    });
    shell.stage.innerHTML = '';
    shell.note.textContent = T.note;
    var planned = D[key].planned ? 'planned' : 'live';
    shell.cta.textContent = U.cta[planned];
    shell.cta.href = 'mailto:' + D.email + '?subject=' + encodeURIComponent(U.subject[planned](T.tab));
    if (fromUser && window.history && history.replaceState) {
      try { history.replaceState(null, '', '#demo-' + key); } catch (e) { /* file:// 等環境 */ }
    }
    current = SCENARIOS[key](shell.stage, T, D[key]);
    start(true);
  }

  /** 窄螢幕分頁會橫向捲動：把選中的分頁捲進可見範圍（只動分頁列，不捲整頁）。 */
  function revealTab() {
    var tabs = shell.tabs;
    var b = tabs && tabs.querySelector('[aria-pressed="true"]');
    if (!b || tabs.scrollWidth <= tabs.clientWidth) return;
    var pad = parseFloat(getComputedStyle(tabs).paddingLeft) || 0;
    var left = b.offsetLeft - pad, right = b.offsetLeft + b.offsetWidth + pad - tabs.clientWidth;
    if (tabs.scrollLeft > left) tabs.scrollLeft = left;
    else if (tabs.scrollLeft < right) tabs.scrollLeft = right;
  }

  /** 網址是 #demo-<key> 時切到那個情境並捲到示範區；回傳是否有對應的情境。 */
  function fromHash() {
    var m = /^#demo-([a-z]+)$/.exec(location.hash);
    if (!m || D.order.indexOf(m[1]) < 0) return false;
    if (S.key !== m[1]) select(m[1]);
    var section = root.closest('section');
    if (section) section.scrollIntoView();
    return true;
  }

  function sync() {
    shell.play.textContent = S.done ? U.controls.replay : U.controls.play;
    shell.play.hidden = S.playing;
    shell.pause.hidden = !S.playing;
    shell.pause.textContent = S.paused ? U.controls.resume : U.controls.pause;
    shell.skip.hidden = !S.playing;
    shell.skip.textContent = U.controls.skip;
  }

  function start(instant) {
    var token = ++S.token;
    S.playing = !instant;
    S.paused = false;
    S.skip = !!instant;
    S.done = false;
    root.classList.toggle('is-playing', !instant);
    sync();
    visited = [];
    current.reset();
    current.run(token).then(function (ok) {
      if (!ok || token !== S.token) return;
      S.playing = false;
      S.skip = false;
      S.done = true;
      root.classList.remove('is-playing');
      sync();
    });
  }

  function play() { start(false); }

  /* ---------------------------------------------------------------- 情境 */

  var SCENARIOS = {

    /* 合作貼文生命週期：登錄 → 每日快照與節點比較（D7 插入截圖補值）→ 結案。 */
    lifecycle: function (stage, T, C) {
      var LAST = C.series.post.length - 1;
      var ax = axes({ label: T.chart.label, xMax: LAST, yTicks: [0, 2500, 5000], xTicks: [0].concat(C.nodes) });
      ax.el.appendChild(svg('path', { 'class': 'base', fill: 'none' }));
      ax.el.appendChild(svg('path', { 'class': 'curve', fill: 'none' }));
      ax.el.appendChild(svg('g', { 'class': 'nodes' }));
      function q(sel) { return stage.querySelector(sel); }

      var grid = h('div', 'demo-grid');
      var left = h('div', 'demo-col');
      var right = h('div', 'demo-col');

      var reg = panel(T.reg.title, 'demo-reg');
      reg.appendChild(h('div', 'demo-url'));
      reg.appendChild(h('div', 'demo-parsing'));
      reg.appendChild(h('dl'));
      reg.appendChild(h('div', 'demo-delivered'));
      left.appendChild(reg);

      var shot = panel(T.shot.title, 'demo-shot');
      shot.appendChild(h('div', 'demo-file', T.shot.file));
      shot.appendChild(h('dl'));
      shot.appendChild(h('div', 'demo-shot-state'));
      left.appendChild(shot);

      var log = panel(T.log.title, 'demo-log');
      log.appendChild(h('ul'));
      left.appendChild(log);

      var chart = panel(T.chart.label, 'demo-chart');
      var legend = h('div', 'demo-legend');
      legend.appendChild(h('span', 'is-post', T.chart.post));
      legend.appendChild(h('span', 'is-base', T.chart.base));
      chart.appendChild(legend);
      chart.appendChild(ax.el);
      right.appendChild(chart);

      var nodes = panel(T.table.title, 'demo-nodes');
      var table = h('table');
      headRow(table, [T.table.node, T.table.post, T.table.base, T.table.ratio, T.table.flag]);
      var tbody = h('tbody');
      C.nodes.forEach(function (d) {
        var tr = h('tr');
        tr.dataset.day = d;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      nodes.appendChild(table);
      right.appendChild(nodes);

      grid.appendChild(left);
      grid.appendChild(right);
      stage.appendChild(grid);
      stage.appendChild(h('div', 'demo-close'));

      function setDay(d) {
        ctx.stamp(d < 0 ? T.before : T.day(d));
        q('.demo-chart .curve').setAttribute('d', d > 0 ? ax.line(C.series.post, d) : '');
        q('.demo-chart .base').setAttribute('d', d > 0 ? ax.line(C.series.base, d) : '');
      }

      function addLog(text, cls) {
        var ul = q('.demo-log ul');
        ul.appendChild(h('li', cls || null, text));
        ul.scrollTop = ul.scrollHeight;
      }

      function fillNode(d) {
        var post = C.series.post[d], base = C.series.base[d];
        var ratio = post / base;
        var tr = q('.demo-nodes tr[data-day="' + d + '"]');
        tr.innerHTML = '';
        tr.className = 'is-new';
        [['D' + d], [fmt(post), 'val'], [fmt(base)], ['×' + ratio.toFixed(2)]].forEach(function (c) {
          tr.appendChild(h('td', c[1] || null, c[0]));
        });
        var td = h('td');
        flagCell(td, ratio, T.table);
        tr.appendChild(td);
        q('.demo-chart .nodes').appendChild(svg('circle', { cx: ax.x(d), cy: ax.y(post), r: 4, 'class': 'node' }));
      }

      function reset() {
        q('.demo-url').textContent = '';
        q('.demo-parsing').textContent = '';
        q('.demo-reg dl').innerHTML = '';
        q('.demo-delivered').textContent = '';
        q('.demo-shot').hidden = true;
        q('.demo-shot dl').innerHTML = '';
        q('.demo-shot-state').textContent = '';
        q('.demo-log ul').innerHTML = '';
        q('.demo-chart .nodes').innerHTML = '';
        q('.demo-close').innerHTML = '';
        q('.demo-close').hidden = true;
        stage.querySelectorAll('.demo-nodes tbody tr').forEach(function (tr) {
          tr.className = '';
          tr.innerHTML = '';
          tr.appendChild(h('td', null, 'D' + tr.dataset.day));
          var pending = h('td', 'wait', T.table.wait);
          pending.colSpan = 4;
          tr.appendChild(pending);
        });
        setDay(-1);
      }

      async function fillFromScreenshot(token) {
        ctx.setStep(2);
        q('.demo-shot').hidden = false;
        var state = q('.demo-shot-state');
        if (!await wait(900, token)) return false;
        state.textContent = T.shot.prefill;
        var dl = q('.demo-shot dl');
        var rows = T.shot.fields.map(function (f) { return addRow(dl, f[0], f[1], 'is-prefill'); });
        if (!await wait(1300, token)) return false;
        state.textContent = T.shot.check;
        for (var i = 0; i < rows.length; i++) {
          rows[i].className = 'is-checked';
          if (!await wait(500, token)) return false;
        }
        state.textContent = T.shot.saved;
        addLog(T.log.shareSaved, 'is-saved');
        if (!await wait(1000, token)) return false;
        ctx.setStep(1);
        return true;
      }

      async function run(token) {
        ctx.setStep(0);
        if (!await type(q('.demo-url'), T.url, token)) return;
        q('.demo-parsing').textContent = T.reg.parsing;
        if (!await wait(800, token)) return;
        q('.demo-parsing').textContent = '';
        var dl = q('.demo-reg dl');
        for (var r = 0; r < T.reg.rows.length; r++) {
          addRow(dl, T.reg.rows[r][0], T.reg.rows[r][1]);
          if (!await wait(220, token)) return;
        }
        q('.demo-delivered').textContent = T.reg.delivered;
        if (!await wait(1000, token)) return;

        ctx.setStep(1);
        for (var d = 0; d <= LAST; d++) {
          setDay(d);
          if (d > 0) addLog(T.log.snap(d, fmt(C.series.post[d])));
          var ev = C.events[d];
          if (ev === 'boost') addLog(T.log.boost, 'is-note');
          if (ev === 'shareMissing') addLog(T.log.shareMissing, 'is-na');
          if (ev === 'screenshot' && !await fillFromScreenshot(token)) return;
          if (C.nodes.indexOf(d) >= 0) {
            fillNode(d);
            if (!await wait(700, token)) return;
          }
          if (!await wait(550, token)) return;
        }

        ctx.setStep(T.steps.length - 1);
        var post = C.series.post[LAST];
        var close = q('.demo-close');
        close.hidden = false;
        close.appendChild(h('div', 'demo-close-title', T.close.title));

        /* 成本口徑可以切換：只算現金，或含禮券與樣品。切換時重算 CPE。 */
        var basis = h('div', 'demo-seg');
        basis.setAttribute('role', 'group');
        basis.setAttribute('aria-label', T.close.basis.label);
        basis.appendChild(h('span', 'demo-seg-label', T.close.basis.label));
        var cdl = h('dl');
        function render(key) {
          cdl.innerHTML = '';
          var cost = C.costs[key];
          var items = T.close.items((cost / post).toFixed(2), (post / C.series.base[LAST]).toFixed(2));
          items.splice(1, 0, [T.close.basis.cost, 'NT$' + fmt(cost)]);
          items.forEach(function (it) { addRow(cdl, it[0], it[1]); });
          basis.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.key === key)); });
        }
        ['cash', 'full'].forEach(function (key) {
          var b = h('button', 'demo-seg-btn', T.close.basis[key]);
          b.type = 'button';
          b.dataset.key = key;
          b.addEventListener('click', function () { render(key); });
          basis.appendChild(b);
        });
        close.appendChild(basis);
        close.appendChild(cdl);
        render('cash');
        var acts = h('div', 'demo-close-acts');
        [T.close.report, T.close.csv].forEach(function (t) {
          acts.appendChild(h('span', 'demo-fake-btn', t));
        });
        close.appendChild(acts);
        return true;
      }

      return { reset: reset, run: run };
    },

    /* 公平比較：照日曆看四條曲線 → 平移對齊到發布日 → 在 D7 和各自的基準比較。 */
    compare: function (stage, T, C) {
      function q(sel) { return stage.querySelector(sel); }
      var drawn = C.creators.filter(function (c) { return c.series; });
      var ax = axes({ label: T.chart.label, xMax: C.today, yTicks: [0, 2500, 5000], xTicks: [] });
      var labels = svg('g', { 'class': 'xlabels' });
      ax.el.appendChild(labels);
      ax.el.appendChild(svg('line', { 'class': 'node-line', x1: ax.x(C.node), x2: ax.x(C.node), y1: 150, y2: 16 }));
      drawn.forEach(function (c) {
        ax.el.appendChild(svg('path', { 'class': 'curve', fill: 'none', 'data-key': c.key }));
        ax.el.appendChild(svg('text', { 'class': 'tag post', 'data-key': c.key }, c.key));
      });
      ax.el.appendChild(svg('g', { 'class': 'nodes' }));

      var grid = h('div', 'demo-grid demo-grid-wide');
      var chart = panel(T.chart.label, 'demo-chart');
      chart.appendChild(h('div', 'demo-legend demo-axis-mode'));
      chart.appendChild(ax.el);
      grid.appendChild(chart);
      var tpanel = panel('', 'demo-nodes');
      tpanel.appendChild(h('table'));
      tpanel.appendChild(h('p', 'demo-ref'));
      grid.appendChild(tpanel);
      stage.appendChild(grid);

      function date(idx) { return T.date(C.start[0], C.start[1] + idx); }
      function setLabels(aligned) {
        labels.innerHTML = '';
        [0, 7, 14, C.today].forEach(function (i) {
          var text = aligned ? (i === C.today ? '' : 'D' + i) : date(i);
          labels.appendChild(svg('text', { x: ax.x(i), y: 170, 'text-anchor': 'middle', 'class': 'axis' }, text));
        });
        q('.demo-axis-mode').textContent = aligned ? T.chart.aligned : T.chart.calendar;
      }

      /* t：0 為照日曆排列、1 為全部對齊到發布日。upto：日曆上畫到第幾天。 */
      function draw(t, upto) {
        drawn.forEach(function (c) {
          var off = c.posted * (1 - t);
          var pts = [];
          c.series.forEach(function (v, i) {
            if (c.posted + i <= upto) pts.push([off + i, v]);
          });
          var path = q('.curve[data-key="' + c.key + '"]');
          var tag = q('.tag[data-key="' + c.key + '"]');
          if (!pts.length) { path.setAttribute('d', ''); tag.textContent = ''; return; }
          path.setAttribute('d', pts.map(function (p, i) {
            return (i ? 'L' : 'M') + ax.x(p[0]).toFixed(1) + ',' + ax.y(p[1]).toFixed(1);
          }).join(' '));
          var last = pts[pts.length - 1];
          tag.textContent = c.key;
          tag.setAttribute('x', (ax.x(last[0]) + 5).toFixed(1));
          tag.setAttribute('y', (ax.y(last[1]) + 4).toFixed(1));
        });
      }

      function table(cols) {
        var t = q('.demo-nodes table');
        t.innerHTML = '';
        headRow(t, cols);
        t.appendChild(h('tbody'));
        return t.querySelector('tbody');
      }

      function reset() {
        ctx.stamp(T.stamp.calendar);
        setLabels(false);
        draw(0, -1);
        q('.node-line').style.display = 'none';
        q('.demo-chart .nodes').innerHTML = '';
        q('.demo-nodes .demo-ph').textContent = T.table.title.calendar;
        table([T.table.creator, T.table.posted, T.table.age, T.table.value]);
        q('.demo-ref').textContent = '';
      }

      async function run(token) {
        ctx.setStep(0);
        for (var day = 0; day <= C.today; day++) {
          draw(0, day);
          if (!await wait(110, token)) return;
        }
        var tb = q('.demo-nodes tbody');
        for (var i = 0; i < C.creators.length; i++) {
          var c = C.creators[i];
          var age = C.today - c.posted;
          var tr = h('tr', 'is-new');
          tr.appendChild(h('td', null, T.name(c.key)));
          tr.appendChild(h('td', null, date(c.posted)));
          tr.appendChild(h('td', null, T.table.days(age)));
          tr.appendChild(c.series ? h('td', 'val', fmt(c.series[age])) : h('td', 'na', T.table.hidden));
          tb.appendChild(tr);
          if (!await wait(250, token)) return;
        }
        q('.demo-ref').textContent = T.table.unfair;
        if (!await wait(1800, token)) return;

        ctx.setStep(1);
        ctx.stamp(T.stamp.aligned);
        for (var f = 1; f <= 24; f++) {
          var t = f / 24;
          draw(1 - Math.pow(1 - t, 3), C.today);
          if (f === 12) setLabels(true);
          if (!await wait(40, token)) return;
        }
        draw(1, C.today);
        setLabels(true);
        if (!await wait(1000, token)) return;

        ctx.setStep(2);
        q('.node-line').style.display = '';
        q('.demo-nodes .demo-ph').textContent = T.table.title.aligned;
        q('.demo-ref').textContent = '';
        tb = table([T.table.creator, T.table.value, T.table.base, T.table.ratio, T.table.flag]);
        for (var j = 0; j < C.creators.length; j++) {
          var cr = C.creators[j];
          var row = h('tr', 'is-new');
          row.appendChild(h('td', null, T.name(cr.key)));
          if (cr.series) {
            var v = cr.series[C.node];
            var ratio = v / cr.base7;
            row.appendChild(h('td', 'val', fmt(v)));
            row.appendChild(h('td', null, fmt(cr.base7)));
            row.appendChild(h('td', null, '×' + ratio.toFixed(2)));
            var td = h('td');
            flagCell(td, ratio, T);
            row.appendChild(td);
            q('.demo-chart .nodes').appendChild(svg('circle', { cx: ax.x(C.node), cy: ax.y(v), r: 4, 'class': 'node' }));
          } else {
            row.appendChild(h('td', 'na', T.table.hidden));
            var why = h('td', 'reason', T.table.hiddenReason);
            why.colSpan = 3;
            row.appendChild(why);
          }
          tb.appendChild(row);
          if (!await wait(450, token)) return;
        }
        return true;
      }

      return { reset: reset, run: run };
    },

    /* 創作者觀察：加入觀察（先講清楚拿得到什麼）→ 每日追蹤 → 追蹤者異常交給人判斷 → 摘要帶進選人。 */
    watch: function (stage, T, C) {
      var LAST = C.followers.length - 1;
      function q(sel) { return stage.querySelector(sel); }

      /* 異常倍數 = 異常當天的增量 ÷ 其他日子單日增量的中位數。 */
      var deltas = [];
      for (var k = 1; k <= LAST; k++) if (k !== C.alertDay) deltas.push(C.followers[k] - C.followers[k - 1]);
      var jump = C.followers[C.alertDay] - C.followers[C.alertDay - 1];
      var times = Math.round(jump / median(deltas));
      var postOn = {};
      C.posts.forEach(function (p, i) { postOn[p[0]] = { n: i + 1, f: T.formats[p[1]] }; });

      var grid = h('div', 'demo-grid');
      var left = h('div', 'demo-col');
      var right = h('div', 'demo-col');

      var scope = panel(T.scope.title, 'demo-scope');
      scope.appendChild(h('div', 'demo-url'));
      scope.appendChild(h('dl'));
      left.appendChild(scope);

      var alert = panel(T.alert.title, 'demo-shot demo-alert');
      alert.appendChild(h('p', 'demo-alert-body'));
      alert.appendChild(h('p', 'demo-alert-hint', T.alert.hint));
      left.appendChild(alert);

      var log = panel(T.log.title, 'demo-log');
      log.appendChild(h('ul'));
      left.appendChild(log);

      var ax = axes({ label: T.chart.label, xMax: LAST, yTicks: [46500, 47500, 48500], xTicks: [0, 10, 20, 30], left: 56 });
      ax.el.appendChild(svg('g', { 'class': 'marks' }));
      ax.el.appendChild(svg('path', { 'class': 'curve', fill: 'none' }));
      ax.el.appendChild(svg('g', { 'class': 'nodes' }));
      var chart = panel(T.chart.label, 'demo-chart');
      var legend = h('div', 'demo-legend');
      legend.appendChild(h('span', 'is-post', T.chart.label));
      legend.appendChild(h('span', 'is-mark', T.chart.posts));
      chart.appendChild(legend);
      chart.appendChild(ax.el);
      right.appendChild(chart);

      var sum = h('div', 'demo-panel demo-summary');
      right.appendChild(sum);

      grid.appendChild(left);
      grid.appendChild(right);
      stage.appendChild(grid);

      function setDay(d) {
        ctx.stamp(d < 0 ? T.before : T.day(d));
        q('.demo-chart .curve').setAttribute('d', d >= 0 ? ax.line(C.followers, d) : '');
      }

      function addLog(text, cls) {
        var ul = q('.demo-log ul');
        ul.appendChild(h('li', cls || null, text));
        ul.scrollTop = ul.scrollHeight;
      }

      function reset() {
        q('.demo-url').textContent = '';
        q('.demo-scope dl').innerHTML = '';
        q('.demo-alert').hidden = true;
        q('.demo-alert-body').textContent = '';
        q('.demo-log ul').innerHTML = '';
        q('.demo-chart .marks').innerHTML = '';
        q('.demo-chart .nodes').innerHTML = '';
        sum.innerHTML = '';
        sum.hidden = true;
        setDay(-1);
      }

      async function run(token) {
        ctx.setStep(0);
        if (!await type(q('.demo-url'), T.handle, token)) return;
        if (!await wait(500, token)) return;
        var dl = q('.demo-scope dl');
        for (var r = 0; r < T.scope.rows.length; r++) {
          var row = T.scope.rows[r];
          addRow(dl, row[0], row[1], row[2] === 'na' ? 'is-na' : null);
          if (!await wait(row[2] === 'na' ? 1200 : 300, token)) return;
        }
        if (!await wait(600, token)) return;

        ctx.setStep(1);
        for (var d = 0; d <= LAST; d++) {
          setDay(d);
          var p = postOn[d];
          if (p) {
            q('.demo-chart .marks').appendChild(svg('line', { x1: ax.x(d), x2: ax.x(d), y1: 150, y2: 141, 'class': 'mark' }));
            addLog(T.log.post(d, p.n, p.f));
          }
          if (d === C.alertDay) {
            ctx.setStep(2);
            q('.demo-chart .nodes').appendChild(svg('circle', { cx: ax.x(d), cy: ax.y(C.followers[d]), r: 4, 'class': 'node alert' }));
            addLog(T.log.alert(d, fmt(jump)), 'is-note');
            q('.demo-alert-body').textContent = T.alert.body(d, fmt(jump), times);
            q('.demo-alert').hidden = false;
            if (!await wait(2600, token)) return;
            ctx.setStep(1);
          }
          if (!await wait(260, token)) return;
        }

        ctx.setStep(3);
        sum.hidden = false;
        sum.appendChild(h('div', 'demo-close-title', T.summary.title));
        var sdl = h('dl');
        var reels = C.posts.filter(function (p) { return p[1] === 'reels'; }).length;
        T.summary.items({
          from: fmt(C.followers[0]), to: fmt(C.followers[LAST]),
          posts: C.posts.length, reels: reels, carousel: C.posts.length - reels
        }).forEach(function (it) { addRow(sdl, it[0], it[1]); });
        sum.appendChild(sdl);
        var next = h('button', 'btn ghost demo-next', T.summary.next + ' →');
        next.type = 'button';
        next.addEventListener('click', function () { select('scout'); });
        sum.appendChild(next);
        return true;
      }

      return { reset: reset, run: run };
    },

    /* 選人支援：觀察帳號 → 以近期貼文算基準 → 報價估 CPE → 挑值得加熱的貼文。 */
    scout: function (stage, T, C) {
      function q(sel) { return stage.querySelector(sel); }
      var usable = C.posts.filter(function (v) { return v != null; });
      var base = median(usable);

      var grid = h('div', 'demo-grid');
      var left = h('div', 'demo-col');
      var right = h('div', 'demo-col');

      var acct = panel(T.account.title, 'demo-acct');
      acct.appendChild(h('div', 'demo-url'));
      acct.appendChild(h('dl'));
      acct.appendChild(h('div', 'demo-delivered'));
      left.appendChild(acct);

      var posts = panel(T.posts.title, 'demo-posts');
      var ptable = h('table');
      headRow(ptable, [T.posts.post, T.posts.value, T.posts.ratio, T.posts.flag]);
      ptable.appendChild(h('tbody'));
      posts.appendChild(ptable);
      posts.appendChild(h('div', 'demo-basis'));
      left.appendChild(posts);

      var cpe = panel(T.cpe.title, 'demo-cpe');
      var quote = h('div', 'demo-quote');
      var qlabel = h('label', null, T.cpe.quote);
      qlabel.htmlFor = 'wsDemoQuote';
      quote.appendChild(qlabel);
      var qbox = h('span', 'demo-url demo-input', 'NT$');
      var input = h('input');
      input.id = 'wsDemoQuote';
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      qbox.appendChild(input);
      quote.appendChild(qbox);
      cpe.appendChild(quote);
      cpe.appendChild(h('div', 'demo-try', T.cpe.tryIt));

      /* 播完之後報價可以自己改，創作者 E 的預估 CPE 即時重算。 */
      input.addEventListener('input', function () {
        var row = q('.demo-cpe tr[data-key="E"]');
        if (!row) return;
        var price = parseInt(input.value.replace(/[^0-9]/g, ''), 10);
        row.children[1].textContent = price > 0 ? fmt(price) : '—';
        row.children[3].textContent = price > 0 ? 'NT$' + (price / base).toFixed(2) : T.cpe.invalid;
      });
      var ctable = h('table');
      headRow(ctable, [T.cpe.creator, T.cpe.price, T.cpe.base, T.cpe.est]);
      ctable.appendChild(h('tbody'));
      cpe.appendChild(ctable);
      cpe.appendChild(h('p', 'demo-ref'));
      right.appendChild(cpe);

      var boost = panel(T.boost.title, 'demo-boost');
      boost.appendChild(h('ul'));
      right.appendChild(boost);

      grid.appendChild(left);
      grid.appendChild(right);
      stage.appendChild(grid);

      function reset() {
        ctx.stamp(T.before);
        q('.demo-acct .demo-url').textContent = '';
        q('.demo-acct dl').innerHTML = '';
        q('.demo-acct .demo-delivered').textContent = '';
        q('.demo-posts tbody').innerHTML = '';
        q('.demo-basis').textContent = '';
        input.value = '';
        input.disabled = true;
        q('.demo-try').hidden = true;
        q('.demo-cpe tbody').innerHTML = '';
        q('.demo-ref').textContent = '';
        var ul = q('.demo-boost ul');
        ul.innerHTML = '';
        ul.appendChild(h('li', 'is-na', T.boost.none));
      }

      async function run(token) {
        ctx.setStep(0);
        if (!await type(q('.demo-acct .demo-url'), T.handle, token)) return;
        if (!await wait(500, token)) return;
        var dl = q('.demo-acct dl');
        for (var r = 0; r < T.account.rows.length; r++) {
          addRow(dl, T.account.rows[r][0], T.account.rows[r][1]);
          if (!await wait(220, token)) return;
        }
        q('.demo-acct .demo-delivered').textContent = T.account.watching;
        ctx.stamp(T.stamp);
        if (!await wait(1000, token)) return;

        ctx.setStep(1);
        var tbody = q('.demo-posts tbody');
        var rows = [];
        for (var i = 0; i < C.posts.length; i++) {
          var v = C.posts[i];
          var tr = h('tr', 'is-new' + (v == null ? ' is-na' : ''));
          tr.appendChild(h('td', null, T.posts.name(i + 1)));
          if (v == null) {
            tr.appendChild(h('td', 'na', T.posts.hidden));
            var why = h('td', 'reason', T.posts.hiddenReason);
            why.colSpan = 2;
            tr.appendChild(why);
          } else {
            tr.appendChild(h('td', 'val', fmt(v)));
            tr.appendChild(h('td'));
            tr.appendChild(h('td'));
          }
          tbody.appendChild(tr);
          rows.push(tr);
          if (!await wait(v == null ? 900 : 300, token)) return;
        }
        q('.demo-basis').textContent = T.posts.base(usable.length, fmt(base));
        if (!await wait(1200, token)) return;

        ctx.setStep(2);
        if (!await type(input, fmt(C.quote), token)) return;
        if (!await wait(500, token)) return;
        var cbody = q('.demo-cpe tbody');
        for (var c = 0; c < C.candidates.length; c++) {
          var cd = C.candidates[c];
          var price = cd.quote || C.quote;
          var cb = cd.key === 'E' ? base : cd.base;
          var ctr = h('tr', 'is-new');
          ctr.dataset.key = cd.key;
          ctr.appendChild(h('td', null, T.cpe.name(cd.key)));
          ctr.appendChild(h('td', null, fmt(price)));
          if (cb) {
            ctr.appendChild(h('td', null, fmt(cb)));
            ctr.appendChild(h('td', 'val', 'NT$' + (price / cb).toFixed(2)));
          } else {
            var skip = h('td', 'reason', T.cpe.skip(cd.usable));
            skip.colSpan = 2;
            ctr.appendChild(skip);
          }
          cbody.appendChild(ctr);
          if (!await wait(cb ? 500 : 1000, token)) return;
        }
        q('.demo-ref').textContent = T.cpe.reference(C.reference.key, C.reference.cpe);
        if (!await wait(1400, token)) return;

        ctx.setStep(3);
        var picks = [];
        for (var j = 0; j < C.posts.length; j++) {
          if (C.posts[j] == null) continue;
          var ratio = C.posts[j] / base;
          var cells = rows[j].children;
          cells[2].textContent = '×' + ratio.toFixed(2);
          flagCell(cells[3], ratio, T);
          if (ratio >= D.flagHigh) {
            rows[j].className = 'is-new is-pick';
            picks.push(T.boost.item(T.posts.name(j + 1), ratio.toFixed(2)));
          }
          if (!await wait(260, token)) return;
        }
        var ul = q('.demo-boost ul');
        ul.innerHTML = '';
        for (var p = 0; p < picks.length; p++) {
          ul.appendChild(h('li', 'is-new', picks[p]));
          if (!await wait(400, token)) return;
        }
        input.disabled = false;
        q('.demo-try').hidden = false;
        return true;
      }

      return { reset: reset, run: run };
    },

    /* 議題聲量：定義議題（先講清楚 API 限制）→ 每日新貼文數 → 標出異常，並和活動前對照（另算扣掉異常日）。 */
    topic: function (stage, T, C) {
      function q(sel) { return stage.querySelector(sel); }
      var LAST = C.daily.length - 1;
      var DAYS = [0, 31, 28, 31, 30];
      function date(idx) {
        var m = C.start[0], d = C.start[1] + idx;
        while (d > DAYS[m]) { d -= DAYS[m]; m++; }
        return T.date(m, d);
      }
      function avg(arr) { return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length; }

      var ax = axes({ label: T.chart.label, xMax: LAST, yTicks: [0, 75, 150], xTicks: [] });
      var step = ax.x(1) - ax.x(0);
      var band = svg('rect', {
        'class': 'band', x: ax.x(C.campaign[0]) - step / 2, y: 16,
        width: ax.x(C.campaign[1]) - ax.x(C.campaign[0]) + step, height: 134
      });
      ax.el.insertBefore(band, ax.el.firstChild);
      [0, 7, 14, 21, LAST].forEach(function (i) {
        ax.el.appendChild(svg('text', { x: ax.x(i), y: 172, 'text-anchor': 'middle', 'class': 'axis' }, date(i)));
      });
      ax.el.appendChild(svg('g', { 'class': 'bars' }));
      ax.el.appendChild(svg('g', { 'class': 'marks' }));

      var grid = h('div', 'demo-grid');
      var left = h('div', 'demo-col');
      var right = h('div', 'demo-col');

      var scope = panel(T.scope.title, 'demo-scope');
      scope.appendChild(h('div', 'demo-url'));
      scope.appendChild(h('dl'));
      left.appendChild(scope);
      var log = panel(T.log.title, 'demo-log');
      log.appendChild(h('ul'));
      left.appendChild(log);

      var chart = panel(T.chart.label, 'demo-chart');
      var legend = h('div', 'demo-legend');
      legend.appendChild(h('span', 'is-band', T.chart.campaign));
      legend.appendChild(h('span', 'is-mark', T.chart.collab));
      chart.appendChild(legend);
      chart.appendChild(ax.el);
      right.appendChild(chart);
      var sum = h('div', 'demo-panel demo-summary');
      right.appendChild(sum);

      grid.appendChild(left);
      grid.appendChild(right);
      stage.appendChild(grid);

      function addLog(text, cls) {
        var ul = q('.demo-log ul');
        ul.appendChild(h('li', cls || null, text));
        ul.scrollTop = ul.scrollHeight;
      }

      function reset() {
        ctx.stamp(T.stamp.before);
        q('.demo-url').textContent = '';
        q('.demo-scope dl').innerHTML = '';
        q('.demo-log ul').innerHTML = '';
        q('.bars').innerHTML = '';
        q('.marks').innerHTML = '';
        band.style.display = 'none';
        sum.innerHTML = '';
        sum.hidden = true;
      }

      async function run(token) {
        ctx.setStep(0);
        if (!await type(q('.demo-url'), T.tags.join('  '), token)) return;
        if (!await wait(400, token)) return;
        var dl = q('.demo-scope dl');
        for (var r = 0; r < T.scope.limits.length; r++) {
          addRow(dl, T.scope.limits[r][0], T.scope.limits[r][1], r === 1 ? 'is-na' : null);
          if (!await wait(r === 1 ? 1300 : 500, token)) return;
        }
        if (!await wait(600, token)) return;

        ctx.setStep(1);
        band.style.display = '';
        var w = step * 0.68;
        for (var i = 0; i <= LAST; i++) {
          var v = C.daily[i];
          ctx.stamp(T.stamp.running(date(i)));
          q('.bars').appendChild(svg('rect', {
            'class': 'bar' + (i === C.alertDay ? ' alert' : ''),
            x: (ax.x(i) - w / 2).toFixed(1), y: ax.y(v).toFixed(1), width: w.toFixed(1), height: (150 - ax.y(v)).toFixed(1)
          }));
          if (C.collabs.indexOf(i) >= 0) {
            q('.marks').appendChild(svg('line', { x1: ax.x(i), x2: ax.x(i), y1: 153, y2: 159, 'class': 'mark' }));
          }
          if (i === C.alertDay) {
            ctx.setStep(2);
            var prev = avg(C.daily.slice(i - 7, i));
            addLog(T.log.alert(date(i), v, (v / prev).toFixed(1)), 'is-note');
            addLog(T.log.same(date(i)), 'is-na');
            if (!await wait(2400, token)) return;
            ctx.setStep(1);
          }
          if (!await wait(130, token)) return;
        }

        ctx.setStep(2);
        var pre = avg(C.daily.slice(0, C.campaign[0]));
        var campDays = C.daily.slice(C.campaign[0], C.campaign[1] + 1);
        var camp = avg(campDays);
        var campX = avg(campDays.filter(function (v, k) { return C.campaign[0] + k !== C.alertDay; }));
        function pct(a) { var p = Math.round((a / pre - 1) * 100); return (p >= 0 ? '+' : '') + p + '%'; }
        sum.hidden = false;
        sum.appendChild(h('div', 'demo-close-title', T.summary.title));
        var sdl = h('dl');
        T.summary.items({
          pre: pre.toFixed(1), camp: camp.toFixed(1), up: pct(camp),
          campX: campX.toFixed(1), upX: pct(campX), alert: date(C.alertDay)
        }).forEach(function (it) { addRow(sdl, it[0], it[1]); });
        sum.appendChild(sdl);
        sum.appendChild(h('p', 'demo-ref', T.summary.caveat));
        return true;
      }

      return { reset: reset, run: run };
    }
  };

  buildShell();
  if (!fromHash()) select(D.order[0]);
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('load', revealTab);
  window.addEventListener('resize', revealTab);
})();
