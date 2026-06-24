/* ============================================
   Vickytoria EOD Reporting — Output View
   Live dashboard showing submitted/synced EOD data.
   Two approaches: "manual" (Victoria's) and "automated" (QuickSight).
   ============================================ */

/* ---------- Metric classification & config ---------- */

// "Good" metrics: higher is better
var GOOD_METRICS = ['fcr', 'csat', 'service_level', 'occupancy', 'adherence'];
// "Bad" metrics: lower is better
var BAD_METRICS  = ['aht', 'abandon_rate', 'asa', 'acw'];
// contact_count is neutral

// Compact column labels for the wide data table
var METRIC_SHORT = {
  aht:           'AHT',
  contact_count: 'Contacts',
  fcr:           'FCR',
  csat:          'CSAT',
  abandon_rate:  'Abandon',
  asa:           'ASA',
  service_level: 'Svc Level',
  occupancy:     'Occupancy',
  acw:           'ACW',
  adherence:     'Adherence'
};

// Curated key-metric sets for summary / comparison / trend sections
var KEY_METRICS_SUMMARY = ['aht', 'fcr', 'csat', 'abandon_rate', 'service_level', 'occupancy'];
var KEY_METRICS_TEAM    = ['fcr', 'csat', 'service_level', 'abandon_rate', 'aht'];
var KEY_METRICS_TREND   = ['csat', 'aht', 'service_level'];

// Holds the most recent QuickSight sync timestamp (automated approach)
var outputSyncTime = '';

/* ---------- Aggregation helpers (approach-aware) ---------- */

// Overall average across managers. Manual = submitted only; Automated = all.
function getOutputOverallAggregate(approach) {
  var data = (approach === 'automated')
    ? AppState.eodData
    : AppState.eodData.filter(function (d) { return d.status === 'submitted'; });
  if (!data.length) return null;
  var agg = {};
  METRICS.forEach(function (m) {
    var vals = data.map(function (d) { return d.values[m.id]; }).filter(function (v) { return v != null; });
    if (vals.length) agg[m.id] = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  });
  return agg;
}

// Team average. Manual = submitted only; Automated = all team members.
function getOutputTeamAggregate(teamName, approach) {
  var data = AppState.eodData.filter(function (d) {
    return d.team === teamName && (approach === 'automated' || d.status === 'submitted');
  });
  if (!data.length) return null;
  var agg = {};
  METRICS.forEach(function (m) {
    var vals = data.map(function (d) { return d.values[m.id]; }).filter(function (v) { return v != null; });
    if (vals.length) agg[m.id] = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  });
  return agg;
}

// Submitted/total coverage for a team
function getTeamCoverage(team, approach) {
  var teamManagers = AppState.eodData.filter(function (d) { return d.team === team; });
  var submitted = (approach === 'automated')
    ? teamManagers.length
    : teamManagers.filter(function (d) { return d.status === 'submitted'; }).length;
  return { submitted: submitted, total: teamManagers.length };
}

/* ---------- Formatting & color helpers ---------- */

function getMetricDisplay(metricId, value) {
  var m = METRICS.find(function (x) { return x.id === metricId; });
  if (!m) return { value: '—', unit: '' };
  if (value == null || isNaN(value)) return { value: '—', unit: m.unit || '' };
  var v;
  if (m.unit === '%' || m.unit === 'score') v = value.toFixed(1);
  else v = Math.round(value).toString();
  return { value: v, unit: m.unit || '' };
}

// Color-code a value against the aggregate average.
// Good metrics: green if >= avg, red if < avg.
// Bad metrics:  green if <= avg, red if > avg.
// Neutral (contact_count): gray.
function getMetricColor(metricId, value, avg) {
  if (value == null || avg == null || isNaN(value) || isNaN(avg)) return 'var(--gray-500)';
  if (GOOD_METRICS.indexOf(metricId) !== -1) {
    return value >= avg ? 'var(--success)' : 'var(--danger)';
  }
  if (BAD_METRICS.indexOf(metricId) !== -1) {
    return value <= avg ? 'var(--success)' : 'var(--danger)';
  }
  return 'var(--gray-700)';
}

