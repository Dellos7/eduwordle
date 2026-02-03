
import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { GameState, PeerMessage, StudentResult, AwardsData } from '../types';
import RankingView from './RankingView';

declare const Peer: any;

const ProfessorDashboard: React.FC = () => {
  const [roomCode] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
  const [word, setWord] = useState('');
  const [showInputWord, setShowInputWord] = useState(true);
  const [showActiveWord, setShowActiveWord] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    activeWord: null,
    isActive: false,
    startTime: null,
    endTime: null,
    results: []
  });
  const [connectedStudents, setConnectedStudents] = useState<string[]>([]);
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<any[]>([]);

  // Referencia actualizada para que los callbacks de Peer vean el estado correcto
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const peerId = CONFIG.PEER_PREFIX + roomCode;
    peerRef.current = new Peer(peerId);

    peerRef.current.on('open', (id: string) => {
      console.log('Sala abierta como host:', id);
    });

    peerRef.current.on('connection', (conn: any) => {
      connectionsRef.current.push(conn);
      
      conn.on('data', (data: PeerMessage) => {
        if (data.type === 'SUBMIT_RESULT') {
          const result: StudentResult = data.payload;
          setGameState(prev => ({
            ...prev,
            results: [...prev.results, result]
          }));
        }
      });

      conn.on('open', () => {
        setConnectedStudents(prev => [...prev, conn.peer]);
        // Sincronizar estado inmediatamente al conectar
        const current = gameStateRef.current;
        conn.send({
          type: 'GAME_START',
          payload: { 
            word: current.activeWord, 
            isActive: current.isActive,
            startTime: current.startTime
          }
        });
      });

      conn.on('close', () => {
        setConnectedStudents(prev => prev.filter(p => p !== conn.peer));
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      });
    });

    return () => {
      peerRef.current?.destroy();
    };
  }, [roomCode]);

  const broadcast = (msg: PeerMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const launchWord = () => {
    if (!word || word.length < 3 || word.length > 5) return;
    const cleanWord = word.trim().toUpperCase();
    const startTime = Date.now();
    
    setGameState(prev => ({
      ...prev,
      activeWord: cleanWord,
      isActive: true,
      startTime: startTime,
      endTime: null,
      results: []
    }));

    broadcast({ 
      type: 'GAME_START', 
      payload: { word: cleanWord, isActive: true, startTime: startTime } 
    });
    setWord('');
    setShowActiveWord(false); // Por defecto oculta al lanzar por seguridad
  };

  const stopGame = () => {
    const correctResults = gameState.results.filter(r => r.isCorrect);
    const awards: AwardsData = {
      fastest: [...correctResults].sort((a, b) => a.timeTaken - b.timeTaken).slice(0, 3),
      mostEfficient: [...correctResults].sort((a, b) => a.attempts - b.attempts || a.timeTaken - b.timeTaken).slice(0, 3)
    };

    setGameState(prev => ({ ...prev, isActive: false, endTime: Date.now() }));
    
    // Primero enviamos el fin de juego y luego los premios
    broadcast({ type: 'GAME_END', payload: null });
    setTimeout(() => {
      broadcast({ type: 'AWARDS', payload: awards });
    }, 500);
  };

  const resetGame = () => {
    setGameState({
      activeWord: null,
      isActive: false,
      startTime: null,
      endTime: null,
      results: []
    });
    broadcast({ type: 'RESET', payload: null });
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Código de Sala</h2>
          <p className="text-4xl font-black text-indigo-600">{roomCode}</p>
        </div>
        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Alumnado conectado</p>
          <p className="text-2xl font-bold text-slate-800">{connectedStudents.length}</p>
        </div>
      </div>

      {!gameState.activeWord ? (
        <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-dashed border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Lanzar nueva palabra (3-5 letras)</h3>
            <button 
              onClick={() => setShowInputWord(!showInputWord)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
              title={showInputWord ? "Ocultar mientras escribo" : "Mostrar lo que escribo"}
            >
              {showInputWord ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); launchWord(); }} className="flex gap-2">
            <input 
              type={showInputWord ? "text" : "password"} 
              value={word}
              maxLength={5}
              onChange={(e) => setWord(e.target.value.toUpperCase().replace(/[^A-ZÑ]/g, ''))}
              placeholder="Ej. CIELO" 
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono tracking-widest text-lg"
            />
            <button 
              type="submit"
              disabled={word.length < 3}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              ¡Lanzar!
            </button>
          </form>
          <p className="mt-2 text-slate-400 text-xs italic">* Máximo 5 letras. Los alumnos verán esta palabra como un reto Wordle.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-bold opacity-80 uppercase">Palabra activa</p>
                <h3 className="text-3xl font-black tracking-widest">
                  {showActiveWord ? gameState.activeWord : '•'.repeat(gameState.activeWord?.length || 0)}
                </h3>
              </div>
              <button 
                onClick={() => setShowActiveWord(!showActiveWord)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors mt-4"
                title={showActiveWord ? "Ocultar palabra" : "Mostrar palabra"}
              >
                {showActiveWord ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            <div className="flex gap-2">
              {gameState.isActive ? (
                <button 
                  onClick={stopGame}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2"
                >
                  🛑 Finalizar Tiempo y Premiar
                </button>
              ) : (
                <button 
                  onClick={resetGame}
                  className="bg-white text-indigo-600 hover:bg-slate-100 px-6 py-2 rounded-lg font-bold transition-all shadow-md"
                >
                  Nueva Palabra
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Resultados en tiempo real ({gameState.results.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {gameState.results.length === 0 ? (
                  <p className="text-slate-400 text-center py-8 italic">Esperando respuestas...</p>
                ) : (
                  gameState.results.sort((a,b) => a.timestamp - b.timestamp).map((res, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700">{res.name}</p>
                        <p className="text-xs text-slate-400">{(res.timeTaken / 1000).toFixed(2)}s • {res.attempts} intentos</p>
                      </div>
                      <div className={res.isCorrect ? "text-green-500" : "text-red-500"}>
                        {res.isCorrect ? "✓ Resuelto" : "✗ Fallido"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {(!gameState.isActive || gameState.results.length > 0) && (
              <RankingView results={gameState.results} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;
