import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Chidi Okeke",
    role: "Software Engineer",
    city: "Lagos",
    avatar: "CO",
    color: "from-[#00D2FF] to-[#9D4EDD]",
    stars: 5,
    quote:
      "Before Brainepedia, my CV looked like everyone else's. After completing the Backend Engineering district, I had verified XP to show recruiters. My next interview, they asked about my Brainepedia profile before anything else. I got the offer that week.",
  },
  {
    name: "Amara Okonkwo",
    role: "Data Analyst",
    city: "Abuja",
    avatar: "AO",
    color: "from-[#9D4EDD] to-[#FFD700]",
    stars: 5,
    quote:
      "I was working in finance and wanted to transition to data science. Within three months on Brainepedia, my verified portfolio opened doors I never expected. Three companies reached out directly — none of them had seen my CV first.",
  },
  {
    name: "Bola Adeleke",
    role: "Product Manager",
    city: "Port Harcourt",
    avatar: "BA",
    color: "from-[#FFD700] to-[#00D2FF]",
    stars: 5,
    quote:
      "The missions are brutally realistic — exactly like problems I face at work every day. When Brainiac evaluated my product strategy submission, the feedback was more detailed and honest than anything I ever got from a manager. That level of scrutiny builds real confidence.",
  },
  {
    name: "Fatima Musa",
    role: "Cybersecurity Analyst",
    city: "Kano",
    avatar: "FM",
    color: "from-[#00D2FF] to-[#FFD700]",
    stars: 5,
    quote:
      "I couldn't afford expensive bootcamps or overseas certifications. Brainepedia let me prove my skills through actual challenges — no gatekeeping. My employer specifically mentioned my VX score during my onboarding as the reason they shortlisted me.",
  },
];

const STATS = [
  { value: "1,200+", label: "Professionals Verified" },
  { value: "45+", label: "Employers Hiring" },
  { value: "98%", label: "Mission Completion Rate" },
  { value: "3.2×", label: "Average Salary Increase" },
];

export function Testimonials() {
  return (
    <section className="py-32 relative overflow-hidden" id="testimonials">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-mono mb-5">
            <Star className="w-4 h-4 fill-accent" />
            Verified Member Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Real professionals. Real results.</h2>
          <p className="text-xl text-muted-foreground">
            From career transitions to promotions — this is what verified proof of skill actually does.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 p-6 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1 font-mono">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-colors group"
            >
              <Quote className="absolute top-5 right-5 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground leading-relaxed mb-5 text-sm">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-black font-bold text-sm flex-shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role} · {t.city}, Nigeria
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
