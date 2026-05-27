'use strict';

/* ─────────────────────────────────────────────────────────────
   フォーティアス Affiliate Manager — Main App
───────────────────────────────────────────────────────────── */
const App = {
  saveTimeout: null,
  currentCaseId: null,
  currentPhase: 'phase0',
  talentFilter: null,
  calendarYear: null,
  calendarMonth: null,

  /* ── Init ── */
  init() {
    Storage.initialize();
    this.setupRouter();
    this.setupEventDelegation();
    this.route(location.hash || '#/');
  },

  /* ── Routing ── */
  setupRouter() {
    window.addEventListener('hashchange', () => this.route(location.hash));
  },

  route(hash) {
    if (!hash || hash === '#' || hash === '#/') {
      this.renderDashboard();
      this.setActiveNav('dashboard');
      return;
    }
    if (hash === '#/new') {
      this.renderNewCase();
      this.setActiveNav('new');
      return;
    }
    if (hash === '#/talents') {
      this.renderTalents();
      this.setActiveNav('talents');
      return;
    }
    if (hash === '#/calendar') {
      this.renderCalendar();
      this.setActiveNav('calendar');
      return;
    }
    const caseMatch = hash.match(/^#\/case\/([^/]+)(?:\/(.+))?$/);
    if (caseMatch) {
      const id = decodeURIComponent(caseMatch[1]);
      const sub = caseMatch[2] || 'phase0';
      if (sub === 'live') {
        this.renderCaseDetail(id, 'phase3');
      } else {
        this.renderCaseDetail(id, sub);
      }
      this.setActiveNav('cases');
    }
  },

  setActiveNav(key) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    const el = document.querySelector(`[data-nav="${key}"]`);
    if (el) el.classList.add('active');
  },

  navigate(hash) {
    location.hash = hash;
  },

  /* ── Talent filter helper ── */
  filterByTalent(influencer) {
    this.talentFilter = influencer;
    this.navigate('#/');
  },

  /* ── Dashboard ── */
  renderDashboard() {
    const allCases = Storage.getAll();
    const filterInfluencer = this.talentFilter;
    const cases = filterInfluencer ? allCases.filter(c => c.influencer === filterInfluencer) : allCases;
    const mc = document.getElementById('main-content');
    if (!mc) return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const active = cases.filter(c => c.status !== 'done').length;
    const thisMonth = cases.filter(c => c.status !== 'done' || new Date(c.updatedAt) >= monthStart);

    // Estimated monthly revenue (Phase 4 approved cases this month)
    const monthRevenue = cases
      .filter(c => c.phase4 && new Date(c.updatedAt) >= monthStart)
      .reduce((sum, c) => {
        const p4 = c.phase4 || {};
        const p0 = c.phase0 || {};
        const clientRate = parseFloat(p0.client_reward_rate || 0) / 100;
        const price = parseFloat(p0.price_sale || 0);
        const approved = parseInt(p4.approvedCount || 0);
        return sum + Math.round(approved * price * clientRate);
      }, 0);

    const statusMap = {
      phase0: { label: 'ヒアリング中', cls: 'badge-phase0' },
      phase1: { label: 'GO/STOP判定', cls: 'badge-phase1' },
      phase2: { label: '実施準備中', cls: 'badge-phase2' },
      phase3: { label: '当日運用中', cls: 'badge-phase3' },
      phase4: { label: '精算中', cls: 'badge-phase4' },
      done:   { label: '完了', cls: 'badge-done' }
    };
    const judgeMap = {
      A: 'badge-A', B: 'badge-B', C: 'badge-C', D: 'badge-D', pending: 'badge-pending'
    };

    const cards = cases.length === 0
      ? `<div style="text-align:center;padding:60px 20px;color:#94a3b8">
          <div style="font-size:48px;margin-bottom:12px">📋</div>
          <div style="font-size:16px;font-weight:600;margin-bottom:8px">案件がありません</div>
          <div style="font-size:13px;margin-bottom:20px">最初の案件を作成しましょう</div>
          <button class="btn btn-primary" onclick="App.navigate('#/new')">+ 新規案件作成</button>
        </div>`
      : cases.map(c => {
          const sm = statusMap[c.status] || statusMap.phase0;
          const jCls = judgeMap[c.judgment || 'pending'] || 'badge-pending';
          const jLbl = c.judgment || '—';
          const updStr = c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ja-JP') : '—';
          const isLive = c.status === 'phase3';
          const formSubmitted = (c.phase0 || {}).form_submitted;
          return `
            <a href="#/case/${encodeURIComponent(c.id)}" class="case-card fade-in">
              <div class="case-card-name">${esc(c.name)}</div>
              <div class="case-card-meta">
                <span>🏷 ${esc(c.brand)}</span>
                <span>·</span>
                <span>${esc(c.platform)}</span>
                <span>·</span>
                <span>⭐ ${esc(c.influencer)}</span>
              </div>
              <div class="case-card-footer">
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <span class="badge ${sm.cls}">${isLive ? '🔴 ' : ''}${sm.label}</span>
                  <span class="badge badge-judge ${jCls}">判定: ${esc(jLbl)}</span>
                  ${formSubmitted ? '<span class="badge badge-form-submitted">📋 フォーム入力済</span>' : ''}
                </div>
                <span style="font-size:11px;color:#94a3b8">更新: ${updStr}</span>
              </div>
            </a>`;
        }).join('');

    mc.innerHTML = `
      <div class="fade-in">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:var(--navy);margin:0">案件一覧</h1>
            <p style="font-size:13px;color:#64748b;margin:4px 0 0">フォーティアス アフィリエイト案件管理</p>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('#/new')">+ 新規案件</button>
        </div>
        ${filterInfluencer ? `<div class="talent-filter-bar"><span style="font-size:13px;color:#0f766e">⭐ ${esc(filterInfluencer)} でフィルター中</span><button class="btn btn-ghost btn-sm" id="clear-talent-filter">✕ 解除</button></div>` : ''}
        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          <div class="stat-card">
            <div class="stat-label">進行中</div>
            <div class="stat-value">${active}</div>
            <div class="stat-sub">件</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">今月 クライアント請求額（推計）</div>
            <div class="stat-value" style="font-size:20px">¥${monthRevenue.toLocaleString()}</div>
            <div class="stat-sub">精算済み分</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">総案件数</div>
            <div class="stat-value">${cases.length}</div>
            <div class="stat-sub">件</div>
          </div>
        </div>
        <!-- Case cards -->
        <div style="display:flex;flex-direction:column;gap:10px">${cards}</div>
      </div>`;
  },

  /* ── New Case Form ── */
  renderNewCase() {
    const mc = document.getElementById('main-content');
    if (!mc) return;
    mc.innerHTML = `
      <div class="fade-in">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <button class="btn btn-ghost" onclick="App.navigate('#/')">← 戻る</button>
          <h1 style="font-size:20px;font-weight:800;color:var(--navy);margin:0">新規案件作成</h1>
        </div>
        <div class="card" style="max-width:600px">
          <div class="card-header"><h3>基本情報</h3></div>
          <div class="card-body">
            <form id="new-case-form">
              <div class="form-group">
                <label class="form-label">案件名 <span class="required">*</span></label>
                <input type="text" class="form-control" name="name" placeholder="例: Anua × 楽天 × 成瀬愛里" required>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">ブランド <span class="required">*</span></label>
                  <input type="text" class="form-control" name="brand" placeholder="例: Anua" required>
                </div>
                <div class="form-group">
                  <label class="form-label">プラットフォーム <span class="required">*</span></label>
                  <select class="form-control" name="platform" required>
                    <option value="">— 選択 —</option>
                    <option value="楽天">楽天</option>
                    <option value="Qoo10">Qoo10</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Yahoo!ショッピング">Yahoo!ショッピング</option>
                    <option value="自社EC">自社EC</option>
                    <option value="SHOPLIST">SHOPLIST</option>
                    <option value="ZOZOTOWN">ZOZOTOWN</option>
                    <option value="メルカリShops">メルカリShops</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">インフルエンサー名 <span class="required">*</span></label>
                  <input type="text" class="form-control" name="influencer" placeholder="例: 成瀬愛里" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Instagram ID</label>
                  <input type="text" class="form-control" name="influencer_ig" placeholder="@なし">
                </div>
              </div>
              <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
                <button type="button" class="btn btn-outline" onclick="App.navigate('#/')">キャンセル</button>
                <button type="submit" class="btn btn-primary">作成して編集へ →</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;

    document.getElementById('new-case-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const newCase = {
        id: Storage.generateId(),
        name: fd.get('name'),
        brand: fd.get('brand'),
        platform: fd.get('platform'),
        influencer: fd.get('influencer'),
        influencer_ig: fd.get('influencer_ig') || '',
        status: 'phase0',
        judgment: 'pending',
        phase0: { emergency_contacts: [{name:'',role:'',phone:''},{name:'',role:'',phone:''},{name:'',role:'',phone:''}] },
        phase1: { stop_items: {}, caution_items: {} },
        phase2: { confirmed_items: {} },
        phase3: { salesLog: [], giftRemaining: 0, alertLines: [1000, 500, 70] },
        phase4: {}
      };
      Storage.save(newCase);
      this.navigate(`#/case/${encodeURIComponent(newCase.id)}/phase0`);
    });
  },

  /* ── Case Detail ── */
  renderCaseDetail(id, phase) {
    const caseData = Storage.getById(id);
    if (!caseData) {
      document.getElementById('main-content').innerHTML =
        `<div style="text-align:center;padding:60px;color:#94a3b8">案件が見つかりません<br><button class="btn btn-primary" style="margin-top:16px" onclick="App.navigate('#/')">ダッシュボードへ</button></div>`;
      return;
    }
    this.currentCaseId = id;
    this.currentPhase = phase || 'phase0';

    const mc = document.getElementById('main-content');
    if (!mc) return;

    const tabs = [
      { key: 'phase0', icon: '📋', label: 'ヒアリング', status: caseData.status },
      { key: 'phase1', icon: '🔍', label: 'GO/STOP判定', status: caseData.status },
      { key: 'phase2', icon: '✅', label: '実施準備', status: caseData.status },
      { key: 'phase3', icon: '📊', label: '当日売上', status: caseData.status },
      { key: 'phase4', icon: '💴', label: '精算・振り返り', status: caseData.status }
    ];

    const phaseOrder = ['phase0', 'phase1', 'phase2', 'phase3', 'phase4', 'done'];
    const currentPhaseIdx = phaseOrder.indexOf(caseData.status);

    const tabsHtml = tabs.map(t => {
      const tIdx = phaseOrder.indexOf(t.key);
      const isActive = t.key === this.currentPhase;
      const isDone = currentPhaseIdx > tIdx;
      const checkIcon = isDone ? '<span class="tab-check">✓</span>' : '';
      return `<a href="#/case/${encodeURIComponent(id)}/${t.key}" class="phase-tab ${isActive ? 'active' : ''}">${t.icon} ${t.label}${checkIcon}</a>`;
    }).join('');

    const sm = { phase0: 'ヒアリング中', phase1: 'GO/STOP判定', phase2: '実施準備中', phase3: '当日運用中', phase4: '精算中', done: '完了' };
    const smCls = { phase0: 'badge-phase0', phase1: 'badge-phase1', phase2: 'badge-phase2', phase3: 'badge-phase3', phase4: 'badge-phase4', done: 'badge-done' };

    let phaseContent = '';
    switch (this.currentPhase) {
      case 'phase0': phaseContent = Phases.renderPhase0(caseData); break;
      case 'phase1': phaseContent = Phases.renderPhase1(caseData); break;
      case 'phase2': phaseContent = Phases.renderPhase2(caseData); break;
      case 'phase3': phaseContent = Phases.renderPhase3(caseData); break;
      case 'phase4': phaseContent = Phases.renderPhase4(caseData); break;
      default: phaseContent = Phases.renderPhase0(caseData);
    }

    mc.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="case-header-area" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div style="min-width:0;flex:1">
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('#/')" style="margin-bottom:4px;padding-left:0;font-size:12px">← 案件一覧</button>
            <h1 style="font-size:16px;font-weight:800;color:var(--navy);margin:0;line-height:1.3;word-break:break-all">${esc(caseData.name)}</h1>
            <div class="case-detail-meta" style="font-size:12px;color:#64748b;margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
              <span>${esc(caseData.brand)}</span>
              <span>·</span><span>${esc(caseData.platform)}</span>
              <span>·</span><span>⭐ ${esc(caseData.influencer)}</span>
            </div>
          </div>
          <div class="case-header-actions" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="badge ${smCls[caseData.status] || 'badge-phase0'}">${sm[caseData.status] || caseData.status}</span>
            ${caseData.judgment && caseData.judgment !== 'pending'
              ? `<span class="badge badge-judge badge-${caseData.judgment}">判定: ${esc(caseData.judgment)}</span>` : ''}
            <button class="btn btn-outline btn-sm" id="share-btn" data-case-id="${esc(id)}">🔗 共有</button>
            <button class="btn btn-teal btn-sm" id="form-url-btn" data-case-id="${esc(id)}">📋 フォーム発行</button>
            <button class="btn btn-danger btn-sm" id="delete-case-btn" data-case-id="${esc(id)}">🗑</button>
          </div>
        </div>

        <!-- Status Progress bar -->
        <div class="progress-bar-wrap" style="margin-bottom:16px;overflow-x:auto;-webkit-overflow-scrolling:touch">
          <div style="display:flex;gap:0;background:#f1f5f9;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;min-width:320px">
            ${['phase0','phase1','phase2','phase3','phase4'].map((p, i) => {
              const idx = phaseOrder.indexOf(p);
              const isDone = currentPhaseIdx > idx;
              const isCurrent = caseData.status === p;
              const bg = isDone ? 'var(--teal)' : (isCurrent ? 'var(--navy)' : 'transparent');
              const col = (isDone || isCurrent) ? '#fff' : '#94a3b8';
              return `<div style="flex:1;text-align:center;padding:6px 4px;font-size:11px;font-weight:600;background:${bg};color:${col};transition:all 0.3s">
                ${['0','1','2','3','4'][i]}${isDone ? ' ✓' : ''}
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Tabs -->
        <div class="phase-tabs" style="margin-bottom:16px">${tabsHtml}</div>

        <!-- Phase content -->
        <div id="phase-content">${phaseContent}</div>

        <!-- Advance phase button -->
        ${this.renderAdvanceButton(caseData)}
      </div>`;

    // Post-render setup
    this.setupCollapsibles();
    if (this.currentPhase === 'phase3') {
      requestAnimationFrame(() => Phases.initPhase3Chart(caseData));
    }
  },

  renderAdvanceButton(caseData) {
    const order = ['phase0', 'phase1', 'phase2', 'phase3', 'phase4', 'done'];
    const idx = order.indexOf(caseData.status);
    if (idx < 0 || idx >= order.length - 1) return '';
    const nextLabels = {
      phase0: 'Phase 1 GO/STOP判定へ進む →',
      phase1: 'Phase 2 実施準備へ進む →',
      phase2: 'Phase 3 当日売上管理へ進む →',
      phase3: 'Phase 4 精算・振り返りへ進む →',
      phase4: '案件を完了にする ✓'
    };
    const nextPhase = order[idx + 1];
    return `
      <div style="margin-top:20px;text-align:right">
        <button class="btn btn-navy" id="advance-btn" data-case-id="${esc(caseData.id)}" data-next="${esc(nextPhase)}">
          ${nextLabels[caseData.status] || '次へ'}
        </button>
      </div>`;
  },

  setupCollapsibles() {
    document.querySelectorAll('.collapse-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.collapse;
        const body = document.getElementById('collapse-' + id);
        if (!body) return;
        btn.classList.toggle('open');
        body.classList.toggle('open');
      });
    });
  },

  /* ── Event Delegation ── */
  setupEventDelegation() {
    const mc = document.getElementById('main-content');
    if (!mc) return;

    // Change / Input for auto-save
    mc.addEventListener('change', e => this.handleFormChange(e));
    mc.addEventListener('input', e => {
      const t = e.target;
      if (t.tagName === 'TEXTAREA' || t.type === 'text' || t.type === 'number' || t.type === 'url') {
        this.scheduleAutoSave(t.dataset.caseId);
      }
    });

    // Click delegation
    mc.addEventListener('click', e => this.handleClick(e));
  },

  handleFormChange(e) {
    const t = e.target;
    const caseId = t.dataset.caseId || t.closest('[data-case-id]')?.dataset.caseId;
    if (!caseId) return;

    const caseData = Storage.getById(caseId);
    if (!caseData) return;

    // Phase 0 fields
    if (t.dataset.field) {
      const field = t.dataset.field;
      const phase = t.closest('[data-phase]')?.dataset.phase;
      if (phase === 'phase0' || phase === 'phase4') {
        const target = phase === 'phase4' ? (caseData.phase4 = caseData.phase4 || {})
                                          : (caseData.phase0 = caseData.phase0 || {});
        target[field] = t.value;
      } else if (!phase) {
        // Flat case fields (name, brand, etc.)
        caseData[field] = t.value;
      }
    }

    // Phase 4 リアルタイム計算
    if (phase === 'phase4' && ['approvedCount','rejectedCount','finalSales'].includes(t.dataset.field)) {
      this.updateRevenueDisplay(caseId);
    }

    // Phase 1 STOP items
    if (t.dataset.stopItem) {
      caseData.phase1 = caseData.phase1 || { stop_items: {}, caution_items: {} };
      caseData.phase1.stop_items = caseData.phase1.stop_items || {};
      caseData.phase1.stop_items[t.dataset.stopItem] = t.checked;
      // Update label styling
      const item = t.closest('.check-item');
      if (item) {
        item.classList.remove('checked', 'unchecked');
        item.classList.add(t.checked ? 'checked' : 'unchecked');
      }
      // Recalculate judgment
      const j = Phases.calculateJudgment(caseData.phase1);
      caseData.judgment = j;
      const jBox = document.getElementById('judgment-box');
      if (jBox) {
        const jLabels = { A:'GO（最良）', B:'GO（条件付き）', C:'要確認', D:'STOP' };
        jBox.className = `judgment-box ${j}`;
        jBox.innerHTML = `<div class="judgment-letter">${j}</div><div class="judgment-label">${jLabels[j]}</div>`;
      }
    }

    // Phase 1 CAUTION items
    if (t.dataset.cautionItem) {
      caseData.phase1 = caseData.phase1 || { stop_items: {}, caution_items: {} };
      caseData.phase1.caution_items = caseData.phase1.caution_items || {};
      caseData.phase1.caution_items[t.dataset.cautionItem] = t.checked;
      const item = t.closest('.check-item');
      if (item) {
        item.classList.remove('checked', 'unchecked');
        item.classList.add(t.checked ? 'checked' : '');
      }
      // Update unchecked count
      const unchecked = PHASE1_CAUTION_ITEMS.filter(i => (caseData.phase1.caution_items || {})[i.key] !== true).length;
      const badge = document.querySelector('.card-header strong');
      if (badge) badge.textContent = unchecked;
      // Recalculate judgment
      const j = Phases.calculateJudgment(caseData.phase1);
      caseData.judgment = j;
    }

    // Phase 2 items
    if (t.dataset.p2Item) {
      caseData.phase2 = caseData.phase2 || { confirmed_items: {} };
      caseData.phase2.confirmed_items = caseData.phase2.confirmed_items || {};
      const key = t.dataset.p2Item;
      if (t.type === 'checkbox') {
        caseData.phase2.confirmed_items[key] = t.checked;
        const item = t.closest('.check-item');
        if (item) {
          item.classList.remove('checked', 'unchecked');
          item.classList.add(t.checked ? 'checked' : '');
        }
      } else {
        caseData.phase2.confirmed_items[key] = t.value;
      }
    }

    this.saveAndNotify(caseData);
  },

  handleClick(e) {
    const t = e.target;
    const btn = t.closest('button') || t;
    const caseId = btn.dataset.caseId;

    // Clear talent filter
    if (btn.id === 'clear-talent-filter') {
      this.talentFilter = null;
      this.renderDashboard();
      this.setActiveNav('dashboard');
      return;
    }

    // Calendar nav
    if (btn.id === 'cal-nav-prev') {
      if (this.calendarYear === null) { const n = new Date(); this.calendarYear = n.getFullYear(); this.calendarMonth = n.getMonth(); }
      this.calendarMonth--;
      if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
      this.renderCalendar(); this.setActiveNav('calendar'); return;
    }
    if (btn.id === 'cal-nav-next') {
      if (this.calendarYear === null) { const n = new Date(); this.calendarYear = n.getFullYear(); this.calendarMonth = n.getMonth(); }
      this.calendarMonth++;
      if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
      this.renderCalendar(); this.setActiveNav('calendar'); return;
    }

    // Calendar event click
    const calEvt = t.closest('.cal-event');
    if (calEvt) {
      try {
        const data = JSON.parse(calEvt.dataset.event || '{}');
        this.showCalEventPopup(data, e.clientX, e.clientY);
      } catch {}
      return;
    }

    // Talent card click
    const talentCard = t.closest('.talent-card');
    if (talentCard && talentCard.dataset.influencer) {
      e.preventDefault();
      this.openTalentDetailModal(talentCard.dataset.influencer);
      return;
    }

    // Form URL button
    if (btn.id === 'form-url-btn' && caseId) {
      this.openFormUrlModal(caseId);
      return;
    }

    // Auto-score button
    if (btn.id === 'auto-score-btn' && caseId) {
      Phases.showAutoScoreModal(caseId);
      return;
    }

    // Apply auto-score
    if (btn.id === 'apply-auto-score-btn' && caseId) {
      Phases.applyAutoScore(caseId);
      const modal = document.getElementById('auto-score-modal');
      if (modal) modal.remove();
      this.navigate(`#/case/${encodeURIComponent(caseId)}/phase1`);
      return;
    }

    // Close auto-score modal
    if (btn.id === 'close-auto-score-modal') {
      const modal = document.getElementById('auto-score-modal');
      if (modal) modal.remove();
      return;
    }

    // Delete case
    if (btn.id === 'delete-case-btn' && caseId) {
      if (confirm('この案件を削除しますか？この操作は元に戻せません。')) {
        Storage.delete(caseId);
        this.navigate('#/');
      }
      return;
    }

    // Advance phase
    if (btn.id === 'advance-btn' && caseId) {
      const next = btn.dataset.next;
      const caseData = Storage.getById(caseId);
      if (caseData) {
        caseData.status = next;
        Storage.save(caseData);
        const tab = next === 'done' ? 'phase4' : next;
        this.navigate(`#/case/${encodeURIComponent(caseId)}/${tab}`);
      }
      return;
    }

    // Share modal
    if (btn.id === 'share-btn' && caseId) {
      this.openShareModal(caseId);
      return;
    }

    // Add emergency contact
    if (btn.id === 'add-contact-btn' && caseId) {
      const caseData = Storage.getById(caseId);
      if (caseData) {
        caseData.phase0 = caseData.phase0 || {};
        caseData.phase0.emergency_contacts = caseData.phase0.emergency_contacts || [];
        caseData.phase0.emergency_contacts.push({ name: '', role: '', phone: '' });
        Storage.save(caseData);
        // Re-render contact list
        this.refreshContactList(caseData);
      }
      return;
    }

    // Remove emergency contact
    if (btn.dataset.removeContact !== undefined && caseId) {
      const idx = parseInt(btn.dataset.removeContact);
      const caseData = Storage.getById(caseId);
      if (caseData && caseData.phase0) {
        caseData.phase0.emergency_contacts.splice(idx, 1);
        Storage.save(caseData);
        this.refreshContactList(caseData);
      }
      return;
    }

    // Contact field changes (handled via input event delegation below)
    // ⑦ クイックモード（必須項目のみ表示）
    if (btn.id === 'quick-mode-btn') {
      const phase0El = btn.closest('[data-phase="phase0"]');
      if (!phase0El) return;
      const isQuick = phase0El.classList.toggle('quick-mode');
      btn.textContent = isQuick ? '📋 全項目表示' : '⚡ 必須項目のみ';
      btn.style.background = isQuick ? 'var(--teal)' : '';
      btn.style.color = isQuick ? '#fff' : '';
      btn.style.borderColor = isQuick ? 'var(--teal)' : '';
      return;
    }

    // Save fixed slot
    if (btn.classList.contains('save-fixed-slot-btn') && caseId) {
      const time = btn.dataset.fixedTime;
      const slotId = btn.dataset.slotId;
      const input = document.getElementById(slotId);
      if (!input) return;
      const count = parseInt(input.value);
      if (!time || isNaN(count)) { alert('累計販売数を入力してください'); return; }
      const caseData = Storage.getById(caseId);
      if (caseData) {
        caseData.phase3 = caseData.phase3 || { salesLog: [] };
        caseData.phase3.salesLog = caseData.phase3.salesLog || [];
        const idx = caseData.phase3.salesLog.findIndex(e => e.time === time);
        if (idx >= 0) { caseData.phase3.salesLog[idx].count = count; }
        else { caseData.phase3.salesLog.push({ time, count }); }
        caseData.phase3.salesLog.sort((a, b) => {
          const toMins = s => { const [h, m] = s.split(':').map(Number); return (h||0)*60+(m||0); };
          return toMins(a.time) - toMins(b.time);
        });
        Storage.save(caseData);
        input.style.background = '#f0fdf4';
        input.style.borderColor = '#86efac';
        this.refreshSalesLog(caseData);
        this.showSavedIndicator();
      }
      return;
    }

    // Add sales log entry
    if (btn.id === 'add-log-btn' && caseId) {
      const timeInput = document.getElementById('log-time-input');
      const countInput = document.getElementById('log-count-input');
      if (!timeInput || !countInput) return;
      const time = timeInput.value.trim();
      const count = parseInt(countInput.value);
      if (!time || isNaN(count)) {
        alert('時刻と販売数を入力してください');
        return;
      }
      const caseData = Storage.getById(caseId);
      if (caseData) {
        caseData.phase3 = caseData.phase3 || { salesLog: [] };
        caseData.phase3.salesLog = caseData.phase3.salesLog || [];
        caseData.phase3.salesLog.push({ time, count });
        caseData.phase3.salesLog.sort((a, b) => {
          const toMins = s => {
            const [h, m] = s.split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
          };
          return toMins(a.time) - toMins(b.time);
        });
        Storage.save(caseData);
        timeInput.value = '';
        countInput.value = '';
        this.refreshSalesLog(caseData);
        this.showSavedIndicator();
      }
      return;
    }

    // Remove sales log entry
    if (btn.dataset.removeLog !== undefined && caseId) {
      const idx = parseInt(btn.dataset.removeLog);
      const caseData = Storage.getById(caseId);
      if (caseData && caseData.phase3) {
        caseData.phase3.salesLog.splice(idx, 1);
        Storage.save(caseData);
        this.refreshSalesLog(caseData);
      }
      return;
    }

    // CSV export
    if (btn.id === 'export-csv-btn' && caseId) {
      this.exportCSV(caseId);
      return;
    }

    // AI auto-score
    if (btn.id === 'auto-score-btn' && caseId) {
      this.openAutoScoreModal(caseId);
      return;
    }

    // Copy influencer sheet
    if (btn.id === 'copy-sheet-btn') {
      const sheetEl = document.getElementById('influencer-sheet');
      if (sheetEl) {
        Share.copyToClipboard(sheetEl.textContent).then(() => {
          btn.textContent = '✅ コピーしました！';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '📋 テキストをコピー';
            btn.classList.remove('copied');
          }, 2000);
        });
      }
      return;
    }
  },

  /* ── Emergency contacts: listen to individual field inputs ── */
  scheduleAutoSave(caseId) {
    if (!caseId) return;
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveFromDOM(caseId);
    }, 600);
  },

  saveFromDOM(caseId) {
    const caseData = Storage.getById(caseId);
    if (!caseData) return;

    // Save Phase 0 text fields (already handled in change event, but text inputs need this)
    document.querySelectorAll(`[data-case-id="${caseId}"][data-field]`).forEach(el => {
      const field = el.dataset.field;
      const phase = el.closest('[data-phase]')?.dataset.phase;
      if (phase === 'phase0') {
        if (field.startsWith('ec_')) {
          // Emergency contact field: ec_name_0, ec_role_0, ec_phone_0
          const parts = field.split('_');
          const idx = parseInt(parts[parts.length - 1]);
          const prop = parts.slice(1, -1).join('_');
          if (!isNaN(idx)) {
            caseData.phase0 = caseData.phase0 || {};
            caseData.phase0.emergency_contacts = caseData.phase0.emergency_contacts || [];
            while (caseData.phase0.emergency_contacts.length <= idx) {
              caseData.phase0.emergency_contacts.push({ name: '', role: '', phone: '' });
            }
            caseData.phase0.emergency_contacts[idx][prop] = el.value;
          }
        } else {
          caseData.phase0 = caseData.phase0 || {};
          caseData.phase0[field] = el.value;
        }
      } else if (phase === 'phase4') {
        caseData.phase4 = caseData.phase4 || {};
        caseData.phase4[field] = el.value;
      }
    });

    Storage.save(caseData);
    this.showSavedIndicator();
  },

  saveAndNotify(caseData) {
    Storage.save(caseData);
    this.showSavedIndicator();
  },

  showSavedIndicator() {
    const indicators = document.querySelectorAll('.save-indicator');
    indicators.forEach(ind => {
      ind.classList.add('visible');
      clearTimeout(ind._timeout);
      ind._timeout = setTimeout(() => ind.classList.remove('visible'), 2000);
    });
  },

  refreshContactList(caseData) {
    const container = document.getElementById('contact-list');
    if (!container) return;
    const contacts = caseData.phase0.emergency_contacts || [];
    container.innerHTML = contacts.map((c, i) => `
      <div class="contact-row" data-contact-idx="${i}">
        <input type="text" class="form-control" placeholder="担当者名" data-case-id="${esc(caseData.id)}" data-field="ec_name_${i}" value="${esc(c.name)}">
        <input type="text" class="form-control" placeholder="役割" data-case-id="${esc(caseData.id)}" data-field="ec_role_${i}" value="${esc(c.role)}">
        <input type="text" class="form-control" placeholder="電話番号" data-case-id="${esc(caseData.id)}" data-field="ec_phone_${i}" value="${esc(c.phone)}">
        <button type="button" class="btn btn-ghost btn-sm" data-remove-contact="${i}" data-case-id="${esc(caseData.id)}" title="削除">✕</button>
      </div>`).join('');
  },

  refreshSalesLog(caseData) {
    const p3 = caseData.phase3 || {};
    const log = p3.salesLog || [];
    const noveltyCount = parseInt((caseData.phase0 || {}).novelty_count || 0);
    const tbody = document.getElementById('sales-log-tbody');
    if (tbody) {
      tbody.innerHTML = log.map((entry, i) => {
        const prev = i > 0 ? log[i - 1].count : 0;
        const diff = entry.count - prev;
        return `<tr>
          <td>${esc(entry.time)}</td>
          <td><strong>${Number(entry.count).toLocaleString()}</strong></td>
          <td style="color:${diff > 0 ? '#16a34a' : '#64748b'}">+${diff.toLocaleString()}</td>
          <td>${noveltyCount ? Math.max(0, noveltyCount - entry.count).toLocaleString() : '—'}</td>
          <td><button type="button" class="btn btn-ghost btn-sm" data-remove-log="${i}" data-case-id="${esc(caseData.id)}">✕</button></td>
        </tr>`;
      }).join('');
    }
    // Reinit chart
    requestAnimationFrame(() => Phases.initPhase3Chart(caseData));
    // Update stats
    const lastCount = log.length ? log[log.length - 1].count : 0;
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards[0]) statCards[0].textContent = lastCount.toLocaleString();
    if (statCards[1] && noveltyCount) {
      const rem = Math.max(0, noveltyCount - lastCount);
      statCards[1].textContent = rem.toLocaleString();
      statCards[1].style.color = rem === 0 ? '#dc2626' : 'var(--navy)';
    }
  },

  /* AI自動判定 */
  openAutoScoreModal(caseId) {
    const caseData = Storage.getById(caseId);
    if (!caseData) return;
    const p0 = caseData.phase0 || {};
    const contacts = p0.emergency_contacts || [];
    const validContacts = contacts.filter(c => c.name && c.name.trim());

    // アップレート率記述のパース
    const parseApproval = v => {
      if (!v) return 0;
      const m = String(v).match(/(\d+)/);
      return m ? parseFloat(m[1]) : 0;
    };

    // 即STOP判定ルール
    const stopRules = {
      conversion_point_confirmed:        { check: () => !!p0.conversion_point,           reason: '計上ポイント（Phase 0）が未入力' },
      rejection_conditions_clear:        { check: () => !!p0.rejection_conditions,       reason: '否認条件（Phase 0）が未入力' },
      point_deduction_policy_confirmed:  { check: () => !!p0.point_deduction_policy,     reason: 'ポイント控除ポリシーが未入力' },
      payment_cycle_confirmed:           { check: () => !!(p0.payment_closing && p0.payment_date), reason: '締日・支払日（Phase 0）が未入力' },
      approval_rate_disclosed:           { check: () => !!p0.approval_rate,              reason: '承認率が未入力' },
      sales_cap_over_policy_confirmed:   { check: () => !!p0.stock_count,               reason: '在庫数が未入力' },
      coupon_operation_verified:         { check: () => !!p0.platform_coupon_applicable, reason: 'クーポン適用可否が未選択' },
      price_display_matches_checkout:    { check: () => !!p0.price_sale,                reason: '販売価格（Phase 0）が未入力' },
      server_load_verified:              { check: () => !!p0.lp_url,                    reason: 'LP URLが未入力' },
      tracking_tag_installed:            { check: () => !!p0.tracking_method,           reason: '計測方法が未入力' },
      stock_confirmed:                   { check: () => parseInt(p0.stock_count || 0) > 0, reason: '在庫数が0または未入力' },
      shipping_lead_confirmed:           { check: () => !!p0.shipping_lead_time,        reason: '出荷リードタイムが未入力' },
      stockout_policy_confirmed:         { check: () => !!p0.return_policy,             reason: '返品・在庫対応ポリシーが未入力' },
      cs_contact_ready:                  { check: () => !!p0.cs_contact,               reason: 'CS連絡先が未入力' },
      return_flow_clear:                 { check: () => !!p0.return_policy,             reason: '返品・解約導線が未入力' },
      incident_response_confirmed:       { check: () => validContacts.length >= 2,      reason: '緊急連絡先が2名未満' },
      pr_rule_confirmed:                 { check: () => !!p0.pr_tag_rule,              reason: 'PR表記ルールが未入力' },
      pharma_law_checked:                { check: () => !!p0.ng_expressions,           reason: 'NG表現・薬機法確認が未入力' },
      ng_expressions_shared:             { check: () => !!p0.ng_expressions,           reason: 'NG表現が未入力' },
      material_usage_clear:              { check: () => !!p0.material_usage_restrictions, reason: '素材使用制限が未入力' },
      emergency_contacts_confirmed:      { check: () => validContacts.length >= 3,      reason: '緊急連絡先が3名未満' },
      sales_report_schedule_agreed:      { check: () => p0.sales_report_phases_agreed === 'yes', reason: '売上報告スケジュールが「対応可能」になっていない' }
    };

    // 要注意判定ルール
    const cautionRules = {
      approval_rate_80plus:      { check: () => parseApproval(p0.approval_rate) >= 80,   reason: '承認率が80%未満または不明' },
      payment_60days_or_less:    { check: () => parseInt(p0.payment_cycle || 999) <= 60, reason: '支払サイクルが60日超える' },
      price_attractive:          { check: () => parseFloat(p0.discount_rate || 0) >= 40, reason: '割引率が40%未満' },
      lp_speed_ok:               { check: () => !!p0.lp_url,                             reason: 'LP URLが未入力' },
      guest_purchase_available:  { check: () => ['\u697d\u5929','Qoo10','Amazon','Yahoo'].some(s => (p0.sales_site||'').includes(s)), reason: '大手プラットフォーム以外の場合、ゲスト購入可否を確認' },
      smartphone_ui_ok:          { check: () => !!p0.lp_url,                             reason: 'LPのスマホ UIを目視確認' },
      stock_sufficient:          { check: () => parseInt(p0.stock_count || 0) >= 3000,  reason: '在庫数が3,000未満' },
      novelty_restocking_fast:   { check: () => !!p0.novelty_count,                      reason: 'ノベルティ数が未入力' },
      no_delivery_delay:         { check: () => (p0.shipping_lead_time||'').includes('\u55b6\u696d\u65e5'), reason: '出荷リードタイムに「\u55b6\u696d\u65e5\u300d記載なし' },
      cs_hours_sufficient:       { check: () => !!p0.cs_contact,                         reason: 'CS連絡先が未入力' },
      gifting_available:         { check: () => parseInt(p0.novelty_count || 0) > 0,    reason: 'ノベルティなし' },
      materials_sufficient:      { check: () => !!p0.material_usage_restrictions,        reason: '素材使用制限が未入力' },
      draft_check_ok:            { check: () => p0.draft_check_required === 'yes',       reason: '下書きチェックが「不要」' },
      competitor_ng_reasonable:  { check: () => !!p0.competitor_ng,                      reason: '競合NGfangesが未入力' },
      low_incident_risk:         { check: () => !!p0.ng_expressions,                     reason: 'NG表現が未入力' },
      influencer_confirmed:      { check: () => !!caseData.influencer,                   reason: 'タレント名が未入力' },
      holiday_support_ok:        { check: () => p0.holiday_support_ok === 'yes',         reason: '休日・深夜対応が「不可」' },
      contact_responsive:        { check: () => validContacts.length >= 2,               reason: '緊急連絡先が2名未満' }
    };

    // 判定実行
    const stopResults = {};
    const cautionResults = {};
    Object.entries(stopRules).forEach(([k, r]) => { stopResults[k] = { pass: r.check(), reason: r.reason }; });
    Object.entries(cautionRules).forEach(([k, r]) => { cautionResults[k] = { pass: r.check(), reason: r.reason }; });

    const stopPass  = Object.values(stopResults).filter(r => r.pass).length;
    const stopTotal = Object.keys(stopRules).length;
    const cautionFail = Object.values(cautionResults).filter(r => !r.pass).length;
    const allStopOk = stopPass === stopTotal;
    const judgment = !allStopOk ? 'D' : cautionFail <= 2 ? 'A' : cautionFail <= 6 ? 'B' : 'C';
    const jColors  = { A:'#166534', B:'#1d4ed8', C:'#854d0e', D:'#991b1b' };
    const jBgs     = { A:'#dcfce7', B:'#dbeafe', C:'#fef9c3', D:'#fee2e2' };
    const jLabels  = { A:'GO（最良）', B:'GO（条件付き）', C:'要再確認', D:'STOP' };

    const stopFails = Object.entries(stopResults).filter(([, r]) => !r.pass)
      .map(([k, r]) => `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid #fee2e2">
        <span style="color:#dc2626;flex-shrink:0">❌</span>
        <span style="font-size:12px;color:#1e293b">${esc(r.reason)}</span>
      </div>`).join('');
    const cautionFails = Object.entries(cautionResults).filter(([, r]) => !r.pass)
      .map(([k, r]) => `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid #fef9c3">
        <span style="color:#d97706;flex-shrink:0">⚠️</span>
        <span style="font-size:12px;color:#1e293b">${esc(r.reason)}</span>
      </div>`).join('');

    const existing = document.getElementById('auto-score-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'auto-score-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>🤖 自動判定結果</h2>
          <button type="button" id="close-auto-score" class="btn btn-ghost">✕</button>
        </div>
        <div class="modal-body">
          <div style="background:${jBgs[judgment]};border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
            <div style="font-size:40px;font-weight:900;color:${jColors[judgment]}">${judgment}</div>
            <div>
              <div style="font-size:15px;font-weight:700;color:${jColors[judgment]}">${jLabels[judgment]}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">即STOP: ${stopPass}/${stopTotal}項目クリア　要注意: ${cautionFail}項目未クリア</div>
            </div>
          </div>
          ${stopFails ? `
          <div style="margin-bottom:14px">
            <div style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:6px">🔴 未クリアの即STOP項目</div>
            <div style="background:#fff5f5;border:1.5px solid #fecaca;border-radius:8px;padding:8px 12px">${stopFails}</div>
          </div>` : '<div style="color:#16a34a;font-size:13px;font-weight:600;margin-bottom:14px">✅ 即STOP項目は全てクリアです</div>'}
          ${cautionFails ? `
          <div style="margin-bottom:14px">
            <div style="font-size:12px;font-weight:700;color:#d97706;margin-bottom:6px">⚠️ 要注意項目（${cautionFail}件）</div>
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px;padding:8px 12px">${cautionFails}</div>
          </div>` : ''}
        </div>
        <div class="modal-footer">
          <button type="button" id="close-auto-score-2" class="btn btn-outline">閉じる</button>
          <button type="button" id="apply-auto-score" data-case-id="${esc(caseId)}" class="btn btn-primary">💾 Phase 1に適用する</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#close-auto-score').addEventListener('click', closeModal);
    modal.querySelector('#close-auto-score-2').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    modal.querySelector('#apply-auto-score').addEventListener('click', () => {
      const cd = Storage.getById(caseId);
      if (!cd) return;
      cd.phase1 = cd.phase1 || { stop_items: {}, caution_items: {} };
      Object.entries(stopResults).forEach(([k, r]) => { cd.phase1.stop_items[k] = r.pass; });
      Object.entries(cautionResults).forEach(([k, r]) => { cd.phase1.caution_items[k] = r.pass; });
      cd.judgment = judgment;
      Storage.save(cd);
      closeModal();
      this.renderCaseDetail(caseId, 'phase1');
    });
  },

  /* リアルタイム報酬計算 */
  updateRevenueDisplay(caseId) {
    const caseData = Storage.getById(caseId);
    if (!caseData) return;
    const p0 = caseData.phase0 || {};
    const p4 = caseData.phase4 || {};

    // DOMから最新値を取得
    const approvedEl = document.querySelector(`[data-case-id="${caseId}"][data-field="approvedCount"]`);
    const approved = approvedEl ? parseInt(approvedEl.value || 0) : parseInt(p4.approvedCount || 0);

    const clientRate = parseFloat(p0.client_reward_rate || 0) / 100;
    const infRate    = parseFloat(p0.influencer_reward_rate || p0.reward_rate || 0) / 100;
    const price      = parseFloat(p0.price_sale || 0);

    const clientRevenue = Math.round(approved * price * clientRate);
    const infRevenue    = Math.round(approved * price * infRate);
    const gvaMargin     = clientRevenue - infRevenue;
    const fmt = n => '\u00a5' + n.toLocaleString('ja-JP');

    const revBox = document.getElementById('phase4-revenue-box');
    if (!revBox || !approved || !price) return;

    revBox.innerHTML = `
      <div class="revenue-card client">
        <div class="revenue-title">👔 クライアント請求額（${p0.client_reward_rate || 0}%）</div>
        <div class="revenue-amount" id="rt-client">${fmt(clientRevenue)}</div>
        <div style="font-size:12px;color:#1d4ed8;margin-top:4px">
          = ${approved.toLocaleString()} 件 × ${fmt(price)} × ${p0.client_reward_rate || 0}%
        </div>
      </div>
      <div class="revenue-card influencer">
        <div class="revenue-title">⭐ インフル支払額（${p0.influencer_reward_rate || p0.reward_rate || 0}%）</div>
        <div class="revenue-amount" id="rt-influencer">${fmt(infRevenue)}</div>
        <div style="font-size:12px;color:#166534;margin-top:4px">
          = ${approved.toLocaleString()} 件 × ${fmt(price)} × ${p0.influencer_reward_rate || p0.reward_rate || 0}%
        </div>
      </div>
      <div class="revenue-card gva">
        <div class="revenue-title">🏢 マージン（内部管理）</div>
        <div class="revenue-amount" id="rt-margin">${fmt(gvaMargin)}</div>
        <div style="font-size:12px;color:#92400e;margin-top:4px">クライアント請求 − インフル支払</div>
      </div>`;
  },

  exportCSV(caseId) {
    const caseData = Storage.getById(caseId);
    if (!caseData) return;
    const log = (caseData.phase3 || {}).salesLog || [];
    const noveltyCount = parseInt((caseData.phase0 || {}).novelty_count || 0);
    const rows = [['時刻', '累計販売数', '増分', '先着残り']];
    log.forEach((e, i) => {
      const prev = i > 0 ? log[i - 1].count : 0;
      const diff = e.count - prev;
      const rem = noveltyCount ? Math.max(0, noveltyCount - e.count) : '';
      rows.push([e.time, e.count, diff, rem]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.name}_売上ログ.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /* ── Talent Performance DB ── */
  renderTalents() {
    const cases = Storage.getAll();
    const mc = document.getElementById('main-content');
    if (!mc) return;

    // Group by influencer
    const talentMap = {};
    for (const c of cases) {
      const name = c.influencer || '未設定';
      const ig = c.influencer_ig || '';
      if (!talentMap[name]) talentMap[name] = { name, ig, cases: [] };
      talentMap[name].cases.push(c);
    }
    const talents = Object.values(talentMap);

    // Summary stats
    const totalSales = cases.reduce((s, c) => s + parseInt((c.phase4 || {}).finalSales || 0), 0);
    const totalRevenue = cases.reduce((s, c) => {
      const p0 = c.phase0 || {}, p4 = c.phase4 || {};
      const rate = parseFloat(p0.client_reward_rate || 0) / 100;
      const price = parseFloat(p0.price_sale || 0);
      const approved = parseInt(p4.approvedCount || 0);
      return s + Math.round(approved * price * rate);
    }, 0);

    const cards = talents.map(t => {
      const totalTalentSales = t.cases.reduce((s, c) => s + parseInt((c.phase4 || {}).finalSales || 0), 0);
      const approvalRates = t.cases
        .filter(c => parseInt((c.phase4 || {}).finalSales) > 0)
        .map(c => parseInt((c.phase4 || {}).approvedCount || 0) / parseInt((c.phase4 || {}).finalSales || 1) * 100);
      const avgApproval = approvalRates.length ? (approvalRates.reduce((s, r) => s + r, 0) / approvalRates.length).toFixed(0) + '%' : '—';

      const platforms = t.cases.map(c => c.platform || '').filter(p => p);
      const platformCount = {};
      platforms.forEach(p => platformCount[p] = (platformCount[p] || 0) + 1);
      const topPlatform = Object.entries(platformCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      const bestCase = [...t.cases].sort((a, b) => parseInt((b.phase4 || {}).finalSales || 0) - parseInt((a.phase4 || {}).finalSales || 0))[0];
      const bestSales = parseInt((bestCase?.phase4 || {}).finalSales || 0);

      return `
        <div class="talent-card" data-influencer="${esc(t.name)}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
            <div>
              <div class="talent-name">${esc(t.name)}</div>
              ${t.ig ? `<a href="https://instagram.com/${esc(t.ig)}" target="_blank" class="talent-ig" onclick="event.stopPropagation()">@${esc(t.ig)}</a>` : '<span style="font-size:12px;color:#94a3b8">IG未設定</span>'}
            </div>
            <span style="font-size:28px;line-height:1">⭐</span>
          </div>
          <div class="talent-stats">
            <div class="talent-stat">
              <div class="talent-stat-label">総案件数</div>
              <div class="talent-stat-value">${t.cases.length}</div>
            </div>
            <div class="talent-stat">
              <div class="talent-stat-label">総販売数</div>
              <div class="talent-stat-value">${totalTalentSales.toLocaleString()}</div>
            </div>
            <div class="talent-stat">
              <div class="talent-stat-label">平均承認率</div>
              <div class="talent-stat-value" style="font-size:16px">${avgApproval}</div>
            </div>
            <div class="talent-stat">
              <div class="talent-stat-label">最多プラットフォーム</div>
              <div class="talent-stat-value" style="font-size:13px">${esc(topPlatform)}</div>
            </div>
          </div>
          ${bestSales > 0 ? `
          <div class="talent-best-case">
            <div class="talent-best-case-label">🏆 ベスト案件</div>
            <div class="talent-best-case-name">${esc(bestCase.name)}</div>
            <div style="font-size:12px;color:#0f766e;margin-top:4px">${bestSales.toLocaleString()} セット販売</div>
          </div>` : ''}
          <button class="btn btn-outline btn-sm" style="width:100%" onclick="event.stopPropagation();App.filterByTalent('${esc(t.name)}')"　>案件を見る →</button>
        </div>`;
    }).join('');

    mc.innerHTML = `
      <div class="fade-in">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:var(--navy);margin:0">実績ダッシュボード</h1>
            <p style="font-size:13px;color:#64748b;margin:4px 0 0">タレント・ブランド別の実績まとめ</p>
          </div>
          <div style="display:flex;gap:8px">
            <button type="button" id="view-talent-btn" class="btn btn-primary btn-sm">⭐ タレント別</button>
            <button type="button" id="view-brand-btn" class="btn btn-outline btn-sm">🏷 ブランド別</button>
          </div>
        </div>
        <div id="stats-talent-view">
          <!-- タレント別（既存） -->
        <div class="talent-summary-stats">
          <div class="stat-card">
            <div class="stat-label">総タレント数</div>
            <div class="stat-value">${talents.length}</div>
            <div class="stat-sub">人</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">総案件数</div>
            <div class="stat-value">${cases.length}</div>
            <div class="stat-sub">件</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">総販売セット数</div>
            <div class="stat-value">${totalSales.toLocaleString()}</div>
            <div class="stat-sub">セット</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">総売上（推計）</div>
            <div class="stat-value" style="font-size:20px">¥${totalRevenue.toLocaleString()}</div>
            <div class="stat-sub">円</div>
          </div>
        </div>
        ${talents.length === 0 ? '<div style="text-align:center;padding:40px;color:#94a3b8">タレントデータがありません</div>'
          : `<div class="talent-grid">${cards}</div>`}
        </div><!-- end stats-talent-view -->

        <div id="stats-brand-view" style="display:none">
          ${this.renderBrandSummary(cases)}
        </div>
      </div>`;

    // Tab toggle handlers
    mc.querySelector('#view-talent-btn').addEventListener('click', () => {
      mc.querySelector('#stats-talent-view').style.display = '';
      mc.querySelector('#stats-brand-view').style.display = 'none';
      mc.querySelector('#view-talent-btn').className = 'btn btn-primary btn-sm';
      mc.querySelector('#view-brand-btn').className = 'btn btn-outline btn-sm';
    });
    mc.querySelector('#view-brand-btn').addEventListener('click', () => {
      mc.querySelector('#stats-talent-view').style.display = 'none';
      mc.querySelector('#stats-brand-view').style.display = '';
      mc.querySelector('#view-talent-btn').className = 'btn btn-outline btn-sm';
      mc.querySelector('#view-brand-btn').className = 'btn btn-primary btn-sm';
    });
  },

  renderBrandSummary(cases) {
    const brandMap = {};
    for (const c of cases) {
      const brand = c.brand || '未設定';
      if (!brandMap[brand]) brandMap[brand] = { brand, cases: [] };
      brandMap[brand].cases.push(c);
    }
    const brands = Object.values(brandMap).sort((a, b) => b.cases.length - a.cases.length);
    if (!brands.length) return '<div style="text-align:center;padding:40px;color:#94a3b8">ブランドデータがありません</div>';

    const rows = brands.map(b => {
      const totalSales = b.cases.reduce((s, c) => s + parseInt((c.phase4||{}).finalSales||0), 0);
      const doneCases = b.cases.filter(c => c.status === 'done');
      const judgments = b.cases.map(c => c.judgment).filter(j => j && j !== 'pending');
      const jCount = { A:0, B:0, C:0, D:0 };
      judgments.forEach(j => { if (jCount[j] !== undefined) jCount[j]++; });
      const jBadges = ['A','B','C','D'].filter(j => jCount[j] > 0)
        .map(j => `<span class="badge badge-${j}" style="font-size:11px">${j}:${jCount[j]}</span>`).join(' ');
      const platforms = [...new Set(b.cases.map(c => c.platform).filter(Boolean))].join(' / ');
      return `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:10px 12px;font-weight:700;color:var(--navy)">${esc(b.brand)}</td>
          <td style="padding:10px 12px;text-align:center">${b.cases.length}</td>
          <td style="padding:10px 12px;text-align:center">${doneCases.length}</td>
          <td style="padding:10px 12px;font-weight:700;color:var(--teal)">${totalSales > 0 ? totalSales.toLocaleString() : '—'}</td>
          <td style="padding:10px 12px">${jBadges || '—'}</td>
          <td style="padding:10px 12px;font-size:12px;color:#64748b">${esc(platforms) || '—'}</td>
        </tr>`;
    }).join('');

    return `
      <div class="card">
        <div class="card-header"><h3>🏷 ブランド別実績</h3></div>
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f8fafc;font-size:11px;color:#64748b">
              <th style="padding:8px 12px;text-align:left">ブランド</th>
              <th style="padding:8px 12px;text-align:center">案件数</th>
              <th style="padding:8px 12px;text-align:center">完了</th>
              <th style="padding:8px 12px;text-align:left">累計販売</th>
              <th style="padding:8px 12px;text-align:left">判定</th>
              <th style="padding:8px 12px;text-align:left">プラット</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  },

  openTalentDetailModal(influencer) {
    const cases = Storage.getAll().filter(c => c.influencer === influencer);
    if (!cases.length) return;
    const ig = cases[0].influencer_ig || '';

    const caseRows = cases.map(c => {
      const p4 = c.phase4 || {};
      const sales = parseInt(p4.finalSales || 0);
      const approved = parseInt(p4.approvedCount || 0);
      const statusMap = { phase0:'ヒアリング中', phase1:'GO/STOP判定', phase2:'実施準備中', phase3:'当日運用中', phase4:'精算中', done:'完了' };
      return `<tr>
        <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">${esc(c.name)}</td>
        <td style="padding:8px 12px;font-size:12px;color:#64748b;border-bottom:1px solid #f1f5f9">${esc(c.platform)}</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;color:var(--navy);border-bottom:1px solid #f1f5f9">${sales > 0 ? sales.toLocaleString() : '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9"><span class="badge badge-${c.status === 'done' ? 'done' : c.status}">${statusMap[c.status] || c.status}</span></td>
      </tr>`;
    }).join('');

    const chartLabels = cases.map(c => c.name.length > 12 ? c.name.substring(0, 12) + '…' : c.name);
    const chartData = cases.map(c => parseInt((c.phase4 || {}).finalSales || 0));

    const existing = document.getElementById('talent-detail-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'talent-detail-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:680px">
        <div class="modal-header">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:var(--navy);margin:0">⭐ ${esc(influencer)}</h2>
            ${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" style="font-size:12px;color:var(--teal);text-decoration:none">@${esc(ig)}</a>` : ''}
          </div>
          <button type="button" id="close-talent-modal" class="btn btn-ghost">✕</button>
        </div>
        <div class="modal-body">
          <div class="card" style="margin-bottom:16px">
            <div class="card-header"><h3>📊 案件別販売数</h3></div>
            <div class="card-body">
              <div style="height:200px"><canvas id="talent-sales-chart"></canvas></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>📋 案件一覧</h3></div>
            <div class="card-body" style="padding:0;overflow-x:auto">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f8fafc">
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:left;border-bottom:2px solid #e2e8f0">案件名</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:left;border-bottom:2px solid #e2e8f0">プラットフォーム</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:left;border-bottom:2px solid #e2e8f0">販売数</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:left;border-bottom:2px solid #e2e8f0">ステータス</th>
                  </tr>
                </thead>
                <tbody>${caseRows}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="close-talent-modal-2">閉じる</button>
          <button type="button" class="btn btn-primary" onclick="App.filterByTalent('${esc(influencer)}');document.getElementById('talent-detail-modal').remove()">案件一覧を見る</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    // Init chart
    requestAnimationFrame(() => {
      const canvas = document.getElementById('talent-sales-chart');
      if (canvas && typeof Chart !== 'undefined') {
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: chartLabels,
            datasets: [{ label: '販売数', data: chartData, backgroundColor: 'rgba(13,148,136,0.7)', borderColor: '#0d9488', borderWidth: 1, borderRadius: 4 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { font: { size: 10 }, maxRotation: 30 } },
              y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString(), font: { size: 10 } } }
            }
          }
        });
      }
    });

    const close = () => modal.remove();
    modal.querySelector('#close-talent-modal').addEventListener('click', close);
    modal.querySelector('#close-talent-modal-2').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  },

  /* ── Calendar View ── */
  renderCalendar() {
    const mc = document.getElementById('main-content');
    if (!mc) return;

    if (this.calendarYear === null) {
      const n = new Date();
      this.calendarYear = n.getFullYear();
      this.calendarMonth = n.getMonth(); // 0-indexed
    }
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const cases = Storage.getAll();

    // Aggregate events by date
    const events = {};
    const addEvent = (dateStr, ev) => {
      if (!dateStr) return;
      const key = String(dateStr).substring(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}/.test(key)) return;
      if (!events[key]) events[key] = [];
      events[key].push(ev);
    };

    // Conflict detection: find case IDs with overlapping periods for same influencer
    const conflictIds = new Set();
    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const ci = cases[i], cj = cases[j];
        if (!ci.influencer || ci.influencer !== cj.influencer) continue;
        const p0i = ci.phase0 || {}, p0j = cj.phase0 || {};
        if (!p0i.period_start || !p0i.period_end || !p0j.period_start || !p0j.period_end) continue;
        const si = new Date(p0i.period_start), ei = new Date(p0i.period_end);
        const sj = new Date(p0j.period_start), ej = new Date(p0j.period_end);
        if (si <= ej && sj <= ei) { conflictIds.add(ci.id); conflictIds.add(cj.id); }
      }
    }

    for (const c of cases) {
      const p0 = c.phase0 || {};
      const isConflict = conflictIds.has(c.id);
      const base = { caseName: c.name, influencer: c.influencer || '', caseId: c.id, conflict: isConflict };
      if (p0.post_start_date)   addEvent(p0.post_start_date,   { ...base, type: 'post-start', label: '📝 投稿開始' });
      if (p0.period_start)      addEvent(p0.period_start,      { ...base, type: 'sale-start',  label: '🔴 販売開始' });
      if (p0.period_end)        addEvent(p0.period_end,        { ...base, type: 'sale-end',    label: '🔵 販売終了' });
      if (p0.platform_deadline) addEvent(p0.platform_deadline, { ...base, type: 'deadline',    label: '⏰ 申請期限' });
    }

    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const dayNames = ['月','火','水','木','金','土','日'];
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    let startOffset = firstDay.getDay() - 1; // Mon=0
    if (startOffset < 0) startOffset = 6;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // Build cells
    const cells = [];
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) cells.push({ day: prevLastDay - i, other: true, dateStr: null });
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells.push({ day: d, other: false, dateStr, isToday: dateStr === todayStr });
    }
    const rem = 7 - (cells.length % 7);
    if (rem < 7) for (let d = 1; d <= rem; d++) cells.push({ day: d, other: true, dateStr: null });

    // Render grid cells
    const gridCells = cells.map(cell => {
      const dayEvents = cell.dateStr ? (events[cell.dateStr] || []) : [];
      const cls = ['calendar-day', cell.other ? 'other-month' : '', cell.isToday ? 'today' : ''].filter(Boolean).join(' ');
      const evHtml = dayEvents.slice(0, 3).map(ev => {
        const evType = ev.conflict ? 'conflict' : ev.type;
        const evJson = JSON.stringify({ type: ev.type, caseName: ev.caseName, influencer: ev.influencer, label: ev.label, conflict: ev.conflict });
        const short = ev.caseName.length > 10 ? ev.caseName.substring(0, 10) + '…' : ev.caseName;
        return `<span class="cal-event ${evType}" data-event="${esc(evJson)}">${esc(short)}</span>`;
      }).join('');
      const more = dayEvents.length > 3 ? `<span style="font-size:9px;color:#94a3b8">+${dayEvents.length - 3}</span>` : '';
      return `<div class="${cls}"><div class="calendar-day-num">${cell.day}</div>${evHtml}${more}</div>`;
    }).join('');

    // Render timeline for mobile (this month events sorted by date)
    const monthEvents = {};
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (events[dateStr] && events[dateStr].length) monthEvents[dateStr] = events[dateStr];
    }
    const timelineHtml = Object.entries(monthEvents).sort((a, b) => a[0].localeCompare(b[0])).map(([dateStr, evs]) => {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const dateLabel = dateObj.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
      const evRows = evs.map(ev => `<div class="cal-timeline-event ${ev.conflict ? 'conflict' : ev.type}">
        <span style="font-size:14px;line-height:1">${ev.label.substring(0, 2)}</span>
        <div><div style="font-weight:600">${esc(ev.caseName)}</div><div style="font-size:11px;opacity:0.8">${esc(ev.influencer)}</div></div>
      </div>`).join('');
      return `<div class="cal-timeline-day"><div class="cal-timeline-date">${dateLabel}</div><div class="cal-timeline-events">${evRows}</div></div>`;
    }).join('');

    // Conflict warning
    const conflictWarning = conflictIds.size > 0
      ? `<div class="conflict-warning">⚠️ 同じインフルエンサーに期間が重なる案件があります。該当イベントは黄色で表示されます。</div>`
      : '';

    mc.innerHTML = `
      <div class="fade-in">
        <div class="calendar-header">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:var(--navy);margin:0">📅 カレンダー</h1>
            <p style="font-size:13px;color:#64748b;margin:4px 0 0">案件日程一覧</p>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <button class="btn btn-outline btn-sm" id="cal-nav-prev">← 前月</button>
            <span class="calendar-title">${year}年${monthNames[month]}</span>
            <button class="btn btn-outline btn-sm" id="cal-nav-next">翌月 →</button>
          </div>
        </div>
        ${conflictWarning}
        <!-- Desktop grid -->
        <div class="calendar-wrapper">
          <div class="calendar-day-headers">${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}</div>
          <div class="calendar-grid">${gridCells}</div>
        </div>
        <!-- Mobile timeline -->
        <div class="cal-timeline">
          ${Object.keys(monthEvents).length === 0 ? '<div style="text-align:center;padding:40px;color:#94a3b8">この月のイベントはありません</div>' : timelineHtml}
        </div>
        <!-- Legend -->
        <div class="calendar-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#ccfbf1"></div>📝 投稿開始日</div>
          <div class="legend-item"><div class="legend-dot" style="background:#fee2e2"></div>🔴 販売開始</div>
          <div class="legend-item"><div class="legend-dot" style="background:#dbeafe"></div>🔵 販売終了</div>
          <div class="legend-item"><div class="legend-dot" style="background:#fed7aa"></div>⏰ 申請期限</div>
          <div class="legend-item"><div class="legend-dot" style="background:#fef9c3"></div>⚠️ スケジュール重複</div>
        </div>
      </div>`;

    // Click anywhere to close popup
    document.addEventListener('click', () => {
      const p = document.getElementById('cal-popup');
      if (p) p.remove();
    }, { once: true, capture: true });
  },

  showCalEventPopup(data, x, y) {
    const existing = document.getElementById('cal-popup');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'cal-popup';
    popup.className = 'cal-popup';
    const typeLabel = { 'post-start': '📝 投稿開始', 'sale-start': '🔴 販売開始', 'sale-end': '🔵 販売終了', 'deadline': '⏰ 申請期限' };
    popup.innerHTML = `
      <div class="cal-popup-type">${esc(typeLabel[data.type] || data.type)}</div>
      <div class="cal-popup-name">${esc(data.caseName)}</div>
      <div class="cal-popup-inf">⭐ ${esc(data.influencer)}</div>
      ${data.conflict ? '<div style="font-size:11px;color:#854d0e;margin-top:6px;background:#fef9c3;padding:4px 8px;border-radius:6px">⚠️ スケジュール重複あり</div>' : ''}`;
    popup.style.left = Math.min(x + 8, window.innerWidth - 300) + 'px';
    popup.style.top = Math.min(y + 8, window.innerHeight - 160) + 'px';
    document.body.appendChild(popup);
  },

  /* ── Brand Form URL Modal ── */
  openFormUrlModal(caseId) {
    const caseData = Storage.getById(caseId);
    if (!caseData) return;
    const existing = document.getElementById('form-url-modal');
    if (existing) existing.remove();
    const baseUrl = location.href.replace(location.hash, '').replace('index.html', '');
    const formUrl = `${baseUrl}form.html?id=${encodeURIComponent(caseId)}`;
    const modal = document.createElement('div');
    modal.id = 'form-url-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:480px">
        <div class="modal-header">
          <h2>📋 ブランド向けヒアリングフォーム</h2>
          <button type="button" id="close-form-url-modal" class="btn btn-ghost">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size:13px;color:#64748b;margin:0 0 12px">以下のURLをブランド担当者に共有してください。ブランドが入力すると自動でPhase 0に保存されます。</p>
          <div class="form-url-box" id="form-url-text">${esc(formUrl)}</div>
          <button type="button" class="btn-copy" id="copy-form-url-btn">📋 URLをコピー</button>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="close-form-url-modal-2">閉じる</button>
          <a href="${esc(formUrl)}" target="_blank" class="btn btn-primary">🔗 フォームを開く</a>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    modal.querySelector('#close-form-url-modal').addEventListener('click', closeModal);
    modal.querySelector('#close-form-url-modal-2').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    modal.querySelector('#copy-form-url-btn').addEventListener('click', async () => {
      const url = modal.querySelector('#form-url-text').textContent;
      const ok = await Share.copyToClipboard(url);
      if (ok) {
        const btn = modal.querySelector('#copy-form-url-btn');
        btn.textContent = '✅ コピーしました！';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '📋 URLをコピー'; btn.classList.remove('copied'); }, 2000);
      }
    });
  },

  /* ── Share Modal ── */
  openShareModal(caseId) {
    const caseData = Storage.getById(caseId);
    if (!caseData) return;

    const p0 = caseData.phase0 || {};
    const infRate = p0.influencer_reward_rate || p0.reward_rate || '—';
    const clientRate = p0.client_reward_rate || '—';

    const existingModal = document.getElementById('share-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'modal-overlay';
    // Permission descriptions
    const permDescs = {
      staff:      `全情報を表示。提示報酬率 ${esc(String(clientRate))}% ・インフル報酬率 ${esc(String(infRate))}% ・マージン・内部メモ・GO/STOP判定すべて見えます。`,
      influencer: `案件概要・自分の報酬率 ${esc(String(infRate))}% ・販売実績のみ表示。クライアント請求率・マージン・内部メモは非表示。`,
      client:     `案件概要・提示報酬率 ${esc(String(clientRate))}% ・販売実績のみ表示。インフル報酬率・マージン・内部メモは非表示。`
    };

    modal.innerHTML = [
      '<div class="modal-box">',
        '<div class="modal-header">',
          '<h2>\uD83D\uDD17 \u5171\u6709\u30EA\u30F3\u30AF\u751F\u6210</h2>',
          '<button type="button" id="close-share-modal" class="btn btn-ghost">\u2715</button>',
        '</div>',
        '<div class="modal-body">',
          '<p class="share-modal-note">\uD83D\uDD12 \u30DE\u30FC\u30B8\u30F3\u306F\u3044\u304B\u306A\u308B\u5834\u5408\u3082\u975E\u8868\u793A\u3067\u3059</p>',
          '<!-- \u30BB\u30B0\u30E1\u30F3\u30C8\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB -->',
          '<div class="share-seg" id="share-seg">',
            '<button type="button" class="share-seg-btn active" data-perm="staff">\uD83C\uDFE2 \u81EA\u793E</button>',
            '<button type="button" class="share-seg-btn" data-perm="influencer">\u2B50 \u30A4\u30F3\u30D5\u30EB</button>',
            '<button type="button" class="share-seg-btn" data-perm="client">\uD83D\uDC54 \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8</button>',
          '</div>',
          '<!-- \u8AAC\u660E\u30A8\u30EA\u30A2 -->',
          '<div class="share-desc-box" id="share-desc-box">',
            '<div class="share-desc-icon" id="share-desc-icon">\uD83C\uDFE2</div>',
            '<div>',
              '<div class="share-desc-title" id="share-desc-title">\u81EA\u793E\u30E1\u30F3\u30D0\u30FC\u7528</div>',
              '<div class="share-desc-text" id="share-desc-text">' + permDescs.staff + '</div>',
            '</div>',
          '</div>',
          '<!-- URL\u8868\u793A -->',
          '<div id="share-url-section" style="display:none;margin-top:12px">',
            '<div class="share-url-box" id="share-url-text"></div>',
            '<button type="button" class="btn-copy" id="copy-share-url-btn">\uD83D\uDCCB URL\u3092\u30B3\u30D4\u30FC</button>',
          '</div>',
        '</div>',
        '<div class="modal-footer">',
          '<button type="button" class="btn btn-outline" id="close-share-modal-2">\u30AD\u30E3\u30F3\u30BB\u30EB</button>',
          '<button type="button" class="btn btn-primary" id="generate-share-url-btn" data-case-id="' + esc(caseId) + '">URL\u3092\u751F\u6210</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    // Segment control click
    const descIcons  = { staff: '🏢', influencer: '⭐', client: '👔' };
    const descTitles = { staff: '自社メンバー用', influencer: 'インフルエンサー用', client: 'クライアント用' };
    let selectedPerm = 'staff';

    modal.querySelectorAll('.share-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPerm = btn.dataset.perm;
        modal.querySelectorAll('.share-seg-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.perm === selectedPerm)
        );
        modal.querySelector('#share-desc-icon').textContent  = descIcons[selectedPerm];
        modal.querySelector('#share-desc-title').textContent = descTitles[selectedPerm];
        modal.querySelector('#share-desc-text').textContent  = permDescs[selectedPerm];
        modal.querySelector('#share-url-section').style.display = 'none';
      });
    });

    // Generate URL
    modal.querySelector('#generate-share-url-btn').addEventListener('click', () => {
      const level = selectedPerm || 'staff';
      const url = Share.getShareUrl(caseData, level);
      if (url) {
        const urlSection = modal.querySelector('#share-url-section');
        modal.querySelector('#share-url-text').textContent = url;
        urlSection.style.display = 'block';
      }
    });

    // Copy URL
    modal.querySelector('#copy-share-url-btn').addEventListener('click', async () => {
      const url = modal.querySelector('#share-url-text').textContent;
      const ok = await Share.copyToClipboard(url);
      if (ok) {
        const btn = modal.querySelector('#copy-share-url-btn');
        btn.textContent = '✅ コピーしました！';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 URLをコピー';
          btn.classList.remove('copied');
        }, 2000);
      }
    });

    // Close
    const closeModal = () => modal.remove();
    modal.querySelector('#close-share-modal').addEventListener('click', closeModal);
    modal.querySelector('#close-share-modal-2').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  }
};

/* ── Bootstrap ── */
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Init is called from index.html after Storage.initialize()
