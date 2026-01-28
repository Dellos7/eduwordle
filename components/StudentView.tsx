
import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { PeerMessage, LetterStatus, StudentResult } from '../types';
import WordleBoard from './WordleBoard';
import Keyboard from './Keyboard';

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
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  useEffect(() => {
    // Conectar al Peer del Profesor
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
          startNewGame(msg.payload.word, msg.payload.startTime);
        } else {
          setActiveWord(null);
          setGameActive(false);
        }
        break;
      case 'GAME_END':
        setGameActive(false);
        break;
      case 'RESET':
        resetInternalState();
        break;
    }
  };

  const startNewGame = (word: string, sTime: number) => {
    setActiveWord(word);
    setStartTime(sTime);
    setGameActive(true);
    setGuesses([]);
    setCurrentGuess('');
    setMyResult(null);
  };

  const resetInternalState = () => {
    setActiveWord(null);
    setStartTime(null);
    setGameActive(false);
    setGuesses([]);
    setCurrentGuess('');
    setMyResult(null);
  };

  const handleKeyInput = (key: string) => {
    if (!gameActive || myResult) return;
    if (!activeWord) return;

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

  if (connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold animate-pulse">Conectando con el profesor...</p>
      </div>
    );
  }

  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className="text-center p-12 bg-red-50 rounded-2xl border border-red-200">
        <h3 className="text-xl font-bold text-red-600 mb-2">Error de Conexión</h3>
        <p className="text-red-500">No se pudo encontrar la sala <strong>{roomCode}</strong>. Asegúrate de que el profesor ha creado la sala.</p>
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

      {!activeWord ? (
        <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-slate-700">Esperando al profesor...</h2>
          <p className="text-slate-500 max-w-xs">En cuanto el profesor lance una palabra, aparecerá aquí para que puedas resolverla.</p>
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
                {myResult?.isCorrect ? '¡Felicidades!' : '¡Buen intento!'}
              </h3>
              <p className="opacity-90">
                {myResult?.isCorrect 
                  ? `Has resuelto la palabra en ${myResult.attempts} intentos y ${(myResult.timeTaken / 1000).toFixed(2)} segundos.` 
                  : `La palabra era: ${activeWord}`}
              </p>
              <div className="mt-4 pt-4 border-t border-white/20 text-sm font-medium">
                Espera a que el profesor inicie una nueva ronda.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentView;
