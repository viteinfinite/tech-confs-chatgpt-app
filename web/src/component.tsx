import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

// Mount the app
const root = createRoot(document.getElementById("conference-schedule-root")!);
root.render(<App />);
