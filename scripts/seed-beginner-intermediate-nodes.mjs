/**
 * Seed beginner + intermediate problem nodes for every district of every profession.
 *
 * Usage:
 *   node scripts/seed-beginner-intermediate-nodes.mjs --dry-run
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-beginner-intermediate-nodes.mjs
 *
 * Goal: each district has at least TARGET beginner and TARGET intermediate missions
 * that a complete newcomer can finish from the brief alone (no prior job experience).
 */

const BASE = process.env.BRAINEPEDIA_API_BASE || "https://api.brainepedia.com";
const EMAIL = process.env.ADMIN_EMAIL || "admin@brainepedia.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Braintech-2017";
const DRY_RUN = process.argv.includes("--dry-run");
const TARGET_BEGINNER = Number(process.env.TARGET_BEGINNER || 4);
const TARGET_INTERMEDIATE = Number(process.env.TARGET_INTERMEDIATE || 4);

const BEGINNER_XP = [80, 90, 100, 110, 120];
const BEGINNER_MIN = [20, 25, 30, 30, 35];
const INTERMEDIATE_XP = [140, 150, 160, 175, 185];
const INTERMEDIATE_MIN = [35, 40, 45, 50, 50];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return data.data || data.professions || data.districts || data.nodes || data.problemNodes || data.items || [];
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

