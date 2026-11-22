/**
 * "What's new in Ferret" notes, newest first. The pop-up shows the entry
 * for the version that was just installed (and the About section can show
 * the latest one any time).
 */
export type WhatsNewItem = { icon: string; title: string; text: string };

export const WHATS_NEW: { version: string; items: WhatsNewItem[] }[] = [
  {
    version: "1.0.5",
    items: [
      {
        icon: "🎙️",
        title: "Push to talk + mic sensitivity",
        text: "Hold a key or side mouse button to talk, even in games. Or let a noise gate keep keyboard clicks out.",
      },
      {
        icon: "⌨️",
        title: "Mute & deafen shortcuts",
        text: "Global shortcuts that work anywhere.",
      },
      {
        icon: "🥁",
        title: "Soundboard",
        text: "Ba-dum-tss, air horn, sad trombone and more in the call controls, plus your own uploaded sounds.",
      },
      {
        icon: "🪟",
        title: "Compact call window",
        text: "A small always-on-top card with who's talking while you're in another app. Turn it off in settings if you don't want it.",
      },
      {
        icon: "💬",
        title: "Reply from notifications",
        text: "New messages pop up in the corner and you can answer right there.",
      },
      {
        icon: "🔔",
        title: "Sounds for specific people",
        text: "Right-click someone → Ferret sounds… to give them their own ringtone or message sound.",
      },
      {
        icon: "🎨",
        title: "Themes, accents and app icons",
        text: "Midnight, Cream and High contrast themes, five accent colours and ten app icons, including albino and silver ferrets.",
      },
    ],
  },
];

export function notesFor(version: string) {
  return WHATS_NEW.find((entry) => entry.version === version);
}

export const latestNotes = () => WHATS_NEW[0];