// Compare today's aggregate to yesterday's historical value.
function computeKPITrend(metricId, approach) {
  var overall = getOutputOverallAggregate(approach);
  if (!overall || overall[metricId] == null) return { dir: 'neutral', arrow: '→', label: 'No data' };
  var today = overall[metricId];
  var yesterdayData = AppState.historicalData[5]; // index 5 = yesterday
  var yesterday = yesterdayData ? yesterdayData.values[metricId] : null;
  if (yesterday == null || isNaN(yesterday)) return { dir: 'neutral', arrow: '→', label: '—' };

  var diff = today - yesterday;
  if (Math.abs(diff) < 0.01) return { dir: 'neutral', arrow: '→', label: 'No change' };

  var pct = yesterday !== 0 ? Math.abs((diff / yesterday) * 100) : 0;
  var isGood = GOOD_METRICS.indexOf(metricId) !== -1;
  var isBad  = BAD_METRICS.indexOf(metricId) !== -1;
  var arrow  = diff > 0 ? '↑' : '↓';
  var improved;
  if (isGood) improved = diff > 0;
  else if (isBad) improved = diff < 0;
  else improved = diff > 0; // neutral metric: up = positive

  var dir = improved ? 'up' : 'down';
  var label = (improved ? '+' : '−') + pct.toFixed(1) + '% vs yesterday';
  return { dir: dir, arrow: arrow, label: label };
}

/* ---------- Section renderers ---------- */

function renderOutputHeader(approach) {
  var todayLong = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  var isAuto = approach === 'automated';
  var submittedCount = isAuto
    ? MANAGERS.length
    : AppState.eodData.filter(function (d) { return d.status === 'submitted'; }).length;
  var coverageClass = isAuto ? 'badge-success' : 'badge-warning';
  var coverageLabel = isAuto ? '100% Coverage' : submittedCount + '/' + MANAGERS.length + ' Submitted';

  return '' +
    '<div class="flex items-center justify-between mb-4">' +
      '<div>' +
        '<h2 style="font-size: 22px; font-weight: 800; color: var(--gray-900);">Live EOD Output — ' + todayLong + '</h2>' +
        '<p class="text-sm text-gray">' + (isAuto ? 'Real-time dashboard synced from QuickSight' : 'Dashboard of submitted end-of-day metrics') + '</p>' +
      '</div>' +
      '<div class="flex items-center gap-2">' +
        '<span class="badge ' + coverageClass + '">' + coverageLabel + '</span>' +
        '<span class="badge badge-info">' + METRICS.length + ' KPIs</span>' +
        '<span class="badge badge-gray">' + TEAMS.length + ' Teams</span>' +
      '</div>' +
    '</div>';
}

function renderFreshnessAlert() {
  var submittedCount = AppState.eodData.filter(function (d) { return d.status === 'submitted'; }).length;
  var pendingCount = AppState.eodData.filter(function (d) { return d.status === 'pending'; }).length;
  var pct = Math.round((submittedCount / MANAGERS.length) * 100);
  return '' +
    '<div class="alert alert-warning">' +
      '<div style="flex: 1;">' +
        '<div>⚠️ Data last updated at 5:15 PM. ' + submittedCount + ' of ' + MANAGERS.length + ' managers submitted. ' + pendingCount + ' pending — data incomplete.</div>' +
        '<div class="progress-bar mt-2"><div class="progress-bar-fill" style="width: ' + pct + '%; background: var(--warning);"></div></div>' +
      '</div>' +
      '<button class="btn btn-sm btn-secondary" id="output-nudge-btn" style="flex-shrink: 0;">📧 Nudge Pending</button>' +
    '</div>';
}

function renderIntegrationPanel() {
  outputSyncTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return '' +
    '<div class="integration-panel">' +
      '<div class="flex items-center justify-between">' +
        '<div>' +
          '<div class="integration-status">' +
            '<span class="pulse"></span>' +
            '<strong>Real-time Data</strong>' +
            '<span class="badge badge-success">100% Coverage</span>' +
            '<span class="badge badge-info">⚡ QuickSight</span>' +
          '</div>' +
          '<div class="text-sm text-gray">Last sync: <span id="output-sync-time">' + outputSyncTime + '</span> · Auto-refreshed every 15 minutes from QuickSight · All ' + MANAGERS.length + ' managers synced</div>' +
          '<div class="progress-bar mt-2"><div class="progress-bar-fill" style="width: 100%; background: var(--success);"></div></div>' +
        '</div>' +
        '<button class="btn btn-sm btn-success" id="output-refresh-btn">🔄 Refresh Now</button>' +
      '</div>' +
    '</div>';
}

