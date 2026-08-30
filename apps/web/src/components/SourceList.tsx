import type { Source } from '@synthcouncil/schemas';

export default function SourceList({ sources, compact = false }: { sources: Source[]; compact?: boolean }) {
  if (sources.length === 0) return <span className="muted">No sources cited</span>;
  return (
    <ul className={`source-list${compact ? ' compact' : ''}`}>
      {sources.map((source, index) => (
        <li key={`${source.url}-${index}`}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title}
          </a>
          <span className="source-url">{source.url}</span>
        </li>
      ))}
    </ul>
  );
}
