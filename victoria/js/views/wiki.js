/* ============================================
   Victoria EOD Reporting — Wiki Spreadsheet View
   ============================================
   Exposes two globals used by app.js:
     renderWikiView(approach)   -> HTML string
     afterWikiViewRender(approach) -> post-inject setup
   ============================================ */

var _wikiSyncRunning = false;
var _wikiSynced = false;

function renderWikiView(approach) {
  var today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  var now = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  });

  if (approach === 'manual') {
    return _renderWikiManual(today, now);
  }
  return _renderWikiAutomated(today, now);
}

/* ============================================
   MANUAL APPROACH
   ============================================ */
function _renderWikiManual(today, now) {
  var submitted = AppState.eodData.filter(function(d) { return d.status === 'submitted'; });
  var pending = AppState.eodData.filter(function(d) { return d.status === 'pending'; });
  var completionPct = Math.round((submitted.length / AppState.eodData.length) * 100);

  var html = '';

  // Stats row
  html += '<div class="stats-grid">';
  html += _statCard('Managers', AppState.eodData.length, '', 'neutral');
  html += _statCard('Submitted', submitted.length, '', 'up');
  html += _statCard('Pending', pending.length, '', 'down');
  html += _statCard('Completion', completionPct + '%', '', completionPct >= 80 ? 'up' : 'down');
  html += '</div>';

  // Warning alert
  html += '<div class="alert alert-warning" style="margin-bottom: 20px;">';
  html += '<strong>Manual entry mode.</strong> Data below was entered by hand. ' + pending.length + ' of ' + AppState.eodData.length + ' managers haven\'t submitted — data is incomplete.';
  html += '</div>';

  // Spreadsheet card
  html += '<div class="card">';
  html += '<div class="card-header">';
  html += '<div class="card-title">EOD Report — Shared Spreadsheet</div>';
  html += '<span class="badge badge-gray">Last edited manually</span>';
  html += '</div>';
  html += '<div class="card-body" style="padding: 0;">';
  html += _renderSpreadsheetTable('manual');
  html += '</div>';
  html += '</div>';

  // Problems card
  html += '<div class="card mt-6" style="margin-top: 20px;">';
  html += '<div class="card-header"><div class="card-title">Issues with Manual Entry</div></div>';
  html += '<div class="card-body">';
  html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">';
  html += _problemItem('Missing data', pending.length + ' managers haven\'t submitted EOD numbers', 'danger');
  html += _problemItem('Human error', 'Values typed by hand — no validation against source data', 'warning');
  html += _problemItem('No coverage', 'If a manager is absent, their row stays empty', 'warning');
  html += _problemItem('No audit trail', 'Multiple editors can change any cell — no record of who changed what', 'danger');
  html += '</div>';
  html += '</div>';
  html += '</div>';

  return html;
}

/* ============================================
   AUTOMATED APPROACH
   ============================================ */