function renderKPISummary(approach) {
  var overall = getOutputOverallAggregate(approach);
  var isAuto = approach === 'automated';

  var cards = KEY_METRICS_SUMMARY.map(function (metricId) {
    var m = METRICS.find(function (x) { return x.id === metricId; });
    var val = overall ? overall[metricId] : null;
    var disp = getMetricDisplay(metricId, val);
    var trend = computeKPITrend(metricId, approach);
    var realtimeBadge = isAuto
      ? '<span class="badge badge-success" style="margin-bottom: 8px;">⚡ Real-time</span>'
      : '';

    return '' +
      '<div class="stat-card">' +
        realtimeBadge +
        '<div class="stat-label">' + m.icon + ' ' + m.name + '</div>' +
        '<div>' +
          '<span class="stat-value">' + disp.value + '</span><span class="stat-unit">' + disp.unit + '</span>' +
        '</div>' +
        '<div class="stat-trend ' + trend.dir + '">' + trend.arrow + ' ' + trend.label + '</div>' +
      '</div>';
  }).join('');

  return '<div class="stats-grid">' + cards + '</div>';
}

function renderFilterBar() {
  var managerOptions = MANAGERS.map(function (m) {
    return '<option value="' + m.id + '">' + m.name + ' (' + m.team + ')</option>';
  }).join('');
  return '' +
    '<div class="filter-bar">' +
      '<span class="text-sm font-semibold">Filter:</span>' +
      '<select class="form-select" id="output-team-filter" onchange="filterOutputTable()">' +
        '<option value="all">All Teams</option>' +
        '<option value="Alpha">Alpha</option>' +
        '<option value="Bravo">Bravo</option>' +
        '<option value="Charlie">Charlie</option>' +
      '</select>' +
      '<select class="form-select" id="output-manager-filter" onchange="filterOutputTable()">' +
        '<option value="all">All Managers</option>' +
        managerOptions +
      '</select>' +
    '</div>';
}

// Build <tbody> rows for the main table, honoring team/manager filters.
function buildOutputTableRows(approach, teamFilter, managerFilter) {
  var overall = getOutputOverallAggregate(approach);
  var isAuto = approach === 'automated';

  var rows = AppState.eodData
    .filter(function (r) {
      if (teamFilter !== 'all' && r.team !== teamFilter) return false;
      if (managerFilter !== 'all' && r.managerId !== parseInt(managerFilter, 10)) return false;
      return true;
    })
    .map(function (r) {
      var isPending = r.status === 'pending';
      var showData = isAuto || !isPending;
      var rowStyle = (!isAuto && isPending) ? ' style="opacity: 0.5; background: var(--gray-50);"' : '';

      var cells = '<td>';
      if (!isAuto && isPending) {
        cells += '<span style="color: var(--gray-500);">' + r.managerName + '</span> <span class="badge badge-warning">Pending</span>';
      } else {
        cells += '<strong>' + r.managerName + '</strong>';
        if (isAuto) cells += ' <span class="badge badge-success" style="font-size: 10px;">✓</span>';
      }
      cells += '</td>';
      cells += '<td>' + r.team + '</td>';

      METRICS.forEach(function (m) {
        if (!showData || r.values[m.id] == null) {
          cells += '<td style="color: var(--gray-400);">—</td>';
        } else {
          var val = r.values[m.id];
          var color = getMetricColor(m.id, val, overall ? overall[m.id] : null);
          var disp = getMetricDisplay(m.id, val);
          var check = isAuto ? '<span style="color: var(--success); font-size: 11px; margin-right: 2px;">✓</span>' : '';
          cells += '<td style="color: ' + color + '; font-weight: 600;">' + check + disp.value +
            (disp.unit ? '<span class="text-xs" style="color: var(--gray-400); font-weight: 400;"> ' + disp.unit + '</span>' : '') +
            '</td>';
        }
      });

      // Status / Synced column
      if (isAuto) {
        cells += '<td><span class="badge badge-info">✓ Synced</span><div class="text-xs text-gray" style="margin-top: 2px;">' + outputSyncTime + '</div></td>';
      } else if (isPending) {
        cells += '<td><span class="badge badge-warning">Pending</span></td>';
      } else {
        cells += '<td><span class="badge badge-success">Submitted</span><div class="text-xs text-gray" style="margin-top: 2px;">' + (r.submittedAt || '') + '</div></td>';
      }

      return '<tr' + rowStyle + '>' + cells + '</tr>';
    }).join('');

  if (!rows) {
    var colCount = METRICS.length + 3;
    return '<tr><td colspan="' + colCount + '" style="text-align: center; color: var(--gray-400); padding: 32px;">No data matches the selected filters.</td></tr>';
  }
  return rows;
}

