import { motion } from "framer-motion";
import { GraduationCap, Clock, FileWarning, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function Problem() {
  const problems = [
    {
      icon: GraduationCap,
      title: "Courses don't prove skill.",
      desc: "Completion certificates mean you sat through a video, not that you can do the job."
    },
    {
      icon: Clock,
      title: "Degrees take years.",
      desc: "Traditional credentials are slow, expensive, and out of touch with real-world demands."
    },
    {
      icon: FileWarning,
      title: "Portfolios can be faked.",
      desc: "Anyone can fork a repo or copy a Figma file. Recruiters have lost trust in static portfolios."
    }
  ];

  return (
    <section id="problem" className="scroll-mt-24 py-24 bg-background relative border-y border-border/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {problems.map((p, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-8 rounded-xl border border-destructive/20 bg-destructive/5 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <p.icon className="w-10 h-10 text-destructive mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-3">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/problem" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
            Read the full chapter <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
