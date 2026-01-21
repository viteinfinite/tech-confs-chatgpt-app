import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App, TalkCard, TopicRow, type Talk, type SearchTalksOutput } from "../../web/src/app";
import type { DisplayMode } from "../../web/src/hooks";
import "./preview.css";

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
  },
  {
    id: "talk-2",
    title: "Productionizing AI Workflows",
    speakers: "Priya Singh",
    time: "10:15",
    day: "Day 1",
    kind: "Talk",
    category: "AI Ops",
  },
  {
    id: "talk-3",
    title: "Async UI Patterns",
    speakers: "Morgan Lee",
    time: "11:00",
    day: "Day 1",
    kind: "Other",
    category: "Design",
  },
  {
    id: "talk-4",
    title: "TypeScript for Product Teams",
    speakers: "Jordan Patel",
    time: "13:30",
    day: "Day 2",
    kind: "Talk",
    category: "Engineering",
  },
];

const mockOutput: SearchTalksOutput = {
  talks: baseTalks,
  groups: baseTalks.reduce<Record<string, Talk[]>>((acc, talk) => {
    acc[talk.category] = acc[talk.category] ?? [];
    acc[talk.category].push(talk);
    return acc;
  }, {}),
  totalCount: baseTalks.length,
  filterSummary: "Showing 4 talks across Engineering, AI Ops, Design",
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
          <TopicRow
            category="Engineering"
            talks={baseTalks.filter((talk) => talk.category === "Engineering")}
            onCardClick={() => {}}
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
            <option value="topic-row">TopicRow</option>
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
