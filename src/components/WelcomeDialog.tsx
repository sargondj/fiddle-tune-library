type Props = {
  onClose: () => void;
};

export function WelcomeDialog({ onClose }: Props) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="welcome-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-description"
      >
        <button
          className="dialog-close"
          type="button"
          aria-label="Close welcome message"
          onClick={onClose}
        >
          x
        </button>

        <p className="eyebrow">Welcome</p>
        <h2 id="welcome-title">Fiddle Tune Library</h2>
        <div id="welcome-description" className="welcome-copy">
          <p>Find a tune, choose a practice speed, and play along with the video.</p>
          <p>Use search when you know the tune name, or tap a speed filter to browse.</p>
          <p>Star your favorites so they are easy to find next time.</p>
        </div>

        <button className="dialog-primary" type="button" onClick={onClose}>
          Start practicing
        </button>
      </section>
    </div>
  );
}
