import type { Tune, TuneVideo } from '../lib/tunes';
import { TuneCard } from './TuneCard';

type Props = {
  tunes: Tune[];
  favoriteIds: string[];
  onOpenTune: (tune: Tune, video?: TuneVideo) => void;
  onToggleFavorite: (tuneId: string) => void;
};

export function FavoritesSection({ tunes, favoriteIds, onOpenTune, onToggleFavorite }: Props) {
  const favorites = favoriteIds
    .map((id) => tunes.find((tune) => tune.id === id))
    .filter((tune): tune is Tune => Boolean(tune));

  if (favorites.length === 0) return null;

  return (
    <section className="favorites-section" aria-labelledby="favorites-title">
      <div className="section-heading">
        <h2 id="favorites-title">Favorites</h2>
      </div>
      <div className="tune-list">
        {favorites.map((tune) => (
          <TuneCard
            key={tune.id}
            tune={tune}
            isFavorite
            onOpenTune={onOpenTune}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
