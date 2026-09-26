import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ADMIN_API_KEY = process.env.BREAKOUT_ADMIN_API_KEY || "RAHASIA_SUPER_KUAT";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${ADMIN_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "royalties") {
      const royalties = await prisma.royalty.findMany({
        include: { artist: true }
      });
      
      const artistMap: Record<string, { stageName: string, totalRevenue: number }> = {};
      let total_royalty = 0;
      
      royalties.forEach(r => {
        if (!artistMap[r.artistId]) {
          artistMap[r.artistId] = { stageName: r.artist.stageName, totalRevenue: 0 };
        }
        artistMap[r.artistId].totalRevenue += r.totalRevenue;
        total_royalty += r.totalRevenue;
      });

      const ranking = Object.values(artistMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

      return NextResponse.json({
        total_royalty,
        ranking
      });
    }

    if (action === "payments") {
      const allPayments = await prisma.withdrawRequest.findMany({
        include: { user: { include: { artists: true } } }
      });

      const totalPaid = allPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
      const totalPending = allPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

      const payments = allPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        name: p.user.artists.length > 0 ? p.user.artists[0].stageName : (p.user.name || p.user.email)
      }));
      
      const sortedPayments = [...payments].sort((a, b) => b.amount - a.amount);

      return NextResponse.json({
        total_paid: totalPaid,
        total_pending: totalPending,
        payments: sortedPayments
      });
    }

    if (action === "performance") {
      const royalties = await prisma.royalty.findMany({
        include: { artist: true }
      });

      const streamMap: Record<string, { stageName: string, totalStreams: number }> = {};
      
      royalties.forEach(r => {
        if (!streamMap[r.artistId]) {
          streamMap[r.artistId] = { stageName: r.artist.stageName, totalStreams: 0 };
        }
        let rowStreams = r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
        if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
            const pd = r.platformData as Record<string, number>;
            rowStreams = Object.values(pd).reduce((a, b) => a + b, 0);
        }
        streamMap[r.artistId].totalStreams += rowStreams;
      });

      const ranking = Object.values(streamMap).sort((a, b) => b.totalStreams - a.totalStreams);

      return NextResponse.json({
        ranking: ranking
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
