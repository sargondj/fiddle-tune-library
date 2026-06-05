import { useEffect, useMemo, useState } from 'react';
import { TuneDetail } from './components/TuneDetail';
import { TuneLibrary } from './components/TuneLibrary';
import { groupTunes, parseCsv, type Tune, type TuneVideo } from './lib/tunes';
import { loadFavorites, saveFavorites } from './lib/favorites';

type Selection = {
  tuneId: string;
  videoKey?: string;
};

export default function App() {
  const [tunes, setTunes] = useState<Tune[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTunes() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/tunes.csv`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load CSV: ${response.status}`);
        }

        const csv = await response.text();
        setTunes(groupTunes(parseCsv(csv)));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTunes();

    return () => controller.abort();
  }, []);

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
