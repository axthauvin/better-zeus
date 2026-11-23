import PileGame from "./pile/PileGame.jsx";
import RunnerGame from "./runner/RunnerGame.jsx";
import { PileIcon, LundiIcon } from "./icons/GameIcons.jsx";

/**
 * Every game playable in game mode. To add one: build it on WeekBoard and
 * the shared session (see GameMode), then register it here.
 */
export const GAMES = [
  {
    id: "pile",
    title: "Pile de cours",
    tagline: "Empile tes cours sans déborder.",
    description:
      "Tes cours tombent sur ta semaine. Tourne-les, place-les, et remplis un créneau du lundi au vendredi pour le libérer.",
    Icon: PileIcon,
    Component: PileGame,
    controls: PileGame.controls,
  },
  {
    id: "lundi",
    title: "Survie au lundi",
    tagline: "Traverse ta semaine sans te faire coincer.",
    description:
      "Tu es l'heure qui passe. Saute tes cours, passe sous les réunions, franchis les changements de salle — et double saute les partiels.",
    Icon: LundiIcon,
    Component: RunnerGame,
    controls: RunnerGame.controls,
  },
];
