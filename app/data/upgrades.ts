export type UpgradeMatch = {
  usage?: string[];
  dockType?: string[];
  priorities?: string[];
  budget?: string[];
  goal?: string[];
};

export type UpgradeItem = {
  id: number;
  category: 'Dock' | 'Comfort' | 'Performance' | 'Cover';
  title: string;
  description: string;
  match: UpgradeMatch;
};

export const upgrades: UpgradeItem[] = [
  // ======================
  // DOCK
  // ======================
  {
    id: 1,
    category: 'Dock',
    title: 'Hydraulic Boat Lift',
    description:
      'Easier loading and unloading with stronger long-term protection for larger boats.',
    match: {
      usage: ['Wakeboarding', 'Family recreation'],
      dockType: ['Covered slip'],
      budget: ['90-150', '150+'],
    },
  },

  // ======================
  // COMFORT
  // ======================
  {
    id: 2,
    category: 'Comfort',
    title: 'Dock Misting System',
    description:
      'Keeps dock temperatures cooler during peak summer heat.',
    match: {
      usage: ['Wakeboarding', 'Entertaining'],
      budget: ['60-90', '90-150', '150+'],
    },
  },
  {
    id: 3,
    category: 'Comfort',
    title: 'Shaded Seating Area',
    description:
      'Creates a more comfortable hangout space for family and guests.',
    match: {
      usage: ['Family recreation', 'Cruising'],
      budget: ['30-60', '60-90', '90-150', '150+'],
    },
  },

  // ======================
  // PERFORMANCE
  // ======================
  {
    id: 4,
    category: 'Performance',
    title: 'Wake Enhancement Setup',
    description:
      'Ballast optimization and setup guidance for better wake performance.',
    match: {
      usage: ['Wakeboarding'],
      budget: ['60-90', '90-150', '150+'],
    },
  },

  // ======================
  // COVER OPTIONS (TIERED)
  // ======================

  // Entry level
  {
    id: 5,
    category: 'Cover',
    title: 'Manual Snap Cover',
    description:
      'Budget-friendly protection that requires manual installation.',
    match: {
      priorities: ['Budget-conscious'],
      budget: ['30-60', '60-90'],
    },
  },

  // General-purpose
  {
    id: 6,
    category: 'Cover',
    title: 'Mooring Cover',
    description:
      'Reliable all-purpose protection for storage and everyday use.',
    match: {
      usage: ['Cruising', 'Family recreation', 'Fishing'],
      dockType: ['Open dock', 'No dock yet'],
      budget: ['30-60', '60-90', '90-150'],
    },
  },

  // Convenience tier - lower
  {
    id: 7,
    category: 'Cover',
    title: 'Entry-Level Lift Cover System',
    description:
      'Convenience-focused cover with easier daily operation without premium pricing.',
    match: {
      priorities: ['Convenience'],
      dockType: ['Covered slip', 'Covered slip with seating area'],
      budget: ['60-90'],
    },
  },

  // Convenience tier - mid
  {
    id: 8,
    category: 'Cover',
    title: 'Mid-Tier Automatic Cover System',
    description:
      'Improved convenience and reliability for frequent lake users.',
    match: {
      priorities: ['Convenience'],
      dockType: ['Covered slip', 'Covered slip with seating area'],
      budget: ['90-150'],
    },
  },

  // Convenience tier - premium
  {
    id: 9,
    category: 'Cover',
    title: 'Premium Touchless Boat Cover',
    description:
      'Top-tier push-button system offering the easiest daily use and cleanest operation.',
    match: {
      priorities: ['Convenience'],
      dockType: ['Covered slip', 'Covered slip with seating area'],
      budget: ['150+'],
    },
  },

  // Durability-focused
  {
    id: 10,
    category: 'Cover',
    title: 'Traditional Frame Cover',
    description:
      'Strong, structured protection designed for long-term durability.',
    match: {
      priorities: ['Durability'],
      dockType: ['Covered slip', 'Open dock'],
      budget: ['90-150', '150+'],
    },
  },

  // Trailering use case
  {
    id: 11,
    category: 'Cover',
    title: 'Travel / Tow Cover',
    description:
      'Best suited for owners who trailer frequently or store their boat off-site.',
    match: {
      dockType: ['No dock yet', 'Open dock'],
      goal: ['Trailer often', 'Store off-site'],
      budget: ['30-60', '60-90', '90-150', '150+'],
    },
  },
];