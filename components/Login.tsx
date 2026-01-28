
import React, { useState } from 'react';
import { CONFIG } from '../config';

interface LoginProps {
  onProfessorLogin: (success: boolean) => void;
  onStudentJoin: (code: string, name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onProfessorLogin, onStudentJoin }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'professor'>('student');
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleProfessorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProfessorLogin(true);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) {
      setError('Nombre y código obligatorios');
      return;
    }
    onStudentJoin(roomCode, name);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="flex border-b">
        <button
          onClick={() => { setActiveTab('student'); setError(''); }}
          className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'student' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
        >
          Alumno/a
        </button>
        <button
          onClick={() => { setActiveTab('professor'); setError(''); }}
          className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'professor' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
        >
          Profesor/a
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'student' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tu Nombre</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carmen García" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código de Sala</label>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Ej. 12345" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-indigo-700 active:transform active:scale-95 transition-all">
              Entrar a la Sala
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-700 font-medium">
                Como profesor podrás crear palabras secretas y ver quién las resuelve más rápido en tiempo real.
              </p>
            </div>
            <button 
              onClick={handleProfessorSubmit}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-slate-900 active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">🏫</span> Crear Nueva Sala
            </button>
          </div>
        )}
        {error && <p className="mt-4 text-center text-red-500 text-sm font-semibold">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
