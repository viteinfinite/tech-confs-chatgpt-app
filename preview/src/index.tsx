import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  App,
  TalkCard,
  TrackRow,
  ensureAppStyles,
  type Talk,
  type SearchTalksOutput,
} from "../../web/src/app";
import type { DisplayMode } from "../../web/src/hooks";

const PREVIEW_STYLE_ELEMENT_ID = "preview-app-styles";
const previewStyleContent = `
:root {
  color-scheme: light;
  font-family: "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: radial-gradient(circle at top left, #f5f7ff, #ffffff 55%, #eef4ff 100%);
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

#preview-root {
  min-height: 100vh;
}

.preview-shell {
  padding: 32px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.preview-header h1 {
  font-size: 24px;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.preview-header p {
  margin: 0;
  color: rgba(15, 23, 42, 0.6);
}

.preview-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.75);
}

.preview-select select {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: #ffffff;
  font-size: 14px;
}

.preview-panel {
  border-radius: 16px;
  background: #ffffff;
  padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

@media (min-width: 768px) {
  .preview-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    background: radial-gradient(circle at top left, #1a1a2e, #0f0f1a 55%, #1a1a2e 100%);
    color: #e2e8f0;
  }

  .preview-header {
    background: rgba(30, 30, 45, 0.85);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .preview-header h1 {
    color: #f1f5f9;
  }

  .preview-header p {
    color: rgba(226, 232, 240, 0.6);
  }

  .preview-select {
    color: rgba(226, 232, 240, 0.75);
  }

  .preview-select select {
    background: #1e1e2d;
    border-color: rgba(255, 255, 255, 0.2);
    color: #e2e8f0;
  }

  .preview-panel {
    background: #1e1e2d;
    border-color: rgba(255, 255, 255, 0.1);
  }
}
`;

function ensurePreviewStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(PREVIEW_STYLE_ELEMENT_ID)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = PREVIEW_STYLE_ELEMENT_ID;
  styleElement.textContent = previewStyleContent;
  document.head.appendChild(styleElement);
}

type PreviewComponent = "app" | "talk-card" | "topic-row";

const baseTalks: Talk[] = [
  {
    id: "talk-1",
    title: "Designing Fast MCP Clients",
    speakers: "Alex Rivera",
    time: "09:30",
    day: "Day 1",
    kind: "Talk",
    category: "Engineering",
    track: "ML/AI",
    tags: ["MCP", "Clients", "Performance"],
  },
  {
    id: "talk-2",
    title: "Productionizing AI Workflows",
    speakers: "Priya Singh",
    time: "10:15",
    day: "Day 1",
    kind: "Talk",
    category: "AI Ops",
    track: "ML/AI",
    tags: ["Ops", "Pipelines"],
  },
  {
    id: "talk-3",
    title: "Async UI Patterns",
    speakers: "Morgan Lee",
    time: "11:00",
    day: "Day 1",
    kind: "Other",
    category: "Design",
    track: "Mobile Development",
    tags: ["UI", "Async", "UX"],
  },
  {
    id: "talk-4",
    title: "TypeScript for Product Teams",
    speakers: "Jordan Patel",
    time: "13:30",
    day: "Day 2",
    kind: "Talk",
    category: "Engineering",
    track: "Data Engineering",
    tags: ["TypeScript", "Team"],
  },
];

const mockOutput: SearchTalksOutput = {
  talks: baseTalks,
  groups: baseTalks.reduce<Record<string, Talk[]>>((acc, talk) => {
    acc[talk.track] = acc[talk.track] ?? [];
    acc[talk.track].push(talk);
    return acc;
  }, {}),
  totalCount: baseTalks.length,
  filterSummary: "Showing 4 talks across ML/AI, Mobile Development, Data Engineering",
};

function setOpenAiGlobals(globals: Partial<Window["openai"]>) {
  const defaults = {
    theme: "light",
    userAgent: {
      device: { type: "desktop" },
      capabilities: { hover: true, touch: false },
    },
    locale: "en-US",
    maxHeight: 400,
    displayMode: "inline",
    safeArea: { insets: { top: 0, bottom: 0, left: 0, right: 0 } },
    toolInput: {},
    toolOutput: mockOutput,
    toolResponseMetadata: {},
    widgetState: null,
    callTool: async () => ({}),
    sendFollowUpMessage: async () => {},
    openExternal: () => {},
    requestDisplayMode: async ({ mode }: { mode: DisplayMode }) => ({ mode }),
    setWidgetState: async () => {},
  };

  window.openai = {
    ...defaults,
    ...(window.openai ?? {}),
    ...globals,
  };

  window.dispatchEvent(
    new CustomEvent("openai:set_globals", {
      detail: { globals },
    })
  );
}

function PreviewApp() {
  const [selected, setSelected] = useState<PreviewComponent>("app");

  useEffect(() => {
    ensureAppStyles();
    ensurePreviewStyles();
    if (selected === "app") {
      setOpenAiGlobals({ toolOutput: mockOutput });
    }
  }, [selected]);

  const previewContent = () => {
    switch (selected) {
      case "talk-card":
        return (
          <TalkCard
            talk={baseTalks[0]}
            onCardClick={() => {}}
          />
        );
      case "topic-row":
        return (
          <TrackRow
            track="ML/AI"
            talks={baseTalks.filter((talk) => talk.track === "ML/AI")}
            onDetailClick={() => {}}
            onFavToggle={() => {}}
            favorites={new Set()}
          />
        );
      case "app":
      default:
        return <App />;
    }
  };

  return (
    <div className="preview-shell">
      <header className="preview-header">
        <div>
          <h1>Component Preview</h1>
          <p>Render conference schedule components with mocked data.</p>
        </div>
        <label className="preview-select">
          <span>Component</span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value as PreviewComponent)}
          >
            <option value="app">App (Full Schedule)</option>
            <option value="talk-card">TalkCard</option>
            <option value="topic-row">TrackRow</option>
          </select>
        </label>
      </header>
      <section className="preview-panel">
        {previewContent()}
      </section>
    </div>
  );
}

setOpenAiGlobals({ toolOutput: mockOutput });

const root = createRoot(document.getElementById("preview-root")!);
root.render(<PreviewApp />);
