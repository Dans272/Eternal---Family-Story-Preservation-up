import React, { useMemo, useState } from 'react';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { Profile } from '../types';

type PendingImport = { importedProfiles: Profile[]; tree: any } | null;

const SelectHomeView: React.FC<{
  pendingImport: PendingImport;
  onBack: () => void;
  onChooseHome: (p: Profile) => void;
}> = ({ pendingImport, onBack, onChooseHome }) => {
  const [q, setQ] = useState('');

  const candidates = useMemo(() => {
    const list = pendingImport?.importedProfiles || [];
    const query = q.trim().toLowerCase();
    if (!query) return list.slice(0, 80);
    return list
      .filter(p => (p.name || '').toLowerCase().includes(query))
      .slice(0, 80);
  }, [pendingImport, q]);

  if (!pendingImport) {
    return (
      <div className="flex flex-col h-full bg-[#f9f8f6]">
        <header className="pt-16 px-8 pb-6 bg-[#f5f2eb] border-b border-stone-200">
          <button onClick={onBack} className="flex items-center space-x-2 text-stone-500">
            <ChevronLeft size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
          </button>
        </header>
        <main className="p-8">
          <p className="font-serif text-stone-600 italic">No import is pending.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-6 bg-[#f5f2eb] border-b border-stone-200">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-2 text-stone-500">
            <ChevronLeft size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-serif text-slate-800">Select Home Person</h2>
            <p className="text-stone-400 text-[10px] font-bold uppercase">
              {pendingImport.importedProfiles.length} imported profiles
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-3 bg-white rounded-full border border-stone-200 px-4 py-3">
          <Search size={18} className="text-stone-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search imported people"
            className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-stone-400"
          />
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="grid gap-3">
          {candidates.map(p => (
            <button
              key={p.id}
              onClick={() => onChooseHome(p)}
              className="w-full bg-white p-4 rounded-[32px] shadow-sm border border-stone-50 flex items-center space-x-4 hover:shadow-md transition-all"
            >
              <img src={p.imageUrl} className="w-14 h-14 rounded-2xl object-cover grayscale" />
              <div className="text-left flex-1">
                <h4 className="font-serif text-xl">{p.name}</h4>
                <p className="text-[10px] text-stone-400 font-black uppercase mt-1">
                  {p.birthYear} — {p.deathYear || '...'}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-amber-700">
                <Check size={18} />
                <span className="text-[10px] font-bold uppercase">Make home</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SelectHomeView;
