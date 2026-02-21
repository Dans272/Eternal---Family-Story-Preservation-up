import React, { useState } from 'react';
import { Trash2, Image, FileText, Music, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { CircleAttachment, CirclePost, Profile } from '../../types';

interface CircleFeedProps {
  posts: CirclePost[];
  profiles: Profile[];
  currentUserId: string;
  onDeletePost: (id: string) => void;
  onProfileClick: (profileId: string) => void;
}

const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AttachmentKindIcon = ({ kind }: { kind: CircleAttachment['kind'] }) => {
  if (kind === 'photo') return <Image size={12} />;
  if (kind === 'video') return <Video size={12} />;
  if (kind === 'audio') return <Music size={12} />;
  return <FileText size={12} />;
};

const PostCard: React.FC<{
  post: CirclePost;
  profiles: Profile[];
  isOwn: boolean;
  onDelete: () => void;
  onProfileClick: (id: string) => void;
}> = ({ post, profiles, isOwn, onDelete, onProfileClick }) => {
  const [expanded, setExpanded] = useState(false);
  const tagged = profiles.filter((p) => post.taggedProfileIds.includes(p.id));
  const photoAttachments = post.attachments.filter((a) => a.kind === 'photo');
  const otherAttachments = post.attachments.filter((a) => a.kind !== 'photo');

  const bodyIsLong = post.body.length > 200;
  const displayBody = bodyIsLong && !expanded ? post.body.slice(0, 200) + '…' : post.body;

  return (
    <div className="bg-white rounded-[24px] border border-stone-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-700 text-[10px] font-black uppercase">
              {post.authorLabel.charAt(0)}
            </span>
          </div>
          <div>
            <span className="text-[12px] font-bold text-slate-700 block">{post.authorLabel}</span>
            <span className="text-[10px] text-stone-400">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
        {isOwn && (
          <button
            onClick={onDelete}
            className="text-stone-200 hover:text-red-400 transition-colors p-1"
            title="Delete post"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Body */}
      {post.body && (
        <div className="px-5 pb-3">
          <p className="font-serif text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{displayBody}</p>
          {bodyIsLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:text-amber-800"
            >
              {expanded ? <><ChevronUp size={10} /> Show less</> : <><ChevronDown size={10} /> Read more</>}
            </button>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photoAttachments.length > 0 && (
        <div className={`grid gap-0.5 mb-0.5 ${photoAttachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {photoAttachments.slice(0, 4).map((att, i) => (
            <div key={att.id} className="relative aspect-square">
              <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
              {i === 3 && photoAttachments.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{photoAttachments.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Other attachments */}
      {otherAttachments.length > 0 && (
        <div className="px-5 pb-3 space-y-1.5">
          {otherAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2 text-stone-500"
            >
              <AttachmentKindIcon kind={att.kind} />
              <span className="text-[11px] font-serif truncate flex-1">{att.name}</span>
              {att.size && (
                <span className="text-[9px] text-stone-300">
                  {(att.size / 1024).toFixed(0)}KB
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tagged people */}
      {tagged.length > 0 && (
        <div className="px-5 pb-4 pt-1 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-stone-400 self-center mr-0.5">with</span>
          {tagged.map((p) => (
            <button
              key={p.id}
              onClick={() => onProfileClick(p.id)}
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors"
            >
              <img src={p.imageUrl} alt={p.name} className="w-4 h-4 rounded-md object-cover grayscale" />
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CircleFeed: React.FC<CircleFeedProps> = ({
  posts,
  profiles,
  currentUserId,
  onDeletePost,
  onProfileClick
}) => {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
          <span className="text-2xl">🌿</span>
        </div>
        <p className="font-serif text-stone-400 italic text-sm">The circle is quiet. Share the first memory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          profiles={profiles}
          isOwn={post.userId === currentUserId}
          onDelete={() => onDeletePost(post.id)}
          onProfileClick={onProfileClick}
        />
      ))}
    </div>
  );
};
