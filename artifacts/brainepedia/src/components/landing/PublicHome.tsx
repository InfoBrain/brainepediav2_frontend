import { Link } from "wouter";
import {
  ArrowRight,
  Award,
  Bot,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleUserRound,
  ClipboardCheck,
  FileText,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  UserSearch,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const portrait =
  "https://images.unsplash.com/photo-1758876202610-bae5608f5051?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=240&h=240";

const previewJobs = [
  {
    title: "Senior Frontend Engineer",
    company: "TechNova Solutions",
    location: "Lagos, Nigeria",
    workplace: "Hybrid",
    type: "Full-time",
    score: 88,
    skills: ["React", "TypeScript", "APIs"],
  },
  {
    title: "Product Designer",
    company: "Flutterwave",
    location: "Lagos, Nigeria",
    workplace: "Hybrid",
    type: "Full-time",
    score: 94,
    skills: ["Figma", "UX Research", "Design Systems"],
  },
  {
    title: "Backend Developer",
    company: "TechNova Solutions",
    location: "Remote",
    workplace: "Remote",
    type: "Full-time",
    score: 82,
    skills: ["Node.js", "PostgreSQL", "AWS"],
  },
];

const features: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { icon: Sparkles, title: "AI Career Guidance", text: "Get focused guidance grounded in your professional profile.", tone: "bg-[#f5f0fc] text-[#7d4ccc]" },
  { icon: Target, title: "Practical Missions", text: "Demonstrate competence through realistic challenges.", tone: "bg-[#edf4ff] text-[#276ef1]" },
  { icon: ShieldCheck, title: "Verified Experience", text: "Build an independently evaluated record of practical work.", tone: "bg-[#eaf8f3] text-[#168a68]" },
  { icon: BriefcaseBusiness, title: "Job Discovery", text: "Find internal and external opportunities in one place.", tone: "bg-[#fff6e5] text-[#d88c1b]" },
  { icon: WandSparkles, title: "Job Compatibility", text: "Understand matching strengths and development areas.", tone: "bg-[#f5f0fc] text-[#7d4ccc]" },
  { icon: FileText, title: "Smart CV", text: "Turn verified work into a clear professional story.", tone: "bg-[#edf4ff] text-[#276ef1]" },
  { icon: CircleUserRound, title: "Professional Profiles", text: "Showcase achievements without exposing private submissions.", tone: "bg-[#eaf8f3] text-[#168a68]" },
  { icon: UserSearch, title: "Talent Discovery", text: "Search professionals by skills, VX, and achievements.", tone: "bg-[#fff6e5] text-[#d88c1b]" },
  { icon: MessagesSquare, title: "Feed & Community", text: "Learn, share progress, and join professional discussions.", tone: "bg-[#f5f0fc] text-[#7d4ccc]" },
];

