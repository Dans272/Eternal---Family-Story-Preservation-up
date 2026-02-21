import { useState } from 'react';
import { Profile } from '../types';

export const useProfileEditor = (args: {
  activeProfile: Profile | null;
  activeProfileId: string | null;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  toast: (m: string) => void;
}) => {
  const { activeProfile, activeProfileId, setProfiles, toast } = args;

  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'M' | 'F' | 'U'>('U');
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editDeathYear, setEditDeathYear] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [linkRole, setLinkRole] = useState<'parent' | 'child' | 'spouse' | null>(null);

  const startEdit = () => {
    if (!activeProfile) return;
    setEditName(activeProfile.name);
    setEditGender(activeProfile.gender || 'U');
    setEditBirthYear(activeProfile.birthYear);
    setEditDeathYear(activeProfile.deathYear || '');
    setEditImageUrl(activeProfile.imageUrl);
  };

  const saveEdit = () => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? {
              ...p,
              name: editName,
              gender: editGender,
              birthYear: editBirthYear,
              deathYear: editDeathYear || undefined,
              imageUrl: editImageUrl
            }
          : p
      )
    );
    toast('Profile updated');
  };

  const deleteProfile = (confirmFn: (msg: string) => boolean) => {
    if (!activeProfileId) return false;
    const name = activeProfile?.name || 'this profile';
    if (confirmFn(`Remove ${name}?`)) {
      setProfiles((prev) => prev.filter((p) => p.id !== activeProfileId));
      toast('Removed');
      return true;
    }
    return false;
  };

  const linkRelative = (targetProfile: Profile) => {
    if (!activeProfileId || !linkRole) return;
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === activeProfileId) {
          const u = { ...p };
          if (linkRole === 'parent' && !u.parentIds.includes(targetProfile.id)) u.parentIds = [...u.parentIds, targetProfile.id];
          if (linkRole === 'child' && !u.childIds.includes(targetProfile.id)) u.childIds = [...u.childIds, targetProfile.id];
          if (linkRole === 'spouse' && !u.spouseIds.includes(targetProfile.id)) u.spouseIds = [...u.spouseIds, targetProfile.id];
          return u;
        }
        if (p.id === targetProfile.id) {
          const u = { ...p };
          if (linkRole === 'parent' && !u.childIds.includes(activeProfileId)) u.childIds = [...u.childIds, activeProfileId];
          if (linkRole === 'child' && !u.parentIds.includes(activeProfileId)) u.parentIds = [...u.parentIds, activeProfileId];
          if (linkRole === 'spouse' && !u.spouseIds.includes(activeProfileId)) u.spouseIds = [...u.spouseIds, activeProfileId];
          return u;
        }
        return p;
      })
    );
    toast('Link established');
    setLinkRole(null);
  };

  const saveMemory = () => {
    if (!activeProfileId || !newMemoryInput.trim()) return;
    const m = {
      id: Date.now().toString(),
      type: 'story' as const,
      content: newMemoryInput,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
    setProfiles((prev) => prev.map((p) => (p.id === activeProfileId ? { ...p, memories: [m, ...(p.memories || [])] } : p)));
    setNewMemoryInput('');
    toast('Story preserved');
  };

  return {
    editName, setEditName,
    editGender, setEditGender,
    editBirthYear, setEditBirthYear,
    editDeathYear, setEditDeathYear,
    editImageUrl, setEditImageUrl,
    startEdit, saveEdit, deleteProfile,
    newMemoryInput, setNewMemoryInput, saveMemory,
    linkRole, setLinkRole, linkRelative
  };
};
