'use strict';

/* ─────────────────────────────────────────────────────────────
   Phase field / item definitions
───────────────────────────────────────────────────────────── */
const PHASE0_SECTIONS = [
  {
    id: 'schedule', title: 'スケジュール・申請期限', icon: '⏰', open: true,
    fields: [
      { key: 'platform_deadline', label: 'プラットフォーム申請期限', type: 'date', hint: '楽天・ Qoo10 等、プラットフォームへの事前申請期限' },
      { key: 'reply_deadline',   label: '封社返答期限',  type: 'date', required: true },
      { key: 'event_name_official', label: 'セール・イベント名（公式名称）', type: 'text', hint: '投稿・クリエイティブで使用する正式名称。選不要な場合は空欄可' }
    ]
  },
  {
    id: 'basic', title: '基本情報', icon: '📋', open: true,
    fields: [
      { key: 'brand_name',     label: 'ブランド名',         type: 'text', required: true },
      { key: 'product_name',   label: '商品名',             type: 'text', required: true },
      { key: 'product_concept',label: '商品コンセプト',      type: 'textarea' },
      { key: 'period_start',   label: '販売開始日時（JST）', type: 'datetime-local', required: true },
      { key: 'period_end',     label: '販売終了日時（JST）', type: 'datetime-local', required: true },
      { key: 'pre_announce_date', label: '事前告知日',      type: 'date' },
      { key: 'post_start_date',   label: '投稿開始日',      type: 'date' }
    ]
  },
  {
    id: 'sales', title: '販売条件', icon: '🛒', open: false,
    fields: [
      { key: 'price_regular',   label: '通常価格（円）',     type: 'number', required: true },
      { key: 'price_sale',      label: 'セール価格（円）',   type: 'number', required: true },
      { key: 'discount_rate',   label: '割引率（%）',        type: 'number', hint: '自動計算または手入力' },
      { key: 'set_contents',    label: 'セット内容',          type: 'textarea' },
      { key: 'purchase_limit_per_person', label: '購入上限数/人', type: 'text' },
      { key: 'platform_coupon_applicable', label: 'プラットフォーム特定クーポン適用可', type: 'select',
        hint: '楽天マラソン・ Qoo10メガ割・自社クーポン等。適用ない場合は「なし」',
        options: [{ v:'none', l:'なし' }, { v:'yes', l:'あり（全商品）' }, { v:'partial', l:'あり（一部）' }] },
      { key: 'other_coupon_compatible', label: '他クーポン・ポイント併用', type: 'select',
        hint: '購入者が別途のクーポンやポイントの併用可否',
        options: [{ v:'yes', l:'可' }, { v:'no', l:'不可' }, { v:'details', l:'条件あり' }] },
      { key: 'shipping_origin', label: '発送元', type: 'select',
        options: [{ v:'国内', l:'国内' }, { v:'韓国', l:'韓国' }, { v:'その他', l:'その他' }] },
      { key: 'novelty_type',    label: 'ノベルティ種別', type: 'select',
        options: [{ v:'フルサイズ', l:'フルサイズ' }, { v:'ミニ', l:'ミニ' }, { v:'両方', l:'両方' }] },
      { key: 'novelty_count',   label: '先着ノベルティ個数', type: 'number' },
      { key: 'novelty_full_count', label: 'ノベルティ フルサイズ 数', type: 'number' },
      { key: 'novelty_mini_count', label: 'ノベルティ ミニ 数',      type: 'number' },
      { key: 'novelty_after_gift',        label: '先着後 全員特典',       type: 'text' },
      { key: 'page_behavior_after_gift',  label: '先着終了後のページ挙動', type: 'text' },
      { key: 'lowest_price_claim_ok', label: '最安値訴求OK', type: 'select',
        options: [{ v:'yes', l:'はい' }, { v:'no', l:'いいえ' }] },
      { key: 'lowest_price_evidence', label: '最安値根拠', type: 'text' }
    ]
  },
  {
    id: 'reward', title: '報酬条件', icon: '💰', open: false,
    fields: [
      { key: 'reward_type', label: '報酬タイプ', type: 'select',
        options: [{ v:'CPS', l:'CPS（売上連動）' }, { v:'CPA', l:'CPA（件数連動）' }, { v:'固定+成果', l:'固定+成果' }] },
      {
        key: 'client_reward_rate',
        label: '提示報酬率（クライアント請求）%',
        type: 'number', required: true,
        hint: 'クライアントへ請求する報酬率。クライアント共有URLに含まれます。',
        badge: 'client'
      },
      {
        key: 'influencer_reward_rate',
        label: 'インフル成果報酬率 %',
        type: 'number', required: true,
        hint: 'インフルエンサーへ支払う報酬率。インフル共有URLに含まれます。',
        badge: 'influencer'
      },
      { key: 'conversion_point',        label: '計上ポイント',       type: 'text', required: true },
      { key: 'point_deduction_policy',  label: 'ポイント控除ポリシー', type: 'text' },
      { key: 'approval_rate',           label: '承認率',              type: 'text' },
      { key: 'rejection_conditions',    label: '否認条件',            type: 'text' },
      { key: 'payment_closing',         label: '締め日',              type: 'text' },
      { key: 'payment_date',            label: '支払日',              type: 'text' },
      { key: 'payment_cycle',           label: '支払サイクル（日）',   type: 'number' }
    ]
  },
  {
    id: 'tracking', title: '計測・販売導線', icon: '📊', open: false,
    fields: [
      { key: 'sales_site',       label: '販売サイト',  type: 'text' },
      { key: 'lp_url',           label: 'LP URL',     type: 'url' },
      { key: 'tracking_method',  label: '計測方法',    type: 'text' },
      { key: 'coupon_code',      label: 'クーポンコード', type: 'text' },
      { key: 'link_placement',   label: 'リンク設置場所', type: 'text' }
    ]
  },
  {
    id: 'creative', title: 'スケジュール・クリエイティブ', icon: '🎨', open: false,
    fields: [
      { key: 'draft_check_required', label: '原稿チェック必須', type: 'select',
        options: [{ v:'yes', l:'必須' }, { v:'no', l:'不要' }] },
      { key: 'shooting_ok', label: '撮影協力OK', type: 'select',
        options: [{ v:'yes', l:'OK' }, { v:'no', l:'NG' }] },
      { key: 'shooting_location', label: '撮影場所', type: 'text' },
      { key: 'korea_visit_expenses_covered', label: '訪韓費用負担', type: 'select',
        options: [{ v:'yes', l:'あり' }, { v:'no', l:'なし' }] },
      { key: 'japanese_staff_available', label: '日本スタッフ在中', type: 'select',
        options: [{ v:'yes', l:'在中' }, { v:'no', l:'なし' }] },
      { key: 'brand_messaging',       label: 'ブランドメッセージ',   type: 'textarea' },
      { key: 'creative_after_gift_url', label: '先着後クリエイティブURL', type: 'url' },
      { key: 'gift_announce_strategy', label: '先着告知戦略', type: 'select',
        options: [{ v:'一括', l:'一括（全インフル同時）' }, { v:'段階', l:'段階（時間差あり）' }] }
    ]
  },
  {
    id: 'legal', title: '法務・レギュレーション', icon: '⚖️', open: false,
    fields: [
      { key: 'pr_tag_rule',              label: 'PRタグルール',      type: 'text' },
      { key: 'ng_expressions',           label: 'NG表現',            type: 'textarea' },
      { key: 'competitor_ng',            label: '競合NG',            type: 'text' },
      { key: 'regulation_doc_url',       label: 'レギュレーションドキュメントURL', type: 'url' },
      { key: 'material_usage_restrictions', label: '素材使用制限',  type: 'textarea' }
    ]
  },
  {
    id: 'logistics', title: '在庫・物流・CS', icon: '📦', open: false,
    fields: [
      { key: 'stock_count',       label: '在庫数',            type: 'number' },
      { key: 'shipping_lead_time',label: '発送リードタイム',   type: 'text' },
      { key: 'cs_contact',        label: 'CS連絡先',          type: 'text' },
      { key: 'return_policy',     label: '返品ポリシー',       type: 'textarea' }
    ]
  },
  {
    id: 'operations', title: '売上報告・当日運用', icon: '📡', open: false,
    fields: [
      { key: 'sales_report_phases_agreed', label: '売上報告フェーズ合意済み', type: 'select',
        options: [{ v:'yes', l:'合意済み' }, { v:'no', l:'未合意' }, { v:'details', l:'条件あり' }] },
      { key: 'holiday_support_ok', label: '休日サポートOK', type: 'select',
        options: [{ v:'yes', l:'OK' }, { v:'no', l:'NG' }] }
    ]
  },
  {
    id: 'documents', title: '資料・オリエンシート', icon: '📁', open: false,
    fields: [
      { key: 'doc_label_1', label: '資料①　名称', type: 'text', hint: '例: オリエンシート、レギュレーション、素材パック' },
      { key: 'doc_url_1',   label: '資料①　URL（Google Drive 等）', type: 'url' },
      { key: 'doc_label_2', label: '資料②　名称', type: 'text' },
      { key: 'doc_url_2',   label: '資料②　URL', type: 'url' },
      { key: 'doc_label_3', label: '資料③　名称', type: 'text' },
      { key: 'doc_url_3',   label: '資料③　URL', type: 'url' },
      { key: 'doc_label_4', label: '資料④　名称', type: 'text' },
      { key: 'doc_url_4',   label: '資料④　URL', type: 'url' },
      { key: 'doc_label_5', label: '資料⑤　名称', type: 'text' },
      { key: 'doc_url_5',   label: '資料⑤　URL', type: 'url' }
    ]
  }
];

