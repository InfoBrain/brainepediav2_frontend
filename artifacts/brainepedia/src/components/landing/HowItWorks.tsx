import { motion } from "framer-motion";
import { UserPlus, MapPin, Target, UploadCloud, Cpu, Award, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function HowItWorks() {
  const steps = [
    { icon: UserPlus, title: "Choose a Profession", desc: "Select your track. Software Engineer, Legal Counsel, Product Architect." },
    { icon: MapPin, title: "Enter a District", desc: "Navigate the platform. Each district holds specialized challenges." },
    { icon: Target, title: "Solve Challenges", desc: "No tutorials. Just raw problem-solving based on real-world scenarios." },
    { icon: UploadCloud, title: "Submit Evidence", desc: "Push your code, upload your brief, or present your design." },
    { icon: Cpu, title: "AI Evaluates", desc: "Brainiac analyzes your submission for logic, edge cases, and efficiency." },
    { icon: Award, title: "Earn XP + VX", desc: "Rank up. Gain Verified Experience that proves you can execute." }
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 py-32 bg-background relative border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">The Game Loop</h2>
          <p className="text-xl text-muted-foreground">
            How professionals build their verified career record.
          </p>
        </div>

        <div className="relative">
          {/* Circuit Board Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-border/50 -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-6 gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-xl bg-card border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,210,255,0.1)] relative group cursor-default">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <step.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  
                  {/* Connection Node */}
                  <div className="hidden md:block absolute -right-[calc(50%+1.5rem)] top-1/2 w-[calc(100%+3rem)] h-px bg-primary/30 -translate-y-1/2 -z-10 group-hover:bg-primary/60 transition-colors" style={{ display: i === steps.length - 1 ? 'none' : 'block' }} />
                </div>
                
                <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <Link href="/how-it-works" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
            Read the full chapter <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
