import { he } from "./he";

const translations = { he } as const;
type Locale = keyof typeof translations;

export function t(locale: Locale = "he") {
  return translations[locale];
}

export { he };
