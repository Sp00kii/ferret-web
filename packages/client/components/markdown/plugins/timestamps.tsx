import { createEffect, createSignal, on, onMount } from "solid-js";

import { type Dayjs } from "dayjs";
import type { Handler } from "mdast-util-to-hast";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { dayjs, timeLocale } from "@revolt/i18n/dayjs";
import { useState } from "@revolt/state";

import { time as Time } from "../elements";

/**
 * Ferret mod: times follow your 12 / 24-hour setting. "hh:mm" was a 12-hour
 * clock without AM / PM, so 21:00 showed as 09:00.
 */
export function formatTimestamp(date: Dayjs, style: string) {
  switch (style) {
    case "t":
      return date.format("LT");
    case "T":
      return date.format("LTS");
    case "R":
      return date.fromNow();
    case "D":
      return date.format("LL");
    case "F":
      return `${date.format("dddd, LL")} ${date.format("LT")}`;
    default:
      return `${date.format("LL")} ${date.format("LT")}`;
  }
}

export function RenderTimestamp(props: { format: string; date: Dayjs }) {
  const { datePerDay } = useState();

  /**
   * Format a time string
   */
  function format() {
    return formatTimestamp(props.date, props.format);
  }

  // Signal for current value
  const [value, setValue] = createSignal(format());

  // Update if relative time & day changes
  onMount(() => {
    if (props.format === "R")
      createEffect(on(datePerDay, () => setValue(format())));
  });

  return (
    <time
      class={Time()}
      use:floating={{
        tooltip: {
          placement: "top",
          content: props.date.toString(),
        },
      }}
    >
      {value()}
    </time>
  );
}

/**
 * Regex for matching timestamps
 */
export const RE_TIMESTAMP = /<t:([0-9]+)(?::(\w))?>/g;

export const remarkTimestamps: Plugin = () => (tree) => {
  visit(
    tree,
    "text",
    (
      node: { type: "text"; value: string },
      idx,
      parent: { children: unknown[] },
    ) => {
      const elements = node.value.split(RE_TIMESTAMP);
      if (elements.length === 1) return; // no matches

      // Generate initial node
      const newNodes: (
        | { type: "text"; value: string }
        | {
            type: "timestamp";
            format: string;
            date: Dayjs;
          }
      )[] = [
        {
          type: "text",
          value: elements.shift()!,
        },
      ];

      // Process all timestamps
      for (let i = 0; i < elements.length / 3; i++) {
        // Process timestamp
        const date = dayjs
          .unix(parseInt(elements[i * 3]))
          .locale(timeLocale()[1]);

        // Insert components
        newNodes.push({
          type: "timestamp",
          format: elements[i * 3 + 1],
          date,
        });

        newNodes.push({
          type: "text",
          value: elements[i * 3 + 2],
        });
      }

      parent.children.splice(idx, 1, ...newNodes);
      return idx + newNodes.length;
    },
  );
};

export const timestampHandler: Handler = (h, node) => {
  return {
    type: "element" as const,
    tagName: "timestamp",
    children: [],
    properties: {
      format: node.format,
      date: node.date,
    },
  };
};