const PHASE1_STOP_ITEMS = [
  { key: 'conversion_point_confirmed',    cat: '報酬', label: '計上ポイント（注文/決済）確認済み' },
  { key: 'rejection_conditions_clear',    cat: '報酬', label: '否認条件が明確に定義されている' },
  { key: 'point_deduction_policy_confirmed', cat: '報酬', label: 'ポイント控除ポリシーが確認済み' },
  { key: 'payment_cycle_confirmed',       cat: '報酬', label: '支払サイクル（締め日・支払日）確認済み' },
  { key: 'approval_rate_disclosed',       cat: '報酬', label: '承認率が開示されている' },
  { key: 'sales_cap_over_policy_confirmed', cat: '報酬', label: '売上キャップ超過時の方針確認済み' },
  { key: 'coupon_operation_verified',     cat: '販売サイト', label: 'クーポン操作・表示が確認済み' },
  { key: 'price_display_matches_checkout',cat: '販売サイト', label: 'LP表示価格とカート価格が一致している' },
  { key: 'server_load_verified',          cat: '販売サイト', label: 'サーバー負荷耐性が確認済み' },
  { key: 'tracking_tag_installed',        cat: '販売サイト', label: 'トラッキングタグが正常に動作している' },
  { key: 'stock_confirmed',               cat: '物流', label: '在庫数が確認済み（先着分を含む）' },
  { key: 'shipping_lead_confirmed',       cat: '物流', label: '発送リードタイムが確認済み' },
  { key: 'stockout_policy_confirmed',     cat: '物流', label: '在庫切れ時の対応方針が確認済み' },
  { key: 'cs_contact_ready',              cat: 'CS', label: 'CS連絡先が確保されている' },
  { key: 'return_flow_clear',             cat: 'CS', label: '返品・交換フローが明確' },
  { key: 'incident_response_confirmed',   cat: 'CS', label: 'インシデント対応フローが確認済み' },
  { key: 'pr_rule_confirmed',             cat: '法務', label: 'PRルール（景品表示法）確認済み' },
  { key: 'pharma_law_checked',            cat: '法務', label: '薬機法チェック済み' },
  { key: 'ng_expressions_shared',         cat: '法務', label: 'NG表現がインフルエンサーに共有済み' },
  { key: 'material_usage_clear',          cat: '法務', label: '素材使用制限が明確' },
  { key: 'emergency_contacts_confirmed',  cat: '運用', label: '緊急連絡先（楽天担当含む）確認済み' },
  { key: 'sales_report_schedule_agreed',  cat: '運用', label: '売上報告スケジュールが書面で合意済み' }
];

