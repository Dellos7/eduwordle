
export type Role = 'PROFESSOR' | 'STUDENT' | 'NONE';

export interface GameState {
  activeWord: string | null;
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  results: StudentResult[];
}

export interface StudentResult {
  peerId: string;
  name: string;
  attempts: number;
  timeTaken: number; // in milliseconds
  timestamp: number;
  isCorrect: boolean;
}

export type MessageType = 
  | 'GAME_START' 
  | 'GAME_END' 
  | 'SUBMIT_RESULT' 
  | 'RESET'
  | 'HEARTBEAT';

export interface PeerMessage {
  type: MessageType;
  payload: any;
}

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';
