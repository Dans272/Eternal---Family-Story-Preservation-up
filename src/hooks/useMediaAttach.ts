import { useState } from 'react';
import { AppView, MediaItem, Profile, User } from '../types';
import { compressImage } from '../utils/media';
import { inferMediaKind } from '../utils/formatters';

export const useMediaAttach = (args: {
  user?: User | null;
  activeProfileId: string | null;
  view: AppView;
  attachingToEventId: string | null;
  setAttachingToEventId: (id: string | null) => void;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  setEditImageUrl: (v: string) => void;
  toast: (m: string) => void;
}) => {
  const {
    activeProfileId, view, attachingToEventId,
    setAttachingToEventId, setProfiles, setEditImageUrl, toast,
  } = args;
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfileId) return;
    setIsPhotoLoading(true);
    try {
      const base64 = await compressImage(file);
      if (view === AppView.EDIT_PROFILE) setEditImageUrl(base64);
      else setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, imageUrl: base64 } : p));
      toast('Photo updated');
    } catch (err) {
      console.error(err);
      toast('Error processing photo');
    } finally {
      setIsPhotoLoading(false);
      e.target.value = '';
    }
  };

  const handleEventMediaUpload = async (eventId: string, files: FileList) => {
    if (!activeProfileId || !files.length) return;
    toast('Processing...');
    try {
      const newMediaItems: MediaItem[] = await Promise.all(
        Array.from(files).map(async (file: File) => {
          const kind = inferMediaKind(file.name, file.type);
          let url = '';
          if (kind === 'photo') {
            url = await compressImage(file);
          } else {
            url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = ev => resolve(ev.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }
          return {
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            kind,
            url,
            mime: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
          };
        })
      );

      setProfiles(prev =>
        prev.map(p =>
          p.id !== activeProfileId ? p : {
            ...p,
            timeline: p.timeline.map(ev =>
              ev.id !== eventId ? ev : {
                ...ev,
                media: [...(ev.media ?? []), ...newMediaItems],
              }
            ),
          }
        )
      );
      toast(`Attached ${newMediaItems.length} file${newMediaItems.length !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error(err);
      toast('Upload error');
    }
  };

  return { isPhotoLoading, handleProfilePhotoUpload, handleEventMediaUpload };
};
