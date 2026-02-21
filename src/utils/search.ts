import { getSurname } from './formatters';

const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const getFuzzyScore = (target: string, query: string): number => {
  const str = target.toLowerCase();
  const q = query.toLowerCase();
  if (str === q) return 100;
  if (str.startsWith(q)) return 80;
  if (str.includes(q)) return 60;

  const surname = getSurname(target).toLowerCase();
  if (surname.startsWith(q)) return 70;

  if (q.length > 3) {
    const distance = getLevenshteinDistance(str, q);
    const threshold = q.length <= 5 ? 1 : 2;
    if (distance <= threshold) return 40 - distance;
  }
  return 0;
};