function _renderWikiAutomated(today, now) {
  var html = '';

  // Integration panel
  html += '<div class="integration-panel" style="margin-bottom: 20px;">';
  html += '<div class="integration-status">';
  html += '<span class="pulse"></span>';
  html += '<strong>QuickSight Connected</strong>';
  html += '<span class="text-sm" style="color: var(--gray-500); margin-left: 8px;">Last synced: ' + now + '</span>';
  html += '</div>';
  html += '<div class="text-sm" style="color: var(--gray-600); margin-top: 8px;">';
  html += 'Data source: QuickSight Dashboard &rarr; Auto-pushed every 15 minutes';
  html += '</div>';
  html += '</div>';

  // Stats row
  html += '<div class="stats-grid">';
  html += _statCard('Managers', AppState.eodData.length, '', 'neutral');
  html += _statCard('Auto-Synced', AppState.eodData.length, '', 'up');
  html += _statCard('Data Points', AppState.eodData.length * METRICS.length, '', 'up');
  html += _statCard('Coverage', '100%', '', 'up');
  html += '</div>';

  // Success alert
  html += '<div class="alert alert-success" style="margin-bottom: 20px;">';
  html += '<strong>Automated mode.</strong> All data below was auto-populated from QuickSight. Zero manual entry. ';
  html += _wikiSynced ? 'Last sync completed successfully.' : 'Click "Run Sync" below to see the automation in action.';
  html += '</div>';

  // Spreadsheet card
  html += '<div class="card">';
  html += '<div class="card-header">';
  html += '<div class="card-title">EOD Report — Auto-Synced Spreadsheet</div>';
  html += '<div class="flex items-center gap-2">';
  html += '<span class="badge badge-success">Live</span>';
  html += '<span class="text-sm text-gray">Synced ' + now + '</span>';
  html += '</div>';
  html += '</div>';
  html += '<div class="card-body" style="padding: 0;">';
  html += _renderSpreadsheetTable('automated');
  html += '</div>';
  html += '</div>';

  // Sync button + comparison
  html += '<div class="card" style="margin-top: 20px;">';
  html += '<div class="card-header"><div class="card-title">Automation Demo</div></div>';
  html += '<div class="card-body">';

  if (!_wikiSynced) {
    html += '<p class="text-sm text-gray" style="margin-bottom: 16px;">';
    html += 'Click below to simulate a QuickSight sync. Watch the spreadsheet populate automatically — no manual entry needed.';
    html += '</p>';
    html += '<button class="btn btn-primary btn-lg" onclick="runWikiSync()" id="wiki-sync-btn" style="width: 100%;">';
    html += 'Run QuickSight Sync';
    html += '</button>';
  } else {
    html += '<div class="alert alert-success" style="margin-bottom: 0;">';
    html += '<strong>Sync complete.</strong> All ' + (AppState.eodData.length * METRICS.length) + ' data points were auto-populated from QuickSight. ';
    html += 'No human touched this data. Compare this to the manual approach where 2 managers were missing and values had typos.';
    html += '</div>';
    html += '<div class="flex gap-3" style="margin-top: 16px;">';
    html += '<button class="btn btn-secondary" onclick="runWikiSync()">Run Sync Again</button>';
    html += '<button class="btn btn-secondary" onclick="App.switchApproach(\'manual\')">View Manual Approach</button>';
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/* ============================================
   Spreadsheet Table (shared, both approaches)
   ============================================ */
function _renderSpreadsheetTable(mode) {
  var html = '';
  html += '<div class="table-wrapper" style="border: none; border-radius: 0;">';
  html += '<table>';
  html += '<thead><tr>';
  html += '<th style="text-align: left; min-width: 140px;">Manager</th>';
  html += '<th>Team</th>';

  // Show 6 key metrics (not all 10 — keep it readable)
  var displayMetrics = METRICS.slice(0, 6);
  displayMetrics.forEach(function(m) {
    html += '<th>' + m.icon + ' ' + m.name + '</th>';
  });
  html += '<th>Status</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  AppState.eodData.forEach(function(row, idx) {
    var isPending = row.status === 'pending';
    var teamBorder = idx > 0 && AppState.eodData[idx - 1].team !== row.team;

    html += '<tr' + (teamBorder ? ' style="border-top: 2px solid var(--gray-200);"' : '') + '>';
    html += '<td style="font-weight: 600;">' + row.managerName + '</td>';
    html += '<td style="color: var(--gray-500);">' + row.team + '</td>';

    displayMetrics.forEach(function(m, mi) {
      var value = row.values[m.id];

      if (mode === 'manual') {
        if (isPending) {
          html += '<td style="color: var(--gray-300); text-align: center; font-style: italic;">—</td>';
        } else if (idx === 0 && mi === 0) {
          // Sarah Mitchell, AHT — wrong value (typo) to show human error
          html += '<td style="color: var(--danger); font-weight: 700; text-align: right;">9,999</td>';
        } else if (idx === 2 && mi === 4) {
          // Maria Rodriguez, Abandon Rate — edited after submission
          html += '<td style="background: var(--warning-light); color: #92400e; text-align: right;">' + _formatMetric(value, m.unit) + '</td>';
        } else {
          html += '<td style="text-align: right;">' + _formatMetric(value, m.unit) + '</td>';
        }
      } else {
        // Automated mode — all values present, clean green tint
        var cellStyle = 'text-align: right; color: #166534;';
        if (mi === 0) cellStyle += ' background: #f0fdf4;';
        html += '<td style="' + cellStyle + '">' + _formatMetric(value, m.unit) + '</td>';
      }
    });

    // Status column
    if (mode === 'manual') {
      if (isPending) {
        html += '<td><span class="badge badge-warning">Pending</span></td>';
      } else {
        html += '<td><span class="badge badge-success">Submitted</span></td>';
      }
    } else {
      html += '<td><span class="badge badge-success">Synced</span></td>';
    }

    html += '</tr>';
  });

  // Summary row
  html += '<tr style="background: var(--gray-50); border-top: 2px solid var(--gray-300);">';
  html += '<td style="font-weight: 700; color: var(--gray-700);">Daily Average</td>';
  html += '<td style="color: var(--gray-400);">All</td>';

  var agg = getOverallAggregate();
  if (agg) {
    displayMetrics.forEach(function(m, mi) {
      var val = agg[m.id] || '—';
      var style = 'text-align: right; font-weight: 600;';
      if (mode === 'automated') style += ' color: #166534;';
      html += '<td style="' + style + '">' + _formatMetric(val, m.unit) + '</td>';
    });
  } else {
    displayMetrics.forEach(function() {
      html += '<td style="color: var(--gray-300); text-align: center;">—</td>';
    });
  }
  html += '<td></td>';
  html += '</tr>';

  html += '</tbody>';
  html += '</table>';
  html += '</div>';

  return html;
}

