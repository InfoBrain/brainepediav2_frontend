import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Building2, Check, Coins } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ARCHITECT_TEAM_SEAT, EMPLOYER_GRANDMASTER_FEATURES, EMPLOYER_GRANDMASTER_PLAN, USER_SUBSCRIPTION_PLANS } from "@/lib/pricingPlans";

export function Pricing() {
  return (
    <section className="relative scroll-mt-24 border-t border-[#e6e8ef] bg-white py-20" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">Invest in Your Proof.</h2>
          <p className="text-xl text-muted-foreground">
            Stop paying thousands for courses. Pay for validation.
          </p>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto md:grid-cols-2">
          {USER_SUBSCRIPTION_PLANS.map((plan, i) => {
            const popular = Boolean(plan.popular);
            const variant = popular ? "default" : "outline";
            const button =
              plan.key === "Initiate"
                ? "Begin as Initiate"
                : "Become an Architect";
            return (
            <motion.div 
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-2xl border ${
                popular ? 'border-primary shadow-[0_0_30px_rgba(0,210,255,0.15)]' : 
                'border-border/50'
              } bg-card relative flex flex-col`}
            >
              {popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(0,210,255,0.4)]">
                  Most Chosen
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.key}</h3>
              <p className="text-sm text-muted-foreground mb-6 h-10">{plan.description}</p>
              
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.shortPrice}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
              <p className="mb-8 flex items-start gap-2 text-sm text-muted-foreground">
                <Coins className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{plan.brainiacCreditsLabel}</span>
              </p>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                    <span className="text-muted-foreground leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href="/auth/register"
                className={cn(
                  buttonVariants({ variant }),
                  "w-full font-bold",
                  popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                )}
              >
                {button}
              </Link>
            </motion.div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-6xl rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-primary/10 p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-accent">
                <Building2 className="h-3.5 w-3.5" /> Organizations only
              </div>
              <h3 className="text-3xl font-black">{EMPLOYER_GRANDMASTER_PLAN.key}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-accent">$49.99</span>
                <span className="font-mono text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-3 text-muted-foreground">{EMPLOYER_GRANDMASTER_PLAN.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                For Organizations and Employers. Employer Grandmaster is the organization subscription; employee seat activation is billed separately per team member.
              </p>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <Coins className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{EMPLOYER_GRANDMASTER_PLAN.brainiacCreditsLabel}. These credits belong to the organization, not to every employee.</span>
              </p>
              <Link
                href="/auth/register?role=employer"
                className={cn(buttonVariants({ variant: "outline" }), "mt-6 border-accent text-accent hover:bg-accent/10")}
              >
                Explore Corporate Grandmaster
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {EMPLOYER_GRANDMASTER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 rounded-xl border border-white/10 bg-background/40 p-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-3xl border border-primary/20 bg-card p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-2xl font-black">{ARCHITECT_TEAM_SEAT.key}</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                A team seat is billed separately from the Grandmaster organization plan. It does not share or combine the organization credit pool.
              </p>
            </div>
            <p className="flex items-start gap-2 text-sm text-muted-foreground md:max-w-sm">
              <Coins className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{ARCHITECT_TEAM_SEAT.brainiacCreditsLabel}. {ARCHITECT_TEAM_SEAT.note}</span>
            </p>
          </div>
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