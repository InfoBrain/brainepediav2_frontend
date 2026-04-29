import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap } from "lucide-react";

export function Nav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Brainepedia</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#missions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Missions</a>
          <a href="#brainiac" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Brainiac AI</a>
          <a href="#ledger" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">VX Ledger</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">Log In</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] border border-primary/50">
            Enter City
          </Button>
        </div>
      </div>
    </nav>
  );
}
