import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { CirclePost, Profile, User } from '../types';
import { PostComposer } from '../components/circle/PostComposer';
import { CircleFeed } from '../components/circle/CircleFeed';

interface FamilyCircleViewProps {
  user: User;
  profiles: Profile[];
  posts: CirclePost[];
  onBack: () => void;
  onAddPost: (post: CirclePost) => void;
  onDeletePost: (id: string) => void;
  onProfileClick: (profileId: string) => void;
}

export default function FamilyCircleView({
  user,
  profiles,
  posts,
  onBack,
  onAddPost,
  onDeletePost,
  onProfileClick
}: FamilyCircleViewProps) {
  return (
    <div className="flex flex-col h-full bg-[#f9f8f6]">
      {/* Header */}
      <header className="pt-16 px-8 pb-5 bg-[#f5f2eb] border-b border-stone-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>
        <div className="mt-4">
          <h2 className="text-3xl font-serif text-slate-800">Family Circle</h2>
          <p className="text-stone-400 text-[10px] font-bold uppercase mt-0.5">
            Shared memories · {profiles.length} {profiles.length === 1 ? 'member' : 'members'}
          </p>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-5 pb-10">
        <PostComposer
          profiles={profiles}
          authorLabel={user.name}
          userId={user.id}
          onSubmit={onAddPost}
        />
        <CircleFeed
          posts={posts}
          profiles={profiles}
          currentUserId={user.id}
          onDeletePost={onDeletePost}
          onProfileClick={onProfileClick}
        />
      </main>
    </div>
  );
}
