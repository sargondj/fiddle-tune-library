import type { Tune, TuneVideo } from '../lib/tunes';

type Props = {
  tune: Tune;
  isFavorite: boolean;
  onOpenTune: (tune: Tune, video?: TuneVideo) => void;
  onToggleFavorite: (tuneId: string) => void;
};

export function TuneCard({ tune, isFavorite, onOpenTune, onToggleFavorite }: Props) {
  return (
    <article className="tune-card">
      <div className="tune-card-main">
        <button className="tune-title-button" type="button" onClick={() => onOpenTune(tune)}>
          {tune.name}
        </button>
        <button
          className="favorite-button"
          data-selected={isFavorite}
          type="button"
          aria-label={isFavorite ? `Remove ${tune.name} from favorites` : `Add ${tune.name} to favorites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(tune.id)}
        >
          <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
          <span>{isFavorite ? 'Favorite' : 'Add favorite'}</span>
        </button>
      </div>

      <div className="speed-list" aria-label={`Speeds for ${tune.name}`}>
        {tune.videos.map((video) => (
          <button
            className={`speed-button speed-${video.speedGroup.toLowerCase()}`}
            key={video.key}
            type="button"
            onClick={() => onOpenTune(tune, video)}
          >
            <span>{video.displayLabel}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
