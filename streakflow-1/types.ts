
export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  startDate: string;
  color: string;
  journeyId?: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // ISO string YYYY-MM-DD
  note?: string;
  isFreeze?: boolean;
}

export interface MoodLog {
  date: string;
  note: string;
  energy: number; // 1-5 scale
  aiInsight?: string;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  icon: string;
  durationDays: number;
  habitName: string;
  habitIcon: string;
}

export interface UserJourneyProgress {
  journeyId: string;
  currentDay: number;
  startDate: string;
  completedDays: string[];
  status: 'active' | 'completed';
  shareCode: string;
}

export interface PetState {
  stage: 'egg' | 'hatched' | 'grown';
  happiness: number; // 0-100
  totalLogs: number;
  unlockedAccessories: string[];
  activeAccessories: string[];
  lastHappinessCheck: string;
}

export interface GameState {
  points: number;
  streakFreezes: number;
  unlockedThemes: string[];
  lastRewardCheck: string;
}

export interface LeaderboardEntry {
  username: string;
  consistency: number;
  rank: number;
}

export type ViewType = 'home' | 'calendar' | 'profile' | 'journeys' | 'shop';
