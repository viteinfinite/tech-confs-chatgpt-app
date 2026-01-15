/**
 * Category keyword mapping for talk categorization
 * Each category maps to an array of keywords that match talks to that category
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "AI & Machine Learning": ["foundation models", "ai", "machine learning", "liquid glass", "llm"],
  "SwiftUI & Design": ["swiftui", "design", "ux", "ui", "interface"],
  "Concurrency & Performance": ["concurrency", "swift 6", "performance", "parallel", "async"],
  "Testing": ["testing", "test", "xctest", "swift testing", "tdd"],
  "Platform & Tools": ["xcode", "build", "compilation", "private apis", "linux", "cursor"],
  "Live Activities & Widgets": ["live activities", "widget", "dynamic island"],
  "Accessibility": ["accessibility", "a11y"],
  "Vision & Spatial": ["visionos", "spatial", "vision pro", "ar"],
  "Cross-Platform": ["scale", "platforms", "apple watch", "apple tv", "multiplatform"],
  "Voice & Speech": ["speech", "voice", "audio", "speaking"],
  "Error Handling": ["error", "exception", "throws"],
  "Analytics": ["analytics", "metrics", "tracking"],
};

/**
 * Default category for talks that don't match any keywords
 */
export const DEFAULT_CATEGORY = "General";

/**
 * Categorize a talk based on its title and abstract
 * Returns the first matching category, or DEFAULT_CATEGORY if no match
 *
 * @param title - The talk title
 * @param abstract - The talk abstract (optional)
 * @returns The category name
 */
export function categorizeTalk(title: string, abstract: string | null): string {
  const searchText = `${title} ${abstract || ""}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return DEFAULT_CATEGORY;
}

/**
 * Categorize multiple talks
 *
 * @param talks - Array of talks with title and abstract
 * @returns Array of category names in the same order as input talks
 */
export function categorizeTalks(
  talks: Array<{ title: string; abstract: string | null }>
): string[] {
  return talks.map((talk) => categorizeTalk(talk.title, talk.abstract));
}