function shortDistrict(name) {
  return String(name || "")
    .replace(/\b(District|Quarter|Ward|Zone|Hub|Borough|Precinct|Row|Promenade|Plaza|Tower|Sanctum|Atelier|Court|Square|Bunker|Range|Citadel|Pavilion|Lab|Foundry)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || name;
}

function article(word) {
  return /^[aeiou]/i.test(String(word || "").trim()) ? "an" : "a";
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
    data?.data?.token ||
    data?.data?.accessToken;
  const userId = String(
    data?.userId ||
      data?.UserId ||
      data?.userProfile?.userId ||
      data?.userProfile?.UserId ||
      data?.response?.userId ||
      data?.data?.userId ||
      data?.data?.UserId ||
      data?.id ||
      data?.Id ||
      "",
  );
  if (!token || !userId) throw new Error("Login succeeded but token/userId missing.");
  return { token, userId };
}

/* ── profession flavour ──────────────────────────────────────────────────── */

const PACKS = {
  Architect: {
    workplace: "a small architecture studio working on houses, shops, and community buildings",
    newcomer: "a first-week architectural intern",
    tools: "sketches described in words, simple tables, and a one-page design note — CAD software is optional, not required",
    beginnerSkill: "name spaces, list building parts, and notice basic safety or access issues from a written plan",
    intermediateSkill: "compare two layout options, check a short code/access list, and explain a recommendation to a client",
    cases: [
      "A 42 m² corner shop will become a cafe. Ceiling height 3.2 m. One 3 m street window. Client wants 16 seats, a counter, and a tiny accessible WC.",
      "A 9 m × 6 m backyard studio is planned for a illustrator. One north window, one door to the garden, and a client budget note: 'keep it simple and bright'.",
      "A ground-floor two-bedroom house (80 m²) needs a safer entrance: two 170 mm steps, a 800 mm door, and a 1.1 m hall.",
      "A neighbourhood pocket park (20 m × 12 m) must keep a 3 m pedestrian path, two benches, and one tree already on site.",
    ],
  },
  "Backend Developer": {
    workplace: "a small product team running a web API for a local services app",
    newcomer: "a new backend developer who can follow a written example even if they have never shipped production code",
    tools: "plain text, a tiny table of fields, and optional short pseudocode — a full framework is not required",
    beginnerSkill: "name request/response pieces, list table fields, and describe what should happen when input is missing",
    intermediateSkill: "spot unsafe or slow API behaviour from a short example and propose a safer next version",
    cases: [
      "Endpoint POST /bookings accepts {name, date, slot}. Today it saves anything, including empty names and past dates.",
      "Table users(id, email, password, role). Passwords are stored as plain text. Role is a free-text string.",
      "GET /products?q= searches with SELECT * FROM products WHERE name LIKE '%q%'. It is slow when the catalogue has 80,000 rows.",
      "Login returns {token} with no expiry. Anyone who copies the token stays signed in forever.",
    ],
  },
  Biochemistry: {
    workplace: "a teaching lab supporting a small biotech team",
    newcomer: "a student joining the lab for the first time",
    tools: "a written lab note, a simple results table, and given formulas — no specialised equipment is required to complete the mission",
    beginnerSkill: "name biomolecules, label a simple pathway, and record observations in a clear table",
    intermediateSkill: "choose an appropriate method from two options and explain what the result would mean",
    cases: [
      "A protein sample shows a peak at 280 nm. The team wants to know whether the sample is likely protein, DNA, or a mix.",
      "An enzyme assay: substrate 2 mM, product formed 0.4 mM in 2 minutes, enzyme amount 0.01 mg. Formula given in the brief.",
      "A cell culture is not responding to a growth-factor signal. Receptor present, but the downstream kinase is not phosphorylated.",
      "A PCR product is the wrong size. Template DNA, primers, and annealing temperature are listed in the brief.",
    ],
  },
  "Business Analyst": {
    workplace: "a digital transformation team in a mid-size company",
    newcomer: "a graduate business analyst on week one",
    tools: "a one-page brief, a process list, and a simple table — no BA software licence required",
    beginnerSkill: "turn a messy stakeholder complaint into a clear requirement and a process step list",
    intermediateSkill: "compare two solution options and write acceptance criteria a developer can test",
    cases: [
      "Finance says invoice approval takes 9 days. Steps: email PDF → clerk prints → manager signs → scan → pay. No tracking number.",
      "HR wants a leave request form. Today staff email a manager. Some requests vanish. Nobody knows remaining leave balance.",
      "Sales wants a dashboard. They currently paste numbers from three spreadsheets every Monday.",
      "A warehouse app lets staff skip the 'confirm pick' step. Wrong items ship twice a week.",
    ],
  },
  "Business Development, Sales & Marketing": {
    workplace: "a 12-person B2B company selling software to small businesses",
    newcomer: "a new sales and marketing associate",
    tools: "a prospect list, a short email, and a one-page plan",
    beginnerSkill: "qualify a lead, write a clear outreach note, and keep a tiny pipeline table",
    intermediateSkill: "choose a channel mix and explain why some leads should wait",
    cases: [
      "30 inbound leads from a webinar. 8 are students, 12 are SMEs, 10 did not leave a company name.",
      "A payroll product costs $49/month. Competitors: Brand A ($39, weak support) and Brand B ($79, strong brand).",
      "Three dormant clients last bought 11 months ago. Each had one support complaint that was resolved.",
      "The team must book 10 discovery calls in 14 days using LinkedIn and email only.",
    ],
  },
  "Chartered Accountant": {
    workplace: "a small accounting practice serving local companies",
    newcomer: "a first-year trainee accountant",
    tools: "a trial-balance extract, a simple working paper, and given formulas",
    beginnerSkill: "classify accounts, reconcile a small difference, and write a clear note to a reviewer",
    intermediateSkill: "spot a misstatement risk and recommend the next audit or reporting step",
    cases: [
      "Cashbook 128,400. Bank statement 121,900. Outstanding cheques 4,200. Deposit in transit 1,700. Unrecorded bank fee 800.",
      "Trial balance: Sales 900,000; Rent 120,000; Owner drawings 40,000 posted as an expense; Inventory 75,000.",
      "A client wants to capitalise a 6,000 staff party as 'marketing asset'. No future economic benefit is documented.",
      "PAYE: 4 staff, monthly cash salaries 18,000 each, plus a 2,000 grocery voucher each. Tax table is given in the brief.",
    ],
  },
  "Civil Engineer": {
    workplace: "a municipal infrastructure office reviewing small public works",
    newcomer: "a graduate civil engineer on a supervised site visit",
    tools: "given numbers, a sketch described in words, and a calculation with the formula supplied",
    beginnerSkill: "identify loads, soils, or flow issues from a short site note and compute one safe value",
    intermediateSkill: "compare two construction or design options and flag the main risk",
    cases: [
      "Simply supported beam span 4.0 m, UDL 8 kN/m. Formula for max moment = wL²/8 is provided.",
      "Borehole log: 0–1.2 m fill, 1.2–4.0 m medium sand, water at 2.8 m. Two-storey house proposed.",
      "Urban catchment 1.8 ha, runoff coefficient 0.7, rainfall 80 mm/h. Peak flow Q = CiA is provided.",
      "A 12-activity house programme is listed with durations. Two activities can start only after foundations.",
    ],
  },
  "Cloud Architect": {
    workplace: "a cloud team moving a small web app off a single office server",
    newcomer: "a new cloud engineer who has used a laptop but not designed production architecture",
    tools: "a labelled diagram in words, a cost table, and a short decision note",
    beginnerSkill: "name core cloud building blocks and match a simple workload to a service type",
    intermediateSkill: "choose a cheaper or safer architecture and explain the trade-off",
    cases: [
      "App: 1 web server, 1 MySQL database, 20 GB files. Traffic is low at night and spikes at 09:00.",
      "Monthly bill $1,840. Top lines: unused 4× large VMs $1,100, snapshots $240, data transfer $180.",
      "Users are in two cities. Current design: one region, one AZ, no backup.",
      "Team wants to run a nightly 20-minute data job. Keeping a VM on 24/7 costs $90/month.",
    ],
  },
  "Computer Engineer": {
    workplace: "a hardware-software lab building small devices",
    newcomer: "a student engineer who can reason from a written circuit or timing note",
    tools: "truth tables, a timing sketch in words, and short pseudocode",
    beginnerSkill: "fill a truth table, name hardware blocks, and trace a simple signal path",
    intermediateSkill: "find a bottleneck or race condition from a short description and propose a fix",
    cases: [
      "Combinational circuit: two inputs A,B and output Q = A AND NOT B. A second output is A XOR B.",
      "Embedded device: 16 MHz MCU, 2 KB RAM, sensor polled every 10 ms, UART log every 1 s.",
      "CPU pipeline stalls because every instruction waits for memory. Cache hit rate is 40%.",
      "A motor driver GPIO is toggled from an ISR and from the main loop with no lock.",
    ],
  },
  "Customer Service Representative": {
    workplace: "a support desk for an online store with 40 tickets a day",
    newcomer: "a new customer service representative on their first week",
    tools: "a ticket template, a short email, and a simple priority table",
    beginnerSkill: "greet, clarify, and resolve a routine request with a calm written reply",
    intermediateSkill: "de-escalate a heated ticket and decide whether to escalate",
    cases: [
      "Ticket: 'Where is order #4412?' Order shipped yesterday, tracking shows out for delivery.",
      "Ticket in CAPS: 'THIS IS THE THIRD TIME THE WRONG SIZE ARRIVED. I WANT A MANAGER NOW.'",
      "A customer asks for a refund outside the 14-day policy by 2 days. Item unused, photo attached.",
      "Five tickets about the same checkout error in 20 minutes. Engineering is not yet aware.",
    ],
  },
  "Cybersecurity Analyst": {
    workplace: "a small security team protecting a company laptop fleet and a public website",
    newcomer: "a junior analyst who can follow a checklist even without prior SOC experience",
    tools: "a log snippet, a checklist, and a short incident note — no attacking real systems",
    beginnerSkill: "classify an alert, list evidence, and choose contain / monitor / escalate",
    intermediateSkill: "map a simple attack path and recommend two practical controls",
    cases: [
      "Alert: 42 failed logins for user finance.jane from 3 countries in 8 minutes, then one success.",
      "Website form reflects user input back onto the page. A test string <b>test</b> appears in bold.",
      "Employee USB found in reception. Windows logs show it mounted on a finance laptop for 4 minutes.",
      "Phishing email: 'Payroll update — click to confirm salary.' Link goes to payrol1-company.net.",
    ],
  },
  "Data Scientist": {
    workplace: "an insights team helping a retail company understand weekly sales",
    newcomer: "a new data scientist who can use a calculator and a simple table",
    tools: "a small dataset described in the brief, given formulas, and a chart you describe in words",
    beginnerSkill: "clean a tiny table, compute a simple statistic, and say what it means in plain language",
    intermediateSkill: "choose a metric, spot a data-quality issue, and recommend a next analysis step",
    cases: [
      "Weekly sales: 12, 14, 13, 40, 15, 14. The 40 is from a bulk order that will not repeat.",
      "Table of 20 customers with missing age on 6 rows and duplicate emails on 2 rows.",
      "Conversion: 400 visits, 28 purchases. Marketing wants 'accuracy of the campaign'.",
      "A model predicts churn at 91% accuracy because 90% of customers never churn.",
    ],
  },
  "DevOps Engineer": {
    workplace: "a small platform team deploying a Node.js API",
    newcomer: "a new DevOps engineer who can follow a pipeline description without having run Kubernetes before",
    tools: "a pipeline sketch, a checklist, and a short incident note",
    beginnerSkill: "name CI/CD stages and write a safe first-deploy checklist",
    intermediateSkill: "diagnose a failed deploy from logs and propose a rollback or fix",
    cases: [
      "Pipeline: install → unit tests → docker build → deploy to staging. Tests were skipped last Friday to 'save time'.",
      "Deploy failed: health check /health returns 500. Previous version is still tagged v1.8.2.",
      "Server disk 94% full. Logs are 18 GB. No log rotation. App still running.",
      "Dockerfile copies node_modules from the laptop. Image is 1.8 GB and fails on the server CPU architecture.",
    ],
  },
  "Electrical Engineer": {
    workplace: "a plant maintenance office looking after motors, panels, and a small solar array",
    newcomer: "a graduate electrical engineer under supervision",
    tools: "given formulas, a one-line diagram described in words, and a safety checklist",
    beginnerSkill: "identify circuit parts, compute one basic electrical value, and list lock-out steps",
    intermediateSkill: "compare two protection or energy options and flag the safety risk",
    cases: [
      "Single-phase load 230 V, 8 A, power factor 0.85. Formula P = V I pf is provided.",
      "A 5.5 kW motor trips on start. Cable looks undersized. Nameplate current 11.2 A.",
      "A 12 kW rooftop solar array feeds a building with 18 kW daytime load. No export meter yet.",
      "PLC starts a conveyor. E-stop is in series with the coil. A jumper was found across the e-stop terminals.",
    ],
  },
  "Electronic Engineer": {
    workplace: "an electronics bench building small analog and digital boards",
    newcomer: "a junior electronics engineer who can reason from a parts list and a written schematic note",
    tools: "a parts list, a truth table or gain formula, and a test plan",
    beginnerSkill: "identify components, compute one simple value, and write a first power-on test",
    intermediateSkill: "choose between two circuit options and explain noise, heat, or layout risk",
    cases: [
      "LED circuit: 5 V supply, LED Vf 2.1 V, desired current 10 mA. Formula R = (Vs − Vf)/I is provided.",
      "Op-amp inverting amplifier: Rin 10 kΩ, Rf 47 kΩ, Vin 0.4 V. Gain formula −Rf/Rin is provided.",
      "A 2-layer PCB has a switching regulator next to an analog sensor trace. The output jitters.",
      "An SPI sensor is wired but CS is left floating. Readings are random.",
    ],
  },
  "Financial Analyst": {
    workplace: "a finance team supporting a growing retailer",
    newcomer: "a graduate financial analyst",
    tools: "a small numbers table, given formulas, and a one-page insight note",
    beginnerSkill: "compute a simple ratio or variance and explain it to a non-finance manager",
    intermediateSkill: "build a tiny forecast or comparison and recommend a decision",
    cases: [
      "Revenue 2.4m, COGS 1.5m, opex 0.6m. Manager asks 'are we profitable and by how much?'",
      "Budgeted sales 200,000. Actual 176,000. Price was 2% lower and volume 10% lower.",
      "Project cost 80,000. Expected annual cash 22,000 for 5 years. Discount rate 10%. PV factors given.",
      "Two products: A margin 18% volume high; B margin 42% volume low. Capacity is limited next quarter.",
    ],
  },
  "Frontend Developer": {
    workplace: "a product squad building a customer web app",
    newcomer: "a new frontend developer who can describe HTML/CSS/JS even if they have not shipped a site",
    tools: "a page description, a short HTML/CSS snippet or wireframe in words, and a checklist",
    beginnerSkill: "structure a simple page, name CSS layout choices, and list accessibility basics",
    intermediateSkill: "fix a broken layout or interaction from a written bug and explain the change",
    cases: [
      "Landing page: logo, 1 headline, 1 paragraph, 1 button, a 3-card feature row, and a footer with 4 links.",
      "Form: email + password. Submit does nothing when email is empty. Error is only a red border.",
      "Mobile screenshot: text overflows a card at 360 px width. Desktop looks fine at 1280 px.",
      "Button is a <div> with an onClick. Keyboard users cannot reach it. No visible focus style.",
    ],
  },
  Geologist: {
    workplace: "a field team supporting a small infrastructure and exploration project",
    newcomer: "a graduate geologist on a supervised traverse",
    tools: "a field notebook table, a simple sketch in words, and given classification rules",
    beginnerSkill: "describe a rock or outcrop, record location notes, and classify using the rules in the brief",
    intermediateSkill: "correlate two short logs and flag a hazard or uncertainty",
    cases: [
      "Outcrop: fine-grained grey rock, fizzes weakly with dilute HCl, thin bedding, no fossils seen.",
      "Three boreholes 200 m apart. Sand over clay over weathered granite. Clay thickness changes from 2 m to 7 m.",
      "Spring line at the base of a slope after heavy rain. Houses sit 40 m downslope.",
      "Hand samples: one metallic yellow cubic crystals; one greasy green massive mineral. Identification keys provided.",
    ],
  },
  "Graphic Designer": {
    workplace: "a small studio designing brands, posters, and simple web graphics",
    newcomer: "a junior designer who can describe layout and type without using a paid tool if needed",
    tools: "a written layout spec, a type/colour palette, and a critique note — Figma/Canva optional",
    beginnerSkill: "choose type, colour, and hierarchy for a simple piece and explain why",
    intermediateSkill: "redesign a cluttered layout and show how the visual system stays consistent",
    cases: [
      "A3 community concert poster. Headline, date, 3 acts, one photo, QR code. Currently 7 fonts and 6 colours.",
      "Cafe logo: name 'Harbour Bean', should work in black on a 16 px favicon and on a 1 m sign.",
      "Instagram post 1080×1080: 40% off this weekend. Too much text, low contrast yellow on white.",
      "A 12-page brochure uses a different heading size on every spread.",
    ],
  },
  "Human Resources Manager": {
    workplace: "an HR team of four in a 90-person company",
    newcomer: "a new HR coordinator",
    tools: "a policy extract, a conversation plan, and a simple tracker table",
    beginnerSkill: "follow a fair process, write a clear employee-facing note, and log a case",
    intermediateSkill: "handle a sensitive case with policy, confidentiality, and next steps",
    cases: [
      "A hiring manager wants to reject a candidate because 'they seemed too quiet' after a 10-minute chat.",
      "An employee asks how overtime is paid. Policy: weekday 1.5× after 40 hours; Sunday 2×.",
      "Two teammates report tension. No policy breach yet. Output quality is dropping.",
      "A manager wants to post a job internally and externally on the same day. Policy says internal first for 5 days.",
    ],
  },
  Lawyer: {
    workplace: "a small general-practice firm",
    newcomer: "a candidate attorney / new legal associate",
    tools: "a fact pattern, a short memo structure, and citation placeholders — no court filing system required",
    beginnerSkill: "spot issues, list elements of a claim or defence, and write a clear office memo",
    intermediateSkill: "apply a rule to facts, note missing evidence, and recommend a next procedural step",
    cases: [
      "Client slipped in a shop. Wet floor, no warning sign, CCTV exists, incident 11 days ago.",
      "A neighbour built a wall 0.4 m over the surveyed boundary. Photos and a survey are available.",
      "Accused of shoplifting goods worth a modest amount. First offence. Client wants to plead without advice.",
      "Employment client dismissed by WhatsApp after 3 years. No hearing. Employer cites 'attitude'.",
    ],
  },
  "Machine Learning Engineer": {
    workplace: "a small ML team adding a prediction feature to an existing product",
    newcomer: "a new ML engineer who can follow a dataset note without having trained large models",
    tools: "a tiny dataset description, given metrics formulas, and a short experiment note",
    beginnerSkill: "split data, name features vs label, and interpret a simple metric",
    intermediateSkill: "diagnose leakage, imbalance, or overfitting from a short experiment log",
    cases: [
      "Dataset: 1,000 rows, label is 'will buy'. 920 are 'no'. Accuracy of a dummy model is 92%.",
      "Feature 'days_until_renewal' is computed using the future renewal date that would not exist at prediction time.",
      "Train accuracy 0.99, validation accuracy 0.61 after 40 epochs.",
      "A notebook trains a model but the API still loads an old pickle file from /tmp.",
    ],
  },
  "Marketing Specialist": {
    workplace: "a marketing team of three at a growing consumer brand",
    newcomer: "a new marketing specialist",
    tools: "a brief, a content outline, and a simple metrics table",
    beginnerSkill: "write a clear message for one audience and one channel",
    intermediateSkill: "plan a small campaign and say how you will know it worked",
    cases: [
      "Product: refillable water bottle, $24. Audience: students. Channel: Instagram. Offer: campus pickup.",
      "Website blog ranks on page 3 for 'how to start composting'. Bounce rate 78%.",
      "Last campaign: 12,000 impressions, 180 clicks, 9 purchases. Spend $400.",
      "Brand voice is friendly and practical, but a draft ad uses slang and a competitor's slogan.",
    ],
  },
  "Mechatronics Engineer": {
    workplace: "an automation lab integrating sensors, motors, and a small PLC/robot cell",
    newcomer: "a graduate mechatronics engineer under supervision",
    tools: "a block diagram in words, a state list, and a safety checklist",
    beginnerSkill: "name the sensor-controller-actuator loop and write a safe first test",
    intermediateSkill: "choose a control or integration approach and flag a timing or safety risk",
    cases: [
      "A conveyor must stop if a light curtain is broken. Currently the motor driver ignores the curtain signal.",
      "A DC motor positions a gate. Open-loop PWM overshoots. An encoder is available but unused.",
      "A pick-and-place arm and a CNC share a table. No interlock. Both can move at once.",
      "IoT sensor sends temperature every 5 s over Wi-Fi. The actuator still uses a 2-minute PLC scan assumption.",
    ],
  },
  "Medical Doctor": {
    workplace: "a supervised teaching clinic / ward (educational simulation only, not real patient care)",
    newcomer: "a medical student or intern working from the facts in the brief",
    tools: "a case vignette, a structured note (history, exam, plan), and red-flag lists provided in the brief",
    beginnerSkill: "take a structured history from given facts and list safe next steps",
    intermediateSkill: "build a short differential and say what would change your plan",
    cases: [
      "22-year-old with sore throat 3 days, fever 38.2°C, no difficulty breathing, no rash. Vitals otherwise normal.",
      "68-year-old with new crushing chest discomfort 20 minutes, sweating, BP 88/54, HR 110.",
      "Child 4 years, diarrhoea 2 days, still drinking, fewer wet nappies, no blood in stool.",
      "Adult with headache after a fall yesterday, now drowsy. Brief includes red flags for imaging.",
    ],
  },
  "Mobile Developer": {
    workplace: "a two-person mobile team building an Android/iOS consumer app",
    newcomer: "a new mobile developer who can describe screens and state without a full native toolchain",
    tools: "a screen list, a state table, and optional pseudocode",
    beginnerSkill: "map screens and navigation, and describe what happens on empty, loading, and error states",
    intermediateSkill: "fix a navigation, offline, or release issue from a written bug",
    cases: [
      "App screens: Login → Home → Item detail → Checkout. Back from Checkout currently exits the app.",
      "List of saved articles should work offline. Today the screen is blank without network.",
      "Push permission is requested on first launch before any value is shown. 80% of users deny it.",
      "Release notes missing. Version 1.2.0 crashes on Android 12 when the camera is denied.",
    ],
  },
  "Network Engineer": {
    workplace: "an IT team running a 3-floor office network",
    newcomer: "a junior network engineer who can follow an IP plan and a ping result",
    tools: "an address table, a topology in words, and a troubleshooting checklist",
    beginnerSkill: "read a simple IP/VLAN plan and say why a host cannot reach a gateway",
    intermediateSkill: "isolate a routing, Wi-Fi, or ACL fault from symptoms and propose a safe change",
    cases: [
      "PC 192.168.10.45/24, gateway 192.168.10.1. Ping gateway fails. Cable light is off.",
      "Guest Wi-Fi and staff Wi-Fi share one VLAN. Guests can see staff file shares.",
      "Site-to-site VPN is up but users cannot reach 10.20.0.0/24. ACL on the far firewall is suspected.",
      "Channel 6 is used by four APs on the same floor. Users report drops at 15:00.",
    ],
  },
  "Product Manager": {
    workplace: "a product trio (PM, designer, engineer) on a career-learning app",
    newcomer: "a new product manager who can write a clear problem statement",
    tools: "a one-page PRD, a user story, and a simple metric definition",
    beginnerSkill: "write a problem, a user, and a smallest useful slice",
    intermediateSkill: "prioritise two features with a simple score and a launch check",
    cases: [
      "Users drop off after profession select. 40% never open a mission. Quote: 'I don't know where to start.'",
      "Sales wants a referral banner. Support wants an in-app FAQ. Engineering can do one this sprint.",
      "A feature launched with no success metric. The team now argues whether it 'worked'.",
      "Legal asks for a consent checkbox before saving career data. Design wants zero extra clicks.",
    ],
  },
  "Registered Nurse": {
    workplace: "a supervised medical-surgical ward (educational simulation only)",
    newcomer: "a student or newly qualified nurse working from the facts in the brief",
    tools: "a patient vignette, a vital-signs table, and a structured nursing note",
    beginnerSkill: "record observations, use a provided escalation rule, and write a clear handover",
    intermediateSkill: "prioritise care for two competing needs and name the safety action",
    cases: [
      "Patient 72, day 1 post hip surgery. Pain 7/10, BP 100/60, HR 108, temp 36.8. Last pain med 5 hours ago.",
      "MEWS chart: RR 24, O2 sat 91% on air, HR 112, BP 96/58, alert but anxious. Escalation rule provided.",
      "Two patients: one needs IV antibiotics due now; one is calling for a bedpan. You are alone for 4 minutes.",
      "Hand hygiene audit: 8 of 20 moments missed before touching patients. Ward is busy at shift change.",
    ],
  },
  "Research Engineer": {
    workplace: "a research lab turning ideas into tested prototypes",
    newcomer: "a new research engineer writing their first lab note",
    tools: "a protocol template, a results table, and a short literature note",
    beginnerSkill: "write a testable question, list variables, and record a result honestly",
    intermediateSkill: "spot a weak method, missing control, or ethics issue and improve the plan",
    cases: [
      "Idea: a new heat sink. No success metric yet. Team 'will try a few shapes'.",
      "Paper claims 30% faster. Sample size 4, no control, no error bars.",
      "Prototype login fails on slow networks. You can reproduce it at 200 ms latency.",
      "A survey of 12 colleagues is proposed as 'user evidence' for a medical device paper.",
    ],
  },
  "Software Engineer": {
    workplace: "a small software team building internal tools",
    newcomer: "someone new to professional software who can follow a tiny example",
    tools: "a short snippet, pseudocode, or a test table — a full IDE is optional",
    beginnerSkill: "trace a small program, name inputs/outputs, and write a tiny test case",
    intermediateSkill: "refactor or debug a short example and explain the change",
    cases: [
      "Function add(a,b) returns a + b. It is used for prices. Someone passed '10' and 2 and got '102'.",
      "Loop prints 1..20, 'Fizz' for multiples of 3, 'Buzz' for 5. 15 currently prints only 'Fizz'.",
      "A shopping cart list allows negative quantities. Total can become negative.",
      "Two modules both mutate a global config object. Tests fail only when run together.",
    ],
  },
  "Supply Chain Manager": {
    workplace: "a supply chain team for a small manufacturer",
    newcomer: "a new supply chain coordinator",
    tools: "a stock table, given formulas, and a one-page recommendation",
    beginnerSkill: "read a stock position, compute a simple replenishment number, and explain service risk",
    intermediateSkill: "compare two supply options and flag a delay or cost risk",
    cases: [
      "SKU A: on hand 120, daily demand 15, lead time 4 days, reorder point unknown. Formula provided.",
      "Two suppliers: local 7 days, unit $12; overseas 35 days, unit $8. Safety stock policy is 1 week.",
      "A key motor has one supplier. Last delay was 3 weeks. No alternate qualified.",
      "Forecast last month 1,000 units. Actual 1,280. Promotions were not in the forecast.",
    ],
  },
  "UX/UI Designer": {
    workplace: "a product design pair working on a mobile/web app",
    newcomer: "a junior UX/UI designer who can describe screens without a paid design tool if needed",
    tools: "a written wireframe, a user quote set, and a critique note",
    beginnerSkill: "map a simple task flow and sketch screen purpose in words",
    intermediateSkill: "find usability issues and propose a clearer flow with a reason for each change",
    cases: [
      "Task: reset password. Current flow is 7 screens. Users quote: 'I got lost after the email code'.",
      "Home screen has 14 buttons of equal size. Primary job is 'start a mission'.",
      "Colour contrast of grey text on grey background is 2.1:1. WCAG AA needs 4.5:1 for body text.",
      "Interview notes: 5 users. 4 could not find Settings. 3 thought the logo was a Home button.",
    ],
  },
};

const DEFAULT_PACK = {
  workplace: "a small professional team doing real client work",
  newcomer: "a complete beginner in this profession",
  tools: "a one-page written deliverable and a simple table — no paid software required",
  beginnerSkill: "use the facts in the brief to produce a clear, complete first piece of work",
  intermediateSkill: "compare options, spot a mistake, and recommend a safe next step",
  cases: [
    "A small client request arrived today. The facts, numbers, and constraints are listed in the mission brief.",
    "A routine workplace task is overdue. You have a short list of inputs and must produce a first useful draft.",
    "Two options are on the table. Cost, time, and risk notes are provided.",
    "A colleague's draft has four issues. The original goal is still valid.",
  ],
};

function packFor(professionName) {
  return PACKS[professionName] || DEFAULT_PACK;
}

function caseFor(pack, index) {
  return pack.cases[index % pack.cases.length];
}

function looksTooSimilar(title, existingTitles) {
  const n = normalizeText(title);
  return existingTitles.some((t) => {
    const other = normalizeText(t);
    return other === n || jaccard(title, t) >= 0.72;
  });
}

function beginnerMissions(profession, district) {
  const pack = packFor(profession.name);
  const topic = shortDistrict(district.name);
  const role = profession.name;
  const a = article(role);
  const desc = district.description || topic;
  const shared = {
    professionName: role,
    districtName: district.name,
    districtId: district.id,
    difficulty: "Beginner",
  };

  return [
    {
      ...shared,
      title: `Name the First Ideas You Need in ${topic}`,
      context: `People starting as ${a} ${role} often feel lost in ${district.name} because the vocabulary is new. This mission teaches the smallest useful set of ideas so you can join a real conversation in ${pack.workplace}.`,
      missionBrief: [
        `You are ${pack.newcomer} in ${pack.workplace}.`,
        `District focus: ${desc}`,
        `Using only common sense plus the district focus above, write a starter guide with exactly 8 terms or ideas used in ${topic}.`,
        `For each item provide: (1) a plain-language definition in one sentence, (2) one tiny workplace example, and (3) one mistake a beginner might make.`,
        `Do not pretend you already have years of experience. If you are unsure, say what you would ask a supervisor.`,
        `Deliverable: a numbered list of 8 items plus a 4-line 'how I would use this on day one' summary.`,
      ].join("\n\n"),
      constraints: [
        `Stay inside ${role} work in ${district.name}.`,
        "Use everyday language a high-school graduate can follow.",
        `Work with ${pack.tools}.`,
        "Do not invent licences, secret data, or tools the brief does not mention.",
      ],
      expectedOutcomes: [
        "Eight relevant terms or ideas are defined in plain language.",
        "Each item includes a workplace example and a beginner mistake.",
        "The day-one summary is practical and specific to this district.",
        "A supervisor could hand this to the next newcomer.",
      ],
    },
    {
      ...shared,
      title: `Walk Through a Tiny ${topic} Case With All Facts Given`,
      context: `Complete beginners grow fastest when every number and constraint is already on the page. This ${topic} case is small on purpose so you can finish it without prior ${role} experience.`,
      missionBrief: [
        `You are ${pack.newcomer}. Your only job is to apply ${pack.beginnerSkill}.`,
        `Case facts: ${caseFor(pack, 0)}`,
        `District you must stay in: ${district.name}.`,
        `Complete these steps:`,
        `1. Restate the goal in one sentence.`,
        `2. List the facts you will use (and any assumption, labelled as an assumption).`,
        `3. Produce the smallest useful result: a short table, labelled list, or worked answer.`,
        `4. Write 5 questions you would ask if this were a real workplace.`,
        `5. End with a 'done means' checklist of 4 ticks.`,
      ].join("\n\n"),
      constraints: [
        "Use only the facts in this brief plus clearly labelled assumptions.",
        "Keep the whole deliverable under 500 words plus one table.",
        `Do not jump to advanced ${role} work outside ${district.name}.`,
        "If a calculation is needed, show the steps.",
      ],
      expectedOutcomes: [
        "The goal and facts are restated accurately.",
        "The result is complete enough for a supervisor to review.",
        "Assumptions are labelled and questions are specific.",
        "The done-means checklist matches the expected outcomes of this mission.",
      ],
    },
    {
      ...shared,
      title: `Build a Day-One Checklist for ${topic}`,
      context: `Checklists are how newcomers deliver safe work. You will design a reusable first-week checklist for ${district.name} that another beginner could follow tomorrow.`,
      missionBrief: [
        `Setting: ${pack.workplace}. You are ${pack.newcomer}.`,
        `Create a day-one checklist for ${topic} with 10 steps in the order you would actually do them.`,
        `For each step include: action, why it matters, what 'good' looks like, and when to stop and ask for help.`,
        `Then add a tiny example using this situation: ${caseFor(pack, 1)}`,
        `Finish with a 6-line note titled 'If I get stuck'.`,
      ].join("\n\n"),
      constraints: [
        "Steps must be doable without years of experience.",
        "Mark any step that needs a supervisor sign-off.",
        `Keep the work inside ${district.name}.`,
        `Use ${pack.tools}.`,
      ],
      expectedOutcomes: [
        "Ten ordered steps with action, why, good look, and help trigger.",
        "The tiny example shows the checklist in use.",
        "Supervisor sign-off steps are clearly marked.",
        "The stuck note is concrete, not motivational fluff.",
      ],
    },
    {
      ...shared,
      title: `Explain a ${topic} Result in a One-Page Work Note`,
      context: `${role}s are trusted when they can explain their work to someone who is busy. This mission practises a one-page note a manager could read in three minutes.`,
      missionBrief: [
        `Audience: a busy supervisor who is not sitting next to you.`,
        `Situation: ${caseFor(pack, 2)}`,
        `Write a one-page work note with these headings: Context, What I did, What I found, What I recommend next, What I still need.`,
        `The note must show ${pack.beginnerSkill}.`,
        `Use short sentences. Include at least one tiny table or numbered list.`,
      ].join("\n\n"),
      constraints: [
        "Maximum one page (about 350–450 words).",
        "No jargon unless you define it in the same sentence.",
        `Stay in ${district.name} for ${role}.`,
        "Do not claim you completed work you could not actually do from the brief.",
      ],
      expectedOutcomes: [
        "All five headings are present and specific.",
        "A non-expert can understand the recommendation.",
        "The next step is small and checkable.",
        "Open questions are honest and useful.",
      ],
    },
    {
      ...shared,
      title: `Sort What Matters First in a ${topic} Starter Task`,
      context: `Beginners often try to do everything at once. This mission trains you to sort a ${topic} task into now / next / ask, using only the brief.`,
      missionBrief: [
        `You are ${pack.newcomer} in ${pack.workplace}.`,
        `Incoming task: ${caseFor(pack, 3)}`,
        `Produce three buckets: Now (today), Next (this week), Ask a supervisor.`,
        `Put at least 8 actions across the buckets. Each action must name the evidence you would create.`,
        `Circle (or mark) the single first action and explain why it is first in 4 sentences.`,
      ].join("\n\n"),
      constraints: [
        "Do not schedule work that needs skills outside this district.",
        "Every 'Ask' item must include the exact question.",
        "Keep the first action under 30 minutes.",
        `Use ${pack.tools}.`,
      ],
      expectedOutcomes: [
        "Eight or more actions are sorted into Now / Next / Ask.",
        "Each action names an evidence artefact.",
        "The first action is small, safe, and justified.",
        "A supervisor can see where they are needed.",
      ],
    },
  ];
}

function intermediateMissions(profession, district) {
  const pack = packFor(profession.name);
  const topic = shortDistrict(district.name);
  const role = profession.name;
  const a = article(role);
  const desc = district.description || topic;
  const shared = {
    professionName: role,
    districtName: district.name,
    districtId: district.id,
    difficulty: "Intermediate",
  };

  return [
    {
      ...shared,
      title: `Compare Two ${topic} Options and Pick the Safer Next Step`,
      context: `Once you know the basics, ${a} ${role} is asked to choose. This intermediate ${district.name} mission stays small: two options, given facts, one recommendation.`,
      missionBrief: [
        `Setting: ${pack.workplace}. District: ${desc}`,
        `Situation: ${caseFor(pack, 0)}`,
        `Invent two realistic options (Option A and Option B) that a beginner-to-intermediate ${role} could actually carry out this week.`,
        `Score each option on: speed, cost/effort, risk, and learning value (1–5).`,
        `Recommend one option. Explain the trade-off in 8–12 sentences.`,
        `Add a rollback or 'if this goes wrong' step.`,
      ].join("\n\n"),
      constraints: [
        `Both options must stay inside ${district.name}.`,
        "Do not require a large budget, a big team, or expert certification.",
        "Show the 1–5 scores in a table.",
        `Practise ${pack.intermediateSkill}.`,
      ],
      expectedOutcomes: [
        "Two distinct, realistic options are described.",
        "A scoring table is complete.",
        "The recommendation and rollback step are clear.",
        "A supervisor could approve the next step from this note alone.",
      ],
    },
    {
      ...shared,
      title: `Find Four Mistakes in a Flawed ${topic} Example`,
      context: `Reviewing weak work is a core intermediate skill. You will mark up a flawed ${topic} example and produce a corrected version a newcomer could follow.`,
      missionBrief: [
        `Flawed example to review: ${caseFor(pack, 1)}`,
        `Assume a colleague submitted a rushed draft that ignores beginner safety and clarity.`,
        `1. List exactly four mistakes. For each: what is wrong, why it matters, how to fix it.`,
        `2. Write the corrected version (still short).`,
        `3. Add a 5-item review checklist so the mistake does not repeat.`,
      ].join("\n\n"),
      constraints: [
        "Mistakes must be specific to this district, not generic 'be more professional'.",
        "Keep the corrected version no longer than one page.",
        "Do not introduce advanced techniques that a newcomer could not apply.",
        `Stay in ${role} / ${district.name}.`,
      ],
      expectedOutcomes: [
        "Four concrete mistakes with fixes.",
        "A corrected version that a beginner could reuse.",
        "A five-item review checklist.",
        "The tone is helpful, not mocking.",
      ],
    },
    {
      ...shared,
      title: `Plan a Five-Step ${topic} Workflow for a Small Live Job`,
      context: `${pack.workplace} needs a workflow, not a vague essay. This mission turns ${topic} into five steps with owners, inputs, and a definition of done.`,
      missionBrief: [
        `Job incoming: ${caseFor(pack, 2)}`,
        `Design a 5-step workflow. For each step: name, input, action, output, and who reviews it.`,
        `Mark the riskiest step and say how you would check it.`,
        `Estimate hours for each step (they must sum to 8 hours or less).`,
        `End with a 'ready for supervisor review' package list.`,
      ].join("\n\n"),
      constraints: [
        "The workflow must be completable by one newcomer plus one reviewer.",
        "No step may require tools beyond what a normal laptop user can write or sketch.",
        `Keep the scope inside ${district.name}.`,
        `Show ${pack.intermediateSkill}.`,
      ],
      expectedOutcomes: [
        "Five steps with input, action, output, and reviewer.",
        "Riskiest step is identified with a check.",
        "Hours are realistic and total 8 or less.",
        "The review package list is complete.",
      ],
    },
    {
      ...shared,
      title: `Write a Supervisor Brief for a ${topic} Recommendation`,
      context: `Intermediate ${role}s translate detail into a decision. You will write a supervisor brief for ${district.name} that a manager can act on.`,
      missionBrief: [
        `Situation: ${caseFor(pack, 3)}`,
        `Write a supervisor brief with: Situation, Options (2), Recommendation, Risks (3), Evidence needed, Ask (what you need them to approve).`,
        `The recommendation must be something that can start within 48 hours.`,
        `Include one tiny numbers table (even if the numbers are estimates labelled as estimates).`,
      ].join("\n\n"),
      constraints: [
        "Maximum 500 words plus one table.",
        "Do not hide uncertainty.",
        `Keep the ask inside ${district.name}.`,
        "Write as a colleague, not as a textbook.",
      ],
      expectedOutcomes: [
        "All brief sections are present.",
        "The 48-hour start is realistic.",
        "Three risks are specific.",
        "The approval ask is a single clear decision.",
      ],
    },
    {
      ...shared,
      title: `Turn ${topic} Practice into a Mini Practice Set Others Can Repeat`,
      context: `Teaching a skill is how you prove you understood it. Create a mini practice set for ${district.name} that another beginner could complete in 40 minutes.`,
      missionBrief: [
        `Audience: ${pack.newcomer}.`,
        `Build a practice set with: 1 worked example, 1 guided exercise, 1 independent exercise, and an answer-check list.`,
        `Anchor the set in this situation: ${caseFor(pack, 0)}`,
        `The independent exercise must be completable from the page with no extra files.`,
        `State what 'full marks' looks like in 6 bullets.`,
      ].join("\n\n"),
      constraints: [
        "No paywalled tools.",
        "Keep the whole set inside this district.",
        "The guided exercise must include hints, not just the question.",
        "Answers must be checkable without an expert standing nearby.",
      ],
      expectedOutcomes: [
        "Worked, guided, and independent pieces are present.",
        "The independent exercise is self-contained.",
        "Full-marks bullets are observable.",
        "A beginner could finish in about 40 minutes.",
      ],
    },
  ];
}

function assignMeta(missions, difficultyName) {
  const xp = difficultyName === "Beginner" ? BEGINNER_XP : INTERMEDIATE_XP;
  const mins = difficultyName === "Beginner" ? BEGINNER_MIN : INTERMEDIATE_MIN;
  return missions.map((m, i) => ({
    ...m,
    experiencePoints: xp[i % xp.length],
    estimatedMinutes: mins[i % mins.length],
  }));
}

async function createNode(auth, difficultyId, mission) {
  const fd = formData({
    Title: mission.title,
    Context: mission.context,
    MissionBrief: mission.missionBrief,
    Constraints: mission.constraints,
    ExpectedOutcomes: mission.expectedOutcomes,
    ExperiencePoints: mission.experiencePoints,
    EstimatedMinutes: mission.estimatedMinutes,
    DifficultyId: difficultyId,
    DistrictId: mission.districtId,
  });
  return request(`/api/ProblemNodes?userId=${encodeURIComponent(auth.userId)}`, {
    method: "POST",
    headers: authHeaders(auth.token),
    body: fd,
  });
}

async function main() {
  console.log("=".repeat(64));
  console.log(" Brainepedia beginner + intermediate problem-node seeder");
  console.log(` Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "APPLY"}`);
  console.log(` Target per district: ${TARGET_BEGINNER} beginner, ${TARGET_INTERMEDIATE} intermediate`);
  console.log("=".repeat(64));

  const auth = await login();
  console.log(`Logged in as ${auth.userId}`);

  const diffRes = await request("/api/Difficulties", { headers: authHeaders(auth.token) });
  const diffs = asList(diffRes.data);
  const beginner = diffs.find((d) => /beginner/i.test(d.levelName || d.name || ""));
  const intermediate = diffs.find((d) => /intermediate/i.test(d.levelName || d.name || ""));
  const beginnerId = String(beginner?.difficultyId || beginner?.id || "");
  const intermediateId = String(intermediate?.difficultyId || intermediate?.id || "");
  if (!beginnerId || !intermediateId) {
    throw new Error(`Could not resolve difficulty ids. Got: ${JSON.stringify(diffs).slice(0, 400)}`);
  }
  console.log(`Beginner=${beginnerId}  Intermediate=${intermediateId}`);

  const profRes = await request("/api/Professions", { headers: authHeaders(auth.token) });
  const professions = asList(profRes.data).map((p) => ({
    id: String(p.id ?? p.professionId ?? p.professionsId ?? ""),
    name: p.name || p.professionName || "",
  })).filter((p) => p.id && p.name);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (const profession of professions) {
    const distRes = await request(`/api/Districts/by-profession/${encodeURIComponent(profession.id)}`, {
      headers: authHeaders(auth.token),
    });
    const districts = asList(distRes.data).map((d) => ({
      id: String(d.id ?? d.districtId ?? ""),
      name: d.name || d.districtName || "",
      description: d.description || d.Description || "",
    })).filter((d) => d.id && d.name);

    console.log(`\n▶ ${profession.name} (${districts.length} districts)`);

    for (const district of districts) {
      const nodeRes = await request(`/api/ProblemNodes/by-district/${encodeURIComponent(district.id)}`, {
        headers: authHeaders(auth.token),
      });
      const nodes = asList(nodeRes.data).map((n) => ({
        title: n.title || n.name || "",
        difficultyId: String(n.difficultyId || n.DifficultyId || ""),
      }));
      const existingTitles = nodes.map((n) => n.title);
      const beginnerCount = nodes.filter((n) => n.difficultyId === beginnerId).length;
      const intermediateCount = nodes.filter((n) => n.difficultyId === intermediateId).length;

      const needBeginner = Math.max(0, TARGET_BEGINNER - beginnerCount);
      const needIntermediate = Math.max(0, TARGET_INTERMEDIATE - intermediateCount);
      if (!needBeginner && !needIntermediate) {
        console.log(`    ${district.name}: already B${beginnerCount}/I${intermediateCount} — skip`);
        skipped += 1;
        continue;
      }

      const beginnerPool = assignMeta(beginnerMissions(profession, district), "Beginner");
      const intermediatePool = assignMeta(intermediateMissions(profession, district), "Intermediate");

      const pick = (pool, need) => {
        const chosen = [];
        for (const mission of pool) {
          if (chosen.length >= need) break;
          if (looksTooSimilar(mission.title, existingTitles.concat(chosen.map((c) => c.title)))) continue;
          chosen.push(mission);
        }
        return chosen;
      };

      const toCreate = [
        ...pick(beginnerPool, needBeginner).map((m) => ({ ...m, difficultyId: beginnerId })),
        ...pick(intermediatePool, needIntermediate).map((m) => ({ ...m, difficultyId: intermediateId })),
      ];

      console.log(
        `    ${district.name}: have B${beginnerCount}/I${intermediateCount} → adding ${toCreate.length} (B${needBeginner}/I${needIntermediate})`,
      );

      if (DRY_RUN) {
        for (const mission of toCreate) {
          console.log(`      · ${mission.difficulty}: ${mission.title}`);
          created += 1;
        }
        continue;
      }

      const CONCURRENCY = 3;
      for (let i = 0; i < toCreate.length; i += CONCURRENCY) {
        const batch = toCreate.slice(i, i + CONCURRENCY);
        const results = await Promise.all(batch.map(async (mission) => {
          const res = await createNode(auth, mission.difficultyId, mission);
          return { mission, res };
        }));
        for (const { mission, res } of results) {
          if (res.ok) {
            console.log(`      ✓ ${mission.difficulty}: ${mission.title}`);
            created += 1;
            existingTitles.push(mission.title);
          } else {
            failed += 1;
            const err = `${profession.name} / ${district.name} / ${mission.title} (${res.status}) ${JSON.stringify(res.data).slice(0, 180)}`;
            failures.push(err);
            console.log(`      ✗ ${mission.title} (${res.status})`);
          }
        }
        await sleep(120);
      }
    }
  }

  console.log("\n" + "=".repeat(64));
  console.log(` Created : ${created}${DRY_RUN ? " (dry-run count)" : ""}`);
  console.log(` Skipped districts already at target : ${skipped}`);
  console.log(` Failed  : ${failed}`);
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
