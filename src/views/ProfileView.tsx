import React from 'react';
import {
  ChevronLeft, ChevronRight, PenTool, Sparkles, History, ScrollText, Heart, MapPin,
  Anchor, Map as MapIcon, Quote, CloudUpload, ExternalLink, Library, Globe, Image as ImageIcon,
  Settings, Trash2, Users, UserPlus, Camera, Upload
} from 'lucide-react';
import { AppView, Profile, MediaItem, LifeEvent, FamilyTree } from '../types';
import { getEventIcon, getPlaceholderImage } from '../constants';
import { formatEventSentence, inferMediaKind } from '../utils/formatters';
import { formatFullDate } from '../utils/date';

type RelSet = { parents: Profile[]; spouses: Profile[]; children: Profile[] }

// Extract year string for the year-chip display
const getEventYear = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown';
  const m = dateStr.match(/\b(\d{4})\b/);
  return m ? m[1] : 'Unknown';
};

// Self-contained per-event media uploader
const EventMediaUploader: React.FC<{
  eventId: string;
  onFilesSelected: (eventId: string, files: FileList) => void;
}> = ({ eventId, onFilesSelected }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="mt-4 pt-4 border-t border-stone-100">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">
        Attach photos, videos, or audio
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.accept = 'image/*'; inputRef.current.click(); }}}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-amber-50 hover:border-amber-200 transition-colors"
        >
          <span className="text-base">🖼</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-600">Photo</span>
        </button>
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.accept = 'video/*'; inputRef.current.click(); }}}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-amber-50 hover:border-amber-200 transition-colors"
        >
          <span className="text-base">🎬</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-600">Video</span>
        </button>
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.accept = 'audio/*'; inputRef.current.click(); }}}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-amber-50 hover:border-amber-200 transition-colors"
        >
          <span className="text-base">🎵</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-600">Audio</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) { onFilesSelected(eventId, e.target.files); e.target.value = ''; }}}
      />
    </div>
  );
};;

