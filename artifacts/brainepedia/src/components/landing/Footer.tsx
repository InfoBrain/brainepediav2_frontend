import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">Brainepedia</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              The AI-driven career RPG. Earn Verified Experience (VX) by solving real-world missions. Stop learning, start proving.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Missions</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Brainiac Evaluator</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">VX Ledger</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Brainepedia. All rights reserved.</p>
          <div className="font-mono text-xs opacity-50">
            SYSTEM.STATUS: ONLINE
          </div>
        </div>
      </div>
    </footer>
  );
}
