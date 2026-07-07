/**
 * Brainepedia live content audit and curation.
 *
 * Dry-run by default:
 *   node scripts/audit-curate-live-content.mjs
 *
 * Apply changes to the live API:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/audit-curate-live-content.mjs --apply
 *
 * The script is intentionally deterministic. It audits every live profession,
 * district, and problem node, then fixes the failure modes seen in AI-seeded
 * content: off-topic titles, "undefined" placeholders, generic template names,
 * duplicate missions, and overlapping Backend Developer districts.
 */

const BASE = process.env.BRAINEPEDIA_API_BASE || "https://api.brainepedia.com";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes("--apply");

const BAD_TITLE_RE =
  /\bundefined\b|Solution Design|Enterprise .*Transformation|Production .*Crisis|Guided .*Audit|Root Cause Investigation|Master Trial|Foundations Quest|Real-World Scenario/i;

const BACKEND_MERGES = new Map([
  ["Database Design & SQL", "Database Reliability & Query Design"],
  ["Data Persistence Lab", "Database Reliability & Query Design"],
  ["REST API Mastery", "REST API Design"],
  ["API Gateway Hub", "REST API Design"],
  ["APIs & Integration", "REST API Design"],
  ["Identity & Security", "Authentication & Security"],
  ["Authentication Citadel", "Authentication & Security"],
  ["Server-Side Foundations", "Programming & Frameworks"],
  ["Foundation & Logic", "Programming & Frameworks"],
  ["Production Systems Hub", "Caching & Performance"],
]);

const DISTRICT_RENAMES = new Map([
  ["Backend Developer::Database Foundry", {
    name: "Database Reliability & Query Design",
    description: "Resolve real backend data problems: schema design, query performance, migrations, audit trails, and data integrity incidents.",
  }],
]);

const DISTRICT_SCENARIOS = new Map([
  ["Geologist::Geological Field Methods and Mapping", [
    "Map Lithology and Fault Contacts from Field Traverse Notes",
    "Produce a Field Map for a Proposed Road-Cut Alignment",
    "Validate GPS Outcrop Measurements Before a Drill Programme",
    "Document Safety and Sampling Risks During Remote Field Mapping",
  ]],
  ["Geologist::Stratigraphy and Sedimentology", [
    "Correlate Stratigraphic Units Across Three Measured Sections",
    "Reconstruct Depositional Environment from Core and Outcrop Logs",
    "Resolve Missing Bed Boundaries in a Sedimentary Logging Dataset",
    "Assess Geological Hazard Risk for a Proposed Infrastructure Site",
  ]],
  ["Geologist::Hydrogeology and Environmental Geology", [
    "Delineate a Contaminant Plume from Monitoring Well Data",
    "Estimate Groundwater Flow Direction for a New Borehole Field",
    "Assess Aquifer Vulnerability Near an Industrial Waste Site",
    "Prepare a Remediation Sampling Plan After a Fuel Spill",
  ]],
  ["Geologist::Earth Materials and Mineralogy", [
    "Identify Unknown Rock Samples for an Exploration Field Team",
    "Use Thin-Section Evidence to Determine Metamorphic Grade",
    "Separate Ore Minerals from Gangue in a Hand-Specimen Report",
    "Flag Mislabelled Mineral Samples Before Laboratory Testing",
  ]],
  ["Geologist::Structural Geology and Tectonics", [
    "Interpret Fold-Fault Geometry from Outcrop Measurements",
    "Build a Cross-Section for a Potential Landslide Zone",
    "Estimate Stress Regime from Joint and Fault Orientation Data",
    "Review Tectonic Controls on a Proposed Tunnel Alignment",
  ]],
  ["Backend Developer::Database Reliability & Query Design", [
    "Normalize Duplicate Customer Records Before Monthly Reporting",
    "Repair a Slow Product Search Query Using Index Evidence",
    "Design an Audit Trail for Account and Permission Changes",
    "Plan a Safe Orders Schema Migration Without Data Loss",
    "Investigate Missing Orders After a Failed CSV Import",
  ]],
  ["Backend Developer::REST API Design", [
    "Design a Versioned Customer Records API for Mobile and Web Clients",
    "Fix Inconsistent Error Responses in a Public REST API",
    "Document an OpenAPI Contract for an Order Fulfilment Service",
    "Add Idempotency Keys to Prevent Duplicate Payment Requests",
  ]],
  ["Backend Developer::Authentication & Security", [
    "Secure a Login API Against Token Replay and Brute Force Attacks",
    "Implement Role-Based Access for Admin, Editor, and Viewer Users",
    "Rotate Compromised Refresh Tokens Without Logging Users Out",
    "Audit Sensitive Data Exposure in User Profile Responses",
  ]],
  ["Backend Developer::Caching & Performance", [
    "Stabilize a Slow Product Endpoint with Cache and Query Metrics",
    "Find the N+1 Query Causing Checkout Latency Spikes",
    "Tune Database Connection Pooling for Peak Traffic",
    "Design Cache Invalidation for Frequently Updated Inventory",
  ]],
  ["Backend Developer::Microservices & Messaging", [
    "Recover Lost Order Events in a Message Queue Workflow",
    "Add a Circuit Breaker Around an Unreliable Payments Service",
    "Split User Profiles from a Monolith Without Breaking Orders",
    "Design Retry and Dead-Letter Handling for Email Notifications",
  ]],
  ["Backend Developer::Cloud & Deployment", [
    "Deploy a Containerized Backend with Health Checks and Rollback",
    "Fix a Failed CI/CD Release for a Node.js API",
    "Create Environment-Safe Configuration for Staging and Production",
    "Add Runtime Logs and Metrics Before a Cloud Release",
  ]],
  ["Backend Developer::Programming & Frameworks", [
    "Refactor a Tangled Controller into Services and Repositories",
    "Trace a Client Request Through Routing, Middleware, and Handlers",
    "Design Validation and Error Handling for a Task Tracking Backend",
    "Improve Dependency Injection Boundaries in a Backend Service",
  ]],
]);

