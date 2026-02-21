import React from 'react';
import { ChevronLeft, ChevronRight, GitBranch } from 'lucide-react';
import { FamilyTree } from '../types';

const TreesView: React.FC<{
  trees: FamilyTree[];
  selectedTreeId: string | null;
  onBack: () => void;
  onSelectTree: (id: string) => void;
  onOpenTree: (id: string) => void;
}> = ({ trees, selectedTreeId, onBack, onSelectTree, onOpenTree }) => {
  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-6 bg-[#f5f2eb] border-b border-stone-200">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-2 text-stone-500">
            <ChevronLeft size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-serif text-slate-800">Trees</h2>
            <p className="text-stone-400 text-[10px] font-bold uppercase">{trees.length} total</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        {trees.length === 0 ? (
          <div className="text-center space-y-6 mt-10">
            <GitBranch size={48} className="mx-auto text-stone-200" />
            <p className="font-serif text-stone-500 italic">No trees yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {trees.map(t => (
              <div key={t.id} className="w-full bg-white p-4 rounded-[32px] shadow-sm border border-stone-50 flex items-center space-x-4">
                <button
                  onClick={() => onSelectTree(t.id)}
                  className={`w-5 h-5 rounded-full border ${selectedTreeId === t.id ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}
                  aria-label="Select tree"
                />
                <div className="text-left flex-1">
                  <h4 className="font-serif text-xl">{t.name}</h4>
                  <p className="text-[10px] text-stone-400 font-black uppercase mt-1">{t.memberIds.length} members</p>
                </div>
                <button onClick={() => onOpenTree(t.id)} className="p-2 rounded-full hover:bg-stone-50">
                  <ChevronRight className="text-stone-300" size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TreesView;
