// Local-only visibility flag for service requests.
// Controls whether a given request appears in the user's public profile.
// Default: visible (true) — matches the toggle default in the form.

const KEY = "corteqs:service-request-visibility";

type Map = Record<string, boolean>;

const read = (): Map => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

const write = (m: Map) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
    window.dispatchEvent(new CustomEvent("corteqs:service-request-visibility-change"));
  } catch {}
};

export const isRequestVisible = (id: string): boolean => {
  const m = read();
  // Default to true so newly-created requests show on profile unless toggled off.
  return m[id] !== false;
};

export const setRequestVisible = (id: string, visible: boolean) => {
  const m = read();
  m[id] = visible;
  write(m);
};
