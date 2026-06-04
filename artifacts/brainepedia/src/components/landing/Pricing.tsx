import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { USER_SUBSCRIPTION_PLANS } from "@/lib/pricingPlans";

export function Pricing() {
  return (
    <section className="py-32 relative border-t border-border/30" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">Invest in Your Proof.</h2>
          <p className="text-xl text-muted-foreground">
            Stop paying thousands for courses. Pay for validation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {USER_SUBSCRIPTION_PLANS.map((plan, i) => {
            const premium = plan.key === "Grandmaster";
            const popular = Boolean(plan.popular);
            const variant = popular ? "default" : "outline";
            const button =
              plan.key === "Initiate"
                ? "Begin as Initiate"
                : plan.key === "Architect"
                ? "Become an Architect"
                : "Become a Grandmaster";
            return (
            <motion.div 
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-2xl border ${
                premium ? 'border-accent shadow-[0_0_30px_rgba(255,215,0,0.15)]' : 
                popular ? 'border-primary shadow-[0_0_30px_rgba(0,210,255,0.15)]' : 
                'border-border/50'
              } bg-card relative flex flex-col`}
            >
              {popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(0,210,255,0.4)]">
                  Most Chosen
                </div>
              )}
              {premium && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                  Elite
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${premium ? 'text-accent' : ''}`}>{plan.key}</h3>
              <p className="text-sm text-muted-foreground mb-6 h-10">{plan.description}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-bold">{plan.shortPrice}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${premium ? 'text-accent' : 'text-primary'}`} />
                    <span className="text-muted-foreground leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href="/auth/register"
                className={cn(
                  buttonVariants({ variant }),
                  "w-full font-bold",
                  premium ? 'border-accent text-accent hover:bg-accent/10' : 
                  popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                )}
              >
                {button}
              </Link>
            </motion.div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="font-mono text-xs text-muted-foreground opacity-60">
            All prices in USD. Cancel anytime. Annual billing saves 20%.
          </p>
        </div>
      </div>
    </section>
  );
}