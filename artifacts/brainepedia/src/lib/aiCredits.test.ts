import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractCompletedMissionResults,
  extractCreditsExhausted,
  formatCredits,
  formatMoney,
  isAiCreditsExhaustedCode,
  normalizeCheckoutUrl,
  normalizeCreditBalance,
  normalizeOrganizationBilling,
  normalizeUsageHistory,
  usagePages,
  usageStatusLabel,
  VIRTUAL_SELF_RATE_LIMIT_MESSAGE,
} from "./aiCredits";
import { normalizePrivacySettings, privacySettingsPayload } from "./privacySettings";

describe("privacy settings", () => {
  it("sends every field including false values", () => {
    const payload = privacySettingsPayload({
      isPublicDossierEnabled: false,
      allowPublicMissionResults: false,
      allowPublicMissionScores: false,
      allowMlTraining: false,
      emailNotificationsEnabled: true,
    });
    assert.equal(payload.isPublicDossierEnabled, false);
    assert.equal(payload.allowPublicMissionResults, false);
    assert.equal(payload.allowPublicMissionScores, false);
    assert.equal(payload.allowMlTraining, false);
    assert.equal(payload.emailNotificationsEnabled, true);
  });

  it("normalizes envelope payloads", () => {
    const settings = normalizePrivacySettings({
      status: "ok",
      message: "loaded",
      data: { isPublicDossierEnabled: true, allowPublicMissionResults: true },
    });
    assert.equal(settings.isPublicDossierEnabled, true);
    assert.equal(settings.allowPublicMissionResults, true);
    assert.equal(settings.allowPublicMissionScores, false);
  });
});

describe("credit formatting and usage", () => {
  it("formats large credit counts", () => {
    assert.equal(formatCredits(350000), "350,000");
  });

  it("formats USD without using NGN", () => {
    assert.equal(formatMoney(49.9, "USD"), "$49.90");
    assert.equal(formatMoney(19.9, "USD"), "$19.90");
  });

  it("paginates usage from totalCount and pageSize", () => {
    assert.equal(usagePages(2, 20), 1);
    assert.equal(usagePages(40, 20), 2);
    assert.equal(usagePages(0, 20), 1);
  });

  it("maps usage status values", () => {
    assert.equal(usageStatusLabel(0), "Reserved");
    assert.equal(usageStatusLabel(1), "Charged");
    assert.equal(usageStatusLabel(2), "Released");
    assert.equal(usageStatusLabel(3), "Failed");
    assert.equal(usageStatusLabel(4), "Denied");
  });

  it("does not load the entire history payload as a single page", () => {
    const history = normalizeUsageHistory({
      totalCount: 40,
      currentPage: 2,
      pageSize: 20,
      items: [{ aiFeature: "mentor", usageStatus: 1, remainingBalanceAfter: 12 }],
    });
    assert.equal(history.currentPage, 2);
    assert.equal(history.pageSize, 20);
    assert.equal(history.totalCount, 40);
    assert.equal(history.items.length, 1);
    assert.equal(usagePages(history.totalCount, history.pageSize), 2);
  });
});

describe("credit exhaustion normalization", () => {
  it("detects 402 AI_CREDITS_EXHAUSTED payloads", () => {
    const payload = extractCreditsExhausted(402, {
      errorCode: "AI_CREDITS_EXHAUSTED",
      message: "This account has exhausted its Brainiac AI credits for the current billing cycle.",
      canUpgrade: true,
      canRenewOrRecharge: false,
    });
    assert.ok(payload);
    assert.equal(payload?.errorCode, "AI_CREDITS_EXHAUSTED");
    assert.equal(payload?.canUpgrade, true);
    assert.equal(payload?.canRenewOrRecharge, false);
  });

  it("does not treat arbitrary 500 errors as exhaustion", () => {
    assert.equal(extractCreditsExhausted(500, { message: "Unexpected server error" }), null);
  });

  it("normalizes a 500 that clearly identifies AI_CREDITS_EXHAUSTED", () => {
    const payload = extractCreditsExhausted(500, {
      errorCode: "AI_CREDITS_EXHAUSTED",
      message: "Credits exhausted",
    });
    assert.ok(payload);
    assert.equal(isAiCreditsExhaustedCode(payload?.errorCode || ""), true);
  });
});

describe("public mission results", () => {
  it("reads completedMissionResults and hides scores when null", () => {
    const results = extractCompletedMissionResults({
      completedMissionResults: [
        { missionTitle: "API Design", passed: true, score: null, profession: "Software", district: "Backend" },
      ],
    });
    assert.equal(results.length, 1);
    assert.equal(results[0].score, null);
    assert.equal(results[0].passed, true);
  });

  it("does not invent results when the collection is missing", () => {
    assert.deepEqual(extractCompletedMissionResults({ displayName: "Ada" }), []);
  });
});

describe("organization billing", () => {
  it("displays backend totals instead of calculating them", () => {
    const billing = normalizeOrganizationBilling({
      organizationBasePrice: 49.9,
      teamSeatUnitPrice: 19.9,
      activeBillableTeamMemberCount: 3,
      totalMonthlyPrice: 109.6,
      currency: "USD",
    });
    assert.equal(billing.totalMonthlyPrice, 109.6);
    assert.equal(billing.organizationBasePrice, 49.9);
    assert.notEqual(billing.totalMonthlyPrice, (billing.organizationBasePrice || 0) + 1);
  });
});

describe("checkout and wallets", () => {
  it("uses the server checkout URL", () => {
    assert.equal(
      normalizeCheckoutUrl({ checkoutUrl: "https://checkout.paystack.com/abc" }),
      "https://checkout.paystack.com/abc",
    );
    assert.equal(normalizeCheckoutUrl({}), "");
  });

  it("keeps wallet fields from the backend", () => {
    const balance = normalizeCreditBalance({
      walletType: "TeamSeat",
      remainingCredits: 12,
      canUseAI: false,
      isExhausted: true,
    });
    assert.equal(balance.walletType, "TeamSeat");
    assert.equal(balance.canUseAI, false);
    assert.equal(balance.remainingCredits, 12);
  });
});

describe("virtual self rate limit copy", () => {
  it("uses the documented 429 message", () => {
    assert.equal(VIRTUAL_SELF_RATE_LIMIT_MESSAGE, "Too many virtual-self requests. Please try again later.");
  });
});
