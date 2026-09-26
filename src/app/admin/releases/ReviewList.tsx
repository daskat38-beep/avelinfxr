"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Download, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Music, 
  User, 
  Tag, 
  Calendar, 
  Disc, 
  ExternalLink,
  Search,
  Filter,
  Volume2,
  VolumeX,
  X,
  Loader2,
  Disc3
} from "lucide-react";
import { updateReleaseStatusAction } from "@/app/actions/admin";

export interface TrackItem {
  id: string;
  title: string;
  audioUrl: string;
  isrc?: string | null;
  upc?: string | null;
  composer?: string | null;
  producer?: string | null;
  lyrics?: string | null;
  tiktokClipStart?: string | null;
  featuredArtist?: string | null;
}

export interface ReviewItem {
  id: string;
  title: string;
  genre: string;
  type: string;
  status: string;
  coverArtworkUrl: string;
  releaseDate: string | Date;
  upc?: string | null;
  featuredArtist?: string | null;
  distributor?: string | null;
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
  youtubeMusicUrl?: string | null;
  tiktokUrl?: string | null;
  tracks: TrackItem[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    artist?: {
      name: string;
    } | null;
  };
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

export default function ReviewList({ initialReleases }: { initialReleases: ReviewItem[] }) {
  const [releases, setReleases] = useState<ReviewItem[]>(initialReleases);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [filter, setFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Audio Player State
  const [currentTrack, setCurrentTrack] = useState<{
    track: TrackItem;
    release: ReviewItem;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const togglePlay = (track: TrackItem, release: ReviewItem, e?: React.MouseEvent) => {
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

  const handleDownload = (fileUrl: string, filename: string, type: "audio" | "cover", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const downloadApiUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
    window.open(downloadApiUrl, "_blank");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const releaseToUpdate = releases.find(r => r.id === id);
      if (!releaseToUpdate) return;
      setUpdatingStatus(newStatus);
      const res = await updateReleaseStatusAction(
        id,
        releaseToUpdate.user.id,
        newStatus as "APPROVED" | "REJECTED",
        releaseToUpdate.user.name || "Artist",
        releaseToUpdate.user.email || "",
        releaseToUpdate.title
      );
      if (res.success) {
        setReleases(releases.filter((r) => r.id !== id));
        if (selected && selected.id === id) {
          setSelected(null);
        }
      } else {
        alert("Gagal mengupdate status: " + (res as any).error);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally { setUpdatingStatus(null); }
  };

  const filtered = releases.filter((r) => {
    const matchesFilter = filter === "ALL" || r.status === filter;
    const matchesSearch = 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.artist?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.genre.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul lagu, artis, atau genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 hidden md:block mr-1" />
          {["ALL", "PENDING", "PROCESSING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === st
                  ? "bg-red-600 text-white shadow-sm shadow-red-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Disc3 className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-spin-slow" />
            <h3 className="text-sm font-semibold text-slate-700">Tidak ada data rilis</h3>
            <p className="text-xs text-slate-400 mt-1">Belum ada pengajuan lagu yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Artwork & Judul</th>
                  <th className="py-3.5 px-4">Artis / Uploader</th>
                  <th className="py-3.5 px-4">Tipe & Genre</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Tanggal Rilis</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((rel) => {
                  const firstTrack = rel.tracks[0];
                  const isThisPlaying = firstTrack && currentTrack?.track.id === firstTrack.id && isPlaying;

                  return (
                    <tr
                      key={rel.id}
                      onClick={() => setSelected(rel)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
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
                                title={isThisPlaying ? "Pause" : "Play Audio"}
                              >
                                {isThisPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                              </button>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 truncate block max-w-[200px]">
                              {rel.title}
                            </span>
                            <span className="text-xs text-slate-400">
                              {rel.tracks.length} Track
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[150px]">
                          {rel.user?.artist?.name || rel.user?.name || "No Artist"}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">
                          {rel.user?.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rel.type === "SINGLE" ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold mr-1.5">SINGLE</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold mr-1.5 border border-purple-200">{rel.type}</span>
                          )}
                        <span className="text-xs text-slate-500">{rel.genre}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            rel.status === "APPROVED" || rel.status === "RELEASED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rel.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : rel.status === "PROCESSING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {rel.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(rel.releaseDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {firstTrack && (
                            <button
                              onClick={(e) => togglePlay(firstTrack, rel, e)}
                              className={`p-2 rounded-xl border transition-all ${
                                isThisPlaying
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              title={isThisPlaying ? "Pause" : "Play Audio"}
                            >
                              {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                          )}
                          <button
                            onClick={() => setSelected(rel)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Lihat Detail Rilis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Bottom Audio Player */}
      {currentTrack && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 md:right-8 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-3.5 shadow-2xl text-white animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  {currentTrack.release.user?.artist?.name || currentTrack.release.user?.name || "Breakout Artist"} - {currentTrack.release.title}
                </p>
              </div>
            </div>

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

      {/* Modal Detail & Review */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md flex-shrink-0">
                  <img
                    src={resolveMediaUrl(selected.coverArtworkUrl)}
                    alt={selected.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selected.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selected.user?.artist?.name || selected.user?.name} - {selected.genre}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {selected.type === "SINGLE" ? (
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">SINGLE</span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md border border-purple-200">{selected.type}</span>
                        )}
                      {selected.upc && (
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
                          UPC: {selected.upc}
                        </span>
                      )}
                      {selected.featuredArtist && (
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-200">
                          Feat: {selected.featuredArtist}
                        </span>
                      )}
                    </div>
                    {selected.upc && (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
                        UPC: {selected.upc}
                      </span>
                    )}
                    {selected.featuredArtist && (
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-200">
                        Feat: {selected.featuredArtist}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(selected.coverArtworkUrl, `${selected.title} - Cover.jpg`, "cover", e);
                      }}
                      className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-md border border-red-200 hover:bg-red-100 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Unduh Cover
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Track list */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Music className="w-4 h-4 text-red-600" />
                Daftar Lagu ({selected.tracks.length})
              </h4>
              <div className="space-y-2">
                {selected.tracks.map((track, idx) => {
                  const isTrackActive = currentTrack?.track.id === track.id && isPlaying;
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isTrackActive ? "bg-red-50/70 border-red-200" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => togglePlay(track, selected)}
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
                          <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                              <span className="inline-block font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mr-2 mb-1">
                                {track.isrc ? `ISRC: ${track.isrc}` : "ISRC Auto-Generated"}
                              </span>
                              {track.upc && (
                                <span className="inline-block font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mr-2 mb-1">
                                  UPC: {track.upc}
                                </span>
                              )}
                              {track.featuredArtist && <span className="block text-[11px]">Feat: <span className="text-slate-600 font-medium">{track.featuredArtist}</span></span>}
                              {track.composer && <span className="block text-[11px]">Composer: <span className="text-slate-600 font-medium">{track.composer}</span></span>}
                              {track.producer && <span className="block text-[11px]">Producer: <span className="text-slate-600 font-medium">{track.producer}</span></span>}
                              {track.tiktokClipStart && <span className="block text-[11px]">TikTok Clip: <span className="text-slate-600 font-medium">{track.tiktokClipStart}</span></span>}
                              </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDownload(track.audioUrl, `${track.title}.mp3`, "audio", e)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Download Audio Master"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Change Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Ubah status persetujuan rilis:
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={(updatingStatus !== null) || selected.status === "APPROVED"}
                  onClick={() => handleStatusChange(selected.id, "APPROVED")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                >
                  Approve
                </button>
                <button
                  disabled={(updatingStatus !== null) || selected.status === "PROCESSING"}
                  onClick={() => handleStatusChange(selected.id, "PROCESSING")}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                >
                  Processing
                </button>
                <button
                  disabled={(updatingStatus !== null) || selected.status === "REJECTED"}
                  onClick={() => handleStatusChange(selected.id, "REJECTED")}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



