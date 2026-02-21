import { useRef, useState } from 'react';
import { AppView, FamilyTree, Profile, User } from '../types';
import { parseGedcom } from '../utils/gedcom';
import { assertAuthenticated, AuthenticationError } from '../utils/assertAuthenticated';

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
    // ── Auth guard ────────────────────────────────────────────────────────────
    // This is a hard gate, not just a UI hide. Even if someone triggers the
    // file input programmatically (e.g. via browser DevTools or a script),
    // no file data will be read and no state will change without a session.
    try {
      assertAuthenticated(user, 'GEDCOM upload');
    } catch (err) {
      e.target.value = '';
      if (err instanceof AuthenticationError) {
        toast('Please sign in to import a family archive.');
      }
      return;
    }

    const f = e.target.files?.[0];
    if (!f) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        try {
          // user is guaranteed non-null here because assertAuthenticated passed.
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
    // ── Auth guard ────────────────────────────────────────────────────────────
    // chooseHome is the second step of the import flow. Guard it independently
    // so that even a stale pending import cannot be committed without a session.
    try {
      assertAuthenticated(user, 'GEDCOM home selection');
    } catch (err) {
      if (err instanceof AuthenticationError) {
        toast('Please sign in to complete the import.');
      }
      return;
    }

    if (!pendingImport) return;

    setProfiles((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newProfiles = pendingImport.importedProfiles.filter((p) => !existingIds.has(p.id));
      return [...prev, ...newProfiles];
    });

    const updatedTree: FamilyTree = {
      ...pendingImport.tree,
      homePersonId: selected.id,
      name: `The ${selected.name} Archive`
    };

    setFamilyTrees((prev) => [updatedTree, ...prev]);
    setSelectedTreeId(updatedTree.id);
    setActiveProfileId(selected.id);
    setPendingImport(null);
    setView(AppView.HOME);
    toast('Archive successfully imported');
  };

  return { gedFileInputRef, pendingImport, setPendingImport, handleGedcomUpload, chooseHome };
};
