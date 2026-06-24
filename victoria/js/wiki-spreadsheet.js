/* ============================================
   Vickytoria EOD Reporting — Wiki Spreadsheet
   Embedded Excel-like spreadsheet for the wiki demo.
   Two modes:
     "excel"    — Victoria's current messy shared sheet
     "automated" — QuickSight auto-synced wiki sheet
   All functions are global (plain declarations,
   no modules) so they can be called by wiki-demo.js.
   Depends on globals from js/data.js:
     MANAGERS, METRICS, TEAMS, AppState, getMockValue()
   Depends on classes from css/wiki-styles.css.
   ============================================ */

/* ---------- Current mode tracker ---------- */
var currentSpreadsheetMode = 'excel';

/* ---------- Excel-style column letters ---------- */
// A=Manager Name, B=Team, C..L = the 10 metrics
var SPREADSHEET_COL_LETTERS = [];
for (var _i = 0; _i < 26; _i++) {
  SPREADSHEET_COL_LETTERS.push(String.fromCharCode(65 + _i));
}

function columnLetter(index) {
  return SPREADSHEET_COL_LETTERS[index] || ('?' + index);
}

/* ---------- Compact metric labels (for the header row) ---------- */
var METRIC_LABELS = {
  aht:           'AHT (sec)',
  contact_count: 'Contacts',
  fcr:           'FCR (%)',
  csat:          'CSAT (score)',
  abandon_rate:  'Abandon (%)',
  asa:           'ASA (sec)',
  service_level: 'Svc Level (%)',
  occupancy:     'Occupancy (%)',
  acw:           'ACW (sec)',
  adherence:     'Adherence (%)'
};

function metricLabel(metric) {
  return METRIC_LABELS[metric.id] || metric.name;
}

/* ---------- Excel-mode "mess" definition ----------
   Defines which cells look problematic in Victoria's shared sheet.
   managerIdx maps to the MANAGERS array order (0..5):
     0 Sarah Mitchell   (Alpha)
     1 James Chen       (Alpha)
     2 Maria Rodriguez  (Bravo)
     3 David Thompson   (Bravo)
     4 Lisa Park        (Charlie)
     5 Michael O'Brien  (Charlie)
   AppState.eodData marks idx 3 & 5 as "pending". */

// Two managers haven't submitted -> all of their cells show as empty/pending
var EXCEL_PENDING_MANAGERS = [3, 5];

// One cell with an obviously wrong value (red flag over a manual-entry cell).
// CSAT is a 1–5 score, so 9.8 is clearly invalid — like someone pasted a raw count.
var EXCEL_WRONG_CELL = { managerIdx: 0, metricId: 'csat', value: '9.8' };

// One cell edited after submission (yellow manual-entry tint)
var EXCEL_EDITED_CELL = { managerIdx: 2, metricId: 'abandon_rate' };

/* ---------- Value & formatting helpers ---------- */

