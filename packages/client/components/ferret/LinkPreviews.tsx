import {
  For,
  Show,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
} from "solid-js";

import type { Message, MessageEmbed, WebsiteEmbed } from "stoat.js";
import { styled } from "styled-system/jsx";

import { RenderAnchor } from "@revolt/markdown/plugins/anchors";
import { Text } from "@revolt/ui/components/design";
import { OverflowingText } from "@revolt/ui/components/utils";

import { useFerretSettings } from "./settings";

/** Up to this many previews per message */
const MAX_PER_MESSAGE = 3;

/** Give Stoat's own preview this long to arrive before making one */
const WAIT_FOR_STOAT_MS = 6000;

/** Stoat's own links get Stoat's own cards (invites, channels, messages) */
const STOAT_HOSTS =
  /(^|\.)(stoat\.chat|revolt\.chat|rvlt\.gg|stt\.gg|stoatusercontent\.com|revoltusercontent\.com)$/i;

/** Compare links loosely: no scheme, www., trailing slash or #part */
function normalise(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return `${host}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  } catch {
    return raw;
  }
}

/** Links in a message that could get a preview, like Discord picks them */
function linksIn(content: string) {
  const text = content
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/\|\|[\s\S]*?\|\|/g, " ") // spoilers
    .replace(/<https?:\/\/[^>\s]+>/gi, " "); // <link> means "no preview"
  const found: string[] = [];
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
    let link = match[0].replace(/[.,;:!?'"\]}]+$/, "");
    // a closing bracket that doesn't belong to the link
    if (link.endsWith(")") && !link.includes("(")) link = link.slice(0, -1);
    try {
      const url = new URL(link);
      if (STOAT_HOSTS.test(url.hostname)) continue;
    } catch {
      continue;
    }
    if (!found.some((other) => normalise(other) === normalise(link)))
      found.push(link);
    if (found.length >= MAX_PER_MESSAGE) break;
  }
  return found;
}

/** Whether Stoat already shows a preview for this link */
function coveredByStoat(embeds: MessageEmbed[] | undefined, link: string) {
  const target = normalise(link);
  return !!embeds?.some((embed) =>
    [(embed as { url?: string }).url, (embed as WebsiteEmbed).originalUrl].some(
      (url) => !!url && normalise(url) === target,
    ),
  );
}

/**
 * Discord-style previews, made by Ferret, for links Stoat's server couldn't
 * preview (some sites block it). Only you see them; nothing is sent to Stoat.
 */
export function LinkPreviews(props: { message: Message }) {
  if (!window.ferret) return null;
  const settings = useFerretSettings();

  const links = createMemo(() =>
    settings()?.linkPreviews && props.message.content
      ? linksIn(props.message.content)
      : [],
  );

  return (
    <For each={links()}>
      {(link) => <LinkCard link={link} message={props.message} />}
    </For>
  );
}

function LinkCard(props: { link: string; message: Message }) {
  // new messages: let Stoat's own preview arrive first
  const age = Date.now() - props.message.createdAt.getTime();
  const [ready, setReady] = createSignal(age >= WAIT_FOR_STOAT_MS);
  if (!ready()) {
    const timer = setTimeout(() => setReady(true), WAIT_FOR_STOAT_MS - age);
    onCleanup(() => clearTimeout(timer));
  }

  const covered = () => coveredByStoat(props.message.embeds, props.link);
  const [preview] = createResource(
    () => ready() && !covered() && props.link,
    (link) => window.ferret!.linkPreview(link),
  );

  return (
    <Show when={!covered() && preview()}>
      {(card) => (
        <Base
          style={{
            "border-color": card().colour ?? "var(--md-sys-color-primary)",
          }}
        >
          <Column>
            <OverflowingText>
              <Text class="label" size="small">
                {card().siteName}
              </Text>
            </OverflowingText>
            <Show when={card().title}>
              <Title>
                <RenderAnchor href={props.link}>{card().title}</RenderAnchor>
              </Title>
            </Show>
            <Show when={card().description}>
              <Description>{card().description}</Description>
            </Show>
            <Show when={card().image && card().largeImage}>
              <LargeImage
                src={card().image}
                loading="lazy"
                draggable={false}
                referrerpolicy="no-referrer"
                onError={(event) =>
                  (event.currentTarget.style.display = "none")
                }
              />
            </Show>
          </Column>
          <Show when={card().image && !card().largeImage}>
            <SmallImage
              src={card().image}
              loading="lazy"
              draggable={false}
              referrerpolicy="no-referrer"
              onError={(event) => (event.currentTarget.style.display = "none")}
            />
          </Show>
        </Base>
      )}
    </Show>
  );
}

const Base = styled("div", {
  base: {
    width: "fit-content",
    maxWidth: "calc(min(100%, 432px))",
    display: "flex",
    gap: "var(--gap-md)",
    marginBlock: "2px",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
    borderInlineStart: "4px solid",
  },
});

const Column = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
});

const Title = styled("div", {
  base: {
    fontSize: "15px",
    fontWeight: 600,
    "& a": { color: "var(--md-sys-color-primary) !important" },
  },
});

const Description = styled("div", {
  base: {
    fontSize: "13px",
    lineHeight: 1.35,
    lineClamp: 4,
    wordWrap: "break-word",
  },
});

const LargeImage = styled("img", {
  base: {
    marginTop: "6px",
    maxWidth: "100%",
    maxHeight: "300px",
    objectFit: "contain",
    borderRadius: "var(--borderRadius-md)",
    alignSelf: "flex-start",
  },
});

const SmallImage = styled("img", {
  base: {
    width: "80px",
    height: "80px",
    flexShrink: 0,
    objectFit: "cover",
    borderRadius: "var(--borderRadius-md)",
  },
});
