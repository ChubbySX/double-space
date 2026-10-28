/* ============================================================
   我们的胶片时光 · 主脚本 v1
   模块级变量必须放 IIFE 顶部（JS 变量提升只提声明不提赋值）
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 模块级变量 ---------- */
  var DATA = window.SITE_DATA || null;
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var body = document.body;
  var intro = $('#intro');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentTrack = 0;
  var trackPlaying = false;
  var msgNotes = []; // 留言板数据

  /* ================= 开场 ================= */
  function initIntro() {
    if (!intro) return;
    var fill = $('#introLoadFill');
    // 模拟冲洗进度（真实预加载在 loadData 里更新）
    var p = 0;
    var timer = setInterval(function () {
      p = Math.min(100, p + Math.random() * 22);
      if (fill) fill.style.width = p + '%';
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(revealHome, reducedMotion ? 400 : 900);
      }
    }, 180);
  }

  function revealHome() {
    var hero = $('#home');
    if (hero) hero.classList.add('is-ready');
    document.dispatchEvent(new CustomEvent('intro-done'));
    setTimeout(function () {
      if (intro) intro.classList.add('is-hidden');
    }, 500);
  }

  /* ================= 数据渲染 ================= */
  function renderProfile() {
    if (!DATA) return;
    var p = DATA.profile;
    var site = p.site || {};

    // Hero
    setText('#heroTitle', site.name || '我们的胶片时光');
    setText('#heroDesc', (p.hero && p.hero.desc) || '');
    setText('#heroFilmNo', (p.hero && p.hero.filmNo) || '');
    setText('#heroMotto', site.motto || '');
    setText('#countDesc', (site.anniversaryLabel || '') + ' · ' + (site.anniversary || ''));
    setText('#countNote', '从「' + (site.couple && site.couple.me) + '」遇见「' + (site.couple && site.couple.her) + '」的那天起');

    // Hero 照片
    var heroPhoto = $('#heroPhoto');
    if (heroPhoto && p.hero && p.hero.photo) {
      heroPhoto.src = p.hero.photo;
      heroPhoto.alt = site.name || '';
    }

    // 情侣名
    var hc = $('#heroCouple');
    if (hc && site.couple) {
      hc.innerHTML =
        '<span class="hc-name">' + esc(site.couple.me || '我') + '</span>' +
        '<span class="hc-heart">♥</span>' +
        '<span class="hc-name">' + esc(site.couple.her || 'Ta') + '</span>';
    }

    // 页脚
    setText('#footerText', (p.footer && p.footer.text) || '');
    setText('#footerMotto', site.motto || '');
    var fc = $('#footerCouple');
    if (fc && site.couple) fc.textContent = site.couple.me + ' ♥ ' + site.couple.her;

    // 留言板占位
    var input = $('#msgInput');
    if (input && p.messages) {
      input.placeholder = p.messages.placeholder || '留下你想对 Ta 说的话…';
      msgNotes = (p.messages.examples || []).slice();
    }

    document.title = (site.name || '我们的胶片时光') + ' · ' + (site.enName || '');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setText(sel, txt) {
    var el = $(sel);
    if (el) el.textContent = txt;
  }

  /* ================= 纪念日倒计时 ================= */
  function setupCountdown() {
    if (!DATA || !DATA.profile.site || !DATA.profile.site.anniversary) return;
    var ann = new Date(DATA.profile.site.anniversary).getTime();
    function tick() {
      var diff = Math.max(0, Date.now() - ann);
      var d = Math.floor(diff / 86400000);
      var h = Math.floor(diff % 86400000 / 3600000);
      var m = Math.floor(diff % 3600000 / 60000);
      var s = Math.floor(diff % 60000 / 1000);
      setText('#cdDays', d); setText('#cdHours', h);
      setText('#cdMins', m); setText('#cdSecs', s);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ================= 相册 ================= */
  function renderAlbums() {
    if (!DATA || !DATA.photos || !DATA.photos.length) {
      var empty = $('#photoEmpty');
      if (empty) empty.style.display = 'block';
      return;
    }
    var tabs = $('#albumTabs');
    var grid = $('#photoGrid');
    var albums = DATA.photos;
    var activeAlbum = localStorage.getItem('coupleAlbum') || '0';
    if (!albums[activeAlbum]) activeAlbum = '0';

    // 标签
    tabs.innerHTML = albums.map(function (al, i) {
      return '<button class="album-tab' + (String(i) === activeAlbum ? ' is-active' : '') + '" data-album="' + i + '">' +
        esc(al.name) + ' <em style="font-style:normal;font-size:.72rem;opacity:.7">' + (al.items ? al.items.length : 0) + '张</em></button>';
    }).join('');
    $$('.album-tab', tabs).forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeAlbum = btn.dataset.album;
        localStorage.setItem('coupleAlbum', activeAlbum);
        $$('.album-tab', tabs).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderGrid(albums[activeAlbum], grid);
      });
    });
    renderGrid(albums[activeAlbum], grid);
    setupViewToggle();
  }

  function renderGrid(album, grid) {
    var view = localStorage.getItem('coupleView') || 'card';
    grid.className = 'daily-grid ' + (view === 'masonry' ? 'is-masonry' : 'is-card');
    var items = (album && album.items) || [];
    grid.innerHTML = items.map(function (it) {
      var isVideo = /\.(mp4|webm|ogg|mov)$/i.test(it.src || '');
      var imgSrc = it.poster && isVideo ? it.poster : it.src;
      var badge = isVideo ? '<span class="polaroid-video">▶</span>' : '';
      return '<figure class="polaroid" data-src="' + esc(it.src) + '" data-title="' + esc(it.title) + '" data-desc="' + esc(it.desc || '') + '">' +
        '<img src="' + esc(imgSrc) + '" alt="' + esc(it.title) + '" loading="lazy">' +
        badge +
        '<span class="polaroid-date">' + esc(it.date || '') + '</span>' +
        '<figcaption class="polaroid-title">' + esc(it.title) + '</figcaption>' +
        '</figure>';
    }).join('');
    if (!items.length) {
      var empty = $('#photoEmpty');
      if (empty) empty.style.display = 'block';
      grid.innerHTML = '';
    } else {
      var empty2 = $('#photoEmpty');
      if (empty2) empty2.style.display = 'none';
    }
    // 点击开灯箱
    $$('.polaroid', grid).forEach(function (p) {
      p.addEventListener('click', function () {
        openLightbox(p.dataset.src, p.dataset.title, p.dataset.desc);
      });
    });
  }

  function setupViewToggle() {
    var toggle = $('#viewToggle');
    if (!toggle) return;
    var view = localStorage.getItem('coupleView') || 'card';
    $$('.view-btn', toggle).forEach(function (b) {
      if (b.dataset.view === view) b.classList.add('is-active');
      b.addEventListener('click', function () {
        view = b.dataset.view;
        localStorage.setItem('coupleView', view);
        $$('.view-btn', toggle).forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        renderGrid(DATA.photos[localStorage.getItem('coupleAlbum') || '0'], $('#photoGrid'));
      });
    });
  }

  /* ================= 故事时间线 ================= */
  function renderStories() {
    if (!DATA || !DATA.profile.stories) return;
    var items = DATA.profile.stories.items || [];
    var wrap = $('#storyTimeline');
    wrap.innerHTML = items.map(function (it, i) {
      return '<div class="story-item" style="transition-delay:' + (i * 120) + 'ms">' +
        '<div class="story-frame">' +
        '<p class="story-date">' + esc(it.date) + '</p>' +
        '<h3 class="story-title">' + esc(it.title) + '</h3>' +
        '<p class="story-desc">' + esc(it.desc) + '</p>' +
        '</div></div>';
    }).join('');
    // IntersectionObserver 逐条浮现
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.classList.add('is-visible');
      });
    }, { threshold: 0.2 });
    $$('.story-item', wrap).forEach(function (el) { io.observe(el); });
  }

  /* ================= 唱片机 ================= */
  function setupMusic() {
    if (!DATA || !DATA.music || !DATA.music.length) {
      $('#vinylNow').textContent = '歌单还是空的';
      return;
    }
    var tracks = DATA.music;
    var audio = $('#bgMusic');
    var playBtn = $('#musicPlay');
    var disc = $('#vinylDisc');
    var arm = $('#tonearm');
    var listEl = $('#trackList');
    var volume = 0.7;
    audio.volume = volume;

    // 歌单
    listEl.innerHTML = tracks.map(function (t, i) {
      return '<li data-idx="' + i + '"><span class="t-idx">' + (i + 1) + '</span>' +
        '<span class="t-name">' + esc(t.name) + '</span>' +
        '<span class="t-artist">' + esc(t.artist) + '</span></li>';
    }).join('');
    $$('li', listEl).forEach(function (li) {
      li.addEventListener('click', function () {
        var idx = +li.dataset.idx;
        if (idx === currentTrack && trackPlaying) { audio.pause(); }
        else { loadTrack(idx); audio.play(); }
      });
    });

    function loadTrack(i) {
      currentTrack = (i + tracks.length) % tracks.length;
      var t = tracks[currentTrack];
      audio.src = t.src;
      $('#vinylNow').textContent = '正在播放';
      $('#vinylTrack').textContent = t.name + ' — ' + t.artist;
      $$('li', listEl).forEach(function (li) {
        li.classList.toggle('is-playing', +li.dataset.idx === currentTrack);
      });
    }

    function play() {
      if (!audio.src) loadTrack(0);
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(function () { /* 自动播放被拦 */ });
    }

    playBtn.addEventListener('click', function () {
      if (trackPlaying) { audio.pause(); }
      else { play(); }
    });
    $('#musicPrev').addEventListener('click', function (e) { e.stopPropagation(); loadTrack(currentTrack - 1); play(); });
    $('#musicNext').addEventListener('click', function (e) { e.stopPropagation(); loadTrack(currentTrack + 1); play(); });

    audio.addEventListener('play', function () {
      trackPlaying = true;
      playBtn.textContent = '⏸';
      disc.classList.add('is-spinning');
      arm.classList.add('is-on');
    });
    audio.addEventListener('pause', function () {
      trackPlaying = false;
      playBtn.textContent = '▶';
      disc.classList.remove('is-spinning');
      arm.classList.remove('is-on');
    });
    audio.addEventListener('ended', function () { loadTrack(currentTrack + 1); play(); });
    audio.addEventListener('error', function () {
      $('#vinylNow').textContent = '音频加载失败，请检查文件';
    });

    // 用户首次交互后可自动播放（跳过后自动放第一首）
    document.addEventListener('intro-done', function () {
      setTimeout(function () {
        play();
      }, 1200);
    });
  }

  /* ================= 留言板 ================= */
  function setupMessages() {
    var typeEl = $('#msgTypewriter');
    var form = $('#msgForm');
    var input = $('#msgInput');
    var wall = $('#msgWall');

    // 读本地留言
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem('coupleNotes') || '[]'); } catch (e) { saved = []; }
    var all = saved.concat(msgNotes);

    // 打字机循环
    var qi = 0, ci = 0, deleting = false;
    (function type() {
      var text = (DATA && DATA.profile.messages && DATA.profile.messages.examples) || [];
      if (!text.length) return;
      var cur = text[qi % text.length];
      typeEl.textContent = cur.slice(0, ci);
      if (deleting) {
        ci -= 1;
        if (ci <= 0) { deleting = false; qi += 1; }
        setTimeout(type, 45);
      } else {
        ci += 1;
        if (ci > cur.length) {
          deleting = true;
          setTimeout(type, 3200);
        } else setTimeout(type, 85);
      }
    })();

    // 贴便签
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      saved.unshift(v);
      try { localStorage.setItem('coupleNotes', JSON.stringify(saved.slice(0, 30))); } catch (e) {}
      renderWall();
      input.value = '';
    });

    function renderWall() {
      wall.innerHTML = '';
      var shown = saved.concat(msgNotes).slice(0, 30);
      if (!shown.length) {
        wall.innerHTML = '<p class="msg-empty">还没有留言，写下第一句吧 ✍️</p>';
        return;
      }
      shown.forEach(function (txt, i) {
        var el = document.createElement('p');
        el.className = 'msg-note';
        el.style.animationDelay = (i * 60) + 'ms';
        el.textContent = txt;
        wall.appendChild(el);
      });
    }
    renderWall();
  }

  /* ================= 灯箱 ================= */
  function openLightbox(src, title, desc) {
    var lb = $('#lightbox');
    var body2 = $('#lightboxBody');
    body2.innerHTML = '';
    var lower = (src || '').toLowerCase();
    if (lower.match(/\.(mp4|webm|ogg|mov)$/)) {
      var v = document.createElement('video');
      v.src = src; v.controls = true; v.autoplay = true;
      body2.appendChild(v);
    } else {
      var img = document.createElement('img');
      img.src = src; img.alt = title || '';
      body2.appendChild(img);
    }
    // 配文：标题一行 + 描述一行（最多可到 2-3 行）
    var cap = $('#lightboxCaption');
    cap.innerHTML = '';
    if (title) {
      var b = document.createElement('b');
      b.textContent = title;
      cap.appendChild(b);
    }
    if (desc) {
      var s = document.createElement('span');
      s.textContent = desc;
      cap.appendChild(s);
    }
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    var lb = $('#lightbox');
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    $('#lightboxBody').innerHTML = '';
    body.style.overflow = '';
  }
  function setupLightbox() {
    var lb = $('#lightbox');
    $('#lightboxClose').addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ================= 顶栏/导航 ================= */
  function setupChrome() {
    var header = $('#siteHeader');
    var toTop = $('#toTop');
    var navToggle = $('#navToggle');
    var navLinks = $('#navLinks');

    function update() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      toTop.classList.toggle('is-visible', y > 600);
      // 高亮当前区块
      var cur = null;
      $$('.section, .hero').forEach(function (sec) {
        if (sec.getBoundingClientRect().top <= 120) cur = sec.id;
      });
      $$('.nav-link').forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();

    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('is-open');
    });
    $$('.nav-link', navLinks).forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('is-open'); });
    });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================= 主题（胶片负片） ================= */
  function setupTheme() {
    var btn = $('#themeToggle');
    var saved = localStorage.getItem('coupleTheme') || 'light';
    applyTheme(saved);
    btn.addEventListener('click', function () {
      var next = body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('coupleTheme', next);
    });
  }
  function applyTheme(t) {
    body.dataset.theme = t;
    var btn = $('#themeToggle');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }

  /* ================= 彩蛋：输入纪念日数字 ================= */
  function setupEgg() {
    // 输入 "20240214" 或 "214" 触发隐藏情话
    var buf = '';
    document.addEventListener('keydown', function (e) {
      if (e.key >= '0' && e.key <= '9') {
        buf += e.key;
        if (buf.length > 8) buf = buf.slice(-8);
        if (buf === '20240214' || buf === '214') {
          buf = '';
          var text = (DATA && DATA.profile.site && DATA.profile.site.motto) || '每一天，都像刚遇见你';
          var el = document.createElement('p');
          el.className = 'msg-note';
          el.textContent = '🔒 彩蛋解锁 · ' + text;
          el.style.background = 'var(--accent-dark)';
          el.style.color = '#fff8ee';
          el.style.fontSize = '1.05rem';
          var wall = $('#msgWall');
          wall.insertBefore(el, wall.firstChild);
          wall.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        buf = '';
      }
    });
  }

  /* ---------- 密码门（不影响网站初始化，遮罩覆盖最上层） ---------- */
  var GATE_HASH = "ea18fc7daade0531a26a6306a9e88a0569e0c379e6e58d754f4bd6e21cbacb1a";

  (function setupGate() {
    var gate = $('#siteGate');
    if (!gate) return;

    // 同一会话内已解锁 → 直接隐藏
    if (sessionStorage.getItem('siteUnlocked') === '1') {
      gate.style.display = 'none';
      return;
    }

    var gateInput = $('#gateInput');
    var gateBtn = $('#gateBtn');
    var gateError = $('#gateError');
    if (gateInput) gateInput.focus();

    async function tryUnlock() {
      var pw = gateInput ? gateInput.value : '';
      if (!pw) return;
      try {
        var buf = new TextEncoder().encode(pw);
        var hashBuf = await crypto.subtle.digest('SHA-256', buf);
        var hash = Array.from(new Uint8Array(hashBuf)).map(function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
        if (hash === GATE_HASH) {
          sessionStorage.setItem('siteUnlocked', '1');
          gate.classList.add('is-unlocked');
          setTimeout(function () { gate.style.display = 'none'; }, 600);
        } else {
          if (gateError) { gateError.textContent = '密码不对哦，再试试？'; gateError.classList.add('show'); }
          gateInput.value = '';
          gateInput.focus();
        }
      } catch (e) {
        if (gateError) { gateError.textContent = '当前环境不支持加密验证，请通过 HTTPS 访问'; gateError.classList.add('show'); }
      }
    }

    if (gateBtn) gateBtn.addEventListener('click', tryUnlock);
    if (gateInput) gateInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryUnlock();
    });
  })();

  /* ================= 启动 ================= */
  function boot() {
    initIntro();
    setupChrome();
    setupTheme();
    setupLightbox();

    if (!DATA) {
      // 没有数据文件（未构建）：仍渲染壳子
      renderProfile();
      return;
    }
    renderProfile();
    setupCountdown();
    renderAlbums();
    renderStories();
    setupMusic();
    setupMessages();
    setupEgg();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();