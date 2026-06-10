import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { useGrowthState } from "@/hooks/use-growth-state";

function guessResourceType(url: string): "video" | "article" | "course" | "other" {
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return "video";
  if (/udemy\.com|coursera\.org|freecodecamp/.test(url)) return "course";
  if (/\.(dev|org|io|com)\//.test(url)) return "article";
  return "other";
}

function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube")) return "YouTube video";
    return u.hostname.replace("www.", "");
  } catch {
    return "My resource";
  }
}

export function UserResourceForm({ topicId }: { topicId: string }) {
  const { addUserResource } = useGrowthState();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    addUserResource(topicId, {
      title: title.trim() || titleFromUrl(trimmed),
      url: trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      type: guessResourceType(trimmed),
    });
    setUrl("");
    setTitle("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-md border border-dashed border-white/20 text-[#c4bdb3] hover:bg-white/5 hover:border-amber-700/50"
      >
        <Plus className="w-3.5 h-3.5" />
        Add my link
      </button>
    );
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider desk-quiet">
        <Link2 className="w-3 h-3" />
        Your resource
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://youtube.com/..."
        className="w-full text-xs px-2.5 py-2 rounded border border-white/10 bg-black/20 text-[#e8e4dc] placeholder:text-[#6b6560] focus:outline-none focus:border-amber-700/50"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full text-xs px-2.5 py-2 rounded border border-white/10 bg-black/20 text-[#e8e4dc] placeholder:text-[#6b6560] focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 text-xs py-2 rounded bg-amber-700/80 text-amber-50 hover:bg-amber-700"
        >
          Save link
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs px-3 py-2 rounded border border-white/10 desk-quiet hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
