import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = process.env.DATA_PATH || path.join(__dirname, 'data', 'lunch.json');

fs.mkdirSync(path.dirname(dataPath), { recursive: true });

function load() {
  if (!fs.existsSync(dataPath)) return { nextId: 1, restaurants: [] };
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function save() {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

const data = load();

export function getRestaurants() {
  return data.restaurants;
}

export function findRestaurantByName(name) {
  const lower = name.toLowerCase();
  return data.restaurants.find((r) => r.name.toLowerCase() === lower) || null;
}

export function findRestaurantById(id) {
  return data.restaurants.find((r) => r.id === id) || null;
}

export function createRestaurant({ name, mealTicket, createdBy, taste, distance }) {
  const restaurant = {
    id: data.nextId++,
    name,
    mealTicket,
    createdBy,
    createdAt: new Date().toISOString(),
    ratings: [{ nickname: createdBy, taste, distance }],
  };
  data.restaurants.push(restaurant);
  save();
  return restaurant;
}

export function upsertRating(restaurantId, nickname, taste, distance) {
  const restaurant = findRestaurantById(restaurantId);
  if (!restaurant) return null;
  const existing = restaurant.ratings.find((r) => r.nickname === nickname);
  if (existing) {
    existing.taste = taste;
    existing.distance = distance;
  } else {
    restaurant.ratings.push({ nickname, taste, distance });
  }
  save();
  return restaurant;
}

export function deleteRestaurant(id) {
  const idx = data.restaurants.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  data.restaurants.splice(idx, 1);
  save();
  return true;
}
