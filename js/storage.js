'use strict';

const STORAGE_KEY = 'gva_cases';

const Storage = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      console.error('Storage read error:', e);
      return [];
    }
  },

  getById(id) {
    return this.getAll().find(c => c.id === id) || null;
  },

  save(data) {
    try {
      const cases = this.getAll();
      data.updatedAt = new Date().toISOString();
      const idx = cases.findIndex(c => c.id === data.id);
      if (idx >= 0) {
        cases[idx] = data;
      } else {
        data.createdAt = data.createdAt || data.updatedAt;
        cases.unshift(data);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      return true;
    } catch (e) {
      console.error('Storage write error:', e);
      return false;
    }
  },

  delete(id) {
    try {
      const cases = this.getAll().filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      return true;
    } catch (e) {
      console.error('Storage delete error:', e);
      return false;
    }
  },

  generateId() {
    return 'case-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },

  initialize() {
    if (this.getAll().length === 0) {
      this.save(this.getSampleCase());
    }
  },

  getSampleCase() {
    const allStop = {
      conversion_point_confirmed: true,
      rejection_conditions_clear: true,
      point_deduction_policy_confirmed: true,
      payment_cycle_confirmed: true,
      approval_rate_disclosed: true,
      sales_cap_over_policy_confirmed: true,
      coupon_operation_verified: true,
      price_display_matches_checkout: true,
      server_load_verified: true,
      tracking_tag_installed: true,
      stock_confirmed: true,
      shipping_lead_confirmed: true,
      stockout_policy_confirmed: true,
      cs_contact_ready: true,
      return_flow_clear: true,
      incident_response_confirmed: true,
      pr_rule_confirmed: true,
      pharma_law_checked: true,
      ng_expressions_shared: true,
      material_usage_clear: true,
      emergency_contacts_confirmed: true,
      sales_report_schedule_agreed: true
    };

    const allCaution = {
      approval_rate_80plus: true,
      payment_60days_or_less: true,
      price_attractive: true,
      lp_speed_ok: true,
      guest_purchase_available: true,
      smartphone_ui_ok: true,
      stock_sufficient: true,
      novelty_restocking_fast: true,
      no_delivery_delay: true,
      cs_hours_sufficient: true,
      gifting_available: true,
      materials_sufficient: true,
      draft_check_ok: true,
      competitor_ng_reasonable: true,
      low_incident_risk: true,
      influencer_confirmed: true,
      holiday_support_ok: false,
      contact_responsive: true
    };

    return {
      id: 'sample-anua-001',
      name: 'anua × 楽天カミトクSALE × 成瀬愛里',
      brand: 'Anua',
      platform: '楽天',
      influencer: '成瀬愛里',
      influencer_ig: 'n.airi_taito',
      status: 'done',
      judgment: 'A',
      createdAt: '2026-05-01T09:00:00.000Z',
      updatedAt: '2026-05-17T12:00:00.000Z',
      phase0: {
        brand_name: 'Anua',
        product_name: 'PDRNセラム+レチノールセラム+PDRNクリーム+PDRNマスクパック',
        product_concept: '韓国発・PDRNとレチノールを組み合わせたプレミアムスキンケアセット',
        period_start: '2026-05-09T20:00',
        period_end: '2026-05-16T01:59',
        pre_announce_date: '2026-05-04',
        post_start_date: '2026-05-04',
        event_name_official: '楽天カミトクSALE',
        platform_deadline: '2026-05-02',
        reply_deadline: '2026-05-01',
        price_regular: '13600',
        price_sale: '5984',
        discount_rate: '56',
        set_contents: 'PDRNセラム30ml / レチノールセラム30ml / PDRNクリーム60ml / PDRNマスクパック10枚',
        purchase_limit_per_person: '2',
        rakuten_coupon_applicable: 'yes',
        other_coupon_compatible: 'no',
        shipping_origin: '韓国',
        novelty_type: '両方',
        novelty_count: '3000',
        novelty_full_count: '1500',
        novelty_mini_count: '3000',
        novelty_after_gift: 'PDRNトナーミニサイズ全員プレゼント',
        page_behavior_after_gift: '先着オプションが自動で選択不可になる',
        lowest_price_claim_ok: 'yes',
        lowest_price_evidence: '楽天最安値確認済み',
        /* 報酬条件 - 3-level permission */
        reward_type: 'CPS',
        client_reward_rate: '25',      /* クライアント請求率（クライアント・Staff のみ表示） */
        influencer_reward_rate: '18',  /* インフル支払率（インフル・Staff のみ表示） */
        reward_rate: '18',             /* 後方互換用 */
        conversion_point: '注文確定および決済完了',
        point_deduction_policy: 'ポイント利用分は売上から控除',
        approval_rate: '約95%',
        rejection_conditions: '決済待ち・注文キャンセル',
        payment_closing: '5月末',
        payment_date: '翌月末',
        payment_cycle: '30',
        sales_site: '楽天',
        lp_url: 'https://item.rakuten.co.jp/anuajapan/anua00154/',
        tracking_method: '楽天アフィリエイトタグ',
        coupon_code: '',
        link_placement: '概要欄・プロフィールリンク',
        draft_check_required: 'yes',
        shooting_ok: 'no',
        shooting_location: '',
        korea_visit_expenses_covered: 'no',
        japanese_staff_available: 'yes',
        brand_messaging: '最強のツヤ・弾力肌へ',
        creative_after_gift_url: '',
        gift_announce_strategy: '一括',
        pr_tag_rule: '#PRまたはタイアップラベル(@anua.jp)',
        ng_expressions: 'ブランドへのネガティブ表現NG・他ECサイト比較NG',
        competitor_ng: '競合スキンケアブランド全般',
        regulation_doc_url: '',
        material_usage_restrictions: '提供素材のみ使用可。二次加工禁止。',
        stock_count: '5000',
        shipping_lead_time: '3-5営業日',
        cs_contact: 'cs@anua.jp',
        return_policy: '未開封のみ返品可（送料負担はブランド）',
        sales_report_phases_agreed: 'no',
        holiday_support_ok: 'no',
        emergency_contacts: [
          { name: 'チャン ハジョン', role: 'ブランドメイン', phone: '-' },
          { name: '鈴木（Anua JP）', role: 'ブランドバックアップ', phone: '-' },
          { name: '楽天担当', role: '楽天担当', phone: '-' }
        ]
      },
      phase1: {
        stop_items: allStop,
        caution_items: allCaution
      },
      phase2: {
        confirmed_items: {
          sales_content: true,
          reward: true,
          sales_site: true,
          product: true,
          logistics: true,
          cs: true,
          regulation: true,
          influencer: true,
          risk: true,
          final_judgment: 'GO',
          final_judgment_reason: '全チェック項目クリア。先着ギフト3000個の在庫・韓国発送リードタイムを確認済み。'
        }
      },
      phase3: {
        salesLog: [
          { time: '00:10', count: 530 },
          { time: '00:15', count: 600 },
          { time: '00:20', count: 660 },
          { time: '00:25', count: 700 },
          { time: '00:30', count: 730 },
          { time: '01:00', count: 900 },
          { time: '01:30', count: 1020 },
          { time: '02:00', count: 1123 },
          { time: '02:30', count: 1230 },
          { time: '03:00', count: 1289 },
          { time: '04:00', count: 1387 },
          { time: '05:00', count: 1523 },
          { time: '06:00', count: 1578 },
          { time: '12:00', count: 1737 },
          { time: '24:00', count: 2724 },
          { time: '38:00', count: 2950 },
          { time: '48:00', count: 3118 },
          { time: '66:00', count: 3183 },
          { time: '90:00', count: 3242 },
          { time: '114:00', count: 3455 },
          { time: '168:00', count: 3695 }
        ],
        giftRemaining: 0,
        alertLines: [1000, 500, 70]
      },
      phase4: {
        finalSales: 3695,
        giftIncluded: 3000,
        giftExcluded: 695,
        approvedCount: 3695,
        rejectedCount: 0,
        notes: '先着3000個終了後に売上急落。ブースティング投稿で回復。',
        retrospective: '【よかった点】先着ギフト戦略が初動を加速。開始30分で730セット達成。\n【課題】①休日の売上報告体制が未合意で当日混乱。②正式イベント名（楽天カミトクSALE）を当日夜に確認。③購入上限数（2セット）を当日昼に確認。④クーポン併用可否を当日深夜に確認。\n【次回改善】①楽天担当含む緊急連絡先を事前確定。②売上報告フェーズを書面で合意。③正式名称・制限事項は全てPhase 0で完結。'
      }
    };
  }
};
