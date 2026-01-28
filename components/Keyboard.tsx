
import React from 'react';
import { LetterStatus } from '../types';

interface KeyboardProps {
  guesses: string[];
  word: string;
  onKey: (key: string) => void;
}

const Keyboard: React.FC<KeyboardProps> = ({ guesses, word, onKey }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const getStatus = (key: string): LetterStatus => {
    let status: LetterStatus = 'empty';
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (word[i] === key) return 'correct';
          if (word.includes(key)) status = 'present';
          else if (status === 'empty') status = 'absent';
        }
      }
    }
    return status;
  };

  return (
    <div className="w-full max-w-lg space-y-2 select-none">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {row.map(key => {
            const status = getStatus(key);
            let bgColor = 'bg-slate-200 hover:bg-slate-300 text-slate-700';
            
            if (status === 'correct') bgColor = 'bg-green-500 text-white';
            else if (status === 'present') bgColor = 'bg-yellow-500 text-white';
            else if (status === 'absent') bgColor = 'bg-slate-400 text-white';

            const isSpecial = key === 'ENTER' || key === 'BACKSPACE';

            return (
              <button
                key={key}
                onClick={() => onKey(key)}
                className={`${bgColor} px-2 py-4 rounded font-bold text-sm min-w-[32px] md:min-w-[40px] flex-1 flex items-center justify-center transition-all active:scale-90 ${isSpecial ? 'flex-[1.5] text-[10px]' : ''}`}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
