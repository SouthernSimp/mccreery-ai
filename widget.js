/*! nm-chat — embedded assistant widget for mccreery.ai
 *  Self-contained vanilla-JS IIFE. No dependencies. All CSS injected.
 *  Streams from POST {API_BASE}/api/assistant/chat (text/event-stream,
 *  same `data: {"t": "..."}` chunk shape as the site's /api/brief).
 */
(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────────────────── */
  var API_BASE = window.NM_CHAT_API_BASE || 'https://os.mccreery.ai';
  var CHAT_URL = API_BASE + '/api/assistant/chat';
  var MAX_STORED = 20;            // messages persisted + sent as history
  var STORE_KEY = 'nm-chat-msgs';
  var OPENED_KEY = 'nm-chat-opened';
  var RENDER_MS = 80;             // markdown re-render throttle while streaming
  var NUDGE_DELAY = 8000;         // attention pulse after 8s if never opened
  var TEASER_DELAY = 12000;       // teaser label after 12s (desktop only)

  if (window.__nmChatLoaded) return;
  window.__nmChatLoaded = true;

  /* ── CSS ─────────────────────────────────────────────────────────────── */
  var CSS = [
    '.nm-chat{--c-bg:#181818;--c-ink:#ece8e1;--c-mute:#8d8780;--c-rule:#2a2a2a;--c-accent:#e8c79a;',
    '--c-panel:#1a1a1a;--c-panel-edge:#2a2a2a;--c-user-bubble:#242220;--c-bot-text:#cfc9bf;',
    '--c-shadow:0 8px 32px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.3);--c-radius:10px;',
    "--c-font:'Inter',system-ui,sans-serif;--c-mono:ui-monospace,'SF Mono',Menlo,monospace;",
    'font-family:var(--c-font);font-size:14px;line-height:1.65;color:var(--c-ink);',
    'text-align:left;box-sizing:border-box}',
    '.nm-chat *,.nm-chat *::before,.nm-chat *::after{box-sizing:border-box;margin:0;padding:0}',
    '.nm-chat button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}',
    '.nm-chat :focus-visible{outline:1px solid var(--c-accent);outline-offset:2px}',

    /* launcher */
    '.nm-chat .nm-launcher{position:fixed;right:24px;bottom:24px;z-index:90;height:48px;padding:0 20px 0 16px;',
    'border-radius:24px;background:var(--c-accent);border:1px solid var(--c-accent);color:#181818;',
    'display:flex;align-items:center;justify-content:center;gap:9px;transition:all .2s;',
    'box-shadow:0 4px 18px rgba(232,199,154,.32),0 2px 6px rgba(0,0,0,.4);',
    'animation:nm-breathe 3.2s ease-in-out infinite}',
    '.nm-chat .nm-launcher:hover{transform:translateY(-2px);box-shadow:0 6px 26px rgba(232,199,154,.5),0 2px 8px rgba(0,0,0,.4);animation:none}',
    '.nm-chat .nm-launcher .nm-glyph{font-size:17px;line-height:1;transition:transform .2s;user-select:none}',
    '.nm-chat .nm-launcher .nm-label{font-family:var(--c-mono);font-size:12px;font-weight:600;letter-spacing:.08em;white-space:nowrap;user-select:none}',
    '.nm-chat .nm-launcher .nm-x{display:none;font-size:20px;font-family:var(--c-font)}',
    '.nm-chat .nm-launcher[aria-expanded="true"]{width:48px;padding:0;border-radius:50%;animation:none;box-shadow:0 2px 8px rgba(0,0,0,.4)}',
    '.nm-chat .nm-launcher[aria-expanded="true"] .nm-glyph,.nm-launcher[aria-expanded="true"] .nm-label{display:none}',
    '.nm-chat .nm-launcher[aria-expanded="true"] .nm-x{display:block;transform:rotate(90deg);transition:transform .2s}',
    '.nm-chat .nm-launcher .nm-dot{display:none;position:absolute;top:-2px;right:2px;width:9px;height:9px;',
    'border-radius:50%;background:#4ade80;border:2px solid #181818}',
    '.nm-chat .nm-launcher.nm-nudge .nm-dot{display:block;animation:nm-blink 1.4s infinite}',
    '@keyframes nm-pulse{0%{box-shadow:0 0 0 0 rgba(232,199,154,.45)}100%{box-shadow:0 0 0 18px rgba(232,199,154,0)}}',
    '@keyframes nm-breathe{0%,100%{box-shadow:0 4px 18px rgba(232,199,154,.32),0 2px 6px rgba(0,0,0,.4)}50%{box-shadow:0 4px 28px rgba(232,199,154,.55),0 2px 6px rgba(0,0,0,.4)}}',
    '.nm-chat .nm-launcher.nm-nudge{animation:nm-pulse 1.6s ease-out 2,nm-breathe 3.2s ease-in-out 3.2s infinite}',
    '@keyframes nm-blink{0%,100%{opacity:1}50%{opacity:.25}}',

    /* teaser */
    '.nm-teaser{position:fixed;right:178px;bottom:40px;z-index:90;font-family:var(--c-mono);',
    'font-size:11px;color:var(--c-mute);letter-spacing:.04em;opacity:0;transition:opacity .6s;pointer-events:none}',
    '.nm-teaser.nm-show{opacity:1}',

    /* panel */
    '.nm-panel{position:fixed;right:24px;bottom:88px;z-index:91;width:380px;',
    'height:min(560px,calc(100vh - 120px));display:none;flex-direction:column;overflow:hidden;',
    'background:var(--c-panel);border:1px solid var(--c-panel-edge);border-radius:var(--c-radius);',
    'box-shadow:var(--c-shadow);opacity:0;transform:translateY(8px) scale(.98);transform-origin:bottom right;',
    'transition:opacity .22s cubic-bezier(.2,.8,.2,1),transform .22s cubic-bezier(.2,.8,.2,1)}',
    '.nm-panel.nm-open{opacity:1;transform:none}',

    /* header */
    '.nm-head{flex:0 0 44px;display:flex;align-items:center;gap:10px;padding:0 14px;',
    'border-bottom:1px solid var(--c-rule);font-family:var(--c-mono);font-size:11px;color:var(--c-mute)}',
    '.nm-dots{display:flex;gap:6px;flex:0 0 auto}',
    '.nm-dots span{width:9px;height:9px;border-radius:50%}',
    '.nm-dots span:nth-child(1){background:#F87171}',
    '.nm-dots span:nth-child(2){background:#FBBF24}',
    '.nm-dots span:nth-child(3){background:#4ade80}',
    '.nm-head-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.nm-status{display:flex;align-items:center;gap:7px;flex:0 0 auto;letter-spacing:.12em}',
    '.nm-status .nm-ind{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:nm-blink 1.4s infinite}',
    '.nm-close{width:28px;height:28px;min-width:28px;display:flex;align-items:center;justify-content:center;',
    'font-size:16px;color:var(--c-mute);transition:color .15s}',
    '.nm-close:hover{color:var(--c-ink)}',

    /* message list */
    '.nm-list{flex:1;overflow-y:auto;padding:18px 16px;scroll-behavior:smooth;overscroll-behavior:contain}',
    '@keyframes nm-msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '.nm-msg{animation:nm-msg-in .25s ease both;margin-bottom:16px}',
    '.nm-kicker{font-family:var(--c-mono);font-size:10px;letter-spacing:.16em;color:var(--c-mute);margin-bottom:6px}',
    '.nm-bot{color:var(--c-bot-text);max-width:100%}',
    '.nm-bot a{color:var(--c-accent);text-decoration:none}',
    '.nm-bot a:hover{text-decoration:underline}',
    '.nm-bot code{font-family:var(--c-mono);font-size:12.5px;background:#111;border:1px solid var(--c-rule);padding:1px 5px}',
    '.nm-bot ul{padding-left:18px;margin:6px 0}',
    '.nm-bot li{margin:3px 0}',
    '.nm-bot p{margin:0 0 8px}',
    '.nm-bot p:last-child{margin-bottom:0}',
    '.nm-user{display:flex;justify-content:flex-end}',
    '.nm-user .nm-user-inner{background:var(--c-user-bubble);border:1px solid var(--c-rule);',
    'border-radius:6px;padding:10px 12px;max-width:85%;color:var(--c-ink);white-space:pre-wrap;word-wrap:break-word}',
    '.nm-thinking{display:flex;align-items:center;gap:7px;font-family:var(--c-mono);font-size:11px;color:var(--c-mute)}',
    '.nm-thinking .nm-ind{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:nm-blink 1.4s infinite}',
    '.nm-cursor{display:inline-block;width:7px;height:14px;margin-left:2px;background:var(--c-accent);',
    'vertical-align:-2px;animation:nm-cblink .8s steps(1) infinite}',
    '@keyframes nm-cblink{0%,100%{opacity:1}50%{opacity:0}}',
    '.nm-err{font-family:var(--c-mono);font-size:11px;color:var(--c-mute)}',
    '.nm-err a{color:var(--c-accent);cursor:pointer;text-decoration:none}',
    '.nm-err a:hover{text-decoration:underline}',

    /* new-messages pill */
    '.nm-newpill{position:absolute;left:50%;transform:translateX(-50%);bottom:118px;z-index:2;display:none;',
    'font-family:var(--c-mono);font-size:10px;letter-spacing:.1em;color:var(--c-accent);',
    'border:1px solid var(--c-accent);border-radius:999px;background:var(--c-panel);padding:5px 12px}',
    '.nm-newpill.nm-show{display:block}',

    /* empty state */
    '.nm-empty{padding:24px 16px}',
    '.nm-empty .nm-ek{font-family:var(--c-mono);font-size:11px;letter-spacing:.18em;color:var(--c-mute);margin-bottom:12px}',
    ".nm-empty .nm-eh{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:22px;color:var(--c-ink);margin-bottom:8px}",
    '.nm-empty .nm-es{font-size:13px;color:var(--c-mute);margin-bottom:18px}',
    '.nm-chips{display:flex;flex-direction:column;gap:8px}',
    '.nm-chip{min-height:44px;width:100%;text-align:left;padding:10px 16px;border:1px solid var(--c-rule);',
    'border-radius:999px;font-size:12px;color:var(--c-ink);transition:all .15s}',
    '.nm-chip:hover{border-color:var(--c-accent);color:var(--c-accent)}',

    /* input bar */
    '.nm-bar{flex:0 0 auto;border-top:1px solid var(--c-rule);padding:10px}',
    '.nm-row{display:flex;gap:8px;align-items:flex-end}',
    '.nm-input{flex:1;resize:none;background:#111;border:1px solid var(--c-rule);border-radius:0;',
    "color:var(--c-ink);font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.45;",
    'padding:9px 11px;outline:none;transition:border-color .15s;max-height:96px;overflow-y:auto}',
    '.nm-input:focus{border-color:var(--c-accent)}',
    '.nm-input::placeholder{color:var(--c-mute)}',
    '.nm-send{width:36px;height:36px;min-width:36px;background:var(--c-accent);color:#181818;',
    'font-size:16px;display:flex;align-items:center;justify-content:center;transition:opacity .15s}',
    '.nm-send:disabled{opacity:.4;cursor:default}',
    '.nm-micro{font-family:var(--c-mono);font-size:10px;color:var(--c-mute);margin-top:7px}',

    /* SR-only live region */
    '.nm-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;',
    'clip:rect(0 0 0 0);white-space:nowrap;border:0}',

    /* mobile sheet */
    '@media (max-width:639.5px){',
    '.nm-chat .nm-launcher{right:16px;bottom:16px}',
    '.nm-teaser{display:none}',
    '.nm-panel{inset:0;right:0;bottom:0;width:100%;height:100dvh;border-radius:0;border:0;box-shadow:none;',
    'transform:translateY(24px);transition:opacity .25s ease,transform .25s ease}',
    '.nm-panel.nm-open{transform:none}',
    '.nm-close{width:44px;height:44px;min-width:44px}',
    '.nm-input{font-size:16px}',
    '.nm-bar{padding-bottom:calc(10px + env(safe-area-inset-bottom))}',
    '.nm-newpill{bottom:130px}',
    '}',

    /* reduced motion */
    '@media (prefers-reduced-motion:reduce){',
    '.nm-chat *,.nm-launcher,.nm-panel{animation:none!important;transition:none!important}',
    '.nm-cursor{animation:none!important;opacity:1}',
    '}'
  ].join('');

  /* ── State ───────────────────────────────────────────────────────────── */
  var msgs = [];
  try { msgs = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { msgs = []; }
  if (!Array.isArray(msgs)) msgs = [];
  msgs = msgs.filter(function (m) {
    return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
  }).slice(-MAX_STORED);

  var isOpen = false;
  var streaming = false;
  var everOpened = false;
  try { everOpened = localStorage.getItem(OPENED_KEY) === '1'; } catch (e) {}
  var savedScrollY = 0;
  var lastUserText = '';

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-MAX_STORED))); } catch (e) {}
  }

  /* ── Markdown-lite (bold, links, inline code, dash lists) ────────────── */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }
  function md(src) {
    var lines = esc(src).split('\n');
    var out = '', inList = false, para = [];
    function flushPara() {
      if (para.length) { out += '<p>' + inline(para.join('<br>')) + '</p>'; para = []; }
    }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var li = ln.match(/^\s*[-*]\s+(.*)$/);
      if (li) {
        flushPara();
        if (!inList) { out += '<ul>'; inList = true; }
        out += '<li>' + inline(li[1]) + '</li>';
      } else {
        if (inList) { out += '</ul>'; inList = false; }
        if (ln.trim() === '') flushPara(); else para.push(ln);
      }
    }
    if (inList) out += '</ul>';
    flushPara();
    return out;
  }

  /* ── DOM build ───────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'nm-chat-css';
  style.textContent = CSS;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.className = 'nm-chat';
  root.innerHTML =
    '<span class="nm-teaser" aria-hidden="true">it really answers — try it</span>' +
    '<button class="nm-launcher" type="button" aria-haspopup="dialog" aria-expanded="false"' +
    ' aria-controls="nm-chat-panel" aria-label="Open chat with Nate\'s assistant">' +
    '<span class="nm-glyph" aria-hidden="true">&#10024;</span>' +
    '<span class="nm-label">ASK MY AI</span>' +
    '<span class="nm-x" aria-hidden="true">&times;</span>' +
    '<span class="nm-dot" aria-hidden="true"></span></button>' +
    '<section class="nm-panel" id="nm-chat-panel" role="dialog" aria-modal="false"' +
    ' aria-label="Chat with Nate\'s assistant">' +
    '<header class="nm-head">' +
    '<span class="nm-dots" aria-hidden="true"><span></span><span></span><span></span></span>' +
    '<span class="nm-head-title">nate@mccreery.ai — assistant</span>' +
    '<span class="nm-status"><span class="nm-ind" aria-hidden="true"></span>ONLINE</span>' +
    '<button class="nm-close" type="button" aria-label="Close chat">&times;</button>' +
    '</header>' +
    '<div class="nm-list" aria-live="off"></div>' +
    '<button class="nm-newpill" type="button">&darr; new</button>' +
    '<div class="nm-sr" aria-live="polite" aria-atomic="false" role="status"></div>' +
    '<div class="nm-bar">' +
    '<div class="nm-row">' +
    '<textarea class="nm-input" rows="1" maxlength="2000" placeholder="Ask about projects, pricing, process…"' +
    ' aria-label="Message"></textarea>' +
    '<button class="nm-send" type="button" aria-label="Send message" disabled>&#8629;</button>' +
    '</div>' +
    '<div class="nm-micro">deepseek via os.mccreery.ai &mdash; replies may be imperfect</div>' +
    '</div>' +
    '</section>';
  document.body.appendChild(root);

  var launcher = root.querySelector('.nm-launcher');
  var teaser = root.querySelector('.nm-teaser');
  var panel = root.querySelector('.nm-panel');
  var closeBtn = root.querySelector('.nm-close');
  var list = root.querySelector('.nm-list');
  var newPill = root.querySelector('.nm-newpill');
  var srLive = root.querySelector('.nm-sr');
  var input = root.querySelector('.nm-input');
  var sendBtn = root.querySelector('.nm-send');

  var mqMobile = window.matchMedia('(max-width: 639.5px)');
  function isMobile() { return mqMobile.matches; }

  /* ── Rendering ───────────────────────────────────────────────────────── */
  function nearBottom() {
    return list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  }
  function scrollBottom() {
    list.scrollTop = list.scrollHeight;
    newPill.classList.remove('nm-show');
  }
  function maybeScroll() {
    if (nearBottom()) scrollBottom();
    else newPill.classList.add('nm-show');
  }

  function emptyStateNode() {
    var div = document.createElement('div');
    div.className = 'nm-empty';
    div.innerHTML =
      '<div class="nm-ek">// ASK ANYTHING</div>' +
      '<div class="nm-eh">This site can answer for me.</div>' +
      '<div class="nm-es">Powered by an agent I built &mdash; same stack I\'d build for you.</div>' +
      '<div class="nm-chips"></div>';
    var chips = div.querySelector('.nm-chips');
    ['What do you actually build?', 'What does a project cost?', 'Could AI help my business?']
      .forEach(function (q) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'nm-chip';
        b.textContent = q;
        b.addEventListener('click', function () { sendMessage(q); });
        chips.appendChild(b);
      });
    return div;
  }

  function botNode(withKicker) {
    var wrap = document.createElement('div');
    wrap.className = 'nm-msg';
    if (withKicker) {
      var k = document.createElement('div');
      k.className = 'nm-kicker';
      k.textContent = 'ASSISTANT';
      wrap.appendChild(k);
    }
    var body = document.createElement('div');
    body.className = 'nm-bot';
    wrap.appendChild(body);
    return { wrap: wrap, body: body };
  }

  function userNode(text) {
    var wrap = document.createElement('div');
    wrap.className = 'nm-msg nm-user';
    var inner = document.createElement('div');
    inner.className = 'nm-user-inner';
    inner.textContent = text;
    wrap.appendChild(inner);
    return wrap;
  }

  function renderAll() {
    list.innerHTML = '';
    if (msgs.length === 0) {
      list.appendChild(emptyStateNode());
      return;
    }
    var prevRole = '';
    msgs.forEach(function (m) {
      if (m.role === 'user') {
        list.appendChild(userNode(m.content));
      } else {
        var n = botNode(prevRole !== 'assistant');
        n.body.innerHTML = md(m.content);
        list.appendChild(n.wrap);
      }
      prevRole = m.role;
    });
    scrollBottom();
  }

  /* ── Streaming ───────────────────────────────────────────────────────── */
  function sendMessage(text) {
    text = (text || '').trim();
    if (!text || streaming) return;
    lastUserText = text;

    var empty = list.querySelector('.nm-empty');
    if (empty) empty.remove();

    var prevRole = msgs.length ? msgs[msgs.length - 1].role : '';
    msgs.push({ role: 'user', content: text });
    msgs = msgs.slice(-MAX_STORED);
    save();
    list.appendChild(userNode(text));
    scrollBottom();

    input.value = '';
    autoGrow();
    updateSendState();

    streamReply(prevRole);
  }

  function streamReply() {
    streaming = true;
    updateSendState();

    var node = botNode(true);
    var thinking = document.createElement('span');
    thinking.className = 'nm-thinking';
    thinking.setAttribute('role', 'status');
    thinking.innerHTML = '<span class="nm-ind"></span>thinking&hellip;';
    node.body.appendChild(thinking);
    list.appendChild(node.wrap);
    scrollBottom();

    var acc = '';
    var gotFirst = false;
    var lastRender = 0;
    var renderTimer = null;

    function paint(final) {
      node.body.innerHTML = md(acc) + (final ? '' : '<span class="nm-cursor" aria-hidden="true"></span>');
      maybeScroll();
    }
    function throttledPaint() {
      var now = Date.now();
      if (now - lastRender >= RENDER_MS) {
        lastRender = now;
        paint(false);
      } else if (!renderTimer) {
        renderTimer = setTimeout(function () {
          renderTimer = null;
          lastRender = Date.now();
          paint(false);
        }, RENDER_MS - (now - lastRender));
      }
    }
    function finish(ok) {
      if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
      streaming = false;
      updateSendState();
      if (acc) {
        paint(true);
        msgs.push({ role: 'assistant', content: acc });
        msgs = msgs.slice(-MAX_STORED);
        save();
        srLive.textContent = acc;
      }
      if (!ok) {
        var err = document.createElement('div');
        err.className = 'nm-err';
        err.innerHTML = '&mdash; connection lost. <a role="button" tabindex="0">retry?</a>';
        var retry = err.querySelector('a');
        function doRetry() {
          err.remove();
          if (!acc) node.wrap.remove();
          // re-send the last user message (it's already in msgs/history)
          streamReply();
        }
        retry.addEventListener('click', doRetry);
        retry.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doRetry(); }
        });
        if (!acc) node.body.innerHTML = '';
        node.body.appendChild(err);
        maybeScroll();
      }
      if (isOpen) input.focus();
    }

    fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs.slice(-MAX_STORED) })
    }).then(function (r) {
      if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
      var reader = r.body.getReader();
      var dec = new TextDecoder();
      var buf = '';
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) { finish(true); return; }
          buf += dec.decode(res.value, { stream: true });
          var parts = buf.split('\n\n');
          buf = parts.pop();
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p.indexOf('data:') !== 0) continue;
            var ev;
            try { ev = JSON.parse(p.slice(5).trim()); } catch (e) { continue; }
            if (ev.t) {
              if (!gotFirst) { gotFirst = true; thinking.remove(); }
              acc += ev.t;
              throttledPaint();
            } else if (ev.error) {
              if (!gotFirst) { gotFirst = true; thinking.remove(); }
              finish(false);
              return;
            } else if (ev.done) {
              finish(true);
              return;
            }
          }
          return pump();
        });
      }
      return pump();
    }).catch(function () {
      thinking.remove();
      finish(false);
    });
  }

  /* ── Input behavior ──────────────────────────────────────────────────── */
  function updateSendState() {
    sendBtn.disabled = streaming || input.value.trim() === '';
  }
  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  }
  input.addEventListener('input', function () { autoGrow(); updateSendState(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  sendBtn.addEventListener('click', function () { sendMessage(input.value); });
  newPill.addEventListener('click', scrollBottom);
  list.addEventListener('scroll', function () {
    if (nearBottom()) newPill.classList.remove('nm-show');
  });

  /* ── Open / close ────────────────────────────────────────────────────── */
  function openPanel() {
    if (isOpen) return;
    isOpen = true;
    launcher.setAttribute('aria-expanded', 'true');
    launcher.classList.remove('nm-nudge');
    teaser.classList.remove('nm-show');
    try { localStorage.setItem(OPENED_KEY, '1'); } catch (e) {}
    everOpened = true;
    if (isMobile()) {
      panel.setAttribute('aria-modal', 'true');
      savedScrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      panel.setAttribute('aria-modal', 'false');
    }
    panel.style.display = 'flex';
    renderAll();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { panel.classList.add('nm-open'); });
    });
    input.focus();
  }
  function closePanel() {
    if (!isOpen) return;
    isOpen = false;
    launcher.setAttribute('aria-expanded', 'false');
    panel.classList.remove('nm-open');
    panel.style.display = 'none';
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
    launcher.focus();
  }
  launcher.addEventListener('click', function () { isOpen ? closePanel() : openPanel(); });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closePanel();
    // mobile focus trap
    if (e.key === 'Tab' && isOpen && isMobile()) {
      var focusables = [closeBtn, input];
      if (!sendBtn.disabled) focusables.push(sendBtn);
      var chips = panel.querySelectorAll('.nm-chip');
      for (var i = 0; i < chips.length; i++) focusables.splice(1, 0, chips[i]);
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* ── Attention nudge + teaser (one-shot, never after first open) ─────── */
  if (!everOpened) {
    setTimeout(function () {
      if (!everOpened && !isOpen) launcher.classList.add('nm-nudge');
    }, NUDGE_DELAY);
    setTimeout(function () {
      if (!everOpened && !isOpen && !isMobile()) teaser.classList.add('nm-show');
    }, TEASER_DELAY);
    document.addEventListener('click', function dismiss() {
      teaser.classList.remove('nm-show');
      document.removeEventListener('click', dismiss);
    });
  }
})();
