export const dynamic = 'force-dynamic';
import { Shield, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/src/lib/auth";
import { redirect } from "next/navigation";

async function checkAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("invexto_token")?.value;
  if (!token) redirect("/");
  const payload = verifyToken(token);
  if (!payload?.isAdmin) redirect("/");
}

export default async function AdminDashboard() {
  await checkAdmin();

  const totalUsers = await prisma.user.count();
  const activeParticipants = await prisma.tournamentRegistration.count({
    where: { tournament: { status: "active" } },
  });
  const activeTournament = await prisma.tournament.findFirst({
    where: { status: "active" },
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage users and tournaments
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="rounded-xl border border-amber-800/30 bg-amber-900/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Tournament Participants</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{activeParticipants}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-400" />
            </div>
            {activeTournament && (
              <p className="mt-2 text-xs text-muted-foreground">
                Ongoing: {activeTournament.startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} —{" "}
                {activeTournament.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/users"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Users
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View all registered users, their portfolios, and tournament history
            </p>
          </Link>
          <Link
            href="/admin/tournament"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Tournament
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage tournaments, view registrations, process prize payouts
            </p>
          </Link>
          <Link
            href="/admin/analytics"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor website traffic, visitors, top countries, and platform usage
            </p>
          </Link>
          <Link
            href="/admin/settings"
            className="group rounded-xl border border-emerald-800/30 bg-emerald-900/20 p-5 transition-all hover:border-emerald-700/50 hover:bg-emerald-900/40"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors">
              Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage global authentication settings and Super Admin roles
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
