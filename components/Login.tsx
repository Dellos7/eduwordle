
import React, { useState } from 'react';
import { CONFIG } from '../config';

interface LoginProps {
  onProfessorLogin: (success: boolean) => void;
  onStudentJoin: (code: string, name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onProfessorLogin, onStudentJoin }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'professor'>('student');
  const [password, setPassword] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleProfessorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CONFIG.PROFESSOR_PASSWORD) {
      onProfessorLogin(true);
    } else {
      setError('Contraseña incorrecta');
    }
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código de Sala</label>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="12345" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-indigo-700 active:transform active:scale-95 transition-all">
              Entrar a la Sala
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfessorSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña de Profesor</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-slate-900 active:transform active:scale-95 transition-all">
              Acceder al Panel
            </button>
          </form>
        )}
        {error && <p className="mt-4 text-center text-red-500 text-sm font-semibold">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
