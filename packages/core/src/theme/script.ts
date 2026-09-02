/**
 * A script that runs BEFORE the first paint, inlined into the `<head>` of both
 * apps. Without it the page always paints light and only flips to dark once
 * React has hydrated — a white flash on every load.
 *
 * Deliberately a **string**, not a function passed through `.toString()`: a
 * minifier is free to rename variables and inline functions, and a renamed
 * function stringifies into something that misbehaves or does not run at all.
 *
 * That is why `noalhub-theme` is hardcoded here instead of importing
 * `THEME_STORAGE_KEY` — a bundler cannot substitute a variable inside a string.
 * Changing the key means changing both places; `types.ts` carries a reminder.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("noalhub-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;
