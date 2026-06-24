/* ============================================
   Vickytoria EOD Reporting — Admin View
   Renders the Admin Oversight view for both the
   manual (Victoria's) and automated (QuickSight)
   approaches. All functions are global because
   this file loads before js/app.js and is called
   via inline onclick handlers.
   ============================================ */

// Key metrics surfaced in team / overall overview cards
const ADMIN_KEY_METRICS = ["aht", "contact_count", "fcr", "csat", "service_level"];

/* ============================================
   Data Helpers (global)
   ============================================ */

// Submission counts for the manual approach
function getAdminSubmissionStats() {
  const total = AppState.eodData.length;
  const submitted = AppState.eodData.filter(d => d.status === "submitted").length;
  const pending = total - submitted;
  const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;
  return { total, submitted, pending, rate };
}

// All EOD records for a given team
function getTeamMembers(teamName) {
  return AppState.eodData.filter(d => d.team === teamName);
}

// Per-team metric averages.
// includeAll = true -> count every manager (automated: all synced)
// includeAll = false -> count only submitted managers (manual)
function getTeamMetricsAggregate(teamName, includeAll) {
  const members = getTeamMembers(teamName);
  const source = includeAll ? members : members.filter(d => d.status === "submitted");
  if (source.length === 0) return null;
  const agg = {};
  METRICS.forEach(m => {
    const vals = source.map(d => d.values[m.id]).filter(v => v != null && !isNaN(v));
    if (vals.length > 0) {
      agg[m.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  });
  return agg;
}

// Overall (all-team) metric averages
function getOverallMetricsAggregate(includeAll) {
  const source = includeAll ? AppState.eodData : AppState.eodData.filter(d => d.status === "submitted");
  if (source.length === 0) return null;
  const agg = {};
  METRICS.forEach(m => {
    const vals = source.map(d => d.values[m.id]).filter(v => v != null && !isNaN(v));
    if (vals.length > 0) {
      agg[m.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  });
  return agg;
}

// Submission progress for a team
function getTeamProgress(teamName) {
  const members = getTeamMembers(teamName);
  const submitted = members.filter(d => d.status === "submitted").length;
  return { submitted, total: members.length };
}

// Format a metric value using its unit
function formatMetricValue(value, unit) {
  if (value == null || isNaN(value)) return "—";
  if (unit === "" || unit === "sec") return Math.round(value).toLocaleString();
  return value.toFixed(1);
}

// Build a 7-day mini-bar sparkline for a metric from historicalData
function renderMiniBars(metricId) {
  const m = METRICS.find(x => x.id === metricId);
  if (!m) return "";
  const data = AppState.historicalData || [];
  const vals = data.map(d => d.values[metricId]).filter(v => v != null && !isNaN(v));
  if (vals.length === 0) return "";
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  return data.map(d => {
    const v = d.values[metricId];
    const h = 12 + ((v - min) / range) * 88; // 12%–100% height
    return `<div class="bar" style="height:${h}%;" title="${d.date}: ${formatMetricValue(v, m.unit)}${m.unit}"></div>`;
  }).join("");
}

/* ============================================
   Shared UI Builders (global)
   ============================================ */

function renderStatCard(label, value, unit, trendText, trendClass, extra) {
  const trend = trendText
    ? `<div class="stat-trend ${trendClass || "neutral"}">${trendText}</div>`
    : "";
  const extraHtml = extra ? `<div class="mt-2">${extra}</div>` : "";
  const unitHtml = unit ? `<span class="stat-unit">${unit}</span>` : "";
  return `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}${unitHtml}</div>
      ${trend}
      ${extraHtml}
    </div>
  `;
}

// A metric row used inside overview cards
function renderMetricRow(m, val) {
  const display = formatMetricValue(val, m.unit);
  const unit = m.unit ? ` <span class="text-xs text-gray">${m.unit}</span>` : "";
  return `
    <div class="flex items-center justify-between" style="padding:9px 0;border-bottom:1px solid var(--gray-100);">
      <span class="text-sm text-gray">${m.icon} ${m.name}</span>
      <span class="font-semibold">${display}${unit}</span>
    </div>
  `;
}

// Overview card for a team (or overall when teamName is null)
function renderOverviewCard(teamName, approach) {
  const includeAll = approach === "automated";
  const agg = teamName
    ? getTeamMetricsAggregate(teamName, includeAll)
    : getOverallMetricsAggregate(includeAll);

  const title = teamName ? `Team ${teamName}` : "Overall (All Teams)";
  const icon = teamName ? "👥" : "🌐";

  let progressBadge;
  if (teamName) {
    const p = getTeamProgress(teamName);
    if (includeAll) {
      progressBadge = `<span class="badge badge-success">${p.total}/${p.total} synced</span>`;
    } else if (p.submitted === p.total) {
      progressBadge = `<span class="badge badge-success">${p.submitted}/${p.total} submitted</span>`;
    } else {
      progressBadge = `<span class="badge badge-warning">${p.submitted}/${p.total} submitted</span>`;
    }
  } else {
    const s = getAdminSubmissionStats();
    progressBadge = includeAll
      ? `<span class="badge badge-success">100% synced</span>`
      : `<span class="badge badge-warning">${s.submitted}/${s.total} submitted</span>`;
  }

  const metricsHtml = ADMIN_KEY_METRICS.map(id => {
    const m = METRICS.find(x => x.id === id);
    if (!m) return "";
    const val = agg ? agg[id] : null;
    return renderMetricRow(m, val);
  }).join("");

  return `
    <div class="card">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <div class="card-title">${icon} ${title}</div>
          ${progressBadge}
        </div>
      </div>
      <div class="card-body">
        ${metricsHtml}
        <div class="mt-2">
          <div class="text-xs text-gray mb-2">7-day contact volume</div>
          <div class="mini-bars">${renderMiniBars("contact_count")}</div>
        </div>
      </div>
    </div>
  `;
}

// Filter bar for the submission / sync tables
function renderFilterBar() {
  return `
    <div class="filter-bar flex items-center gap-3 mb-4">
      <span class="text-sm text-gray font-semibold">Filter:</span>
      <select class="form-select" onchange="adminFilterTeam(this.value)">
        <option value="all">All Teams</option>
        <option value="Alpha">Team Alpha</option>
        <option value="Bravo">Team Bravo</option>
        <option value="Charlie">Team Charlie</option>
      </select>
    </div>
  `;
}

/* ============================================
   Toast + Modal (global)
   ============================================ */

function adminToast(message, type) {
  const existing = document.getElementById("admin-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "admin-toast";
  toast.className = `alert alert-${type || "info"}`;
  toast.style.cssText =
    "position:fixed;bottom:24px;right:24px;z-index:10001;max-width:380px;" +
    "box-shadow:var(--shadow-xl);padding:14px 18px;border-radius:var(--radius);" +
    "font-weight:600;font-size:14px;transition:opacity .3s, transform .3s;" +
    "transform:translateY(10px);";
  toast.innerHTML = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = "translateY(0)"; });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function adminShowModal(title, bodyHtml) {
  let modal = document.getElementById("admin-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "admin-modal";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(2px);" +
      "display:none;align-items:center;justify-content:center;z-index:10000;padding:24px;";
    modal.innerHTML = `
      <div style="background:white;border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);max-width:680px;width:100%;max-height:85vh;overflow:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--gray-200);position:sticky;top:0;background:white;z-index:2;border-radius:var(--radius-lg) var(--radius-lg) 0 0;">
          <h3 id="admin-modal-title" style="margin:0;font-size:18px;font-weight:800;color:var(--gray-900);"></h3>
          <button onclick="adminCloseModal()" style="border:none;background:var(--gray-100);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:15px;color:var(--gray-600);line-height:1;">✕</button>
        </div>
        <div id="admin-modal-body" style="padding:24px;"></div>
      </div>
    `;
    // Close when clicking the backdrop
    modal.addEventListener("click", (e) => {
      if (e.target === modal) adminCloseModal();
    });
    document.body.appendChild(modal);
  }
  document.getElementById("admin-modal-title").textContent = title;
  document.getElementById("admin-modal-body").innerHTML = bodyHtml;
  modal.style.display = "flex";
}

function adminCloseModal() {
  const modal = document.getElementById("admin-modal");
  if (modal) modal.style.display = "none";
}

/* ============================================
   Admin Actions (global, inline onclick targets)
   ============================================ */

function adminFilterTeam(team) {
  const rows = document.querySelectorAll("#admin-table tbody tr");
  rows.forEach(r => {
    r.style.display = (team === "all" || r.getAttribute("data-team") === team) ? "" : "none";
  });
}

function adminSendReminder(managerId) {
  const d = AppState.eodData.find(x => x.managerId === managerId);
  adminToast(`📧 Reminder sent to ${d ? d.managerName : "manager"}.`, "info");
}

function adminSendAllReminders() {
  const pending = AppState.eodData.filter(d => d.status === "pending");
  if (pending.length === 0) {
    adminToast("✅ No pending managers — everyone has submitted.", "success");
    return;
  }
  adminToast(`📧 Reminders sent to ${pending.length} pending manager${pending.length !== 1 ? "s" : ""}.`, "info");
}

function adminUnlock(managerId) {
  const d = AppState.eodData.find(x => x.managerId === managerId);
  if (d) {
    d.status = "pending";
    d.submittedAt = null;
  }
  adminToast(`🔓 Unlocked submission for ${d ? d.managerName : "manager"}. They can now re-edit.`, "warning");
  App.render();
}

function adminLockAll() {
  AppState.isLocked = true;
  adminToast("🔒 All submissions locked. No further edits allowed.", "success");
}

function adminExport() {
  adminToast("📊 Exporting to Excel...", "info");
  setTimeout(() => adminToast("✅ Export complete — file downloaded.", "success"), 1500);
}

function adminRunManualSync() {
  adminToast("🔄 Running manual sync from QuickSight...", "info");
  setTimeout(() => adminToast("✅ Manual sync complete. All 6 managers updated.", "success"), 1500);
}

function adminSaveConfig() {
  adminCloseModal();
  adminToast("✅ QuickSight sync configuration saved.", "success");
}

function adminSaveOverride(managerId) {
  adminCloseModal();
  const d = AppState.eodData.find(x => x.managerId === managerId);
  adminToast(`✏️ Override saved for ${d ? d.managerName : "manager"}. Audit log updated.`, "warning");
}

// Manager detail modal (used by both approaches)
function adminShowManagerDetail(managerId) {
  const d = AppState.eodData.find(x => x.managerId === managerId);
  if (!d) return;
  const isSubmitted = d.status === "submitted";
  const statusBadge = isSubmitted
    ? `<span class="badge badge-success">✓ Submitted</span>`
    : `<span class="badge badge-warning">⏳ Pending</span>`;
  const subtitle = isSubmitted && d.submittedAt
    ? `Submitted at ${d.submittedAt}`
    : "Not yet submitted";

  const rows = METRICS.map(m => {
    const val = d.values[m.id];
    const unit = m.unit ? ` <span class="text-xs text-gray">${m.unit}</span>` : "";
    return `
      <tr>
        <td>${m.icon} ${m.name}</td>
        <td style="text-align:right;font-weight:600;color:var(--gray-900);">${formatMetricValue(val, m.unit)}${unit}</td>
      </tr>
    `;
  }).join("");

  const body = `
    <div class="flex items-center justify-between mb-2">
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--gray-900);">${d.managerName}</div>
        <div class="text-sm text-gray">Team ${d.team} • ${d.date}</div>
      </div>
      ${statusBadge}
    </div>
    <div class="text-sm text-gray mb-4">${subtitle}</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th>Metric</th><th style="text-align:right;">Value</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="flex gap-2 mt-4" style="justify-content:flex-end;">
      ${isSubmitted ? `<button class="btn btn-secondary btn-sm" onclick="adminCloseModal();adminUnlock(${d.managerId});">🔓 Unlock for Re-edit</button>` : ""}
      <button class="btn btn-primary btn-sm" onclick="adminCloseModal()">Close</button>
    </div>
  `;
  adminShowModal(`${d.managerName} — EOD Report`, body);
}

// QuickSight configure modal
function adminConfigureQuickSight() {
  const toggle = (label, checked, hint) => `
    <div class="flex items-center justify-between" style="padding:14px 0;border-bottom:1px solid var(--gray-100);">
      <div>
        <div class="font-semibold text-sm">${label}</div>
        ${hint ? `<div class="text-xs text-gray">${hint}</div>` : ""}
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${checked ? "checked" : ""}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
  const body = `
    <div class="integration-panel mb-4">
      <div class="integration-status">
        <span class="pulse"></span>
        <strong>QuickSight Integration: Active</strong>
      </div>
      <div class="text-sm text-gray">Connected to dashboard <strong>Call Center EOD — Production</strong></div>
    </div>
    ${toggle("Auto-sync enabled", true, "Push metrics from QuickSight to the wiki automatically")}
    ${toggle("Push to wiki on sync", true, "Update the EOD wiki page after each sync")}
    ${toggle("Notify admins on failure", true, "Email admin if a sync run fails")}
    ${toggle("Require manager approval", true, "Managers must review & approve synced values")}
    <div class="form-group mt-4">
      <label class="form-label">Sync frequency</label>
      <select class="form-select">
        <option>Every 15 minutes</option>
        <option>Every 30 minutes</option>
        <option>Hourly</option>
        <option>Every 4 hours</option>
      </select>
    </div>
    <div class="flex gap-2 mt-4" style="justify-content:flex-end;">
      <button class="btn btn-secondary" onclick="adminCloseModal()">Cancel</button>
      <button class="btn btn-success" onclick="adminSaveConfig()">Save Configuration</button>
    </div>
  `;
  adminShowModal("Configure QuickSight Sync", body);
}

// Manual override modal (automated approach)
function adminOverride(managerId) {
  const d = AppState.eodData.find(x => x.managerId === managerId);
  if (!d) return;
  const rows = METRICS.map(m => {
    const val = d.values[m.id];
    return `
      <tr>
        <td>${m.icon} ${m.name}${m.unit ? ` <span class="text-xs text-gray">(${m.unit})</span>` : ""}</td>
        <td style="text-align:right;">
          <input class="form-input" type="number" step="0.1" value="${val}" style="width:120px;text-align:right;padding:6px 10px;">
        </td>
      </tr>
    `;
  }).join("");
  const body = `
    <div class="alert alert-warning mb-4">
      ⚠️ Overriding auto-synced values. The original QuickSight values will be retained in the audit trail.
    </div>
    <div class="text-sm text-gray mb-2"><strong>${d.managerName}</strong> — Team ${d.team}</div>
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Metric</th><th style="text-align:right;">Override Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="flex gap-2 mt-4" style="justify-content:flex-end;">
      <button class="btn btn-secondary" onclick="adminCloseModal()">Cancel</button>
      <button class="btn btn-primary" onclick="adminSaveOverride(${d.managerId})">Save Override</button>
    </div>
  `;
  adminShowModal(`Override Values — ${d.managerName}`, body);
}

// Full audit log modal (automated approach)
function adminViewAuditLog() {
  const events = adminAuditEvents();
  const rows = events.map(ev => {
    const badge = ev.status === "success"
      ? `<span class="badge badge-success">Success</span>`
      : `<span class="badge badge-info">Info</span>`;
    return `
      <tr>
        <td class="text-sm">${ev.time}</td>
        <td class="text-sm">${ev.action}</td>
        <td class="text-sm">${ev.manager}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join("");
  const body = `
    <div class="text-sm text-gray mb-4">Complete sync & review history for today.</div>
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Timestamp</th><th>Action</th><th>Manager</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="flex gap-2 mt-4" style="justify-content:flex-end;">
      <button class="btn btn-primary" onclick="adminCloseModal()">Close</button>
    </div>
  `;
  adminShowModal("Audit Log — Today", body);
}

/* ============================================
   Audit Trail Data (automated approach)
   ============================================ */

function adminAuditEvents() {
  return [
    { time: "5:14 PM", action: "Auto-sync from QuickSight", manager: "All Teams",     status: "success" },
    { time: "5:00 PM", action: "Auto-sync from QuickSight", manager: "All Teams",     status: "success" },
    { time: "4:58 PM", action: "Review approved",           manager: "Sarah Mitchell", status: "success" },
    { time: "4:45 PM", action: "Auto-sync from QuickSight", manager: "All Teams",     status: "success" },
    { time: "4:30 PM", action: "Review approved",           manager: "James Chen",    status: "success" },
    { time: "4:15 PM", action: "Manual override",           manager: "Admin",         status: "info"    },
    { time: "4:00 PM", action: "Auto-sync from QuickSight", manager: "All Teams",     status: "success" },
    { time: "3:45 PM", action: "Review approved",           manager: "Maria Rodriguez", status: "success" }
  ];
}

/* ============================================
   Table Row Builders
   ============================================ */

function renderManualSubmissionRows() {
  return AppState.eodData.map(d => {
    const isSubmitted = d.status === "submitted";
    const statusBadge = isSubmitted
      ? `<span class="badge badge-success">✓ Submitted</span>`
      : `<span class="badge badge-warning">⏳ Pending</span>`;
    const timeCell = isSubmitted && d.submittedAt
      ? d.submittedAt
      : `<span class="text-gray">—</span>`;
    const viewBtn = `<button class="btn btn-primary btn-sm" onclick="adminShowManagerDetail(${d.managerId})">👁 View</button>`;
    const unlockBtn = isSubmitted
      ? `<button class="btn btn-secondary btn-sm" onclick="adminUnlock(${d.managerId})">🔓 Unlock</button>`
      : "";
    const reminderBtn = isSubmitted
      ? ""
      : `<button class="btn btn-secondary btn-sm" onclick="adminSendReminder(${d.managerId})">📧 Remind</button>`;
    return `
      <tr data-team="${d.team}">
        <td><strong>${d.managerName}</strong></td>
        <td>${d.team}</td>
        <td>${statusBadge}</td>
        <td>${timeCell}</td>
        <td><div class="flex gap-2">${viewBtn} ${unlockBtn} ${reminderBtn}</div></td>
      </tr>
    `;
  }).join("");
}

function renderAutomatedSyncRows() {
  // In the automated approach every manager is auto-synced.
  // Managers 4 (David) and 6 (Michael) have not yet approved.
  const syncTimes = ["5:14 PM", "5:14 PM", "5:14 PM", "5:00 PM", "5:14 PM", "5:00 PM"];
  return AppState.eodData.map((d, i) => {
    const needsReview = (d.managerId === 4 || d.managerId === 6);
    const reviewBadge = needsReview
      ? `<span class="badge badge-warning">Pending Review</span>`
      : `<span class="badge badge-success">✓ Approved</span>`;
    return `
      <tr data-team="${d.team}">
        <td><strong>${d.managerName}</strong></td>
        <td>${d.team}</td>
        <td><span class="badge badge-success">✓ Synced</span></td>
        <td>${syncTimes[i] || "5:14 PM"}</td>
        <td>${reviewBadge}</td>
        <td><div class="flex gap-2">
          <button class="btn btn-primary btn-sm" onclick="adminShowManagerDetail(${d.managerId})">View Details</button>
          <button class="btn btn-secondary btn-sm" onclick="adminOverride(${d.managerId})">Override</button>
        </div></td>
      </tr>
    `;
  }).join("");
}

function renderAuditTrailTable() {
  const events = adminAuditEvents().slice(0, 6);
  const rows = events.map(ev => {
    const badge = ev.status === "success"
      ? `<span class="badge badge-success">Success</span>`
      : `<span class="badge badge-info">Info</span>`;
    return `
      <tr>
        <td class="text-sm">${ev.time}</td>
        <td class="text-sm">${ev.action}</td>
        <td class="text-sm">${ev.manager}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join("");
  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th>Timestamp</th><th>Action</th><th>Manager</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ============================================
   Main Render — Manual Approach
   ============================================ */

function renderManualAdmin() {
  const s = getAdminSubmissionStats();

  const stats = `
    <div class="stats-grid">
      ${renderStatCard("Total Managers", s.total, "", "Across 3 teams", "neutral")}
      ${renderStatCard("Submitted", s.submitted, "", `${s.rate}% complete`, "up")}
      ${renderStatCard("Pending", s.pending, "", "⚠ Follow-up needed", "down")}
      ${renderStatCard("Completion Rate", s.rate, "%", `${s.submitted} of ${s.total} submitted`, "down")}
    </div>
  `;

  const tableCard = `
    <div class="card mb-6">
      <div class="card-header">
        <div class="card-title">📋 Submission Status</div>
      </div>
      <div class="card-body">
        ${renderFilterBar()}
        <div class="table-wrapper">
          <table id="admin-table">
            <thead>
              <tr>
                <th>Manager Name</th><th>Team</th><th>Status</th><th>Submitted Time</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${renderManualSubmissionRows()}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const teamOverview = `
    <div class="mb-2">
      <h2 style="font-size:18px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Team Overview</h2>
      <p class="text-sm text-gray mb-4">Aggregated KPIs per team — only submitted managers are included.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;" class="mb-6">
      ${renderOverviewCard(null, "manual")}
      ${TEAMS.map(t => renderOverviewCard(t, "manual")).join("")}
    </div>
  `;

  const controls = `
    <div class="card mb-6">
      <div class="card-header">
        <div class="card-title">⚙️ Admin Controls</div>
      </div>
      <div class="card-body">
        <div class="flex gap-3" style="flex-wrap:wrap;">
          <button class="btn btn-danger" onclick="adminLockAll()">🔒 Lock All Submissions</button>
          <button class="btn btn-primary" onclick="adminExport()">📊 Export to Excel</button>
          <button class="btn btn-secondary" onclick="adminSendAllReminders()">📧 Send Reminders to Pending</button>
        </div>
      </div>
    </div>
  `;

  const note = `
    <div class="alert alert-warning">
      ⚠️ <strong>Manual approach</strong> — ${s.pending} of ${s.total} managers haven't submitted. Data gaps require follow-up.
    </div>
  `;

  return `
    <div style="max-width:1100px;">
      <div class="mb-6">
        <h1 style="font-size:24px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Admin Oversight</h1>
        <p class="text-sm text-gray">Victoria's Approach (Manual) — track submissions, follow up on missing data, and lock the day's report.</p>
      </div>
      ${stats}
      ${tableCard}
      ${teamOverview}
      ${controls}
      ${note}
    </div>
  `;
}

/* ============================================
   Main Render — Automated Approach
   ============================================ */

function renderAutomatedAdmin() {
  const pendingReview = AppState.eodData.filter(d => d.managerId === 4 || d.managerId === 6).length;
  const lastSync = "5:14 PM";

  const integrationPanel = `
    <div class="integration-panel">
      <div class="integration-status">
        <span class="pulse"></span>
        <strong style="font-size:15px;">QuickSight Integration: Active</strong>
        <span class="badge badge-success" style="margin-left:8px;">Live</span>
      </div>
      <div class="flex gap-4 mt-2" style="flex-wrap:wrap;">
        <div class="text-sm"><span class="text-gray">Last sync:</span> <strong>${lastSync}</strong></div>
        <div class="text-sm"><span class="text-gray">Sync frequency:</span> <strong>Every 15 minutes</strong></div>
        <div class="text-sm"><span class="text-gray">Data source:</span> <strong>QuickSight Dashboard → Wiki (auto-push)</strong></div>
      </div>
    </div>
  `;

  const stats = `
    <div class="stats-grid">
      ${renderStatCard("Total Managers", 6, "", "Across 3 teams", "neutral")}
      ${renderStatCard("Auto-Synced", 6, "", "✓ All synced", "up", `<span class="badge badge-success">100%</span>`)}
      ${renderStatCard("Pending Review", pendingReview, "", "Awaiting approval", "neutral")}
      ${renderStatCard("Data Freshness", "Real-time", "", "Synced moments ago", "up")}
    </div>
  `;

  const tableCard = `
    <div class="card mb-6">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <div class="card-title">🔄 Sync Status</div>
          <span class="badge badge-success">All managers synced</span>
        </div>
      </div>
      <div class="card-body">
        ${renderFilterBar()}
        <div class="table-wrapper">
          <table id="admin-table">
            <thead>
              <tr>
                <th>Manager</th><th>Team</th><th>Sync Status</th><th>Last Sync</th><th>Review Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${renderAutomatedSyncRows()}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const teamOverview = `
    <div class="mb-2">
      <h2 style="font-size:18px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Team Overview</h2>
      <p class="text-sm text-gray mb-4">Aggregated KPIs per team — auto-synced from QuickSight. All teams at 100% coverage.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;" class="mb-6">
      ${renderOverviewCard(null, "automated")}
      ${TEAMS.map(t => renderOverviewCard(t, "automated")).join("")}
    </div>
  `;

  const controls = `
    <div class="card mb-6">
      <div class="card-header">
        <div class="card-title">⚙️ Admin Controls</div>
      </div>
      <div class="card-body">
        <div class="flex gap-3" style="flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="adminConfigureQuickSight()">⚙️ Configure QuickSight Sync</button>
          <button class="btn btn-success" onclick="adminRunManualSync()">🔄 Run Manual Sync</button>
          <button class="btn btn-secondary" onclick="adminExport()">📊 Export to Excel</button>
          <button class="btn btn-secondary" onclick="adminViewAuditLog()">📜 View Audit Log</button>
        </div>
      </div>
    </div>
  `;

  const auditTrail = `
    <div class="card mb-6">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <div class="card-title">📜 Audit Trail</div>
          <button class="btn btn-secondary btn-sm" onclick="adminViewAuditLog()">View Full Log</button>
        </div>
      </div>
      <div class="card-body">
        ${renderAuditTrailTable()}
      </div>
    </div>
  `;

  const banner = `
    <div class="alert alert-success">
      ✅ <strong>Automated approach</strong> — 100% data coverage. Zero manual entry. Zero data gaps. All managers synced.
    </div>
  `;

  return `
    <div style="max-width:1100px;">
      <div class="mb-6">
        <h1 style="font-size:24px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Admin Oversight</h1>
        <p class="text-sm text-gray">Automated Approach (QuickSight) — data auto-syncs every 15 minutes. Review, override, and audit with full traceability.</p>
      </div>
      ${integrationPanel}
      ${stats}
      ${tableCard}
      ${teamOverview}
      ${controls}
      ${auditTrail}
      ${banner}
    </div>
  `;
}

/* ============================================
   Public API (called by js/app.js)
   ============================================ */

function renderAdminView(approach) {
  if (approach === "automated") return renderAutomatedAdmin();
  return renderManualAdmin();
}

function afterAdminViewRender(approach) {
  // One-time global listeners for modal interaction (ESC + click-outside).
  // The modal itself is created lazily by adminShowModal and wires its own
  // backdrop handler; here we bind the keyboard shortcut once.
  if (!window._adminListenersBound) {
    window._adminListenersBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") adminCloseModal();
    });
  }
  // Ensure any stale modal from a previous view is hidden.
  const modal = document.getElementById("admin-modal");
  if (modal) modal.style.display = "none";
}
