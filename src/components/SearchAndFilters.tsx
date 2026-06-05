import type { SpeedGroup } from '../lib/tunes';

export type SpeedFilter = SpeedGroup | 'All';

const filters: SpeedFilter[] = ['All', 'Slow', 'Medium', 'Fast', 'Other'];

type Props = {
  search: string;
  selectedFilter: SpeedFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: SpeedFilter) => void;
};

export function SearchAndFilters({
  search,
  selectedFilter,
  onSearchChange,
  onFilterChange,
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
    </section>
  );
}
