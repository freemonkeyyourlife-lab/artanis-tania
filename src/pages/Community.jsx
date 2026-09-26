import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import UploadForm from "@/components/community/UploadForm";
import PostCard from "@/components/community/PostCard";

const SORTS = [
  { id: "new", label: "Neu" },
  { id: "liked", label: "Beliebt" },
  { id: "rated", label: "Beste Bewertung" },
];

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [sort, setSort] = useState("new");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [data, me] = await Promise.all([
        base44.entities.UserPost.list("-created_date", 60),
        base44.auth.me().catch(() => null),
      ]);
      setPosts(data);
      setCurrentUserId(me?.id || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sorted = [...posts].sort((a, b) => {
    if (sort === "liked") return (b.likes || 0) - (a.likes || 0);
    if (sort === "rated") {
      const ra = a.ratingCount ? a.ratingSum / a.ratingCount : 0;
      const rb = b.ratingCount ? b.ratingSum / b.ratingCount : 0;
      return rb - ra;
    }
    return 0;
  });

  const onLike = async (post) => {
    if (!currentUserId) return;
    const likedBy = post.likedBy || [];
    const liked = likedBy.includes(currentUserId);
    const nextLikedBy = liked ? likedBy.filter((id) => id !== currentUserId) : [...likedBy, currentUserId];
    const updated = await base44.entities.UserPost.update(post.id, {
      likedBy: nextLikedBy,
      likes: Math.max(0, (post.likes || 0) + (liked ? -1 : 1)),
    });
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
  };

  const onRate = async (post, rating) => {
    if (!currentUserId) return;
    const ratedBy = post.ratedBy || {};
    const previous = ratedBy[currentUserId] || 0;
    const updated = await base44.entities.UserPost.update(post.id, {
      ratedBy: { ...ratedBy, [currentUserId]: rating },
      ratingSum: (post.ratingSum || 0) - previous + rating,
      ratingCount: previous ? (post.ratingCount || 0) : (post.ratingCount || 0) + 1,
    });
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Community</h1>
          <p className="text-muted-foreground text-sm mt-1">Zeig dich selbst, schau anderen zu und bewerte, was dir gefällt.</p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Hochladen
        </button>
      </div>

      {showUpload && <UploadForm onSaved={() => { setShowUpload(false); load(); }} onCancel={() => setShowUpload(false)} />}

      <div className="flex gap-2 mb-6">
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={cn("px-4 py-2 rounded-full text-[13px] font-medium transition-colors", sort === s.id ? "bg-primary text-primary-foreground" : "glass border border-border text-muted-foreground hover:text-foreground")}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">Noch nichts da — sei der Erste und lade etwas hoch.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={currentUserId} onLike={onLike} onRate={onRate} />
          ))}
        </div>
      )}
    </div>
  );
}