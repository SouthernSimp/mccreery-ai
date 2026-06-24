/* ============================================
   Vickytoria EOD Reporting — Main App Logic
   ============================================ */

const App = {
  init() {
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    if (AppState.currentView === 'landing') {
      app.innerHTML = this.renderLanding();
      this.attachLandingEvents();
    } else {
      app.innerHTML = this.renderShell();
      this.attachShellEvents();
      this.renderView();
    }
  },

  // ============================================
  // Landing Page
  // ============================================
  renderLanding() {
    return `
      <div class="login-screen">
        <div style="max-width: 900px; width: 90%;">
          <div class="landing-hero">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 72px; height: 72px; background: linear-gradient(135deg, var(--primary-light), var(--primary-dark)); border-radius: var(--radius-lg); font-size: 36px; margin-bottom: 20px;">📊</div>
            <h1>End of Day Reporting System</h1>
            <p>Choose an approach to explore the mockup. Each approach includes three views: Manager Input, Admin Oversight, and Live Output Dashboard.</p>
          </div>

          <div class="approach-cards">
            <!-- Victoria's Approach -->
            <div class="approach-card" onclick="App.selectApproach('manual')">
              <div class="approach-icon manual">📝</div>
              <h3>Victoria's Approach</h3>
              <p class="approach-desc">Manual input via wiki forms. Managers log in, enter their EOD numbers, and submit. Data locks after submission.</p>
              <ul class="approach-features">
                <li>Wiki-based input form (replaces Excel)</li>
                <li>Submit & lock — no back-editing</li>
                <li>Input-only permissions for managers</li>
                <li>Admin view for full oversight</li>
                <li class="no">Still requires manual data entry</li>
                <li class="no">Human error risk remains</li>
                <li class="no">No coverage for absent managers</li>
              </ul>
              <button class="btn btn-secondary btn-lg" style="width: 100%;">Explore Manual Approach →</button>
            </div>

            <!-- Automated Approach -->
            <div class="approach-card recommended" onclick="App.selectApproach('automated')">
              <div class="recommend-badge">⭐ Recommended</div>
              <div class="approach-icon automated">⚡</div>
              <h3>Automated Approach</h3>
              <p class="approach-desc">QuickSight integration auto-pushes data to the wiki. No manual entry — managers review pre-filled numbers and approve.</p>
              <ul class="approach-features">
                <li>QuickSight → Wiki auto-sync</li>
                <li>Zero manual data entry</li>
                <li>Eliminates human error</li>
                <li>Auto-fills even when manager is out</li>
                <li>Real-time data freshness</li>
                <li>Managers review & approve (1 click)</li>
                <li>Full audit trail & source tracking</li>
              </ul>
              <button class="btn btn-success btn-lg" style="width: 100%;">Explore Automated Approach →</button>
            </div>
          </div>

          <div style="text-align: center; padding: 0 24px 40px;">
            <p class="text-sm text-gray">
              <strong>Mockup for Victoria pitch</strong> — Demo built with sample data. 6 managers, 3 teams, 10 KPI metrics.
            </p>
          </div>
        </div>
      </div>
    `;
  },

  attachLandingEvents() {
    // Click handlers are inline via onclick
  },

  selectApproach(approach) {
    AppState.currentApproach = approach;
    AppState.currentView = 'user';
    this.render();
  },

  // ============================================
  // App Shell (Sidebar + Topbar)
  // ============================================
  renderShell() {
    const approachLabel = AppState.currentApproach === 'manual' ? "Victoria's Approach" : "Automated (QuickSight)";
    const approachIcon = AppState.currentApproach === 'manual' ? "📝" : "⚡";

    return `
      <div class="app-shell">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">
              <div class="logo-icon">📊</div>
              <span>EOD Reporting</span>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Views</div>
            <div class="sidebar-link ${AppState.currentView === 'user' ? 'active' : ''}" onclick="App.navigate('user')">
              <span class="icon">👤</span> User View
            </div>
            <div class="sidebar-link ${AppState.currentView === 'admin' ? 'active' : ''}" onclick="App.navigate('admin')">
              <span class="icon">🛡️</span> Admin View
            </div>
            <div class="sidebar-link ${AppState.currentView === 'output' ? 'active' : ''}" onclick="App.navigate('output')">
              <span class="icon">📈</span> Output View
            </div>
            <div class="sidebar-link ${AppState.currentView === 'wiki' ? 'active' : ''}" onclick="App.navigate('wiki')">
              <span class="icon">📋</span> Wiki Spreadsheet
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Approach</div>
            <div class="sidebar-link ${AppState.currentApproach === 'manual' ? 'active' : ''}" onclick="App.switchApproach('manual')">
              <span class="icon">📝</span> Victoria's (Manual)
            </div>
            <div class="sidebar-link ${AppState.currentApproach === 'automated' ? 'active' : ''}" onclick="App.switchApproach('automated')">
              <span class="icon">⚡</span> Automated
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Demo Controls</div>
            <div class="sidebar-link" onclick="App.resetDemo()">
              <span class="icon">🔄</span> Reset Demo Data
            </div>
            <div class="sidebar-link" onclick="App.goHome()">
              <span class="icon">🏠</span> Back to Landing
            </div>
          </div>

          <div class="sidebar-footer">
            Mockup v1.0 — Sample Data<br>
            ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </aside>

        <!-- Main Content -->
        <div class="main-area">
          <header class="topbar">
            <div class="topbar-left">
              <div>
                <div class="topbar-title" id="view-title">User View</div>
                <div class="topbar-breadcrumb" id="view-breadcrumb">${approachIcon} ${approachLabel}</div>
              </div>
            </div>
            <div class="topbar-right">
              <div class="approach-toggle">
                <button class="${AppState.currentApproach === 'manual' ? 'active' : ''}" onclick="App.switchApproach('manual')">📝 Manual</button>
                <button class="${AppState.currentApproach === 'automated' ? 'active' : ''}" onclick="App.switchApproach('automated')">⚡ Automated</button>
              </div>
              <div class="user-avatar" title="${AppState.currentUser.name}">${AppState.currentUser.initials}</div>
            </div>
          </header>

          <main class="content" id="view-content">
            <!-- View content injected here -->
          </main>
        </div>
      </div>
    `;
  },

  attachShellEvents() {
    // Events handled via onclick attributes
  },

  // ============================================
  // View Rendering
  // ============================================
  renderView() {
    const content = document.getElementById('view-content');
    const titleEl = document.getElementById('view-title');
    const crumbEl = document.getElementById('view-breadcrumb');

    const approachLabel = AppState.currentApproach === 'manual' ? "Victoria's Approach" : "Automated (QuickSight)";
    const approachIcon = AppState.currentApproach === 'manual' ? "📝" : "⚡";

    if (titleEl) {
      const titles = { user: 'User View', admin: 'Admin View', output: 'Output View', wiki: 'Wiki Spreadsheet' };
      titleEl.textContent = titles[AppState.currentView] || '';
    }
    if (crumbEl) {
      crumbEl.innerHTML = `${approachIcon} ${approachLabel}`;
    }

    // Delegate to view modules
    if (AppState.currentView === 'user' && typeof renderUserView === 'function') {
      content.innerHTML = renderUserView(AppState.currentApproach);
      if (typeof afterUserViewRender === 'function') afterUserViewRender(AppState.currentApproach);
    } else if (AppState.currentView === 'admin' && typeof renderAdminView === 'function') {
      content.innerHTML = renderAdminView(AppState.currentApproach);
      if (typeof afterAdminViewRender === 'function') afterAdminViewRender(AppState.currentApproach);
    } else if (AppState.currentView === 'output' && typeof renderOutputView === 'function') {
      content.innerHTML = renderOutputView(AppState.currentApproach);
      if (typeof afterOutputViewRender === 'function') afterOutputViewRender(AppState.currentApproach);
    } else if (AppState.currentView === 'wiki' && typeof renderWikiView === 'function') {
      content.innerHTML = renderWikiView(AppState.currentApproach);
      if (typeof afterWikiViewRender === 'function') afterWikiViewRender(AppState.currentApproach);
    } else {
      content.innerHTML = `<div class="alert alert-warning">View not yet implemented: ${AppState.currentView}</div>`;
    }
  },

  // ============================================
  // Navigation
  // ============================================
  navigate(view) {
    AppState.currentView = view;
    this.render();
  },

  switchApproach(approach) {
    AppState.currentApproach = approach;
    this.render();
  },

  goHome() {
    AppState.currentView = 'landing';
    this.render();
  },

  resetDemo() {
    AppState.eodData = generateEODData();
    AppState.historicalData = generateHistoricalData();
    AppState.isLocked = false;
    this.render();
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
