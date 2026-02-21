
import { Profile, FamilyTree, LifeEvent } from '../types';
import { getPlaceholderImage } from '../constants';

const tagToLabel: Record<string, string> = {
  BIRT: 'Birth',
  BAPM: 'Baptism',
  BAPT: 'Baptism',
  CHR:  'Christening',
  DEAT: 'Death',
  BURI: 'Burial',
  CREM: 'Cremation',
  RESI: 'Residence',
  EMIG: 'Departure/Emigration',
  IMMI: 'Arrival/Immigration',
  CENS: 'Census',
  MARR: 'Marriage',
  DIV:  'Divorce',
  DIVO: 'Divorce',
  GRAD: 'Graduation',
  EDUC: 'Education',
  OCCU: 'Occupation',
  TITL: 'Title',
  NATI: 'Nationality',
  RELI: 'Religion',
  NATU: 'Naturalization',
  ADOP: 'Adoption',
  BARM: 'Bar Mitzvah',
  BATM: 'Bat Mitzvah',
  CONF: 'Confirmation',
  PROB: 'Probate',
  WILL: 'Will',
  EVEN: 'Event',
  FACT: 'Fact',
  ORDN: 'Ordination',
  MILI: 'Military Service',
  RETI: 'Retirement',
};

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export const gedcomDateToSortKey = (dateStr?: string): number => {
  if (!dateStr) return 9999;
  const upper = dateStr.toUpperCase()
    .replace(/ABT\.?|EST\.?|CAL\.?|BEF\.?|AFT\.?|CIR\.?|CIRCA|BET\.?|AND\b/g, '')
    .trim();
  const yearMatch = upper.match(/\b(\d{4})\b/);
  if (!yearMatch) return 9999;
  const year = parseInt(yearMatch[1], 10);
  const monthIdx = MONTH_ABBR.findIndex(m => upper.includes(m));
  const month = monthIdx >= 0 ? monthIdx + 1 : 0;
  let day = 0;
  if (month) {
    const parts = upper.split(/\s+/).filter(Boolean);
    const mi = parts.findIndex(p => p === MONTH_ABBR[month - 1]);
    if (mi > 0) {
      const candidate = parseInt(parts[mi - 1], 10);
      if (!isNaN(candidate) && candidate >= 1 && candidate <= 31) day = candidate;
    }
  }
  return year + month / 12 + day / 365;
};

