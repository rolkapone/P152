// Typed translation keys (ADR-APP-05): an unknown key does not compile.
import "i18next";
import type { defaultNS, resources } from "./config";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
    returnNull: false;
  }
}
