// SM-2 spaced repetition algorithm
// rating: 0=Again, 1=Hard, 2=Good, 3=Easy

export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

export function sm2(
  rating: 0 | 1 | 2 | 3,
  easeFactor: number,
  interval: number,
  repetitions: number
): SM2State {
  // Map 0-3 rating to SM-2 quality 0-5 scale
  const quality = [0, 3, 4, 5][rating];

  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Again or Hard: reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  const next = new Date();
  next.setDate(next.getDate() + newInterval);
  const nextReview = next.toISOString().split("T")[0];

  return {
    easeFactor: Math.round(newEF * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}
