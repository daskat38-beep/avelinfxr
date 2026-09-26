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

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 10;

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Parameter days harus berupa integer antara 1 dan 365." },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Cari artist yang usernya tidak memiliki activity log di atas cutoffDate
    // dan usia akunnya sudah lebih dari cutoffDate.
    const inactiveArtistsData = await prisma.artist.findMany({
      where: {
        user: {
          activityLogs: {
            none: {
              createdAt: {
                gte: cutoffDate
              }
            }
          },
          createdAt: {
            lte: cutoffDate
          }
        }
      },
      include: {
        user: {
          include: {
            activityLogs: {
              orderBy: { createdAt: "desc" },
              take: 1
            }
          }
        }
      }
    });

    const now = new Date();

    const formattedData = inactiveArtistsData.map((artist) => {
      const latestLog = artist.user.activityLogs[0];
      
      if (latestLog) {
        const lastActivityAt = latestLog.createdAt;
        const diffTime = Math.abs(now.getTime() - lastActivityAt.getTime());
        const daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          artist_id: artist.id,
          artist_name: artist.stageName,
          last_activity_at: lastActivityAt.toISOString(),
          days_inactive: daysInactive,
          activity_status: "inactive"
        };
      } else {
        const diffTime = Math.abs(now.getTime() - artist.user.createdAt.getTime());
        const daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          artist_id: artist.id,
          artist_name: artist.stageName,
          last_activity_at: null,
          days_inactive: daysInactive,
          activity_status: "never_active"
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error("Inactive Artists API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat mengambil data artis tidak aktif." },
      { status: 500 }
    );
  }
}
