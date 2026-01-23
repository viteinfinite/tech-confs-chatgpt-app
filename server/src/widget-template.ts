import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type WidgetTemplateHashEntry = {
  hash: string;
  file: string;
};

type WidgetTemplateHashMap = {
  version: number;
  generatedAt?: string;
  templates: Record<string, WidgetTemplateHashEntry>;
};

type RequestInfoHeaders = Record<string, string | string[] | undefined>;

const TEMPLATE_SOURCE = `<base href="{{serverUrl}}" />
<div id="root"></div>
<script type="module">
  import('{{serverUrl}}/assets/{{widgetFile}}');
</script>
<link rel="stylesheet" crossorigin href="{{serverUrl}}/assets/{{styleFile}}" />
`;

const TEMPLATE_HASHES_PATH = path.join(
  process.cwd(),
  "dist",
  "assets",
  "widget-template-hashes.json"
);

const MANIFEST_PATH = path.join(process.cwd(), "dist", "assets", ".vite", "manifest.json");

function readTemplateHashMap(): WidgetTemplateHashMap | null {
  if (!existsSync(TEMPLATE_HASHES_PATH)) {
    return null;
  }

  const raw = readFileSync(TEMPLATE_HASHES_PATH, "utf8");
  return JSON.parse(raw) as WidgetTemplateHashMap;
}

function readManifest(): Record<string, { file?: string }> {
  const raw = readFileSync(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as Record<string, { file?: string }>;
}

function lookupDistFile(manifest: Record<string, { file?: string }>, key: string) {
  return manifest[key]?.file;
}

function lookupDistFileWithIndexFallback(
  manifest: Record<string, { file?: string }>,
  basePath: string
) {
  const flatFileKey = `${basePath}.tsx`;
  const indexFileKey = `${basePath}/index.tsx`;
  return manifest[flatFileKey]?.file ?? manifest[indexFileKey]?.file;
}

function getHeader(headers: RequestInfoHeaders | undefined, name: string) {
  const value = headers?.[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function getWidgetTemplateHashEntry(widgetName: string): WidgetTemplateHashEntry | null {
  const mapping = readTemplateHashMap();
  return mapping?.templates?.[widgetName] ?? null;
}

export function resolveWidgetTemplateUri(widgetName: string): string {
  const entry = getWidgetTemplateHashEntry(widgetName);
  if (entry?.file) {
    return `ui://widgets/apps-sdk/${entry.file}`;
  }
  return `ui://widgets/apps-sdk/${widgetName}.html`;
}

export function resolveWidgetAssets(widgetName: string) {
  const manifest = readManifest();
  const widgetFile = lookupDistFileWithIndexFallback(manifest, `src/widgets/${widgetName}`);
  if (!widgetFile) {
    throw new Error(`Missing widget bundle for ${widgetName}`);
  }
  const styleFile = lookupDistFile(manifest, "style.css");
  return { widgetFile, styleFile };
}

export function renderWidgetTemplate({
  serverUrl,
  widgetFile,
  styleFile,
}: {
  serverUrl: string;
  widgetFile: string;
  styleFile?: string;
}) {
  const resolvedStyleFile = styleFile ?? "undefined";
  return TEMPLATE_SOURCE.replaceAll("{{serverUrl}}", serverUrl)
    .replaceAll("{{widgetFile}}", widgetFile)
    .replaceAll("{{styleFile}}", resolvedStyleFile);
}

export function resolveServerUrl(extra?: { requestInfo?: { headers?: RequestInfoHeaders } }) {
  const headers = extra?.requestInfo?.headers;
  if (process.env.NODE_ENV === "production") {
    const host = getHeader(headers, "x-forwarded-host") ?? getHeader(headers, "host");
    return `https://${host ?? "localhost"}`;
  }

  return "http://localhost:3000";
}
