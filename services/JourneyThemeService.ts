import AsyncStorage from '@react-native-async-storage/async-storage';

export type JourneyTheme =
  | 'relief'
  | 'self-exploration'
  | 'anxiety-release'
  | 'mindfulness'
  | 'gratitude'
  | 'processing';

export interface MusicPreference {
  name: string;
  uri: string;
  type: 'file' | 'spotify' | 'youtube' | 'apple-music';
}

export interface JourneyThemePreferences {
  theme: JourneyTheme;
  enableScheduling: boolean;
  scheduledTime: string;
  musicPreferences: MusicPreference[];
  enableBackgroundMusic: boolean;
}

const JOURNEY_THEME_PREFS_KEY = 'journey_theme_preferences_v1';

export const DEFAULT_JOURNEY_THEME_PREFERENCES: JourneyThemePreferences = {
  theme: 'relief',
  enableScheduling: false,
  scheduledTime: 'morning',
  musicPreferences: [],
  enableBackgroundMusic: false,
};

export async function loadJourneyThemePreferences(): Promise<JourneyThemePreferences> {
  try {
    const raw = await AsyncStorage.getItem(JOURNEY_THEME_PREFS_KEY);
    if (!raw) {
      return DEFAULT_JOURNEY_THEME_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<JourneyThemePreferences>;

    return {
      ...DEFAULT_JOURNEY_THEME_PREFERENCES,
      ...parsed,
      musicPreferences: Array.isArray(parsed.musicPreferences) ? parsed.musicPreferences : [],
    };
  } catch (error) {
    console.warn('Failed to load journey theme preferences:', error);
    return DEFAULT_JOURNEY_THEME_PREFERENCES;
  }
}

export async function saveJourneyThemePreferences(
  preferences: JourneyThemePreferences
): Promise<void> {
  await AsyncStorage.setItem(JOURNEY_THEME_PREFS_KEY, JSON.stringify(preferences));
}
