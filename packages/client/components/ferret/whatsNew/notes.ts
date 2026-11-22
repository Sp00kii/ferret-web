/**
 * "What's new in Ferret" notes, newest first. The pop-up shows the entry
 * for the version that was just installed (and the About section can show
 * the latest one any time).
 */
export type WhatsNewItem = { icon: string; title: string; text: string };

export const WHATS_NEW: { version: string; items: WhatsNewItem[] }[] = [
  {
    version: "1.0.6",
    items: [
      {
        icon: "🗂️",
        title: "Tidier Ferret settings",
        text: "Ferret's settings now have tabs, and Stoat's Voice, Appearance and Notifications pages link straight to them.",
      },
      {
        icon: "🦦",
        title: "Ferret noises",
        text: "A new sound pack of dooks, hisses and squeaks for every sound, plus the Dook Party ringtone.",
      },
      {
        icon: "🔔",
        title: "Sounds on profiles",
        text: "Give someone their own ringtone or message sound right from their profile.",
      },
      {
        icon: "🎨",
        title: "Any accent colour",
        text: "Pick any colour you like; Ferret keeps text readable in every theme. Your app icon now shows on the taskbar and in the app too.",
      },
      {
        icon: "💾",
        title: "Settings backup",
        text: "Save all your Ferret settings and sounds to a file and restore them later (Settings → Ferret → App).",
      },
      {
        icon: "🖼️",
        title: "Cleaner GIF picker",
        text: "One favourite star per GIF and no more gibberish category names.",
      },
    ],
  },
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
      {
        icon: "⚡",
        title: "Handy extras",
        text: "Ctrl+K to jump anywhere, unread count on the taskbar, a zoom slider, and GIFs that stay still until you hover them if you prefer.",
      },
    ],
  },
];

export function notesFor(version: string) {
  return WHATS_NEW.find((entry) => entry.version === version);
}

export const latestNotes = () => WHATS_NEW[0];
