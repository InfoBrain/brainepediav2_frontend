/**
 * Unwrap double-encoded Constraints / ExpectedOutcomes on live problem nodes.
 *
 * The API binds List<string> from repeated form fields. JSON.stringify()'d arrays
 * were stored as a single string item:
 *   ["[\"Stay inside Architect work in Foundations Quarter.\", ...]"]
 *
 * This rewrites them as a real string array:
 *   ["Stay inside Architect work in Foundations Quarter", "..."]
 *
 * Usage:
 *   node scripts/fix-problem-node-list-fields.mjs --dry-run
 *   node scripts/fix-problem-node-list-fields.mjs
 */

const BASE = process.env.BRAINEPEDIA_API_BASE || "https://api.brainepedia.com";
const EMAIL = process.env.ADMIN_EMAIL || "admin@brainepedia.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Braintech-2017";
const DRY_RUN = process.argv.includes("--dry-run");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return data.data || data.professions || data.districts || data.nodes || data.problemNodes || data.items || [];
}

async function request(path, options = {}, attempt = 1) {
  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(800 * attempt);
    return request(path, options, attempt + 1);
  }
  return { ok: res.ok, status: res.status, data };
}

function authHeaders(token) {
  return token
    ? { Authorization: `Bearer ${token}`, "X-Token": `Bearer ${token}` }
    : {};
}

function unwrapList(value) {
  if (Array.isArray(value)) {
    if (value.length === 1 && typeof value[0] === "string") {
      const inner = value[0].trim();
      if (inner.startsWith("[") && inner.endsWith("]")) {
        try {
          const parsed = JSON.parse(inner);
          if (Array.isArray(parsed)) return unwrapList(parsed);
        } catch {
          /* keep going */
        }
      }
    }
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return unwrapList(parsed);
      } catch {
        /* keep going */
      }
    }
    return s ? [s] : [];
  }
  return [];
}

function isDoubleEncoded(value) {
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === "string") {
    const inner = value[0].trim();
    return inner.startsWith("[") && inner.endsWith("]");
  }
  if (typeof value === "string") {
    const s = value.trim();
    return s.startsWith("[") && s.endsWith("]");
  }
  return false;
}

function formData(fields) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = String(item ?? "").trim();
        if (text) fd.append(key, text);
      }
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

async function login() {
  const { ok, status, data } = await request("/api/Account/auth_login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!ok) throw new Error(`Login failed (${status}): ${JSON.stringify(data).slice(0, 400)}`);
  const token =
    data?.token ||
    data?.Token ||
    data?.accessToken ||
    data?.userProfile?.token ||
    data?.userProfile?.Token ||
    data?.response?.token ||
    data?.data?.token;
  const userId = String(
    data?.userId ||
      data?.UserId ||
      data?.userProfile?.userId ||
      data?.userProfile?.UserId ||
      data?.response?.userId ||
      data?.data?.userId ||
      data?.id ||
      "",
  );
  if (!token || !userId) throw new Error("Login succeeded but token/userId missing.");
  return { token, userId };
}

async function main() {
  console.log("=".repeat(64));
  console.log(" Fix double-encoded Constraints / ExpectedOutcomes");
  console.log(` Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "APPLY"}`);
  console.log("=".repeat(64));

  const auth = await login();
  const headers = authHeaders(auth.token);
  const professions = asList((await request("/api/Professions", { headers })).data)
    .map((p) => ({
      id: String(p.id ?? p.professionId ?? p.professionsId ?? ""),
      name: p.name || p.professionName || "",
    }))
    .filter((p) => p.id && p.name);

  let scanned = 0;
  let alreadyOk = 0;
  let updated = 0;
  let failed = 0;
  const failures = [];

  for (const profession of professions) {
    const districts = asList(
      (await request(`/api/Districts/by-profession/${encodeURIComponent(profession.id)}`, { headers })).data,
    )
      .map((d) => ({
        id: String(d.id ?? d.districtId ?? ""),
        name: d.name || d.districtName || "",
      }))
      .filter((d) => d.id);

    console.log(`\n▶ ${profession.name} (${districts.length} districts)`);

    for (const district of districts) {
      const nodes = asList(
        (await request(`/api/ProblemNodes/by-district/${encodeURIComponent(district.id)}`, { headers })).data,
      );
      const dirty = [];
      for (const node of nodes) {
        scanned += 1;
        const constraintsDirty = isDoubleEncoded(node.constraints ?? node.Constraints);
        const outcomesDirty = isDoubleEncoded(node.expectedOutcomes ?? node.ExpectedOutcomes);
        if (!constraintsDirty && !outcomesDirty) {
          alreadyOk += 1;
          continue;
        }
        dirty.push(node);
      }

      if (!dirty.length) {
        console.log(`    ${district.name}: ${nodes.length} already OK`);
        continue;
      }
      console.log(`    ${district.name}: fixing ${dirty.length}/${nodes.length}`);

      if (DRY_RUN) {
        for (const node of dirty) {
          const title = node.title || node.name || "";
          const constraints = unwrapList(node.constraints ?? node.Constraints);
          const expectedOutcomes = unwrapList(node.expectedOutcomes ?? node.ExpectedOutcomes);
          console.log(`      · ${title}`);
          console.log(`        constraints → ${JSON.stringify(constraints)}`);
          console.log(`        outcomes    → ${JSON.stringify(expectedOutcomes)}`);
          updated += 1;
        }
        continue;
      }

      const CONCURRENCY = 4;
      for (let i = 0; i < dirty.length; i += CONCURRENCY) {
        const batch = dirty.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map(async (node) => {
            const id = String(node.problemNodeId ?? node.id ?? node.nodeId ?? "");
            const fd = formData({
              Title: node.title || node.name || "Mission",
              Context: node.context || "",
              MissionBrief: node.missionBrief || node.MissionBrief || "",
              Constraints: unwrapList(node.constraints ?? node.Constraints),
              ExpectedOutcomes: unwrapList(node.expectedOutcomes ?? node.ExpectedOutcomes),
              ExperiencePoints: node.experiencePoints ?? 0,
              EstimatedMinutes: node.estimatedMinutes ?? 0,
              DifficultyId: node.difficultyId || "",
              DistrictId: node.districtId || district.id,
            });
            const res = await request(
              `/api/ProblemNodes/edit/${encodeURIComponent(id)}?userId=${encodeURIComponent(auth.userId)}`,
              { method: "POST", headers, body: fd },
            );
            return { node, id, res };
          }),
        );
        for (const { node, res } of results) {
          const title = node.title || node.name || "";
          if (res.ok) {
            console.log(`      ✓ ${title}`);
            updated += 1;
          } else {
            failed += 1;
            const err = `${profession.name} / ${district.name} / ${title} (${res.status}) ${JSON.stringify(res.data).slice(0, 180)}`;
            failures.push(err);
            console.log(`      ✗ ${title} (${res.status})`);
          }
        }
        await sleep(80);
      }
    }
  }

  console.log("\n" + "=".repeat(64));
  console.log(` Scanned     : ${scanned}`);
  console.log(` Already OK  : ${alreadyOk}`);
  console.log(` Updated     : ${updated}${DRY_RUN ? " (dry-run count)" : ""}`);
  console.log(` Failed      : ${failed}`);
  if (failures.length) {
    console.log(" Failures:");
    for (const line of failures) console.log("  - " + line);
  }
  console.log("=".repeat(64));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
