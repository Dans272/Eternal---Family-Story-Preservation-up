import React from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { Profile } from '../types';

const LinkRelativeView: React.FC<{
  linkRole: 'parent' | 'spouse' | 'child' | null;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchResults: Profile[];
  onBack: () => void;
  onSelect: (p: Profile) => void;
}> = (props) => {
  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-6 bg-[#f5f2eb] border-b border-stone-200">
        <div className="flex justify-between items-center">
          <button onClick={props.onBack} className="text-stone-400 text-[10px] font-bold uppercase">
            <ChevronLeft size={16} className="inline" /> Back
          </button>
          <h2 className="text-xl font-serif">Link {props.linkRole ?? ''}</h2>
          <div />
        </div>

        <div className="mt-6 flex items-center space-x-3 bg-white rounded-full border border-stone-200 px-4 py-3">
          <Search size={18} className="text-stone-300" />
          <input
            value={props.searchQuery}
            onChange={(e) => props.setSearchQuery(e.target.value)}
            placeholder="Search people"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="grid gap-3">
          {props.searchResults.map(p => (
            <button
              key={p.id}
              onClick={() => props.onSelect(p)}
              className="w-full bg-white p-4 rounded-[32px] shadow-sm border border-stone-50 flex items-center space-x-4 hover:shadow-md transition-all"
            >
              <img src={p.imageUrl} className="w-14 h-14 rounded-2xl object-cover grayscale" />
              <div className="text-left flex-1">
                <h4 className="font-serif text-xl">{p.name}</h4>
                <p className="text-[10px] text-stone-400 font-black uppercase mt-1">{p.birthYear} — {p.deathYear || '...'}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LinkRelativeView;
