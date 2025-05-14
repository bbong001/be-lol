import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class LolHistoryService {
  async getHistory(name: string, tag: string) {
    const encodedName = encodeURIComponent(name);
    const url = `https://www.leagueofgraphs.com/vn/summoner/vn/${encodedName}-${tag}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0', // Giả lập trình duyệt
        },
      });

      const $ = cheerio.load(res.data);
      const matches: any[] = [];

      $('table.recentGamesTable tbody tr').each((_, el) => {
        const row = $(el);

        // Loại trừ các row không phải trận đấu (header, "xem thêm", v.v.)
        if (!row.find('td.championCellLight img, td.championCellDark img').length) return;

        const champion = row.find('td.championCellLight img, td.championCellDark img').first().attr('alt') || '';

        if (!champion) return;

        const result = row.find('.victoryDefeatText').first().text().trim();
        const mode = row.find('.gameMode').first().text().trim();
        const duration = row.find('.gameDuration').first().text().trim();
        const timeAgo = row.find('.gameDate').first().text().trim();

        const kills = row.find('.kills').text().trim();
        const deaths = row.find('.deaths').text().trim();
        const assists = row.find('.assists').text().trim();
        const kda = `${kills}/${deaths}/${assists}`;

        const cs = row.find('.cs .number').first().text().trim();

        const items: string[] = [];
        row.find('td.itemsColumnLight img, td.itemsColumnDark img').each((_, item) => {
          const alt = $(item).attr('alt');
          if (alt) items.push(alt);
        });

        const matchLinkRel = row.find('a[href*="/match/"]').first().attr('href') || '';
        const matchLink = matchLinkRel ? matchLinkRel : '';

        matches.push({
          champion,
          result,
          mode,
          duration,
          timeAgo,
          kda,
          cs,
          items,
          matchLink,
        });
      });

      return {
        url,
        total: matches.length,
        matches,
      };
    } catch (err: any) {
      console.error('Lỗi khi crawl:', err.message);
      return {
        url,
        matches: [],
        error: err.message,
      };
    }
  }
}
