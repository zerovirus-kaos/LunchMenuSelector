export const DISTANCE_SCORE = { near: 3, medium: 2, far: 1 };

// 맛의 비중이 가장 크도록 항목별 가중치를 명시적으로 둔다 (합계 100점 만점)
const TASTE_WEIGHT = 60;
const DISTANCE_WEIGHT = 15;
const MEAL_TICKET_WEIGHT = 25;

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calcScore(ratings, mealTicket) {
  const avgTaste = average(ratings.map((r) => r.taste)); // 1~10
  const avgDistance = average(ratings.map((r) => DISTANCE_SCORE[r.distance])); // 1~3

  const tasteNorm = avgTaste / 10; // 0~1
  const distanceNorm = (avgDistance - 1) / 2; // 1~3 -> 0~1 (near=1, far=0)
  const mealTicketNorm = mealTicket === 'O' ? 1 : 0;

  return tasteNorm * TASTE_WEIGHT + distanceNorm * DISTANCE_WEIGHT + mealTicketNorm * MEAL_TICKET_WEIGHT;
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