const FALLBACK_TEMPLATES = [
  "Resolve a Real {district} Case for a {profession} Team",
  "Audit a Field Failure in {district} and Recommend Corrective Action",
  "Prepare a Stakeholder Report for a {district} Decision",
  "Investigate Conflicting Evidence in a {district} Workflow",
  "Triage a Client Escalation in {district}",
  "Validate Evidence Before a {district} Recommendation",
  "Build a Risk Register for a {district} Project",
  "Present a Corrective Action Plan for a {district} Incident",
];

function log(message) {
  console.log(message);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(value) {
  return new Set(normalizeText(value).split(/\s+/).filter(Boolean));
}

function jaccard(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection++;
  return intersection / (left.size + right.size - intersection);
}

function asList(data) {
  return Array.isArray(data) ? data : data?.data || data?.professions || data?.districts || data?.nodes || [];
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`${options.method || "GET"} ${path} failed (${res.status}): ${body.slice(0, 400)}`);
  }
  return data;
}

function authHeaders(token) {
  return token
    ? { Authorization: `Bearer ${token}`, "X-Token": `Bearer ${token}` }
    : {};
}

async function login() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running with --apply.");
  }
  const data = await request("/api/Account/auth_login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const token = data?.token || data?.Token || data?.accessToken || data?.userProfile?.token || data?.data?.token;
  const userId =
    data?.userId ||
    data?.UserId ||
    data?.userProfile?.userId ||
    data?.userProfile?.UserId ||
    data?.data?.userId ||
    data?.data?.UserId ||
    String(data?.id || data?.Id || "");
  if (!token || !userId) throw new Error("Login succeeded but token/userId was not present in the response.");
  return { token, userId: String(userId) };
}

function normalizeProfession(raw) {
  return {
    id: String(raw.id ?? raw.professionId ?? raw.professionsId ?? ""),
    name: raw.name || raw.professionName || "",
  };
}

