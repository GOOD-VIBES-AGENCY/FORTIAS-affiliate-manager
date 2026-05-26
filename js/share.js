'use strict';

/**
 * Share / Permission System
 *
 * Permission levels:
 *   staff       → full data (all rates, margins, internal notes)
 *   influencer  → sees influencer_reward_rate only; no client_reward_rate, no margin, no internal notes
 *   client      → sees client_reward_rate only; no influencer_reward_rate, no margin, no internal notes
 *
 * マージン = client_reward_rate - influencer_reward_rate
 * This is NEVER encoded in influencer or client share payloads.
 */
const Share = {
  LEVELS: {
    staff:      { label: '自社メンバー用',       icon: '🏢', color: 'badge-phase4' },
    influencer: { label: 'インフルエンサー用',   icon: '⭐', color: 'badge-done' },
    client:     { label: 'クライアント用',       icon: '👔', color: 'badge-phase2' }
  },

  /**
   * Build a share payload for the given permission level.
   * Sensitive fields are stripped per the permission matrix.
   */
  encodeCase(caseData, permissionLevel = 'staff') {
    const p0 = caseData.phase0 || {};
    const p4 = caseData.phase4 || {};

    // --- Phase 0: base fields visible to all ---
    const p0Base = {
      event_name_official: p0.event_name_official,
      brand_name:          p0.brand_name,
      product_name:        p0.product_name,
      product_concept:     p0.product_concept,
      period_start:        p0.period_start,
      period_end:          p0.period_end,
      pre_announce_date:   p0.pre_announce_date,
      post_start_date:     p0.post_start_date,
      price_regular:       p0.price_regular,
      price_sale:          p0.price_sale,
      discount_rate:       p0.discount_rate,
      purchase_limit_per_person: p0.purchase_limit_per_person,
      set_contents:        p0.set_contents,
      novelty_count:       p0.novelty_count,
      novelty_type:        p0.novelty_type,
      novelty_after_gift:  p0.novelty_after_gift,
      shipping_origin:     p0.shipping_origin,
      lp_url:              p0.lp_url,
      brand_messaging:     p0.brand_messaging,
      pr_tag_rule:         p0.pr_tag_rule,
      ng_expressions:      p0.ng_expressions,
      reward_type:         p0.reward_type,
      conversion_point:    p0.conversion_point,
      rejection_conditions: p0.rejection_conditions,
      payment_closing:     p0.payment_closing,
      payment_date:        p0.payment_date,
      gift_announce_strategy: p0.gift_announce_strategy,
      sales_site:          p0.sales_site
    };

    // --- Reward rates: conditionally included ---
    // staff   → both rates
    // influencer → influencer_reward_rate only
    // client     → client_reward_rate only
    // マージン → staff only (calculated, not stored)
    if (permissionLevel === 'staff' || permissionLevel === 'client') {
      p0Base.client_reward_rate = p0.client_reward_rate;
    }
    if (permissionLevel === 'staff' || permissionLevel === 'influencer') {
      p0Base.influencer_reward_rate = p0.influencer_reward_rate || p0.reward_rate;
    }

    // --- Emergency contacts ---
    if (permissionLevel === 'staff') {
      p0Base.emergency_contacts = p0.emergency_contacts;
    } else if (permissionLevel === 'influencer') {
      // Show only contacts relevant to influencer (all for now; could filter by role)
      p0Base.emergency_contacts = (p0.emergency_contacts || []).filter(
        c => c.role && !c.role.includes('楽天') && !c.role.toLowerCase().includes('client')
      );
    }
    // client → no emergency contacts

    // --- Phase 4: sales results (visible to all but financial details restricted) ---
    let p4Payload = null;
    if (p4.finalSales !== undefined) {
      p4Payload = {
        finalSales:    p4.finalSales,
        approvedCount: p4.approvedCount,
        rejectedCount: p4.rejectedCount
      };
      if (permissionLevel === 'staff' || permissionLevel === 'influencer') {
        // influencer can see their own revenue
        const rate = parseFloat(p0.influencer_reward_rate || p0.reward_rate || 0) / 100;
        const price = parseFloat(p0.price_sale || 0);
        p4Payload.influencer_revenue = Math.round((p4.approvedCount || 0) * price * rate);
      }
      if (permissionLevel === 'staff' || permissionLevel === 'client') {
        // client can see what they owe
        const rate = parseFloat(p0.client_reward_rate || 0) / 100;
        const price = parseFloat(p0.price_sale || 0);
        p4Payload.client_revenue = Math.round((p4.approvedCount || 0) * price * rate);
      }
      if (permissionLevel === 'staff') {
        // staff sees notes too
        p4Payload.notes = p4.notes;
      }
    }

    const payload = {
      _perm:      permissionLevel,
      _v:         1,
      id:         caseData.id,
      name:       caseData.name,
      brand:      caseData.brand,
      platform:   caseData.platform,
      influencer: caseData.influencer,
      influencer_ig: caseData.influencer_ig,
      status:     caseData.status,
      judgment:   (permissionLevel === 'staff') ? caseData.judgment : undefined,
      createdAt:  caseData.createdAt,
      updatedAt:  caseData.updatedAt,
      phase0:     p0Base,
      phase4:     p4Payload
    };

    try {
      const json = JSON.stringify(payload);
      // URL-safe base64: + → -, / → _, strip padding =
      return btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (e) {
      console.error('Share encode error:', e);
      return null;
    }
  },

  decodeCase(encoded) {
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
    } catch (e) {
      console.error('Share decode error:', e);
      return null;
    }
  },

  getShareUrl(caseData, permissionLevel = 'staff') {
    const encoded = this.encodeCase(caseData, permissionLevel);
    if (!encoded) return null;
    // Work for both local file and GitHub Pages
    const path = location.href.split('#')[0];
    const base = path.endsWith('/') ? path : path.substring(0, path.lastIndexOf('/') + 1);
    return `${base}share.html#data=${encoded}`;
  },

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fallback */ }
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
};
