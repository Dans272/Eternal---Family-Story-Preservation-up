import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { FamilyTree, Profile } from '../types';

const TreeView: React.FC<{
  tree: FamilyTree;
  profiles: Profile[];
  onBack: () => void;
  onOpenProfile: (id: string) => void;
}> = ({ tree, profiles, onBack, onOpenProfile }) => {
  const members = useMemo(() => {
    const map = new Map(profiles.map(p => [p.id, p]));
    return tree.memberIds.map(id => map.get(id)).filter(Boolean) as Profile[];
  }, [tree, profiles]);

  const home = profiles.find(p => p.id === tree.homePersonId) || null;

  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-6 bg-[#f5f2eb] border-b border-stone-200">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-2 text-stone-500">
            <ChevronLeft size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-serif text-slate-800">{tree.name}</h2>
            <p className="text-stone-400 text-[10px] font-bold uppercase">{tree.memberIds.length} members</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        {home && (
          <div className="bg-white p-5 rounded-[32px] border border-stone-50 shadow-sm flex items-center space-x-4">
            <Home className="text-amber-700" size={18} />
            <img src={home.imageUrl} className="w-12 h-12 rounded-2xl object-cover grayscale" />
            <div className="flex-1 text-left">
              <div className="text-[10px] font-black uppercase text-stone-400">Home person</div>
              <div className="font-serif text-xl">{home.name}</div>
            </div>
            <button onClick={() => onOpenProfile(home.id)} className="p-2 rounded-full hover:bg-stone-50">
              <ChevronRight className="text-stone-300" size={18} />
            </button>
          </div>
        )}

        <section className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Members</div>
          <div className="grid gap-3">
            {members.map(p => (
              <button
                key={p.id}
                onClick={() => onOpenProfile(p.id)}
                className="w-full bg-white p-4 rounded-[32px] shadow-sm border border-stone-50 flex items-center space-x-4 hover:shadow-md transition-all"
              >
                <img src={p.imageUrl} className="w-14 h-14 rounded-2xl object-cover grayscale" />
                <div className="text-left flex-1">
                  <h4 className="font-serif text-xl">{p.name}</h4>
                  <p className="text-[10px] text-stone-400 font-black uppercase mt-1">{p.birthYear} — {p.deathYear || '...'}</p>
                </div>
                <ChevronRight className="text-stone-200" size={18} />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TreeView;
