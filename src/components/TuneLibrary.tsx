import { useMemo, useState } from 'react';
import type { Tune, TuneVideo } from '../lib/tunes';
import { FavoritesSection } from './FavoritesSection';
import { SearchAndFilters, type SpeedFilter } from './SearchAndFilters';
import { TuneCard } from './TuneCard';

type Props = {
  tunes: Tune[];
  favoriteIds: string[];
  isLoading: boolean;
  loadError: boolean;
  onOpenTune: (tune: Tune, video?: TuneVideo) => void;
  onToggleFavorite: (tuneId: string) => void;
};

export function TuneLibrary({
  tunes,
  favoriteIds,
  isLoading,
  loadError,
  onOpenTune,
  onToggleFavorite,
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SpeedFilter>('All');

  const filteredTunes = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tunes.filter((tune) => {
      const matchesSearch = tune.name.toLowerCase().includes(searchValue);
      const matchesFilter =
        selectedFilter === 'All' || tune.videos.some((video) => video.speedGroup === selectedFilter);
      return matchesSearch && matchesFilter;
    });
  }, [search, selectedFilter, tunes]);

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Practice videos</p>
        <h1>Fiddle Tune Library</h1>
        <p className="subtitle">Find your tune, choose a speed, and start practicing.</p>
      </header>

      <SearchAndFilters
        search={search}
        selectedFilter={selectedFilter}
        onSearchChange={setSearch}
        onFilterChange={setSelectedFilter}
      />

      {loadError ? (
        <p className="notice" role="alert">
          The tune library could not be loaded. Please check the data file.
        </p>
      ) : isLoading ? (
        <p className="notice">Loading tunes...</p>
      ) : (
        <>
          <FavoritesSection
            tunes={tunes}
            favoriteIds={favoriteIds}
            onOpenTune={onOpenTune}
            onToggleFavorite={onToggleFavorite}
          />

          <section aria-labelledby="all-tunes-title">
            <div className="section-heading">
              <h2 id="all-tunes-title">All tunes</h2>
              <span>{filteredTunes.length} shown</span>
            </div>

            {filteredTunes.length === 0 ? (
              <p className="notice">No tunes found. Try another search.</p>
            ) : (
              <div className="tune-list">
                {filteredTunes.map((tune) => (
                  <TuneCard
                    key={tune.id}
                    tune={tune}
                    isFavorite={favoriteIds.includes(tune.id)}
                    onOpenTune={onOpenTune}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
