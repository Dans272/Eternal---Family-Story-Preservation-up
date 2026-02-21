import React from 'react';
import { ChevronLeft } from 'lucide-react';

const CreateMemoryView: React.FC<{
  newMemoryInput: string;
  setNewMemoryInput: (v: string) => void;
  onBack: () => void;
  onSave: () => void;
}> = (props) => {
  return (
    <div className="flex flex-col h-full bg-[#f5f2eb]">
      <header className="pt-16 px-8 pb-6 bg-white border-b flex justify-between items-center">
        <button onClick={props.onBack} className="text-stone-400 text-[10px] font-bold uppercase">
          <ChevronLeft size={16} className="inline" /> Back
        </button>
        <h2 className="text-xl font-serif">Create Memory</h2>
        <button onClick={props.onSave} className="bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase">
          Save
        </button>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 space-y-4">
          <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">Memory</div>
          <textarea
            value={props.newMemoryInput}
            onChange={(e) => props.setNewMemoryInput(e.target.value)}
            className="w-full min-h-[240px] p-4 rounded-2xl border border-stone-200 outline-none"
            placeholder="Write a memory, story, or anecdote"
          />
        </div>
      </main>
    </div>
  );
};

export default CreateMemoryView;
