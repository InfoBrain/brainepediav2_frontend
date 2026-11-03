import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFeedPostRequest } from "./feedService";
import { classifyProjectFile, validateCoverFile } from "./feedMedia";
import { EMPTY_GUID, normalizeUserMissionStatistics, presentGuid } from "./missionStatistics";
import { normalizeEmailLogPage } from "./emailLogs";
import { formatNigeriaTimestamp, normalizeSmartDocumentPage } from "./smartDocuments";

describe("mission statistics", () => {
  it("keeps continuable missions and treats an empty assignment guid as personal", () => {
    const stats = normalizeUserMissionStatistics({
      totalAssignedMissions: 4,
      completedMissionsCount: 1,
      pendingMissionsCount: 1,
      inProgressMissionsCount: 2,
      totalXpEarned: 150,
      missionSuccessRate: 25,
      continuableMissions: [
        {
          employerChallengeAssignmentId: EMPTY_GUID,
          experienceSessionId: null,
          problemNodeId: "11111111-1111-4111-8111-111111111111",
          challengeName: "Practice",
          companyName: "General Platform",
          startedAt: null,
          completedAt: null,
          score: 0,
          hasCompleted: false,
          status: "Pending",
          canContinue: true,
          missionSource: "Personal",
        },
        {
          employerChallengeAssignmentId: "22222222-2222-4222-8222-222222222222",
          experienceSessionId: "33333333-3333-4333-8333-333333333333",
          problemNodeId: "44444444-4444-4444-8444-444444444444",
          challengeName: "Q3 Backend Assessment",
          companyName: "InfoBrain",
          status: "InProgress",
          canContinue: true,
          missionSource: "Corporate",
        },
      ],
      recentMissions: [],
    });

    assert.equal(stats.pendingMissionsCount, 1);
    assert.equal(stats.missionSuccessRate, 25);
    assert.equal(stats.continuableMissions.length, 2);
    assert.equal(stats.continuableMissions[0].employerChallengeAssignmentId, null);
    assert.equal(stats.continuableMissions[0].experienceSessionId, null);
    assert.equal(stats.continuableMissions[1].experienceSessionId, "33333333-3333-4333-8333-333333333333");
    assert.equal(presentGuid(EMPTY_GUID), null);
  });
});

describe("feed cover upload", () => {
  it("sends a cover file as multipart and never a thumbnail", () => {
    const file = new File(["img"], "cover.png", { type: "image/png" });
    const body = buildFeedPostRequest({
      title: "Launch note",
      content: "<p>Shipped</p>",
      media: file,
      mediaUrl: "https://cdn.example.com/ignored.png",
      visibility: "Public",
    });
    assert.ok(body instanceof FormData);
    assert.equal(body.get("Content"), "<p>Shipped</p>");
    assert.equal(body.get("Title"), "Launch note");
    assert.equal(body.get("Visibility"), "Public");
    assert.equal(body.get("MediaUrl"), null);
    assert.equal(body.get("thumbnailUrl"), null);
    assert.equal(body.get("Thumbnail"), null);
    assert.ok(body.get("Media") instanceof File);
  });

  it("keeps the current cover when a text edit has no new file", () => {
    const body = buildFeedPostRequest({ content: "<p>Edit</p>", title: "Note" });
    assert.equal(body instanceof FormData, false);
    assert.deepEqual(body, { content: "<p>Edit</p>", title: "Note" });
  });

  it("rejects files outside the cover rules", () => {
    assert.match(validateCoverFile(new File(["x"], "notes.pdf", { type: "application/pdf" })) || "", /image|video/i);
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    assert.match(validateCoverFile(big) || "", /2 MB/);
    assert.deepEqual(classifyProjectFile(new File(["x"], "brief.pdf")), { isVideo: false, isImage: false });
    assert.deepEqual(classifyProjectFile(new File(["x"], "demo.mp4", { type: "video/mp4" })), { isVideo: true, isImage: false });
  });
});

describe("smart documents and email logs", () => {
  it("reads a paged CV list and keeps Nigeria-local clock time", () => {
    const page = normalizeSmartDocumentPage({
      userId: "owner",
      profileId: "profile",
      totalCount: 1,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 1,
      documents: [{ smartDocHistoryId: "doc", documentType: "CV", chargedFee: 0, dateCreated: "2026-11-03T10:00:00", rawContent: null }],
    });
    assert.equal(page.documents[0].smartDocHistoryId, "doc");
    assert.match(formatNigeriaTimestamp("2026-11-03T10:00:00"), /10:00/);
  });

  it("reads an email delivery page", () => {
    const page = normalizeEmailLogPage({
      items: [{
        emailDeliveryLogId: "log",
        recipientEmail: "ada@example.com",
        recipientUserId: null,
        subject: "Finish your Brainepedia mission",
        source: "NotificationScheduler",
        deliveryStatus: "Failed",
        failureSummary: "smtp down",
        createdAtUtc: "2026-11-03T10:15:00Z",
      }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 1,
    });
    assert.equal(page.items[0].deliveryStatus, "Failed");
    assert.equal(page.items[0].failureSummary, "smtp down");
  });
});
