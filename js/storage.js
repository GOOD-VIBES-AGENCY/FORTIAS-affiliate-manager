'use strict';

const STORAGE_KEY = 'gva_cases';
const SUPABASE_URL = 'https://wptypwicojylajpdrekn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lFZKEdbAzARnf6O8qz_0Ww_r1E31BJU';

/* ── Supabase client (lazy init) ── */
let _sb = null;
function getSB() {
  if (!_sb && window.supabase) {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sb;
}

/* ── Local cache helpers (sync) ── */
function localGet() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function localSet(cases) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); } catch {}
}

/* ── Supabase REST helpers (async) ── */
async function remoteGetAll() {
  const sb = getSB();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('cases')
      .select('id, data, updated_at, created_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data.map(row => ({
      ...(row.data || {}),
      id: row.id,
      updatedAt: row.updated_at,
      createdAt: row.created_at
    }));
  } catch (e) {
    console.warn('[Supabase] fetch failed:', e.message);
    return null;
  }
}

async function remoteUpsert(caseData) {
  const sb = getSB();
  if (!sb) return false;
  try {
    const { error } = await sb.from('cases').upsert({
      id:           caseData.id,
      name:         caseData.name         || '',
      brand:        caseData.brand        || '',
      platform:     caseData.platform     || '',
      influencer:   caseData.influencer   || '',
      influencer_ig:caseData.influencer_ig|| '',
      status:       caseData.status       || 'phase0',
      judgment:     caseData.judgment     || 'pending',
      data:         caseData,
      updated_at:   new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] save failed:', e.message);
    return false;
  }
}

async function remoteDelete(id) {
  const sb = getSB();
  if (!sb) return false;
  try {
    const { error } = await sb.from('cases').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] delete failed:', e.message);
    return false;
  }
}

/* ── Sync status badge ── */
function setSyncStatus(state) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const map = {
    syncing: { text: '⟳ 同期中',   cls: 'sync-syncing' },
    synced:  { text: '☁ 同期済み', cls: 'sync-ok'      },
    offline: { text: '⚡ ローカル', cls: 'sync-offline' },
    error:   { text: '✕ 同期失敗', cls: 'sync-error'   }
  };
  const s = map[state] || map.offline;
  el.textContent = s.text;
  el.className = `sync-badge ${s.cls}`;
}

