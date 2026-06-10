import { useRef, useState } from "react";
import { FileUp, Image, FileText, Loader2 } from "lucide-react";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFlatTopics } from "@/lib/roadmaps";

const ACCEPT = ".md,.txt,.markdown,.json,text/plain,text/markdown,image/png,image/jpeg,image/webp";
const MAX_BYTES = 2 * 1024 * 1024;

export function NotesUploadPanel({ defaultTopicId }: { defaultTopicId?: string }) {
  const { state, uploadNote } = useGrowthState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [topicId, setTopicId] = useState(defaultTopicId ?? "");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topics = getFlatTopics(state.profile.path);

  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name} is too large (max 2MB)`);
          continue;
        }
        await uploadNote(file, topicId || null);
      }
    } catch {
      setError("Upload failed. Try a .md or .txt file.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? "border-[var(--in-progress)] bg-[var(--in-progress)]/5 scale-[1.01]"
            : "border-border hover:border-[var(--in-progress)]/50 hover:bg-[var(--surface-2)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 mx-auto text-[var(--in-progress)] animate-spin" />
        ) : (
          <FileUp className="w-8 h-8 mx-auto text-muted-foreground" />
        )}
        <p className="mt-3 text-sm font-medium">Drop notes here or click to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Markdown, text, or images · max 2MB each
        </p>
        <div className="mt-3 flex justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3 h-3" /> .md .txt
          </span>
          <span className="inline-flex items-center gap-1">
            <Image className="w-3 h-3" /> .png .jpg
          </span>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-mono uppercase text-muted-foreground mb-1.5 block">
          Link to topic (optional)
        </label>
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="w-full text-sm bg-card border border-border rounded-md px-3 py-2 focus:outline-none focus:border-[var(--in-progress)]"
        >
          <option value="">General library</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
