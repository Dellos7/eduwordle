
import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { GameState, PeerMessage, StudentResult } from '../types';
import RankingView from './RankingView';

declare const Peer: any;

const ProfessorDashboard: React.FC = () => {
  const [roomCode] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
  const [word, setWord] = useState('');
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

  useEffect(() => {
    // Inicializar PeerJS como HOST
    const peerId = CONFIG.PEER_PREFIX + roomCode;
    peerRef.current = new Peer(peerId);

    peerRef.current.on('open', (id: string) => {
      console.log('Sala abierta como host:', id);
    });

    peerRef.current.on('connection', (conn: any) => {
      connectionsRef.current.push(conn);
      
      conn.on('data', (data: PeerMessage) => {
        handleIncomingData(data, conn);
      });

      conn.on('open', () => {
        setConnectedStudents(prev => [...prev, conn.peer]);
        // Enviar estado actual al recién conectado
        syncStateWithConnection(conn);
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

  const handleIncomingData = (msg: PeerMessage, conn: any) => {
    if (msg.type === 'SUBMIT_RESULT') {
      const result: StudentResult = msg.payload;
      setGameState(prev => ({
        ...prev,
        results: [...prev.results, result]
      }));
    }
  };

  const syncStateWithConnection = (conn: any) => {
    const msg: PeerMessage = {
      type: 'GAME_START',
      payload: { 
        word: gameState.activeWord, 
        isActive: gameState.isActive,
        startTime: gameState.startTime
      }
    };
    conn.send(msg);
  };

  const broadcast = (msg: PeerMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const launchWord = () => {
    if (!word || word.length < 3) return;
    const cleanWord = word.trim().toUpperCase();
    const startTime = Date.now();
    
    const newState = {
      activeWord: cleanWord,
      isActive: true,
      startTime: startTime,
      endTime: null,
      results: []
    };
    
    setGameState(newState);
    broadcast({ 
      type: 'GAME_START', 
      payload: { word: cleanWord, isActive: true, startTime: startTime } 
    });
    setWord('');
  };

  const stopGame = () => {
    setGameState(prev => ({ ...prev, isActive: false, endTime: Date.now() }));
    broadcast({ type: 'GAME_END', payload: null });
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
          <h3 className="text-xl font-bold mb-4 text-slate-800">Lanzar nueva palabra</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={word}
              onChange={(e) => setWord(e.target.value.toUpperCase())}
              placeholder="Escribe la palabra secreta..." 
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono tracking-widest text-lg"
            />
            <button 
              onClick={launchWord}
              disabled={!word}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              ¡Lanzar!
            </button>
          </div>
          <p className="mt-2 text-slate-400 text-xs italic">* Los alumnos verán esta palabra como un reto Wordle.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs font-bold opacity-80 uppercase">Palabra activa</p>
              <h3 className="text-3xl font-black tracking-widest">{gameState.activeWord}</h3>
            </div>
            <div className="flex gap-2">
              {gameState.isActive ? (
                <button 
                  onClick={stopGame}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md"
                >
                  Finalizar Tiempo
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
