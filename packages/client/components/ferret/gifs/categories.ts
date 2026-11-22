import { logDiagnostic } from "../diagnostics/recorder";

type GifCategory = { title: string; image: string };

/**
 * Gifbox's /categories feed includes entries titled with random GIF ids
 * ("OcIOBa", "pybbZQ"); clicking one searches for that gibberish. These are
 * the real search terms Gifbox's own website uses, plus a couple of ours.
 */
const CURATED = [
  "Happy",
  "Love",
  "Excited",
  "Dancing",
  "Crying",
  "Reactions",
  "Meme",
  "Cute",
  "Ferret",
  "Cat",
  "Dog",
  "Anime",
  "Gaming",
  "Music",
  "Food",
  "Sports",
];

/**
 * Keep only names that read like words: "Happy", "Thumbs up", "LOL",
 * "Good morning". Ids mix upper and lower case inside a word ("OcIOBa",
 * "pybbZQ") or contain digits, so they fail.
 */
const WORD = /^(?:[A-Z]?[a-z]+|[A-Z]{2,5})(?:['&-]?[a-z]+)*$/;

export function isRealCategoryName(title: string) {
  const words = title.trim().split(/\s+/);
  return words.length > 0 && words.every((word) => WORD.test(word));
}

export function cleanGifCategories(categories: GifCategory[]): GifCategory[] {
  const real = categories.filter(
    (category) =>
      typeof category.title === "string" && isRealCategoryName(category.title),
  );
  const hidden = categories.length - real.length;
  if (hidden) logDiagnostic("gifs", `hid ${hidden} id-named GIF categories`);
  const have = new Set(real.map((category) => category.title.toLowerCase()));
  return [
    ...real,
    ...CURATED.filter((title) => !have.has(title.toLowerCase())).map(
      (title) => ({ title, image: "" }),
    ),
  ];
}
