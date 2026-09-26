import { prisma } from "@/lib/prisma";
import ReviewList from "./ReviewList";

export const dynamic = "force-dynamic";

export default async function AdminReleasesPage() {
  const pendingReleases = await prisma.release.findMany({
    where: { status: "PENDING", isImported: false },
    include: { 
      artist: { include: { user: true } }, 
      tracks: true 
    },
    orderBy: { createdAt: "asc" }
  });

  const serializedReleases = pendingReleases.map((release) => {
    const releaseDateStr = release.releaseDate instanceof Date && !isNaN(release.releaseDate.getTime())
      ? release.releaseDate.toISOString()
      : new Date().toISOString();

    return {
      id: release.id,
      title: release.title,
      genre: release.genre || "Pop",
      type: release.type || "SINGLE",
      status: release.status || "PENDING",
      coverArtworkUrl: release.coverArtworkUrl || "",
      releaseDate: releaseDateStr,
      featuredArtist: release.featuredArtist || null,
      upc: release.upc || null,
      distributor: release.distributor || null,
      spotifyUrl: release.spotifyUrl || null,
      appleMusicUrl: release.appleMusicUrl || null,
      youtubeMusicUrl: release.youtubeMusicUrl || null,
      tiktokUrl: release.tiktokUrl || null,
      user: {
        id: release.artist?.userId || release.id,
        name: release.artist?.user?.name || release.artist?.stageName || release.primaryArtist || "Artist",
        email: release.artist?.user?.email || null,
        artist: {
          name: release.artist?.stageName || release.primaryArtist || "Artist"
        }
      },
      tracks: (release.tracks || []).map((t) => ({
        id: t.id,
        title: t.title,
        audioUrl: t.audioUrl,
        composer: t.composer || null,
        producer: t.producer || null,
        lyrics: t.lyrics || null,
        isrc: t.isrc || null,
        upc: t.upc || null,
        tiktokClipStart: t.tiktokClipStart || null,
        featuredArtist: t.featuredArtist || null,
      }))
    };
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Music Review</h1>
        <p className="text-gray-500 text-sm">Tinjau rilisan musik baru dari artis sebelum dipublikasikan ke publik.</p>
        <div className="mt-4 bg-yellow-50 text-yellow-700 px-4 py-2.5 rounded-2xl text-xs font-semibold w-max border border-yellow-100">
          {pendingReleases.length} rilisan menunggu persetujuan
        </div>
      </div>

      {pendingReleases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 shadow-sm font-semibold">
          Tidak ada rilisan baru yang perlu ditinjau.
        </div>
      ) : (
        <ReviewList initialReleases={serializedReleases} />
      )}
    </div>
  );
}