function renderMainTable(approach) {
  var isAuto = approach === 'automated';

  var header = '<thead><tr><th>Manager</th><th>Team</th>';
  METRICS.forEach(function (m) {
    header += '<th title="' + m.name + ' — ' + m.description + '">' + m.icon + ' ' + METRIC_SHORT[m.id] + '</th>';
  });
  header += '<th>' + (isAuto ? 'Synced' : 'Status') + '</th></tr></thead>';

  var body = buildOutputTableRows(approach, 'all', 'all');
  var autoNote = isAuto
    ? '<span class="badge badge-success" style="margin-left: 8px;">✓ Auto-verified</span>'
    : '';

  return '' +
    '<div class="card mb-6">' +
      '<div class="card-header">' +
        '<div class="flex items-center gap-2">' +
          '<span class="card-title">Manager Detail — All Metrics</span>' +
          autoNote +
        '</div>' +
        '<button class="btn btn-sm btn-secondary" onclick="exportOutputCSV()">📥 Export CSV</button>' +
      '</div>' +
      '<div class="table-wrapper">' +
        '<table>' + header + '<tbody id="output-table-body">' + body + '</tbody></table>' +
      '</div>' +
    '</div>';
}

function renderTeamComparison(approach) {
  var overall = getOutputOverallAggregate(approach);
  var teamAggs = {};
  TEAMS.forEach(function (t) { teamAggs[t] = getOutputTeamAggregate(t, approach); });

  // Max per key metric across teams (for bar normalization)
  var maxPerMetric = {};
  KEY_METRICS_TEAM.forEach(function (mid) {
    maxPerMetric[mid] = Math.max.apply(null, TEAMS.map(function (t) {
      return (teamAggs[t] && teamAggs[t][mid] != null) ? teamAggs[t][mid] : 0;
    }));
  });

  var cards = TEAMS.map(function (team) {
    var agg = teamAggs[team];
    var cov = getTeamCoverage(team, approach);
    var covBadgeClass = cov.submitted === cov.total ? 'badge-success' : 'badge-warning';

    var metricRows = KEY_METRICS_TEAM.map(function (mid) {
      var m = METRICS.find(function (x) { return x.id === mid; });
      var val = agg ? agg[mid] : null;
      var disp = getMetricDisplay(mid, val);
      var color = getMetricColor(mid, val, overall ? overall[mid] : null);
      return '' +
        '<div class="flex justify-between text-sm" style="padding: 5px 0; border-bottom: 1px solid var(--gray-100);">' +
          '<span class="text-gray">' + m.icon + ' ' + METRIC_SHORT[mid] + '</span>' +
          '<span style="color: ' + color + '; font-weight: 600;">' + disp.value + (disp.unit ? ' ' + disp.unit : '') + '</span>' +
        '</div>';
    }).join('');

    var bars = KEY_METRICS_TEAM.map(function (mid) {
      var val = agg ? agg[mid] : 0;
      var max = maxPerMetric[mid] || 1;
      var pct = Math.max(8, (val / max) * 100);
      var isBest = val >= max && val > 0;
      var disp = getMetricDisplay(mid, val);
      return '<div class="bar" style="height: ' + pct.toFixed(0) + '%; background: ' + (isBest ? 'var(--success)' : 'var(--primary)') + ';" title="' + METRIC_SHORT[mid] + ': ' + disp.value + '"></div>';
    }).join('');

    var barLabels = KEY_METRICS_TEAM.map(function (mid) {
      var m = METRICS.find(function (x) { return x.id === mid; });
      return '<div class="text-xs text-gray" style="flex: 1; text-align: center; min-width: 0;">' + m.icon + '</div>';
    }).join('');

    return '' +
      '<div class="card">' +
        '<div class="card-header">' +
          '<div class="flex items-center gap-2">' +
            '<span class="card-title">Team ' + team + '</span>' +
            '<span class="badge ' + covBadgeClass + '">' + cov.submitted + '/' + cov.total + ' managers</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          metricRows +
          '<div class="mt-4">' +
            '<div class="text-xs text-gray mb-2">Relative Performance vs Other Teams</div>' +
            '<div class="mini-bars" style="height: 60px;">' + bars + '</div>' +
            '<div class="flex" style="gap: 4px; margin-top: 4px;">' + barLabels + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }).join('');

  return '' +
    '<div class="mb-6">' +
      '<h3 style="font-size: 17px; font-weight: 700; color: var(--gray-900); margin-bottom: 16px;">🏆 Team Comparison</h3>' +
      '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">' + cards + '</div>' +
    '</div>';
}

