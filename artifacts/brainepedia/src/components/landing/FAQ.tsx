import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Link } from "wouter";

const faqs = [
  {
    q: "What is Brainepedia?",
    a: "Brainepedia is an AI-driven career RPG platform. Instead of collecting passive certificates, you earn Verified Experience (VX) by solving real-world professional missions inside skill Districts — the same challenges you'd face on the job. Your performance is evaluated by Brainiac, our AI tutor, and recorded on your public dossier.",
  },
  {
    q: "How does Verified Experience (VX) work?",
    a: "Every mission you complete awards XP based on depth, accuracy, and speed. XP accumulates into your VX score — a tamper-proof record that employers and collaborators can view on your public profile. Unlike traditional credentials, VX reflects demonstrated problem-solving ability, not just completion.",
  },
  {
    q: "What are Districts and Missions?",
    a: "Districts are skill zones within your chosen profession (e.g., 'Backend Engineering', 'Financial Analysis'). Each District contains a series of Missions — real-world problem scenarios with context, constraints, and expected outcomes. Completing missions inside a District raises your District Mastery percentage.",
  },
  {
    q: "How does the Brainiac AI tutor help me?",
    a: "Brainiac evaluates your mission submissions, gives detailed feedback, suggests improvements, and tracks your growth over time. It can also answer questions mid-mission, generate targeted study material, and guide you through complex concepts — acting as a senior colleague rather than a generic chatbot.",
  },
  {
    q: "Which professions are supported?",
    a: "Brainepedia supports a growing catalogue of professions including Software Engineering, Data Science, Finance & Accounting, Law, Medicine, and more. New professions and Districts are added regularly. You can browse all available professions after registration.",
  },
  {
    q: "What subscription plans are available?",
    a: "We offer three tiers: Initiate (free) for exploring the platform and completing starter missions; Architect for full district access and portfolio tools; and Grandmaster for unlimited missions, priority evaluation, experience elevator tracks, and premium certifications. See our Pricing section for details.",
  },
  {
    q: "How do badges work?",
    a: "Badges are awarded automatically when you hit specific milestones — finishing a District, maintaining a streak, achieving a top score on a mission, or unlocking a rare skill. Badges carry rarity tiers (Common, Rare, Epic, Legendary) and appear on your public dossier. You can pin up to 3 badges to highlight on your profile.",
  },
  {
    q: "Can employers see my progress?",
    a: "Yes. Every Brainepedia account has a public dossier accessible via a shareable link. Employers can view your total XP, District Mastery radar, badges earned, missions solved, and day streak — without needing a Brainepedia account themselves.",
  },
  {
    q: "How is Brainepedia different from traditional online courses?",
    a: "Traditional courses give you knowledge; Brainepedia proves you can apply it. There are no video lectures — only real-world missions with deadlines, constraints, and AI evaluation. Your dossier shows what you've done, not what you've watched.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We apply encryption in transit and at rest, access controls, and continuous monitoring. We do not sell your personal data. You can request access, correction, or deletion of your data at any time by contacting privacy@infobrainltd.com.",
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`border rounded-xl overflow-hidden transition-colors duration-200 ${
        open ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/20 hover:border-border/70"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <span
          className={`shrink-0 mt-0.5 text-sm font-mono font-bold w-6 ${open ? "text-primary" : "text-muted-foreground"}`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={`flex-1 font-medium text-sm md:text-base leading-snug ${open ? "text-foreground" : "text-foreground/80"}`}>
          {faq.q}
        </span>
        <ChevronDown
          className={`shrink-0 h-5 w-5 mt-0.5 transition-transform duration-300 ${
            open ? "rotate-180 text-primary" : "text-muted-foreground"
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pl-[3.25rem] text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#9D4EDD]/8 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/10 text-[#9D4EDD] text-xs font-mono uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Got questions?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to know about Brainepedia, missions, and how your VX score works.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-10"
        >
          Still have questions?{" "}
          <a href="mailto:support@infobrainltd.com" className="text-primary hover:underline">
            Contact our support team
          </a>{" "}
          or read our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms & Conditions
          </Link>
          .
        </motion.p>
      </div>
    </section>
  );
}
