import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/portal/Logo";
import heroImg from "@/assets/hero-students.jpg";
import { ArrowLeft } from "lucide-react";

export function AuthLayout({ children, side }: { children: ReactNode; side: { eyebrow: string; title: string; text: string; dark?: boolean } }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-hero lg:block">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
        <div className="absolute inset-0 kolam-pattern opacity-30" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/"><Logo light /></Link>
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{side.eyebrow}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-primary-foreground">{side.title}</h2>
            <p className="mt-3 text-primary-foreground/75">{side.text}</p>
          </div>
          <p className="text-xs text-primary-foreground/50">© Maatram Foundation</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <span className="lg:hidden"><Logo /></span>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <div className="w-full max-w-md fade-up">{children}</div>
        </div>
      </div>
    </div>
  );
}
