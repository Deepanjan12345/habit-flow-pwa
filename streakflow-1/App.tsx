
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Home, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  CloudSun, 
  CheckCircle2, 
  Trophy, 
  Settings, 
  Share2, 
  Languages, 
  Bell, 
  Volume2, 
  Sparkles, 
  X, 
  ArrowRight, 
  Activity, 
  Smile, 
  MessageSquare, 
  Compass, 
  Users, 
  Edit3, 
  Heart, 
  Zap, 
  Gift, 
  ShoppingBag, 
  Snowflake, 
  Coins, 
  PlayCircle, 
  BrainCircuit, 
  BarChart3,
  Dumbbell,
  Waves,
  BookOpen,
  Coffee,
  Code,
  Music,
  Moon,
  Sun,
  Target,
  Flame,
  Bike,
  Timer,
  Apple,
  Utensils,
  GraduationCap,
  Briefcase,
  Terminal,
  Camera,
  Laptop,
  Palette,
  Cloud,
  Gamepad2,
  Brush,
  Wind,
  UserCircle,
  Upload,
  RotateCcw,
  VolumeX,
  AlertCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Habit, HabitLog, ViewType, MoodLog, UserJourneyProgress, LeaderboardEntry, PetState, GameState } from './types';
import { fetchDailyQuote, fetchPredictiveNudge, fetchReflectionInsight } from './geminiService';
import { PREDEFINED_JOURNEYS, getMockLeaderboard } from './journeyData';
import Confetti from './components/Confetti';

const STORAGE_KEY_HABITS = 'streakflow_habits';
const STORAGE_KEY_LOGS = 'streakflow_logs';
const STORAGE_KEY_MOODS = 'streakflow_moods';
const STORAGE_KEY_NUDGE_STATS = 'streakflow_nudge_stats';
const STORAGE_KEY_LAST_NUDGE_DATE = 'streakflow_last_nudge_date';
const STORAGE_KEY_CACHED_NUDGE = 'streakflow_cached_nudge';
const STORAGE_KEY_LAST_QUOTE_DATE = 'streakflow_last_quote_date';
const STORAGE_KEY_CACHED_QUOTE = 'streakflow_cached_quote';
const STORAGE_KEY_JOURNEYS = 'streakflow_journeys';
const STORAGE_KEY_PET = 'streakflow_pet_state';
const STORAGE_KEY_GAME = 'streakflow_game_state';
const STORAGE_KEY_USER_NAME = 'streakflow_user_name';
const STORAGE_KEY_ONBOARDING_COMPLETED = 'streakflow_onboarding_completed';
const STORAGE_KEY_CUSTOM_SOUNDS = 'streakflow_custom_sounds';

const DEFAULT_HABIT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
const DEFAULT_PET_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const HABIT_COLORS = [
  '#00d5ff', // Teal
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

const ICON_OPTIONS = [
  { name: 'Activity', icon: Activity },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Bike', icon: Bike },
  { name: 'Timer', icon: Timer },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'Waves', icon: Waves },
  { name: 'Droplets', icon: (LucideIcons as any).Droplets || Waves },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Coffee', icon: Coffee },
  { name: 'Apple', icon: Apple },
  { name: 'Utensils', icon: Utensils },
  { name: 'BrainCircuit', icon: BrainCircuit },
  { name: 'Smile', icon: Smile },
  { name: 'Compass', icon: Compass },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Code', icon: Code },
  { name: 'Terminal', icon: Terminal },
  { name: 'Laptop', icon: Laptop },
  { name: 'Camera', icon: Camera },
  { name: 'Palette', icon: Palette },
  { name: 'Brush', icon: Brush },
  { name: 'Music', icon: Music },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Target', icon: Target },
  { name: 'Flame', icon: Flame },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Cloud', icon: Cloud },
  { name: 'Wind', icon: Wind },
  { name: 'Sparkles', icon: Sparkles },
];

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Gym', description: 'Lift heavy things for health', icon: 'Dumbbell', startDate: new Date().toISOString(), color: '#00d5ff' },
  { id: '2', name: 'Water', description: 'Drink 3L of water daily', icon: 'Waves', startDate: new Date().toISOString(), color: '#10b981' },
  { id: '3', name: 'Read', description: 'Read at least 10 pages', icon: 'BookOpen', startDate: new Date().toISOString(), color: '#f59e0b' },
  { id: '4', name: 'Meditate', description: '10 minutes of mindfulness', icon: 'BrainCircuit', startDate: new Date().toISOString(), color: '#8b5cf6' },
];

const INITIAL_PET: PetState = {
  stage: 'egg',
  happiness: 50,
  totalLogs: 0,
  unlockedAccessories: [],
  activeAccessories: [],
  lastHappinessCheck: new Date().toISOString().split('T')[0]
};

