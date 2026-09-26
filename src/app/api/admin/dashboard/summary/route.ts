import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

const ADMIN_API_KEY = process.env.BREAKOUT_ADMIN_API_KEY || "RAHASIA_SUPER_KUAT";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${ADMIN_API_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized. API Key salah atau tidak ada." },
        { status: 401 }
      );
    }

    const totalArtists = await prisma.artist.count();

    const totalReleases = await prisma.release.count();

    return NextResponse.json({
      status: "success",
      data: {
        total_artists: totalArtists,
        total_releases: totalReleases,
        status_server: "Aman Terkendali",
        royalti_bulan_ini: "Rp 50.000.000 (Dummy)"
      }
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal di server Web Breakout." },
      { status: 500 }
    );
  }
}

