
import { Journey } from './types';

export const PREDEFINED_JOURNEYS: Journey[] = [
  {
    id: 'hydration-hero',
    name: 'Hydration Hero',
    description: 'Master the art of drinking 3L water daily for 30 days.',
    icon: '💧',
    durationDays: 30,
    habitName: 'Water (Journey)',
    habitIcon: '🌊'
  },
  {
    id: 'morning-routine',
    name: 'Morning Routine Builder',
    description: 'Wake up 30 mins earlier and stack your wins.',
    icon: '☀️',
    durationDays: 30,
    habitName: 'Early Rise (Journey)',
    habitIcon: '🌅'
  },
  {
    id: 'zero-sugar',
    name: 'Zero-Sugar Sprint',
    description: 'A 30-day challenge to cut processed sugar entirely.',
    icon: '🍭',
    durationDays: 30,
    habitName: 'Sugar Free (Journey)',
    habitIcon: '🥗'
  }
];

export const getMockLeaderboard = (): any[] => {
  const names = ['Aryan', 'Sia', 'Ishaan', 'Kavya', 'Rahul', 'Zoya', 'Ansh', 'Mehak', 'Veer', 'Sana'];
  return names.map((name, i) => ({
    username: name,
    consistency: Math.floor(Math.random() * (100 - 80 + 1)) + 80,
    rank: i + 1
  }));
};
