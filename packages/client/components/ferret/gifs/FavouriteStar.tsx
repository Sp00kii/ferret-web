import type { WebsiteEmbed } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
// direct path: this is used inside @revolt/ui itself (GIF picker)
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Star in the corner of a GIF in the picker: favourite / unfavourite it
 * without sending it first and right-clicking it in chat.
 */
export function FavouriteStar(props: { embed: WebsiteEmbed }) {
  const { favourites } = useState();
  const active = () => favourites.hasGif(props.embed);

  return (
    <Star
      type="button"
      active={active()}
      aria-label={active() ? "Remove from favourites" : "Add to favourites"}
      title={active() ? "Remove from favourites" : "Add to favourites"}
      onMouseDown={(e) => {
        // keep focus in the message box, like the rest of the picker
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        favourites.toggleGif(props.embed);
      }}
    >
      <Symbol size={18} fill={active()}>
        star
      </Symbol>
    </Star>
  );
}

const Star = styled("button", {
  base: {
    position: "absolute",
    top: "6px",
    right: "6px",
    zIndex: 2,
    width: "30px",
    height: "30px",
    display: "grid",
    placeItems: "center",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    background: "rgba(0, 0, 0, 0.55)",
    color: "white",
    opacity: 0.85,
    transition: "transform 120ms ease, opacity 120ms ease",
    "&:hover": { opacity: 1, transform: "scale(1.1)" },
  },
  variants: {
    active: {
      true: { color: "var(--ferret-accent, #F07835)", opacity: 1 },
      false: {},
    },
  },
});
