const FAVORITES_KEY = 'fiddle-tune-library:favorites';

export function loadFavorites(): string[] {
  try {
    const value = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: string[]) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Private browsing or storage limits should not block the app.
  }
}
