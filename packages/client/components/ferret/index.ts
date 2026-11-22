import { installNicknames } from "./nicknames";

// private nicknames apply everywhere names are shown
installNicknames();

export { FerretBadge } from "./badge";
export type { FerretBridge, FerretSettings } from "./bridge";
export { FerretDiagnostics } from "./diagnostics/FerretDiagnostics";
export { FerretSettings as FerretSettingsPage } from "./FerretSettings";
export { IncomingCalls } from "./IncomingCalls";
export { FerretMotion } from "./motion/FerretMotion";
export { FerretNavigation } from "./Navigation";
export { FerretToastActions } from "./notifications/toasts";
export { QuickSwitcher } from "./QuickSwitcher";
export { useFerretSettings } from "./settings";
export { ConnectionQualityBadge } from "./voice/ConnectionQuality";
export { followPreferredDevices } from "./voice/devices";
export { FerretVoice } from "./voice/FerretVoice";
export { SoundboardButton } from "./voice/SoundboardButton";
export { WhatsNew } from "./whatsNew/WhatsNew";
