import { useEffect, useMemo, useState } from 'react';
import type { Tune } from '../lib/tunes';
import { YouTubePlayer } from './YouTubePlayer';

type Props = {
  tune: Tune;
  initialVideoKey?: string;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
};

const defaultSpeedPriority = ['Slow', 'Medium', 'Fast', 'Other'];

export function TuneDetail({ tune, initialVideoKey, isFavorite, onBack, onToggleFavorite }: Props) {
  const defaultVideo = useMemo(() => {
    const directMatch = tune.videos.find((video) => video.key === initialVideoKey);
    if (directMatch) return directMatch;

    return (
      defaultSpeedPriority
        .map((speed) => tune.videos.find((video) => video.speedGroup === speed))
        .find(Boolean) ?? tune.videos[0]
    );
  }, [initialVideoKey, tune.videos]);

  const [selectedVideoKey, setSelectedVideoKey] = useState(defaultVideo?.key ?? '');

  useEffect(() => {
    setSelectedVideoKey(defaultVideo?.key ?? '');
  }, [defaultVideo?.key]);

  const selectedVideo =
    tune.videos.find((video) => video.key === selectedVideoKey) ?? defaultVideo ?? tune.videos[0];

  return (
    <article className="detail-view">
      <button className="back-button" type="button" onClick={onBack}>
        Back to tunes
      </button>

      <header className="detail-header">
        <div>
          <p className="eyebrow">Now practicing</p>
          <h1>{tune.name}</h1>
        </div>
        <button
          className="favorite-button"
          data-selected={isFavorite}
          type="button"
          aria-label={isFavorite ? `Remove ${tune.name} from favorites` : `Add ${tune.name} to favorites`}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
        >
          <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
          <span>{isFavorite ? 'Favorite' : 'Add favorite'}</span>
        </button>
      </header>

      <div className="speed-list detail-speeds" aria-label={`Choose a speed for ${tune.name}`}>
        {tune.videos.map((video) => (
          <button
            className={`speed-button speed-${video.speedGroup.toLowerCase()}`}
            data-selected={selectedVideo?.key === video.key}
            key={video.key}
            type="button"
            aria-pressed={selectedVideo?.key === video.key}
            onClick={() => setSelectedVideoKey(video.key)}
          >
            {video.displayLabel}
          </button>
        ))}
      </div>

      {selectedVideo ? <YouTubePlayer video={selectedVideo} /> : <p className="notice">Video link coming soon.</p>}

      {tune.pdfUrl && (
        <section className="resource-section" aria-labelledby="resource-title">
          <h2 id="resource-title">Sheet music</h2>
          <a className="link-button" href={tune.pdfUrl} target="_blank" rel="noreferrer">
            PDF of this tune
          </a>
        </section>
      )}

      {tune.notes.length > 0 && (
        <section className="notes-section" aria-labelledby="notes-title">
          <h2 id="notes-title">Notes</h2>
          {tune.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      )}
    </article>
  );
}