// Build a single 7-day CSS bar chart for one metric
function buildTrendChart(metricId) {
  var m = METRICS.find(function (x) { return x.id === metricId; });
  var data = AppState.historicalData;
  var vals = data.map(function (d) { return d.values[metricId]; });
  var min = Math.min.apply(null, vals);
  var max = Math.max.apply(null, vals);
  var range = (max - min) || 1;
  var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  var isGood = GOOD_METRICS.indexOf(metricId) !== -1;
  var isBad  = BAD_METRICS.indexOf(metricId) !== -1;

  var bars = data.map(function (d, i) {
    var v = d.values[metricId];
    var pct;
    if (isBad) {
      pct = 20 + ((max - v) / range) * 75; // invert: lower value = taller (better)
    } else {
      pct = 20 + ((v - min) / range) * 75;
    }
    var better = isBad ? v <= avg : (isGood ? v >= avg : true);
    var color = better ? 'var(--success)' : 'var(--danger)';
    var isToday = i === data.length - 1;
    var disp = getMetricDisplay(metricId, v);
    return '<div class="bar" style="height: ' + pct.toFixed(0) + '%; background: ' + color + '; opacity: ' + (isToday ? 1 : 0.7) + ';" title="' + d.date + ': ' + disp.value + (disp.unit ? ' ' + disp.unit : '') + '"></div>';
  }).join('');

  var labels = data.map(function (d, i) {
    var isToday = i === data.length - 1;
    return '<div class="text-xs ' + (isToday ? 'font-bold' : 'text-gray') + '" style="flex: 1; text-align: center; min-width: 0;">' + d.date.split(',')[0] + '</div>';
  }).join('');

  var latestVal = vals[vals.length - 1];
  var latestDisp = getMetricDisplay(metricId, latestVal);
  var periodDisp = getMetricDisplay(metricId, avg);

  return '' +
    '<div class="card">' +
      '<div class="card-body">' +
        '<div class="flex items-center justify-between mb-2">' +
          '<span class="font-semibold text-sm">' + m.icon + ' ' + m.name + '</span>' +
          '<span class="badge ' + (isBad ? 'badge-info' : 'badge-primary') + '">' + (m.unit || 'count') + '</span>' +
        '</div>' +
        '<div class="flex items-baseline gap-2 mb-4">' +
          '<span class="stat-value" style="font-size: 22px;">' + latestDisp.value + '</span>' +
          '<span class="stat-unit">' + latestDisp.unit + '</span>' +
          '<span class="text-xs text-gray" style="margin-left: 6px;">7-day avg: ' + periodDisp.value + (periodDisp.unit ? ' ' + periodDisp.unit : '') + '</span>' +
        '</div>' +
        '<div class="mini-bars" style="height: 100px;">' + bars + '</div>' +
        '<div class="flex" style="gap: 4px; margin-top: 6px;">' + labels + '</div>' +
      '</div>' +
    '</div>';
}

function renderTrendSection(approach) {
  var charts = KEY_METRICS_TREND.map(function (mid) { return buildTrendChart(mid); }).join('');
  var note = (approach === 'automated')
    ? '<div class="text-sm text-gray mt-2">✅ Continuous data — no gaps</div>'
    : '<div class="text-sm text-gray mt-2">⚠️ Trend reflects submitted data only; pending managers create gaps.</div>';

  return '' +
    '<div class="mb-6">' +
      '<h3 style="font-size: 17px; font-weight: 700; color: var(--gray-900); margin-bottom: 16px;">📈 7-Day Trend</h3>' +
      '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">' + charts + '</div>' +
      note +
    '</div>';
}

