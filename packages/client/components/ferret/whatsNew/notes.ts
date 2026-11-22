/**
 * "What's new in Ferret" notes, newest first. The pop-up shows the entry
 * for the version that was just installed (and the About section can show
 * the latest one any time).
 */
export type WhatsNewItem = { icon: string; title: string; text: string };

export const WHATS_NEW: { version: string; items: WhatsNewItem[] }[] = [
  {
    version: "1.0.11",
    items: [
      {
        icon: "♿",
        title: "Accessibility in one place",
        text: "Settings → Ferret → Appearance → Accessibility: zoom, text size, a readable font (incl. OpenDyslexic), underlined links, reduce motion, paused GIFs and high contrast.",
      },
    ],
  },
  {
    version: "1.0.10",
    items: [
      {
        icon: "🎭",
        title: "Personas",
        text: "Post with another name and picture for role-play, using Stoat's masquerade. Use the mask button in the message box (where the server allows it).",
      },
    ],
  },
  {
    version: "1.0.9",
    items: [
      {
        icon: "🔊",
        title: "Pick your screen share sound",
        text: "Share only the app you're streaming, or everything except Ferret so friends don't hear themselves echo. Needs Windows 11; pick it when you start sharing.",
      },
    ],
  },
  {
    version: "1.0.8",
    items: [
      {
        icon: "🔗",
        title: "Previews for every link",
        text: "Links that Stoat can't preview get a Discord-style card with the title, description and picture. Turn it off in Settings → Ferret → Appearance.",
      },
      {
        icon: "🏷️",
        title: "Private nicknames",
        text: "Give friends a nickname only you see, shown everywhere in Ferret. Right-click someone → Ferret nickname & sounds…",
      },
      {
        icon: "🔉",
        title: "Soundboard volume per person",
        text: "Turn one person's soundboard down without muting it, from their profile or Settings → Ferret.",
      },
      {
        icon: "🖱️",
        title: "Middle-click and ferret:// links",
        text: "Middle-clicking a reply or search result opens it inside Ferret, and ferret:// links now open the right page.",
      },
      {
        icon: "🖥️",
        title: "No surprise desktop shortcut",
        text: "Updates no longer put the desktop shortcut back after you deleted it.",
      },
    ],
  },
  {
    version: "1.0.7",
    items: [
      {
        icon: "🔇",
        title: "Control other people's soundboards",
        text: "Turn other people's soundboard clips down or off, or mute one person's soundboard from their profile. Works for clips sent from Ferret 1.0.7 or newer.",
      },
      {
        icon: "⏹️",
        title: "Stop sounds",
        text: "A Stop button for your soundboard clip, and a Stop sound button for any longer sound. The volume slider now works while a clip plays.",
      },
      {
        icon: "♾️",
        title: "No soundboard time limit",
        text: "Your own soundboard sounds play in full instead of being cut off after 15 seconds.",
      },
      {
        icon: "🎧",
        title: "Clips on your headset",
        text: "You hear your own soundboard clips on the same speakers or headset as the call. Long custom alert sounds stop after 5 seconds.",
      },
    ],
  },
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
        text: "A new sound pack built from the Dook chirp, with its own pattern for every alert: dook-dook for messages, rising dooks when someone joins, plus the Dook Party ringtone.",
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
        icon: "🪟",
        title: "Window buttons in settings",
        text: "Minimise, maximise and close no longer disappear while settings or a dialog is open.",
      },
      {
        icon: "🖼️",
        title: "Cleaner GIF picker",
        text: "One favourite star per GIF and no more gibberish category names.",
      },
      {
        icon: "🥁",
        title: "Soundboard fixed",
        text: "The soundboard panel now opens above the call buttons, has its own volume slider, and Happy dook and Boop sound like they should.",
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
