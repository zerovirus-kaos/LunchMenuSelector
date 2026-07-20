import type { IPhysics } from './IPhysics';
import type { MapEntityState } from './types/MapEntity.type';

/**
 * A no-op IPhysics implementation for spectator clients: positions/entities
 * are pushed in from network frames instead of being simulated locally.
 */
export class RemotePhysics implements IPhysics {
  private positions = new Map<number, { x: number; y: number; angle: number }>();
  private entities: MapEntityState[] = [];

  async init() {}

  clear() {
    this.positions.clear();
    this.entities = [];
  }

  clearMarbles() {
    this.positions.clear();
  }

  createStage() {}

  createMarble(id: number, x: number, y: number) {
    this.positions.set(id, { x, y, angle: 0 });
  }

  shakeMarble() {}

  removeMarble(id: number) {
    this.positions.delete(id);
  }

  getMarblePosition(id: number) {
    return this.positions.get(id) || { x: 0, y: 0, angle: 0 };
  }

  getEntities(): MapEntityState[] {
    return this.entities;
  }

  impact() {}

  start() {}

  step() {}

  setMarbleState(id: number, x: number, y: number, angle: number) {
    this.positions.set(id, { x, y, angle });
  }

  setEntities(entities: MapEntityState[]) {
    this.entities = entities;
  }
}
