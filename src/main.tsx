import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { App } from "./app/App";
import { createI18n } from "./ui/i18n/config";
import { applyDocumentLanguage } from "./ui/i18n/document";
import "./ui/styles/fonts.css";
import "./ui/styles/tokens.css";
import "./ui/styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
const i18n = createI18n();
applyDocumentLanguage(document, i18n);
createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
console.log("__p152test");
