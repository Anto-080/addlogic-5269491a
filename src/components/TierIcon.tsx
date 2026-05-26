// Stylised, simple, non-emoji SVG icons for each tier. One unified visual style:
// flat 2px stroke (currentColor), 24x24 viewBox, no fill — minimal & clean like the
// smiley/ghost in the Availability toggle.

type Props = { tierId: number; size?: number; className?: string };

const ICONS: Record<number, JSX.Element> = {
  // 1 — Biological / DNA helix
  1: (
    <>
      <path d="M7 3c0 6 10 6 10 12s-10 6-10 12" />
      <path d="M17 3c0 6-10 6-10 12s10 6 10 12" />
      <path d="M9 7h6M9 11h6M9 17h6M9 21h6" />
    </>
  ),
  // 2 — Biochem / flask
  2: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3" />
      <path d="M7.5 14h9" />
    </>
  ),
  // 3 — Sci research / atom
  3: (
    <>
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </>
  ),
  // 4 — Ecology / leaf
  4: (
    <>
      <path d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16Z" />
      <path d="M4 20c4-4 8-7 16-16" />
    </>
  ),
  // 5 — Finance / chart
  5: (
    <>
      <path d="M3 21h18" />
      <rect x="5" y="13" width="3" height="8" />
      <rect x="10.5" y="9" width="3" height="12" />
      <rect x="16" y="5" width="3" height="16" />
    </>
  ),
  // 6 — Tech / circuit chip
  6: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <path d="M9 9h6v6H9z" />
      <path d="M3 10h3M3 14h3M18 10h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3" />
    </>
  ),
  // 7 — Art / palette
  7: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.5 1.5-1.2 0-1.5-1.5-1.8-1.5-3.3 0-1.4 1.2-2.5 2.6-2.5H17a4 4 0 0 0 4-4 9 9 0 0 0-9-9Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7.5" r="1" />
      <circle cx="14" cy="7" r="1" />
      <circle cx="17" cy="10" r="1" />
    </>
  ),
  // 8 — Global news / globe
  8: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18Z" />
    </>
  ),
  // 9 — Entertainment / film clapper
  9: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="1" />
      <path d="M3 9l3-5h3l-2 5M9 9l3-5h3l-2 5M15 9l3-5h3l-2 5" />
    </>
  ),
  // 10 — Food / fork & spoon
  10: (
    <>
      <path d="M7 3v8a2 2 0 0 0 2 2v8" />
      <path d="M5 3v6M9 3v6" />
      <path d="M16 3c-2 0-3 2-3 5s1 5 3 5v8" />
    </>
  ),
  // 11 — Real estate / house
  11: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v11h14V10" />
      <rect x="10" y="14" width="4" height="7" />
    </>
  ),
  // 12 — Personal shopping / bag
  12: (
    <>
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  // 13 — Personal care / lipstick
  13: (
    <>
      <path d="M9 3l3-1 3 1v5H9V3Z" />
      <rect x="8" y="8" width="8" height="13" rx="1" />
    </>
  ),
  // 14 — Clothes / t-shirt
  14: (
    <>
      <path d="M6 5l3-2h6l3 2 3 3-3 3v10H6V11L3 8l3-3Z" />
    </>
  ),
  // 15 — Sports / ball
  15: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5 6c4 3 10 3 14 0M5 18c4-3 10-3 14 0" />
    </>
  ),
  // 16 — Betting / dice
  16: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1.2" />
      <circle cx="16" cy="8" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="8" cy="16" r="1.2" />
      <circle cx="16" cy="16" r="1.2" />
    </>
  ),
  // 17 — Adult / no-entry
  17: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 12h12" />
    </>
  ),
  // 18 — Tourism & Travel / backpack
  18: (
    <>
      <path d="M9 3h6v3H9z" />
      <path d="M6 8c0-1 1-2 3-2h6c2 0 3 1 3 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Z" />
      <path d="M9 13h6" />
      <path d="M10 16h4" />
    </>
  ),
  // 19 — Sciences / test tube
  19: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v15a2 2 0 0 0 4 0V3" />
      <path d="M10 12h4" />
    </>
  ),
  // 20 — Energy / lightning bolt
  20: (
    <>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" />
    </>
  ),
  // 21 — Women's Interests / venus symbol
  21: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v8" />
      <path d="M9 19h6" />
    </>
  ),
};

export function TierIcon({ tierId, size = 24, className }: Props) {
  const node = ICONS[tierId] ?? ICONS[3];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {node}
    </svg>
  );
}
