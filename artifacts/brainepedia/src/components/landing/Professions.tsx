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
    <section className="py-32 relative border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">Choose Your Path.</h2>
          <p className="text-xl text-muted-foreground">
            Specialized districts for elite operators. What will you master?
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
