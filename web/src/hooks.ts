import { useSyncExternalStore } from "react";

/**
 * TypeScript types for window.openai API
 */
export type DisplayMode = "pip" | "inline" | "fullscreen";
export type Theme = "light" | "dark";

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeArea {
  insets: SafeAreaInsets;
}

interface UserAgent {
  device: {
    type: "mobile" | "tablet" | "desktop" | "unknown";
  };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
}

interface OpenAiGlobals<
  ToolInput extends Record<string, unknown> = Record<string, unknown>,
  ToolOutput extends Record<string, unknown> | null = Record<string, unknown> | null,
  ToolResponseMetadata extends Record<string, unknown> = Record<string, unknown>,
  WidgetState extends Record<string, unknown> | null = Record<string, unknown> | null
> {
  theme: Theme;
  userAgent: UserAgent;
  locale: string;
  maxHeight: number;
  displayMode: DisplayMode;
  safeArea: SafeArea;
  toolInput: ToolInput;
  toolOutput: ToolOutput;
  toolResponseMetadata: ToolResponseMetadata;
  widgetState: WidgetState;
}

declare global {
  interface Window {
    openai: OpenAiGlobals & {
      callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
      sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;
      openExternal: (payload: { href: string }) => void;
      requestDisplayMode: (args: { mode: DisplayMode }) => Promise<{ mode: DisplayMode }>;
      setWidgetState: (state: Record<string, unknown>) => Promise<void>;
    };
  }

  interface WindowEventMap {
    "openai:set_globals": CustomEvent<{
      globals: Partial<OpenAiGlobals>;
    }>;
  }
}

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

/**
 * Subscribe to changes in a specific window.openai global value
 */
function subscribeToGlobal<K extends keyof OpenAiGlobals>(
  key: K,
  onChange: () => void
): () => void {
  const handleSetGlobal = (event: CustomEvent<{ globals: Partial<OpenAiGlobals> }>) => {
    if (event.detail.globals[key] !== undefined) {
      onChange();
    }
  };

  window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener, {
    passive: true,
  });

  return () => {
    window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener);
  };
}

/**
 * Get the current value of a window.openai global
 */
function getGlobal<K extends keyof OpenAiGlobals>(key: K): OpenAiGlobals[K] {
  return window.openai?.[key];
}

/**
 * Hook to subscribe to a window.openai global value
 */
export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K
): OpenAiGlobals[K] {
  return useSyncExternalStore(
    (onChange) => subscribeToGlobal(key, onChange),
    () => getGlobal(key),
    () => getGlobal(key)
  );
}

/**
 * Hook to get tool input from window.openai
 */
export function useToolInput() {
  return useOpenAiGlobal("toolInput");
}

/**
 * Hook to get tool output from window.openai
 */
export function useToolOutput<T = Record<string, unknown>>() {
  return useOpenAiGlobal("toolOutput") as T | null;
}

/**
 * Hook to get and set widget state
 */
export function useWidgetState<T extends Record<string, unknown>>(
  defaultState: T | (() => T)
): [T, (state: T | ((prev: T) => T)) => void];
export function useWidgetState<T extends Record<string, unknown>>(
  defaultState?: T | (() => T | null) | null
): [T | null, (state: T | null | ((prev: T | null) => T | null)) => void];
export function useWidgetState<T extends Record<string, unknown>>(
  defaultState?: T | (() => T | null) | null
): [T | null, (state: T | null | ((prev: T | null) => T | null)) => void] {
  const widgetStateFromWindow = useOpenAiGlobal("widgetState") as T | null;

  const [widgetState, _setWidgetState] = React.useState<T | null>(() => {
    if (widgetStateFromWindow != null) {
      return widgetStateFromWindow;
    }
    return typeof defaultState === "function"
      ? (defaultState as () => T | null)()
      : defaultState ?? null;
  });

  React.useEffect(() => {
    _setWidgetState(widgetStateFromWindow);
  }, [widgetStateFromWindow]);

  const setWidgetState = React.useCallback(
    (
      state: T | null | ((prev: T | null) => T | null)
    ) => {
      _setWidgetState((prevState) => {
        const newState =
          typeof state === "function" ? (state as (prev: T | null) => T | null)(prevState) : state;

        if (newState != null && window.openai?.setWidgetState) {
          window.openai.setWidgetState(newState);
        }

        return newState;
      });
    },
    []
  );

  return [widgetState, setWidgetState] as const;
}

import React from "react";
