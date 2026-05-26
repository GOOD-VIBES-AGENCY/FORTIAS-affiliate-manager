'use strict';

/* ─────────────────────────────────────────────────────────────
   フォーティアス Affiliate Manager — Main App
───────────────────────────────────────────────────────────── */
const App = {
  saveTimeout: null,
  currentCaseId: null,
  currentPhase: 'phase0',

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

  /* ── Dashboard ── */
  renderDashboard() {
    const cases = Storage.getAll();
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
            <button class="btn btn-outline btn-sm" id="share-btn" data-case-id="${esc(id)}">🔗 共有リンク生成</button>
            <button class="btn btn-danger btn-sm" id="delete-case-btn" data-case-id="${esc(id)}">🗑 削除</button>
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