const ProfileView: React.FC<{
  activeProfile: Profile;
  profiles: Profile[];
  familyTrees: FamilyTree[];
  selectedTreeId: string | null;

  // navigation
  onBack: () => void;
  onEdit: () => void;
  onLinkRelative: (role: 'parent' | 'spouse' | 'child') => void;

  // mutations
  onDeleteProfile: () => void;
  onSetActiveProfile: (id: string) => void;

  // media upload
  onUploadMediaClick: () => void;
  onMediaFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaInputRef: React.RefObject<HTMLInputElement>;
  onEventMediaUpload: (eventId: string, files: FileList) => void;

  // event attachment
  attachingToEventId: string | null;
  setAttachingToEventId: (id: string | null) => void;

  // AI states + actions
  isAiLoading: boolean;
  isResearchLoading: boolean;
  isPhotoLoading: boolean;
  isGeneratingPortrait: boolean;

  onGenerateSummary: () => void;
  onResearch: () => void;
  onGeneratePortrait: () => void;

  // toast helper for inline triggers if needed
  showToast: (m: string) => void;
}> = (props) => {
  const {
    activeProfile, profiles,
    onBack, onEdit, onLinkRelative,
    onDeleteProfile, onSetActiveProfile,
    onUploadMediaClick, onMediaFileChange, mediaInputRef,
    attachingToEventId, setAttachingToEventId,
    isAiLoading, isResearchLoading, isPhotoLoading, isGeneratingPortrait,
    onGenerateSummary, onResearch, onGeneratePortrait
  } = props;

  const isPlaceholder = activeProfile.imageUrl.startsWith('data:image/svg+xml');
  const rels: RelSet = {
    parents: profiles.filter(p => activeProfile.parentIds.includes(p.id)),
    spouses: profiles.filter(p => activeProfile.spouseIds.includes(p.id)),
    children: profiles.filter(p => activeProfile.childIds.includes(p.id))
  };

  const timeline = [...(activeProfile.timeline || [])].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return da.localeCompare(db);
  });

  // Flatten all media from timeline events for the gallery section
  const media = timeline.flatMap(ev => ev.media || []) as MediaItem[];

  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      <header className="pt-16 px-8 pb-4 bg-[#f5f2eb] flex justify-between items-center">
        <button onClick={onBack} className="text-stone-400 flex items-center space-x-2">
          <ChevronLeft size={18} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Archive</span>
        </button>
        <div className="flex items-center space-x-2">
          <button onClick={onEdit} className="p-2 rounded-full bg-white border border-stone-200 text-stone-400">
            <PenTool size={16} />
          </button>
          <button onClick={onDeleteProfile} className="p-2 rounded-full bg-white border border-stone-200 text-stone-400">
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="pt-6 pb-8 flex items-start space-x-6">
          <div className="relative">
            <img src={activeProfile.imageUrl || getPlaceholderImage(activeProfile.id)} className="w-28 h-28 rounded-[34px] object-cover grayscale border border-stone-100 shadow-sm" />
            <button
              onClick={onUploadMediaClick}
              className="absolute -bottom-2 -right-2 p-2 rounded-full bg-stone-900 text-white shadow"
              aria-label="Add media"
            >
              <Camera size={16} />
            </button>
            <input ref={mediaInputRef} type="file" onChange={onMediaFileChange} accept="image/*,video/*" className="hidden" />
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-serif text-slate-900 leading-tight">{activeProfile.name}</h2>
            <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
              {activeProfile.birthYear} — {activeProfile.deathYear || '...'}
            </div>
            {activeProfile.summary && (
              <p className="mt-4 text-sm text-stone-600 leading-relaxed">{activeProfile.summary}</p>
            )}
          </div>
        </div>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">AI Studio</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <button
              onClick={onGenerateSummary}
              disabled={isAiLoading}
              className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm text-left hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="text-amber-600" size={18} />
                <div className="font-black uppercase text-[10px] tracking-widest text-stone-500">
                  {isAiLoading ? 'Generating...' : 'Generate Summary'}
                </div>
              </div>
              <div className="mt-2 text-sm text-stone-600">Short biography from the profile and timeline.</div>
            </button>

            <button
              onClick={onResearch}
              disabled={isResearchLoading}
              className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm text-left hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <Library className="text-amber-600" size={18} />
                <div className="font-black uppercase text-[10px] tracking-widest text-stone-500">
                  {isResearchLoading ? 'Researching...' : 'Historical Context'}
                </div>
              </div>
              <div className="mt-2 text-sm text-stone-600">Add period context based on time and places.</div>
            </button>

            <button
              onClick={onGeneratePortrait}
              disabled={isGeneratingPortrait || isPhotoLoading}
              className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm text-left hover:shadow-md transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <ImageIcon className="text-amber-600" size={18} />
                <div className="font-black uppercase text-[10px] tracking-widest text-stone-500">
                  {(isGeneratingPortrait || isPhotoLoading) ? 'Generating...' : 'Portrait'}
                </div>
              </div>
              <div className="mt-2 text-sm text-stone-600">Generate a respectful AI portrait concept.</div>
            </button>
          </div>
        </section>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Relationships</h3>
            <div className="flex items-center space-x-2">
              <button onClick={() => onLinkRelative('parent')} className="text-[10px] font-bold uppercase text-amber-700 flex items-center space-x-1">
                <UserPlus size={14} /><span>Parent</span>
              </button>
              <button onClick={() => onLinkRelative('spouse')} className="text-[10px] font-bold uppercase text-amber-700 flex items-center space-x-1">
                <UserPlus size={14} /><span>Spouse</span>
              </button>
              <button onClick={() => onLinkRelative('child')} className="text-[10px] font-bold uppercase text-amber-700 flex items-center space-x-1">
                <UserPlus size={14} /><span>Child</span>
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[{ label: 'Parents', list: rels.parents }, { label: 'Spouses', list: rels.spouses }, { label: 'Children', list: rels.children }].map(group => (
              <div key={group.label} className="bg-white p-5 rounded-[32px] border border-stone-50 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{group.label}</div>
                <div className="mt-3 space-y-2">
                  {group.list.length === 0 ? (
                    <div className="text-sm text-stone-400 italic">None listed</div>
                  ) : group.list.map(p => (
                    <button key={p.id} onClick={() => onSetActiveProfile(p.id)} className="w-full flex items-center space-x-3 p-2 rounded-2xl hover:bg-stone-50 transition-all">
                      <img src={p.imageUrl} className="w-10 h-10 rounded-2xl object-cover grayscale" />
                      <div className="text-left flex-1">
                        <div className="font-serif text-lg">{p.name}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase">{p.birthYear} — {p.deathYear || '...'}</div>
                      </div>
                      <ChevronRight className="text-stone-200" size={16} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Timeline</h3>
            <span className="text-[10px] text-stone-300">{timeline.length} events</span>
          </div>

          <div className="space-y-3">
            {timeline.length === 0 ? (
              <div className="bg-white p-6 rounded-[32px] border border-stone-50 shadow-sm text-stone-400 italic">No life events yet.</div>
            ) : timeline.map((ev, idx) => {
              const Icon = getEventIcon(ev.type);
              const isAttaching = attachingToEventId === ev.id;
              return (
                <div key={ev.id} className="bg-white rounded-[32px] border border-stone-50 shadow-sm overflow-hidden">
                  {/* Year chip between events when year changes */}
                  {idx === 0 || getEventYear(ev.date) !== getEventYear(timeline[idx - 1].date) ? (
                    <div className="px-5 pt-4 pb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                        {getEventYear(ev.date)}
                      </span>
                    </div>
                  ) : null}

                  <div className="p-5">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-stone-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-xl text-slate-900 leading-snug">
                          {formatEventSentence(activeProfile.name, ev)}
                        </div>
                        <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-400">
                          {ev.date ? formatFullDate(ev.date) : 'Date unknown'}
                          {ev.place ? ` • ${ev.place}` : ''}
                        </div>
                        {(ev as any).note && (
                          <div className="mt-2 text-sm text-stone-500 italic">{(ev as any).note}</div>
                        )}
                        {(ev as any).subType && (
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-stone-400">{(ev as any).subType}</div>
                        )}

                        {/* Attached media thumbnails */}
                        {ev.media?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ev.media.map(m => (
                              <a
                                key={m.id}
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors"
                              >
                                {m.kind === 'photo' && <span className="text-xs">🖼</span>}
                                {m.kind === 'video' && <span className="text-xs">🎬</span>}
                                {m.kind === 'audio' && <span className="text-xs">🎵</span>}
                                {m.kind === 'document' && <span className="text-xs">📄</span>}
                                <span className="text-[11px] font-bold text-stone-600 max-w-[120px] truncate">{m.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Attach button */}
                      <button
                        onClick={() => setAttachingToEventId(isAttaching ? null : ev.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          isAttaching
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-50 text-amber-700 border border-stone-100 hover:bg-amber-50'
                        }`}
                      >
                        {isAttaching ? 'Cancel' : '+ Media'}
                      </button>
                    </div>

                    {/* Expanded attach panel */}
                    {isAttaching && (
                      <EventMediaUploader
                        eventId={ev.id}
                        onFilesSelected={props.onEventMediaUpload}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Media</h3>
          </div>

          {media.length === 0 ? (
            <div className="bg-white p-6 rounded-[32px] border border-stone-50 shadow-sm text-stone-400 italic">No media yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {media.map(m => (
                <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="bg-white p-4 rounded-[32px] border border-stone-50 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{m.kind}</div>
                  <div className="mt-2 font-serif text-xl text-slate-900">{m.name || 'Untitled'}</div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProfileView;
