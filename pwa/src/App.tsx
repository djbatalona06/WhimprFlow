import React, { useState } from "react";
import { c, font, type, ease } from "./tokens";
import { MicIcon, ClockIcon, ChartIcon, BookIcon, GearIcon } from "./components/icons";
import { RecordScreen } from "./screens/Record";
import { HistoryScreen } from "./screens/History";
import { InsightsScreen } from "./screens/Insights";
import { DictionaryScreen } from "./screens/Dictionary";
import { SettingsScreen } from "./screens/Settings";

type Tab = "record" | "history" | "insights" | "dictionary" | "settings";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: "record", label: "Record", Icon: MicIcon },
  { id: "history", label: "History", Icon: ClockIcon },
  { id: "insights", label: "Insights", Icon: ChartIcon },
  { id: "dictionary", label: "Words", Icon: BookIcon },
  { id: "settings", label: "Settings", Icon: GearIcon },
];

export function App() {
  const [tab, setTab] = useState<Tab>("record");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: 520,
        margin: "0 auto",
        background: c.bg,
      }}
    >
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "max(20px, env(safe-area-inset-top)) 18px 18px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tab === "record" && <RecordScreen />}
        {tab === "history" && <HistoryScreen />}
        {tab === "insights" && <InsightsScreen />}
        {tab === "dictionary" && <DictionaryScreen />}
        {tab === "settings" && <SettingsScreen />}
      </main>

      <nav
        style={{
          display: "flex",
          borderTop: `1px solid ${c.line}`,
          background: c.bgDeep,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              style={{
                flex: 1,
                appearance: "none",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "11px 0 13px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                color: active ? c.accent : c.textMute,
                transition: `color 160ms ${ease}`,
              }}
            >
              <Icon size={21} color={active ? c.accent : c.textMute} />
              <span style={{ fontSize: type.micro - 1, fontWeight: 600, fontFamily: font.ui, letterSpacing: 0.2 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
