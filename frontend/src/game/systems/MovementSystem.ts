import { ROAD_WAYPOINTS } from '../VillageLocations';

export interface Point {
  x: number;
  y: number;
}

export class MovementSystem {
  /**
   * Find nearest waypoint node to a given coordinate (x, y)
   */
  static findNearestWaypoint(x: number, y: number): string {
    let nearestKey = 'wp_plaza_s';
    let minDist = Infinity;

    for (const [key, node] of Object.entries(ROAD_WAYPOINTS)) {
      const dist = (node.x - x) ** 2 + (node.y - y) ** 2;
      if (dist < minDist) {
        minDist = dist;
        nearestKey = key;
      }
    }
    return nearestKey;
  }

  /**
   * Shortest path using A* / Dijkstra algorithm across road waypoints
   */
  static findPath(startX: number, startY: number, targetX: number, targetY: number): Point[] {
    const startNodeKey = this.findNearestWaypoint(startX, startY);
    const endNodeKey = this.findNearestWaypoint(targetX, targetY);

    if (startNodeKey === endNodeKey) {
      return [
        { x: startX, y: startY },
        { x: targetX, y: targetY },
      ];
    }

    // Dijkstra / BFS search
    const queue: { key: string; dist: number }[] = [{ key: startNodeKey, dist: 0 }];
    const distances: Record<string, number> = { [startNodeKey]: 0 };
    const previous: Record<string, string | null> = { [startNodeKey]: null };
    const visited = new Set<string>();

    while (queue.length > 0) {
      // Sort to get smallest distance
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift()!;

      if (current.key === endNodeKey) break;
      if (visited.has(current.key)) continue;
      visited.add(current.key);

      const nodeData = ROAD_WAYPOINTS[current.key];
      if (!nodeData) continue;

      for (const neighborKey of nodeData.neighbors) {
        if (visited.has(neighborKey)) continue;
        const neighbor = ROAD_WAYPOINTS[neighborKey];
        if (!neighbor) continue;

        const edgeWeight = Math.hypot(neighbor.x - nodeData.x, neighbor.y - nodeData.y);
        const alt = current.dist + edgeWeight;

        if (alt < (distances[neighborKey] ?? Infinity)) {
          distances[neighborKey] = alt;
          previous[neighborKey] = current.key;
          queue.push({ key: neighborKey, dist: alt });
        }
      }
    }

    // Reconstruct path
    const pathKeys: string[] = [];
    let curr: string | null = endNodeKey;
    while (curr) {
      pathKeys.unshift(curr);
      curr = previous[curr] || null;
    }

    if (pathKeys[0] !== startNodeKey) {
      // Fallback: direct line
      return [{ x: startX, y: startY }, { x: targetX, y: targetY }];
    }

    const points: Point[] = [{ x: startX, y: startY }];
    for (const k of pathKeys) {
      const pt = ROAD_WAYPOINTS[k];
      if (pt) {
        points.push({ x: pt.x, y: pt.y });
      }
    }
    points.push({ x: targetX, y: targetY });
    return points;
  }
}
