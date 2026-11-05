import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export function Brainiac() {
  return (
    <section className="bg-white py-20" id="brainiac">
      <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
        <div className="grid items-center gap-12 rounded-[25px] bg-[radial-gradient(circle_at_5%_10%,#7048b4,transparent_40%),#232642] px-6 py-12 text-white lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Meet Brainiac.</h2>
            <p className="mb-8 text-base leading-7 text-[#cccbd9]">
              Mentorship, not answers. Brainiac evaluates your submissions with the scrutiny of a principal engineer. It finds your blind spots, highlights your inefficiencies, and issues a final verdict.
            </p>
            <ul className="space-y-4">
              {[
                "Analyzes architecture, not just syntax.",
                "Flags security vulnerabilities and edge cases.",
                "Grades against industry-standard benchmarks.",
                "Issues independently verified Verified Experience (VX) scores.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[#deddea]">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="flex-1 w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="overflow-hidden rounded-[17px] border border-white/20 bg-white text-[#182137] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between border-b border-[#e6e8ef] px-4 py-3">
                <div className="flex items-center gap-2 text-[#70798d]">
                  <Terminal className="w-4 h-4" />
                  <span>brainiac-eval.sh</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-accent/80" />
                  <div className="w-3 h-3 rounded-full bg-primary/80" />
                </div>
              </div>
              <div className="space-y-4 p-6 text-sm text-[#60687a]">
                <div><span className="text-[#7d4ccc]">&gt;</span> Analyzing submission: <span className="font-bold text-[#182137]">auth_middleware.ts</span></div>
                <div className="animate-pulse">...</div>
                <div><span className="font-bold text-[#168a68]">[PASS]</span> Token validation logic</div>
                <div><span className="font-bold text-[#168a68]">[PASS]</span> Error handling bounds</div>
                <div><span className="font-bold text-[#d88c1b]">[WARN]</span> Rate limiting implementation is O(N) where O(1) is expected.</div>
                <div className="border-t border-[#e6e8ef] pt-4">
                  <div className="font-bold text-[#182137]">VERDICT: <span className="text-[#d88c1b]">PARTIAL_SUCCESS</span></div>
                  <div>XP_AWARDED: <span className="font-bold text-[#7d4ccc]">450</span></div>
                  <div>FEEDBACK: "Implement a Redis-backed token bucket to resolve the rate-limiting bottleneck."</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
