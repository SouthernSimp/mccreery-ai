/* ============================================
   Vickytoria EOD Reporting — Wiki Sync Simulation
   --------------------------------------------
   Visual sync flow diagram + terminal-style log +
   animated sync simulation. This is the "wow"
   moment of the Victoria pitch: it visualises
   QuickSight auto-pushing data to the wiki
   spreadsheet with zero manual entry.

   Loads AFTER js/data.js (MANAGERS, METRICS, AppState)
   and BEFORE js/wiki-demo.js.
   All four public functions are global.
   ============================================ */

/* ---- Internal simulation state ---- */
let _syncSimulationRunning = false;
let _syncSimulationTimers  = [];


/* ============================================
   Helper: format a Date as HH:MM:SS (24-hour)
   ============================================ */
function _formatLogTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return h + ':' + m + ':' + s;
}

/* ============================================
   Helper: safely read manager / metric counts
   from the global data model (with fallbacks).
   ============================================ */
function _getSyncCounts() {
  const mgrCount    = (typeof MANAGERS !== 'undefined' && MANAGERS) ? MANAGERS.length : 6;
  const metricCount = (typeof METRICS  !== 'undefined' && METRICS)  ? METRICS.length  : 10;
  return { mgrCount, metricCount, cellCount: mgrCount * metricCount };
}

/* ============================================
   Helper: show / update the toast notification.
   Creates the .toast element dynamically if it
   doesn't exist yet. Auto-hides after 3 seconds.
   type: null | 'success' | 'warning' | 'error'
   ============================================ */
function _showSyncToast(message, type) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    document.body.appendChild(toast);
  }

  const icons = {
    success: '✅',
    warning: '⚠️',
    error:   '❌',
    info:    'ℹ️'
  };
  const icon = icons[type] || '🔄';

  // Reset to base class, then apply type
  toast.className = 'toast';
  if (type) {
    toast.classList.add(type);
  }
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  // Clear any pending auto-hide from a previous toast
  if (toast._syncToastTimer) {
    clearTimeout(toast._syncToastTimer);
  }

  // Force reflow so the CSS transition replays, then reveal
  void toast.offsetWidth;
  toast.classList.add('show');

  // Auto-hide after 3 s
  toast._syncToastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

/* ============================================
   Helper: remove .active from every flow node
   and arrow (reset the diagram to idle).
   ============================================ */
function _deactivateAllFlow() {
  document.querySelectorAll('.sync-flow-node, .sync-flow-arrow').forEach(function (el) {
    el.classList.remove('active');
  });
}

/* ============================================
   Helper: add .active to a specific flow element.
   target: 'source' | 'engine' | 'wiki' | 'arrow-1' | 'arrow-2'
   ============================================ */
function _activateFlowTarget(target) {
  let el;
  if (target.indexOf('arrow') === 0) {
    el = document.getElementById('sync-' + target);       // sync-arrow-1 / sync-arrow-2
  } else {
    el = document.getElementById('sync-node-' + target);  // sync-node-source / engine / wiki
  }
  if (el) {
    el.classList.add('active');
  }
}


/* ============================================
   renderSyncFlowPanel()
   --------------------------------------------
   Returns an HTML string for the QuickSight →
   Wiki sync flow diagram panel.

   Structure:
     📊 QuickSight  ──▶  ⚡ Sync Engine  ──▶  📝 Wiki
        (source)      (validates)           (destination)
   ============================================ */
