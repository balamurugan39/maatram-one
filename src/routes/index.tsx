import type React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/portal/Logo";
import heroImg from "@/assets/hero-students.jpg";
import {
  ArrowRight, BookOpen, Briefcase, GraduationCap, HandHeart, Network, ShieldCheck, Users, FileCheck2, PhoneCall, Home, MessagesSquare, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAATRAM ONE — Student & Office Portal | Maatram Foundation" },
      { name: "description", content: "Apply to Maatram Foundation, track your admission, academics, skills and placements — and let the Maatram office manage it all in one place." },
      { property: "og:title", content: "MAATRAM ONE — Student & Office Portal" },
      { property: "og:description", content: "One connected platform for Maatram Foundation students and the Maatram office." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MODULES = [
  { icon: <GraduationCap />, title: "Admissions", text: "Apply, upload certificates and track every verification step." },
  { icon: <Users />, title: "Mentorship", text: "Your Anchors, Zone Coordinator and Mentor — meetings, messages, queries." },
  { icon: <BookOpen />, title: "Academics", text: "Semesters, results, attendance, learning and Maatram programmes." },
  { icon: <Briefcase />, title: "Skills & Placement", text: "Skill passport, career profile, assessments and job openings." },
  { icon: <HandHeart />, title: "Volunteering", text: "Give back through school visits, KK tutoring and outreach." },
  { icon: <Network />, title: "Sangamam Alumni", text: "Alumni directory, referrals and the annual Sangamam meet." },
];

const STEPS = [
  { icon: <FileCheck2 />, t: "Apply & upload" },
  { icon: <ShieldCheck />, t: "Document review" },
  { icon: <PhoneCall />, t: "Tele-verification" },
  { icon: <Home />, t: "Home visit" },
  { icon: <MessagesSquare />, t: "Interviews" },
  { icon: <Trophy />, t: "Selection" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Logo light />
          <div className="flex gap-2">
            <Button asChild variant="glass" size="sm"><Link to="/login/admin">Office login</Link></Button>
            <Button asChild variant="marigold" size="sm"><Link to="/login/student">Student login</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 kolam-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-28 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-36">
          <div className="fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground">
              <span className="size-1.5 rounded-full bg-accent" /> Admissions open for 2026
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] text-primary-foreground md:text-6xl">
              One platform for every <em className="not-italic text-accent">Maatram</em> journey.
            </h1>
            <p className="mt-5 max-w-xl text-base text-primary-foreground/80 md:text-lg">
              From your first application to college, careers and alumni life — students and the Maatram office stay connected in MAATRAM ONE.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="marigold" size="lg">
                <Link to="/login/student" search={{ mode: "register" }}>Apply for admission <ArrowRight /></Link>
              </Button>
              <Button asChild variant="glass" size="lg"><Link to="/login/student">I already have an account</Link></Button>
            </div>
          </div>
          <div className="relative fade-up [animation-delay:120ms]">
            <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-marigold opacity-80" aria-hidden="true" />
            <img src={heroImg} alt="Maatram students walking together on a college campus" className="relative aspect-[4/3] w-full rounded-[1.75rem] object-cover shadow-lift" width={1536} height={1024} />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 grid max-w-5xl gap-5 px-5 md:grid-cols-2 md:px-8">
        <PortalCard
          to="/login/student"
          eyebrow="For students"
          title="Student Portal"
          text="Register, fill your application, upload certificates and follow your progress — then manage academics, skills and more once selected."
          cta="Student login"
          variant="marigold"
          icon={<GraduationCap />}
        />
        <PortalCard
          to="/login/admin"
          eyebrow="For Maatram office"
          title="Office Portal"
          text="Review applications, verify documents, assign PV volunteers, run interviews, record decisions and manage every module."
          cta="Admin login"
          variant="hero"
          icon={<ShieldCheck />}
        />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">Admission journey</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Every step, visible to you.</h2>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-xl border bg-card p-4 shadow-soft">
              <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
              <span className="mt-3 block text-primary [&_svg]:size-6">{s.icon}</span>
              <p className="mt-2 font-semibold">{s.t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y bg-secondary/50">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">Six modules, one identity</p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Built around the whole student life.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div key={m.title} className="group rounded-xl border bg-card p-6 shadow-soft transition-transform hover:-translate-y-1">
                <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground [&_svg]:size-5 group-hover:bg-marigold group-hover:text-accent-foreground">{m.icon}</span>
                <h3 className="mt-4 text-xl font-semibold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground md:flex-row md:px-8">
        <Logo />
        <p>© {new Date().getFullYear()} Maatram Foundation. Education that changes families.</p>
      </footer>
    </div>
  );
}

function PortalCard({ to, eyebrow, title, text, cta, variant, icon }: { to: "/login/student" | "/login/admin"; eyebrow: string; title: string; text: string; cta: string; variant: "marigold" | "hero"; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <span className="text-primary [&_svg]:size-6">{icon}</span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button asChild variant={variant} className="mt-5 w-full"><Link to={to}>{cta} <ArrowRight /></Link></Button>
    </div>
  );
}
