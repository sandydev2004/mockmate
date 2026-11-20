import { DSAProblem, DSATestCase, Difficulty } from "@/types";

// Simple fast seeded PRNG (Mulberry32)
export function createPRNG(seed: number) {
  let s = Math.floor(Math.abs(seed)) || 123456;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded array shuffle (Fisher-Yates)
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const rng = createPRNG(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Pick a DSA problem excluding past problem IDs served to the user
export function selectRandomDsaProblem(
  problems: DSAProblem[],
  difficulty: Difficulty,
  pastProblemIds: string[] = [],
  seed: number = Date.now()
): DSAProblem {
  const matchingDifficulty = problems.filter((p) => p.difficulty === difficulty);
  const pool = matchingDifficulty.length > 0 ? matchingDifficulty : problems;

  // Filter out problems the user has already seen
  const unseen = pool.filter((p) => !pastProblemIds.includes(p.id) && !pastProblemIds.includes(p.slug));
  const candidatePool = unseen.length > 0 ? unseen : pool;

  const rng = createPRNG(seed);
  const selectedIndex = Math.floor(rng() * candidatePool.length);
  const baseProblem = candidatePool[selectedIndex];

  // Seeded randomization of test cases:
  // Keep sample test cases identified, but shuffle internal evaluation order
  const shuffledTestCases = seededShuffle(baseProblem.test_cases, seed);

  return {
    ...baseProblem,
    test_cases: shuffledTestCases,
  };
}