function normalizeDistrict(raw, profession) {
  return {
    id: String(raw.id ?? raw.districtId ?? ""),
    name: raw.name || raw.districtName || "",
    description: raw.description || "",
    professionId: String(raw.professionId || profession.id),
    professionName: profession.name,
  };
}

function normalizeNode(raw, district) {
  return {
    id: String(raw.id ?? raw.nodeId ?? raw.problemNodeId ?? ""),
    title: raw.title || raw.name || "",
    context: raw.context || "",
    missionBrief: raw.missionBrief || "",
    constraints: raw.constraints || [],
    expectedOutcomes: raw.expectedOutcomes || [],
    experiencePoints: Number(raw.experiencePoints ?? raw.xp ?? 150),
    estimatedMinutes: Number(raw.estimatedMinutes ?? raw.minutes ?? 45),
    difficultyId: String(raw.difficultyId || ""),
    difficultyName: raw.difficultyName || raw.difficulty?.name || "",
    districtId: district.id,
    districtName: district.name,
    professionName: district.professionName,
  };
}

function scenarioTitle(professionName, districtName, index) {
  const key = `${professionName}::${districtName}`;
  const scenarios = DISTRICT_SCENARIOS.get(key);
  if (scenarios?.length) return scenarios[index % scenarios.length];
  const template = FALLBACK_TEMPLATES[index % FALLBACK_TEMPLATES.length];
  return template.replace("{profession}", professionName).replace("{district}", districtName);
}

function scenarioPayload(node, district, index, difficultyId) {
  const title = scenarioTitle(district.professionName, district.name, index);
  const context = `${district.professionName}s need practical ${district.name.toLowerCase()} missions that mirror decisions they make on real jobs. This challenge replaces a generic or off-topic placeholder with a concrete workplace scenario.`;
  const missionBrief = `Complete the mission "${title}". Produce concise evidence that explains the situation, the data or constraints reviewed, the decision made, and how the outcome would be validated in a real organisation.`;
  return {
    title,
    context,
    missionBrief,
    constraints: [
      `Stay within the ${district.professionName} role and the ${district.name} district.`,
      "Use a realistic workplace scenario with named inputs, constraints, and trade-offs.",
      "Document assumptions, risks, and the evidence used to reach the recommendation.",
      "Avoid generic implementation plans that could apply to any profession.",
    ],
    expectedOutcomes: [
      "The submission clearly describes a real-world problem and why it matters.",
      "The proposed solution or analysis is specific to the district skill area.",
      "Risks, validation steps, and success criteria are documented.",
      "A non-specialist stakeholder can understand the recommendation.",
    ],
    experiencePoints: Math.max(100, Number(node.experiencePoints) || 150),
    estimatedMinutes: Math.max(30, Number(node.estimatedMinutes) || 45),
    difficultyId: node.difficultyId || difficultyId || "",
    districtId: district.id,
  };
}

function formData(fields) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (Array.isArray(value)) fd.append(key, JSON.stringify(value));
    else fd.append(key, String(value));
  }
  return fd;
}

async function updateNode(nodeId, payload, auth) {
  const fd = formData({
    ProblemNodeId: nodeId,
    Title: payload.title,
    Context: payload.context,
    MissionBrief: payload.missionBrief,
    Constraints: payload.constraints,
    ExpectedOutcomes: payload.expectedOutcomes,
    ExperiencePoints: payload.experiencePoints,
    EstimatedMinutes: payload.estimatedMinutes,
    DifficultyId: payload.difficultyId,
    DistrictId: payload.districtId,
  });
  return request(`/api/ProblemNodes/edit/${encodeURIComponent(nodeId)}?userId=${encodeURIComponent(auth.userId)}`, {
    method: "POST",
    headers: authHeaders(auth.token),
    body: fd,
  });
}

