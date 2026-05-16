import { useState } from "react";
import { CONTENT_PILLARS, PLATFORMS, CONTENT_TYPES } from "../types";
import { Sparkles, Copy, RefreshCw, Plus, ChevronDown, Lightbulb } from "lucide-react";

interface Props {
  onAddToCalendar: (topicHook: string, caption: string, cta: string, hashtags: string, platform: string, contentType: string, contentPillar: string) => void;
}

/* ── content generation templates ── */
const HOOKS: Record<string, string[]> = {
  "Career Transformation": [
    "I changed careers at {age} with zero experience. Here's the exact playbook I used 🎯",
    "Nobody tells you this about switching careers into tech (I wish they had)",
    "Stop applying for jobs you're underqualified for — do this instead",
    "The career change strategy that actually works in 2026",
    "From {old_career} to {new_career} in 6 months — no bootcamp, no degree",
  ],
  "AI Learning": [
    "I let AI mentor me for 30 days. Here's what changed 🤖",
    "AI just made learning 10× faster — here's how to use it",
    "The honest truth about AI-powered education in 2026",
    "Watch AI explain {topic} better than any YouTube tutorial",
    "This AI learning hack saves me 3 hours every week",
  ],
  "Experience Elevator": [
    "The Experience Elevator: how to fast-track from junior to senior",
    "Why 'experience required' job listings are now beatable — here's how",
    "I built 6 months of experience in 6 weeks using this system",
    "The portfolio that got me hired before I even graduated",
    "Real experience > certificates. Here's how to get it",
  ],
  "Student Success Stories": [
    "This student landed a Google internship using just Brainepedia 📚",
    "From failing exams to building AI apps in 90 days — {name}'s story",
    "I interviewed {name} 6 months after they joined Brainepedia. Here's what happened",
    "Real student. Real results. Unscripted.",
    "Meet the student who built a portfolio before finishing university",
  ],
  "Productivity": [
    "The 1-hour daily system that changed how I learn forever",
    "Stop watching tutorials. Start doing this instead.",
    "How I learn more in 45 minutes than most people do in 4 hours",
    "The productivity framework top engineers actually use",
    "Delete your tutorial playlist. Do this instead.",
  ],
  "Portfolio Building": [
    "The portfolio mistake costing you interviews (and how to fix it)",
    "What hiring managers actually want to see in a portfolio in 2026",
    "I showed 5 hiring managers my portfolio. Here's their feedback",
    "Your GitHub profile is NOT a portfolio — here's what is",
    "Build a portfolio that gets you hired in 30 days",
  ],
  "Tech Skills": [
    "The 5 most in-demand tech skills in 2026 (according to 500 job listings)",
    "I learned {skill} in 30 days — here's my honest review",
    "Tech skills that will make you unhireable vs skills that won't (thread) 🧵",
    "Stop learning the wrong tech skills. Here's what employers actually want",
    "Master {skill} faster than anyone with this structured approach",
  ],
  "Gamification": [
    "What if learning felt like leveling up in a video game? 🎮",
    "I can't stop using Brainepedia — and it's completely intentional",
    "The psychology behind why gamified learning actually works",
    "Earn XP for real skills. No, this isn't a joke.",
    "Learning that gives you dopamine hits — here's how it works",
  ],
  "Motivation": [
    "Your future self will thank you for starting today — not tomorrow",
    "The gap between where you are and where you want to be is smaller than you think",
    "Nobody remembers the days you watched tutorials. They remember the days you shipped.",
    "Hard truth: consistency beats intensity every single time",
    "You're one skill away from a completely different life",
  ],
  "Tutorials": [
    "Complete beginner's guide to {topic} — everything you need in one place",
    "I teach {topic} for a living — here's what beginners always get wrong",
    "{topic} explained in 5 minutes flat (no jargon, I promise)",
    "Step-by-step: how to master {topic} without getting overwhelmed",
    "The fastest path from zero to confident in {topic}",
  ],
  "Community Engagement": [
    "Our community just hit {milestone}. Here's what that means 🎉",
    "I asked our community what they struggle with most. The answers surprised me.",
    "Which tech skill would you most want to master this year? (Poll below 👇)",
    "The Brainepedia community is doing something remarkable",
    "Meet the people changing their careers inside Brainepedia",
  ],
  "Beta Launch": [
    "🚨 We just opened {number} beta spots — here's what you get",
    "Only {number} founding member spots left. This is your last warning.",
    "After 18 months of building, it's finally here — Brainepedia v2 is LIVE",
    "The beta closes {date}. Don't be the person who says 'I should have joined'",
    "Founding member pricing disappears at midnight {date}",
  ],
  "Testimonials": [
    "'I got my first {role} job using my Brainepedia portfolio' — {name}, {age}",
    "Real user. Zero script. Unfiltered reaction after 30 days on Brainepedia.",
    "I didn't expect this feedback when I asked our beta users what changed",
    "What happens when you give 100 students free access to Brainepedia",
    "'{quote}' — this review made our entire team emotional",
  ],
};

