// Minimal inline SVG icons for the bottom nav + actions. Stroke-based, currentColor.

type P = { size?: number; color?: string };
const base = (size: number, color: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const MicIcon = ({ size = 22, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <path d="M12 17v4" />
  </svg>
);
export const ClockIcon = ({ size = 22, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const ChartIcon = ({ size = 22, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </svg>
);
export const BookIcon = ({ size = 22, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M19 3v18" />
  </svg>
);
export const GearIcon = ({ size = 22, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 2h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 22h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z" />
  </svg>
);
export const CopyIcon = ({ size = 18, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);
export const ShareIcon = ({ size = 18, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <path d="M12 3v13" />
    <path d="M8 7l4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);
export const NoteIcon = ({ size = 18, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <path d="M5 3h14v18l-4-3-3 3-3-3-4 3z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);
export const WebhookIcon = ({ size = 18, color = "currentColor" }: P) => (
  <svg {...base(size, color)}>
    <path d="M6 8a4 4 0 1 1 6 3.5L9 17" />
    <path d="M18 12a4 4 0 1 1-4 4H9" />
    <circle cx="9" cy="18" r="1.5" />
  </svg>
);
