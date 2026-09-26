"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  Pause, 
  Download, 
  Music, 
  Search, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
  Radio,
  Disc3,
  Calendar,
  Layers,
  Sparkles,
  Loader2
} from "lucide-react";

export interface TrackItem {
  id: string;
  title: string;
  audioUrl: string;
  isrc?: string | null;
  composer?: string | null;
  producer?: string | null;
  lyrics?: string | null;
  featuredArtist?: string | null;
}

export interface ReleaseItem {
  id: string;
  title: string;
  genre: string;
  type: string;
  status: string;
  coverArtworkUrl: string;
  releaseDate: string | Date;
  upc?: string | null;
  tracks: TrackItem[];
  artist?: {
    name: string;
  } | null;
}

const FALLBACK_VINYL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><rect width="80" height="80" rx="8" fill="%230f172a"/><circle cx="40" cy="40" r="30" fill="%231e293b" stroke="%23334155" stroke-width="2"/><circle cx="40" cy="40" r="20" fill="%230f172a"/><circle cx="40" cy="40" r="10" fill="%23e11d48"/><circle cx="40" cy="40" r="3" fill="%23ffffff"/></svg>`;

function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/")) return url;
  if (
    url.includes("breakoutmusicrecord.com") ||
    url.includes("breakoutmusic.online") ||
    url.includes("r2.cloudflarestorage.com")
  ) {
    try {
      const u = new URL(url);
      return `/api/media${u.pathname}`;
    } catch {
      return `/api/media/${url.replace(/^https?:\/\/[^\/]+\//, "")}`;
    }
  }
  return url;
}

