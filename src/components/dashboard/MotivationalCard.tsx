import { useMemo } from "react";

const PHRASES = [
  "Cada dia é um novo passo na sua jornada. Você é mais forte do que imagina. 💪",
  "Cuide do seu corpo e da sua mente. Você merece esse cuidado. 🌸",
  "A esperança é a força que nos move. Continue acreditando. ✨",
  "Respire fundo. Você está no caminho certo e não está sozinha. 🤍",
  "Pequenos progressos ainda são progressos. Celebre cada conquista. 🌻",
];

export function MotivationalCard() {
  const phrase = useMemo(() => PHRASES[Math.floor(Math.random() * PHRASES.length)], []);

  return (
    <div className="rounded-2xl bg-[#FDF2F4] px-4 py-3">
      <p className="text-sm text-[#85666D] leading-5 italic">{phrase}</p>
    </div>
  );
}
