
import React from 'react';
import { LetterStatus } from '../types';

interface WordleBoardProps {
  word: string;
  guesses: string[];
  currentGuess: string;
  maxAttempts: number;
}

const WordleBoard: React.FC<WordleBoardProps> = ({ word, guesses, currentGuess, maxAttempts }) => {
  const getLetterStatus = (letter: string, index: number, guess: string): LetterStatus => {
    if (guess[index] === word[index]) return 'correct';
    if (word.includes(letter)) return 'present';
    return 'absent';
  };

  const rows = Array.from({ length: maxAttempts });

  return (
    <div className="grid gap-2 mb-4">
      {rows.map((_, i) => {
        const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
        const isSubmitted = i < guesses.length;
        
        return (
          <div key={i} className="flex gap-2 justify-center">
            {Array.from({ length: word.length }).map((_, j) => {
              const letter = guess[j] || '';
              const status = isSubmitted ? getLetterStatus(letter, j, guess) : 'empty';
              
              let bgColor = 'bg-white border-slate-300';
              let textColor = 'text-slate-800';
              let borderColor = 'border-2';

              if (status === 'correct') {
                bgColor = 'bg-green-500 border-green-500';
                textColor = 'text-white';
              } else if (status === 'present') {
                bgColor = 'bg-yellow-500 border-yellow-500';
                textColor = 'text-white';
              } else if (status === 'absent') {
                bgColor = 'bg-slate-400 border-slate-400';
                textColor = 'text-white';
              } else if (letter) {
                borderColor = 'border-slate-800 scale-105';
              }

              return (
                <div 
                  key={j} 
                  className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl font-black rounded-lg transition-all duration-300 ${bgColor} ${textColor} ${borderColor} ${isSubmitted ? 'animate-flip' : ''}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default WordleBoard;
