/* render.js — progressive enhancement layer for mccreery.ai
 *
 * Reads a sections.json model and applies it ON TOP of the static HTML:
 *   - hides sections marked visible:false
 *   - reorders sections (within their shared parent container)
 *   - updates editable text fields (headings, paragraphs, link labels/urls)
 *
 * Defensive by design: if the fetch fails, the JSON is malformed, or a
 * selector doesn't match, the static page is left untouched. No frameworks,
 * no rewriting the DOM — the HTML remains the fallback.
 *
 * Config (set before this script loads, optional):
 *   window.NATEOS_SECTIONS_URL — where to fetch the model.
 *     Default: '/site-config/sections.json'
 *     Production (cross-origin): 'https://os.mccreery.ai/site-config/sections.json'
 *
 * Inside an iframe it also listens for postMessage
 * ({type:'nateos:sections', payload:model}) so the NateOS site editor can
 * live-preview changes.
 */
(function () {
  'use strict';

  var SECTIONS_URL = (typeof window !== 'undefined' && window.NATEOS_SECTIONS_URL) ||
    '/site-config/sections.json';

  function applyField(root, f) {
    if (!f || typeof f.sel !== 'string' || typeof f.value !== 'string') return;
    var el = null;
    try { el = root.querySelector(f.sel); } catch (e) { return; }
    if (!el) return;
    try {
      if (f.attr === 'html') el.innerHTML = f.value;
      else if (f.attr === 'href') el.setAttribute('href', f.value);
      else el.textContent = f.value; // 'text' and default
    } catch (e) { /* never break the page */ }
  }

  function apply(model) {
    if (!model || !Array.isArray(model.sections)) return;

    // Group section elements by parent so reordering never moves a section
    // out of its container (hero/brief/footer live on <body>, work/apps/
    // services live in <main>).
    var groups = []; // [{parent, items:[{el, order}]}]
    model.sections.forEach(function (s) {
      if (!s || typeof s.id !== 'string') return;
      var el = null;
      try {
        el = document.querySelector('[data-section-id="' + s.id.replace(/"/g, '') + '"]');
      } catch (e) { return; }
      if (!el) return;

      el.style.display = (s.visible === false) ? 'none' : '';
      (Array.isArray(s.fields) ? s.fields : []).forEach(function (f) {
        applyField(el, f);
      });

      var parent = el.parentNode;
      if (!parent) return;
      var g = null;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].parent === parent) { g = groups[i]; break; }
      }
      if (!g) { g = { parent: parent, items: [] }; groups.push(g); }
      g.items.push({ el: el, order: (typeof s.order === 'number') ? s.order : 0 });
    });

    // Reorder within each parent using placeholder anchors so sections keep
    // occupying the same slots (siblings like <nav> or <script> stay put).
    groups.forEach(function (g) {
      if (g.items.length < 2) return;
      try {
        var current = g.items.slice().sort(function (a, b) {
          // current DOM order
          return (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
        });
        var desired = g.items.slice().sort(function (a, b) { return a.order - b.order; });

        var changed = current.some(function (it, i) { return it.el !== desired[i].el; });
        if (!changed) return;

        var anchors = current.map(function (it) {
          var ph = document.createComment('s');
          g.parent.insertBefore(ph, it.el);
          return ph;
        });
        desired.forEach(function (it, i) {
          g.parent.insertBefore(it.el, anchors[i]);
        });
        anchors.forEach(function (ph) { g.parent.removeChild(ph); });
      } catch (e) { /* leave order as-is */ }
    });
  }

  function boot() {
    // Live config fetch — no-op fallback if missing/broken.
    try {
      fetch(SECTIONS_URL, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (model) {
          // API envelope tolerance: accept either the raw model or {success,data}.
          if (model && model.data && model.data.sections) model = model.data;
          if (model) apply(model);
        })
        .catch(function () { /* static HTML stays */ });
    } catch (e) { /* static HTML stays */ }
  }

  // Editor live-preview channel (only when embedded in an iframe).
  if (window.self !== window.top) {
    window.addEventListener('message', function (ev) {
      var d = ev && ev.data;
      if (d && d.type === 'nateos:sections' && d.payload) apply(d.payload);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose for debugging / manual application.
  window.NateOSRender = { apply: apply };
})();