export function PublicHome() {
  return (
    <div className="bg-white text-[#182137]">
      <section className="mx-auto grid w-[min(1180px,calc(100%-48px))] items-center gap-10 pb-14 pt-28 lg:min-h-[570px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-16">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered professional ecosystem
          </p>
          <h1 className="mx-auto mt-3 max-w-[610px] text-[clamp(40px,5vw,66px)] font-extrabold leading-[1.03] tracking-[-0.055em] lg:mx-0">
            Your Skills. Your Opportunities. <span className="text-[#7d4ccc]">Your Next Move.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[590px] text-[15px] leading-7 text-[#70798d] lg:mx-0">
            Discover opportunities, demonstrate your competence, build verified experience, and connect with employers.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row lg:justify-start">
            <Link href="/auth/register" className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-extrabold text-white shadow-[0_6px_17px_rgba(125,76,204,0.2)] hover:bg-[#6538ad]">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#jobs-preview" className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] border border-[#e6e8ef] bg-white px-4 text-sm font-extrabold text-[#3f485d] hover:border-[#c9b5e5] hover:bg-[#fcfaff] hover:text-[#7d4ccc]">
              Explore Opportunities
            </a>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-4 text-xs font-bold text-[#687185] lg:justify-start">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#7d4ccc]" /> Verified Experience</span>
            <span className="inline-flex items-center gap-1.5"><Target className="h-4 w-4 text-[#7d4ccc]" /> Practical Missions</span>
            <span className="inline-flex items-center gap-1.5"><WandSparkles className="h-4 w-4 text-[#7d4ccc]" /> AI Career Guidance</span>
          </div>
        </div>

        <div className="relative mx-auto grid min-h-[400px] w-full max-w-[560px] place-items-center">
          <div className="absolute h-[430px] w-[430px] max-w-full rounded-full bg-[radial-gradient(circle,#eee5fa_0,#f4f6ff_47%,transparent_69%)]" />
          <div className="relative z-[1] w-full max-w-[470px] rounded-[19px] border border-[#dcdfea] bg-white p-3 pb-16 shadow-[0_28px_70px_rgba(39,42,69,0.15)] lg:rotate-[1.5deg]">
            <div className="flex h-7 items-center gap-1.5 border-b border-[#e6e8ef] text-[11px] text-[#9aa1b0]">
              <i className="h-1.5 w-1.5 rounded-full bg-[#e0d7ed]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#e0d7ed]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#e0d7ed]" />
              <span className="ml-auto">brainepedia.com/dashboard</span>
            </div>
            <div className="flex items-center gap-3 px-1 py-4">
              <img src={portrait} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold text-[#7d4ccc]">PROFESSIONAL PROFILE</p>
                <p className="text-sm font-extrabold">Amara Okafor</p>
                <p className="text-xs text-[#70798d]">Product Designer · 340 VX</p>
              </div>
              <span className="rounded-md bg-[#eaf8f3] px-2 py-1 text-[11px] font-extrabold text-[#168a68]">94% role match</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 rounded-[11px] border border-[#e6e8ef] bg-[#faf9fc] p-3 text-[#7d4ccc]">
                <ShieldCheck className="row-span-2 h-4 w-4" />
                <strong className="text-xs text-[#182137]">Verified Experience</strong>
                <small className="text-[11px] text-[#70798d]">3 completed missions</small>
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 rounded-[11px] border border-[#e6e8ef] bg-[#faf9fc] p-3 text-[#7d4ccc]">
                <Trophy className="row-span-2 h-4 w-4" />
                <strong className="text-xs text-[#182137]">8 Achievements</strong>
                <small className="text-[11px] text-[#70798d]">Publicly showcased</small>
              </div>
            </div>
            <div className="mx-auto my-2 h-6 w-px bg-[#d5c4eb]" />
            <div className="flex items-center gap-2 rounded-[11px] border border-[#d9e3f6] bg-[#f7faff] p-3 text-[#276ef1]">
              <Building2 className="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold">EMPLOYER DISCOVERY</p>
                <p className="text-xs font-extrabold text-[#182137]">TechNova found a strong match</p>
              </div>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          <Link href="/auth/register" className="absolute bottom-3 right-3 z-[2] flex w-[min(300px,88%)] items-center gap-3 rounded-[13px] border border-[#d7c8ed] bg-white p-3 text-left shadow-[0_12px_35px_rgba(28,33,54,0.08)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#7d4ccc] text-white"><Bot className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <small className="block text-[11px] font-extrabold text-[#7d4ccc]">MEET BRAINIAC AI</small>
              <strong className="text-sm">Your career and competence assistant</strong>
            </span>
            <ArrowRight className="h-4 w-4 text-[#9aa1b0]" />
          </Link>
        </div>
      </section>

      <section id="professionals" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="mx-auto mb-8 max-w-[700px] text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">One ecosystem, two powerful journeys</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,39px)] font-extrabold leading-tight tracking-[-0.04em]">Where proven talent meets better opportunity.</h2>
            <p className="mt-2 text-sm leading-6 text-[#70798d]">Build a career based on demonstrated competence—or discover the people who have it.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-[20px] border border-[#e0d5f0] bg-[linear-gradient(135deg,#fff,#fbf8fe)] p-7">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[#f5f0fc] text-[#7d4ccc]"><CircleUserRound className="h-6 w-6" /></span>
                <div>
                  <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7d4ccc]">FOR PROFESSIONALS</p>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight">Build Your Career. Prove Your Competence.</h3>
                  <p className="mt-2 text-sm leading-6 text-[#70798d]">Move beyond traditional CVs. Complete practical missions, earn VX, and showcase what you can actually do.</p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2 border-t border-[#e6e8ef] pt-4 sm:grid-cols-2">
                {["Discover relevant jobs", "Complete real-world missions", "Build Verified Experience", "Generate Smart CVs", "Get AI compatibility insights"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#586175]"><Check className="h-4 w-4 text-[#168a68]" />{item}</li>
                ))}
              </ul>
              <Link href="/auth/register" className="mt-5 inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-extrabold text-white">
                Join as a Professional <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
            <article id="employers" className="scroll-mt-24 relative overflow-hidden rounded-[20px] border border-[#d9e4f6] bg-[linear-gradient(135deg,#fff,#f7faff)] p-7">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[#edf4ff] text-[#276ef1]"><Building2 className="h-6 w-6" /></span>
                <div>
                  <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#276ef1]">FOR EMPLOYERS</p>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight">Find Talent Beyond the CV.</h3>
                  <p className="mt-2 text-sm leading-6 text-[#70798d]">Discover skilled professionals, evaluate demonstrated competence, and manage recruitment with more context.</p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2 border-t border-[#e6e8ef] pt-4 sm:grid-cols-2">
                {["Publish job opportunities", "Discover qualified professionals", "Review verified achievements", "Evaluate compatibility insights", "Manage applications"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#586175]"><Check className="h-4 w-4 text-[#168a68]" />{item}</li>
                ))}
              </ul>
              <Link href="/auth/register?role=employer" className="mt-5 inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-extrabold text-white">
                Join as an Employer <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-[#f7f8fb] py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="mx-auto mb-8 max-w-[700px] text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">How Brainepedia works</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,39px)] font-extrabold tracking-[-0.04em]">From potential to proven progress.</h2>
          </div>
          <div className="grid gap-8">
            <Journey label="For Professionals" tone="text-[#7d4ccc]" icon={CircleUserRound} steps={[
              ["01", "Create your profile", "Document your skills, interests, and experience."],
              ["02", "Complete missions", "Demonstrate competence through practical work."],
              ["03", "Get discovered", "Find roles and let employers see your proof."],
            ]} />
            <Journey label="For Employers" tone="text-[#276ef1]" icon={Building2} steps={[
              ["01", "Create your company", "Build a trusted employer presence."],
              ["02", "Post or discover", "Publish roles or search proven professionals."],
              ["03", "Recruit with context", "Evaluate evidence and manage candidates."],
            ]} />
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="mb-7 max-w-[700px]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">Built for real career movement</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,39px)] font-extrabold tracking-[-0.04em]">Everything you need to prove, discover, and decide.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, tone }) => (
              <article key={title} className="rounded-[14px] border border-[#e6e8ef] bg-white p-5">
                <span className={`grid h-10 w-10 place-items-center rounded-[11px] ${tone}`}><Icon className="h-5 w-5" /></span>
                <strong className="mt-3 block text-sm">{title}</strong>
                <p className="mt-1 text-sm leading-6 text-[#70798d]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-6">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] items-center gap-10 rounded-[25px] bg-[radial-gradient(circle_at_5%_10%,#7048b4,transparent_40%),#232642] px-6 py-12 text-white lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-14">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#ddd0f5]"><Sparkles className="h-3.5 w-3.5" /> Brainiac AI</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,35px)] font-extrabold leading-tight tracking-[-0.04em]">Your AI-Powered Career and Competence Assistant.</h2>
            <p className="mt-3 text-sm leading-7 text-[#cccbd9]">Use Brainiac to understand job compatibility, plan career growth, get mission guidance, generate a Smart CV, and explore your documented experience through your Virtual Self.</p>
            <div className="my-4 flex flex-wrap gap-3 text-xs text-[#deddea]">
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#8ee0bd]" /> Career guidance</span>
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#8ee0bd]" /> Mission support</span>
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#8ee0bd]" /> Candidate insights</span>
            </div>
            <Link href="/auth/register" className="inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] bg-white px-4 text-sm font-extrabold text-[#7d4ccc]">
              Get Started with Brainepedia <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[17px] border border-white/20 bg-white p-4 text-[#182137] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3 border-b border-[#e6e8ef] pb-3">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#7d4ccc] text-white"><Bot className="h-4 w-4" /></span>
              <div className="flex-1">
                <strong className="block text-sm">Brainiac AI</strong>
                <small className="text-xs text-[#70798d]">Professional intelligence assistant</small>
              </div>
              <i className="h-2 w-2 rounded-full bg-[#51c99a]" />
            </div>
            <p className="ml-auto mt-3 max-w-[85%] rounded-[11px] bg-[#7d4ccc] px-3 py-2.5 text-sm leading-6 text-white">Which jobs best match my verified experience?</p>
            <p className="mt-3 flex max-w-[85%] gap-2 rounded-[11px] bg-[#f3eff9] px-3 py-2.5 text-sm leading-6 text-[#60687a]">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#7d4ccc]" />
              <span>Your Product Design evidence is strongest in research and prototyping. I found <strong className="text-[#182137]">3 roles above 88% compatibility</strong>.</span>
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[#e6e8ef] p-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d4ccc,#4974dc)] text-sm font-extrabold text-white">F</span>
              <div className="flex-1">
                <strong className="block text-sm">Product Designer</strong>
                <small className="text-xs font-bold text-[#168a68]">Flutterwave · 94% match</small>
              </div>
              <ArrowRight className="h-4 w-4 text-[#9aa1b0]" />
            </div>
          </div>
        </div>
      </section>

      <section id="jobs-preview" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">Open opportunities</p>
              <h2 className="mt-2 text-[clamp(28px,3vw,39px)] font-extrabold tracking-[-0.04em]">Roles that value what you can prove.</h2>
            </div>
            <Link href="/jobs" className="inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] border border-[#e6e8ef] bg-white px-4 text-sm font-extrabold text-[#3f485d] hover:text-[#7d4ccc]">
              Explore All Jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {previewJobs.map((job) => (
              <article key={job.title} className="rounded-2xl border border-[#e6e8ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,30,48,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d4ccc,#4974dc)] text-sm font-extrabold text-white">{job.company[0]}</span>
                </div>
                <h3 className="mt-4 text-base font-extrabold">{job.title}</h3>
                <p className="text-sm text-[#70798d]">{job.company}</p>
                <div className="my-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#f5f6f8] px-2 py-1 text-xs text-[#697185]"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#f5f6f8] px-2 py-1 text-xs text-[#697185]"><BriefcaseBusiness className="h-3.5 w-3.5" />{job.type}</span>
                  <span className="rounded-md bg-[#f5f6f8] px-2 py-1 text-xs text-[#697185]">{job.workplace}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span key={skill} className="rounded-md border border-[#e6e8ef] bg-[#fafbfc] px-2 py-1 text-xs text-[#626b7d]">{skill}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#e6e8ef] pt-3">
                  <span className="rounded-md bg-[#eaf8f3] px-2 py-1 text-xs font-extrabold text-[#168a68]">{job.score}% match</span>
                  <Link href="/jobs" className="inline-flex items-center gap-1 text-xs font-extrabold text-[#7d4ccc]">View details <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[19px] border border-[#ded2ee] bg-white shadow-[0_12px_35px_rgba(28,33,54,0.08)]">
            <div className="flex items-center gap-4 bg-[linear-gradient(110deg,#faf7fe,#f6f9ff)] p-6">
              <img src={portrait} alt="" className="h-20 w-20 rounded-full object-cover" />
              <div>
                <p className="inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wide text-[#168a68]"><ShieldCheck className="h-3.5 w-3.5" /> VERIFIED PROFESSIONAL</p>
                <h3 className="mt-1 text-xl font-extrabold">Amara Okafor</h3>
                <p className="text-sm text-[#70798d]">Product Designer · Lagos, Nigeria</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Figma", "UX Research", "Prototyping"].map((skill) => (
                    <span key={skill} className="rounded-md border border-[#e6e8ef] bg-[#fafbfc] px-2 py-1 text-xs text-[#626b7d]">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3">
              {[["340", "Verified Experience"], ["8", "Achievements"], ["3", "Completed Missions"]].map(([value, label], index) => (
                <span key={label} className={`flex flex-col px-4 py-4 text-xs text-[#70798d] ${index ? "border-l border-[#e6e8ef]" : ""}`}>
                  <strong className="text-lg text-[#182137]">{value}</strong>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]"><Award className="h-3.5 w-3.5" /> Proof, not promises</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,35px)] font-extrabold tracking-[-0.04em]">Make your capabilities visible.</h2>
            <p className="mt-3 text-sm leading-7 text-[#70798d]">Public achievement cards and professional profiles help people understand what you have demonstrated—without exposing private mission submissions.</p>
            <Link href="/auth/register" className="mt-4 inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] border border-[#e6e8ef] bg-white px-4 text-sm font-extrabold text-[#3f485d] hover:text-[#7d4ccc]">
              Build your professional profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] items-center gap-10 rounded-[21px] border border-[#e1d8ef] bg-[linear-gradient(115deg,#fbf8fe,#f7faff)] p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]"><Building2 className="h-3.5 w-3.5" /> Brainepedia for employers</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,35px)] font-extrabold tracking-[-0.04em]">Hire Beyond the CV. Discover Proven Competence.</h2>
            <p className="mt-3 text-sm leading-7 text-[#70798d]">Find professionals through practical experience, completed missions, verified achievements, and professional profiles.</p>
            <Link href="/auth/register?role=employer" className="mt-4 inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] bg-[#7d4ccc] px-4 text-sm font-extrabold text-white">
              Create an Employer Account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              [UserSearch, "Talent discovery"],
              [BriefcaseBusiness, "Job management"],
              [ClipboardCheck, "Application management"],
              [UserCheck, "Candidate evaluation"],
              [Sparkles, "Compatibility insights"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as LucideIcon;
              return (
                <span key={label as string} className="flex items-center gap-2 rounded-[10px] border border-[#e6e8ef] bg-white p-3 text-sm font-bold text-[#4f586d]">
                  <ItemIcon className="h-4 w-4 text-[#7d4ccc]" />
                  {label as string}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <section id="community" className="scroll-mt-24 bg-white pb-20">
        <div className="mx-auto w-[min(1180px,calc(100%-48px))]">
          <div className="mx-auto mb-7 max-w-[700px] text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7d4ccc]">Illustrative demo stories</p>
            <h2 className="mt-2 text-[clamp(28px,3vw,39px)] font-extrabold tracking-[-0.04em]">Built around clearer evidence and better conversations.</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              ["AO", "“Missions gave me a clearer way to explain how I think—not just what tools I use.”", "Amara · Product Designer"],
              ["DW", "“Verified achievements add useful context when reviewing applicants alongside their CV.”", "Daniel · Talent Lead"],
              ["CK", "“The compatibility view makes it easier to identify what I should strengthen before applying.”", "Chinedu · Frontend Engineer"],
            ].map(([initials, quote, author]) => (
              <article key={initials} className="rounded-[14px] border border-[#e6e8ef] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#7d4ccc] text-xs font-extrabold text-white">{initials}</span>
                <p className="my-3 text-sm leading-7 text-[#50596d]">{quote}</p>
                <strong className="block text-sm">{author}</strong>
                <small className="text-xs text-[#969cac]">Illustrative prototype testimonial</small>
              </article>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[#70798d]">
            Join the live community in the <Link href="/forum" className="font-extrabold text-[#7d4ccc]">forum</Link> or follow the <Link href="/feed" className="font-extrabold text-[#7d4ccc]">public feed</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}

function Journey({
  label,
  tone,
  icon: Icon,
  steps,
}: {
  label: string;
  tone: string;
  icon: LucideIcon;
  steps: string[][];
}) {
  return (
    <div>
      <p className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${tone}`}><Icon className="h-4 w-4" /> {label}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {steps.map(([n, title, text]) => (
          <article key={n} className="rounded-[14px] border border-[#e6e8ef] bg-white p-5">
            <span className={`text-xs font-extrabold ${tone}`}>{n}</span>
            <strong className="mt-3 block text-sm">{title}</strong>
            <p className="mt-1 text-sm leading-6 text-[#70798d]">{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