/* ============================================
   Sync Animation
   ============================================ */
function runWikiSync() {
  if (_wikiSyncRunning) return;
  _wikiSyncRunning = true;

  var btn = document.getElementById('wiki-sync-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Syncing from QuickSight...';
  }

  // Find all data cells in the table body (not the summary row)
  var rows = document.querySelectorAll('#view-content table tbody tr');
  var cells = [];

  rows.forEach(function(row, ri) {
    if (ri >= AppState.eodData.length) return; // skip summary row
    var tds = row.querySelectorAll('td');
    // Data cells are indices 2-7 (skip name, team, and status column)
    for (var i = 2; i <= 7 && i < tds.length - 1; i++) {
      cells.push(tds[i]);
    }
  });

  // Animate cells one by one — subtle blue flash then green fill
  cells.forEach(function(cell, i) {
    setTimeout(function() {
      cell.style.transition = 'background 0.3s ease';
      cell.style.background = 'var(--info-light)';
    }, i * 30);
    setTimeout(function() {
      cell.style.background = '#f0fdf4';
      cell.style.color = '#166534';
    }, i * 30 + 300);
  });

  // After all cells are done
  var totalTime = cells.length * 30 + 600;
  setTimeout(function() {
    _wikiSyncRunning = false;
    _wikiSynced = true;
    App.render();
  }, totalTime);
}

/* ============================================
   Helpers
   ============================================ */
function _statCard(label, value, unit, trend) {
  var trendIcon = trend === 'up' ? '&uarr;' : trend === 'down' ? '&darr;' : '';
  var trendClass = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'neutral';
  return '<div class="stat-card">' +
    '<div class="stat-label">' + label + '</div>' +
    '<div class="stat-value">' + value + '<span class="stat-unit">' + unit + '</span></div>' +
    (trendIcon ? '<div class="stat-trend ' + trendClass + '">' + trendIcon + '</div>' : '') +
    '</div>';
}

function _problemItem(title, desc, severity) {
  var badgeClass = severity === 'danger' ? 'badge-danger' : 'badge-warning';
  return '<div style="padding: 16px; border: 1px solid var(--gray-200); border-radius: var(--radius-sm);">' +
    '<div class="flex items-center gap-2" style="margin-bottom: 8px;">' +
    '<span class="badge ' + badgeClass + '">' + title + '</span>' +
    '</div>' +
    '<p class="text-sm text-gray" style="margin: 0;">' + desc + '</p>' +
    '</div>';
}

function _formatMetric(value, unit) {
  if (value == null || value === '') return '—';
  var v = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(v)) return value;
  if (unit === '%') return v.toFixed(1) + '%';
  if (unit === 'sec') return Math.round(v) + 's';
  if (unit === 'score') return v.toFixed(1);
  return v.toString();
}

/* ============================================
   After Render
   ============================================ */
function afterWikiViewRender(approach) {
  // Reset sync state when switching to manual
  if (approach === 'manual') {
    _wikiSynced = false;
  }
}
