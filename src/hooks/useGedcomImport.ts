import { useRef, useState } from 'react';
import { AppView, FamilyTree, Profile, User } from '../types';
import { parseGedcom } from '../utils/gedcom';

export const useGedcomImport = (args: {
  user: User | null;
  setView: (v: AppView) => void;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  setFamilyTrees: React.Dispatch<React.SetStateAction<FamilyTree[]>>;
  setSelectedTreeId: (id: string | null) => void;
  setActiveProfileId: (id: string | null) => void;
  toast: (m: string) => void;
}) => {
  const { user, setView, setProfiles, setFamilyTrees, setSelectedTreeId, setActiveProfileId, toast } = args;

  const gedFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ importedProfiles: Profile[]; tree: FamilyTree } | null>(null);

  const handleGedcomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hard auth gate — no session, no upload
    if (!user) {
      toast('Please sign in to import a family archive.');
      e.target.value = '';
      return;
    }

    const f = e.target.files?.[0];
    if (!f) { e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        try {
          const result = parseGedcom(text, user.id, 4);
          setPendingImport(result);
          setView(AppView.SELECT_HOME);
          toast(`Loaded ${result.importedProfiles.length} family members`);
        } catch (err) {
          console.error(err);
          toast('Error parsing GEDCOM');
        }
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const chooseHome = (selected: Profile) => {
    if (!pendingImport || !user) return;

    setProfiles(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newProfiles = pendingImport.importedProfiles.filter(p => !existingIds.has(p.id));
      return [...prev, ...newProfiles];
    });

    const updatedTree: FamilyTree = {
      ...pendingImport.tree,
      homePersonId: selected.id,
      name: `The ${selected.name} Archive`,
    };

    setFamilyTrees(prev => [updatedTree, ...prev]);
    setSelectedTreeId(updatedTree.id);
    setActiveProfileId(selected.id);
    setPendingImport(null);
    setView(AppView.HOME);
    toast('Archive successfully imported');
  };

  return { gedFileInputRef, pendingImport, setPendingImport, handleGedcomUpload, chooseHome };
};
