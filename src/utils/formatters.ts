
import { formatFullDate } from './date';
import { eventVerb } from '../constants.tsx';
import { LifeEvent, MediaKind } from '../types';

export const formatEventSentence = (profileName: string, ev: LifeEvent): string => {
  const dateStr = ev.date ? formatFullDate(ev.date) : '';
  const placeStr = ev.place ? ev.place.trim() : '';
  
  if (ev.type === 'Birth') {
    let part = '';
    if (dateStr && placeStr) part = `on ${dateStr}, in ${placeStr}`;
    else if (dateStr) part = `on ${dateStr}`;
    else if (placeStr) part = `in ${placeStr}`;
    return `${profileName} was born${part ? ' ' + part : ''}.`;
  }
  
  if (ev.type === 'Marriage') {
    const spouse = ev.spouseName || 'Unknown';
    let part = '';
    if (placeStr && dateStr) part = `in ${placeStr} on ${dateStr}`;
    else if (placeStr) part = `in ${placeStr}`;
    else if (dateStr) part = `on ${dateStr}`;
    return `${profileName} married ${spouse}${part ? ' ' + part : ''}.`;
  }

  const verb = eventVerb(ev.type);
  let part = '';
  if (dateStr && placeStr) part = `on ${dateStr} in ${placeStr}`;
  else if (dateStr) part = `on ${dateStr}`;
  else if (placeStr) part = `in ${placeStr}`;
  return `${profileName} ${verb}${part ? ' ' + part : ''}.`;
};

export const inferMediaKind = (fileName: string, fileType?: string): MediaKind => {
  const lower = fileName.toLowerCase();
  const t = (fileType || '').toLowerCase();
  if (t.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(lower)) return 'photo';
  if (t.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(lower)) return 'video';
  if (t.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(lower)) return 'audio';
  if (t === 'application/pdf' || /\.pdf$/i.test(lower)) return 'document';
  if (t.includes('word') || /\.(doc|docx)$/i.test(lower)) return 'document';
  return 'document';
};

export const getSurname = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
};
