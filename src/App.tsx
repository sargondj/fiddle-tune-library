import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TuneDetail } from './components/TuneDetail';
import { TuneLibrary } from './components/TuneLibrary';
import { WelcomeDialog } from './components/WelcomeDialog';
import { groupTunes, parseCsv, type Tune, type TuneVideo } from './lib/tunes';
import { loadFavorites, saveFavorites } from './lib/favorites';

type Selection = {
  tuneId: string;
  videoKey?: string;
};

const REFRESH_AFTER_MS = 5 * 60 * 1000;

function tunesCsvUrl() {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${baseUrl}data/tunes.csv?refresh=${Date.now()}`;
}

export default function App() {
  const [tunes, setTunes] = useState<Tune[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const lastLoadedAt = useRef(0);

  const loadTunes = useCallback(async (signal?: AbortSignal, showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(tunesCsvUrl(), {
        cache: 'no-store',
        signal,
      });

      if (!response.ok) {
        throw new Error(`Could not load CSV: ${response.status}`);
      }

      const csv = await response.text();
      setTunes(groupTunes(parseCsv(csv)));
      setLoadError(false);
      lastLoadedAt.current = Date.now();
    } catch (error) {
      if (!signal?.aborted) {
        console.error(error);
        if (showLoading) {
          setLoadError(true);
        }
      }
    } finally {
      if (!signal?.aborted && showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadTunes(controller.signal, true);

    return () => controller.abort();
  }, [loadTunes]);

  useEffect(() => {
    function refreshIfStale() {
      const hasStaleData = Date.now() - lastLoadedAt.current > REFRESH_AFTER_MS;

      if (document.visibilityState === 'visible' && hasStaleData) {
        void loadTunes();
      }
    }

    document.addEventListener('visibilitychange', refreshIfStale);
    window.addEventListener('focus', refreshIfStale);

    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale);
      window.removeEventListener('focus', refreshIfStale);
    };
  }, [loadTunes]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const selectedTune = useMemo(
    () => tunes.find((tune) => tune.id === selection?.tuneId),
    [selection, tunes],
  );

  function toggleFavorite(tuneId: string) {
    setFavorites((current) =>
      current.includes(tuneId)
        ? current.filter((id) => id !== tuneId)
        : [...current, tuneId],
    );
  }

  function openTune(tune: Tune, video?: TuneVideo) {
    setSelection({ tuneId: tune.id, videoKey: video?.key });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="app-shell">
      {showWelcome && <WelcomeDialog onClose={() => setShowWelcome(false)} />}

      {selection && selectedTune ? (
        <TuneDetail
          tune={selectedTune}
          initialVideoKey={selection.videoKey}
          isFavorite={favorites.includes(selectedTune.id)}
          onBack={() => setSelection(null)}
          onToggleFavorite={() => toggleFavorite(selectedTune.id)}
        />
      ) : (
        <TuneLibrary
          tunes={tunes}
          favoriteIds={favorites}
          isLoading={isLoading}
          loadError={loadError}
          onOpenTune={openTune}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </main>
  );
}
