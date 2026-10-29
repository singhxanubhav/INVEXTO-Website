import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession(request);
    if (!(user as any).isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "participants";
    let tournamentId = url.searchParams.get("tournamentId");

    if (!tournamentId) {
      const activeTournament = await prisma.tournament.findFirst({
        where: { status: "active" },
        orderBy: { startDate: "desc" },
      });
      if (activeTournament) tournamentId = activeTournament.id;
    }

    let csvRows: string[] = [];
    let filename = `invexto-export-${Date.now()}.csv`;

    if (type === "winners" && tournamentId) {
      const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        include: {
          user: { select: { name: true, email: true, upiId: true } },
        },
        orderBy: [{ finalRank: "asc" }, { finalValue: "desc" }],
      });

      filename = `tournament-winners-${tournamentId.slice(0, 8)}.csv`;
      csvRows.push("Rank,Name,Email,Phone,UPI ID,Final Portfolio Value,Prize Amount");

      for (let i = 0; i < registrations.length; i++) {
        const r = registrations[i];
        const rank = r.finalRank ?? (i + 1);
        const name = `"${(r.user.name || "").replace(/"/g, '""')}"`;
        const email = `"${(r.user.email || "").replace(/"/g, '""')}"`;
        const phone = `"${(r.phone || "").replace(/"/g, '""')}"`;
        const upi = `"${(r.user.upiId || "").replace(/"/g, '""')}"`;
        const finalValue = r.finalValue ? Number(r.finalValue).toFixed(2) : "100000.00";
        const prize = r.prizeAmount ? Number(r.prizeAmount).toFixed(2) : "0.00";

        csvRows.push(`${rank},${name},${email},${phone},${upi},${finalValue},${prize}`);
      }
    } else if (type === "participants" && tournamentId) {
      const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              upiId: true,
              portfolios: {
                where: { tournamentId },
                include: { _count: { select: { transactions: true, holdings: true } } },
              },
            },
          },
        },
        orderBy: { registeredAt: "asc" },
      });

      filename = `tournament-participants-${tournamentId.slice(0, 8)}.csv`;
      csvRows.push("Name,Email,Phone,UPI ID,Registered Date,Cash Balance,Total Trades,Holdings Count");

      for (const r of registrations) {
        const name = `"${(r.user.name || "").replace(/"/g, '""')}"`;
        const email = `"${(r.user.email || "").replace(/"/g, '""')}"`;
        const phone = `"${(r.phone || "").replace(/"/g, '""')}"`;
        const upi = `"${(r.user.upiId || "").replace(/"/g, '""')}"`;
        const regDate = `"${new Date(r.registeredAt).toISOString().split("T")[0]}"`;
        const p = r.user.portfolios[0];
        const cash = p ? Number(p.cashBalance).toFixed(2) : "100000.00";
        const trades = p?._count?.transactions || 0;
        const holdings = p?._count?.holdings || 0;

        csvRows.push(`${name},${email},${phone},${upi},${regDate},${cash},${trades},${holdings}`);
      }
    } else {
      // Export all users
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          portfolios: {
            where: { inTournament: true },
            include: { _count: { select: { transactions: true, holdings: true } } },
          },
        },
      });

      filename = `all-users-${Date.now()}.csv`;
      csvRows.push("Name,Email,UPI ID,Admin,Joined Date,Cash Balance,Total Trades,Holdings Count");

      for (const u of users) {
        const name = `"${(u.name || "").replace(/"/g, '""')}"`;
        const email = `"${(u.email || "").replace(/"/g, '""')}"`;
        const upi = `"${(u.upiId || "").replace(/"/g, '""')}"`;
        const admin = u.isAdmin ? "Yes" : "No";
        const joined = `"${new Date(u.createdAt).toISOString().split("T")[0]}"`;
        const p = u.portfolios[0];
        const cash = p ? Number(p.cashBalance).toFixed(2) : "100000.00";
        const trades = p?._count?.transactions || 0;
        const holdings = p?._count?.holdings || 0;

        csvRows.push(`${name},${email},${upi},${admin},${joined},${cash},${trades},${holdings}`);
      }
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    console.error("[Export CSV Error]", err);
    return NextResponse.json({ success: false, error: "Failed to generate CSV export" }, { status: 500 });
  }
}
