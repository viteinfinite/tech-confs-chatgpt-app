import React, { useMemo, useEffect, useState } from "react";
import { useToolOutput } from "./hooks";

const STYLE_ELEMENT_ID = "conference-schedule-styles";

// Track colors
const TRACK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Mobile Development": {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#2563eb",
    border: "rgba(59, 130, 246, 0.3)",
  },
  "ML/AI": {
    bg: "rgba(168, 85, 247, 0.1)",
    text: "#9333ea",
    border: "rgba(168, 85, 247, 0.3)",
  },
  "Data Engineering": {
    bg: "rgba(34, 197, 94, 0.1)",
    text: "#16a34a",
    border: "rgba(34, 197, 94, 0.3)",
  },
  "General": {
    bg: "rgba(107, 114, 128, 0.1)",
    text: "#6b7280",
    border: "rgba(107, 114, 128, 0.3)",
  },
};

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

.track-rows {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.track-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-row-header {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.track-row-count {
  font-weight: 400;
  color: rgba(0,0,0,0.5);
  font-size: 13px;
}

.track-row-cards {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0 12px 0;
  scrollbar-width: none;
}

.track-row-cards::-webkit-scrollbar {
  display: none;
}

.talk-card {
  flex: 0 0 220px;
  min-width: 220px;
  padding: 12px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  transition: all 0.15s ease;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.talk-card:hover {
  background: rgba(0,0,0,0.03);
  border-color: rgba(0,0,0,0.2);
  transform: translateY(-1px);
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
}

.track-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.talk-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-chip {
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  background: rgba(0,0,0,0.05);
  color: rgba(0,0,0,0.6);
  border: 1px solid rgba(0,0,0,0.1);
}

.talk-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.08);
}

.talk-card-time {
  font-size: 11px;
  color: rgba(0,0,0,0.5);
  font-weight: 500;
}

.talk-card-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  background: rgba(0,0,0,0.02);
  border: 1px solid transparent;
  cursor: pointer;
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.15s ease;
}

.action-btn:hover {
  background: rgba(0,0,0,0.08);
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn.detail-btn {
  border-color: rgba(0,0,0,0.18);
  border-radius: 999px;
  background: #ffffff;
}

.action-btn.detail-btn span {
  line-height: 1;
}

.action-btn.fav-btn {
  width: 32px;
  padding: 0;
}

.action-btn.detail-btn svg {
  stroke: rgba(0,0,0,0.5);
}

.action-btn.fav-btn svg {
  fill: none;
  stroke: rgba(0,0,0,0.5);
}

.action-btn.fav-btn.active svg {
  fill: #ef4444;
  stroke: #ef4444;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(0,0,0,0.5);
  font-size: 14px;
}

.empty-state p { margin: 0; }

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(0,0,0,0.08);
}

.modal-close svg {
  width: 20px;
  height: 20px;
  stroke: rgba(0,0,0,0.5);
}

.modal-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #000;
  padding-right: 32px;
}

.modal-speakers {
  font-size: 14px;
  color: rgba(0,0,0,0.7);
  margin-bottom: 16px;
}

.modal-track-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.modal-tag-chip {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  background: rgba(0,0,0,0.05);
  color: rgba(0,0,0,0.7);
  border: 1px solid rgba(0,0,0,0.1);
}

.modal-time {
  font-size: 12px;
  color: rgba(0,0,0,0.5);
  margin-bottom: 16px;
}

.modal-abstract {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0,0,0,0.8);
}

