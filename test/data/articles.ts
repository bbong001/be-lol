import { Article } from '../../src/news/schemas/article.schema';

export const testArticles: Partial<Article>[] = [
  {
    title: 'League of Legends World Championship 2024 Announced',
    slug: 'lol-worlds-2024-announced',
    content: `The League of Legends World Championship 2024 has been officially announced! 
    This year's tournament will feature the best teams from around the world competing for the ultimate prize in League of Legends esports.
    
    Key highlights:
    - 24 teams from 12 regions
    - New tournament format
    - Record-breaking prize pool
    - Special in-game events and rewards`,
    summary:
      'Riot Games announces the details for the 2024 League of Legends World Championship, featuring a new format and record prize pool.',
    imageUrl: 'https://example.com/images/worlds-2024.jpg',
    tags: ['Worlds', 'Tournament', 'Esports', 'League of Legends'],
    published: true,
    publishedAt: new Date('2024-03-15'),
    viewCount: 15000,
  },
  {
    title: 'New Champion Revealed: The Shadow Weaver',
    slug: 'new-champion-shadow-weaver',
    content: `Riot Games has unveiled their latest champion, The Shadow Weaver, a mysterious mage from the Shadow Isles.
    
    Champion Abilities:
    - Passive: Shadow Essence
    - Q: Dark Bolt
    - W: Shadow Step
    - E: Void Shield
    - R: Shadow Storm`,
    summary:
      'Meet the newest champion joining the League of Legends roster - The Shadow Weaver, a powerful mage from the Shadow Isles.',
    imageUrl: 'https://example.com/images/shadow-weaver.jpg',
    tags: ['New Champion', 'Shadow Isles', 'Mage', 'Gameplay'],
    published: true,
    publishedAt: new Date('2024-03-10'),
    viewCount: 25000,
  },
  {
    title: 'Patch 14.6 Notes: Major Balance Changes',
    slug: 'patch-14-6-notes',
    content: `Patch 14.6 brings significant changes to the game balance, including champion adjustments, item updates, and system changes.
    
    Major Changes:
    - Champion Buffs and Nerfs
    - New Item: Celestial Blade
    - Dragon Soul Changes
    - Rune Adjustments`,
    summary:
      'Detailed breakdown of all changes coming in Patch 14.6, including champion balance updates and new items.',
    imageUrl: 'https://example.com/images/patch-14-6.jpg',
    tags: ['Patch Notes', 'Balance', 'Game Updates', 'Meta'],
    published: true,
    publishedAt: new Date('2024-03-05'),
    viewCount: 35000,
  },
  {
    title: "Pro Player Spotlight: Faker's Journey to Greatness",
    slug: 'faker-journey-to-greatness',
    content: `An in-depth look at Lee "Faker" Sang-hyeok's incredible career in League of Legends esports.
    
    Career Highlights:
    - 3 World Championships
    - Multiple LCK titles
    - Record-breaking achievements
    - Impact on the game`,
    summary:
      'Exploring the legendary career of Faker, the greatest League of Legends player of all time.',
    imageUrl: 'https://example.com/images/faker-spotlight.jpg',
    tags: ['Pro Players', 'Faker', 'Esports', 'LCK'],
    published: true,
    publishedAt: new Date('2024-03-01'),
    viewCount: 45000,
  },
  {
    title: 'Upcoming Events in March 2024',
    slug: 'march-2024-events',
    content: `A comprehensive guide to all League of Legends events happening in March 2024.
    
    Event Schedule:
    - MSI Qualifiers
    - Community Tournaments
    - In-game Events
    - Special Promotions`,
    summary:
      'Your complete guide to all League of Legends events and tournaments happening in March 2024.',
    imageUrl: 'https://example.com/images/march-events.jpg',
    tags: ['Events', 'Tournaments', 'Community', 'Schedule'],
    published: true,
    publishedAt: new Date('2024-02-28'),
    viewCount: 20000,
  },
];
