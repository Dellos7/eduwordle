
import React, { useState, useEffect } from 'react';
import { CONFIG } from './config';
import { Role } from './types';
import Login from './components/Login';
import ProfessorDashboard from './components/ProfessorDashboard';
import StudentView from './components/StudentView';

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('NONE');
  const [roomCode, setRoomCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');

  // Sencilla gestión de navegación/roles
  const handleProfessorLogin = (success: boolean) => {
    if (success) setRole('PROFESSOR');
  };

  const handleStudentJoin = (code: string, name: string) => {
    setRoomCode(code);
    setStudentName(name);
    setRole('STUDENT');
  };

  const reset = () => {
    setRole('NONE');
    setRoomCode('');
    setStudentName('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-5xl mx-auto">
      <header className="w-full flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-indigo-600 flex items-center gap-2">
            <span className="bg-indigo-600 text-white px-2 py-1 rounded shadow-sm">EDU</span>
            WORDLE {CONFIG.VERSION}
          </h1>
          <p className="text-sm text-slate-500 font-medium">Aprendizaje en tiempo real</p>
        </div>
        {role !== 'NONE' && (
          <button 
            onClick={reset}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-500 transition-colors"
          >
            Salir
          </button>
        )}
      </header>

      <main className="w-full flex-1 flex flex-col items-center">
        {role === 'NONE' && (
          <Login 
            onProfessorLogin={handleProfessorLogin} 
            onStudentJoin={handleStudentJoin} 
          />
        )}

        {role === 'PROFESSOR' && (
          <ProfessorDashboard />
        )}

        {role === 'STUDENT' && (
          <StudentView roomCode={roomCode} studentName={studentName} />
        )}
      </main>

      <footer className="mt-12 text-slate-400 text-xs text-center">
        &copy; 2024 EDUWORDLE 7.0 - Una herramienta pedagógica para el aula moderna.
      </footer>
    </div>
  );
};

export default App;
