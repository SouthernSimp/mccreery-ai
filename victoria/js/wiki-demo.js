/* ============================================
   Vickytoria Wiki Demo — Main Logic
   ============================================
   Dependencies (loaded before this file):
     - js/data.js          (MANAGERS, METRICS, AppState, getMockValue)
     - js/wiki-spreadsheet.js   (renderSpreadsheet, renderSpreadsheetToolbar, animateSyncProgress)
     - js/wiki-sync-simulation.js (renderSyncFlowPanel, renderSyncLog, startSyncSimulation, addSyncLogEntry)
   ============================================ */

var WikiDemo = {
  mode: 'automated',     // 'excel' or 'automated'
  isSyncing: false,
  hasSynced: false,

  init: function () {
    this.render();
  },

  render: function () {
    var app = document.getElementById('wiki-app');
    app.innerHTML = this.renderPage();
    this.attachEvents();
  },

  // ============================================
  // Full Wiki Page
  // ============================================
  renderPage: function () {
    var today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    var now = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    });

    return '\
      <div class="wiki-page">\
        ' + this.renderWikiHeader(today, now) + '\
        ' + this.renderViewModeBar() + '\
        ' + this.renderComparisonSection() + '\
        ' + this.renderSyncFlowSection() + '\
        ' + this.renderSpreadsheetSection() + '\
        ' + this.renderPermissionSection() + '\
        ' + this.renderActionBar() + '\
        ' + this.renderSyncLogSection() + '\
        ' + this.renderFooter() + '\
      </div>\
    ';
  },

  // ============================================
  // Wiki Header (Confluence/Notion style)
  // ============================================
  renderWikiHeader: function (today, now) {
    return '\
      <div class="wiki-header">\
        <div class="wiki-breadcrumb">\
          <a href="#">📞 Call Center Ops</a> › \
          <a href="#">📊 Reporting</a> › \
          <span>End of Day Report</span>\
        </div>\
        <h1 class="wiki-title">📊 End of Day Report — ' + today + '</h1>\
        <div class="wiki-meta">\
          <div class="wiki-author">\
            <div class="wiki-author-avatar">VS</div>\
            <span>Victoria S. created this page</span>\
          </div>\
          <span>·</span>\
          <span>Last updated: ' + now + '</span>\
          <span>·</span>\
          <span>👁️ 12 views today</span>\
        </div>\
      </div>\
    ';
  },

  // ============================================
  // View Mode Bar (Excel vs Automated toggle)
  // ============================================
  renderViewModeBar: function () {
    var excelActive = this.mode === 'excel';
    var autoActive = this.mode === 'automated';

    return '\
      <div class="view-mode-bar">\
        <div class="flex items-center gap-3">\
          <span class="text-sm text-gray">📋 View Mode:</span>\
          <div class="view-mode-toggle">\
            <button class="' + (excelActive ? 'active excel' : '') + '" onclick="WikiDemo.switchMode(\'excel\')">\
              📝 Victoria\'s Excel (Manual)\
            </button>\
            <button class="' + (autoActive ? 'active' : '') + '" onclick="WikiDemo.switchMode(\'automated\')">\
              ⚡ Automated (QuickSight)\
            </button>\
          </div>\
        </div>\
        <div class="text-sm text-gray">\
          ' + (this.mode === 'excel'
            ? '⚠️ <strong>2 managers</strong> haven\'t submitted · Data is <strong>incomplete</strong>'
            : '✅ <strong>100% complete</strong> · All data auto-synced from QuickSight') + '\
        </div>\
      </div>\
    ';
  },

  // ============================================
  // Before/After Comparison
  // ============================================
  renderComparisonSection: function () {
    return '\
      <div class="comparison-container">\
        <div class="comparison-panel excel">\
          <div class="comparison-panel-header">\
            📝 BEFORE: Victoria\'s Shared Excel\
          </div>\
          <div class="comparison-panel-body">\
            ' + this.renderMessyExcel() + '\
            <div class="mt-4" style="font-size: 13px;">\
              <div class="text-sm" style="color: var(--danger); margin-bottom: 6px;"><strong>❌ Problems:</strong></div>\
              <ul style="list-style: none; font-size: 12px; color: var(--gray-600); line-height: 1.8;">\
                <li>🔴 2 managers haven\'t submitted (gaps in data)</li>\
                <li>🔴 David entered 9999 for AHT (typo)</li>\
                <li>🔴 Maria edited her numbers after submission</li>\
                <li>🔴 No audit trail — who changed what?</li>\
                <li>🔴 No data validation — errors pass through</li>\
                <li>🔴 No coverage when a manager is out</li>\
              </ul>\
            </div>\
          </div>\
        </div>\
        <div class="comparison-panel automated">\
          <div class="comparison-panel-header">\
            ⚡ AFTER: QuickSight → Wiki (Automated)\
          </div>\
          <div class="comparison-panel-body">\
            ' + this.renderCleanAutomated() + '\
            <div class="mt-4" style="font-size: 13px;">\
              <div class="text-sm" style="color: var(--success); margin-bottom: 6px;"><strong>✅ Solutions:</strong></div>\
              <ul style="list-style: none; font-size: 12px; color: var(--gray-600); line-height: 1.8;">\
                <li>🟢 100% data coverage — all 6 managers synced</li>\
                <li>🟢 Data validated by QuickSight before push</li>\
                <li>🟢 No manual edits — data locked after sync</li>\
                <li>🟢 Full audit trail — every sync logged</li>\
                <li>🟢 Auto-validation catches out-of-range values</li>\
                <li>🟢 Auto-fills even when manager is absent</li>\
              </ul>\
            </div>\
          </div>\
        </div>\
      </div>\
    ';
  },

  // Mini messy Excel preview for comparison
  renderMessyExcel: function () {
    return '\
      <table class="messy-excel">\
        <thead>\
          <tr>\
            <th></th><th>Manager</th><th>AHT</th><th>FCR</th><th>CSAT</th><th>Abandon</th><th>SL</th>\
          </tr>\
        </thead>\
        <tbody>\
          <tr><td>1</td><td>Sarah M.</td><td>342</td><td>78.5</td><td>4.6</td><td>4.2</td><td>89.3</td></tr>\
          <tr><td>2</td><td>James C.</td><td>388</td><td>72.1</td><td>4.2</td><td>5.1</td><td>86.0</td></tr>\
          <tr><td>3</td><td>Maria R.</td><td class="highlight-row">401</td><td class="highlight-row">80.3</td><td class="highlight-row">4.5</td><td class="highlight-row">3.8</td><td class="highlight-row">91.2</td></tr>\
          <tr><td>4</td><td>David T.</td><td class="error-cell">9999</td><td>75.4</td><td>4.0</td><td>7.6</td><td>92.1</td></tr>\
          <tr><td>5</td><td>Lisa P.</td><td>325</td><td>86.0</td><td>4.7</td><td>4.1</td><td>80.1</td></tr>\
          <tr><td>6</td><td>Michael O.</td><td class="missing-cell">—</td><td class="missing-cell">—</td><td class="missing-cell">—</td><td class="missing-cell">—</td><td class="missing-cell">—</td></tr>\
        </tbody>\
      </table>\
    ';
  },

  // Mini clean automated preview for comparison
  renderCleanAutomated: function () {
    return '\
      <table class="messy-excel">\
        <thead>\
          <tr>\
            <th></th><th>Manager</th><th>AHT</th><th>FCR</th><th>CSAT</th><th>Abandon</th><th>SL</th>\
          </tr>\
        </thead>\
        <tbody>\
          <tr><td>1</td><td>Sarah M. ✓</td><td style="color:#166534">342</td><td style="color:#166534">78.5</td><td style="color:#166534">4.6</td><td style="color:#166534">4.2</td><td style="color:#166534">89.3</td></tr>\
          <tr><td>2</td><td>James C. ✓</td><td style="color:#166534">388</td><td style="color:#166534">72.1</td><td style="color:#166534">4.2</td><td style="color:#166534">5.1</td><td style="color:#166534">86.0</td></tr>\
          <tr><td>3</td><td>Maria R. ✓</td><td style="color:#166534">401</td><td style="color:#166534">80.3</td><td style="color:#166534">4.5</td><td style="color:#166534">3.8</td><td style="color:#166534">91.2</td></tr>\
          <tr><td>4</td><td>David T. ✓</td><td style="color:#166534">370</td><td style="color:#166534">75.4</td><td style="color:#166534">4.0</td><td style="color:#166534">7.6</td><td style="color:#166534">92.1</td></tr>\
          <tr><td>5</td><td>Lisa P. ✓</td><td style="color:#166534">325</td><td style="color:#166534">86.0</td><td style="color:#166534">4.7</td><td style="color:#166534">4.1</td><td style="color:#166534">80.1</td></tr>\
          <tr><td>6</td><td>Michael O. ✓</td><td style="color:#166534">384</td><td style="color:#166534">80.0</td><td style="color:#166534">3.8</td><td style="color:#166534">6.8</td><td style="color:#166534">90.0</td></tr>\
        </tbody>\
      </table>\
    ';
  },

  // ============================================
  // Sync Flow Section
  // ============================================
  renderSyncFlowSection: function () {
    if (typeof renderSyncFlowPanel === 'function') {
      return renderSyncFlowPanel();
    }
    return '<div class="alert alert-warning">Sync flow panel not loaded.</div>';
  },

  // ============================================
  // Spreadsheet Section
  // ============================================
  renderSpreadsheetSection: function () {
    var syncState = this.isSyncing ? 'syncing' : (this.mode === 'automated' ? 'live' : 'idle');
    var toolbar = '';
    var spreadsheet = '';

    if (typeof renderSpreadsheetToolbar === 'function') {
      toolbar = renderSpreadsheetToolbar(this.mode, syncState);
    }
    if (typeof renderSpreadsheet === 'function') {
      spreadsheet = renderSpreadsheet(this.mode);
    }

    return '\
      <div class="card mb-6">\
        <div class="card-header">\
          <div class="card-title">\
            ' + (this.mode === 'excel' ? '📝 Shared Excel Sheet (Current)' : '⚡ Wiki Spreadsheet (Automated)') + '\
          </div>\
          <div class="text-sm text-gray">' + (this.mode === 'excel' ? 'Manual entry · 6 editors' : 'Auto-synced · Every 15 min') + '</div>\
        </div>\
        <div class="card-body" style="padding: 0;">\
          <div class="spreadsheet-container" style="border: none; border-radius: 0;">\
            ' + toolbar + '\
            ' + spreadsheet + '\
          </div>\
        </div>\
      </div>\
    ';
  },

  // ============================================
  // Permission Model Section
  // ============================================
  renderPermissionSection: function () {
    return '\
      <div class="card mb-6">\
        <div class="card-header">\
          <div class="card-title">🔒 Permission Model</div>\
          <div class="text-sm text-gray">How access works in the wiki</div>\
        </div>\
        <div class="card-body">\
          <div class="permission-panel">\
            <div class="permission-card">\
              <div class="perm-icon">👤</div>\
              <div class="perm-title">Manager (Input-Only)</div>\
              <div class="perm-desc">Can view their own row and submit EOD numbers. Cannot edit after submission.</div>\
              <span class="perm-badge badge badge-warning">Input Only</span>\
            </div>\
            <div class="permission-card">\
              <div class="perm-icon">🛡️</div>\
              <div class="perm-title">Admin (Full Control)</div>\
              <div class="perm-desc">Can view all rows, unlock submissions, override values, and manage permissions.</div>\
              <span class="perm-badge badge badge-primary">Full Access</span>\
            </div>\
            <div class="permission-card">\
              <div class="perm-icon">📊</div>\
              <div class="perm-title">QuickSight (Auto-Push)</div>\
              <div class="perm-desc">System integration that pushes validated data directly. No human interaction needed.</div>\
              <span class="perm-badge badge badge-success">Automated</span>\
            </div>\
          </div>\
          <div class="alert alert-info" style="margin-bottom: 0;">\
            <strong>Key difference:</strong> In Victoria\'s approach, all 6 managers have edit access to the same sheet. In the automated approach, managers have <strong>view-only</strong> access — QuickSight pushes the data, eliminating the risk of accidental edits.\
          </div>\
        </div>\
      </div>\
    ';
  },

  // ============================================
  // Action Bar
  // ============================================
  renderActionBar: function () {
    if (this.mode === 'excel') {
      return '\
        <div class="action-bar">\
          <button class="btn btn-secondary btn-lg" onclick="WikiDemo.switchMode(\'automated\')">\
            ⚡ See the Automated Solution →\
          </button>\
        </div>\
      ';
    }
    return '\
      <div class="action-bar">\
        <button class="btn btn-primary btn-lg" onclick="WikiDemo.runSync()" ' + (this.isSyncing ? 'disabled' : '') + '>\
          ' + (this.isSyncing ? '⏳ Syncing...' : '🔄 Run QuickSight Sync Now') + '\
        </button>\
        <button class="btn btn-secondary btn-lg" onclick="WikiDemo.switchMode(\'excel\')">\
          ← Back to Excel View\
        </button>\
        <button class="btn btn-success btn-lg" onclick="WikiDemo.showToast(\'Demo complete! All data auto-populated from QuickSight.\', \'success\')">\
          ✅ This is the Solution\
        </button>\
      </div>\
    ';
  },

  // ============================================
  // Sync Log Section
  // ============================================
  renderSyncLogSection: function () {
    if (typeof renderSyncLog === 'function') {
      return '\
        <div class="card mb-6">\
          <div class="card-header">\
            <div class="card-title">📟 Sync Activity Log</div>\
            <div class="text-sm text-gray">Real-time sync events</div>\
          </div>\
          <div class="card-body" style="padding: 0;">\
            ' + renderSyncLog() + '\
          </div>\
        </div>\
      ';
    }
    return '';
  },

  // ============================================
  // Footer
  // ============================================
  renderFooter: function () {
    return '\
      <div style="text-align: center; padding: 24px 0; border-top: 1px solid var(--gray-200); margin-top: 24px;">\
        <p class="text-sm text-gray">\
          <strong>Vickytoria EOD Reporting Demo</strong> — Mockup for pitch presentation<br>\
          All data is sample/mock data · No real QuickSight API connected<br>\
          Built with HTML/CSS/JS · No build step required\
        </p>\
      </div>\
    ';
  },

  // ============================================
  // Actions
  // ============================================
  switchMode: function (mode) {
    this.mode = mode;
    this.hasSynced = false;
    this.render();
  },

  runSync: function () {
    if (this.isSyncing) return;
    if (typeof startSyncSimulation !== 'function') {
      this.showToast('Sync simulation module not loaded.', 'error');
      return;
    }

    this.isSyncing = true;

    // Update button to "Syncing..." without full re-render (preserves log)
    var syncBtn = document.querySelector('.action-bar .btn-primary');
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.innerHTML = '⏳ Syncing...';
    }

    // Start the sync simulation
    var self = this;
    startSyncSimulation(function () {
      self.isSyncing = false;
      self.hasSynced = true;

      // Restore button
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 Run QuickSight Sync Now';
      }

      // Animate the spreadsheet cells if the function exists
      if (typeof animateSyncProgress === 'function') {
        animateSyncProgress(function () {
          self.showToast('All 60 cells auto-populated from QuickSight!', 'success');
        });
      } else {
        self.showToast('Sync complete! All data auto-populated.', 'success');
      }
    });
  },

  showToast: function (message, type) {
    // Remove existing toast
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.innerHTML = '<span>' + message + '</span>';
    document.body.appendChild(toast);

    // Trigger show animation
    setTimeout(function () {
      toast.classList.add('show');
    }, 10);

    // Auto-hide after 4 seconds
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 4000);
  },

  attachEvents: function () {
    // Events handled via inline onclick
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
  WikiDemo.init();
});