function renderSyncFlowPanel() {
  return `
    <div class="sync-flow-panel">
      <div class="sync-flow-title">🔄 QuickSight → Wiki Sync Flow</div>
      <div class="sync-flow-diagram">

        <!-- Node 1 — Source -->
        <div class="sync-flow-node source" id="sync-node-source">
          <div class="node-icon">📊</div>
          <div class="node-title">QuickSight Dashboard</div>
          <div class="node-subtitle">Reporting data source</div>
        </div>

        <!-- Arrow 1 — QuickSight → Sync Engine -->
        <div class="sync-flow-arrow" id="sync-arrow-1">
          <div class="flow-label">Auto-push (every 15 min)</div>
          <div class="arrow-line"></div>
          <div class="data-packet"></div>
          <div class="data-packet" style="animation-delay: 0.5s;"></div>
          <div class="data-packet" style="animation-delay: 1s;"></div>
        </div>

        <!-- Node 2 — Sync Engine (default gray border) -->
        <div class="sync-flow-node" id="sync-node-engine">
          <div class="node-icon">⚡</div>
          <div class="node-title">Sync Engine</div>
          <div class="node-subtitle">Validates &amp; transforms</div>
        </div>

        <!-- Arrow 2 — Sync Engine → Wiki -->
        <div class="sync-flow-arrow" id="sync-arrow-2">
          <div class="flow-label">API POST</div>
          <div class="arrow-line"></div>
          <div class="data-packet"></div>
          <div class="data-packet" style="animation-delay: 0.5s;"></div>
          <div class="data-packet" style="animation-delay: 1s;"></div>
        </div>

        <!-- Node 3 — Destination -->
        <div class="sync-flow-node wiki" id="sync-node-wiki">
          <div class="node-icon">📝</div>
          <div class="node-title">Wiki Spreadsheet</div>
          <div class="node-subtitle">EOD Report page</div>
        </div>

      </div>

      <!-- Status bar -->
      <div style="display: flex; justify-content: center; gap: 28px; margin-top: 14px; font-size: 12px; color: var(--gray-500); flex-wrap: wrap;">
        <span>🔄 Last sync: <strong>15 min ago</strong></span>
        <span>⏱️ Next sync: <strong>in 15 min</strong></span>
        <span>✅ Status: <strong style="color: var(--success);">Operational</strong></span>
      </div>
    </div>
  `;
}


/* ============================================
   renderSyncLog()
   --------------------------------------------
   Returns an HTML string for a dark terminal-
   style log panel pre-populated with 6 recent
   sync events. Timestamps are generated relative
   to "now" so they always look fresh.
   ============================================ */
function renderSyncLog() {
  const now = new Date();
  const { mgrCount, cellCount } = _getSyncCounts();

  // Pre-populated entries (times relative to now)
  const entries = [
    { minsAgo: 15, type: 'sync', msg: `Auto-sync completed — ${mgrCount}/${mgrCount} managers synced` },
    { minsAgo: 15, type: 'info', msg: 'QuickSight dashboard query executed (2.3s)' },
    { minsAgo: 15, type: 'sync', msg: `Data validated — ${cellCount} cells checked, 0 errors` },
    { minsAgo: 14, type: 'info', msg: 'Wiki page updated — EOD_Report page ID #4823' },
    { minsAgo: 12, type: 'warn', msg: "Cell J5 (Adherence - M.O'Brien) overridden by admin" },
    { minsAgo: 0,  type: 'sync', msg: 'Previous sync: 15 min ago — Next sync: in 15 min' }
  ];

  const html = entries.map(function (e) {
    const time = new Date(now.getTime() - e.minsAgo * 60000);
    return `
        <div class="log-entry">
          <span class="log-time">${_formatLogTime(time)}</span>
          <span class="log-type ${e.type}">${e.type.toUpperCase()}</span>
          <span class="log-message">${e.msg}</span>
        </div>`;
  }).join('');

  return `<div class="sync-log">${html}</div>`;
}


/* ============================================
   addSyncLogEntry(type, message)
   --------------------------------------------
   Appends a new entry to the .sync-log element
   in the DOM.

   - type: 'sync' | 'info' | 'warn' | 'error'
   - Creates .log-entry with .log-time, .log-type
     (colored by type), and message
   - Auto-scrolls to bottom
   - Caps the log at 50 entries (removes oldest)
   ============================================ */
