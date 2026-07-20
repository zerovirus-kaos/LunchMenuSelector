export const DISTANCE_SCORE = { near: 3, medium: 2, far: 1 };
export const MEAL_TICKET_BONUS = { O: 2, X: 0 };

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calcScore(ratings, mealTicket) {
  const avgTaste = average(ratings.map((r) => r.taste));
  const avgDistance = average(ratings.map((r) => DISTANCE_SCORE[r.distance]));
  return avgTaste + avgDistance + MEAL_TICKET_BONUS[mealTicket];
}

// 점수 비율대로 total개를 배분하되, 최대잉여법으로 합계가 정확히 total이 되도록 맞춤
export function distributeBalls(scores, total) {
  if (scores.length === 0) return [];
  const totalScore = scores.reduce((a, b) => a + b, 0);
  if (totalScore <= 0) return scores.map(() => 0);
  const raw = scores.map((s) => (s / totalScore) * total);
  const counts = raw.map(Math.floor);
  const remainder = total - counts.reduce((a, b) => a + b, 0);
  const fracOrder = raw
    .map((v, i) => ({ i, frac: v - counts[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) {
    counts[fracOrder[k % fracOrder.length].i]++;
  }
  return counts;
}
