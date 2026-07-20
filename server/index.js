import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { calcScore, distributeBalls } from './scoring.js';
import { createRestaurant, deleteRestaurant, findRestaurantByName, findRestaurantById, getRestaurants, upsertRating } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DISTANCE_VALUES = ['near', 'medium', 'far'];
const MEAL_TICKET_VALUES = ['O', 'X'];

const app = express();
app.use(express.json());

function validateRating(body) {
  const { nickname, taste, distance } = body;
  if (typeof nickname !== 'string' || !nickname.trim()) return '닉네임이 필요합니다.';
  if (!Number.isInteger(taste) || taste < 1 || taste > 10) return '맛 점수는 1~10 사이의 정수여야 합니다.';
  if (!DISTANCE_VALUES.includes(distance)) return '거리 값이 올바르지 않습니다.';
  return null;
}

function withScores() {
  const restaurants = getRestaurants();
  const scores = restaurants.map((r) => calcScore(r.ratings, r.mealTicket));
  const ballCounts = distributeBalls(scores, 100);

  return restaurants.map((r, i) => ({
    ...r,
    score: Math.round(scores[i] * 100) / 100,
    ballCount: ballCounts[i] || 0,
    raterCount: r.ratings.length,
  }));
}

app.get('/api/restaurants', (req, res) => {
  res.json(withScores());
});

app.post('/api/restaurants', (req, res) => {
  const { name, mealTicket } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'invalid', message: '식당 이름이 필요합니다.' });
  }
  if (!MEAL_TICKET_VALUES.includes(mealTicket)) {
    return res.status(400).json({ error: 'invalid', message: '식권대장 여부가 올바르지 않습니다.' });
  }
  const ratingError = validateRating(req.body);
  if (ratingError) {
    return res.status(400).json({ error: 'invalid', message: ratingError });
  }

  const trimmedName = name.trim();
  const existing = findRestaurantByName(trimmedName);
  if (existing) {
    return res.status(409).json({ error: 'exists', restaurantId: existing.id, message: '이미 존재하는 식당입니다.' });
  }

  const { nickname, taste, distance } = req.body;
  createRestaurant({ name: trimmedName, mealTicket, createdBy: nickname.trim(), taste, distance });

  res.status(201).json(withScores());
});

app.put('/api/restaurants/:id/ratings', (req, res) => {
  const id = Number(req.params.id);
  if (!findRestaurantById(id)) {
    return res.status(404).json({ error: 'not_found', message: '식당을 찾을 수 없습니다.' });
  }

  const ratingError = validateRating(req.body);
  if (ratingError) {
    return res.status(400).json({ error: 'invalid', message: ratingError });
  }

  const { nickname, taste, distance } = req.body;
  upsertRating(id, nickname.trim(), taste, distance);

  res.json(withScores());
});

app.delete('/api/restaurants/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!deleteRestaurant(id)) {
    return res.status(404).json({ error: 'not_found', message: '식당을 찾을 수 없습니다.' });
  }
  res.json(withScores());
});

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist-app');
  app.use(express.static(distDir));
  app.use((req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

const httpServer = createServer(app);

// 순수 중계자: 게임 상태는 서버에 저장하지 않고, 한 클라이언트가 보낸 메시지를
// (호스트가 시작/프레임 브로드캐스트) 그 외 모든 연결된 클라이언트에 그대로 전달한다.
const wss = new WebSocketServer({ server: httpServer, path: '/api/ws', perMessageDeflate: false });

wss.on('error', (err) => {
  console.error('WebSocket server error:', err.message);
});

wss.on('connection', (ws) => {
  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
  ws.on('message', (data) => {
    const text = data.toString();
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(text);
      }
    });
  });
});

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`Lunch roulette server listening on port ${port}`);
});