function addSyncLogEntry(type, message) {
  const log = document.querySelector('.sync-log');
  if (!log) return;

  // Build the entry with DOM methods (safe & clean)
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = _formatLogTime(new Date());

  const typeSpan = document.createElement('span');
  typeSpan.className = 'log-type ' + type;
  typeSpan.textContent = type.toUpperCase();

  const msgSpan = document.createElement('span');
  msgSpan.className = 'log-message';
  msgSpan.textContent = message;

  entry.appendChild(timeSpan);
  entry.appendChild(typeSpan);
  entry.appendChild(msgSpan);

  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;  // auto-scroll to bottom

  // Cap at 50 entries — remove oldest
  while (log.children.length > 50) {
    log.removeChild(log.firstChild);
  }
}


/* ============================================
   startSyncSimulation(onComplete)
   --------------------------------------------
   Runs a visual sync simulation:

   1. Shows a toast: "Starting QuickSight sync..."
   2. Progressively activates flow nodes & arrows
      so data appears to flow through the pipeline
   3. Writes 9 log entries with ~400-550 ms delays
   4. Deactivates the diagram, shows a success
      toast, and calls onComplete()

   Total duration: ~5 seconds.
   Guarded against double-start via a flag.
   Callable multiple times — resets state each run.
   ============================================ */
function startSyncSimulation(onComplete) {
  // ---- Guard: prevent double-start ----
  if (_syncSimulationRunning) return;
  _syncSimulationRunning = true;

  // ---- Clear any leftover timers from a previous run ----
  _syncSimulationTimers.forEach(clearTimeout);
  _syncSimulationTimers = [];

  // ---- Reset the flow diagram to idle ----
  _deactivateAllFlow();

  // ---- Compute counts from the data model ----
  const { mgrCount, metricCount, cellCount } = _getSyncCounts();

  // ---- Step 1: Toast ----
  _showSyncToast('Starting QuickSight sync...', null);

  // ---- Steps 2 + 3: Progressively activate nodes/arrows & write log ----
  // Each step fires `delay` ms after the previous one.
  // `activate` lists flow targets to light up at that step,
  // creating a cascading "data flowing through the pipeline" effect.
  const steps = [
    { delay: 300, type: 'sync', msg: 'Initiating QuickSight sync...',                     activate: ['source']  },
    { delay: 500, type: 'info', msg: 'Connecting to QuickSight dashboard...',              activate: ['arrow-1'] },
    { delay: 500, type: 'info', msg: `Querying ${metricCount} KPI metrics for ${mgrCount} managers...`, activate: [] },
    { delay: 550, type: 'sync', msg: `Data received — ${cellCount} data points`,           activate: ['engine']  },
    { delay: 500, type: 'info', msg: 'Validating data ranges...',                          activate: [] },
    { delay: 500, type: 'sync', msg: 'All values within expected ranges',                  activate: ['arrow-2'] },
    { delay: 500, type: 'info', msg: 'Transforming data for wiki format...',               activate: [] },
    { delay: 500, type: 'sync', msg: 'Pushing to wiki spreadsheet...',                     activate: ['wiki']    },
    { delay: 600, type: 'sync', msg: `✅ Sync complete — ${mgrCount}/${mgrCount} managers, ${cellCount} cells updated`, activate: [] }
  ];

  let cumulative = 0;
  steps.forEach(function (step) {
    cumulative += step.delay;
    const t = setTimeout(function () {
      // Activate flow targets for this step
      step.activate.forEach(_activateFlowTarget);
      // Write the log entry
      addSyncLogEntry(step.type, step.msg);
    }, cumulative);
    _syncSimulationTimers.push(t);
  });

  // ---- Step 4: Deactivate, success toast, callback ----
  const finishDelay = cumulative + 700;  // ~5.2 s total
  const finishTimer = setTimeout(function () {
    _deactivateAllFlow();
    _showSyncToast('Sync complete! All data auto-populated.', 'success');
    _syncSimulationRunning = false;
    _syncSimulationTimers = [];
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, finishDelay);
  _syncSimulationTimers.push(finishTimer);
}