const PHASE1_CAUTION_ITEMS = [
  { key: 'approval_rate_80plus',    label: '承認率 80% 以上' },
  { key: 'payment_60days_or_less',  label: '支払サイクルが 60 日以内' },
  { key: 'price_attractive',        label: '価格設定が十分に魅力的（50%+OFF など）' },
  { key: 'lp_speed_ok',             label: 'LPの表示速度が良好' },
  { key: 'guest_purchase_available',label: 'ゲスト購入が可能' },
  { key: 'smartphone_ui_ok',        label: 'スマートフォン UI が最適化されている' },
  { key: 'stock_sufficient',        label: '在庫が十分（想定最大注文 ×1.5 以上）' },
  { key: 'novelty_restocking_fast', label: 'ノベルティの追加調達が速い' },
  { key: 'no_delivery_delay',       label: '配送遅延リスクが低い' },
  { key: 'cs_hours_sufficient',     label: 'CS対応時間が十分（当日含む）' },
  { key: 'gifting_available',       label: 'ギフト対応が可能' },
  { key: 'materials_sufficient',    label: 'クリエイティブ素材が十分に揃っている' },
  { key: 'draft_check_ok',          label: '原稿チェックの返答が迅速' },
  { key: 'competitor_ng_reasonable',label: '競合NG範囲が合理的' },
  { key: 'low_incident_risk',       label: 'インシデントリスクが低い' },
  { key: 'influencer_confirmed',    label: 'インフルエンサーの起用が正式確定' },
  { key: 'holiday_support_ok',      label: '休日の運用サポートあり' },
  { key: 'contact_responsive',      label: 'クライアント担当者の返答が迅速' }
];

const PHASE2_ITEMS = [
  { key: 'sales_content', label: '① 販売内容の最終確認（セール価格・セット内容・ノベルティ）' },
  { key: 'reward',        label: '② 報酬条件の最終確認（報酬率・計上ポイント・支払日）' },
  { key: 'sales_site',    label: '③ 販売サイトの動作確認（URL・カート・クーポン）' },
  { key: 'product',       label: '④ 商品情報確認（スペック・規格・使い方）' },
  { key: 'logistics',     label: '⑤ 物流確認（在庫・発送リード・在庫切れ対応）' },
  { key: 'cs',            label: '⑥ CS体制確認（問い合わせ先・返品フロー）' },
  { key: 'regulation',    label: '⑦ レギュレーション確認（PRルール・NG表現・薬機法）' },
  { key: 'influencer',    label: '⑧ インフルエンサー確認（タレント名正式表記・投稿条件共有済み）' },
  { key: 'risk',          label: '⑨ リスク確認（インシデント対応・緊急連絡先）' }
];

