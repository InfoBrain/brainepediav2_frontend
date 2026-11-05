import { Link } from "wouter";
import darkLogo from "@assets/branepedia_mark_white.png";

export function Footer() {
  return (
    <footer className="bg-[#1d2032] pt-12 pb-8 text-[#c8cbd5]">
      <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] gap-8 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <img src={darkLogo} alt="" className="h-10 w-auto shrink-0 object-contain" />
            <span className="text-lg font-extrabold text-white">Brainepedia</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-[#9fa4b3]">Don’t just learn. Prove your competence.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <strong className="mb-1 text-white">Platform</strong>
          <a href="/#how-it-works" className="w-fit text-[#aeb3c1] hover:text-white">How It Works</a>
          <a href="/#professionals" className="w-fit text-[#aeb3c1] hover:text-white">For Professionals</a>
          <a href="/#employers" className="w-fit text-[#aeb3c1] hover:text-white">For Employers</a>
          <a href="/#jobs-preview" className="w-fit text-[#aeb3c1] hover:text-white">Explore Jobs</a>
          <Link href="/problem" className="w-fit text-[#aeb3c1] hover:text-white">The Problem</Link>
          <Link href="/solution" className="w-fit text-[#aeb3c1] hover:text-white">The Solution</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <strong className="mb-1 text-white">Company</strong>
          <a href="/#community" className="w-fit text-[#aeb3c1] hover:text-white">Community</a>
          <Link href="/forum" className="w-fit text-[#aeb3c1] hover:text-white">Forum</Link>
          <Link href="/feed" className="w-fit text-[#aeb3c1] hover:text-white">Feed</Link>
          <a href="/#faq" className="w-fit text-[#aeb3c1] hover:text-white">Help & Support</a>
          <a href="/#pricing" className="w-fit text-[#aeb3c1] hover:text-white">Pricing</a>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <strong className="mb-1 text-white">Get started</strong>
          <Link href="/auth/login" className="w-fit text-[#aeb3c1] hover:text-white">Log In</Link>
          <Link href="/auth/register" className="w-fit text-[#aeb3c1] hover:text-white">Create Account</Link>
          <Link href="/privacy" className="w-fit text-[#aeb3c1] hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="w-fit text-[#aeb3c1] hover:text-white">Terms & Conditions</Link>
        </div>
      </div>
      <div className="mx-auto mt-8 flex w-[min(1180px,calc(100%-48px))] flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#858b9b] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Brainepedia. All rights reserved.</p>
        <p>
          A product of{" "}
          <a href="https://infobrainltd.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
            Infobrainltd.com
          </a>
        </p>
      </div>
    </footer>
  );
}
