import { Show } from "solid-js";
import { Portal } from "solid-js/web";

import { rolePreview, setRolePreview } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Banner while you "view a server as a role" (from the role editor): says
 * which server and role, and stops the preview.
 */
export function RolePreviewBanner() {
  if (!window.ferret) return null;
  const client = useClient();

  const label = () => {
    const preview = rolePreview();
    if (!preview) return undefined;
    const server = client()?.servers.get(preview.serverId);
    const roles = preview.roleIds
      .map((id) => server?.roles?.get(id)?.name)
      .filter(Boolean)
      .join(", ");
    return `Viewing ${server?.name ?? "this server"} as ${roles || "@everyone"}`;
  };

  return (
    <Show when={label()}>
      <Portal>
        <Banner role="status">
          <Symbol size={18}>visibility</Symbol>
          <span>{label()}</span>
          <small>Only you see this</small>
          <button type="button" onClick={() => setRolePreview(undefined)}>
            Stop
          </button>
        </Banner>
      </Portal>
    </Show>
  );
}

const Banner = styled("div", {
  base: {
    position: "fixed",
    top: "calc(var(--ferret-titlebar-height, 0px) + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px 6px 14px",
    borderRadius: "999px",
    fontWeight: 600,
    color:
      "var(--md-sys-color-on-tertiary-container, var(--md-sys-color-on-primary-container))",
    background:
      "var(--md-sys-color-tertiary-container, var(--md-sys-color-primary-container))",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
    "& small": { fontWeight: 400, opacity: 0.8 },
    "& button": {
      padding: "4px 12px",
      border: "none",
      borderRadius: "999px",
      cursor: "pointer",
      fontWeight: 600,
      color: "var(--md-sys-color-on-primary)",
      background: "var(--md-sys-color-primary)",
    },
  },
});
