import type { VillageLocation } from '../types/simulation';

export const VILLAGE_LOCATIONS: Record<string, VillageLocation> = {
  town_square: {
    id: 'town_square',
    name: 'Town Square & Fountain',
    x: 395,
    y: 385,
    type: 'square',
    description: 'The social heart of the village with a clear stone fountain where villagers gather.',
  },
  alex_farm: {
    id: 'alex_farm',
    name: "Alex's Barn & Farm",
    x: 305,
    y: 530,
    type: 'farm',
    description: 'Large red wooden barn with cattle pasture, hay bales, and farming tools.',
    ownerId: 'alex',
  },
  wheat_field: {
    id: 'wheat_field',
    name: 'Village Wheat Field',
    x: 655,
    y: 260,
    type: 'farm',
    description: 'Fenced agricultural plot with rows of golden wheat ready for harvest.',
  },
  noah_shop: {
    id: 'noah_shop',
    name: "Noah's General Merchant",
    x: 515,
    y: 330,
    type: 'shop',
    description: 'Blue-roof trading outpost with a fresh water well and front bench.',
    ownerId: 'noah',
  },
  mia_bakery: {
    id: 'mia_bakery',
    name: "Mia's Bakery & Cottage",
    x: 240,
    y: 290,
    type: 'house',
    description: 'Cozy stone & timber house with a smoking brick chimney and herb garden.',
    ownerId: 'mia',
  },
  emma_healer: {
    id: 'emma_healer',
    name: "Emma's Clinic & Thatch Cottage",
    x: 475,
    y: 175,
    type: 'house',
    description: 'Thatched-roof apothecary cottage surrounded by healing flowers.',
    ownerId: 'emma',
  },
  leo_workshop: {
    id: 'leo_workshop',
    name: "Leo's Carpenter Workshop",
    x: 435,
    y: 465,
    type: 'work',
    description: 'Timber workshop with open lean-to, timber stacks, and crafting tools.',
    ownerId: 'leo',
  },
  lake_dock: {
    id: 'lake_dock',
    name: 'Lake Dock & Rowboat',
    x: 635,
    y: 440,
    type: 'nature',
    description: 'Quiet wooden pier on the blue pond with reeds, water lilies, and a tied boat.',
  },
  campsite: {
    id: 'campsite',
    name: 'Traveler Campsite',
    x: 670,
    y: 405,
    type: 'nature',
    description: 'Canvas pavilion tent by the water with campfire stones and logs.',
  },
  old_shed: {
    id: 'old_shed',
    name: 'Old Village Storage',
    x: 135,
    y: 355,
    type: 'work',
    description: 'Rustic wooden shed on the west forest path storing spare lumber.',
  },
};

