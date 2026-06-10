#!/usr/bin/env node
/**
 * Generates nodeId → topicId mapping manifests for each visual roadmap.
 * Run: node scripts/generate-roadmap-maps.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ROADMAPS_DIR = path.join(ROOT, "public", "roadmaps");
const MAPS_DIR = path.join(ROOT, "src", "lib", "roadmap-layout", "maps");
const ROADMAPS_TS = path.join(ROOT, "src", "lib", "roadmaps.ts");

const SLUG_TO_PATH = {
  backend: "backend",
  frontend: "frontend",
  "api-design": "api_design",
  "ai-engineer": "ai",
  "computer-science": "dsa",
  sql: "sql",
  "system-design": "system_design",
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44);
}

function extractPdfLabels(roadmapsTs, pathId) {
  const blockRe = new RegExp(
    `id:\\s*"${pathId}"[\\s\\S]*?labels:\\s*\\[([\\s\\S]*?)\\]\\s*,\\s*\\}`,
    "m",
  );
  const match = roadmapsTs.match(blockRe);
  if (!match) return [];
  const labelsBlock = match[1];
  const labels = [];
  const labelRe = /"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = labelRe.exec(labelsBlock)) !== null) {
    labels.push(m[1].replace(/\\"/g, '"'));
  }
  return labels;
}

function makeTopicId(pathId, label, index) {
  const idBase = slugify(label) || `item-${index + 1}`;
  return `${pathId}-${index + 1}-${idBase}`;
}

function buildTopicIndex(pathId, labels) {
  const byExact = new Map();
  const topics = labels.map((label, index) => {
    const topicId = makeTopicId(pathId, label, index);
    const entry = { topicId, label, index };
    byExact.set(label.trim().toLowerCase(), entry);
    return entry;
  });
  return { topics, byExact };
}

function fuzzyMatch(label, topics, byExact) {
  const normalized = label.trim().toLowerCase();
  if (byExact.has(normalized)) {
    return { ...byExact.get(normalized), match: "exact" };
  }

  const partial = topics.find((t) => {
    const title = t.label.trim().toLowerCase();
    return title.includes(normalized) || normalized.includes(title);
  });
  if (partial) return { ...partial, match: "partial" };

  const labelTokens = normalized.split(/\s+/).filter((t) => t.length > 3);
  const tokenMatch = topics.find((t) => {
    const titleTokens = t.label.toLowerCase().split(/\s+/);
    return labelTokens.some((token) => titleTokens.includes(token));
  });
  if (tokenMatch) return { ...tokenMatch, match: "token" };

  return null;
}

function loadOverrides() {
  const overridesPath = path.join(MAPS_DIR, "overrides.json");
  if (!fs.existsSync(overridesPath)) return {};
  return JSON.parse(fs.readFileSync(overridesPath, "utf8"));
}

function main() {
  fs.mkdirSync(MAPS_DIR, { recursive: true });
  const roadmapsTs = fs.readFileSync(ROADMAPS_TS, "utf8");
  const overrides = loadOverrides();
  const report = [];

  for (const [slug, pathId] of Object.entries(SLUG_TO_PATH)) {
    const jsonPath = path.join(ROADMAPS_DIR, `${slug}.json`);
    if (!fs.existsSync(jsonPath)) {
      report.push(`SKIP ${slug}: no JSON file`);
      continue;
    }

    const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const labels = extractPdfLabels(roadmapsTs, pathId);
    const { topics, byExact } = buildTopicIndex(pathId, labels);
    const pathOverrides = overrides[pathId] || {};

    const entries = [];
    const unmapped = [];

    for (const node of doc.nodes || []) {
      if (!["topic", "subtopic", "button"].includes(node.type)) continue;
      const label = node.data?.label?.trim();
      if (!label) continue;

      let topicId = pathOverrides[node.id] || pathOverrides[label];
      let match = topicId ? "override" : null;

      if (!topicId) {
        const found = fuzzyMatch(label, topics, byExact);
        if (found) {
          topicId = found.topicId;
          match = found.match;
        }
      }

      if (topicId) {
        entries.push({ nodeId: node.id, label, topicId, match: match || "override" });
      } else {
        unmapped.push({ nodeId: node.id, label, type: node.type });
      }
    }

    const mapFile = path.join(MAPS_DIR, `${slug}.map.json`);
    fs.writeFileSync(
      mapFile,
      JSON.stringify({ slug, pathId, generatedAt: new Date().toISOString(), entries }, null, 2),
    );

    const pct = Math.round((entries.length / Math.max(entries.length + unmapped.length, 1)) * 100);
    report.push(
      `${slug}: ${entries.length} mapped, ${unmapped.length} unmapped (${pct}%)`,
    );
    if (unmapped.length > 0 && unmapped.length <= 20) {
      report.push(`  unmapped: ${unmapped.map((u) => u.label).join(", ")}`);
    }
  }

  fs.writeFileSync(path.join(MAPS_DIR, "unmapped-report.txt"), report.join("\n"));
  console.log(report.join("\n"));
}

main();
