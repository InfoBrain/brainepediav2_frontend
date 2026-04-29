import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function Pricing() {
  const plans = [
    {
      name: "Initiate",
      price: "Free",
      desc: "Enter the city and prove your baseline.",
      features: ["3 Missions per month", "Basic Brainiac feedback", "Public profile"],
      button: "Start Free",
      variant: "outline" as const
    },
    {
      name: "Architect",
      price: "$29",
      period: "/mo",
      desc: "For serious operators building their ledger.",
      features: ["Unlimited Missions", "Deep Brainiac evaluation", "Priority queue", "Verified Badges"],
      button: "Become an Architect",
      variant: "default" as const,
      popular: true
    },
    {
      name: "Grandmaster",
      price: "$79",
      period: "/mo",
      desc: "Elite status. Certification and direct referrals.",
      features: ["Everything in Architect", "1-on-1 Human Expert Review", "Recruiter Network Access", "Gold-stamped Profile"],
      button: "Claim Grandmaster",
      variant: "outline" as const,
      premium: true
    }
  ];

  return (
    <section className="py-32 relative border-t border-border/30" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">Invest in Your Proof.</h2>
          <p className="text-xl text-muted-foreground">
            Stop paying thousands for courses. Pay for validation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-2xl border ${
                plan.premium ? 'border-accent shadow-[0_0_30px_rgba(255,215,0,0.15)]' : 
                plan.popular ? 'border-primary shadow-[0_0_30px_rgba(0,210,255,0.15)]' : 
                'border-border/50'
              } bg-card relative flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Recommended
                </div>
              )}
              {plan.premium && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Elite
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plan.premium ? 'text-accent' : ''}`}>{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 h-10">{plan.desc}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check className={`w-5 h-5 shrink-0 ${plan.premium ? 'text-accent' : 'text-primary'}`} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                className={`w-full font-bold ${
                  plan.premium ? 'border-accent text-accent hover:bg-accent/10' : 
                  plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                }`}
              >
                {plan.button}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
