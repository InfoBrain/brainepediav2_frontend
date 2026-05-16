import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { usePageTitle } from "@/hooks/usePageTitle";

const sections = [
  {
    id: "scope",
    title: "1. Scope",
    content: `This Privacy Policy applies to our websites, mobile/desktop apps, Brainiac AI tutor, Brainepedia features (Experience Elevator, Professional Exams, Portfolio & CV), BPCoin/Brainnet tools, and related services (collectively, the "Services").`,
  },
  {
    id: "data-we-collect",
    title: "2. Data We Collect",
    subsections: [
      {
        title: "2.1 Information You Provide",
        items: [
          "Account & Profile: name, email, phone, address, date of birth, country/state/city, profession, bio.",
          "Learning & Exams: submitted assignments, exam attempts/scores, certifications, portfolio/CV data, uploaded files (e.g., PDF/DOCX).",
          "Payments: billing details and transaction metadata (processed by PCI-compliant partners).",
          "Support & Feedback: messages, surveys, reviews, referrals.",
        ],
      },
      {
        title: "2.2 Information We Collect Automatically",
        items: [
          "Usage data: pages/features used, clickstream, session duration, device identifiers.",
          "Technical data: IP address, browser, OS, app version, crash logs, cookies.",
        ],
      },
      {
        title: "2.3 From Third Parties",
        items: [
          "Identity/verification providers (optional), analytics, marketing, payment processors.",
          "Social or professional networks if you connect them (e.g., LinkedIn profile import).",
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Data",
    items: [
      "Provide and improve Services: learning paths, exam delivery, AI tutoring, portfolio/CV generation.",
      "Personalize experiences: recommended courses, projects, skills, and exam prep.",
      "Operate AI features: to process prompts, generate outputs, and improve model quality and safety.",
      "Communications: account notices, updates, marketing (you can opt out of marketing at any time).",
      "Security & integrity: fraud prevention, proctoring/anti-cheat measures, abuse detection.",
      "Compliance: legal, regulatory, and tax obligations.",
    ],
  },
  {
    id: "ai-processing",
    title: "4. AI Processing (Brainiac & Model Training)",
    items: [
      "Brainiac processes your prompts, uploaded study/CV materials, and interaction signals to generate responses.",
      "Where permitted, de-identified or aggregated data may be used to improve model performance, safety, and features.",
      "You should not share confidential or sensitive information unless necessary. Verify critical outputs.",
    ],
  },
  {
    id: "blockchain",
    title: "5. Blockchain & Wallet Data",
    items: [
      "Wallet addresses, transaction hashes, validator activity, and on-chain events may be publicly visible by design.",
      "We may store wallet metadata necessary to operate Brainnet/BPCoin features (e.g., staking, vesting, rewards).",
      "Blockchain data may be immutable; requests for deletion may not be feasible for on-chain records.",
    ],
  },
  {
    id: "legal-basis",
    title: "6. Legal Basis",
    content:
      "We process personal data under one or more of the following bases: consent, performance of a contract, legitimate interests (e.g., security, product improvement), legal obligation, or vital interests (rare).",
  },
  {
    id: "how-we-share",
    title: "7. How We Share Data",
    items: [
      "Service Providers: hosting, analytics, payments, communications, proctoring, KYC (where applicable).",
      "Enterprise/Education Partners: with your authorization for verification, hiring, or credential validation.",
      "Legal & Safety: to comply with law, enforce terms, or protect rights/safety.",
      "Business Transfers: merger, acquisition, financing, or asset sale (with continued protections).",
    ],
    footer: "We do not sell your personal data.",
  },
  {
    id: "international",
    title: "8. International Transfers",
    content:
      "Your data may be processed in countries outside your own. We use appropriate safeguards (e.g., contractual clauses) where required by law.",
  },
  {
    id: "retention",
    title: "9. Data Retention",
    content:
      "We retain data for as long as necessary to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements. We may retain de-identified or aggregated data for analytics and model improvement.",
  },
  {
    id: "security",
    title: "10. Security",
    content:
      "We apply administrative, technical, and organizational safeguards (encryption in transit/at rest where applicable, access controls, monitoring). No system is 100% secure; you also play a role by protecting your credentials and devices.",
  },
  {
    id: "your-rights",
    title: "11. Your Rights & Choices",
    items: [
      "Access, correct, or delete your personal information (subject to legal/contractual limits).",
      "Object to or restrict processing; request data portability.",
      "Manage cookies/trackers via browser settings.",
      "Withdraw consent at any time (does not affect prior lawful processing).",
    ],
    footer:
      "Residents under NDPR/GDPR-like regimes may have additional rights. We will respond to verifiable requests within required timelines.",
  },
  {
    id: "children",
    title: "12. Children's Privacy",
    content:
      "Our Services are not directed to children under the age of digital consent unless used through an approved institution with verifiable consent. If we learn we collected such data without consent, we will delete it.",
  },
  {
    id: "cookies",
    title: "13. Cookies & Similar Technologies",
    content:
      "We use cookies, SDKs, and similar tools for authentication, personalization, analytics, performance, and marketing. You can manage preferences in your browser and (where available) via our cookie controls.",
  },
  {
    id: "marketing",
    title: "14. Marketing Communications",
    content:
      "You can opt out of marketing emails by using the unsubscribe link or contacting us. We may still send transactional or service-related messages.",
  },
  {
    id: "changes",
    title: "15. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Material changes will be communicated via email or in-product notice. Your continued use after the effective date means you accept the changes.",
  },
  {
    id: "contact",
    title: "16. Contact & Data Protection",
    contact: true,
  },
];

export default function PrivacyPolicy() {
  usePageTitle("Privacy Policy — Brainepedia");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Privacy Policy
                </h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  Document ID: PP-NG-IBT-V1.0 · Effective Date: 2025-01-01
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-10 text-sm leading-relaxed border-l-2 border-primary/30 pl-4">
              InfoBrain Technologies Nigeria Ltd ("InfoBrain", "we", "our", or "us") is committed to protecting
              your privacy. This policy describes how we collect, use, and protect your data when you use Brainepedia
              and related services.
            </p>

            <div className="space-y-10">
              {sections.map((section, idx) => (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  className="border border-border/40 rounded-2xl p-6 bg-card/30"
                >
                  <h2 className="text-lg font-bold text-primary mb-4">{section.title}</h2>

                  {section.content && (
                    <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                  )}

                  {section.items && (
                    <ul className="space-y-2 mt-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="text-primary mt-1 shrink-0">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.subsections && (
                    <div className="space-y-5">
                      {section.subsections.map((sub, si) => (
                        <div key={si}>
                          <h3 className="text-sm font-semibold text-foreground mb-2">{sub.title}</h3>
                          <ul className="space-y-2">
                            {sub.items.map((item, i) => (
                              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                <span className="text-primary mt-1 shrink-0">▸</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.footer && (
                    <p className="mt-4 text-sm font-medium text-foreground/80 border-t border-border/30 pt-3">
                      {section.footer}
                    </p>
                  )}

                  {section.contact && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">InfoBrain Technologies Nigeria Ltd</p>
                      <p>Lagos, Nigeria</p>
                      <p>
                        Email:{" "}
                        <a href="mailto:privacy@infobrainltd.com" className="text-primary hover:underline">
                          privacy@infobrainltd.com
                        </a>
                      </p>
                      <p>
                        Support:{" "}
                        <a href="mailto:support@infobrainltd.com" className="text-primary hover:underline">
                          support@infobrainltd.com
                        </a>
                      </p>
                      <p>
                        Data Protection Officer:{" "}
                        <a href="mailto:dpo@infobrainltd.com" className="text-primary hover:underline">
                          dpo@infobrainltd.com
                        </a>
                      </p>
                      <p className="pt-2 text-xs text-muted-foreground/60">
                        If you believe your privacy rights have been infringed, you may also lodge a complaint
                        with your local data protection authority.
                      </p>
                    </div>
                  )}
                </motion.section>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
