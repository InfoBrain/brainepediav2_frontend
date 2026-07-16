import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { usePageTitle } from "@/hooks/usePageTitle";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `These Terms & Conditions ("Terms") form a binding agreement between you and InfoBrain Technologies Nigeria Ltd ("InfoBrain", "we", "our", or "us"). They govern your use of Brainepedia, Brainiac AI tutor, websites, mobile/desktop apps, and any related content or services (collectively, the "Services"). Supplemental terms may apply to specific features (e.g., Professional Exams, Experience Elevator, Portfolio/CV, subscription plans). If there is a conflict, the supplemental terms control for their feature.`,
  },
  {
    id: "eligibility",
    title: "2. Eligibility & Accounts",
    items: [
      "You must be at least the age of majority in your jurisdiction (or have verifiable parental consent) to use the Services.",
      "You are responsible for the accuracy of information you provide and for maintaining the confidentiality of your credentials. You are responsible for all activity under your account.",
      "Notify us immediately of any unauthorized use or security breach: support@infobrainltd.com.",
    ],
  },
  {
    id: "license",
    title: "3. License to Use",
    content:
      "Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for personal or internal business purposes.",
    subsection: {
      title: "Prohibited Actions",
      items: [
        "Reverse engineering, scraping, or attempting to access source code or non-public systems.",
        "Bypassing rate limits or security controls; using bots to overload systems.",
        "Using the Services to violate law, infringe IP, or disseminate harmful, deceptive, or unlawful content.",
      ],
    },
  },
  {
    id: "payments",
    title: "4. Payments, Subscriptions & Refunds",
    items: [
      "Some features (e.g., Experience Elevator tracks, certification exams, portfolio templates, employer recruitment tools) require subscription fees. Prices are denominated in Nigerian Naira (₦) and may change with prior notice.",
      "You authorise us and our payment processors (including Paystack) to charge your selected payment method for recurring or one-time fees and applicable taxes.",
      "Unless otherwise stated, paid plans renew automatically until cancelled. You can cancel in your account settings; cancellations apply to the next billing cycle.",
      "Refunds are handled per the applicable product policy and local law. Certain digital services may be non-refundable once delivered.",
    ],
  },
  {
    id: "ip",
    title: "5. Intellectual Property",
    content:
      "All Service content, logos, trade dress, software, AI models, datasets, mission problems, and documentation are owned by InfoBrain or its licensors and are protected by applicable law. Except for the limited license above, no rights are granted.",
    subsection: {
      title: "User Content",
      items: [
        "By uploading, posting, or submitting content (including CVs, projects, portfolio entries, mission submissions, or forum posts) you grant InfoBrain a worldwide, royalty-free licence to host, process, display, and use that content solely to operate, improve, and provide the Services.",
        "You represent that you have the necessary rights to grant this licence and that your content does not infringe any third-party rights.",
      ],
    },
  },
  {
    id: "ai-disclaimer",
    title: "6. AI & Educational Disclaimers",
    items: [
      "Brainiac AI Tutor & Smart Features: AI outputs may be inaccurate or incomplete. Always verify critical information. You are responsible for your use of outputs.",
      "Professional Exams & Credentials: Exam integrity rules apply. We may revoke, suspend, or audit certifications for suspected misconduct.",
      "Experience Elevator: Simulated/accelerated experience is a structured training programme and does not guarantee employment outcomes.",
      "Skills Verification & XP: Verified Experience (VX) scores reflect performance on platform missions and are not a guarantee of employment or professional qualification.",
    ],
  },
  {
    id: "privacy",
    title: "7. Privacy",
    content:
      "Your use of the Services is also governed by our Privacy Policy, which explains how we collect and process personal data, including data used for AI features where permitted.",
    privacyLink: true,
  },
  {
    id: "acceptable-use",
    title: "8. Acceptable Use & Academic Integrity",
    items: [
      "No harassment, discrimination, hate speech, or illegal content.",
      "No cheating, plagiarism, identity misrepresentation, or attempts to circumvent exam/assessment safeguards.",
      "No uploading of malicious code, or attempts to access others' accounts or data.",
      "Employer accounts must not post misleading job listings or contact candidates outside the platform in unsolicited or abusive ways.",
    ],
  },
  {
    id: "third-party",
    title: "9. Third-Party Services & Links",
    content:
      "The Services may integrate third-party tools (payments, cloud infrastructure, AI model providers, analytics). Your use of those services is subject to their own terms. We are not responsible for third-party content or actions.",
  },
  {
    id: "warranties",
    title: "10. Warranties & Disclaimers",
    content:
      'THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant uninterrupted, error-free, or secure operation.',
    highlight: true,
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    content:
      "To the maximum extent permitted by law, InfoBrain and its affiliates will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or any loss of profits, revenues, data, or goodwill. Our aggregate liability for all claims related to the Services will not exceed the greater of (a) the amounts you paid to us for the Services in the 6 months prior to the claim, or (b) ₦150,000.",
    highlight: true,
  },
  {
    id: "indemnification",
    title: "12. Indemnification",
    content:
      "You agree to indemnify and hold harmless InfoBrain, its directors, employees, and partners from any claims, losses, liabilities, and expenses (including reasonable legal fees) arising from your use of the Services, your content, or your violation of these Terms or applicable law.",
  },
  {
    id: "termination",
    title: "13. Suspension & Termination",
    content:
      "We may suspend or terminate access at any time for breach, fraud, security risk, or legal compliance. You may stop using the Services at any time. Sections covering IP, outstanding payments, disclaimers, limitation of liability, and indemnity survive termination.",
  },
  {
    id: "governing-law",
    title: "14. Governing Law & Dispute Resolution",
    content:
      "These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be resolved through good-faith negotiations first; if unresolved within 30 days, by binding arbitration or the courts of Lagos State, Nigeria.",
  },
  {
    id: "contact",
    title: "15. Contact",
    contact: true,
  },
];

