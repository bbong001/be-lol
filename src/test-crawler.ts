import * as cheerio from 'cheerio';
import axios from 'axios';

async function testCrawler() {
  try {
    const championName = 'aatrox';
    const url = `https://op.gg/vi/lol/champions/${championName}/build?region=global&tier=emerald_plus`;

    console.log(`Crawling build data from ${url}`);

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Test the safer stat shard extraction
    console.log('Testing stat shard extraction');
    const statShards = $('span img[class*="border-"]')
      .map((_, el) => {
        try {
          return $(el).attr('alt') || '';
        } catch (error) {
          console.error(`Error extracting stat shard: ${error.message}`);
          return '';
        }
      })
      .get()
      .filter((name) => name.length > 0); // Filter out empty strings

    console.log('Successfully extracted stat shards:', statShards);

    // Extract a small piece to test
    const tierInfo = {
      tier:
        $('.flex strong:contains("Bậc")').text().trim().replace('Bậc ', '') ||
        'Unknown',
      winRate:
        $('.flex strong:contains("Tỉ lệ thắng")').next().text().trim() ||
        'Unknown',
      pickRate:
        $('.flex strong:contains("Tỷ lệ chọn")').next().text().trim() ||
        'Unknown',
      banRate:
        $('.flex strong:contains("Tỷ lệ cấm")').next().text().trim() ||
        'Unknown',
    };

    console.log('Successfully extracted tier info:', tierInfo);

    // Extract other components for verification
    const summonerSpells = $(
      'caption:contains("SummonerSpells") ~ tbody tr:first-child img',
    )
      .map((_, el) => {
        try {
          return $(el).attr('alt') || '';
        } catch (error) {
          console.error(`Error: ${error.message}`);
          return '';
        }
      })
      .get()
      .filter((name) => name.length > 0);

    console.log('Successfully extracted summoner spells:', summonerSpells);
  } catch (error) {
    console.error('Error in crawler test:', error.message);
  }
}

testCrawler().then(() => console.log('Test completed'));