@media (prefers-color-scheme: dark) {
  .track-row-header, .talk-card-title, .modal-title {
    color: #fff;
  }
  .track-row-count, .talk-card-speakers, .talk-card-time, .modal-speakers, .modal-time, .loading-state, .empty-state {
    color: rgba(255,255,255,0.6);
  }
  .talk-card {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
  .talk-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
  }
  .tag-chip, .modal-tag-chip {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7);
    border-color: rgba(255,255,255,0.15);
  }
  .talk-card-meta {
    border-top-color: rgba(255,255,255,0.1);
  }
  .action-btn.detail-btn svg, .action-btn.fav-btn svg, .modal-close svg {
    stroke: rgba(255,255,255,0.5);
  }
  .action-btn.detail-btn {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: #e2e8f0;
  }
  .action-btn.fav-btn {
    background: rgba(255,255,255,0.04);
  }
  .modal-content {
    background: rgba(30,30,30,0.95);
  }
  .modal-abstract {
    color: rgba(255,255,255,0.8);
  }
}
`;

/**
 * Talk interface matching the server output
 */
export interface Talk {
  id: string;
  title: string;
  speakers: string;
  time: string;
  day: string;
  kind: string;
  category: string;
  track: string;
  tags: string[];
}

/**
 * Tool output interface from search_talks
 */
export interface SearchTalksOutput {
  talks: Talk[];
  groups: Record<string, Talk[]>;
  totalCount: number;
  filterSummary: string;
}

export function ensureAppStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = styleContent;
  document.head.appendChild(styleElement);
}

/**
 * Detail Modal component
 */
function DetailModal({
  talk,
  onClose,
}: {
  talk: Talk & { abstract?: string };
  onClose: () => void;
}) {
  const colors = TRACK_COLORS[talk.track] || TRACK_COLORS["General"];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h2 className="modal-title">{talk.title}</h2>
        <p className="modal-speakers">by {talk.speakers}</p>
        <span
          className="modal-track-badge"
          style={{
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {talk.track}
        </span>
        <div className="modal-tags">
          {talk.tags.map((tag) => (
            <span key={tag} className="modal-tag-chip">
              {tag}
            </span>
          ))}
        </div>
        <p className="modal-time">
          {talk.day} • {talk.time}
        </p>
        {talk.abstract && <p className="modal-abstract">{talk.abstract}</p>}
      </div>
    </div>
  );
}

/**
 * TalkCard component - displays a single talk as a card
 */
export function TalkCard({
  talk,
  onDetailClick,
  onFavToggle,
  isFav,
}: {
  talk: Talk & { abstract?: string };
  onDetailClick: (talk: Talk & { abstract?: string }) => void;
  onFavToggle: (id: string) => void;
  isFav: boolean;
}) {
  const colors = TRACK_COLORS[talk.track] || TRACK_COLORS["General"];

  return (
    <div
      className="talk-card"
      data-talk-id={talk.id}
    >
      <div className="talk-card-title">{talk.title}</div>
      <div className="talk-card-speakers">{talk.speakers}</div>
      <span
        className="track-badge"
        style={{
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        {talk.track}
      </span>
      {talk.tags.length > 0 && (
        <div className="talk-card-tags">
          {talk.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="talk-card-meta">
        <span className="talk-card-time">{talk.time}</span>
        <div className="talk-card-actions">
          <button
            className="action-btn detail-btn"
            onClick={() => onDetailClick(talk)}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Show details</span>
          </button>
          <button
            className={`action-btn fav-btn ${isFav ? "active" : ""}`}
            onClick={() => onFavToggle(talk.id)}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TrackRow component - displays a horizontal scrolling row of talks for a track
 */
export function TrackRow({
  track,
  talks,
  onDetailClick,
  onFavToggle,
  favorites,
}: {
  track: string;
  talks: (Talk & { abstract?: string })[];
  onDetailClick: (talk: Talk & { abstract?: string }) => void;
  onFavToggle: (id: string) => void;
  favorites: Set<string>;
}) {
  if (talks.length === 0) {
    return null;
  }

  return (
    <div className="track-row">
      <h2 className="track-row-header">
        {track} <span className="track-row-count">• {talks.length} talk{talks.length !== 1 ? "s" : ""}</span>
      </h2>
      <div className="track-row-cards">
        {talks.map((talk) => (
          <TalkCard
            key={talk.id}
            talk={talk}
            onDetailClick={onDetailClick}
            onFavToggle={onFavToggle}
            isFav={favorites.has(talk.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Track order for display
const TRACK_ORDER = ["Mobile Development", "ML/AI", "Data Engineering"];

/**
 * App component - main component that displays all track rows
 */
export function App() {
  useEffect(() => {
    ensureAppStyles();
  }, []);

  const toolOutput = useToolOutput<SearchTalksOutput>();
  const [selectedTalk, setSelectedTalk] = useState<(Talk & { abstract?: string }) | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("conference-favorites");
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const talks = useMemo(() => {
    return toolOutput?.talks ?? [];
  }, [toolOutput]);

  const groups = useMemo(() => {
    return toolOutput?.groups ?? {};
  }, [toolOutput]);

  const handleDetailClick = (talk: Talk & { abstract?: string }) => {
    setSelectedTalk(talk);
  };

  const handleFavToggle = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    try {
      localStorage.setItem("conference-favorites", JSON.stringify([...newFavorites]));
    } catch (e) {
      // Ignore localStorage errors
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
          <p>No talks match your query. Try different filters.</p>
        </div>
      </div>
    );
  }

  // Render track rows in the defined order, then any additional tracks alphabetically
  const orderedTracks = [...TRACK_ORDER];
  const remainingTracks = Object.keys(groups).filter((t) => !TRACK_ORDER.includes(t)).sort();

  return (
    <div className="app-container">
      <div className="track-rows">
        {[...orderedTracks, ...remainingTracks].map((track) => (
          <TrackRow
            key={track}
            track={track}
            talks={groups[track] || []}
            onDetailClick={handleDetailClick}
            onFavToggle={handleFavToggle}
            favorites={favorites}
          />
        ))}
      </div>
      {selectedTalk && (
        <DetailModal talk={selectedTalk} onClose={() => setSelectedTalk(null)} />
      )}
    </div>
  );
}