function getCellValue(managerIdx, metricId) {
  var row = AppState.eodData && AppState.eodData[managerIdx];
  if (row && row.values && typeof row.values[metricId] === 'number') {
    return row.values[metricId];
  }
  return getMockValue(metricId);
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Resolve the display state for one excel-mode data cell.
   Returns { cls, value, style, title }. */
function excelCellState(managerIdx, metricId) {
  // Pending manager -> every metric cell empty
  if (EXCEL_PENDING_MANAGERS.indexOf(managerIdx) !== -1) {
    return { cls: 'cell empty', value: '', style: '', title: 'Pending — not submitted' };
  }
  // Wrong / invalid value -> manual-entry class + red highlight override
  if (EXCEL_WRONG_CELL.managerIdx === managerIdx && EXCEL_WRONG_CELL.metricId === metricId) {
    return {
      cls: 'cell manual-entry',
      value: EXCEL_WRONG_CELL.value,
      style: 'background:#fecaca;color:#991b1b;font-weight:700;',
      title: '⚠ Suspicious value — CSAT scale is 1–5'
    };
  }
  // Edited after submission -> yellow manual-entry tint
  if (EXCEL_EDITED_CELL.managerIdx === managerIdx && EXCEL_EDITED_CELL.metricId === metricId) {
    return {
      cls: 'cell manual-entry',
      value: formatCell(getCellValue(managerIdx, metricId)),
      style: '',
      title: 'Edited after submission'
    };
  }
  // Normal manually-entered value
  return {
    cls: 'cell',
    value: formatCell(getCellValue(managerIdx, metricId)),
    style: '',
    title: 'Manually entered'
  };
}

/* ---------- Totals (row 8) ---------- */

function computeTotals(isAuto) {
  var totals = {};
  METRICS.forEach(function (m) {
    var vals = [];
    MANAGERS.forEach(function (mgr, idx) {
      // Excel mode averages only submitted managers; automated averages all
      if (isAuto || EXCEL_PENDING_MANAGERS.indexOf(idx) === -1) {
        vals.push(getCellValue(idx, m.id));
      }
    });
    if (vals.length) {
      var sum = vals.reduce(function (a, b) { return a + b; }, 0);
      totals[m.id] = parseFloat((sum / vals.length).toFixed(1));
    }
  });
  return totals;
}

function renderTotalsRow(isAuto) {
  var totals = computeTotals(isAuto);
  var cells = '';
  METRICS.forEach(function (m) {
    var val = totals[m.id];
    if (isAuto) {
      cells += `<td class="cell auto-filled" data-metric="${m.id}" title="Auto-computed">${val != null ? val : '—'}</td>`;
    } else {
      cells += `<td class="cell" data-metric="${m.id}" style="font-weight:700;color:var(--gray-700);">${val != null ? val : '—'}</td>`;
    }
  });
  return `<tr>
      <td class="row-num">8</td>
      <td class="cell label">📊 Daily Avg</td>
      <td class="cell" style="text-align:left;color:var(--gray-400);font-style:italic;">all</td>
      ${cells}
    </tr>`;
}

/* ---------- Toolbar ---------- */

function renderSpreadsheetToolbar(mode, syncState) {
  mode = mode || 'excel';
  syncState = syncState || 'idle';
  var isAuto = mode === 'automated';

  var sheetName, note, noteStyle, indicatorClass, indicatorText;

  if (isAuto) {
    sheetName = '⚡ EOD_Report_Auto-Synced';
    note = '✅ 100% complete';
    noteStyle = 'color:#166534;font-weight:600;';
    if (syncState === 'syncing') {
      indicatorClass = 'sync-indicator syncing';
      indicatorText = 'Syncing from QuickSight…';
    } else if (syncState === 'live') {
      indicatorClass = 'sync-indicator live';
      indicatorText = 'Live · Synced 5:15 PM from QuickSight';
    } else {
      indicatorClass = 'sync-indicator';
      indicatorText = 'Last synced 5:15 PM from QuickSight';
    }
  } else {
    sheetName = '📊 EOD_Report_Shared.xlsx';
    note = "⚠️ 2 managers haven't submitted";
    noteStyle = 'color:#b45309;font-weight:600;';
    indicatorClass = 'sync-indicator';
    indicatorText = 'Last edited manually';
  }

  return `<div class="spreadsheet-toolbar" id="wiki-spreadsheet-toolbar">
      <div class="spreadsheet-toolbar-left">
        <span class="sheet-name">${sheetName}</span>
        <span style="${noteStyle}margin-left:8px;font-size:12px;">${note}</span>
      </div>
      <div class="${indicatorClass}">
        <span class="dot"></span>
        <span>${indicatorText}</span>
      </div>
    </div>`;
}

/* ---------- Footer ---------- */

function renderSpreadsheetFooter(mode) {
  if (mode === 'automated') {
    return `<div class="spreadsheet-footer">
        <span>Auto-synced from QuickSight · Every 15 minutes · All data verified</span>
        <span style="color:#166534;font-weight:600;">⚡ Live</span>
      </div>`;
  }
  return `<div class="spreadsheet-footer">
      <span>Shared with 6 editors · Last modified: 5:02 PM by Sarah Mitchell</span>
      <span style="color:var(--gray-400);">v17 · unversioned</span>
    </div>`;
}

/* ---------- Main render ---------- */

function renderSpreadsheet(mode) {
  currentSpreadsheetMode = mode || 'excel';
  var isAuto = currentSpreadsheetMode === 'automated';
  var totalCols = 2 + METRICS.length; // Manager + Team + 10 metrics = 12 (A..L)

  // --- Column-letter header row (Excel band) ---
  var colHeaders = '';
  for (var c = 0; c < totalCols; c++) {
    colHeaders += `<td class="col-header">${columnLetter(c)}</td>`;
  }

  // --- Row 1: named metric headers ---
  var nameHeaders = '';
  METRICS.forEach(function (m) {
    nameHeaders += `<td class="name-header">${metricLabel(m)}</td>`;
  });

  // --- Rows 2–7: one per manager ---
  var prevTeam = null;
  var dataRows = '';
  MANAGERS.forEach(function (mgr, idx) {
    var rowNum = idx + 2;
    var sep = (prevTeam !== null && mgr.team !== prevTeam) ? ' team-separator' : '';
    prevTeam = mgr.team;
    var classAttr = sep ? ` class="${sep.trim()}"` : '';

    var badge = isAuto
      ? ` <span class="qs-badge" title="Source: QuickSight" style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:10px;background:#dcfce7;color:#166534;font-size:9px;font-weight:700;vertical-align:middle;">⚡ QuickSight</span>`
      : '';

    var metricCells = '';
    METRICS.forEach(function (m) {
      var state;
      if (isAuto) {
        state = {
          cls: 'cell auto-filled',
          value: formatCell(getCellValue(idx, m.id)),
          style: '',
          title: 'Auto-synced from QuickSight'
        };
      } else {
        state = excelCellState(idx, m.id);
      }
      var styleAttr = state.style ? ` style="${state.style}"` : '';
      var titleAttr = state.title ? ` title="${state.title}"` : '';
      metricCells += `<td class="${state.cls}" data-metric="${m.id}"${styleAttr}${titleAttr}>${state.value}</td>`;
    });

    dataRows += `<tr${classAttr}>
        <td class="row-num">${rowNum}</td>
        <td class="cell label">${escapeHtml(mgr.name)}${badge}</td>
        <td class="cell" style="text-align:left;color:var(--gray-600);">${mgr.team}</td>
        ${metricCells}
      </tr>`;
  });

  return `<div class="spreadsheet-container">
      ${renderSpreadsheetToolbar(currentSpreadsheetMode, isAuto ? 'live' : 'idle')}
      <div class="spreadsheet-grid">
        <table class="spreadsheet-table">
          <tr>
            <td class="row-num"></td>
            ${colHeaders}
          </tr>
          <tr>
            <td class="row-num">1</td>
            <td class="name-header">Manager Name</td>
            <td class="name-header">Team</td>
            ${nameHeaders}
          </tr>
          ${dataRows}
          ${renderTotalsRow(isAuto)}
        </table>
      </div>
      ${renderSpreadsheetFooter(currentSpreadsheetMode)}
    </div>`;
}

/* ---------- Data accessor ----------
   Returns the current spreadsheet data structure
   (managers × metrics matrix) for the most-recently rendered mode. */

function getSpreadsheetData() {
  var mode = currentSpreadsheetMode;
  var isAuto = mode === 'automated';
  var rows = [];

  MANAGERS.forEach(function (mgr, idx) {
    var cells = [];
    METRICS.forEach(function (m, mi) {
      var col = columnLetter(mi + 2); // metrics start at column C
      if (isAuto) {
        cells.push({
          col: col,
          metricId: m.id,
          value: getCellValue(idx, m.id),
          state: 'auto'
        });
      } else {
        var cs = excelCellState(idx, m.id);
        var stateName = 'filled';
        if (cs.cls.indexOf('empty') !== -1) {
          stateName = 'empty';
        } else if (cs.cls.indexOf('manual-entry') !== -1) {
          stateName = cs.style ? 'wrong' : 'manual';
        }
        cells.push({
          col: col,
          metricId: m.id,
          value: cs.value === '' ? null : cs.value,
          state: stateName
        });
      }
    });
    rows.push({
      rowNumber: idx + 2,
      managerId: mgr.id,
      managerName: mgr.name,
      team: mgr.team,
      cells: cells
    });
  });

  var pending = isAuto ? [] : EXCEL_PENDING_MANAGERS.map(function (i) {
    return MANAGERS[i] ? MANAGERS[i].name : null;
  });

  return {
    mode: mode,
    columns: METRICS.map(function (_, i) { return columnLetter(i + 2); }),
    managerColumns: { A: 'Manager Name', B: 'Team' },
    managers: MANAGERS,
    metrics: METRICS,
    rows: rows,
    totals: computeTotals(isAuto),
    pendingManagers: pending
  };
}

/* ---------- Sync animation ----------
   Flashes each metric data cell to .cell.syncing one by one,
   left-to-right then top-to-bottom (document order), creating a
   wave effect. After the final cell flashes, calls `callback`.
   Returns nothing. */

function animateSyncProgress(callback) {
  var cellNodes = Array.prototype.slice.call(
    document.querySelectorAll('.spreadsheet-table td.cell[data-metric]')
  );

  if (!cellNodes.length) {
    if (typeof callback === 'function') callback();
    return;
  }

  var stepDelay = 25;       // ms between successive cells (wave speed)
  var flashDuration = 800;  // matches the @keyframes syncFlash duration

  cellNodes.forEach(function (cell, i) {
    setTimeout(function () {
      // Drop any prior state classes so the flash reads as a fresh fill
      cell.classList.remove('empty', 'manual-entry');
      cell.classList.add('syncing');
    }, i * stepDelay);
  });

  var totalDelay = cellNodes.length * stepDelay + flashDuration;
  setTimeout(function () {
    if (typeof callback === 'function') callback();
  }, totalDelay);
}
