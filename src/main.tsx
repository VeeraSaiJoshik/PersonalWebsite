import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppBlobCursor } from "@/components/ui/app-blob-cursor";
import "./index.css";
import "./chapters.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <AppBlobCursor />
  </StrictMode>,
);
