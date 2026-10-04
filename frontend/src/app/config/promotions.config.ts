/**
 * Centralized Holiday & Seasonal Promotions & Themes Configuration (Frontend)
 * Mirrors authoritative backend calendar definitions and market research discounts
 * 
 * Business Timezone: America/Chicago
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface PhoenixColors {
  bird1: string;
  bird2: string;
  bird3: string;
}

export interface PhoenixBirdConfig {
  name: string;
  color: string;
}

export interface PhoenixSet {
  phoenix1: PhoenixBirdConfig;
  phoenix2: PhoenixBirdConfig;
  phoenix3: PhoenixBirdConfig;
}

export interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  colors: ThemeColors;
  phoenixColors: PhoenixColors;
  phoenixes: PhoenixSet;
  accentGlow: string;
  description: string;
}

export interface HolidayCampaign {
  id: string;
  name: string;
  displayName: string;
  discountPercent: number;
  priority: number;
  enabled: boolean;
  bannerText: string;
  ctaText: string;
  ctaLink: string;
  dateRange: {
    crossYear?: boolean;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  } | null;
  theme: ThemeConfig;
}

export const BUSINESS_TIMEZONE = 'America/Chicago';

export const HOLIDAY_CAMPAIGNS: HolidayCampaign[] = [
  {
    id: 'default',
    name: 'Phoenix Core',
    displayName: 'Default Theme',
    discountPercent: 20, // 20% evergreen acquisition promotion
    priority: 0,
    enabled: true,
    bannerText: 'Founder Special: Save 20% on custom web development, full-stack systems, and digital platforms.',
    ctaText: 'Explore Services',
    ctaLink: '/services',
    dateRange: null,
    theme: {
      id: 'default',
      name: 'Phoenix Core',
      displayName: 'Default Theme',
      colors: {
        primary: '#ff4d00',
        secondary: '#00d2ff',
        tertiary: '#a855f7'
      },
      phoenixColors: {
        bird1: '#ff4d00',
        bird2: '#00d2ff',
        bird3: '#a855f7'
      },
      phoenixes: {
        phoenix1: { name: 'Fire Phoenix', color: '#ff4d00' },
        phoenix2: { name: 'Ice Phoenix', color: '#00d2ff' },
        phoenix3: { name: 'Eclipse Phoenix', color: '#a855f7' }
      },
      accentGlow: 'rgba(255, 77, 0, 0.25)',
      description: 'The signature obsidian, fire-orange, and cyan identity of Phoenix Websites AI.'
    }
  },
  {
    id: 'new_year',
    name: 'New Year Launch',
    displayName: 'New Year',
    discountPercent: 25,
    priority: 15,
    enabled: true,
    bannerText: 'New Year Digital Ignition: 25% off all custom website & web app builds through January 7.',
    ctaText: 'Start Your Build',
    ctaLink: '/services',
    dateRange: {
      crossYear: true,
      startMonth: 12,
      startDay: 26,
      endMonth: 1,
      endDay: 7
    },
    theme: {
      id: 'new_year',
      name: 'New Year Champagne',
      displayName: 'New Year',
      colors: {
        primary: '#ffd700',
        secondary: '#38bdf8',
        tertiary: '#e2e8f0'
      },
      phoenixColors: {
        bird1: '#ffd700',
        bird2: '#38bdf8',
        bird3: '#f8fafc'
      },
      phoenixes: {
        phoenix1: { name: 'Ignition Phoenix', color: '#ffd700' },
        phoenix2: { name: 'Aurora Phoenix', color: '#38bdf8' },
        phoenix3: { name: 'Genesis Phoenix', color: '#f8fafc' }
      },
      accentGlow: 'rgba(255, 215, 0, 0.25)',
      description: 'Elegant champagne gold and electric ice blue.'
    }
  },
  {
    id: 'valentines',
    name: "Valentine's Precision",
    displayName: "Valentine's",
    discountPercent: 25,
    priority: 10,
    enabled: true,
    bannerText: 'Build something you love: 25% off bespoke full-stack websites through mid-February.',
    ctaText: 'Scope Project',
    ctaLink: '/services',
    dateRange: {
      startMonth: 2,
      startDay: 1,
      endMonth: 2,
      endDay: 16
    },
    theme: {
      id: 'valentines',
      name: 'Crimson Rose',
      displayName: "Valentine's",
      colors: {
        primary: '#f43f5e',
        secondary: '#ec4899',
        tertiary: '#fda4af'
      },
      phoenixColors: {
        bird1: '#f43f5e',
        bird2: '#ec4899',
        bird3: '#fb7185'
      },
      phoenixes: {
        phoenix1: { name: 'Ruby Phoenix', color: '#f43f5e' },
        phoenix2: { name: 'Amour Phoenix', color: '#ec4899' },
        phoenix3: { name: 'Blush Phoenix', color: '#fb7185' }
      },
      accentGlow: 'rgba(244, 63, 94, 0.25)',
      description: 'Sophisticated deep rose crimson and vibrant magenta.'
    }
  },
  {
    id: 'st_patricks',
    name: "St. Patrick's Momentum",
    displayName: "St. Patrick's",
    discountPercent: 22,
    priority: 10,
    enabled: true,
    bannerText: 'St. Patrick\'s Green Wave: 22% off custom websites with verified Lighthouse 100 performance.',
    ctaText: 'Calculate Price',
    ctaLink: '/services',
    dateRange: {
      startMonth: 3,
      startDay: 8,
      endMonth: 3,
      endDay: 19
    },
    theme: {
      id: 'st_patricks',
      name: 'Emerald Growth',
      displayName: "St. Patrick's",
      colors: {
        primary: '#10b981',
        secondary: '#22c55e',
        tertiary: '#eab308'
      },
      phoenixColors: {
        bird1: '#10b981',
        bird2: '#22c55e',
        bird3: '#facc15'
      },
      phoenixes: {
        phoenix1: { name: 'Emerald Phoenix', color: '#10b981' },
        phoenix2: { name: 'Shamrock Phoenix', color: '#22c55e' },
        phoenix3: { name: 'Clover Phoenix', color: '#facc15' }
      },
      accentGlow: 'rgba(16, 185, 129, 0.25)',
      description: 'Lush emerald green with clover and warm gold accents.'
    }
  },
  {
    id: 'spring_easter',
    name: 'Spring Re-Engineering',
    displayName: 'Spring / Easter',
    discountPercent: 25,
    priority: 10,
    enabled: true,
    bannerText: 'Spring Awakening: 25% off custom business website platforms and digital modernizations.',
    ctaText: 'View Upgrades',
    ctaLink: '/services',
    dateRange: {
      startMonth: 3,
      startDay: 25,
      endMonth: 4,
      endDay: 15
    },
    theme: {
      id: 'spring_easter',
      name: 'Spring Bloom',
      displayName: 'Spring / Easter',
      colors: {
        primary: '#06b6d4',
        secondary: '#34d399',
        tertiary: '#f472b6'
      },
      phoenixColors: {
        bird1: '#06b6d4',
        bird2: '#34d399',
        bird3: '#f472b6'
      },
      phoenixes: {
        phoenix1: { name: 'Blossom Phoenix', color: '#06b6d4' },
        phoenix2: { name: 'Zephyr Phoenix', color: '#34d399' },
        phoenix3: { name: 'Verdant Phoenix', color: '#f472b6' }
      },
      accentGlow: 'rgba(6, 182, 212, 0.25)',
      description: 'Fresh spring cyan, mint flora, and pastel orchid highlights.'
    }
  },
  {
    id: 'memorial_day',
    name: 'Memorial Day Scaling',
    displayName: 'Memorial Day',
    discountPercent: 25,
    priority: 10,
    enabled: true,
    bannerText: 'Memorial Day Growth Special: 25% off high-performance web development.',
    ctaText: 'Explore Architecture',
    ctaLink: '/services',
    dateRange: {
      startMonth: 5,
      startDay: 20,
      endMonth: 5,
      endDay: 31
    },
    theme: {
      id: 'memorial_day',
      name: 'Patriot Honor',
      displayName: 'Memorial Day',
      colors: {
        primary: '#3b82f6',
        secondary: '#ef4444',
        tertiary: '#f8fafc'
      },
      phoenixColors: {
        bird1: '#3b82f6',
        bird2: '#ef4444',
        bird3: '#e2e8f0'
      },
      phoenixes: {
        phoenix1: { name: 'Valor Phoenix', color: '#3b82f6' },
        phoenix2: { name: 'Honor Phoenix', color: '#ef4444' },
        phoenix3: { name: 'Sentinel Phoenix', color: '#e2e8f0' }
      },
      accentGlow: 'rgba(59, 130, 246, 0.25)',
      description: 'Dignified deep blue, vibrant red, and platinum silver accents.'
    }
  },
  {
    id: 'july4',
    name: 'Independence Day',
    displayName: 'July 4th',
    discountPercent: 28,
    priority: 10,
    enabled: true,
    bannerText: 'Independence Day Freedom Sale: 28% off custom full-stack systems and e-commerce platforms.',
    ctaText: 'Build Custom',
    ctaLink: '/services',
    dateRange: {
      startMonth: 6,
      startDay: 25,
      endMonth: 7,
      endDay: 8
    },
    theme: {
      id: 'july4',
      name: 'Independence Flame',
      displayName: 'July 4th',
      colors: {
        primary: '#ef4444',
        secondary: '#2563eb',
        tertiary: '#f59e0b'
      },
      phoenixColors: {
        bird1: '#ef4444',
        bird2: '#3b82f6',
        bird3: '#fbbf24'
      },
      phoenixes: {
        phoenix1: { name: 'Liberty Phoenix', color: '#ef4444' },
        phoenix2: { name: 'Patriot Phoenix', color: '#3b82f6' },
        phoenix3: { name: 'Sparkler Phoenix', color: '#fbbf24' }
      },
      accentGlow: 'rgba(239, 68, 68, 0.25)',
      description: 'Dynamic freedom red, rich navy blue, and warm sparkler amber.'
    }
  },
  {
    id: 'labor_day',
    name: 'Labor Day Operations',
    displayName: 'Labor Day',
    discountPercent: 25,
    priority: 10,
    enabled: true,
    bannerText: 'Work smarter with automation: 25% off intelligent web apps and custom integrations.',
    ctaText: 'See Automation',
    ctaLink: '/services/automation',
    dateRange: {
      startMonth: 8,
      startDay: 25,
      endMonth: 9,
      endDay: 7
    },
    theme: {
      id: 'labor_day',
      name: 'Industrial Sun',
      displayName: 'Labor Day',
      colors: {
        primary: '#f97316',
        secondary: '#0284c7',
        tertiary: '#10b981'
      },
      phoenixColors: {
        bird1: '#f97316',
        bird2: '#0284c7',
        bird3: '#10b981'
      },
      phoenixes: {
        phoenix1: { name: 'Forge Phoenix', color: '#f97316' },
        phoenix2: { name: 'Cobalt Phoenix', color: '#0284c7' },
        phoenix3: { name: 'Titan Phoenix', color: '#10b981' }
      },
      accentGlow: 'rgba(249, 115, 22, 0.25)',
      description: 'Energetic sunburst orange paired with industrial cobalt.'
    }
  },
  {
    id: 'halloween',
    name: 'Halloween Season',
    displayName: 'Halloween',
    discountPercent: 35, // Actively configured 35% Halloween discount
    priority: 10,
    enabled: true,
    bannerText: 'Halloween Special: Save 35% on custom website development and digital platform projects through October 31.',
    ctaText: 'Claim 35% Off',
    ctaLink: '/services',
    dateRange: {
      startMonth: 10,
      startDay: 1,
      endMonth: 10,
      endDay: 31
    },
    theme: {
      id: 'halloween',
      name: 'Spooky Phoenix',
      displayName: 'Halloween',
      colors: {
        primary: '#ff5500',
        secondary: '#9333ea',
        tertiary: '#10b981'
      },
      phoenixColors: {
        bird1: '#ff5500',
        bird2: '#a855f7',
        bird3: '#10b981'
      },
      phoenixes: {
        phoenix1: { name: 'Ember Phoenix', color: '#ff5500' },
        phoenix2: { name: 'Specter Phoenix', color: '#a855f7' },
        phoenix3: { name: 'Venom Phoenix', color: '#10b981' }
      },
      accentGlow: 'rgba(255, 85, 0, 0.3)',
      description: 'Atmospheric pumpkin fire orange, wicked sorcerer purple, and neon slime green.'
    }
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving Harvest',
    displayName: 'Thanksgiving',
    discountPercent: 30,
    priority: 5,
    enabled: true,
    bannerText: 'Thanksgiving Harvest Sale: 30% off end-to-end custom website engineering through November.',
    ctaText: 'Harvest Savings',
    ctaLink: '/services',
    dateRange: {
      startMonth: 11,
      startDay: 1,
      endMonth: 11,
      endDay: 30
    },
    theme: {
      id: 'thanksgiving',
      name: 'Harvest Amber',
      displayName: 'Thanksgiving',
      colors: {
        primary: '#d97706',
        secondary: '#b45309',
        tertiary: '#ea580c'
      },
      phoenixColors: {
        bird1: '#d97706',
        bird2: '#b45309',
        bird3: '#ea580c'
      },
      phoenixes: {
        phoenix1: { name: 'Harvest Phoenix', color: '#d97706' },
        phoenix2: { name: 'Amber Phoenix', color: '#b45309' },
        phoenix3: { name: 'Timber Phoenix', color: '#ea580c' }
      },
      accentGlow: 'rgba(217, 119, 6, 0.25)',
      description: 'Rich harvest amber, russet bronze, and warm cranberry hues.'
    }
  },
  {
    id: 'black_friday',
    name: 'Cyber Week',
    displayName: 'Black Friday / Cyber Monday',
    discountPercent: 45, // Pinnacle annual promotion (45% launch acquisition discount)
    priority: 20,
    enabled: true,
    bannerText: 'Black Friday & Cyber Week Megasale: Save 45% on all custom web applications, SaaS MVPs, and business platforms.',
    ctaText: 'Lock In 45% Off',
    ctaLink: '/services',
    dateRange: {
      startMonth: 11,
      startDay: 20,
      endMonth: 12,
      endDay: 2
    },
    theme: {
      id: 'black_friday',
      name: 'Cyber Neon',
      displayName: 'Black Friday / Cyber Monday',
      colors: {
        primary: '#06b6d4',
        secondary: '#f43f5e',
        tertiary: '#fbbf24'
      },
      phoenixColors: {
        bird1: '#06b6d4',
        bird2: '#f43f5e',
        bird3: '#fbbf24'
      },
      phoenixes: {
        phoenix1: { name: 'Neon Phoenix', color: '#06b6d4' },
        phoenix2: { name: 'Matrix Phoenix', color: '#f43f5e' },
        phoenix3: { name: 'Laser Phoenix', color: '#fbbf24' }
      },
      accentGlow: 'rgba(6, 182, 212, 0.35)',
      description: 'High-contrast futuristic cyber neon with glowing cyan, magenta, and laser gold.'
    }
  },
  {
    id: 'christmas_winter',
    name: 'Winter Holiday',
    displayName: 'Christmas / Winter',
    discountPercent: 30,
    priority: 10,
    enabled: true,
    bannerText: 'End-of-Year Digital Modernization: 30% off high-speed custom websites through December 25.',
    ctaText: 'Build for 2027',
    ctaLink: '/services',
    dateRange: {
      startMonth: 12,
      startDay: 1,
      endMonth: 12,
      endDay: 25
    },
    theme: {
      id: 'christmas_winter',
      name: 'Holiday Forest',
      displayName: 'Christmas / Winter',
      colors: {
        primary: '#dc2626',
        secondary: '#16a34a',
        tertiary: '#fbbf24'
      },
      phoenixColors: {
        bird1: '#dc2626',
        bird2: '#16a34a',
        bird3: '#fbbf24'
      },
      phoenixes: {
        phoenix1: { name: 'Holly Phoenix', color: '#dc2626' },
        phoenix2: { name: 'Frost Phoenix', color: '#16a34a' },
        phoenix3: { name: 'Solstice Phoenix', color: '#fbbf24' }
      },
      accentGlow: 'rgba(220, 38, 38, 0.25)',
      description: 'Traditional holiday crimson, pine forest green, and celebratory gold.'
    }
  }
];