/* ─────────────────────────────────────────────────────────────
   Helper utilities
───────────────────────────────────────────────────────────── */
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  if (!n && n !== 0) return '—';
  return '¥' + Number(n).toLocaleString('ja-JP');
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtDatetime(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderField(field, value, caseId) {
  const v = value !== undefined && value !== null ? value : '';
  const req = field.required ? '<span class="required">*</span>' : '';

  let badgeHtml = '';
  if (field.badge === 'client') {
    badgeHtml = ' <span class="perm-badge perm-badge-client">クライアント</span>';
  } else if (field.badge === 'influencer') {
    badgeHtml = ' <span class="perm-badge perm-badge-influencer">インフル</span>';
  }

  let inputHtml = '';
  if (field.type === 'textarea') {
    inputHtml = `<textarea class="form-control" data-case-id="${esc(caseId)}" data-field="${esc(field.key)}" rows="${field.rows || 3}">${esc(v)}</textarea>`;
  } else if (field.type === 'select') {
    const opts = (field.options || []).map(o => {
      const val = typeof o === 'string' ? o : o.v;
      const lbl = typeof o === 'string' ? o : o.l;
      return `<option value="${esc(val)}" ${v === val ? 'selected' : ''}>${esc(lbl)}</option>`;
    }).join('');
    inputHtml = `<select class="form-control" data-case-id="${esc(caseId)}" data-field="${esc(field.key)}">
      <option value="">— 選択 —</option>${opts}</select>`;
  } else {
    inputHtml = `<input type="${esc(field.type)}" class="form-control" data-case-id="${esc(caseId)}" data-field="${esc(field.key)}" value="${esc(v)}" ${field.required ? 'required' : ''}>`;
  }

  const hint = field.hint ? `<div class="form-hint">${esc(field.hint)}</div>` : '';
  return `<div class="form-group" ${field.required ? 'data-required="true"' : ''}>
    <label class="form-label">${esc(field.label)}${req}${badgeHtml}</label>
    ${inputHtml}${hint}
  </div>`;
}

/* ─────────────────────────────────────────────────────────────
   Phases object
───────────────────────────────────────────────────────────── */
const Phases = {

  /* ── Phase 0: Hearing Sheet ── */
  renderPhase0(caseData) {
    const p0 = caseData.phase0 || {};
    const caseId = caseData.id;

    const gvaMargin = (() => {
      const cr = parseFloat(p0.client_reward_rate || 0);
      const ir = parseFloat(p0.influencer_reward_rate || p0.reward_rate || 0);
      if (!cr && !ir) return null;
      return (cr - ir).toFixed(1);
    })();

    const marginBadge = gvaMargin !== null
      ? `<div class="revenue-card gva" style="margin-bottom:16px">
          <div class="revenue-title">🏢 マージン（自動計算・内部のみ）</div>
          <div class="revenue-amount">${gvaMargin}%</div>
          <div style="font-size:12px;color:#92400e;margin-top:4px;">= 提示報酬率(${p0.client_reward_rate || 0}%) − インフル報酬率(${p0.influencer_reward_rate || p0.reward_rate || 0}%)</div>
        </div>`
      : '';

    // 楽天・ Qoo10 などプラットフォーム固有の注意事項バナー
    const bannerBase = 'border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;word-break:break-all;overflow-wrap:break-word;overflow:hidden';
    const platformBanners = {
      '楽天': `<div style="background:#fff7ed;border:1.5px solid #fed7aa;color:#9a3412;${bannerBase}">⚠️ <strong>楽天セール案件</strong>：セール前に楽天側への事前申請が必要です。「プラットフォーム申請期限」を必ず確認してください。</div>`,
      'Qoo10': `<div style="background:#f0f9ff;border:1.5px solid #93c5fd;color:#1e40af;${bannerBase}">⚠️ <strong>Qoo10メガ割案件</strong>：メガ割期間が定期開催されます。開催スケジュールと商品登録期限を事前に確認してください。</div>`
    };
    const platformBanner = platformBanners[caseData.platform] || '';

    const sections = PHASE0_SECTIONS.map(sec => {
      const fieldsHtml = sec.fields.map(f => renderField(f, p0[f.key], caseId)).join('');
      const isOpen = sec.open ? 'open' : '';
      return `
        <div class="collapse-section">
          <button type="button" class="collapse-header ${isOpen}" data-collapse="${esc(sec.id)}">
            <span class="collapse-title"><span>${sec.icon}</span> ${esc(sec.title)}</span>
            <span class="collapse-icon">▾</span>
          </button>
          <div class="collapse-body ${isOpen}" id="collapse-${esc(sec.id)}">
            ${sec.id === 'schedule' ? platformBanner : ''}
            ${sec.id === 'reward' ? marginBadge : ''}
            <div class="form-grid">${fieldsHtml}</div>
          </div>
        </div>`;
    }).join('');

    // Emergency contacts
    const contacts = p0.emergency_contacts || [{ name: '', role: '', phone: '' }, { name: '', role: '', phone: '' }, { name: '', role: '', phone: '' }];
    const contactRows = contacts.map((c, i) => `
      <div class="contact-row" data-contact-idx="${i}">
        <input type="text" class="form-control" placeholder="担当者名" data-case-id="${esc(caseId)}" data-field="ec_name_${i}" value="${esc(c.name)}">
        <input type="text" class="form-control" placeholder="役割" data-case-id="${esc(caseId)}" data-field="ec_role_${i}" value="${esc(c.role)}">
        <input type="text" class="form-control" placeholder="電話番号" data-case-id="${esc(caseId)}" data-field="ec_phone_${i}" value="${esc(c.phone)}">
        <button type="button" class="btn btn-ghost btn-sm" data-remove-contact="${i}" title="削除">✕</button>
      </div>`).join('');

    return `
      <div class="fade-in" data-case-id="${esc(caseId)}" data-phase="phase0">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>📋 Phase 0 — ヒアリングシート</h3>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="save-indicator" id="save-indicator">✓ 保存済み</span>
              <button type="button" id="quick-mode-btn" class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 10px">⚡ 必須項目のみ</button>
            </div>
          </div>
          <div class="card-body">
            ${sections}
            <!-- Emergency Contacts -->
            <div class="collapse-section">
              <button type="button" class="collapse-header open" data-collapse="emergency">
                <span class="collapse-title"><span>🚨</span> 緊急連絡先（最低3名）</span>
                <span class="collapse-icon">▾</span>
              </button>
              <div class="collapse-body open" id="collapse-emergency">
                <div id="contact-list">${contactRows}</div>
                <button type="button" class="btn btn-outline btn-sm" id="add-contact-btn" data-case-id="${esc(caseId)}">+ 連絡先を追加</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  /* ── Phase 1: GO/STOP Judgment ── */
  renderPhase1(caseData) {
    const p1 = caseData.phase1 || { stop_items: {}, caution_items: {} };
    const stopItems = p1.stop_items || {};
    const cautionItems = p1.caution_items || {};
    const caseId = caseData.id;

    const judgment = this.calculateJudgment(p1);

    const jLabels = {
      A: { txt: 'GO（最良）', desc: '全STOPクリア・注意項目も少ない。通常どおり進行。' },
      B: { txt: 'GO（条件付き）', desc: '全STOPクリア・注意項目複数あり。リスクを把握して進行。' },
      C: { txt: '要確認', desc: 'STOP項目に未確認あり。確認完了後に再判定。' },
      D: { txt: 'STOP', desc: 'STOP項目に未クリアあり。案件を進めてはならない。' }
    };

    const jBox = `
      <div class="judgment-box ${judgment}" id="judgment-box">
        <div class="judgment-letter">${judgment}</div>
        <div class="judgment-label">${jLabels[judgment].txt}</div>
        <div style="font-size:12px;color:#64748b;margin-top:6px;">${jLabels[judgment].desc}</div>
      </div>`;

    // Group STOP items by category
    const stopCategories = [...new Set(PHASE1_STOP_ITEMS.map(i => i.cat))];
    const stopSections = stopCategories.map(cat => {
      const items = PHASE1_STOP_ITEMS.filter(i => i.cat === cat);
      const rows = items.map(item => {
        const checked = stopItems[item.key] === true;
        const unchecked = stopItems[item.key] === false;
        const cls = checked ? 'checked' : (unchecked ? 'unchecked' : '');
        return `
          <label class="check-item stop-item ${cls}">
            <input type="checkbox" ${checked ? 'checked' : ''} data-case-id="${esc(caseId)}" data-stop-item="${esc(item.key)}">
            <span class="check-item-label">${esc(item.label)}</span>
            <span class="check-item-badge">STOP</span>
          </label>`;
      }).join('');
      return `<div style="margin-bottom:12px"><div class="section-title">${esc(cat)}</div>${rows}</div>`;
    }).join('');

    const cautionRows = PHASE1_CAUTION_ITEMS.map(item => {
      const checked = cautionItems[item.key] === true;
      const cls = checked ? 'checked' : '';
      return `
        <label class="check-item caution-item ${cls}">
          <input type="checkbox" ${checked ? 'checked' : ''} data-case-id="${esc(caseId)}" data-caution-item="${esc(item.key)}">
          <span class="check-item-label">${esc(item.label)}</span>
          <span class="check-item-badge">注意</span>
        </label>`;
    }).join('');

    const uncheckedCaution = PHASE1_CAUTION_ITEMS.filter(i => cautionItems[i.key] !== true).length;

    return `
      <div class="fade-in" data-case-id="${esc(caseId)}" data-phase="phase1">
        <!-- AI自動判定ボタン -->
        <div style="background:linear-gradient(135deg,#1e3a5f,#0d9488);border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;max-width:100%;box-sizing:border-box">
          <div style="min-width:0;flex:1">
            <div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:2px">🤖 Phase 0から自動判定</div>
            <div style="color:rgba(255,255,255,0.7);font-size:11px;word-break:break-all">Phase 0の入力内容を分析し、チェック項目を自動判定します</div>
          </div>
          <button type="button" id="auto-score-btn" data-case-id="${esc(caseId)}" style="background:#fff;color:#1e3a5f;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0">✨ 自動判定</button>
        </div>
        ${jBox}
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>🔴 即STOP項目（22項目 — 全てチェック必須）</h3>
            <span class="save-indicator" id="save-indicator">✓ 保存済み</span>
          </div>
          <div class="card-body">${stopSections}</div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>🟡 要注意項目（18項目 — 2つ以上未チェックで要確認）</h3>
            <span style="font-size:12px;color:#64748b;">未チェック: <strong>${uncheckedCaution}</strong>/18</span>
          </div>
          <div class="card-body">${cautionRows}</div>
        </div>
      </div>`;
  },

  calculateJudgment(p1) {
    const stop = p1.stop_items || {};
    const caution = p1.caution_items || {};
    const anyStopFail = PHASE1_STOP_ITEMS.some(i => stop[i.key] === false);
    if (anyStopFail) return 'D';
    const anyStopMissing = PHASE1_STOP_ITEMS.some(i => stop[i.key] !== true);
    if (anyStopMissing) return 'C';
    const uncheckedCaution = PHASE1_CAUTION_ITEMS.filter(i => caution[i.key] !== true).length;
    return uncheckedCaution <= 3 ? 'A' : 'B';
  },

  /* ── Phase 2: 実施準備チェックリスト ── */
  renderPhase2(caseData) {
    const p2 = caseData.phase2 || { confirmed_items: {} };
    const items = p2.confirmed_items || {};
    const caseId = caseData.id;

    const checkRows = PHASE2_ITEMS.map(item => {
      const checked = items[item.key] === true;
      const cls = checked ? 'checked' : '';
      return `
        <label class="check-item ${cls}" style="margin-bottom:8px">
          <input type="checkbox" ${checked ? 'checked' : ''} data-case-id="${esc(caseId)}" data-p2-item="${esc(item.key)}">
          <span class="check-item-label">${esc(item.label)}</span>
        </label>`;
    }).join('');

    const judgeVal = items.final_judgment || '';
    const reasonVal = items.final_judgment_reason || '';
    const goSelected = judgeVal === 'GO' ? 'selected' : '';
    const stopSelected = judgeVal === 'STOP' ? 'selected' : '';

    return `
      <div class="fade-in" data-case-id="${esc(caseId)}" data-phase="phase2">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>✅ Phase 2 — 実施準備 チェックリスト</h3>
            <span class="save-indicator" id="save-indicator">✓ 保存済み</span>
          </div>
          <div class="card-body">
            ${checkRows}
            <hr class="divider">
            <div class="form-group">
              <label class="form-label">⑩ 最終判断 <span class="required">*</span></label>
              <select class="form-control" style="max-width:200px" data-case-id="${esc(caseId)}" data-p2-item="final_judgment">
                <option value="">— 選択 —</option>
                <option value="GO" ${goSelected}>✅ GO</option>
                <option value="STOP" ${stopSelected}>🛑 STOP</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">GO/STOP 理由・備考</label>
              <textarea class="form-control" rows="3" data-case-id="${esc(caseId)}" data-p2-item="final_judgment_reason">${esc(reasonVal)}</textarea>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>📄 インフルエンサー共有シート</h3>
          </div>
          <div class="card-body">
            ${this.renderPhase2b(caseData)}
          </div>
        </div>
      </div>`;
  },

  /* ── Phase 2b: Influencer Sheet Generator ── */
  renderPhase2b(caseData) {
    const p0 = caseData.phase0 || {};
    const sheet = this.generateInfluencerSheet(caseData);
    return `
      <div>
        <p style="font-size:13px;color:#64748b;margin-bottom:12px">
          下記のテキストをコピーして、インフルエンサーへ共有してください。
        </p>
        <div class="sheet-output" id="influencer-sheet">${esc(sheet)}</div>
        <button type="button" class="btn-copy" id="copy-sheet-btn" data-sheet="influencer-sheet">
          📋 テキストをコピー
        </button>
      </div>`;
  },

  generateInfluencerSheet(caseData) {
    const p0 = caseData.phase0 || {};
    const name = caseData.name || '—';
    const inf = caseData.influencer || '—';
    const brand = p0.brand_name || caseData.brand || '—';
    const product = p0.product_name || '—';
    const concept = p0.product_concept || '—';
    const msgng = p0.brand_messaging || '—';
    const site = p0.sales_site || '楽天';
    const eventName = p0.event_name_official || '—';
    const pStart = fmtDatetime(p0.period_start);
    const pEnd = fmtDatetime(p0.period_end);
    const postStart = fmtDate(p0.post_start_date);
    const preDt = fmtDate(p0.pre_announce_date);
    const priceSale = p0.price_sale ? fmtMoney(p0.price_sale) : '—';
    const priceReg = p0.price_regular ? fmtMoney(p0.price_regular) : '—';
    const discount = p0.discount_rate ? `${p0.discount_rate}%OFF` : '';
    const limit = p0.purchase_limit_per_person ? `お一人様${p0.purchase_limit_per_person}点まで` : '制限なし';
    const noveltyCount = p0.novelty_count || '—';
    const noveltyAfter = p0.novelty_after_gift || 'なし';
    const pageBeh = p0.page_behavior_after_gift || '—';
    const giftStrat = p0.gift_announce_strategy || '—';
    const lpUrl = p0.lp_url || '—';
    const prTag = p0.pr_tag_rule || '#PR';
    const ngExp = p0.ng_expressions || '—';
    const setContents = p0.set_contents || '—';
    const infRate = p0.influencer_reward_rate || p0.reward_rate || '—';
    const convPt = p0.conversion_point || '—';
    const rejCond = p0.rejection_conditions || '—';
    const payClose = p0.payment_closing || '—';
    const payDate = p0.payment_date || '—';
    const contacts = (p0.emergency_contacts || []);
    const contactLines = contacts.length
      ? contacts.map(c => `  ${c.role || '担当'}: ${c.name || '—'} / ${c.phone || '—'}`).join('\n')
      : '  （未設定）';

    const couponLine = p0.platform_coupon_applicable === 'yes'
      ? `プラットフォームクーポン: 利用可${p0.coupon_code ? '（コード: ' + p0.coupon_code + '）' : ''}\n他クーポン併用: ${p0.other_coupon_compatible === 'yes' ? '可' : 'NG'}`
      : 'プラットフォームクーポン: 利用不可';

    const draftLine = p0.draft_check_required === 'yes' ? '必須（投稿前に必ず送付してください）' : '不要';
    const shootingLine = p0.shooting_ok === 'yes' ? `OK${p0.shooting_location ? '（場所: ' + p0.shooting_location + '）' : ''}` : 'NG（提供素材のみ使用）';
    const materialLine = p0.material_usage_restrictions || '—';
    const competitorNg = p0.competitor_ng || '—';
    const returnPolicy = p0.return_policy || '—';
    const shippingLead = p0.shipping_lead_time || '—';
    const csContact   = p0.cs_contact || '—';
    const trackMethod = p0.tracking_method || '—';
    const linkPlace   = p0.link_placement || '—';

    const docLines = [1,2,3,4,5].reduce((acc, i) => {
      const lbl = p0[`doc_label_${i}`];
      const url = p0[`doc_url_${i}`];
      if (lbl || url) acc.push(`  ${lbl || '資料' + i}: ${url || '—'}`);
      return acc;
    }, []);
    const docsSection = docLines.length
      ? `\n■ オリエンシート\n${docLines.join('\n')}`
      : '■ オリエンシート\n  （未登録）';

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━
【案件概要】${name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ ブランド・商品情報
ブランド: ${brand}
商品名: ${product}
セット内容: ${setContents}
コンセプト・ターゲット: ${concept}
おすすめ訴求: ${msgng}

■ 販売情報
販売サイト: ${site}
正式イベント名: ${eventName}（投稿時はこの名称でコピペ）
販売期間: ${pStart} 〜 ${pEnd}
通常価格: ${priceReg}
セール価格: ${priceSale}（${discount}）
購入上限: ${limit}
${couponLine}
最安値訴求: ${p0.lowest_price_claim_ok === 'yes' ? '可' : 'NG'}
商品ページURL: ${lpUrl}

■ 投稿スケジュール
事前告知解禁: ${preDt}〜
投稿解禁: ${postStart}

■ 先着ギフト情報
先着特典: 先着${noveltyCount}名様にノベルティ
先着終了後プレゼント: ${noveltyAfter}
告知方法: ${giftStrat}
先着終了後のページ表示: ${pageBeh}

■ クリエイティブ・投稿ルール
原稿チェック: ${draftLine}
自撮り・商品撮影: ${shootingLine}
素材使用制限: ${materialLine}
PRタグ: ${prTag}（必須）
NG表現: ${ngExp}
競合NG: ${competitorNg}

■ 計測・リンク設置
計測方法: ${trackMethod}
リンク設置場所: ${linkPlace}

■ 報酬条件
報酬率: ${infRate}%
計上タイミング: ${convPt}
否認条件: ${rejCond}
承認率目安: ${p0.approval_rate || '—'}
締め日: ${payClose}
支払日: ${payDate}

■ 物流・CS情報
出荷リードタイム: ${shippingLead}
返品ポリシー: ${returnPolicy}
CS連絡先: ${csContact}

■ 売上報告（当日運用）
開始〜30分: 5分ごとに報告
30分〜3時間: 30分ごとに報告
3時間以降: 1時間ごとに報告（在庫状況により随時）

${docsSection}

■ 緊急連絡先
${contactLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ご不明点はお気軽にご連絡ください！よろしくお願いします🙏
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  },

  /* ── Phase 3: 当日売上ダッシュボード ── */
  renderPhase3(caseData) {
    const p3 = caseData.phase3 || { salesLog: [], alertLines: [1000, 500, 70] };
    const p0 = caseData.phase0 || {};
    const caseId = caseData.id;
    const log = p3.salesLog || [];
    const noveltyCount = parseInt(p0.novelty_count || 0);
    const alertLines = p3.alertLines || [1000, 500, 70];
    const lastCount = log.length ? log[log.length - 1].count : 0;
    const giftRemaining = noveltyCount ? Math.max(0, noveltyCount - lastCount) : '—';

    const currentPhase = (() => {
      if (!log.length) return 1;
      const lastTime = log[log.length - 1].time || '00:00';
      const [h, m] = lastTime.split(':').map(Number);
      const mins = (h || 0) * 60 + (m || 0);
      if (mins <= 30) return 1;
      if (mins <= 180) return 2;
      return 3;
    })();
    const phaseLabels = { 1: '🔥 Phase 1（0〜30分）', 2: '📈 Phase 2（30分〜3時間）', 3: '🏁 Phase 3（3時間以降）' };
    const phaseClass = { 1: 'p1', 2: 'p2', 3: 'p3' };

    const alertHtml = alertLines.map((a, idx) => {
      const threshold = noveltyCount - a;
      const reached = lastCount >= threshold && noveltyCount > 0;
      const cls = idx === 0 ? 'info' : (idx === 1 ? 'warning' : 'danger');
      const icon = reached ? '✅' : '⏳';
      return `<div class="alert-threshold ${cls}">${icon} 先着残り${a}個アラート（y = ${threshold}） ${reached ? '— 到達済み' : ''}</div>`;
    }).join('');

    const periodStart = p0.period_start ? new Date(p0.period_start) : null;
    const logRows = log.map((entry, i) => {
      const prev = i > 0 ? log[i - 1].count : 0;
      const diff = entry.count - prev;
      // 実際日時を計算（period_start + 経過時間）
      let actualTime = '—';
      if (periodStart) {
        const [h, m] = (entry.time || '0:0').split(':').map(Number);
        const ms = ((h || 0) * 60 + (m || 0)) * 60000;
        const actual = new Date(periodStart.getTime() + ms);
        actualTime = actual.toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
      }
      return `<tr>
        <td style="font-size:12px;color:#64748b">${esc(actualTime)}</td>
        <td style="font-weight:600">${esc(entry.time)}</td>
        <td><strong>${Number(entry.count).toLocaleString()}</strong></td>
        <td style="color:${diff > 0 ? '#16a34a' : '#64748b'}">+${diff.toLocaleString()}</td>
        <td>${noveltyCount ? Math.max(0, noveltyCount - entry.count).toLocaleString() : '—'}</td>
        <td>
          <button type="button" class="btn btn-ghost btn-sm" data-remove-log="${i}" data-case-id="${esc(caseId)}" title="削除">✕</button>
        </td>
      </tr>`;
    }).join('');

    const tips = `
      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3>💡 ブースティングTips（先着終了後）</h3></div>
        <div class="card-body">
          <ul style="font-size:13px;color:#374151;line-height:2;padding-left:20px;margin:0">
            <li>🕗 <strong>楽天ゴールデンタイム</strong> — 毎日 20:00〜21:00 に追加投稿（ストーリー・リポスト）</li>
            <li>⏰ <strong>残り時間アピール</strong> — 期間終了48時間前・24時間前・6時間前にカウントダウン告知</li>
            <li>📅 <strong>ポイント倍増デー</strong> — 5のつく日・0のつく日・楽天勝利の日に再告知</li>
            <li>📦 <strong>全員プレゼント訴求</strong> — 先着終了後は全員特典（${esc(p0.novelty_after_gift || 'ノベルティ')}）を前面に出す</li>
            <li>🔥 <strong>クーポン告知</strong> — 楽天クーポン使用可の場合は実質価格を強調</li>
          </ul>
        </div>
      </div>`;

    return `
      <div class="fade-in" data-case-id="${esc(caseId)}" data-phase="phase3">
        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
          <div class="stat-card">
            <div class="stat-label">現在の販売数</div>
            <div class="stat-value">${lastCount.toLocaleString()}</div>
            <div class="stat-sub">セット</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">先着残り</div>
            <div class="stat-value" style="color:${giftRemaining === 0 ? '#dc2626' : 'var(--navy)'}">
              ${typeof giftRemaining === 'number' ? giftRemaining.toLocaleString() : giftRemaining}
            </div>
            <div class="stat-sub">個 / ${noveltyCount.toLocaleString() || '—'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">現在フェーズ</div>
            <div style="margin-top:6px"><span class="phase-indicator ${phaseClass[currentPhase]}">${phaseLabels[currentPhase]}</span></div>
          </div>
        </div>

        <!-- Alert thresholds -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><h3>🚨 アラートライン</h3></div>
          <div class="card-body">${alertHtml || '<p style="color:#94a3b8;font-size:13px">先着数が未設定です</p>'}</div>
        </div>

        <!-- Chart -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>📊 売上推移チャート</h3>
            <button type="button" class="btn btn-outline btn-sm" id="export-csv-btn" data-case-id="${esc(caseId)}">⬇ CSV出力</button>
          </div>
          <div class="card-body">
            <div class="chart-container"><canvas id="sales-chart"></canvas></div>
          </div>
        </div>

        <!-- Add entry: fixed slots + custom -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>➕ 売上データ入力</h3>
            <span class="save-indicator" id="save-indicator">✓ 保存済み</span>
          </div>
          <div class="card-body" style="padding:12px 16px">
            ${[{label:'第1フェーズ（0〜30分）',times:['00:05','00:10','00:15','00:20','00:25','00:30']},{label:'第2フェーズ（30分〜3時間）',times:['01:00','01:30','02:00','02:30','03:00']},{label:'第3フェーズ（3〜6時間）',times:['04:00','05:00','06:00']}].map(group => {
              const rows = group.times.map(t => {
                const existing = log.find(e => e.time === t);
                const val = existing ? existing.count : '';
                const slotId = 'slot-count-' + t.replace(':','-');
                const saved = existing ? 'style="background:#f0fdf4;border-color:#86efac"' : '';
                return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9">
                  <span style="font-size:13px;font-weight:600;color:#1e3a5f;width:52px;flex-shrink:0">${esc(t)}</span>
                  <input type="number" id="${slotId}" class="form-control" value="${esc(String(val))}" placeholder="累計数" min="0" ${saved} style="flex:1;height:34px;font-size:13px">
                  <button type="button" class="btn btn-primary btn-sm save-fixed-slot-btn" data-case-id="${esc(caseId)}" data-fixed-time="${esc(t)}" data-slot-id="${slotId}" style="white-space:nowrap;height:34px;padding:0 10px">保存</button>
                </div>`;
              }).join('');
              return `<div style="margin-bottom:12px">
                <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;margin-bottom:4px">${esc(group.label)}</div>
                ${rows}
              </div>`;
            }).join('')}
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e2e8f0">
              <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;margin-bottom:8px">第4フェーズ以降（カスタム）</div>
              <div style="font-size:12px;color:#94a3b8;margin-bottom:8px">06:00以降は販売ペース・在庫状況に応じて都度入力</div>
              <div style="display:flex;gap:8px;align-items:flex-end">
                <div style="flex:1">
                  <label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px">経過時間</label>
                  <div style="display:flex;gap:4px">
                    <input type="text" class="form-control" id="log-time-input" placeholder="例: 08:00" style="height:34px;font-size:13px;flex:1">

                  </div>
                </div>
                <div style="flex:1">
                  <label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px">累計数</label>
                  <input type="number" class="form-control" id="log-count-input" placeholder="例: 4200" min="0" style="height:34px;font-size:13px">
                </div>
                <button type="button" class="btn btn-primary" id="add-log-btn" data-case-id="${esc(caseId)}" style="height:34px;padding:0 14px">追加</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Log table -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><h3>📋 売上ログ</h3></div>
          <div class="card-body" style="padding:0;overflow-x:auto">
            <table class="sales-log-table">
              <thead><tr>
                <th>実際日時</th><th>経過</th><th>累計</th><th>増分</th><th>先着残り</th><th></th>
              </tr></thead>
              <tbody id="sales-log-tbody">${logRows}</tbody>
            </table>
          </div>
        </div>

        ${tips}
      </div>`;
  },

  initPhase3Chart(caseData) {
    const canvas = document.getElementById('sales-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const p3 = caseData.phase3 || { salesLog: [] };
    const p0 = caseData.phase0 || {};
    const log = p3.salesLog || [];
    const noveltyCount = parseInt(p0.novelty_count || 0);
    const alertLines = p3.alertLines || [1000, 500, 70];

    const labels = log.map(e => e.time);
    const counts = log.map(e => e.count);

    // Destroy existing chart if any
    if (window._salesChart) {
      window._salesChart.destroy();
    }

    const annotations = {};
    if (noveltyCount) {
      alertLines.forEach((a, i) => {
        const threshold = noveltyCount - a;
        const colors = ['#3b82f6', '#f59e0b', '#ef4444'];
        annotations[`alert${i}`] = {
          type: 'line',
          yMin: threshold,
          yMax: threshold,
          borderColor: colors[i] || '#ccc',
          borderWidth: 1.5,
          borderDash: [6, 3],
          label: {
            content: `残${a}個`,
            display: true,
            position: 'end',
            font: { size: 10 }
          }
        };
      });
    }

    window._salesChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '累計販売数',
          data: counts,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13,148,136,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#0d9488',
          pointRadius: 4,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.y.toLocaleString()} セット`
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 11 }, maxRotation: 45 },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: v => v.toLocaleString(),
              font: { size: 11 }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        }
      }
    });
  },

  /* ── Phase 4: 精算・振り返り ── */
  renderPhase4(caseData) {
    const p4 = caseData.phase4 || {};
    const p0 = caseData.phase0 || {};
    const caseId = caseData.id;

    const clientRate = parseFloat(p0.client_reward_rate || 0) / 100;
    const infRate    = parseFloat(p0.influencer_reward_rate || p0.reward_rate || 0) / 100;
    const price      = parseFloat(p0.price_sale || 0);
    const approved   = parseInt(p4.approvedCount || 0);

    const clientRevenue = Math.round(approved * price * clientRate);
    const infRevenue    = Math.round(approved * price * infRate);
    const gvaMargin     = clientRevenue - infRevenue;

    const revSection = `<div id="phase4-revenue-box" style="margin-bottom:20px">${(approved && price) ? `
          <div class="revenue-card client">
            <div class="revenue-title">👔 クライアント請求額（${p0.client_reward_rate || 0}%）</div>
            <div class="revenue-amount">${fmtMoney(clientRevenue)}</div>
            <div style="font-size:12px;color:#1d4ed8;margin-top:4px">
              = ${approved.toLocaleString()} 件承認 × ${fmtMoney(price)} × ${p0.client_reward_rate || 0}%
            </div>
          </div>
          <div class="revenue-card influencer">
            <div class="revenue-title">⭐ インフル支払額（${p0.influencer_reward_rate || p0.reward_rate || 0}%）</div>
            <div class="revenue-amount">${fmtMoney(infRevenue)}</div>
            <div style="font-size:12px;color:#166534;margin-top:4px">
              = ${approved.toLocaleString()} 件承認 × ${fmtMoney(price)} × ${p0.influencer_reward_rate || p0.reward_rate || 0}%
            </div>
          </div>
          <div class="revenue-card gva">
            <div class="revenue-title">🏢 マージン（内部管理）</div>
            <div class="revenue-amount">${fmtMoney(gvaMargin)}</div>
            <div style="font-size:12px;color:#92400e;margin-top:4px">
              = クライアント請求 − インフル支払
            </div>
          </div>
        </div>` : '<div style="color:#94a3b8;font-size:13px;padding:12px 0">承認数と販売価格を入力すると自動計算されます</div>'}</div>`;

    return `
      <div class="fade-in" data-case-id="${esc(caseId)}" data-phase="phase4">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <h3>💴 Phase 4 — 精算・振り返り</h3>
            <span class="save-indicator" id="save-indicator">✓ 保存済み</span>
          </div>
          <div class="card-body">
            <div class="form-grid">
              ${renderField({ key:'finalSales',    label:'最終販売数（セット）', type:'number' }, p4.finalSales, caseId)}
              ${renderField({ key:'giftIncluded',  label:'うち先着特典含む',     type:'number' }, p4.giftIncluded, caseId)}
              ${renderField({ key:'giftExcluded',  label:'うち先着なし',          type:'number' }, p4.giftExcluded, caseId)}
              ${renderField({ key:'approvedCount', label:'承認数',              type:'number', required:true }, p4.approvedCount, caseId)}
              ${renderField({ key:'rejectedCount', label:'否認数',              type:'number' }, p4.rejectedCount, caseId)}
            </div>
            <hr class="divider">
            ${revSection}
            ${renderField({ key:'notes', label:'特記事項', type:'textarea', rows: 2 }, p4.notes, caseId)}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>📝 振り返り（Retrospective）</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">よかった点・課題・次回改善</label>
              <textarea class="form-control" rows="10" data-case-id="${esc(caseId)}" data-field="retrospective"
                style="font-family:inherit;line-height:1.8">${esc(p4.retrospective || '')}</textarea>
            </div>
          </div>
        </div>
      </div>`;
  }
};
