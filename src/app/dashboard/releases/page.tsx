import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Disc, Plus } from "lucide-react";
import Link from "next/link";
import UserReleasesClient from "./UserReleasesClient";

export const dynamic = "force-dynamic";

export default async function MyReleasesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="p-10 text-center">
        <h2>Harap login terlebih dahulu</h2>
      </div>
    );
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artists: {
        include: {
          releases: {
            orderBy: { createdAt: "desc" },
            include: { tracks: true, artist: true }
          }
        }
      }
    }
  });

  const rawReleases = (user?.artists?.flatMap(a => a.releases || []) || []).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const releases = rawReleases.map((r) => ({
    id: r.id,
    title: r.title,
    genre: r.genre,
    type: r.type,
    status: r.status,
    coverArtworkUrl: r.coverArtworkUrl,
    releaseDate: r.releaseDate instanceof Date ? r.releaseDate.toISOString() : String(r.releaseDate),
    upc: r.upc || null,
    tracks: (r.tracks || []).map((t) => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audioUrl,
      isrc: t.isrc || null,
      composer: t.composer || null,
      producer: t.producer || null,
      lyrics: t.lyrics || null,
      featuredArtist: t.featuredArtist || null,
    })),
    artist: r.artist ? { name: r.artist.stageName } : null,
  }));

  const artistName = user?.artists?.[0]?.stageName || user?.name || "Artist";

  return (
    <div className="animate-fade-in w-full pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">My Releases</h1>
          <p className="text-gray-500 text-sm font-medium">{releases.length} releases found</p>
        </div>
        <Link href="/dashboard/upload" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold shadow-md shadow-red-500/20 transition flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> New Release
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <Disc className="w-16 h-16 text-gray-300 mb-5" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Rilis Musik</h2>
          <p className="text-gray-500 mb-8 max-w-md">Anda belum mengunggah lagu. Mulai rilis karya musik pertama Anda sekarang.</p>
          <Link href="/dashboard/upload" className="px-8 py-3.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition">
            Upload Musik
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <UserReleasesClient releases={releases} artistName={artistName} />
        </div>
      )}
    </div>
  );
}