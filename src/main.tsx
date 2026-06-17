import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import { installChunkErrorRecovery } from "./lib/recoveryReload";
import "./index.css";

installChunkErrorRecovery();

const rootElement = document.getElementById("root")!;

const tree = (
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, tree);
} else {
  createRoot(rootElement).render(tree);
}