const CAPTIONS: Record<string, string[]> = {
  "Beta Launch": [
    "We built Brainepedia v2 for one reason: to give everyone access to the kind of learning that actually changes careers.\n\nAI mentorship. Real project experience. XP that proves what you can do.\n\nThe founding member beta is open. {number} spots. Once they're gone, early access pricing disappears permanently.",
    "The future of learning is here and it looks nothing like a university course.\n\nBrainepedia v2 gives you:\n→ AI mentor that adapts to your exact skill level\n→ Real-world problem nodes with XP rewards\n→ Portfolio-ready projects from Day 1\n→ Career progression system that works\n\nBeta is live. Founding members get lifetime pricing. Link in bio.",
  ],
  "Career Transformation": [
    "The traditional career path is broken. Spending 4 years and $50k to get a degree that doesn't guarantee you the job you want doesn't make sense anymore.\n\nBrainepedia v2 gives you a different path — one built on real skills, real projects, and a portfolio that speaks louder than any certificate.\n\nYour career transformation starts with one decision. Make it today.",
    "Career pivots are scary. But the alternative — staying stuck — is worse.\n\nBrainepedia has helped thousands of people make the move. The common thread? They all started with exactly the same thing: one problem node, one hour of focused practice.\n\nYour turn.",
  ],
  "AI Learning": [
    "AI isn't replacing learners — it's replacing passive learners.\n\nBrainepedia's AI mentor doesn't just explain concepts. It adapts to how you learn, challenges you at exactly the right level, and provides feedback that a human tutor would charge hundreds of dollars an hour for.\n\nThis is what learning looks like now.",
    "The difference between learners who succeed and those who don't isn't talent — it's the quality of feedback they receive.\n\nBrainepedia's AI mentor provides instant, personalised feedback on every problem you solve. No waiting for a tutor. No generic YouTube comments. Just smart guidance, exactly when you need it.",
  ],
  "default": [
    "At Brainepedia, we believe everyone deserves access to learning that creates real career outcomes. Not just knowledge — actual, demonstrable experience that employers recognise and value.\n\nJoin thousands of learners who are already on the platform and start your journey today.",
    "The best time to start building your skills was 6 months ago. The second best time is right now.\n\nBrainepedia v2 is live. Your future career is waiting.",
  ],
};

const CTAS = [
  "Join the Beta Free", "Start Learning Today", "Claim Your Spot",
  "Build Your Portfolio", "Try It Free", "Start Your Journey",
  "Get Early Access", "Join 10,000+ Learners", "Level Up Today",
  "Secure Your Founding Spot",
];

const HASHTAG_PACKS: Record<string, string[]> = {
  "Career Transformation": ["#CareerTransformation #CareerChange #NewCareer #TechJobs #Brainepedia #CareerGrowth #JobSearch #BreakIntoTech"],
  "AI Learning":           ["#AILearning #ArtificialIntelligence #MachineLearning #EdTech #Brainepedia #AITools #FutureOfLearning"],
  "Experience Elevator":   ["#ExperienceElevator #CareerGrowth #Portfolio #ProfessionalDevelopment #Brainepedia #TechCareer"],
  "Student Success Stories":["#StudentSuccess #Internship #GradLife #TechJobs #Brainepedia #CareerTips #SuccessStory"],
  "Productivity":           ["#Productivity #LearningHacks #TimeManagement #DeepWork #Brainepedia #Efficiency #GrowthMindset"],
  "Portfolio Building":     ["#Portfolio #Developers #GitHub #CareerAdvice #Brainepedia #JobSearch #TechPortfolio"],
  "Tech Skills":            ["#TechSkills #Coding #Programming #DataScience #Brainepedia #LearnToCode #TechJobs"],
  "Gamification":           ["#Gamification #GamifiedLearning #EdTech #XP #Brainepedia #LevelUp #LearnWithAI"],
  "Motivation":             ["#Motivation #Mindset #CareerGoals #GrowthMindset #Brainepedia #Success #Inspire"],
  "Tutorials":              ["#Tutorial #HowTo #LearnToCode #TechTutorial #Brainepedia #Education #FreeLearning"],
  "Community Engagement":   ["#Community #EdTech #Brainepedia #LearningCommunity #TechCommunity #ConnectAndLearn"],
  "Beta Launch":            ["#BetaLaunch #ProductLaunch #EarlyAccess #EdTech #Brainepedia #FoundingMember #SaaS"],
  "Testimonials":           ["#Testimonial #SuccessStory #RealResults #Brainepedia #CustomerLove #TrueStory"],
};