const INITIAL_GAME: GameState = {
  points: 0,
  streakFreezes: 1,
  unlockedThemes: ['Default'],
  lastRewardCheck: new Date().toISOString().split('T')[0]
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [journeyProgress, setJourneyProgress] = useState<UserJourneyProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pet, setPet] = useState<PetState>(INITIAL_PET);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME);
  const [nudgeTip, setNudgeTip] = useState<string | null>(null);
  const [nudgeStats, setNudgeStats] = useState({ followed: 0, total: 0 });
  const [quote, setQuote] = useState<string>('Loading your daily boost...');
  
  // Audio state
  const [customSounds, setCustomSounds] = useState<{ habit: string | null; pet: string | null }>({ habit: null, pet: null });

  // Onboarding states
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('');
  const [onboardingName, setOnboardingName] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isHabitLogModalOpen, setIsHabitLogModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState(ICON_OPTIONS[0].name);
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0]);
  const [moodNote, setMoodNote] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [activeLoggingHabit, setActiveLoggingHabit] = useState<Habit | null>(null);
  const [habitLogNote, setHabitLogNote] = useState('');
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [avatarTaps, setAvatarTaps] = useState(0);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Sunny' });

  // Refs for audio inputs
  const habitAudioInputRef = useRef<HTMLInputElement>(null);
  const petAudioInputRef = useRef<HTMLInputElement>(null);

  // Handle Dynamic Greeting calculation
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    let timePrefix = 'Morning';
    if (hour >= 12 && hour < 17) {
      timePrefix = 'Afternoon';
    } else if (hour >= 17 && hour <= 23) {
      timePrefix = 'Evening';
    }
    const name = userName || 'User';
    return `${timePrefix}, ${name}`;
  }, [userName]);

  useEffect(() => {
    // Load onboarding state
    const onboardingDone = localStorage.getItem(STORAGE_KEY_ONBOARDING_COMPLETED) === 'true';
    const savedName = localStorage.getItem(STORAGE_KEY_USER_NAME) || '';
    setHasCompletedOnboarding(onboardingDone);
    setUserName(savedName);

    const savedHabits = localStorage.getItem(STORAGE_KEY_HABITS);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const savedMoods = localStorage.getItem(STORAGE_KEY_MOODS);
    const savedStats = localStorage.getItem(STORAGE_KEY_NUDGE_STATS);
    const savedJourneys = localStorage.getItem(STORAGE_KEY_JOURNEYS);
    const savedPet = localStorage.getItem(STORAGE_KEY_PET);
    const savedGame = localStorage.getItem(STORAGE_KEY_GAME);
    const savedSounds = localStorage.getItem(STORAGE_KEY_CUSTOM_SOUNDS);
    
    const loadedHabits = savedHabits ? JSON.parse(savedHabits) : DEFAULT_HABITS;
    const loadedLogs = savedLogs ? JSON.parse(savedLogs) : [];
    const loadedMoods = savedMoods ? JSON.parse(savedMoods) : [];
    const loadedJourneys = savedJourneys ? JSON.parse(savedJourneys) : [];
    const loadedPet = savedPet ? JSON.parse(savedPet) : INITIAL_PET;
    const loadedGame = savedGame ? JSON.parse(savedGame) : INITIAL_GAME;
    const loadedSounds = savedSounds ? JSON.parse(savedSounds) : { habit: null, pet: null };
    
    setHabits(loadedHabits);
    setLogs(loadedLogs);
    setMoodLogs(loadedMoods);
    setJourneyProgress(loadedJourneys);
    setPet(loadedPet);
    setGameState(loadedGame);
    setCustomSounds(loadedSounds);
    setLeaderboard(getMockLeaderboard());
    if (savedStats) setNudgeStats(JSON.parse(savedStats));

    const today = new Date().toISOString().split('T')[0];
    
    // Handle Quote Caching
    const lastQuoteDate = localStorage.getItem(STORAGE_KEY_LAST_QUOTE_DATE);
    const cachedQuote = localStorage.getItem(STORAGE_KEY_CACHED_QUOTE);
    if (lastQuoteDate === today && cachedQuote) {
      setQuote(cachedQuote);
    } else {
      fetchDailyQuote().then(q => {
        setQuote(q);
        localStorage.setItem(STORAGE_KEY_CACHED_QUOTE, q);
        localStorage.setItem(STORAGE_KEY_LAST_QUOTE_DATE, today);
      });
    }

    // Handle Nudge Caching
    const lastNudgeDate = localStorage.getItem(STORAGE_KEY_LAST_NUDGE_DATE);
    const cachedNudge = localStorage.getItem(STORAGE_KEY_CACHED_NUDGE);
    if (lastNudgeDate === today && cachedNudge) {
      setNudgeTip(cachedNudge);
    } else {
      setTimeout(() => {
        triggerPredictiveNudge(loadedLogs, loadedMoods, loadedHabits);
      }, 3000);
    }

    handleDailySync(loadedHabits, loadedLogs, loadedGame);
    setWeather({ temp: '28°C', condition: 'Clear' });

    // Handle App Resumes for dynamic greeting update
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Trigger a re-render to refresh the greeting
        setActiveView(prev => prev);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MOODS, JSON.stringify(moodLogs)); }, [moodLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_NUDGE_STATS, JSON.stringify(nudgeStats)); }, [nudgeStats]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_JOURNEYS, JSON.stringify(journeyProgress)); }, [journeyProgress]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PET, JSON.stringify(pet)); }, [pet]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(gameState)); }, [gameState]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_CUSTOM_SOUNDS, JSON.stringify(customSounds)); }, [customSounds]);

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(onboardingName)) {
      setNameError("Please use letters only (no spaces, numbers or symbols).");
      return;
    }
    
    localStorage.setItem(STORAGE_KEY_USER_NAME, onboardingName);
    localStorage.setItem(STORAGE_KEY_ONBOARDING_COMPLETED, 'true');
    setUserName(onboardingName);
    setHasCompletedOnboarding(true);
    hapticFeedback();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleDailySync = (currentHabits: Habit[], currentLogs: HabitLog[], currentGame: GameState) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    let freezesUsed = 0;
    const newLogs: HabitLog[] = [];
    let updatedGame = { ...currentGame };

    currentHabits.forEach(habit => {
      const logYesterday = currentLogs.some(l => l.habitId === habit.id && l.date === yesterday);
      const logToday = currentLogs.some(l => l.habitId === habit.id && l.date === today);

      if (!logYesterday && !logToday && updatedGame.streakFreezes > freezesUsed) {
        newLogs.push({
          habitId: habit.id,
          date: yesterday,
          note: "Used Streak Freeze ❄️",
          isFreeze: true
        });
        freezesUsed++;
      }
    });

    if (freezesUsed > 0) {
      updatedGame.streakFreezes -= freezesUsed;
      setLogs(prev => [...prev, ...newLogs]);
    }

    currentHabits.forEach(habit => {
      const streak = getStreak(habit.id, [...currentLogs, ...newLogs]);
      if (streak === 7 && !updatedGame.unlockedThemes.includes('Neon')) {
        updatedGame.unlockedThemes.push('Neon');
        updatedGame.streakFreezes += 1;
      }
      if (streak === 14) {
        updatedGame.points += 10;
      }
    });

    updatedGame.lastRewardCheck = today;
    setGameState(updatedGame);
    checkPetHappinessDecay(pet, [...currentLogs, ...newLogs]);
  };

  const triggerRewardedAd = async () => {
    setIsAdLoading(true);
    hapticFeedback();
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAdLoading(false);
    setGameState(prev => ({ ...prev, streakFreezes: prev.streakFreezes + 1 }));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const buyFromShop = (item: 'freeze' | 'accessory', cost: number) => {
    if (gameState.points < cost) return;
    hapticFeedback();
    setGameState(prev => ({
      ...prev,
      points: prev.points - cost,
      streakFreezes: item === 'freeze' ? prev.streakFreezes + 1 : prev.streakFreezes
    }));
    if (item === 'accessory') {
      const nextAcc = pet.unlockedAccessories.includes('Glasses') ? 'Bowtie' : 'Glasses';
      setPet(prev => ({
        ...prev,
        unlockedAccessories: [...prev.unlockedAccessories, nextAcc]
      }));
    }
    playLogSound();
  };

  const checkPetHappinessDecay = (currentPet: PetState, currentLogs: HabitLog[]) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const loggedYesterday = currentLogs.some(l => l.date === yesterday);
    if (!loggedYesterday) {
      setPet(prev => ({
        ...prev,
        happiness: Math.max(0, prev.happiness - 15),
        lastHappinessCheck: new Date().toISOString().split('T')[0]
      }));
    }
  };

  const updatePetOnLog = () => {
    setPet(prev => {
      const nextTotalLogs = prev.totalLogs + 1;
      let nextStage = prev.stage;
      const nextUnlocked = [...prev.unlockedAccessories];

      if (prev.stage === 'egg' && nextTotalLogs >= 5) {
        nextStage = 'hatched';
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else if (prev.stage === 'hatched' && nextTotalLogs >= 25) {
        nextStage = 'grown';
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      if (nextTotalLogs === 7 && !nextUnlocked.includes('Hat')) nextUnlocked.push('Hat');
      if (nextTotalLogs === 14 && !nextUnlocked.includes('Shades')) nextUnlocked.push('Shades');
      if (nextTotalLogs === 30 && !nextUnlocked.includes('Crown')) nextUnlocked.push('Crown');

      return {
        ...prev,
        totalLogs: nextTotalLogs,
        stage: nextStage,
        happiness: Math.min(100, prev.happiness + 5),
        unlockedAccessories: nextUnlocked
      };
    });
  };

  const getPetEmoji = () => {
    if (pet.stage === 'egg') return '🥚';
    if (pet.stage === 'hatched') return '🐥';
    return '🐕';
  };

  const getPetMessage = () => {
    if (pet.stage === 'egg') return "Keep going! I'm almost ready to hatch.";
    if (pet.happiness < 30) return "I'm feeling a bit lonely... let's hit those goals!";
    if (pet.happiness > 80) return "Feeling amazing! You're crushing it today.";
    return "Great job, human! What's next on the list?";
  };

  const startJourney = (journeyId: string) => {
    const journey = PREDEFINED_JOURNEYS.find(j => j.id === journeyId);
    if (!journey || journeyProgress.some(p => p.journeyId === journeyId)) return;

    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newProgress: UserJourneyProgress = {
      journeyId,
      currentDay: 1,
      startDate: new Date().toISOString(),
      completedDays: [],
      status: 'active',
      shareCode
    };

    const journeyHabit: Habit = {
      id: `journey-${journeyId}`,
      name: journey.habitName,
      description: journey.description,
      icon: journey.habitIcon,
      startDate: new Date().toISOString(),
      color: HABIT_COLORS[4],
      journeyId: journeyId
    };

    setJourneyProgress(prev => [...prev, newProgress]);
    setHabits(prev => [...prev, journeyHabit]);
    setActiveView('home');
    hapticFeedback();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const advanceJourney = (journeyId: string, date: string) => {
    setJourneyProgress(prev => prev.map(p => {
      if (p.journeyId === journeyId && !p.completedDays.includes(date)) {
        const journey = PREDEFINED_JOURNEYS.find(j => j.id === journeyId);
        const nextCompletedDays = [...p.completedDays, date];
        const nextDay = nextCompletedDays.length + 1;
        const isComplete = nextCompletedDays.length >= (journey?.durationDays || 30);
        if (isComplete) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        return { ...p, currentDay: isComplete ? p.currentDay : nextDay, completedDays: nextCompletedDays, status: isComplete ? 'completed' : 'active' };
      }
      return p;
    }));
  };

  const triggerPredictiveNudge = async (currentLogs: HabitLog[], currentMoods: MoodLog[], currentHabits: Habit[]) => {
    const today = new Date().toISOString().split('T')[0];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentLogs = currentLogs.filter(l => new Date(l.date) >= fourteenDaysAgo);
    const habitSummary = currentHabits.map(h => `${h.name}: ${recentLogs.filter(l => l.habitId === h.id).length}/14`).join(', ');
    const summary = `User Habits: ${habitSummary}. Energy trends included.`;
    
    try {
      const tip = await fetchPredictiveNudge(summary);
      if (tip) {
        setNudgeTip(tip);
        localStorage.setItem(STORAGE_KEY_CACHED_NUDGE, tip);
        localStorage.setItem(STORAGE_KEY_LAST_NUDGE_DATE, today);
        setNudgeStats(prev => ({ ...prev, total: prev.total + 1 }));
      }
    } catch (e) {
      console.warn("Nudge request failed to resolve even with retries. Using local fallback handled by service.");
    }
  };

  const toggleHabit = (habitId: string) => {
    hapticFeedback();
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === today);
    if (existingIndex > -1) {
      setLogs(logs.filter((_, i) => i !== existingIndex));
    } else {
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        setActiveLoggingHabit(habit);
        setHabitLogNote('');
        setIsHabitLogModalOpen(true);
      }
    }
  };

  const confirmHabitLog = () => {
    if (!activeLoggingHabit) return;
    const today = new Date().toISOString().split('T')[0];
    const newLog: HabitLog = { habitId: activeLoggingHabit.id, date: today, note: habitLogNote.trim() || undefined };
    setLogs(prev => [...prev, newLog]);
    playLogSound();
    updatePetOnLog();
    if (activeLoggingHabit.journeyId) advanceJourney(activeLoggingHabit.journeyId, today);
    setIsHabitLogModalOpen(false);
    setActiveLoggingHabit(null);
    setHabitLogNote('');
    hapticFeedback();
  };

  const initiateDeleteHabit = (id: string) => {
    setHabitToDelete(id);
    setIsDeleteModalOpen(true);
    hapticFeedback();
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      setHabits(habits.filter(h => h.id !== habitToDelete));
      setLogs(logs.filter(l => l.habitId !== habitToDelete));
      hapticFeedback();
      setIsDeleteModalOpen(false);
      setHabitToDelete(null);
    }
  };

  const logMood = async () => {
    setIsReflecting(true);
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === today);
    const logsSummary = todayLogs.map(l => habits.find(h => h.id === l.habitId)?.name).join(', ');
    
    try {
      const insight = await fetchReflectionInsight(logsSummary || 'No habits completed', energyLevel, moodNote);
      const newMood: MoodLog = { date: today, note: moodNote, energy: energyLevel, aiInsight: insight };
      setMoodLogs(prev => [...prev.filter(m => m.date !== today), newMood]);
    } catch (e) {
      console.warn("Reflection insight failed to resolve. Using local fallback.");
      const newMood: MoodLog = { date: today, note: moodNote, energy: energyLevel, aiInsight: "Keep up the hard work! Every day matters." };
      setMoodLogs(prev => [...prev.filter(m => m.date !== today), newMood]);
    } finally {
      setIsMoodModalOpen(false);
      setIsReflecting(false);
      setMoodNote('');
      hapticFeedback();
      setGameState(prev => ({ ...prev, points: prev.points + 5 }));
    }
  };

  const addHabit = () => {
    if (!newHabitName || habits.length >= 8) return;
    const newHabit: Habit = { 
      id: Date.now().toString(), 
      name: newHabitName, 
      description: newHabitDescription,
      icon: newHabitIcon, 
      startDate: new Date().toISOString(), 
      color: newHabitColor 
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setNewHabitDescription('');
    setNewHabitIcon(ICON_OPTIONS[0].name);
    setIsAddModalOpen(false);
    hapticFeedback();
  };

  const handleAvatarClick = () => {
    setAvatarTaps(prev => (prev + 1 === 3 ? (setShowConfetti(true), setTimeout(() => setShowConfetti(false), 3000), 0) : prev + 1));
    hapticFeedback();
    playPetSound();
  };

  const getStreak = (habitId: string, customLogs?: HabitLog[]) => {
    const data = customLogs || logs;
    const sorted = data.filter(l => l.habitId === habitId).map(l => l.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (sorted.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let streak = 0, current = new Date(sorted[0]);
    for (const dStr of sorted) {
      const d = new Date(dStr);
      if (Math.floor((current.getTime() - d.getTime()) / 86400000) <= 1) { streak++; current = d; } else break;
    }
    return streak;
  };

  const calculateMoodPatterns = () => {
    if (moodLogs.length < 7) return null;
    const highMoodDays = moodLogs.filter(m => m.energy >= 4);
    const lowMoodDays = moodLogs.filter(m => m.energy <= 2);
    const getAvgCompletion = (days: MoodLog[]) => {
      if (days.length === 0) return 0;
      const totalPossible = days.length * habits.length;
      if (totalPossible === 0) return 0;
      const completed = logs.filter(l => days.some(d => d.date === l.date)).length;
      return Math.round((completed / totalPossible) * 100);
    };
    return { highMoodRate: getAvgCompletion(highMoodDays), lowMoodRate: getAvgCompletion(lowMoodDays), totalReflections: moodLogs.length };
  };

  const hapticFeedback = () => navigator.vibrate?.(20);
  
  const playLogSound = () => { 
    const soundSrc = customSounds.habit || DEFAULT_HABIT_SOUND;
    const a = new Audio(soundSrc); 
    a.volume = 0.25; 
    a.play().catch(() => {}); 
  };

  const playPetSound = () => {
    const soundSrc = customSounds.pet || DEFAULT_PET_SOUND;
    const a = new Audio(soundSrc);
    a.volume = 0.2;
    a.play().catch(() => {});
  };

  const handleSoundUpload = (type: 'habit' | 'pet', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 2MB File Size Limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("Sound file too large! Maximum allowed size is 2MB.");
      e.target.value = ''; // Reset input
      return;
    }

    // MIME Type Validation
    if (!file.type.startsWith('audio/')) {
      alert("Invalid file type. Please upload an audio file (MP3, WAV, etc.)");
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomSounds(prev => ({ ...prev, [type]: base64 }));
      hapticFeedback();
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const resetSound = (type: 'habit' | 'pet') => {
    setCustomSounds(prev => ({ ...prev, [type]: null }));
    hapticFeedback();
  };

  const renderIcon = (iconName: string, size = 32, color = 'currentColor') => {
    const IconComp = (LucideIcons as any)[iconName];
    if (IconComp) {
      return <IconComp size={size} style={{ color }} />;
    }
    return <span style={{ fontSize: `${size}px` }}>{iconName}</span>;
  };

  const renderOnboarding = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#121212]">
      <div className="max-w-md w-full glass rounded-[3rem] p-10 animate-fade-in text-center border-t-4 border-[#00d5ff]">
        <div className="w-20 h-20 bg-[#00d5ff]/10 rounded-3xl flex items-center justify-center text-[#00d5ff] mx-auto mb-8">
          <UserCircle size={48} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Welcome to StreakFlow</h1>
        <p className="text-white/60 mb-8 leading-relaxed">Let's get started on your consistency journey. What should we call you?</p>
        
        <form onSubmit={handleOnboardingSubmit} className="space-y-6">
          <div className="relative">
            <input 
              autoFocus
              type="text"
              value={onboardingName}
              onChange={(e) => {
                setOnboardingName(e.target.value);
                setNameError(null);
              }}
              placeholder="Your Name (Alphabets only)"
              className={`w-full bg-white/5 border ${nameError ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-4 px-6 text-xl text-center focus:outline-none focus:ring-2 focus:ring-[#00d5ff]/30 transition-all`}
            />
            {nameError && <p className="text-red-400 text-xs mt-2 font-medium">{nameError}</p>}
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-[#00d5ff] text-black font-bold rounded-2xl text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00d5ff]/20"
          >
            Start My Journey
          </button>
        </form>
      </div>
    </div>
  );

  const renderHome = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === today);
    const todayMood = moodLogs.find(m => m.date === today);
    return (
      <div className="px-6 pt-12 pb-32 animate-fade-in">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">{getGreeting()}</h1>
            <p className="text-white/60 text-sm flex items-center gap-2"><CloudSun size={18} className="text-[#00d5ff]" /> {weather.temp} &bull; {weather.condition}</p>
          </div>
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl overflow-hidden cursor-pointer" onClick={handleAvatarClick}>{userName.charAt(0) || 'U'}</div>
        </header>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 glass rounded-2xl p-4 flex items-center gap-3"><div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Snowflake size={20} /></div><div><div className="text-lg font-bold">{gameState.streakFreezes}</div><div className="text-[10px] uppercase font-bold text-white/40">Freezes</div></div></div>
          <div className="flex-1 glass rounded-2xl p-4 flex items-center gap-3"><div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg"><Coins size={20} /></div><div><div className="text-lg font-bold">{gameState.points}</div><div className="text-[10px] uppercase font-bold text-white/40">Points</div></div></div>
        </div>
        <div className="mb-8 glass bg-gradient-to-br from-[#00d5ff]/10 to-purple-500/10 rounded-[2.5rem] p-6 relative overflow-hidden group">
          <div className="flex gap-6 items-center">
            <div className="relative flex-shrink-0 cursor-pointer" onClick={playPetSound}><div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-5xl relative z-10 animate-bounce-slow">{getPetEmoji()}</div><div className="absolute inset-0 bg-[#00d5ff]/20 blur-xl rounded-full animate-pulse"></div></div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold uppercase tracking-widest text-white/60">Flow Buddy</span><span className="text-xs font-bold text-[#00d5ff]">{pet.happiness}% Happy</span></div>
              <div className="h-1.5 w-full bg-white/5 rounded-full mb-3 overflow-hidden"><div className="h-full bg-[#00d5ff] transition-all duration-500" style={{ width: `${pet.happiness}%` }}></div></div>
              <p className="text-sm text-white/90 font-medium leading-tight">"{getPetMessage()}"</p>
            </div>
          </div>
        </div>
        {(todayMood?.aiInsight || nudgeTip) && (
          <div className="mb-6 space-y-4">
            {todayMood?.aiInsight && (
              <div className="animate-slide-up">
                <div className="glass bg-purple-500/10 border-purple-500/30 rounded-[2rem] p-6 relative overflow-hidden group">
                  <div className="flex items-center gap-2 text-purple-400 mb-2 font-bold text-xs uppercase tracking-widest"><BrainCircuit size={14} /> Evening Reflection</div>
                  <p className="text-white/90 text-sm italic leading-relaxed">"{todayMood.aiInsight}"</p>
                </div>
              </div>
            )}
            {nudgeTip && !todayMood?.aiInsight && (
               <div className="animate-slide-up">
               <div className="glass bg-[#00d5ff]/5 border-[#00d5ff]/20 rounded-[2rem] p-6 relative overflow-hidden group">
                 <div className="flex items-center gap-2 text-[#00d5ff] mb-2 font-bold text-xs uppercase tracking-widest"><Sparkles size={14} /> AI Coach Nudge</div>
                 <p className="text-white/90 text-sm italic leading-relaxed">"{nudgeTip}"</p>
               </div>
             </div>
            )}
          </div>
        )}
        <div className="glass rounded-[2rem] p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80} /></div>
          <p className="text-white/90 italic leading-relaxed text-lg mb-4">"{quote}"</p>
          <div className="flex justify-between items-center">
            <div className="text-[#00d5ff] font-medium text-sm">Habit loop active</div>
            <button onClick={() => setIsMoodModalOpen(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${todayMood ? 'bg-white/10 text-white/60' : 'bg-[#00d5ff]/20 text-[#00d5ff] animate-pulse'}`}><Smile size={14} /> {todayMood ? 'Logged Mood' : 'Log Energy'}</button>
          </div>
        </div>
        <section>
          <div className="flex justify-between items-end mb-4"><h2 className="text-xl font-semibold">Today's Flow</h2><span className="text-sm text-white/40">{todayLogs.length}/{habits.length} Done</span></div>
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
            {habits.length === 0 ? (<div className="w-full text-center py-10 text-white/40">No habits yet? Tap + to start.</div>) : (
              habits.map((habit) => {
                const log = logs.find(l => l.habitId === habit.id && l.date === today);
                const isDone = !!log;
                return (
                  <div key={habit.id} onClick={() => toggleHabit(habit.id)} className={`flex-shrink-0 w-32 h-44 glass rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden cursor-pointer group ${isDone ? 'scale-105 bg-white/10' : ''}`} style={isDone ? { boxShadow: `0 0 15px ${habit.color}66`, border: `2px solid ${habit.color}` } : {}}>
                    <div className={`transition-transform duration-500 ${isDone ? 'scale-125' : 'group-active:scale-90'}`}>
                      {isDone ? <CheckCircle2 size={40} style={{ color: habit.color }} /> : renderIcon(habit.icon, 40)}
                    </div>
                    <div className="flex flex-col items-center px-2 mt-4">
                      <span className={`text-sm font-medium text-center ${isDone ? 'font-bold' : 'text-white/80'}`} style={isDone ? { color: habit.color } : {}}>{habit.name}</span>
                      {habit.description && !isDone && <span className="text-[10px] text-white/30 text-center line-clamp-1">{habit.description}</span>}
                    </div>
                    <div className="mt-2 text-[10px] text-white/40 text-center px-2 line-clamp-2">{isDone && log.note ? log.note : (habit.journeyId ? 'Challenge' : `Streak: ${getStreak(habit.id)}`)}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderShop = () => (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      <header className="mb-8"><h1 className="text-3xl font-bold">Flow Shop</h1><p className="text-white/40">Spend consistency coins</p></header>
      <div className="glass rounded-[2rem] p-6 mb-8 bg-[#00d5ff]/5 border-[#00d5ff]/20"><div className="flex justify-between items-center"><div className="flex items-center gap-3"><Coins size={32} className="text-yellow-400" /><div><div className="text-2xl font-bold">{gameState.points}</div><div className="text-xs uppercase font-bold text-white/40 tracking-wider">Coins</div></div></div><button onClick={triggerRewardedAd} disabled={isAdLoading} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-xs font-bold border border-white/10 active:scale-95 transition-all">{isAdLoading ? 'Loading Ad...' : <><PlayCircle size={16} className="text-green-400" /> +1 Freeze</>}</button></div></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-[2rem] p-6 flex flex-col items-center text-center"><div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4"><Snowflake size={32} /></div><h3 className="font-bold mb-1">Freeze</h3><button onClick={() => buyFromShop('freeze', 20)} disabled={gameState.points < 20} className="w-full py-2 bg-[#00d5ff] text-black text-xs font-bold rounded-xl disabled:opacity-20">20 Coins</button></div>
        <div className="glass rounded-[2rem] p-6 flex flex-col items-center text-center"><div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-4"><Gift size={32} /></div><h3 className="font-bold mb-1">Accessory</h3><button onClick={() => buyFromShop('accessory', 50)} disabled={gameState.points < 50} className="w-full py-2 bg-[#00d5ff] text-black text-xs font-bold rounded-xl disabled:opacity-20">50 Coins</button></div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    return (
      <div className="px-6 pt-12 pb-32 animate-fade-in">
        <header className="mb-8"><h1 className="text-3xl font-bold">Streaks</h1><p className="text-white/40">Consistency is power</p></header>
        <div className="space-y-4 mb-10">
          {habits.map(habit => {
            const streak = getStreak(habit.id);
            return (
              <div key={habit.id} className="glass rounded-[2rem] p-6 flex flex-col gap-4 group relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="group-hover:scale-110 transition-transform">
                      {renderIcon(habit.icon, 32, habit.color)}
                    </div>
                    <div>
                      <h3 className="font-bold">{habit.name}</h3>
                      <div className="flex items-center gap-1 text-[#00d5ff] text-xs font-bold uppercase tracking-wider"><Zap size={14} fill="#00d5ff" /> {streak} Day Streak</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => initiateDeleteHabit(habit.id)}
                    className="p-3 bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {[...Array(7)].map((_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (6 - i));
                    const dStr = d.toISOString().split('T')[0];
                    const log = logs.find(l => l.habitId === habit.id && l.date === dStr);
                    const completed = !!log;
                    return <div key={i} className={`flex-1 h-8 rounded-full transition-all duration-500 ${completed ? '' : 'bg-white/5'}`} style={completed ? { backgroundColor: log?.isFreeze ? '#3b82f6' : habit.color, boxShadow: `0 0 10px ${log?.isFreeze ? '#3b82f6' : habit.color}aa` } : {}} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <section>
          <div className="flex items-center justify-between mb-4 px-2"><h2 className="text-xl font-semibold flex items-center gap-2"><Trophy size={20} className="text-yellow-400" /> Leaderboard</h2><span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Global</span></div>
          <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5">
            {leaderboard.map((entry, i) => (
              <div key={entry.username} className={`flex items-center justify-between p-5 border-b border-white/5 last:border-0 ${i === 0 ? 'bg-yellow-400/5' : ''}`}><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/40'}`}>{i + 1}</div><div className="flex flex-col"><span className="font-bold">{entry.username}</span><span className="text-[10px] text-white/30 uppercase font-medium">Player</span></div></div><div className="flex flex-col items-end"><div className="text-lg font-bold text-white">{entry.consistency}%</div><div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#00d5ff]" style={{ width: `${entry.consistency}%` }}></div></div></div></div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderProfile = () => {
    const patterns = calculateMoodPatterns();
    return (
      <div className="px-6 pt-12 pb-32 animate-fade-in space-y-8">
        <div className="flex flex-col items-center mb-10"><div className="w-24 h-24 rounded-full glass flex items-center justify-center text-4xl mb-4 border-2 border-[#00d5ff]">{userName.charAt(0) || 'U'}</div><h1 className="text-2xl font-bold">{userName || 'User'}</h1><p className="text-white/40 text-sm">Habit Architect</p></div>
        
        {/* Audio Customization Card */}
        <div className="glass rounded-[2.5rem] p-8 border-t-2 border-[#00d5ff]/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg flex items-center gap-3"><Volume2 size={22} className="text-[#00d5ff]" /> Audio Settings</h3>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
              <AlertCircle size={10} className="text-white/40" />
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Max 2MB</span>
            </div>
          </div>
          <p className="text-[10px] text-white/30 mb-6 px-1">Customize your completion and interaction sounds.</p>
          
          <div className="space-y-6">
            {/* Habit Completion Sound */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Completion Sound</span>
                <span className="text-[10px] text-[#00d5ff] font-bold">{customSounds.habit ? 'CUSTOM' : 'DEFAULT'}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={playLogSound} className="flex-1 glass py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all text-xs font-bold">
                  <PlayCircle size={18} className="text-[#00d5ff]" /> Preview
                </button>
                <button onClick={() => habitAudioInputRef.current?.click()} className="flex-1 glass py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#00d5ff]/10 active:scale-95 transition-all text-xs font-bold">
                  <Upload size={18} /> Upload
                </button>
                {customSounds.habit && (
                  <button onClick={() => resetSound('habit')} className="w-14 glass rounded-2xl flex items-center justify-center text-red-400/60 hover:text-red-400">
                    <RotateCcw size={18} />
                  </button>
                )}
                <input ref={habitAudioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleSoundUpload('habit', e)} />
              </div>
            </div>

            {/* Pet Interaction Sound */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Buddy Sound</span>
                <span className="text-[10px] text-purple-400 font-bold">{customSounds.pet ? 'CUSTOM' : 'DEFAULT'}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={playPetSound} className="flex-1 glass py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all text-xs font-bold">
                  <PlayCircle size={18} className="text-purple-400" /> Preview
                </button>
                <button onClick={() => petAudioInputRef.current?.click()} className="flex-1 glass py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-500/10 active:scale-95 transition-all text-xs font-bold">
                  <Upload size={18} /> Upload
                </button>
                {customSounds.pet && (
                  <button onClick={() => resetSound('pet')} className="w-14 glass rounded-2xl flex items-center justify-center text-red-400/60 hover:text-red-400">
                    <RotateCcw size={18} />
                  </button>
                )}
                <input ref={petAudioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleSoundUpload('pet', e)} />
              </div>
            </div>
          </div>
        </div>

        {patterns ? (
          <div className="glass rounded-[2rem] p-6 bg-gradient-to-r from-purple-500/10 to-[#00d5ff]/10 border-purple-500/20"><h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2"><BarChart3 size={16} /> Mood Patterns</h3><div className="space-y-4"><div><div className="flex justify-between text-xs mb-1"><span>High Mood Completion</span><span className="text-[#00d5ff] font-bold">{patterns.highMoodRate}%</span></div><div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#00d5ff]" style={{ width: `${patterns.highMoodRate}%` }}></div></div></div><div><div className="flex justify-between text-xs mb-1"><span>Low Mood Completion</span><span className="text-purple-400 font-bold">{patterns.lowMoodRate}%</span></div><div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-purple-400" style={{ width: `${patterns.lowMoodRate}%` }}></div></div></div></div></div>
        ) : <div className="glass rounded-[2rem] p-6 text-center text-white/40 text-xs italic">Continue reflecting to unlock mood trends.</div>}
        
        <div className="grid grid-cols-2 gap-4"><div className="glass rounded-[2rem] p-6 text-center"><div className="text-[#00d5ff] text-2xl font-bold mb-1">{logs.length}</div><div className="text-xs text-white/40 uppercase font-bold tracking-wider">Logs</div></div><div className="glass rounded-[2rem] p-6 text-center"><div className="text-[#00d5ff] text-2xl font-bold mb-1">{gameState.points}</div><div className="text-xs text-white/40 uppercase font-bold tracking-wider">Coins</div></div></div>
      </div>
    );
  };

  const renderJourneys = () => (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      <header className="mb-8"><h1 className="text-3xl font-bold">Journeys</h1><p className="text-white/40">Adaptive challenges</p></header>
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Active</h2>
        {journeyProgress.length === 0 ? (<div className="glass rounded-[2rem] p-8 text-center text-white/40">No active journeys.</div>) : (
          journeyProgress.map(p => {
            const j = PREDEFINED_JOURNEYS.find(x => x.id === p.journeyId);
            return (
              <div key={p.journeyId} className="glass rounded-[2rem] p-6 mb-4 relative overflow-hidden"><div className="flex justify-between items-start mb-4"><div><h3 className="font-bold text-lg">{j?.name}</h3><p className="text-xs text-white/40">Day {p.currentDay} of {j?.durationDays}</p></div></div><div className="h-2 w-full bg-white/5 rounded-full mb-2"><div className="h-full bg-[#00d5ff] rounded-full transition-all" style={{ width: `${(p.completedDays.length / (j?.durationDays || 30)) * 100}%` }}></div></div></div>
            );
          })
        )}
      </section>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#121212] selection:bg-[#00d5ff]/30 pb-16 ${gameState.unlockedThemes.includes('Neon') && activeView === 'home' ? 'neon-active' : ''}`}>
      {!hasCompletedOnboarding && renderOnboarding()}
      {showConfetti && <Confetti />}
      <div className="bg-[#00d5ff] text-black text-[10px] font-bold py-1 px-4 text-center sticky top-0 z-50 uppercase tracking-wider flex justify-between items-center">
        <span>StreakFlow PWA</span><span className="flex items-center gap-1"><Snowflake size={10} /> {gameState.streakFreezes} Freezes</span>
      </div>
      <main className="max-w-md mx-auto min-h-screen gradient-splash">
        {activeView === 'home' && renderHome()}
        {activeView === 'calendar' && renderCalendar()}
        {activeView === 'profile' && renderProfile()}
        {activeView === 'journeys' && renderJourneys()}
        {activeView === 'shop' && renderShop()}
      </main>
      {activeView === 'home' && <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-[#00d5ff] text-black rounded-2xl shadow-xl flex items-center justify-center z-40 active:scale-90 transition-transform teal-glow"><Plus size={32} /></button>}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass border-t border-white/5 flex items-center justify-around px-6 z-40">
        <NavItem active={activeView === 'home'} onClick={() => setActiveView('home')} icon={<Home size={22} />} label="Home" />
        <NavItem active={activeView === 'shop'} onClick={() => setActiveView('shop')} icon={<ShoppingBag size={22} />} label="Shop" />
        <NavItem active={activeView === 'journeys'} onClick={() => setActiveView('journeys')} icon={<Compass size={22} />} label="Journey" />
        <NavItem active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} icon={<Calendar size={22} />} label="Streaks" />
        <NavItem active={activeView === 'profile'} onClick={() => setActiveView('profile')} icon={<User size={22} />} label="Me" />
      </nav>
      {isHabitLogModalOpen && activeLoggingHabit && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-10"><div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsHabitLogModalOpen(false)} />
          <div className="relative glass w-full max-w-md rounded-[2.5rem] p-8 animate-slide-up border-t-4" style={{ borderColor: activeLoggingHabit.color }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-3xl">
                {renderIcon(activeLoggingHabit.icon, 40, activeLoggingHabit.color)}
              </div>
              <div><h2 className="text-2xl font-bold">Log {activeLoggingHabit.name}</h2></div>
            </div>
            <textarea autoFocus value={habitLogNote} onChange={(e) => setHabitLogNote(e.target.value)} placeholder="Note..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 h-32 focus:outline-none focus:ring-1 focus:ring-[#00d5ff]" />
            <div className="flex gap-4"><button onClick={() => setIsHabitLogModalOpen(false)} className="flex-1 py-4 border border-white/10 rounded-2xl">Cancel</button><button onClick={confirmHabitLog} className="flex-1 py-4 rounded-2xl font-bold text-black" style={{ backgroundColor: activeLoggingHabit.color }}>Log</button></div>
          </div>
        </div>
      )}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-10"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMoodModalOpen(false)} />
          <div className="relative glass w-full max-w-md rounded-[2.5rem] p-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><BrainCircuit className="text-purple-400" /> Reflection</h2>
            <div className="mb-6"><div className="flex justify-between gap-2">{[1, 2, 3, 4, 5].map(l => (
              <button key={l} onClick={() => setEnergyLevel(l)} className={`flex-1 py-4 rounded-2xl font-bold ${energyLevel === l ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40'}`}>{l}</button>
            ))}</div></div>
            <textarea value={moodNote} onChange={(e) => setMoodNote(e.target.value)} placeholder="Day summary..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 h-24" />
            <button onClick={logMood} disabled={isReflecting} className="w-full py-4 bg-purple-500 text-white rounded-2xl font-bold disabled:opacity-50">{isReflecting ? 'Analyzing...' : 'Save'}</button>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative glass w-full max-sm rounded-[2.5rem] p-8 animate-slide-up border border-red-500/30">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Delete Habit?</h2>
              <p className="text-sm text-white/60 mb-8">
                Are you sure you want to delete this habit? This action cannot be undone.
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="flex-1 py-4 glass rounded-2xl text-sm font-bold text-white/80"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteHabit} 
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative glass w-full max-w-md rounded-[2.5rem] p-8 animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar">
            <h2 className="text-2xl font-bold mb-6">New Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1 mb-1 block">Habit Name</label>
                <input autoFocus value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g., Morning Run" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-[#00d5ff]" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1 mb-1 block">Description</label>
                <textarea value={newHabitDescription} onChange={(e) => setNewHabitDescription(e.target.value)} placeholder="Why this habit?" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-20 focus:outline-none focus:ring-1 focus:ring-[#00d5ff]" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1 mb-3 block">Pick an Icon</label>
                <div className="grid grid-cols-6 gap-3 p-2 bg-white/5 rounded-3xl max-h-48 overflow-y-auto no-scrollbar">
                  {ICON_OPTIONS.map((opt) => (
                    <button 
                      key={opt.name} 
                      onClick={() => {setNewHabitIcon(opt.name); hapticFeedback();}} 
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all ${newHabitIcon === opt.name ? 'bg-[#00d5ff] text-black shadow-[0_0_10px_#00d5ff]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      <opt.icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1 mb-3 block">Pick a Color</label>
                <div className="flex justify-between p-2 bg-white/5 rounded-3xl">
                  {HABIT_COLORS.map((color) => (
                    <button 
                      key={color} 
                      onClick={() => {setNewHabitColor(color); hapticFeedback();}} 
                      className={`w-8 h-8 rounded-full transition-transform ${newHabitColor === color ? 'scale-125 border-2 border-white' : 'scale-100'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 border border-white/10 rounded-2xl">Cancel</button>
              <button onClick={addHabit} className="flex-1 py-4 bg-[#00d5ff] text-black font-bold rounded-2xl">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{active: boolean; onClick: () => void; icon: React.ReactNode; label: string;}> = ({ active, onClick, icon, label }) => (
  <button onClick={() => (onClick(), navigator.vibrate?.(20))} className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-[#00d5ff] scale-110' : 'text-white/40'}`}><div className={`p-2 rounded-xl ${active ? 'bg-[#00d5ff]/10' : ''}`}>{icon}</div><span className="text-[10px] font-bold uppercase">{label}</span></button>
);

export default App;
