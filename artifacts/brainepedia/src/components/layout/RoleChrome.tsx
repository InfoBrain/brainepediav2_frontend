import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ADMIN_NAV } from "@/lib/adminNav";
import { getUserRole } from "@/lib/auth";
import { EMPLOYER_NAV } from "@/lib/employerNav";
import { USER_NAV } from "@/lib/userNav";

export function RoleChrome({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const role = getUserRole();
  if (!role) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main id="main-content" className="container mx-auto px-4 pb-16 pt-24" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  const nav = role === "Employer" ? EMPLOYER_NAV : role === "GlobalAdmin" ? ADMIN_NAV : USER_NAV;
  const theme = role === "Employer" ? "employer" : role === "GlobalAdmin" ? "admin" : "user";
  return (
    <DashboardShell nav={nav} title={title} subtitle={subtitle} theme={theme}>
      {children}
    </DashboardShell>
  );
}