export default function Terms() {
  usePageTitle("Terms & Conditions — Brainepedia");

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
              <div className="h-12 w-12 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#FFD700]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Terms & Conditions
                </h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  Document ID: TC-NG-IBT-V1.0 · Effective Date: 2025-01-01
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-10 text-sm leading-relaxed border-l-2 border-[#FFD700]/40 pl-4">
              Please read these Terms carefully before using Brainepedia. By accessing or using any of our Services,
              you confirm that you have read, understood, and agree to be bound by these Terms.
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
                  className={`border rounded-2xl p-6 ${
                    section.highlight
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/40 bg-card/30"
                  }`}
                >
                  <h2 className={`text-lg font-bold mb-4 ${section.highlight ? "text-amber-400" : "text-[#FFD700]"}`}>
                    {section.title}
                  </h2>

                  {section.content && (
                    <p className={`text-sm leading-relaxed ${section.highlight ? "text-amber-200/70 uppercase text-xs tracking-wide" : "text-muted-foreground"}`}>
                      {section.content}
                    </p>
                  )}

                  {section.privacyLink && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Read our full{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  )}

                  {section.items && (
                    <ul className="space-y-2 mt-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="text-[#FFD700] mt-1 shrink-0">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.subsection && (
                    <div className="mt-4 border-t border-border/30 pt-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">{section.subsection.title}</h3>
                      <ul className="space-y-2">
                        {section.subsection.items.map((item, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="text-[#FFD700] mt-1 shrink-0">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.contact && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">InfoBrain Technologies Nigeria Ltd</p>
                      <p>Lagos, Nigeria</p>
                      <p>
                        Support:{" "}
                        <a href="mailto:support@infobrainltd.com" className="text-primary hover:underline">
                          support@infobrainltd.com
                        </a>
                      </p>
                      <p>
                        Legal:{" "}
                        <a href="mailto:legal@infobrainltd.com" className="text-primary hover:underline">
                          legal@infobrainltd.com
                        </a>
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
