export function CopyrightBar({ className = "" }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <div
      className={`w-full text-center text-[10px] font-mono text-white/20 py-3 px-4 select-none ${className}`}
    >
      © {year} Brainepedia. A product of{" "}
      <a
        href="https://infobrainltd.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/30 hover:text-white/50 underline underline-offset-2 transition-colors"
      >
        Infobrainltd.com
      </a>
      . All rights reserved.
    </div>
  );
}
