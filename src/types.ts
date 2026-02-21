
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type MediaKind = 'photo' | 'video' | 'audio' | 'document';

export interface MediaItem {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  mime?: string;
  size?: number;
  createdAt: string;
}

export interface LifeEvent {
  id: string;
  type: string;
  date: string;
  place: string;
  spouseName?: string;
  media: MediaItem[];
}

export interface Memory {
  id: string;
  type: 'story' | 'note';
  content: string;
  timestamp: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  gender?: 'M' | 'F' | 'U';
  birthYear: string;
  deathYear?: string;
  imageUrl: string;
  summary: string;
  historicalContext?: {
    text: string;
    sources: any[];
  };
  timeline: LifeEvent[];
  memories: Memory[];
  sources: string[];
  isMemorial?: boolean;
  // Relationships
  parentIds: string[];
  childIds: string[];
  spouseIds: string[];
}

export interface FamilyTree {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  homePersonId: string;
  memberIds: string[];
}

export type AttachmentKind = 'photo' | 'video' | 'audio' | 'document';

export interface CircleAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  dataUrl: string;
  size?: number;
}

export interface CirclePost {
  id: string;
  userId: string;
  createdAt: string;
  authorLabel: string;
  body: string;
  attachments: CircleAttachment[];
  taggedProfileIds: string[];
}

export enum AppView {
  SPLASH = 'splash',
  LOGIN = 'login',
  HOME = 'home',
  TREES = 'trees',
  TREE_VIEW = 'tree_view',
  SELECT_HOME = 'select_home',
  PROFILE = 'profile',
  EDIT_PROFILE = 'edit_profile',
  LINK_RELATIVE = 'link_relative',
  CREATE_MEMORY = 'create_memory',
  FAMILY_CIRCLE = 'family_circle'
}