async function moveNode(nodeId, targetDistrictId, auth) {
  const full = await request(`/api/ProblemNodes/${encodeURIComponent(nodeId)}`, { headers: authHeaders(auth.token) });
  const current = {
    title: full.title || full.name || "Backend mission",
    context: full.context || "Backend mission moved during catalogue curation.",
    missionBrief: full.missionBrief || "Complete the backend mission and document the outcome.",
    constraints: Array.isArray(full.constraints) ? full.constraints : parseJsonArray(full.constraints),
    expectedOutcomes: Array.isArray(full.expectedOutcomes) ? full.expectedOutcomes : parseJsonArray(full.expectedOutcomes),
    experiencePoints: Number(full.experiencePoints ?? 150),
    estimatedMinutes: Number(full.estimatedMinutes ?? 45),
    difficultyId: String(full.difficultyId || ""),
    districtId: targetDistrictId,
  };
  return updateNode(nodeId, current, auth);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [value];
  } catch {
    return [value];
  }
}

async function deleteNode(nodeId, auth) {
  return request(`/api/ProblemNodes/${encodeURIComponent(nodeId)}?userId=${encodeURIComponent(auth.userId)}`, {
    method: "DELETE",
    headers: authHeaders(auth.token),
  });
}

async function updateDistrict(district, next, auth) {
  const fd = formData({
    DistrictId: district.id,
    Name: next.name,
    Description: next.description || district.description,
    ProfessionId: district.professionId,
  });
  return request(`/api/Districts/edit/${encodeURIComponent(district.id)}?userId=${encodeURIComponent(auth.userId)}`, {
    method: "POST",
    headers: authHeaders(auth.token),
    body: fd,
  });
}

async function deleteDistrict(districtId, auth) {
  return request(`/api/Districts/${encodeURIComponent(districtId)}?userId=${encodeURIComponent(auth.userId)}`, {
    method: "DELETE",
    headers: authHeaders(auth.token),
  });
}

async function loadCatalogue() {
  const professions = asList(await request("/api/Professions"))
    .map(normalizeProfession)
    .filter((profession) => profession.id && profession.name);
  const catalogue = [];
  for (const profession of professions) {
    const districts = asList(await request(`/api/Districts/by-profession/${encodeURIComponent(profession.id)}`))
      .map((raw) => normalizeDistrict(raw, profession))
      .filter((district) => district.id && district.name);
    for (const district of districts) {
      district.nodes = asList(await request(`/api/ProblemNodes/by-district/${encodeURIComponent(district.id)}`))
        .map((raw) => normalizeNode(raw, district))
        .filter((node) => node.id && node.title);
    }
    catalogue.push({ ...profession, districts });
  }
  return catalogue;
}

function planCatalogue(catalogue, defaultDifficultyId) {
  const actions = [];
  const renameByDistrictId = new Map();
  const backend = catalogue.find((profession) => profession.name === "Backend Developer");
  const backendDistrictByName = new Map((backend?.districts || []).map((district) => [district.name, district]));

  for (const profession of catalogue) {
    for (const district of profession.districts) {
      const rename = DISTRICT_RENAMES.get(`${profession.name}::${district.name}`);
      if (rename) {
        actions.push({ type: "rename-district", district, rename });
        renameByDistrictId.set(district.id, rename);
        if (profession.name === "Backend Developer") backendDistrictByName.set(rename.name, district);
      }
    }
  }

  for (const [fromName, toName] of BACKEND_MERGES.entries()) {
    const from = backendDistrictByName.get(fromName);
    const to = backendDistrictByName.get(toName);
    if (!from || !to || from.id === to.id) continue;
    actions.push({ type: "merge-district", from, to });
  }

  const mergedDistrictIds = new Set(actions.filter((a) => a.type === "merge-district").map((a) => a.from.id));
  for (const profession of catalogue) {
    for (const district of profession.districts) {
      if (mergedDistrictIds.has(district.id)) continue;
      const effectiveDistrict = {
        ...district,
        ...(renameByDistrictId.get(district.id) || {}),
      };
      const seen = [];
      let replacementIndex = 0;
      for (const node of district.nodes) {
        const duplicate = seen.find((candidate) => {
          const exact = normalizeText(candidate.title) === normalizeText(node.title);
          const similar = jaccard(candidate.title, node.title) >= 0.82;
          return exact || similar;
        });
        if (duplicate) {
          actions.push({ type: "delete-node", node, district, reason: `Duplicate of "${duplicate.title}"` });
          continue;
        }
        seen.push(node);

        if (BAD_TITLE_RE.test(node.title)) {
          actions.push({
            type: "replace-node",
            node,
            district: effectiveDistrict,
            payload: scenarioPayload(node, effectiveDistrict, replacementIndex, defaultDifficultyId),
            reason: "Broken or generic AI-seeded title",
          });
          replacementIndex++;
        }
      }
    }
  }

  return actions;
}