export default function UserReleasesClient({
  releases,
  artistName,
}: {
  releases: ReleaseItem[];
  artistName?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected release for modal detail
  const [selectedRelease, setSelectedRelease] = useState<ReleaseItem | null>(null);

  // Audio player state
  const [currentTrack, setCurrentTrack] = useState<{
    track: TrackItem;
    release: ReleaseItem;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio time & state listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsBuffering(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const togglePlay = (track: TrackItem, release: ReleaseItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (currentTrack?.track.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack({ track, release });
      setIsPlaying(true);
      setIsBuffering(true);
      if (audioRef.current) {
        audioRef.current.src = resolveMediaUrl(track.audioUrl);
        audioRef.current.play().catch(() => {
          setIsBuffering(false);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.src !== FALLBACK_VINYL) {
      img.src = FALLBACK_VINYL;
    }
  };

  const handleDownload = (url: string, filename: string, type: "audio" | "cover", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const downloadApiUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    window.open(downloadApiUrl, "_blank");
  };

  // Filtering
  const filteredReleases = releases.filter((rel) => {
    const matchesSearch =
      rel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.tracks?.some((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || rel.status === statusFilter;
    const matchesType = typeFilter === "ALL" || rel.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredReleases.length / itemsPerPage);
  const paginatedReleases = filteredReleases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "RELEASED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case "PROCESSING":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Processing</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Review</span>;
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Music Releases</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar rilis musik, pemutar audio, serta unduhan master artwork dan audio.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul lagu, album, atau genre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Review</option>
            <option value="PROCESSING">Processing</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium text-slate-700"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="SINGLE">Single</option>
            <option value="EP">EP</option>
            <option value="ALBUM">Album</option>
          </select>
        </div>
      </div>

      {/* Releases List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {paginatedReleases.length === 0 ? (
          <div className="p-12 text-center">
            <Disc3 className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-spin-slow" />
            <h3 className="text-base font-semibold text-slate-800">Belum ada rilis musik</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "Tidak ada rilis yang cocok dengan filter pencarian Anda."
                : "Mulai unggah rilis musik pertama Anda sekarang."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Cover / Track</th>
                  <th className="py-3.5 px-4">Tipe & Genre</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedReleases.map((rel) => {
                  const firstTrack = rel.tracks[0];
                  const isThisPlaying = firstTrack && currentTrack?.track.id === firstTrack.id && isPlaying;

                  return (
                    <tr
                      key={rel.id}
                      onClick={() => setSelectedRelease(rel)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Cover & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 flex-shrink-0 shadow-sm">
                            <img
                              src={resolveMediaUrl(rel.coverArtworkUrl)}
                              alt={rel.title}
                              onError={handleImageError}
                              className="w-full h-full object-cover"
                            />
                            {firstTrack && (
                              <button
                                onClick={(e) => togglePlay(firstTrack, rel, e)}
                                className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100"
                                title={isThisPlaying ? "Pause" : "Putar Lagu"}
                              >
                                {isThisPlaying ? (
                                  <Pause className="w-5 h-5 fill-current" />
                                ) : (
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[320px]">
                                {rel.title}
                              </span>
                              {isThisPlaying && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {rel.artist?.name || artistName || "Breakout Artist"} • {rel.tracks?.length || 1} Track
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Genre */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rel.type === "SINGLE" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 mr-2">SINGLE</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 mr-2">{rel.type}</span>
                          )}
                        <span className="text-xs text-slate-500">{rel.genre}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(rel.status)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(rel.releaseDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {firstTrack && (
                            <button
                              onClick={(e) => togglePlay(firstTrack, rel, e)}
                              className={`p-2 rounded-xl border transition-all ${
                                isThisPlaying
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              title={isThisPlaying ? "Pause Audio" : "Putar Audio"}
                            >
                              {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                          )}

                          {firstTrack && (
                            <button
                              onClick={(e) => handleDownload(firstTrack.audioUrl, `${firstTrack.title}.mp3`, "audio", e)}
                              className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
                              title="Download Audio MP3/WAV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredReleases.length)} dari {filteredReleases.length} rilis
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Release Detail Modal */}
      {selectedRelease && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md flex-shrink-0">
                  <img
                    src={resolveMediaUrl(selectedRelease.coverArtworkUrl)}
                    alt={selectedRelease.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedRelease.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selectedRelease.artist?.name || artistName || "Breakout Artist"} • {selectedRelease.genre}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {getStatusBadge(selectedRelease.status)}
                    {selectedRelease.type === "SINGLE" ? (
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">SINGLE</span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-md">{selectedRelease.type}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRelease(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Download Cover */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                <span className="font-semibold block text-slate-900">Cover Artwork Master</span>
                Unduh file gambar artwork asli untuk promosi atau arsip.
              </div>
              <button
                onClick={(e) => handleDownload(selectedRelease.coverArtworkUrl, `${selectedRelease.title} - Cover.jpg`, "cover", e)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Cover
              </button>
            </div>

            {/* Tracklist in Modal */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Music className="w-4 h-4 text-red-600" />
                Daftar Lagu ({selectedRelease.tracks?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedRelease.tracks?.map((track, idx) => {
                  const isTrackActive = currentTrack?.track.id === track.id && isPlaying;
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isTrackActive
                          ? "bg-red-50/70 border-red-200"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => togglePlay(track, selectedRelease)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            isTrackActive
                              ? "bg-red-600 text-white shadow-md shadow-red-500/30"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isTrackActive ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {idx + 1}. {track.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {track.featuredArtist ? `Feat: ${track.featuredArtist} • ` : ''}{track.isrc ? `ISRC: ${track.isrc}` : "ISRC Auto-Generated"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDownload(track.audioUrl, `${track.title}.mp3`, "audio", e)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Download Lagu Master"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Audio Player Bar */}
      {currentTrack && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 md:right-8 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-3.5 shadow-2xl text-white animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                <img
                  src={resolveMediaUrl(currentTrack.release.coverArtworkUrl)}
                  alt="Track Cover"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {currentTrack.track.title}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentTrack.release.artist?.name || artistName || "Breakout Artist"} • {currentTrack.release.title}
                </p>
              </div>
            </div>

            {/* Controls & Timeline */}
            <div className="flex-1 max-w-xl w-full flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlay(currentTrack.track, currentTrack.release)}
                  disabled={isBuffering}
                  className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  {isBuffering ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              <div className="w-full flex items-center gap-2.5 text-xs text-slate-400">
                <span className="w-10 text-right font-mono">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="w-10 font-mono">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Side Utility */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => handleDownload(currentTrack.track.audioUrl, `${currentTrack.track.title}.mp3`, "audio", e)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Download Audio"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                  setCurrentTrack(null);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                title="Tutup Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}