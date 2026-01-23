import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { categorizeTalk } from "./categorize.js";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Raw talk structure from schedule.json
 */
export interface RawTalk {
  id: string;
  title: string;
  speakersPlainText: string | null;
  fromTime: string; // ISO timestamp
  toTime: string; // ISO timestamp
  kind: "Talk" | "Other";
  abstract: string | null;
  track?: string;
  tags?: string[];
}

/**
 * Processed talk structure for API responses
 */
export interface Talk {
  id: string;
  title: string;
  speakers: string;
  time: string; // "14:15–14:50"
  day: string; // "Oct 6"
  kind: string;
  category: string;
  track: string;
  tags: string[];
  abstract?: string; // Only included in detail view
}

/**
 * Format a time range for display
 */
function formatTimeRange(fromTime: string, toTime: string): string {
  const from = new Date(fromTime);
  const to = new Date(toTime);

  const fromHours = from.getHours().toString().padStart(2, "0");
  const fromMinutes = from.getMinutes().toString().padStart(2, "0");
  const toHours = to.getHours().toString().padStart(2, "0");
  const toMinutes = to.getMinutes().toString().padStart(2, "0");

  return `${fromHours}:${fromMinutes}–${toHours}:${toMinutes}`;
}

/**
 * Format the day for display
 */
function formatDay(fromTime: string): string {
  const date = new Date(fromTime);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Load and parse schedule.json
 */
export async function loadSchedule(): Promise<RawTalk[]> {
  const schedulePath = join(ROOT_DIR, "schedule.json");
  const content = await readFile(schedulePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Transform raw talks to processed talks with categorization
 */
export function transformTalks(rawTalks: RawTalk[], includeAbstract = false): Talk[] {
  return rawTalks.map((raw) => ({
    id: raw.id,
    title: raw.title,
    speakers: raw.speakersPlainText || "Various",
    time: formatTimeRange(raw.fromTime, raw.toTime),
    day: formatDay(raw.fromTime),
    kind: raw.kind,
    category: categorizeTalk(raw.title, raw.abstract),
    track: raw.track || "General",
    tags: raw.tags || [],
    ...(includeAbstract && raw.abstract ? { abstract: raw.abstract } : {}),
  }));
}

/**
 * Filter talks based on provided criteria
 */
export interface TalkFilters {
  category?: string;
  day?: string;
  speaker?: string;
  keywords?: string[];
  track?: string;
  tags?: string[];
}

export function filterTalks(talks: Talk[], filters: TalkFilters): Talk[] {
  return talks.filter((talk) => {
    if (filters.category && talk.category !== filters.category) {
      return false;
    }

    if (filters.day && talk.day !== filters.day) {
      return false;
    }

    if (filters.speaker && !talk.speakers.toLowerCase().includes(filters.speaker.toLowerCase())) {
      return false;
    }

    if (filters.keywords && filters.keywords.length > 0) {
      const searchText = `${talk.title} ${talk.speakers}`.toLowerCase();
      if (!filters.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
        return false;
      }
    }

    if (filters.track && talk.track !== filters.track) {
      return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((tag) => talk.tags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Group talks by category
 */
export function groupTalksByCategory(talks: Talk[]): Record<string, Talk[]> {
  const groups: Record<string, Talk[]> = {};

  for (const talk of talks) {
    if (!groups[talk.category]) {
      groups[talk.category] = [];
    }
    groups[talk.category].push(talk);
  }

  return groups;
}

/**
 * Get a single talk by ID
 */
export function getTalkById(talks: Talk[], id: string): Talk | undefined {
  return talks.find((t) => t.id === id);
}

/**
 * Group talks by track
 */
export function groupTalksByTrack(talks: Talk[]): Record<string, Talk[]> {
  const groups: Record<string, Talk[]> = {};

  for (const talk of talks) {
    if (!groups[talk.track]) {
      groups[talk.track] = [];
    }
    groups[talk.track].push(talk);
  }

  return groups;
}

/**
 * Get all unique tracks from talks
 */
export function getAllTracks(talks: Talk[]): string[] {
  const tracks = new Set(talks.map((t) => t.track));
  return Array.from(tracks).sort();
}

/**
 * Get all unique tags from talks
 */
export function getAllTags(talks: Talk[]): string[] {
  const tags = new Set<string>();
  for (const talk of talks) {
    for (const tag of talk.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}
