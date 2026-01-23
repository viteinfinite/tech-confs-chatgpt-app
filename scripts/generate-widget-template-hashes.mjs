import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const TEMPLATE_SOURCE = `<base href="{{serverUrl}}" />
<div id="root"></div>
<script type="module">
  import('{{serverUrl}}/assets/{{widgetFile}}');
</script>
<link rel="stylesheet" crossorigin href="{{serverUrl}}/assets/{{styleFile}}" />
`;

const ROOT_DIR = process.cwd();
const ASSETS_DIR = path.join(ROOT_DIR, "server", "dist", "assets");
const MANIFEST_PATH = path.join(ASSETS_DIR, ".vite", "manifest.json");
const OUTPUT_PATH = path.join(ASSETS_DIR, "widget-template-hashes.json");
const SERVER_URL_PLACEHOLDER = "{{serverUrl}}";

function renderTemplate({ serverUrl, widgetFile, styleFile }) {
  const resolvedStyleFile = styleFile ?? "undefined";
  return TEMPLATE_SOURCE.replaceAll("{{serverUrl}}", serverUrl)
    .replaceAll("{{widgetFile}}", widgetFile)
    .replaceAll("{{styleFile}}", resolvedStyleFile);
}

function resolveWidgetName(entryKey) {
  const normalized = entryKey.replace(/\\/g, "/");
  if (normalized.endsWith("/index.tsx")) {
    return path.basename(path.dirname(normalized));
  }
  return path.basename(normalized, path.extname(normalized));
}

if (!existsSync(MANIFEST_PATH)) {
  console.error(`Missing Vite manifest at ${MANIFEST_PATH}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const styleFile = manifest["style.css"]?.file;
const templates = {};

for (const [key, entry] of Object.entries(manifest)) {
  if (!key.startsWith("src/widgets/")) {
    continue;
  }

  const widgetName = resolveWidgetName(key);
  const widgetFile = entry?.file;

  if (!widgetFile) {
    throw new Error(`Missing widget file in manifest for ${key}`);
  }

  const html = renderTemplate({
    serverUrl: SERVER_URL_PLACEHOLDER,
    widgetFile,
    styleFile,
  });
  const hash = createHash("sha256").update(html).digest("hex").slice(0, 8);
  const file = `${widgetName}-${hash}.html`;

  templates[widgetName] = { hash, file };
}

mkdirSync(ASSETS_DIR, { recursive: true });
writeFileSync(
  OUTPUT_PATH,
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), templates }, null, 2)
);
console.log(`Wrote widget template hashes to ${OUTPUT_PATH}`);