// Road intersection waypoints for natural path traversal
export const ROAD_WAYPOINTS: Record<string, { x: number; y: number; neighbors: string[] }> = {
  // Plaza ring circling cleanly around the central stone fountain (obstacle is x: 375-415, y: 325-365)
  wp_plaza_s: { x: 395, y: 385, neighbors: ['wp_plaza_w', 'wp_plaza_e', 'wp_square_s', 'town_square'] },
  wp_plaza_n: { x: 395, y: 290, neighbors: ['wp_plaza_w', 'wp_plaza_e', 'wp_square_n'] },
  wp_plaza_w: { x: 340, y: 355, neighbors: ['wp_plaza_s', 'wp_plaza_n', 'wp_square_w'] },
  wp_plaza_e: { x: 450, y: 355, neighbors: ['wp_plaza_s', 'wp_plaza_n', 'wp_square_e'] },

  wp_square_n: { x: 395, y: 285, neighbors: ['wp_plaza_n', 'wp_north_turn'] },
  wp_north_turn: { x: 395, y: 175, neighbors: ['wp_square_n', 'wp_north_cottage'] },
  wp_north_cottage: { x: 475, y: 175, neighbors: ['wp_north_turn', 'emma_healer'] },

  wp_square_e: { x: 515, y: 355, neighbors: ['wp_plaza_e', 'noah_shop', 'wp_east_fork'] },
  wp_east_fork: { x: 590, y: 355, neighbors: ['wp_square_e', 'wp_wheat_gate', 'wp_lake_path', 'campsite'] },
  wp_wheat_gate: { x: 655, y: 355, neighbors: ['wp_east_fork', 'wheat_field'] },
  wp_lake_path: { x: 635, y: 390, neighbors: ['wp_east_fork', 'campsite', 'lake_dock'] },

  wp_square_s: { x: 395, y: 465, neighbors: ['wp_plaza_s', 'wp_south_turn', 'leo_workshop'] },
  wp_south_turn: { x: 395, y: 530, neighbors: ['wp_square_s', 'wp_farm_road'] },
  wp_farm_road: { x: 340, y: 530, neighbors: ['wp_south_turn', 'alex_farm', 'wp_farm_north'] },
  wp_farm_north: { x: 340, y: 440, neighbors: ['wp_bakery_fork', 'wp_farm_road'] },

  wp_square_w: { x: 320, y: 355, neighbors: ['wp_plaza_w', 'wp_bakery_fork', 'wp_west_road'] },
  wp_bakery_fork: { x: 280, y: 355, neighbors: ['wp_square_w', 'mia_bakery', 'wp_farm_north'] },
  wp_west_road: { x: 180, y: 355, neighbors: ['wp_square_w', 'old_shed'] },

  // Location nodes attached to waypoint network:
  town_square: { x: 395, y: 385, neighbors: ['wp_plaza_s'] },
  alex_farm: { x: 305, y: 530, neighbors: ['wp_farm_road'] },
  wheat_field: { x: 655, y: 260, neighbors: ['wp_wheat_gate'] },
  noah_shop: { x: 515, y: 330, neighbors: ['wp_square_e'] },
  mia_bakery: { x: 240, y: 290, neighbors: ['wp_bakery_fork'] },
  emma_healer: { x: 475, y: 175, neighbors: ['wp_north_cottage'] },
  leo_workshop: { x: 435, y: 465, neighbors: ['wp_square_s'] },
  lake_dock: { x: 635, y: 440, neighbors: ['wp_lake_path'] },
  campsite: { x: 670, y: 405, neighbors: ['wp_east_fork', 'wp_lake_path'] },
  old_shed: { x: 135, y: 355, neighbors: ['wp_west_road'] },
};

// Collision obstacle bounding rectangles [x1, y1, x2, y2]
export const VILLAGE_OBSTACLES = [
  { name: 'Fountain', x: 375, y: 325, w: 40, h: 40 },
  { name: 'Mia Bakery Building', x: 160, y: 135, w: 155, h: 135 },
  { name: 'Alex Barn', x: 125, y: 365, w: 165, h: 150 },
  { name: 'Cow Pasture North Fence', x: 0, y: 450, w: 125, h: 25 },
  { name: 'Cow Pasture East Fence', x: 265, y: 535, w: 15, h: 95 },
  { name: 'Emma Thatched Cottage', x: 430, y: 25, w: 95, h: 130 },
  { name: 'Noah Shop Building', x: 490, y: 210, w: 90, h: 80 },
  { name: 'Wheat Field North Fence', x: 590, y: 115, w: 155, h: 20 },
  { name: 'Wheat Field West Fence', x: 590, y: 135, w: 15, h: 170 },
  { name: 'Wheat Field East Fence', x: 730, y: 135, w: 15, h: 170 },
  { name: 'Wheat Field South Fence Left', x: 590, y: 290, w: 45, h: 15 },
  { name: 'Wheat Field South Fence Right', x: 675, y: 290, w: 70, h: 15 },
  { name: 'Leo Workshop Building', x: 455, y: 330, w: 90, h: 115 },
  { name: 'Old Shed Building', x: 25, y: 245, w: 95, h: 135 },
  { name: 'Traveler Tent', x: 645, y: 320, w: 60, h: 75 },
  { name: 'South River Channel', x: 315, y: 575, w: 165, h: 55 },
  { name: 'East Lake Water', x: 490, y: 485, w: 304, h: 145 },
];
