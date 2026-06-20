import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useToast } from "@/components/toast-context";
import { apiFetch } from "@/lib/api-client";
import { ShieldAlert, Map, ArrowLeft, Upload, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/roadmap")({
  component: AdminRoadmapManager,
});

function AdminRoadmapManager() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jsonContent, setJsonContent] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  const handleValidate = () => {
    setValidationError(null);
    setIsValidated(false);
    
    if (!jsonContent.trim()) {
      setValidationError("JSON content cannot be empty.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);
      
      // Basic schema validation
      const validateRoadmap = (roadmap: any) => {
        if (!roadmap.slug) throw new Error("Missing 'slug' field in roadmap.");
        if (!roadmap.title) throw new Error("Missing 'title' field in roadmap.");
        if (!Array.isArray(roadmap.topics)) throw new Error("'topics' must be an array.");
        
        roadmap.topics.forEach((t: any, i: number) => {
          if (!t.slug) throw new Error(`Topic at index ${i} is missing a 'slug'.`);
          if (!t.title) throw new Error(`Topic at index ${i} is missing a 'title'.`);
        });
      };

      if (Array.isArray(parsed)) {
        parsed.forEach(validateRoadmap);
      } else {
        validateRoadmap(parsed);
      }

      setIsValidated(true);
      showToast("JSON successfully validated!", "success");
      
      // Format it nicely back into the editor
      setJsonContent(JSON.stringify(parsed, null, 2));

    } catch (e: any) {
      setValidationError(e.message || "Invalid JSON syntax.");
    }
  };

  const handleUpload = async () => {
    if (!isValidated) {
      showToast("Please validate the JSON first.", "error");
      return;
    }

    setIsParsing(true);
    try {
      const payload = JSON.parse(jsonContent);
      const res = await apiFetch("/admin/roadmaps/upload/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload roadmap.");
      }

      showToast("Roadmap successfully uploaded and synchronized!", "xp");
      setJsonContent("");
      setIsValidated(false);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-red-500/30">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate({ to: "/admin/dashboard" })}
                className="text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Command Center
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mt-2">
              <Map className="text-purple-500" />
              Roadmap Manager
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">
              Centralized System Path Upload
            </p>
          </div>
          <div className="px-3 py-1 rounded-full border border-red-900 bg-red-950/30 text-red-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={14} />
            Admin Only
          </div>
        </div>

        <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col h-[70vh]">
          <div className="p-4 border-b border-[#111] bg-[#0f0f0f] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono">
              JSON Payload Editor
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleValidate}
                className="px-4 py-1.5 rounded bg-[#1a1a1a] border border-[#333] hover:border-gray-500 text-sm text-gray-300 transition-colors cursor-pointer"
              >
                Validate JSON
              </button>
              <button
                onClick={handleUpload}
                disabled={!isValidated || isParsing}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isParsing ? "Synchronizing..." : <><Upload size={14} /> Deploy Roadmap</>}
              </button>
            </div>
          </div>

          {validationError && (
            <div className="bg-red-950/40 border-b border-red-900/50 p-3 px-6 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-red-400">Validation Error</p>
                <p className="text-xs text-red-300 font-mono mt-1">{validationError}</p>
              </div>
            </div>
          )}

          {isValidated && !validationError && (
            <div className="bg-green-950/20 border-b border-green-900/30 p-3 px-6 flex items-center gap-3">
              <CheckCircle2 className="text-green-500 shrink-0" size={16} />
              <p className="text-sm font-medium text-green-400">JSON schema is valid and ready for deployment.</p>
            </div>
          )}

          <div className="flex-1 relative">
            <textarea
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setIsValidated(false);
                setValidationError(null);
              }}
              spellCheck={false}
              placeholder='Paste the complete Roadmap JSON here...

Example Structure:
{
  "title": "Linux Mastery",
  "slug": "linux-mastery",
  "description": "Comprehensive guide to mastering Linux.",
  "estimated_weeks": 8,
  "topics": [
    {
      "title": "Command Line Basics",
      "slug": "cli-basics",
      "summary": "Learn basic commands like ls, cd, rm, cp.",
      "node_kind": "topic",
      "order": 1
    },
    {
      "title": "File Permissions",
      "slug": "file-permissions",
      "summary": "Understanding chmod, chown, and user groups.",
      "node_kind": "milestone",
      "order": 2
    }
  ]
}'
              className="absolute inset-0 w-full h-full bg-[#0a0a0a] text-gray-300 p-6 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 custom-scrollbar leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
