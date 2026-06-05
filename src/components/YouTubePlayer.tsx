import type { TuneVideo } from '../lib/tunes';

type Props = {
  video: TuneVideo;
};

export function YouTubePlayer({ video }: Props) {
  if (video.youtubeId) {
    const title = video.displayLabel ? `${video.displayLabel} fiddle tune video` : 'Fiddle tune video';

    return (
      <div className="video-frame">
        <iframe
          title={title}
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (video.videoUrl) {
    return (
      <div className="video-fallback">
        <p>This video opens best on YouTube.</p>
        <a className="link-button" href={video.videoUrl} target="_blank" rel="noreferrer">
          Open on YouTube
        </a>
      </div>
    );
  }

  return <p className="notice">Video link coming soon.</p>;
}
