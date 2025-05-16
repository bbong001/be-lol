# Champion Build Crawler

This module includes functionality to crawl champion build data from [u.gg](https://u.gg/).

## Features

- Crawl champion build recommendations including:
  - Rune pages
  - Summoner spells
  - Skill order
  - Starting items
  - Core items
  - Situational items (4th, 5th, and 6th item options)
  - Matchup data

## API Endpoints

### GET `/api/champions/build/:name`

Fetches build data for a specific champion.

**Parameters:**
- `name`: Champion name (path parameter)
- `position`: Lane position (query parameter, optional, default: 'top')
  - Available options: 'top', 'jungle', 'mid', 'adc', 'support'

**Example:**
```
GET /api/champions/build/aatrox?position=top
```

### POST `/api/champions/builds/update-all`

Updates build data for all champions in the database.

**Authentication:** Requires admin role
**Authorization:** Bearer token required

## Running the Crawler Script

You can run the crawler script directly to test it:

```bash
# Crawl data for Aatrox in top lane
npm run crawl:champion-build

# Crawl data for a specific champion
npm run crawl:champion-build zed

# Crawl data for a specific champion in a specific position
npm run crawl:champion-build zed mid
```

## Implementation Details

The crawler uses Cheerio to parse HTML from u.gg pages. Key files:

- `champion-build-crawler.service.ts`: Main service for crawling and parsing build data
- `champions.service.ts`: Integration with the champions module
- `champions.controller.ts`: API endpoints
- `crawl-champion-build.ts`: Test script

## Adding to Champion Schema

Build data is stored in the Champion schema in the following fields:

- `recommendedRunes`: Recommended rune setup
- `recommendedItems`: Recommended item builds

This data is updated when you call the build endpoints or run the crawler script. 