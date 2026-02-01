import type { PartOfSpeech } from "@/types";

const posColors: Record<PartOfSpeech, string> = {
  Noun: "bg-emerald-50 text-emerald-700",
  Verb: "bg-blue-50 text-blue-700",
  Adjective: "bg-amber-50 text-amber-700",
  Adverb: "bg-purple-50 text-purple-700",
  Particle: "bg-pink-50 text-pink-700",
  Conjunction: "bg-teal-50 text-teal-700",
  Interjection: "bg-orange-50 text-orange-700",
  Pronoun: "bg-lime-50 text-lime-700",
  Determiner: "bg-cyan-50 text-cyan-700",
  Preposition: "bg-indigo-50 text-indigo-700",
  Auxiliary: "bg-rose-50 text-rose-700",
  Other: "bg-slate-50 text-slate-700",
};

const getPosColor = (pos: PartOfSpeech) => posColors[pos] ?? posColors.Other;

export { posColors, getPosColor };