const CAMPAIGN_IDEAS = [
  "30-Day Career Transformation Challenge",
  "AI Mentor Awareness Week",
  "Experience Elevator Series",
  "Student Success Spotlight",
  "Founding Member Final Push",
  "Beta Launch Week",
  "Tech Skills Mastery Month",
  "Portfolio Building Sprint",
  "Community Milestone Celebration",
  "Tutorial Thursday Weekly Series",
];

export default function AIAssistant({ onAddToCalendar }: Props) {
  const [pillar, setPillar] = useState(CONTENT_PILLARS[0]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [generated, setGenerated] = useState<{ hooks: string[]; captions: string[]; ctas: string[]; hashtags: string; campaigns: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [selectedHook, setSelectedHook] = useState("");
  const [selectedCaption, setSelectedCaption] = useState("");
  const [selectedCta, setSelectedCta] = useState("");

  function pickRandom<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  }

  function generate() {
    setLoading(true);
    setGenerated(null);
    setSelectedHook("");
    setSelectedCaption("");
    setSelectedCta("");

    setTimeout(() => {
      const rawHooks = HOOKS[pillar] || HOOKS["default"] || [];
      const rawCaptions = CAPTIONS[pillar] || CAPTIONS["default"];
      const rawHashtags = HASHTAG_PACKS[pillar] || HASHTAG_PACKS["default"] || ["#Brainepedia #EdTech #AILearning"];

      const fill = (s: string) => s
        .replace("{age}", ["25","28","30","32","35"][Math.floor(Math.random() * 5)])
        .replace("{number}", ["100","200","500","50"][Math.floor(Math.random() * 4)])
        .replace("{name}", ["Alex","Priya","Michael","David","Sarah"][Math.floor(Math.random() * 5)])
        .replace("{skill}", topic || "Python")
        .replace("{topic}", topic || "web development")
        .replace("{role}", ["developer","analyst","engineer","designer"][Math.floor(Math.random() * 4)])
        .replace("{milestone}", ["1,000","5,000","10,000"][Math.floor(Math.random() * 3)])
        .replace("{old_career}", ["marketing","finance","teaching","law"][Math.floor(Math.random() * 4)])
        .replace("{new_career}", ["software engineering","data science","DevOps","cloud architecture"][Math.floor(Math.random() * 4)])
        .replace("{date}", "June 30")
        .replace("{quote}", "This changed my career trajectory completely")
        .replace("{age}", "23");

      setGenerated({
        hooks:     pickRandom(rawHooks, 5).map(fill),
        captions:  pickRandom(rawCaptions, 2).map(fill),
        ctas:      pickRandom(CTAS, 4),
        hashtags:  rawHashtags[0],
        campaigns: pickRandom(CAMPAIGN_IDEAS, 5),
      });
      setLoading(false);
    }, 1200);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  const selectSt: React.CSSProperties = {
    background: "#0D1117", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8,
    color: "#CBD5E1", padding: "8px 12px", fontSize: 13, cursor: "pointer", outline: "none", width: "100%",
  };

  const sectionStyle: React.CSSProperties = {
    background: "#0D1117", border: "1px solid rgba(59,130,246,0.12)",
    borderRadius: 14, padding: "20px 24px", marginBottom: 20,
  };

  function ResultItem({ text, id, selected, onSelect }: { text: string; id: string; selected: boolean; onSelect: () => void }) {
    return (
      <div
        onClick={onSelect}
        style={{
          background: selected ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${selected ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.08)"}`,
          borderRadius: 10, padding: "12px 14px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10,
          transition: "all 0.15s",
        }}
      >
        <span style={{ fontSize: 13, color: selected ? "#93C5FD" : "#CBD5E1", lineHeight: 1.5, flex: 1 }}>{text}</span>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingTop: 2 }}>
          {selected && <span style={{ fontSize: 10, color: "#60A5FA", fontWeight: 600 }}>✓ Selected</span>}
          <button
            onClick={e => { e.stopPropagation(); copy(text, id); }}
            style={{ background: "none", border: "none", color: copied === id ? "#10B981" : "#475569", cursor: "pointer", padding: 2 }}
            title="Copy"
          >
            <Copy size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: "28px 32px 40px", maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>
          <span className="gradient-text">AI</span> Content Assistant
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 13 }}>
          Generate viral hooks, captions, CTAs, and hashtag packs for Brainepedia v2 campaigns
        </p>
      </div>

      {/* Inputs */}
      <div style={sectionStyle}>
        <h2 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#3B82F6" />
          Content Settings
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Content Pillar</label>
            <select style={selectSt} value={pillar} onChange={e => setPillar(e.target.value as any)}>
              {CONTENT_PILLARS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Platform</label>
            <select style={selectSt} value={platform} onChange={e => setPlatform(e.target.value as any)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Content Type</label>
            <select style={selectSt} value={contentType} onChange={e => setContentType(e.target.value as any)}>
              {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Topic / Keyword (optional)</label>
          <input
            style={{ ...selectSt, padding: "9px 14px" }}
            placeholder="e.g. Python, AI mentor, career change, portfolio..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") generate(); }}
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 24px",
            background: loading ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg,#1E40AF,#3B82F6)",
            border: "none", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
              Generating content...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate Content Ideas
            </>
          )}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: "linear-gradient(90deg, #111827 25%, #1a2438 50%, #111827 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
          <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        </div>
      )}

      {/* Generated results */}
      {generated && !loading && (
        <div className="animate-fade-in">

          {/* Hooks */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 8 }}>
                <Lightbulb size={15} color="#F59E0B" />
                Viral Hooks ({generated.hooks.length})
              </h3>
              <button onClick={generate} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <RefreshCw size={12} /> Regenerate
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {generated.hooks.map((h, i) => (
                <ResultItem key={i} text={h} id={`hook-${i}`} selected={selectedHook === h} onSelect={() => setSelectedHook(selectedHook === h ? "" : h)} />
              ))}
            </div>
          </div>

          {/* Captions */}
          <div style={sectionStyle}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 8 }}>
              <ChevronDown size={15} color="#8B5CF6" />
              Caption Suggestions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {generated.captions.map((c, i) => (
                <ResultItem key={i} text={c} id={`caption-${i}`} selected={selectedCaption === c} onSelect={() => setSelectedCaption(selectedCaption === c ? "" : c)} />
              ))}
            </div>
          </div>

          {/* CTAs + Hashtags in 2 cols */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>CTA Suggestions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {generated.ctas.map((c, i) => (
                  <ResultItem key={i} text={c} id={`cta-${i}`} selected={selectedCta === c} onSelect={() => setSelectedCta(selectedCta === c ? "" : c)} />
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>Hashtag Pack</h3>
              <div style={{
                background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)",
                borderRadius: 10, padding: "12px 14px", position: "relative",
              }}>
                <p style={{ margin: 0, fontSize: 12, color: "#93C5FD", lineHeight: 1.6 }}>{generated.hashtags}</p>
                <button
                  onClick={() => copy(generated.hashtags, "hashtags")}
                  style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: copied === "hashtags" ? "#10B981" : "#475569", cursor: "pointer", padding: 4 }}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Campaign ideas */}
          <div style={sectionStyle}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>Campaign Name Ideas</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {generated.campaigns.map((c, i) => (
                <div
                  key={i}
                  onClick={() => copy(c, `camp-${i}`)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    background: copied === `camp-${i}` ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.1)",
                    border: `1px solid ${copied === `camp-${i}` ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.25)"}`,
                    color: copied === `camp-${i}` ? "#34D399" : "#C4B5FD",
                    transition: "all 0.15s",
                  }}
                  title="Click to copy"
                >
                  {copied === `camp-${i}` ? "✓ Copied" : c}
                </div>
              ))}
            </div>
          </div>

          {/* Add to calendar CTA */}
          {(selectedHook || selectedCaption) && (
            <div className="animate-fade-in" style={{
              background: "linear-gradient(135deg, rgba(30,64,175,0.2), rgba(59,130,246,0.1))",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 14, padding: "20px 24px",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Ready to schedule?</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>
                  {selectedHook ? "Hook selected ✓ " : ""}{selectedCaption ? "Caption selected ✓ " : ""}{selectedCta ? "CTA selected ✓" : ""}
                </p>
              </div>
              <button
                onClick={() => onAddToCalendar(
                  selectedHook || generated.hooks[0],
                  selectedCaption || generated.captions[0],
                  selectedCta || generated.ctas[0],
                  generated.hashtags,
                  platform,
                  contentType,
                  pillar,
                )}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", background: "linear-gradient(135deg,#1E40AF,#3B82F6)",
                  border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Plus size={15} />
                Add to Calendar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
          <Sparkles size={40} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Select a content pillar and click "Generate Content Ideas" to get started</p>
          <p style={{ fontSize: 12, margin: "8px 0 0", color: "#1E293B" }}>Generates hooks, captions, CTAs, hashtags, and campaign names for Brainepedia v2</p>
        </div>
      )}
    </div>
  );
}
