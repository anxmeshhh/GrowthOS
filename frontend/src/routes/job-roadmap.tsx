import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Loader2, X, Briefcase } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast-context";
import { PageShell, PageHeader } from "@/components/growth-ui";

export const Route = createFileRoute("/job-roadmap")({
  component: JobRoadmapComponent,
});

function JobRoadmapComponent() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [jobRoadmaps, setJobRoadmaps] = useState<any[]>([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = ["Reading file...", "Analyzing skills...", "Assembling roadmap..."];

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const res = await apiFetch("/custom-paths/");
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter(
            (p: any) => p.description && p.description.includes("### Tech Stack"),
          );
          setJobRoadmaps(filtered);
        }
      } catch (err) {
        console.error("Failed to load roadmaps", err);
      }
    }
    loadRoadmaps();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast("File is too large. Max size is 5MB.", "error");
      return;
    }
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["txt", "pdf", "docx"].includes(ext || "")) {
      showToast("Only .txt, .pdf, and .docx files are supported.", "error");
      return;
    }
    setFile(selectedFile);
  };

  const generateRoadmap = async () => {
    if (!file && !text.trim()) {
      showToast("Please provide a job description text or upload a file.", "error");
      return;
    }

    setIsLoading(true);
    setLoadingStage(0);

    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => Math.min(prev + 1, 2));
    }, 2500);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (text) formData.append("text", text);

      const res = await apiFetch("/job-roadmap/generate/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate roadmap");
      }

      const data = await res.json();
      showToast("Roadmap generated successfully!", "success");

      // Redirect to the newly created path
      navigate({ to: "/roadmap", search: { pathSlug: data.slug } });
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      clearInterval(stageInterval);
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          kicker="Learning roadmap"
          title="Job Description Roadmap Generator"
          subtitle="Paste a job description or upload a file, and we'll generate a personalized learning roadmap."
        />

        {/* Unified Input Area */}
        <div
          className={`relative w-full h-80 rounded-xl border-2 border-dashed transition-all ${isDragging ? "border-[#22c55e] bg-[#22c55e]/5" : "border-[#1a1a1a] bg-[#0a0a0a]"} flex flex-col mt-8`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/40 rounded-xl z-20 backdrop-blur-sm">
              <FileText size={48} className="text-[#22c55e] mb-4" />
              <span className="text-lg font-medium text-[#f0f0f0]">{file.name}</span>
              <span className="text-sm text-[#eee] mt-1">{(file.size / 1024).toFixed(1)} KB</span>
              <button
                onClick={() => setFile(null)}
                className="mt-4 flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={16} /> Clear File
              </button>
            </div>
          ) : null}

          <textarea
            className="flex-1 w-full bg-transparent border-none p-6 text-[#f0f0f0] placeholder:text-[#888] focus:outline-none resize-none z-10"
            placeholder="Paste job description text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading || file !== null}
          />

          <div className="h-16 border-t border-[#1a1a1a] flex items-center justify-center bg-black/40 z-10 rounded-b-xl gap-2 text-[#eee]">
            <UploadCloud size={18} />
            <span>Drag & Drop a .pdf, .docx, or .txt file, or </span>
            <button
              className="text-[#22c55e] hover:underline font-medium focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
            <Loader2 className="animate-spin text-[#22c55e] mb-4" size={32} />
            <p className="text-[#f0f0f0] font-medium animate-pulse">{stages[loadingStage]}</p>
          </div>
        )}

        {!isLoading && (
          <div className="flex justify-end mt-4">
            <button
              onClick={generateRoadmap}
              disabled={(!text.trim() && !file) || isLoading}
              className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Roadmap
            </button>
          </div>
        )}

        {jobRoadmaps.length > 0 && (
          <div className="mt-16 border-t border-[#1a1a1a] pt-10">
            <h3 className="text-sm uppercase tracking-[0.18em] font-mono text-[#fff] mb-6 flex items-center gap-2">
              <Briefcase className="text-[#22c55e]" size={16} />
              Your Generated Roadmaps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobRoadmaps.map((p) => (
                <Link
                  key={p.id}
                  to="/roadmap"
                  search={{ pathSlug: p.slug }}
                  className="block p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#22c55e]/50 hover:bg-[#0a1a10] transition-all group"
                >
                  <h4 className="text-lg font-bold text-[#f0f0f0] group-hover:text-[#22c55e] transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-xs text-[#888] mt-2 font-mono uppercase tracking-wider">
                    {p.topics?.length || 0} Topics
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
