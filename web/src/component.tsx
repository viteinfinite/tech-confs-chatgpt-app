import React, { useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useToolOutput } from "./hooks";

const styleContent = `
/* Conference Schedule App Styles */

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  width: 100%;
  max-width: 100%;
  padding: 16px;
  overflow-x: hidden;
  height: 400px;
  max-height: 400px;
  overflow-y: auto;
}

.app-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.app-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #000;
}

.app-summary {
  margin: 0;
  font-size: 13px;
  color: rgba(0,0,0,0.6);
}

.topic-rows {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.topic-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topic-row-header {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.topic-row-count {
  font-weight: 400;
  color: rgba(0,0,0,0.5);
  font-size: 13px;
}

.topic-row-cards {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0 12px 0;
  scrollbar-width: none;
}

.topic-row-cards::-webkit-scrollbar {
  display: none;
}

.talk-card {
  flex: 0 0 200px;
  min-width: 200px;
  padding: 12px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.talk-card:hover {
  background: rgba(0,0,0,0.03);
  border-color: rgba(0,0,0,0.2);
  transform: translateY(-1px);
}

.talk-card:focus {
  outline: 2px solid #000;
  outline-offset: 2px;
}

.talk-card-title {
  font-size: 13px;
  font-weight: 500;
  color: #000;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.talk-card-speakers {
  font-size: 12px;
  color: rgba(0,0,0,0.7);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.talk-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
}

.talk-card-time {
  font-size: 11px;
  color: rgba(0,0,0,0.5);
  font-weight: 500;
}

.talk-card-emoji {
  font-size: 12px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(0,0,0,0.5);
  font-size: 14px;
}

.empty-state p { margin: 0; }

@media (prefers-color-scheme: dark) {
  .app-header { border-bottom-color: rgba(255,255,255,0.1); }
  .app-title, .topic-row-header, .talk-card-title { color: #fff; }
  .app-summary, .topic-row-count, .talk-card-speakers, .talk-card-time,
  .loading-state, .empty-state { color: rgba(255,255,255,0.6); }
  .talk-card {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
  .talk-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
  }
  .talk-card:focus { outline-color: #fff; }
}
`;

/**
 * Talk interface matching the server output
 */
interface Talk {
  id: string;
  title: string;
  speakers: string;
  time: string;
  day: string;
  kind: string;
  category: string;
}

/**
 * Tool output interface from search_talks
 */
interface SearchTalksOutput {
  talks: Talk[];
  groups: Record<string, Talk[]>;
  totalCount: number;
  filterSummary: string;
}

/**
 * TalkCard component - displays a single talk as a card
 */
function TalkCard({ talk, onCardClick }: { talk: Talk; onCardClick: (talk: Talk) => void }) {
  const handleClick = () => {
    onCardClick(talk);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick(talk);
    }
  };

  return (
    <div
      className="talk-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${talk.title} by ${talk.speakers}, ${talk.time}`}
      data-talk-id={talk.id}
    >
      <div className="talk-card-title">{talk.title}</div>
      <div className="talk-card-speakers">{talk.speakers}</div>
      <div className="talk-card-meta">
        <span className="talk-card-time">{talk.time}</span>
        {talk.kind === "Other" && <span className="talk-card-emoji">{" 📅"}</span>}
      </div>
    </div>
  );
}

/**
 * TopicRow component - displays a horizontal scrolling row of talks for a category
 */
function TopicRow({
  category,
  talks,
  onCardClick,
}: {
  category: string;
  talks: Talk[];
  onCardClick: (talk: Talk) => void;
}) {
  if (talks.length === 0) {
    return null;
  }

  return (
    <div className="topic-row">
      <h2 className="topic-row-header">
        {category} <span className="topic-row-count">• {talks.length} talk{talks.length !== 1 ? "s" : ""}</span>
      </h2>
      <div className="topic-row-cards">
        {talks.map((talk) => (
          <TalkCard key={talk.id} talk={talk} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

/**
 * App component - main component that displays all topic rows
 */
function App() {
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = styleContent;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const toolOutput = useToolOutput<SearchTalksOutput>();

  const talks = useMemo(() => {
    return toolOutput?.talks ?? [];
  }, [toolOutput]);

  const groups = useMemo(() => {
    return toolOutput?.groups ?? {};
  }, [toolOutput]);

  const filterSummary = useMemo(() => {
    return toolOutput?.filterSummary ?? "";
  }, [toolOutput]);

  const handleCardClick = (talk: Talk) => {
    if (window.openai?.sendFollowUpMessage) {
      window.openai.sendFollowUpMessage({
        prompt: `Tell me more about "${talk.title}" by ${talk.speakers}.`,
      });
    }
  };

  // Loading state
  if (!toolOutput) {
    return (
      <div className="app-container">
        <div className="loading-state">Loading talks...</div>
      </div>
    );
  }

  // Empty state
  if (talks.length === 0) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <p>No talks match your query. Try a different category or day.</p>
        </div>
      </div>
    );
  }

  // Render topic rows
  const categoryEntries = Object.entries(groups).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">Conference Schedule</h1>
        <p className="app-summary">{filterSummary}</p>
      </div>
      <div className="topic-rows">
        {categoryEntries.map(([category, categoryTalks]) => (
          <TopicRow
            key={category}
            category={category}
            talks={categoryTalks}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}

// Mount the app
const root = createRoot(document.getElementById("conference-schedule-root")!);
root.render(<App />);
