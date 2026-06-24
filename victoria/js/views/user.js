/* ============================================
   Victoria EOD Reporting — User View
   ============================================
   Exposes two globals used by app.js:
     renderUserView(approach)   -> HTML string
     afterUserViewRender(approach) -> attach listeners post-inject
   Also exposes inline-onclick handlers: submitEOD(), approveEOD()
   ============================================ */

/* Realistic sample values used as placeholders in the manual form.
   If a manager submits with a field left blank, these are used as the
   captured value so the demo flow stays smooth. */
var SAMPLE_VALUES = {
  aht: 342,
  contact_count: 248,
  fcr: 78.5,
  csat: 4.6,
  abandon_rate: 4.2,
  asa: 28,
  service_level: 89.3,
  occupancy: 84.7,
  acw: 62,
  adherence: 92.4
};

/* Approval state for the automated (QuickSight) approach.
   Reset to false whenever the manual view renders, so the two
   approaches stay independently demonstrable. */
var _userApproved = false;

/* ---------- helpers ---------- */

function _getCurrentSubmission() {
  if (!AppState || !AppState.eodData) return null;
  return AppState.eodData.find(function (d) {
    return d.managerId === AppState.currentUser.id;
  }) || null;
}

function _formatDateLong() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function _nowTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

/* "X minutes ago" style timestamp for the integration panel */
function _syncedLabel() {
  var minsAgo = 3;
  var t = new Date(Date.now() - minsAgo * 60000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
  return minsAgo + ' min ago (' + t + ')';
}

/* Format a metric value for read-only display, appending its unit */
function _formatMetricValue(m, val) {
  if (val == null || val === '') return '—';
  return val + (m.unit ? ' ' + m.unit : '');
}

/* Update the current user's submission record so Admin/Output views
   stay coherent with what happened in the User view. */
function _updateCurrentSubmission(values, status) {
  var sub = _getCurrentSubmission();
  if (!sub) return;
  if (values) sub.values = values;
  sub.status = status;
  sub.submittedAt = (status === 'submitted') ? _nowTime() : null;
}

/* ============================================
   Public: renderUserView
   ============================================ */
function renderUserView(approach) {
  if (approach === 'manual') {
    // Reset automated approval state so switching back to automated
    // starts from a fresh "needs review" state.
    _userApproved = false;
    return _renderManualUserView();
  }
  if (approach === 'automated') {
    return _renderAutomatedUserView();
  }
  return '';
}

/* ============================================
   MANUAL APPROACH (Victoria's Approach)
   ============================================ */
function _renderManualUserView() {
  var user = AppState.currentUser;
  var locked = !!AppState.isLocked;
  var sub = _getCurrentSubmission();
  var dateStr = _formatDateLong();

  /* --- status banner --- */
  var banner;
  if (locked) {
    banner =
      '<div class="submission-status submitted">' +
        '<span style="font-size:20px;">🔒</span>' +
        '<div>' +
          '<div class="font-semibold">Submitted &amp; Locked</div>' +
          '<div class="text-xs">Your report is live — no further edits allowed.</div>' +
        '</div>' +
      '</div>';
  } else {
    banner =
      '<div class="submission-status pending">' +
        '<span style="font-size:20px;">⏳</span>' +
        '<div>' +
          '<div class="font-semibold">Pending Submission</div>' +
          '<div class="text-xs">Enter your EOD metrics below, then submit to lock.</div>' +
        '</div>' +
      '</div>';
  }

  /* --- post-submit success alert --- */
  var successAlert = locked
    ? '<div class="alert alert-success">' +
        '<span style="font-size:18px;">✅</span>' +
        '<div>' +
          '<strong>Report submitted successfully.</strong> Data is now locked and live.' +
          '<div class="text-xs mt-2">Need to correct something? An admin can unlock your submission from the Admin View.</div>' +
        '</div>' +
      '</div>'
    : '';

  /* --- manual entry warning --- */
  var warnNote = !locked
    ? '<div class="alert alert-warning">' +
        '<span style="font-size:18px;">⚠️</span>' +
        '<div><strong>Manual entry</strong> — please verify all numbers against QuickSight before submitting.</div>' +
      '</div>'
    : '';

  /* --- metric fields --- */
  var fields = METRICS.map(function (m) {
    return _renderManualMetricField(m, locked, sub);
  }).join('');

  /* --- action row --- */
  var action;
  if (locked) {
    action =
      '<div class="flex items-center justify-between mt-4">' +
        '<span class="text-sm text-gray">🔒 Submission locked — edits disabled.</span>' +
        '<button class="btn btn-secondary" onclick="App.navigate(\'output\')">View Live Output →</button>' +
      '</div>';
  } else {
    action =
      '<div class="flex items-center justify-between mt-4">' +
        '<span class="text-sm text-gray">All 10 metrics are required before submitting.</span>' +
        '<button class="btn btn-primary btn-lg" onclick="submitEOD()">📤 Submit EOD Report</button>' +
      '</div>';
  }

  return (
    '<div id="eod-form">' +
      '<div class="card mb-6">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">End of Day Report — ' + dateStr + '</div>' +
            '<div class="text-sm text-gray">' + user.name + ' · Team ' + user.team + ' · ' + user.email + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          banner +
          successAlert +
          warnNote +
          '<div class="form-row">' + fields + '</div>' +
          action +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function _renderManualMetricField(m, locked, sub) {
  var label = (locked ? '🔒 ' : '') + m.icon + ' ' + m.name + (m.unit ? ' · ' + m.unit : '');
  var storedVal = (sub && sub.values && sub.values[m.id] != null) ? sub.values[m.id] : '';
  var valueAttr = locked ? ' value="' + storedVal + '"' : '';
  var disabledAttr = locked ? ' disabled' : '';
  var placeholder = 'e.g. ' + SAMPLE_VALUES[m.id];

  return (
    '<div class="form-group">' +
      '<label class="form-label" for="metric-' + m.id + '">' + label + '</label>' +
      '<input class="form-input" type="number" step="any" id="metric-' + m.id +
        '" name="metric-' + m.id + '" placeholder="' + placeholder + '"' +
        valueAttr + disabledAttr + '>' +
      '<div class="form-hint">' + m.description + '</div>' +
    '</div>'
  );
}

/* ============================================
   AUTOMATED APPROACH (QuickSight Integration)
   ============================================ */
function _renderAutomatedUserView() {
  var user = AppState.currentUser;
  var sub = _getCurrentSubmission();
  var dateStr = _formatDateLong();
  var approved = !!_userApproved;

  /* --- integration panel --- */
  var integrationPanel =
    '<div class="integration-panel">' +
      '<div class="integration-status">' +
        '<span class="pulse"></span>' +
        '<strong>QuickSight Connected</strong>' +
        '<span class="badge badge-success">● Live</span>' +
      '</div>' +
      '<div class="flex gap-4 text-sm" style="flex-wrap:wrap;">' +
        '<span>🔄 Last synced: <strong>' + _syncedLabel() + '</strong></span>' +
        '<span>📡 Data source: QuickSight Dashboard → Auto-pushed</span>' +
      '</div>' +
    '</div>';

  /* --- approval success alert --- */
  var approvalAlert = approved
    ? '<div class="alert alert-success">' +
        '<span style="font-size:18px;">✅</span>' +
        '<div>' +
          '<strong>Data reviewed and approved.</strong> Auto-synced from QuickSight.' +
          '<div class="text-xs mt-2">Approved at ' + _nowTime() + ' — values are locked and feeding the live dashboard.</div>' +
        '</div>' +
      '</div>'
    : '';

  /* --- value-prop comparison note --- */
  var compareNote =
    '<div class="alert alert-success">' +
      '<span style="font-size:18px;">✅</span>' +
      '<div><strong>No manual entry required.</strong> Data pulled directly from QuickSight — zero human error.</div>' +
    '</div>';

  /* --- read-only metric fields --- */
  var fields = METRICS.map(function (m) {
    return _renderAutoMetricField(m, sub);
  }).join('');

  /* --- action row --- */
  var action;
  if (approved) {
    action =
      '<div class="flex items-center justify-between mt-4">' +
        '<span class="text-sm text-gray">✓ Approved &amp; synced — no further action needed.</span>' +
        '<button class="btn btn-secondary" onclick="App.navigate(\'output\')">View Live Output →</button>' +
      '</div>';
  } else {
    action =
      '<div class="flex items-center justify-between mt-4">' +
        '<span class="text-sm text-gray">All values pre-filled and auto-verified from QuickSight.</span>' +
        '<button class="btn btn-success btn-lg" onclick="approveEOD()">✓ Review &amp; Approve</button>' +
      '</div>';
  }

  /* --- absent-manager note --- */
  var absentNote =
    '<div class="alert alert-info">' +
      '<span style="font-size:18px;">🗓️</span>' +
      '<div><strong>Manager absent?</strong> Data auto-syncs regardless — no coverage gaps, no missed reports.</div>' +
    '</div>';

  return (
    '<div id="eod-form-auto">' +
      integrationPanel +
      '<div class="card mb-6">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">End of Day Report — ' + dateStr + '</div>' +
            '<div class="text-sm text-gray">' + user.name + ' · Team ' + user.team + ' · ' + user.email + '</div>' +
          '</div>' +
          (approved
            ? '<span class="badge badge-success">✓ Approved</span>'
            : '<span class="badge badge-info">Awaiting Review</span>') +
        '</div>' +
        '<div class="card-body">' +
          approvalAlert +
          compareNote +
          '<div class="form-row">' + fields + '</div>' +
          action +
          absentNote +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function _renderAutoMetricField(m, sub) {
  var val = (sub && sub.values && sub.values[m.id] != null) ? sub.values[m.id] : SAMPLE_VALUES[m.id];
  var display = _formatMetricValue(m, val);
  var label = m.icon + ' ' + m.name;

  return (
    '<div class="form-group">' +
      '<div class="flex items-center justify-between">' +
        '<label class="form-label">' + label + '</label>' +
        '<span class="badge badge-success">✓ Auto-verified</span>' +
      '</div>' +
      '<input class="form-input" type="text" value="' + display + '" readonly ' +
        'style="background:#f0fdf4;border-color:#bbf7d0;color:#065f46;font-weight:600;">' +
      '<div class="form-hint">' + m.description + '</div>' +
    '</div>'
  );
}

/* ============================================
   Global action handlers (called via inline onclick)
   ============================================ */

/* Manual: capture entered values, lock the submission, re-render */
function submitEOD() {
  var values = {};
  METRICS.forEach(function (m) {
    var el = document.getElementById('metric-' + m.id);
    var raw = el ? el.value.trim() : '';
    var v = raw === '' ? SAMPLE_VALUES[m.id] : parseFloat(raw);
    values[m.id] = isNaN(v) ? SAMPLE_VALUES[m.id] : v;
  });

  AppState.isLocked = true;
  _updateCurrentSubmission(values, 'submitted');
  App.render();
}

/* Automated: mark approved, reflect in submission record, re-render */
function approveEOD() {
  _userApproved = true;
  var sub = _getCurrentSubmission();
  if (sub) {
    // Values are already auto-filled; just mark as submitted/approved
    _updateCurrentSubmission(null, 'submitted');
  }
  App.render();
}

/* ============================================
   Public: afterUserViewRender
   Called after the HTML is injected. Used for non-critical
   UX enhancements (focus, Enter-to-submit). All primary
   interactions use inline onclick handlers.
   ============================================ */
function afterUserViewRender(approach) {
  if (approach === 'manual' && !AppState.isLocked) {
    var form = document.getElementById('eod-form');
    if (form) {
      form.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitEOD();
        }
      });
    }
    var firstInput = document.querySelector('#eod-form .form-input');
    if (firstInput) firstInput.focus();
  }
}
