// Fortis 4-site demo — shared data + helpers
const DATA = {
  "ABC-123": {
    mid: "5421-009-882",
    merchant: "Sunrise Coffee Roasters",
    type: "retail_qsr",
    contact: "ops@sunriseroast.com",
    opened: "2025-11-02",
    pdf: {
      amex_enabled: true,
      ecommerce_enabled: false,
      recurring_billing: false,
      tip_adjust: true,
      avs_required: true,
      notes: "Standard QSR setup. Single terminal, batch nightly."
    }
  },
  "ABC-777": {
    mid: "5421-118-401",
    merchant: "Polk Street Athletics",
    type: "retail_ecom_hybrid",
    contact: "billing@polkstreet.co",
    opened: "2026-01-14",
    pdf: {
      amex_enabled: true,
      ecommerce_enabled: true,
      recurring_billing: true,
      tip_adjust: false,
      avs_required: true,
      notes: "Memberships + retail. eCommerce required for online store."
    }
  },
  "ABC-999": {
    mid: "5421-220-117",
    merchant: "Greenfield Medical Group",
    type: "healthcare",
    contact: "admin@greenfieldmed.com",
    opened: "2026-03-08",
    pdf: {
      amex_enabled: false,
      ecommerce_enabled: false,
      recurring_billing: true,
      tip_adjust: false,
      avs_required: true,
      notes: "REVIEW: HIPAA-sensitive — confirm BAA on file before activation."
    }
  }
};

const WIKI = {
  retail_qsr: {
    title: "Retail / Quick-Service Restaurant",
    params: { amex_enabled: true, ecommerce_enabled: false, recurring_billing: false, tip_adjust: true, avs_required: false }
  },
  retail_ecom_hybrid: {
    title: "Retail + eCommerce Hybrid",
    params: { amex_enabled: true, ecommerce_enabled: false, recurring_billing: false, tip_adjust: false, avs_required: true }
  },
  healthcare: {
    title: "Healthcare (HIPAA)",
    params: { amex_enabled: false, ecommerce_enabled: false, recurring_billing: true, tip_adjust: false, avs_required: true }
  }
};

const ASF = {
  retail_qsr: { amex_enabled: true, ecommerce_enabled: false, recurring_billing: false, tip_adjust: true, avs_required: true },
  retail_ecom_hybrid: { amex_enabled: true, ecommerce_enabled: true, recurring_billing: true, tip_adjust: false, avs_required: true },
  healthcare: { amex_enabled: false, ecommerce_enabled: false, recurring_billing: true, tip_adjust: false, avs_required: true }
};

const FIELD_LABELS = {
  amex_enabled: "American Express",
  ecommerce_enabled: "eCommerce Gateway",
  recurring_billing: "Recurring Billing",
  tip_adjust: "Tip Adjustment",
  avs_required: "AVS Required"
};

function getCase() { return sessionStorage.getItem("fortis_case") || ""; }
function setCase(c) { sessionStorage.setItem("fortis_case", c); }
function getMID() { return sessionStorage.getItem("fortis_mid") || ""; }
function setMID(m) { sessionStorage.setItem("fortis_mid", m); }
function record() { return DATA[getCase()] || null; }