/* ══════════════════════════════════════════════════════════════
   Storage — public API
══════════════════════════════════════════════════════════════ */
const Storage = {

  /* ── Sync API (immediate, local cache) ── */
  getAll() { return localGet(); },

  getById(id) { return localGet().find(c => c.id === id) || null; },

  save(data) {
    try {
      const cases = localGet();
      data.updatedAt = new Date().toISOString();
      const idx = cases.findIndex(c => c.id === data.id);
      if (idx >= 0) { cases[idx] = data; }
      else { data.createdAt = data.createdAt || data.updatedAt; cases.unshift(data); }
      localSet(cases);
      // Async cloud sync
      remoteUpsert(data).then(ok => setSyncStatus(ok ? 'synced' : 'offline'));
      return true;
    } catch { return false; }
  },

  delete(id) {
    try {
      localSet(localGet().filter(c => c.id !== id));
      remoteDelete(id).then(ok => setSyncStatus(ok ? 'synced' : 'offline'));
      return true;
    } catch { return false; }
  },

  generateId() {
    return 'case-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },

  /* ── Async init: Supabase → local merge ── */
  async initialize() {
    setSyncStatus('syncing');

    const remote = await remoteGetAll();

    if (remote !== null) {
      if (remote.length > 0) {
        // Remote is authoritative; keep local-only cases
        const local = localGet();
        const remoteIds = new Set(remote.map(c => c.id));
        const localOnly = local.filter(c => !remoteIds.has(c.id));
        localSet([...remote, ...localOnly]);
        // Push local-only to remote
        for (const c of localOnly) await remoteUpsert(c);
      } else {
        // Remote empty → push local to cloud (or seed sample)
        const local = localGet();
        if (local.length === 0) {
          const sample = this.getSampleCase();
          const sampleYui = this.getSampleYuiCase();
          localSet([sample, sampleYui]);
          await remoteUpsert(sample);
          await remoteUpsert(sampleYui);
        } else {
          for (const c of local) await remoteUpsert(c);
        }
      }
      setSyncStatus('synced');
    } else {
      // Supabase unreachable → fallback to local only
      if (localGet().length === 0) localSet([this.getSampleCase()]);
      setSyncStatus('offline');
    }
  },

  /* ── Sample data: ゆい × Anua ── */
  getSampleYuiCase() {
    return {
      id: 'sample-yui-001',
      name: 'anua × PDRNセラム+ミスト × ゆい',
      brand: 'Anua', platform: '楽天',
      influencer: 'ゆい', influencer_ig: 'yui___12.8',
      status: 'done', judgment: 'B',
      createdAt: '2026-05-10T09:00:00.000Z',
      updatedAt: '2026-05-20T12:00:00.000Z',
      phase0: {
        brand_name: 'Anua',
        product_name: 'PDRNセラム30ml + PDRNミスト100ml',
        product_concept: 'PDRNとミストのW保湿セット。毛穴・くすみケアに特化した韓国ブランド',
        period_start: '2026-05-16T20:00', period_end: '2026-05-23T01:59',
        pre_announce_date: '2026-05-11', post_start_date: '2026-05-11',
        event_name_official: '楽天スーパーSALE',
        platform_deadline: '2026-05-09',
        price_regular: '9800', price_sale: '4900', discount_rate: '50',
        set_contents: 'PDRNセラム30ml / PDRNミスト100ml',
        purchase_limit_per_person: '3',
        platform_coupon_applicable: 'yes', other_coupon_compatible: 'no',
        shipping_origin: '韓国',
        novelty_type: 'ミニ', novelty_count: '2000',
        novelty_after_gift: 'PDRNシートマスク3枚セット全員プレゼント',
        page_behavior_after_gift: '先着オプションが自動で選択不可になる',
        lowest_price_claim_ok: 'yes',
        reward_type: 'CPS',
        client_reward_rate: '22', influencer_reward_rate: '15', reward_rate: '15',
        conversion_point: '注文確定および決済完了',
        point_deduction_policy: 'ポイント利用分は売上から控除',
        approval_rate: '約92%', rejection_conditions: '決済待ち・注文キャンセル',
        payment_closing: '5月末', payment_date: '翌月末', payment_cycle: '30',
        sales_site: '楽天', lp_url: 'https://item.rakuten.co.jp/anuajapan/anua-yui-set/',
        tracking_method: '楽天アフィリエイトタグ',
        draft_check_required: 'yes', shooting_ok: 'no',
        brand_messaging: '毛穴レス・くすみゼロへ。PDRNのWアプローチ',
        gift_announce_strategy: '一括',
        pr_tag_rule: '#PRまたはタイアップラベル(@anua.jp)',
        ng_expressions: 'ブランドへのネガティブ表現NG',
        competitor_ng: '競合スキンケアブランド全般',
        material_usage_restrictions: '提供素材のみ使用可',
        stock_count: '3000', shipping_lead_time: '3-5営業日',
        cs_contact: 'cs@anua.jp',
        sales_report_phases_agreed: 'yes', holiday_support_ok: 'yes',
        emergency_contacts: [
          { name: 'チャン ハジョン', role: 'ブランドメイン', phone: '-' },
          { name: '鈴木（Anua JP）', role: 'バックアップ',   phone: '-' },
          { name: '楽天担当',       role: '楽天担当',        phone: '-' }
        ]
      },
      phase1: {
        stop_items: {
          conversion_point_confirmed: true, rejection_conditions_clear: true,
          point_deduction_policy_confirmed: true, payment_cycle_confirmed: true,
          approval_rate_disclosed: true, sales_cap_over_policy_confirmed: true,
          coupon_operation_verified: true, price_display_matches_checkout: true,
          server_load_verified: true, tracking_tag_installed: true,
          stock_confirmed: true, shipping_lead_confirmed: true,
          stockout_policy_confirmed: true, cs_contact_ready: true,
          return_flow_clear: true, incident_response_confirmed: true,
          pr_rule_confirmed: true, pharma_law_checked: true,
          ng_expressions_shared: true, material_usage_clear: true,
          emergency_contacts_confirmed: true, sales_report_schedule_agreed: true
        },
        caution_items: {
          approval_rate_80plus: true, payment_60days_or_less: true,
          price_attractive: true, lp_speed_ok: true,
          guest_purchase_available: true, smartphone_ui_ok: true,
          stock_sufficient: false, novelty_restocking_fast: true,
          no_delivery_delay: true, cs_hours_sufficient: true,
          gifting_available: true, materials_sufficient: true,
          draft_check_ok: true, competitor_ng_reasonable: true,
          low_incident_risk: true, influencer_confirmed: true,
          holiday_support_ok: true, contact_responsive: true
        }
      },
      phase2: {
        confirmed_items: {
          sales_content: true, reward: true, sales_site: true,
          product: true, logistics: true, cs: true,
          regulation: true, influencer: true, risk: true,
          final_judgment: 'GO',
          final_judgment_reason: 'ほぼ全チェック項目クリア。在庫3000個はやや少なめだが許容範囲。'
        }
      },
      phase3: {
        salesLog: [
          {time:'00:10',count:180},{time:'00:30',count:320},{time:'01:00',count:510},
          {time:'02:00',count:730},{time:'04:00',count:980},{time:'08:00',count:1200},
          {time:'24:00',count:1580},{time:'48:00',count:1920},{time:'72:00',count:2100}
        ],
        giftRemaining: 0, alertLines: [1000, 500, 70]
      },
      phase4: {
        finalSales: 2100, giftIncluded: 2000, giftExcluded: 100,
        approvedCount: 1932, rejectedCount: 168,
        notes: '先着2000個終了後に失速。在庫が少なかったため早期終了。',
        retrospective: '【よかった点】ゆいさんの強いフォロワー層が購買に直結。開始2時間で730セット達成。\n【課題】①在庫3000個は少なかった（もっと多く確保すべきだった）②楽天スーパーSALEの競合が多く差別化が必要だった\n【次回改善】①在庫5000個以上を確保\n②ゆいさんの投稿スケジュールをより詳細に設定する'
      }
    };
  },

  /* ── Sample data (anua実案件) ── */
  getSampleCase() {
    const allStop = {
      conversion_point_confirmed: true, rejection_conditions_clear: true,
      point_deduction_policy_confirmed: true, payment_cycle_confirmed: true,
      approval_rate_disclosed: true, sales_cap_over_policy_confirmed: true,
      coupon_operation_verified: true, price_display_matches_checkout: true,
      server_load_verified: true, tracking_tag_installed: true,
      stock_confirmed: true, shipping_lead_confirmed: true,
      stockout_policy_confirmed: true, cs_contact_ready: true,
      return_flow_clear: true, incident_response_confirmed: true,
      pr_rule_confirmed: true, pharma_law_checked: true,
      ng_expressions_shared: true, material_usage_clear: true,
      emergency_contacts_confirmed: true, sales_report_schedule_agreed: true
    };
    const allCaution = {
      approval_rate_80plus: true, payment_60days_or_less: true,
      price_attractive: true, lp_speed_ok: true,
      guest_purchase_available: true, smartphone_ui_ok: true,
      stock_sufficient: true, novelty_restocking_fast: true,
      no_delivery_delay: true, cs_hours_sufficient: true,
      gifting_available: true, materials_sufficient: true,
      draft_check_ok: true, competitor_ng_reasonable: true,
      low_incident_risk: true, influencer_confirmed: true,
      holiday_support_ok: false, contact_responsive: true
    };

    return {
      id: 'sample-anua-001',
      name: 'anua × 楽天カミトクSALE × 成瀬愛里',
      brand: 'Anua', platform: '楽天',
      influencer: '成瀬愛里', influencer_ig: 'n.airi_taito',
      status: 'done', judgment: 'A',
      createdAt: '2026-05-01T09:00:00.000Z',
      updatedAt: '2026-05-17T12:00:00.000Z',
      phase0: {
        brand_name: 'Anua',
        product_name: 'PDRNセラム+レチノールセラム+PDRNクリーム+PDRNマスクパック',
        product_concept: 'PDRNとレチノールを組み合わせた韓国発プレミアムスキンケアセット',
        period_start: '2026-05-09T20:00', period_end: '2026-05-16T01:59',
        pre_announce_date: '2026-05-04', post_start_date: '2026-05-04',
        event_name_official: '楽天カミトクSALE',
        platform_deadline: '2026-05-02', reply_deadline: '2026-05-01',
        price_regular: '13600', price_sale: '5984', discount_rate: '56',
        set_contents: 'PDRNセラム30ml / レチノールセラム30ml / PDRNクリーム60ml / PDRNマスクパック10枚',
        purchase_limit_per_person: '2',
        platform_coupon_applicable: 'yes', other_coupon_compatible: 'no',
        shipping_origin: '韓国',
        novelty_type: '両方', novelty_count: '3000',
        novelty_after_gift: 'PDRNトナーミニサイズ全員プレゼント',
        page_behavior_after_gift: '先着オプションが自動で選択不可になる',
        lowest_price_claim_ok: 'yes',
        reward_type: 'CPS',
        client_reward_rate: '25', influencer_reward_rate: '18', reward_rate: '18',
        conversion_point: '注文確定および決済完了',
        point_deduction_policy: 'ポイント利用分は売上から控除',
        approval_rate: '約95%', rejection_conditions: '決済待ち・注文キャンセル',
        payment_closing: '5月末', payment_date: '翌月末', payment_cycle: '30',
        sales_site: '楽天', lp_url: 'https://item.rakuten.co.jp/anuajapan/anua00154/',
        tracking_method: '楽天アフィリエイトタグ',
        draft_check_required: 'yes', shooting_ok: 'no',
        japanese_staff_available: 'yes', brand_messaging: '最強のツヤ・弾力肌へ',
        gift_announce_strategy: '一括',
        pr_tag_rule: '#PRまたはタイアップラベル(@anua.jp)',
        ng_expressions: 'ブランドへのネガティブ表現NG・他ECサイト比較NG',
        competitor_ng: '競合スキンケアブランド全般',
        material_usage_restrictions: '提供素材のみ使用可',
        stock_count: '5000', shipping_lead_time: '3-5営業日',
        cs_contact: 'cs@anua.jp',
        sales_report_phases_agreed: 'no', holiday_support_ok: 'no',
        emergency_contacts: [
          { name: 'チャン ハジョン', role: 'ブランドメイン', phone: '-' },
          { name: '鈴木（Anua JP）', role: 'バックアップ',   phone: '-' },
          { name: '楽天担当',       role: '楽天担当',        phone: '-' }
        ]
      },
      phase1: { stop_items: allStop, caution_items: allCaution },
      phase2: {
        confirmed_items: {
          sales_content: true, reward: true, sales_site: true,
          product: true, logistics: true, cs: true,
          regulation: true, influencer: true, risk: true,
          final_judgment: 'GO',
          final_judgment_reason: '全チェック項目クリア。先着ギフト3000個・韓国発送リードタイム確認済み。'
        }
      },
      phase3: {
        salesLog: [
          {time:'00:10',count:530},{time:'00:15',count:600},{time:'00:20',count:660},
          {time:'00:25',count:700},{time:'00:30',count:730},{time:'01:00',count:900},
          {time:'01:30',count:1020},{time:'02:00',count:1123},{time:'02:30',count:1230},
          {time:'03:00',count:1289},{time:'04:00',count:1387},{time:'05:00',count:1523},
          {time:'06:00',count:1578},{time:'12:00',count:1737},{time:'24:00',count:2724},
          {time:'38:00',count:2950},{time:'48:00',count:3118},{time:'66:00',count:3183},
          {time:'90:00',count:3242},{time:'114:00',count:3455},{time:'168:00',count:3695}
        ],
        giftRemaining: 0, alertLines: [1000, 500, 70]
      },
      phase4: {
        finalSales: 3695, giftIncluded: 3000, giftExcluded: 695,
        approvedCount: 3695, rejectedCount: 0,
        notes: '先着3000個終了後に売上急落。ブースティング投稿で回復。',
        retrospective: '【よかった点】先着ギフト戦略が初動を加速。開始30分で730セット達成。\n【課題】①休日の売上報告体制が未合意で当日混乱。②正式イベント名を当日夜に確認。③購入上限数（2セット）を当日昼に確認。④クーポン併用可否を当日深夜に確認。\n【次回改善】①楽天担当含む緊急連絡先を事前確定。②売上報告フェーズを書面で合意。③正式名称・制限事項は全てPhase 0で完結。'
      }
    };
  }
};
