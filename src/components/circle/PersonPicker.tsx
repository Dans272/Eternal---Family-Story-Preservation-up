import React, { useState, useRef, useEffect } from 'react';
import { X, Search, User } from 'lucide-react';
import { Profile } from '../../types';
import { getFuzzyScore } from '../../utils/search';

interface PersonPickerProps {
  profiles: Profile[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const PersonPicker: React.FC<PersonPickerProps> = ({ profiles, selectedIds, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? profiles
        .map((p) => ({ p, score: getFuzzyScore(p.name, query) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((x) => x.p)
    : [];

  const selected = profiles.filter((p) => selectedIds.includes(p.id));

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            >
              {p.name.split(' ')[0]}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="text-amber-500 hover:text-amber-900 ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Tag a family member…"
          className="w-full bg-stone-50 border border-stone-100 rounded-xl py-2 pl-9 pr-3 text-[12px] font-serif outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
        />
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
          {results.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { toggle(p.id); setQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors ${isSelected ? 'bg-amber-50' : ''}`}
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-7 h-7 rounded-lg object-cover grayscale flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-serif text-[12px] text-slate-800 block truncate">{p.name}</span>
                  <span className="text-[10px] text-stone-400">{p.birthYear}{p.deathYear ? `–${p.deathYear}` : ''}</span>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold text-amber-600">Tagged</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
