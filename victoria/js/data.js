/* ============================================
   Vickytoria EOD Reporting — Mock Data
   ============================================ */

// 6 Managers across 3 teams
const MANAGERS = [
  { id: 1, name: "Sarah Mitchell",  team: "Alpha",   email: "sarah.m@company.com",  initials: "SM" },
  { id: 2, name: "James Chen",      team: "Alpha",   email: "james.c@company.com",  initials: "JC" },
  { id: 3, name: "Maria Rodriguez", team: "Bravo",   email: "maria.r@company.com",  initials: "MR" },
  { id: 4, name: "David Thompson",  team: "Bravo",   email: "david.t@company.com",  initials: "DT" },
  { id: 5, name: "Lisa Park",       team: "Charlie", email: "lisa.p@company.com",   initials: "LP" },
  { id: 6, name: "Michael O'Brien", team: "Charlie", email: "michael.o@company.com", initials: "MO" }
];

// 10 KPI Metrics (Andy to provide actual column headers)
const METRICS = [
  { id: "aht",           name: "Average Handle Time",  unit: "sec",   icon: "⏱️", description: "Avg duration of a call including hold & wrap-up" },
  { id: "contact_count", name: "Contact Count",         unit: "",      icon: "📞", description: "Total contacts handled" },
  { id: "fcr",           name: "First Call Resolution", unit: "%",     icon: "✅", description: "Calls resolved on first contact" },
  { id: "csat",          name: "Customer Satisfaction", unit: "score", icon: "⭐", description: "Average CSAT score (1-5)" },
  { id: "abandon_rate",  name: "Abandon Rate",          unit: "%",     icon: "📉", description: "Calls abandoned before connection" },
  { id: "asa",           name: "Average Speed of Answer",unit: "sec",  icon: "🏃", description: "Avg time to answer incoming calls" },
  { id: "service_level", name: "Service Level",         unit: "%",     icon: "🎯", description: "Calls answered within target time" },
  { id: "occupancy",     name: "Occupancy Rate",        unit: "%",     icon: "📊", description: "Time agents are on calls" },
  { id: "acw",           name: "After Call Work",       unit: "sec",   icon: "📝", description: "Avg post-call processing time" },
  { id: "adherence",     name: "Schedule Adherence",    unit: "%",     icon: "📅", description: "Time agents follow their schedule" }
];

// Teams
const TEAMS = ["Alpha", "Bravo", "Charlie"];

// Generate realistic mock values for a metric
function getMockValue(metricId) {
  const ranges = {
    aht:           { min: 280, max: 450, decimals: 0 },
    contact_count: { min: 120, max: 310, decimals: 0 },
    fcr:           { min: 62,  max: 88,  decimals: 1 },
    csat:          { min: 3.8, max: 4.9, decimals: 1 },
    abandon_rate:  { min: 2.1, max: 8.5, decimals: 1 },
    asa:           { min: 12,  max: 45,  decimals: 0 },
    service_level: { min: 78,  max: 96,  decimals: 1 },
    occupancy:     { min: 72,  max: 92,  decimals: 1 },
    acw:           { min: 35,  max: 85,  decimals: 0 },
    adherence:     { min: 84,  max: 98,  decimals: 1 }
  };
  const r = ranges[metricId] || { min: 0, max: 100, decimals: 0 };
  const val = r.min + Math.random() * (r.max - r.min);
  return parseFloat(val.toFixed(r.decimals));
}

// Generate today's EOD data for all managers (some submitted, some pending)
function generateEODData() {
  const today = new Date().toISOString().split('T')[0];
  const statuses = ["submitted", "submitted", "submitted", "pending", "submitted", "pending"];
  const times = ["5:02 PM", "5:15 PM", "4:58 PM", null, "5:07 PM", null];

  return MANAGERS.map((mgr, i) => {
    const values = {};
    METRICS.forEach(m => {
      values[m.id] = getMockValue(m.id);
    });
    return {
      managerId: mgr.id,
      managerName: mgr.name,
      team: mgr.team,
      date: today,
      status: statuses[i],
      submittedAt: times[i],
      values: values
    };
  });
}

// Historical data for charts (last 7 days)
function generateHistoricalData() {
  const days = [];
  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayData = { date: dateStr, values: {} };
    METRICS.forEach(m => {
      dayData.values[m.id] = getMockValue(m.id);
    });
    days.push(dayData);
  }
  return days;
}

// Current app state
const AppState = {
  currentApproach: "manual",    // "manual" or "automated"
  currentView: "landing",       // "landing", "user", "admin", "output"
  currentUser: MANAGERS[0],     // Currently logged-in manager
  eodData: generateEODData(),
  historicalData: generateHistoricalData(),
  isLocked: false               // Whether the current user's submission is locked
};

// Team aggregation
function getTeamAggregate(teamName) {
  const teamData = AppState.eodData.filter(d => d.team === teamName && d.status === "submitted");
  if (teamData.length === 0) return null;

  const agg = {};
  METRICS.forEach(m => {
    const vals = teamData.map(d => d.values[m.id]).filter(v => v != null);
    if (vals.length > 0) {
      agg[m.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (m.decimals !== undefined) {
        agg[m.id] = parseFloat(agg[m.id].toFixed(m.decimals || 1));
      } else {
        agg[m.id] = parseFloat(agg[m.id].toFixed(1));
      }
    }
  });
  return agg;
}

// Overall aggregation
function getOverallAggregate() {
  const submitted = AppState.eodData.filter(d => d.status === "submitted");
  if (submitted.length === 0) return null;

  const agg = {};
  METRICS.forEach(m => {
    const vals = submitted.map(d => d.values[m.id]).filter(v => v != null);
    if (vals.length > 0) {
      agg[m.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
      agg[m.id] = parseFloat(agg[m.id].toFixed(1));
    }
  });
  return agg;
}