function addOrUpdateMarriage(
  person: Profile | undefined,
  spouse: Profile | undefined,
  date: string,
  place: string,
  stamp: string
) {
  if (!person) return;
  const existing = person.timeline.find(e => e.type === 'Marriage' && e.date === date);
  if (existing) {
    if (!existing.spouseName) existing.spouseName = spouse?.name ?? 'Unknown';
    if (place && !existing.place) existing.place = place;
  } else {
    person.timeline.push({
      id: `ev-marr-${stamp}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'Marriage',
      date,
      place,
      spouseName: spouse?.name ?? 'Unknown',
      media: [],
    });
  }
}

export const parseGedcom = (
  text: string,
  userId: string,
  maxGenerations = 4
): { importedProfiles: Profile[]; tree: FamilyTree } => {
  const importStamp = Date.now().toString();
  const indis = new Map<string, any>();
  const fams  = new Map<string, any>();

  let currentIndi:  any = null;
  let currentFam:   any = null;
  let currentEvent: any = null;
  let homeGedId: string | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const spaceIdx = line.indexOf(' ');
    if (spaceIdx === -1) continue;
    const level     = line.slice(0, spaceIdx);
    const remainder = line.slice(spaceIdx + 1);
    const spaceIdx2 = remainder.indexOf(' ');
    const tagOrXref = spaceIdx2 === -1 ? remainder : remainder.slice(0, spaceIdx2);
    const rest      = spaceIdx2 === -1 ? '' : remainder.slice(spaceIdx2 + 1);

    if (level === '0') {
      currentEvent = null;
      if (rest === 'INDI') {
        const gid = tagOrXref;
        if (!homeGedId) homeGedId = gid;
        currentIndi = {
          gedId: gid, name: 'Unknown', gender: 'U',
          timeline: [], birthYear: 'Unknown', deathYear: undefined,
          famc: null as string | null, fams: [] as string[],
        };
        indis.set(gid, currentIndi);
        currentFam = null;
      } else if (rest === 'FAM') {
        currentFam = { gedId: tagOrXref, husb: '', wife: '', chil: [] as string[], marrDate: '', marrPlace: '' };
        fams.set(tagOrXref, currentFam);
        currentIndi = null;
      } else {
        currentIndi = null;
        currentFam  = null;
      }
      continue;
    }

    if (currentIndi) {
      if (level === '1') {
        if (tagOrXref === 'NAME') {
          currentIndi.name = rest.replace(/\//g, ' ').replace(/\s{2,}/g, ' ').trim() || 'Unknown';
        } else if (tagOrXref === 'SEX') {
          const s = rest.trim().toUpperCase();
          currentIndi.gender = s === 'M' ? 'M' : s === 'F' ? 'F' : 'U';
        } else if (tagOrXref === 'FAMC') {
          currentIndi.famc = rest.trim();
        } else if (tagOrXref === 'FAMS') {
          currentIndi.fams.push(rest.trim());
        } else if (tagToLabel[tagOrXref]) {
          currentEvent = {
            id: `ev-${importStamp}-${Math.random().toString(36).slice(2, 9)}`,
            type: tagToLabel[tagOrXref],
            date: '', place: '', media: [],
          };
          currentIndi.timeline.push(currentEvent);
        } else {
          currentEvent = null;
        }
      } else if (level === '2' && currentEvent) {
        if (tagOrXref === 'DATE') {
          currentEvent.date = rest.trim();
          const y = rest.match(/\b(\d{4})\b/);
          if (y) {
            if (currentEvent.type === 'Birth') currentIndi.birthYear = y[1];
            if (currentEvent.type === 'Death') currentIndi.deathYear = y[1];
          }
        } else if (tagOrXref === 'PLAC') {
          currentEvent.place = rest.trim();
        } else if (tagOrXref === 'NOTE') {
          currentEvent.note = rest.trim();
        } else if (tagOrXref === 'TYPE' && rest.trim()) {
          currentEvent.subType = rest.trim();
        }
      }
      continue;
    }

    if (currentFam) {
      if (level === '1') {
        if      (tagOrXref === 'HUSB') { currentFam.husb = rest.trim(); currentEvent = null; }
        else if (tagOrXref === 'WIFE') { currentFam.wife = rest.trim(); currentEvent = null; }
        else if (tagOrXref === 'CHIL') { currentFam.chil.push(rest.trim()); currentEvent = null; }
        else if (tagOrXref === 'MARR') { currentEvent = { type: 'MARR' }; }
        else                           { currentEvent = null; }
      } else if (level === '2' && currentEvent?.type === 'MARR') {
        if (tagOrXref === 'DATE')  currentFam.marrDate  = rest.trim();
        if (tagOrXref === 'PLAC')  currentFam.marrPlace = rest.trim();
      }
    }
  }

  // Generation traversal
  const generations = new Map<string, number>();
  const traverseGen = (gedId: string, gen: number, visited = new Set<string>()) => {
    if (visited.has(gedId) || !indis.has(gedId)) return;
    visited.add(gedId);
    generations.set(gedId, gen);
    const indi = indis.get(gedId)!;
    if (indi.famc) {
      const pf = fams.get(indi.famc);
      if (pf) {
        if (pf.husb) traverseGen(pf.husb, gen + 1, visited);
        if (pf.wife) traverseGen(pf.wife, gen + 1, visited);
      }
    }
    for (const famXref of indi.fams) {
      const sf = fams.get(famXref);
      if (sf) {
        for (const childXref of sf.chil) traverseGen(childXref, gen - 1, visited);
        if (gen === 0) {
          if (sf.husb && sf.husb !== gedId) traverseGen(sf.husb, 0, visited);
          if (sf.wife && sf.wife !== gedId) traverseGen(sf.wife, 0, visited);
        }
      }
    }
  };
  if (homeGedId) traverseGen(homeGedId, 0);

  // Build profile ID map
  const profileIdFor: Record<string, string> = {};
  const filteredIndis: any[] = [];
  indis.forEach((indi, gedId) => {
    const gen = generations.get(gedId);
    if (gen !== undefined && Math.abs(gen) <= maxGenerations) {
      profileIdFor[gedId] = `imp-${importStamp}-${gedId.replace(/@/g, '')}`;
      filteredIndis.push(indi);
    }
  });

  // Build Profile objects with chronologically sorted timelines
  const importedProfiles: Profile[] = filteredIndis.map(indi => ({
    id:          profileIdFor[indi.gedId],
    userId,
    name:        indi.name,
    gender:      indi.gender,
    birthYear:   indi.birthYear,
    deathYear:   indi.deathYear,
    imageUrl:    getPlaceholderImage(indi.gender),
    summary:     '',
    isMemorial:  true,
    timeline:    [...indi.timeline].sort((a: LifeEvent, b: LifeEvent) =>
                   gedcomDateToSortKey(a.date) - gedcomDateToSortKey(b.date)),
    memories:    [],
    sources:     [],
    parentIds:   [],
    childIds:    [],
    spouseIds:   [],
  }));

  // Link relationships
  fams.forEach(fam => {
    const husb     = importedProfiles.find(p => p.id === profileIdFor[fam.husb]);
    const wife     = importedProfiles.find(p => p.id === profileIdFor[fam.wife]);
    const children = (fam.chil as string[])
      .map(xref => importedProfiles.find(p => p.id === profileIdFor[xref]))
      .filter(Boolean) as Profile[];

    if (husb && wife) {
      if (!husb.spouseIds.includes(wife.id)) husb.spouseIds.push(wife.id);
      if (!wife.spouseIds.includes(husb.id)) wife.spouseIds.push(husb.id);
    }
    for (const child of children) {
      if (husb) {
        if (!child.parentIds.includes(husb.id)) child.parentIds.push(husb.id);
        if (!husb.childIds.includes(child.id))  husb.childIds.push(child.id);
      }
      if (wife) {
        if (!child.parentIds.includes(wife.id)) child.parentIds.push(wife.id);
        if (!wife.childIds.includes(child.id))  wife.childIds.push(child.id);
      }
    }
    if (fam.marrDate || fam.marrPlace) {
      addOrUpdateMarriage(husb, wife, fam.marrDate, fam.marrPlace, importStamp);
      addOrUpdateMarriage(wife, husb, fam.marrDate, fam.marrPlace, importStamp);
    }
  });

  // Final re-sort after marriage events added
  for (const p of importedProfiles) {
    p.timeline.sort((a, b) => gedcomDateToSortKey(a.date) - gedcomDateToSortKey(b.date));
  }

  return {
    importedProfiles,
    tree: {
      id:           `tree-${importStamp}`,
      userId,
      name:         'Staged Import Tree',
      createdAt:    new Date().toISOString(),
      homePersonId: homeGedId ? (profileIdFor[homeGedId] ?? '') : '',
      memberIds:    importedProfiles.map(p => p.id),
    },
  };
};
