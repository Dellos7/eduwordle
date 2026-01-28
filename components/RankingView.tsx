
import React from 'react';
import { StudentResult } from '../types';

interface RankingViewProps {
  results: StudentResult[];
}

const RankingView: React.FC<RankingViewProps> = ({ results }) => {
  const correctResults = results.filter(r => r.isCorrect);

  const fastest = [...correctResults].sort((a, b) => a.timeTaken - b.timeTaken).slice(0, 3);
  const mostEfficient = [...correctResults].sort((a, b) => a.attempts - b.attempts || a.timeTaken - b.timeTaken).slice(0, 3);

  const Medals = ["🥇", "🥈", "🥉"];

  const RankingSection = ({ title, items, metric }: { title: string, items: StudentResult[], metric: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-wider">
        <span className="p-1 bg-yellow-100 rounded">🏆</span>
        {title}
      </h4>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-slate-400 text-center py-4 italic text-sm">Sin clasificados aún</p>
        ) : (
          items.map((res, i) => (
            <div key={i} className="flex items-center gap-4 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="text-3xl w-10 text-center">{Medals[i]}</div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 leading-tight">{res.name}</p>
                <p className="text-xs text-indigo-500 font-bold uppercase">
                  {metric === 'time' ? `${(res.timeTaken / 1000).toFixed(2)}s` : `${res.attempts} intentos`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <RankingSection title="Más Rápidos" items={fastest} metric="time" />
      <RankingSection title="Más Eficientes" items={mostEfficient} metric="attempts" />
      
      {results.length > 0 && correctResults.length < results.length && (
        <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
          ¡Gracias a todos los demás por participar! Seguíd intentándolo.
        </div>
      )}
    </div>
  );
};

export default RankingView;
