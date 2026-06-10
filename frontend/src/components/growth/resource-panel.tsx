import { ExternalLink } from "lucide-react";

const EMBED_ALLOWLIST = [
  { pattern: /youtube\.com\/watch|youtu\.be/, embed: (url: string) => {
    const id = url.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }},
  { pattern: /youtube-nocookie\.com/, embed: (url: string) => url },
];

function getEmbedUrl(url: string): string | null {
  for (const rule of EMBED_ALLOWLIST) {
    if (rule.pattern.test(url)) return rule.embed(url);
  }
  return null;
}

export function ResourcePanel({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose?: () => void;
}) {
  const embedUrl = getEmbedUrl(url);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--desk-surface)] border-r border-white/5">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span className="text-xs font-medium text-[#e8e4dc] truncate flex-1">{title}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[#c4bdb3] hover:text-amber-400"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] desk-quiet hover:text-[#e8e4dc] ml-1"
          >
            Hide
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full min-h-[200px] border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <p className="text-xs desk-quiet max-w-xs">
              This site can&apos;t be embedded here. Open it beside your notebook instead.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-md bg-amber-700/80 text-amber-50"
            >
              Open resource
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function toYoutubeEmbed(url: string): string | null {
  return getEmbedUrl(url);
}
