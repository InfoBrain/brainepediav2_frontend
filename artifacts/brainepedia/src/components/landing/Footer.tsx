import { Link } from "wouter";
import logo from "@assets/branepedia_white_logo_(1)_1777483519569.png";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Brainepedia" className="h-10 w-auto opacity-90" />
              <span className="font-bold text-2xl tracking-tight text-foreground">Brainepedia</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              The AI-driven career RPG. Earn Verified Experience (VX) by solving real-world missions. Stop learning, start proving.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/problem" className="hover:text-primary transition-colors">The Problem</Link></li>
              <li><Link href="/solution" className="hover:text-primary transition-colors">The System</Link></li>
              <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
              <li><a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
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
          <div className="flex flex-col sm:flex-row items-center gap-1.5 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Brainepedia. All rights reserved.</p>
            <span className="hidden sm:inline opacity-40">·</span>
            <p>
              A product of{" "}
              <a
                href="https://infobrainltd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Infobrainltd.com
              </a>
            </p>
          </div>
          <div className="font-mono text-xs opacity-50">
            SYSTEM.STATUS: ONLINE
          </div>
        </div>
      </div>
    </footer>
  );
}
