// The ambient layer a theme puts behind the whole app: CRT scanlines, paper
// grain, drifting motes, or a shaft of light. Purely decorative, pointer-events
// none, and silenced entirely under prefers-reduced-motion.

import type { Chrome } from "../themes";

export function ThemeChrome({ chrome }: { chrome: Chrome }) {
  if (chrome === "none") return null;
  return (
    <>
      <div className={`wf-chrome wf-chrome-${chrome}`} aria-hidden="true" />
      <style>{CHROME_CSS}</style>
    </>
  );
}

const CHROME_CSS = `
.wf-chrome{position:fixed;inset:0;pointer-events:none;z-index:1}

/* Cascade — CRT scanlines with a slow vertical roll. */
.wf-chrome-scanlines{
  background:repeating-linear-gradient(
    to bottom,
    color-mix(in oklch, var(--wf-accent) 7%, transparent) 0px,
    color-mix(in oklch, var(--wf-accent) 7%, transparent) 1px,
    transparent 1px, transparent 3px);
  animation:wf-roll 8s linear infinite;
  opacity:0.55;
}
@keyframes wf-roll{to{background-position-y:3px}}

/* Shinobi — paper grain, a static tiled noise field. */
.wf-chrome-grain{
  opacity:0.16;
  background-image:
    radial-gradient(circle at 15% 25%, var(--wf-line-hi) 0.5px, transparent 0.6px),
    radial-gradient(circle at 62% 71%, var(--wf-line-hi) 0.5px, transparent 0.6px),
    radial-gradient(circle at 84% 33%, var(--wf-line-hi) 0.5px, transparent 0.6px),
    radial-gradient(circle at 38% 88%, var(--wf-line-hi) 0.5px, transparent 0.6px);
  background-size:37px 37px, 53px 53px, 41px 41px, 61px 61px;
}

/* Bikini — motes drifting up, like something small is always swimming past. */
.wf-chrome-motes{
  opacity:0.3;
  background-image:
    radial-gradient(circle at 20% 80%, var(--wf-accent) 1.5px, transparent 2px),
    radial-gradient(circle at 70% 40%, var(--wf-info) 1px, transparent 1.6px),
    radial-gradient(circle at 45% 15%, var(--wf-accent) 1.2px, transparent 1.8px);
  background-size:180px 220px, 240px 260px, 200px 300px;
  animation:wf-drift 26s linear infinite;
}
@keyframes wf-drift{to{background-position:0 -220px, 0 -260px, 0 -300px}}

/* Eden — a soft shaft of morning light from the top-left. */
.wf-chrome-sunlight{
  background:
    radial-gradient(120% 80% at 8% -10%,
      color-mix(in oklch, var(--wf-warm) 16%, transparent) 0%,
      transparent 60%),
    radial-gradient(90% 60% at 100% 110%,
      color-mix(in oklch, var(--wf-accent) 9%, transparent) 0%,
      transparent 65%);
}

@media (prefers-reduced-motion: reduce){
  .wf-chrome{animation:none!important}
}
`;
