const STORAGE_KEY = "marmalade-high-score";

const safeParseNumber = (value: string | null) => {
  if (value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
};

export const getHighScore = () => {
  if (typeof window === "undefined" || !window?.localStorage) return 0;
  return safeParseNumber(window.localStorage.getItem(STORAGE_KEY));
};

export const saveHighScore = (value: number) => {
  if (typeof window === "undefined" || !window?.localStorage) return;
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(value))));
};