function renderBottomNote(approach) {
  if (approach === 'automated') {
    return '<div class="alert alert-success">✅ Automated approach — 100% data coverage, real-time freshness, zero gaps. Compare: Manual approach had 2 missing managers and stale data.</div>';
  }
  return '<div class="alert alert-warning">⚠️ Manual approach — data is only as fresh as the last submission. Pending managers create gaps.</div>';
}

/* ---------- Main render entry points ---------- */

function renderOutputManual() {
  return '' +
    renderOutputHeader('manual') +
    renderFreshnessAlert() +
    renderKPISummary('manual') +
    renderFilterBar() +
    renderMainTable('manual') +
    renderTeamComparison('manual') +
    renderTrendSection('manual') +
    renderBottomNote('manual');
}

function renderOutputAutomated() {
  return '' +
    renderOutputHeader('automated') +
    renderIntegrationPanel() +
    renderKPISummary('automated') +
    renderFilterBar() +
    renderMainTable('automated') +
    renderTeamComparison('automated') +
    renderTrendSection('automated') +
    renderBottomNote('automated');
}

// Public entry — returns an HTML string for injection into #view-content
function renderOutputView(approach) {
  if (approach === 'automated') return renderOutputAutomated();
  return renderOutputManual();
}

// Called after HTML injection; attach event listeners here
function afterOutputViewRender(approach) {
  // Automated: wire the "Refresh Now" button to simulate a QuickSight re-sync
  var refreshBtn = document.getElementById('output-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      var now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      outputSyncTime = now;
      var syncEl = document.getElementById('output-sync-time');
      if (syncEl) syncEl.textContent = now;
      var tbody = document.getElementById('output-table-body');
      if (tbody) {
        tbody.style.transition = 'opacity 0.3s ease';
        tbody.style.opacity = '0.35';
        setTimeout(function () {
          tbody.style.opacity = '1';
          filterOutputTable(); // rebuild rows with fresh sync timestamp
        }, 350);
      }
    });
  }

  // Manual: wire the "Nudge Pending" button
  var nudgeBtn = document.getElementById('output-nudge-btn');
  if (nudgeBtn) {
    nudgeBtn.addEventListener('click', function () {
      var pending = AppState.eodData.filter(function (d) { return d.status === 'pending'; });
      var names = pending.map(function (d) { return '• ' + d.managerName + ' (' + d.team + ')'; }).join('\n');
      alert('📧 Reminder sent to ' + pending.length + ' pending manager' + (pending.length !== 1 ? 's' : '') + ':\n\n' + names);
    });
  }
}

/* ---------- Filter & export actions (called from inline handlers) ---------- */

// Rebuild the table body based on the selected team/manager dropdowns
function filterOutputTable() {
  var teamFilter = document.getElementById('output-team-filter');
  var managerFilter = document.getElementById('output-manager-filter');
  if (!teamFilter || !managerFilter) return;
  var approach = AppState.currentApproach;
  var tbody = document.getElementById('output-table-body');
  if (tbody) {
    tbody.innerHTML = buildOutputTableRows(approach, teamFilter.value, managerFilter.value);
  }
}

// Export the current output data as a CSV download
function exportOutputCSV() {
  var approach = AppState.currentApproach;
  var isAuto = approach === 'automated';
  var headers = ['Manager', 'Team'].concat(METRICS.map(function (m) { return m.name; }));
  headers.push(isAuto ? 'Synced' : 'Status');
  var lines = [headers.join(',')];

  AppState.eodData.forEach(function (r) {
    var showData = isAuto || r.status !== 'pending';
    var row = [
      '"' + r.managerName + '"',
      r.team
    ].concat(METRICS.map(function (m) {
      return (showData && r.values[m.id] != null) ? r.values[m.id] : '';
    }));
    row.push(isAuto ? 'Synced ' + outputSyncTime : (r.status === 'pending' ? 'Pending' : 'Submitted ' + (r.submittedAt || '')));
    lines.push(row.join(','));
  });

  var csv = lines.join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'eod-output-' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
