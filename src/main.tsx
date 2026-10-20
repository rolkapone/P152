import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { App } from "./app/App";
import { createI18n, DEFAULT_LANGUAGE } from "./ui/i18n/config";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
const i18n = createI18n();
document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;
createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
