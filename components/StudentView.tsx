
import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { PeerMessage, LetterStatus, StudentResult, AwardsData } from '../types';
import WordleBoard from './WordleBoard';
import Keyboard from './Keyboard';
import RankingView from './RankingView';

declare const Peer: any;

interface StudentViewProps {
  roomCode: string;
  studentName: string;
}

const StudentView: React.FC<StudentViewProps> = ({ roomCode, studentName }) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [myResult, setMyResult] = useState<StudentResult | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [awards, setAwards] = useState<AwardsData | null>(null);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  useEffect(() => {
    peerRef.current = new Peer();

    peerRef.current.on('open', () => {
      const professorId = CONFIG.PEER_PREFIX + roomCode;
      const conn = peerRef.current.connect(professorId);
      connRef.current = conn;

      conn.on('open', () => {
        setConnectionStatus('connected');
      });

      conn.on('data', (data: PeerMessage) => {
        handleServerMessage(data);
      });

      conn.on('close', () => {
        setConnectionStatus('disconnected');
      });

      conn.on('error', () => {
        setConnectionStatus('error');
      });
    });

    return () => {
      peerRef.current?.destroy();
    };
  }, [roomCode]);

  const handleServerMessage = (msg: PeerMessage) => {
    switch (msg.type) {
      case 'GAME_START':
        if (msg.payload.isActive && msg.payload.word) {
          // Si ya estábamos en un juego con esta palabra, no reiniciamos
          setActiveWord(msg.payload.word);
          setStartTime(msg.payload.startTime);
          setGameActive(true);
          setAwards(null);
        } else {
          setActiveWord(null);
          setGameActive(false);
        }
        break;
      case 'GAME_END':
        setGameActive(false);
        break;
      case 'AWARDS':
        setAwards(msg.payload);
        break;
      case 'RESET':
        setActiveWord(null);
        setStartTime(null);
        setGameActive(false);
        setGuesses([]);
        setCurrentGuess('');
        setMyResult(null);
        setAwards(null);
        break;
    }
  };

  const handleKeyInput = (key: string) => {
    if (!gameActive || myResult || !activeWord) return;

    if (key === 'ENTER') {
      if (currentGuess.length === activeWord.length) {
        submitGuess();
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < activeWord.length && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const submitGuess = () => {
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    
    if (currentGuess === activeWord) {
      finishGame(true, newGuesses.length);
    } else if (newGuesses.length >= CONFIG.MAX_ATTEMPTS) {
      finishGame(false, newGuesses.length);
    }
    
    setCurrentGuess('');
  };

  const finishGame = (correct: boolean, attempts: number) => {
    const timeTaken = Date.now() - (startTime || Date.now());
    const result: StudentResult = {
      peerId: peerRef.current.id,
      name: studentName,
      attempts,
      timeTaken,
      timestamp: Date.now(),
      isCorrect: correct
    };
    
    setMyResult(result);
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'SUBMIT_RESULT', payload: result });
    }
  };

  const isWinner = awards && (
    awards.fastest.some(r => r.peerId === peerRef.current?.id) ||
    awards.mostEfficient.some(r => r.peerId === peerRef.current?.id)
  );

  if (connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold animate-pulse">Buscando sala del profesor...</p>
      </div>
    );
  }

  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className="text-center p-12 bg-red-50 rounded-2xl border border-red-200">
        <h3 className="text-xl font-bold text-red-600 mb-2">Error de Conexión</h3>
        <p className="text-red-500">No se pudo encontrar la sala <strong>{roomCode}</strong>. El profesor debe crear la sala primero.</p>
        <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg font-bold">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="w-full flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase">Estudiante</p>
          <p className="font-bold text-slate-800">{studentName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Sala</p>
          <p className="font-bold text-indigo-600">{roomCode}</p>
        </div>
      </div>

      {awards ? (
        <div className="w-full space-y-6 animate-in zoom-in duration-500">
          {isWinner && (
            <div className="bg-yellow-400 p-8 rounded-3xl text-center shadow-xl border-4 border-white animate-bounce">
              <span className="text-6xl block mb-4">🏆</span>
              <h2 className="text-3xl font-black text-yellow-900 uppercase">¡ERES UN CRACK!</h2>
              <p className="text-yellow-800 font-bold">Has quedado en el podio de la clase.</p>
            </div>
          )}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-xl font-black text-center mb-6 text-slate-800 uppercase tracking-widest">Podio de la Clase</h3>
            <RankingView results={[...awards.fastest, ...awards.mostEfficient]} />
          </div>
          <p className="text-center text-slate-400 font-medium italic">Espera a que el profesor lance otra palabra...</p>
        </div>
      ) : !activeWord ? (
        <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
          <div className="text-6xl mb-4 animate-bounce">🎨</div>
          <h2 className="text-2xl font-bold text-slate-700">Preparado para el reto...</h2>
          <p className="text-slate-500 max-w-xs">El profesor está preparando la siguiente palabra secreta. ¡Mantente alerta!</p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-8">
          <WordleBoard 
            word={activeWord} 
            guesses={guesses} 
            currentGuess={currentGuess} 
            maxAttempts={CONFIG.MAX_ATTEMPTS} 
          />
          
          {!myResult && gameActive ? (
            <Keyboard guesses={guesses} word={activeWord} onKey={handleKeyInput} />
          ) : (
            <div className={`p-6 rounded-2xl w-full max-w-md text-center shadow-lg border animate-in zoom-in duration-300 ${myResult?.isCorrect ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-600 text-white'}`}>
              <h3 className="text-2xl font-black mb-2">
                {myResult?.isCorrect ? '¡Enviado!' : '¡Tiempo agotado!'}
              </h3>
              <p className="opacity-90">
                {myResult?.isCorrect 
                  ? `Has resuelto "${activeWord}" en ${myResult.attempts} intentos. Esperando premios...` 
                  : `La palabra era: ${activeWord}`}
              </p>
              <div className="mt-4 pt-4 border-t border-white/20 text-sm font-medium flex items-center justify-center gap-2">
                <span className="animate-pulse">⏳</span> El profesor cerrará la ronda pronto.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentView;
