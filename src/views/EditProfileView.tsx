import React from 'react';
import { ChevronLeft } from 'lucide-react';

const EditProfileView: React.FC<{
  editName: string;
  setEditName: (v: string) => void;
  editGender: string;
  setEditGender: (v: string) => void;
  editBirthYear: string;
  setEditBirthYear: (v: string) => void;
  editDeathYear: string;
  setEditDeathYear: (v: string) => void;
  editImageUrl: string;
  setEditImageUrl: (v: string) => void;

  onBack: () => void;
  onSave: () => void;
}> = (props) => {
  return (
    <div className="flex flex-col h-full bg-[#f5f2eb]">
      <header className="pt-16 px-8 pb-6 bg-white border-b flex justify-between items-center">
        <button onClick={props.onBack} className="text-stone-400 text-[10px] font-bold uppercase">
          <ChevronLeft size={16} className="inline" /> Back
        </button>
        <h2 className="text-xl font-serif">Edit Profile</h2>
        <button onClick={props.onSave} className="bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase">
          Save
        </button>
      </header>

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 space-y-4">
          <label className="block">
            <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">Full name</div>
            <input value={props.editName} onChange={(e) => props.setEditName(e.target.value)} className="w-full p-4 rounded-2xl border border-stone-200 outline-none" />
          </label>

          <label className="block">
            <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">Gender</div>
            <input value={props.editGender} onChange={(e) => props.setEditGender(e.target.value)} className="w-full p-4 rounded-2xl border border-stone-200 outline-none" placeholder="M, F, or other" />
          </label>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">Birth year</div>
              <input value={props.editBirthYear} onChange={(e) => props.setEditBirthYear(e.target.value)} className="w-full p-4 rounded-2xl border border-stone-200 outline-none" />
            </label>
            <label className="block">
              <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">Death year</div>
              <input value={props.editDeathYear} onChange={(e) => props.setEditDeathYear(e.target.value)} className="w-full p-4 rounded-2xl border border-stone-200 outline-none" />
            </label>
          </div>

          <label className="block">
            <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">Image URL</div>
            <input value={props.editImageUrl} onChange={(e) => props.setEditImageUrl(e.target.value)} className="w-full p-4 rounded-2xl border border-stone-200 outline-none" />
          </label>
        </div>
      </main>
    </div>
  );
};

export default EditProfileView;
