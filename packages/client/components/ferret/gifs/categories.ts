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

/** mixed-case-in-the-middle ("OcIOBa") or digits = an id, not a name */
function looksLikeId(title: string) {
  if (/\d/.test(title)) return true;
  return title
    .split(/\s+/)
    .some((word) => /[a-z]/.test(word) && /[A-Z]/.test(word.slice(1)));
}

export function cleanGifCategories(categories: GifCategory[]): GifCategory[] {
  const real = categories.filter(
    (category) => category.title?.trim() && !looksLikeId(category.title),
  );
  const have = new Set(real.map((category) => category.title.toLowerCase()));
  return [
    ...real,
    ...CURATED.filter((title) => !have.has(title.toLowerCase())).map(
      (title) => ({ title, image: "" }),
    ),
  ];
}
