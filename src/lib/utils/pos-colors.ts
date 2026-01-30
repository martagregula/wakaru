import type { PartOfSpeech } from "@/types";

const posColors: Record<PartOfSpeech, string> = {
  Noun: "bg-emerald-100 text-emerald-900",
  Verb: "bg-blue-100 text-blue-900",
  Adjective: "bg-amber-100 text-amber-900",
  Adverb: "bg-purple-100 text-purple-900",
  Particle: "bg-pink-100 text-pink-900",
  Conjunction: "bg-teal-100 text-teal-900",
  Interjection: "bg-orange-100 text-orange-900",
  Pronoun: "bg-lime-100 text-lime-900",
  Determiner: "bg-cyan-100 text-cyan-900",
  Preposition: "bg-indigo-100 text-indigo-900",
  Auxiliary: "bg-rose-100 text-rose-900",
  Other: "bg-slate-100 text-slate-900",
};

const getPosColor = (pos: PartOfSpeech) => posColors[pos] ?? posColors.Other;

export { posColors, getPosColor };