function summarize(catalogue, actions) {
  const count = (type) => actions.filter((action) => action.type === type).length;
  const totals = {
    professions: catalogue.length,
    districts: catalogue.reduce((sum, profession) => sum + profession.districts.length, 0),
    nodes: catalogue.reduce(
      (sum, profession) => sum + profession.districts.reduce((inner, district) => inner + district.nodes.length, 0),
      0,
    ),
    actions: actions.length,
    renameDistricts: count("rename-district"),
    mergeDistricts: count("merge-district"),
    replaceNodes: count("replace-node"),
    deleteNodes: count("delete-node"),
  };
  return totals;
}

async function main() {
  let difficulties = [];
  try {
    difficulties = asList(await request("/api/Difficulties")).map((item) => ({
      id: String(item.id ?? item.difficultyId ?? ""),
      level: Number(item.level ?? 0),
    })).filter((item) => item.id);
  } catch (error) {
    if (APPLY) throw error;
  }
  const defaultDifficultyId = difficulties.sort((a, b) => a.level - b.level)[1]?.id || difficulties[0]?.id || "";

  const catalogue = await loadCatalogue();
  const actions = planCatalogue(catalogue, defaultDifficultyId);
  const totals = summarize(catalogue, actions);
  log(JSON.stringify(totals, null, 2));

  for (const action of actions.slice(0, 80)) {
    if (action.type === "rename-district") {
      log(`RENAME DISTRICT: ${action.district.professionName} / ${action.district.name} -> ${action.rename.name}`);
    } else if (action.type === "merge-district") {
      log(`MERGE DISTRICT: Backend Developer / ${action.from.name} -> ${action.to.name}`);
    } else if (action.type === "replace-node") {
      log(`REPLACE NODE: ${action.district.professionName} / ${action.district.name} / ${action.node.title} -> ${action.payload.title}`);
    } else if (action.type === "delete-node") {
      log(`DELETE NODE: ${action.district.professionName} / ${action.district.name} / ${action.node.title} (${action.reason})`);
    }
  }
  if (actions.length > 80) log(`... ${actions.length - 80} more planned actions`);

  if (!APPLY) {
    log("\nDry-run only. Re-run with --apply and ADMIN_EMAIL/ADMIN_PASSWORD to update live content.");
    return;
  }

  const auth = await login();
  const failures = [];

  for (const action of actions) {
    try {
      if (action.type === "rename-district") {
        await updateDistrict(action.district, action.rename, auth);
      } else if (action.type === "replace-node") {
        await updateNode(action.node.id, action.payload, auth);
      } else if (action.type === "delete-node") {
        await deleteNode(action.node.id, auth);
      } else if (action.type === "merge-district") {
        for (const node of action.from.nodes) {
          if (BAD_TITLE_RE.test(node.title)) await deleteNode(node.id, auth);
          else await moveNode(node.id, action.to.id, auth);
        }
        await deleteDistrict(action.from.id, auth);
      }
    } catch (error) {
      failures.push({ action: action.type, target: action.node?.title || action.district?.name || action.from?.name, error: error.message });
      console.error(`FAILED ${action.type}: ${error.message}`);
    }
  }

  log(JSON.stringify({ applied: actions.length - failures.length, failures: failures.length, failureDetails: failures }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
