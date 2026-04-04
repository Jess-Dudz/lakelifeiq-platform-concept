export type Boat = {
  id: string;
  brand: string;
  model: string;
  category: 'wake' | 'surf' | 'pontoon' | 'fishing' | 'cruising';
  budget: '30-60' | '60-90' | '90-150' | '150+';
  usage: ('Wakeboarding' | 'Cruising' | 'Family recreation' | 'Fishing' | 'Entertaining')[];
  familyFriendly: boolean;
  lowMaintenance: boolean;
  performance: boolean;
  comfort: boolean;
  easyDockAccess: boolean;
  upgradePotential: boolean;
  notes: string[];
};

export const boats: Boat[] = [
  {
    id: 'axis-a22',
    brand: 'Axis',
    model: 'A22',
    category: 'wake',
    budget: '60-90',
    usage: ['Wakeboarding', 'Family recreation'],
    familyFriendly: true,
    lowMaintenance: true,
    performance: true,
    comfort: true,
    easyDockAccess: true,
    upgradePotential: true,
    notes: [
      'Strong wake performance for the price',
      'Popular choice for families getting into wake sports',
      'Good fit for covered dock setups',
    ],
  },
  {
    id: 'moomba-mojo',
    brand: 'Moomba',
    model: 'Mojo',
    category: 'surf',
    budget: '60-90',
    usage: ['Wakeboarding', 'Family recreation', 'Cruising'],
    familyFriendly: true,
    lowMaintenance: true,
    performance: true,
    comfort: true,
    easyDockAccess: true,
    upgradePotential: true,
    notes: [
      'Value-focused surf and wake option',
      'Comfortable layout for mixed family use',
      'Good starting point for full setup recommendations',
    ],
  },
  {
    id: 'mastercraft-nxt22',
    brand: 'MasterCraft',
    model: 'NXT22',
    category: 'wake',
    budget: '90-150',
    usage: ['Wakeboarding', 'Family recreation', 'Cruising'],
    familyFriendly: true,
    lowMaintenance: false,
    performance: true,
    comfort: true,
    easyDockAccess: true,
    upgradePotential: true,
    notes: [
      'Premium feel with strong wake capability',
      'Well-rounded option for families and entertaining',
      'Great stretch option for buyers near the top of mid-tier budget',
    ],
  },
  {
    id: 'bennington-22sx',
    brand: 'Bennington',
    model: '22 SX',
    category: 'pontoon',
    budget: '30-60',
    usage: ['Cruising', 'Family recreation', 'Entertaining'],
    familyFriendly: true,
    lowMaintenance: true,
    performance: false,
    comfort: true,
    easyDockAccess: true,
    upgradePotential: false,
    notes: [
      'Easy family boat for cruising and relaxing',
      'Comfort-first option',
      'Simple ownership experience',
    ],
  },
  {
    id: 'barletta-corsa-23u',
    brand: 'Barletta',
    model: 'Corsa 23U',
    category: 'pontoon',
    budget: '90-150',
    usage: ['Cruising', 'Family recreation', 'Entertaining'],
    familyFriendly: true,
    lowMaintenance: true,
    performance: false,
    comfort: true,
    easyDockAccess: true,
    upgradePotential: true,
    notes: [
      'Upscale pontoon with strong entertaining appeal',
      'Excellent comfort and dock usability',
      'Great fit for lake lifestyle buyers not centered on watersports',
    ],
  },
  {
    id: 'malibu-23lsv',
    brand: 'Malibu',
    model: 'Wakesetter 23 LSV',
    category: 'surf',
    budget: '150+',
    usage: ['Wakeboarding', 'Family recreation', 'Entertaining'],
    familyFriendly: true,
    lowMaintenance: false,
    performance: true,
    comfort: true,
    easyDockAccess: false,
    upgradePotential: true,
    notes: [
      'High-end wake and surf performance',
      'Premium option for buyers wanting top-tier features',
      'Best suited for larger budgets and full setup planning',
    ],
  },
];