import { motion } from "framer-motion";
import { Code, Scale, Stethoscope, Paintbrush } from "lucide-react";

export function Professions() {
  const professions = [
    {
      icon: Code,
      title: "Software Engineer",
      mission: "Refactor a legacy payments system handling 10k TPS.",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30"
    },
    {
      icon: Scale,
      title: "Legal Counsel",
      mission: "Defend a wrongful termination claim in a simulated tribunal.",
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/30"
    },
    {
      icon: Stethoscope,
      title: "Medical Diagnostician",
      mission: "Diagnose a 47-year-old patient with acute shortness of breath.",
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-400/30"
    },
    {
      icon: Paintbrush,
      title: "Product Designer",
      mission: "Redesign a checkout flow with a 38% drop-off rate.",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/30"
    }
  ];

  return (
    <section id="professions" className="scroll-mt-24 border-t border-[#e6e8ef] bg-[#f7f8fb] py-20">
      <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">Professions</p>
          <h2 className="mt-2 text-4xl font-extrabold">Choose your path.</h2>
          <p className="mt-3 text-sm leading-7 text-[#70798d]">
            Districts and missions stay available for every profession already on the platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {professions.map((prof, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-card border border-border/50 hover:border-foreground/30 transition-colors group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-lg ${prof.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${prof.border} border`}>
                <prof.icon className={`w-6 h-6 ${prof.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{prof.title}</h3>
              <p className="text-sm text-muted-foreground border-t border-border/50 pt-4 mt-4">
                <span className="font-mono text-xs uppercase tracking-wider block mb-1">Sample Mission:</span>
                {prof.mission}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
