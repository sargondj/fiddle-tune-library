import type { SpeedGroup } from '../lib/tunes';

export type SpeedFilter = SpeedGroup | 'All';

const filters: SpeedFilter[] = ['All', 'Slow', 'Medium', 'Fast', 'Other'];

type Props = {
  search: string;
  selectedFilter: SpeedFilter;
  eventFilters: string[];
  selectedEventFilter: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: SpeedFilter) => void;
  onEventFilterChange: (value: string) => void;
};

export function SearchAndFilters({
  search,
  selectedFilter,
  eventFilters,
  selectedEventFilter,
  onSearchChange,
  onFilterChange,
  onEventFilterChange,
}: Props) {
  return (
    <section className="controls" aria-label="Search and filter tunes">
      <label className="search-label" htmlFor="tune-search">
        Search
      </label>
      <input
        id="tune-search"
        className="search-input"
        type="search"
        placeholder="Search for a tune"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="filter-group" aria-label="Speed filters">
        {filters.map((filter) => (
          <button
            className="chip"
            data-selected={selectedFilter === filter}
            key={filter}
            type="button"
            aria-pressed={selectedFilter === filter}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {eventFilters.length > 0 && (
        <div className="event-filter-section">
          <p className="filter-label">Practice lists</p>
          <div className="filter-group" aria-label="Practice list filters">
            <button
              className="chip"
              data-selected={selectedEventFilter === ''}
              type="button"
              aria-pressed={selectedEventFilter === ''}
              onClick={() => onEventFilterChange('')}
            >
              All tunes
            </button>
            {eventFilters.map((filter) => (
              <button
                className="chip event-chip"
                data-selected={selectedEventFilter === filter}
                key={filter}
                type="button"
                aria-pressed={selectedEventFilter === filter}
                onClick={() => onEventFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
