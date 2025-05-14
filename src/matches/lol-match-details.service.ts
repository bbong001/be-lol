import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class LolMatchDetailsService {
  async getMatchDetails(matchUrl: string) {
    try {
      const url = `https://www.leagueofgraphs.com${matchUrl}`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      const $ = cheerio.load(res.data);

      const mode = $('.queueName').text().trim();
      const duration = $('.gameDuration').text().replace(/[()]/g, '').trim();

      const resultLeft = $('th.text-left span.victory, th.text-left span.defeat').text().trim();
      const resultRight = $('th.text-right span.victory, th.text-right span.defeat').text().trim();
      const kdaLeft = $('th.text-left .kda-left').text().trim();
      const kdaRight = $('th.text-right .kda-right').text().trim();

      const statsLeft: any[] = [];
      const statsRight: any[] = [];

      const teamCounters = $('th.text-center .teamCounters');
      $(teamCounters[0])
        .find('.teamCountersEntry')
        .each((_, e) => {
          const label = $(e).attr('tooltip')?.split(':')[0].trim() || '';
          const value = $(e).text().trim();
          statsLeft.push({ label, value });
        });

      $(teamCounters[1])
        .find('.teamCountersEntry')
        .each((_, e) => {
          const label = $(e).attr('tooltip')?.split(':')[0].trim() || '';
          const value = $(e).text().trim();
          statsRight.push({ label, value });
        });

      const playersLeft: any[] = [];
      const playersRight: any[] = [];

      // LEFT TEAM (td.text-left)
      $('tr.playerRow').filter((_, el) => $(el).find('td.text-left').length > 0).each((_, row) => {
        const name = $(row).find('td.text-left .txt .name').text().trim();
        const rank = $(row).find('td.text-left .txt .subname').text().trim();
        const champion = $(row).find('td.text-left img[class*="champion-"]').first().attr('alt') || '';

        const kills = $(row).find('td.text-left .kda .kills').first().text().trim();
        const deaths = $(row).find('td.text-left .kda .deaths').first().text().trim();
        const assists = $(row).find('td.text-left .kda .assists').first().text().trim();
        const kda = `${kills}/${deaths}/${assists}`;

        const csGoldText = $(row).find('td.text-left .kdaColumn .cs').first().text();
        const csMatch = csGoldText.match(/(\d+) CS -\s+([\d\.]+)k vàng/);
        const cs = csMatch ? csMatch[1] : '0';
        const gold = csMatch ? csMatch[2] + 'k' : '0k';

        const items: string[] = [];
        $(row).find('td.itemsColumn-100 img[alt]').each((_, img) => {
          const item = $(img).attr('alt')?.trim();
          if (item) items.push(item);
        });

        $(row).find('td.itemsColumn-200 img[alt]').each((_, img) => {
          const item = $(img).attr('alt')?.trim();
          if (item) items.push(item);
        });

        playersLeft.push({ name, champion, rank, kda, cs, gold, items });
      });

      // RIGHT TEAM (td.text-right)
      $('tr.playerRow').filter((_, el) => $(el).find('td.text-right').length > 0).each((_, row) => {
        const name = $(row).find('td.text-right .txt .name').text().trim();
        const rank = $(row).find('td.text-right .txt .subname').text().trim();
        const champion = $(row).find('td.text-right img[class*="champion-"]').first().attr('alt') || '';

        const kills = $(row).find('td.text-right .kda .kills').first().text().trim();
        const deaths = $(row).find('td.text-right .kda .deaths').first().text().trim();
        const assists = $(row).find('td.text-right .kda .assists').first().text().trim();
        const kda = `${kills}/${deaths}/${assists}`;

        const csGoldText = $(row).find('td.text-right .kdaColumn .cs').first().text();
        const csMatch = csGoldText.match(/(\d+) CS -\s+([\d\.]+)k vàng/);
        const cs = csMatch ? csMatch[1] : '0';
        const gold = csMatch ? csMatch[2] + 'k' : '0k';

        const items: string[] = [];
        $(row).find('td.itemsColumn-100 img[alt]').each((_, img) => {
          const item = $(img).attr('alt')?.trim();
          if (item) items.push(item);
        });

        $(row).find('td.itemsColumn-200 img[alt]').each((_, img) => {
          const item = $(img).attr('alt')?.trim();
          if (item) items.push(item);
        });

        playersRight.push({ name, champion, rank, kda, cs, gold, items });
      });

      return {
        mode,
        duration,
        team1: {
          result: resultLeft || 'Không rõ',
          kda: kdaLeft,
          stats: statsLeft,
          players: playersLeft,
        },
        team2: {
          result: resultRight || 'Không rõ',
          kda: kdaRight,
          stats: statsRight,
          players: playersRight,
        },
      };
    } catch (err: any) {
      console.error('Lỗi khi crawl chi tiết trận:', err.message);
      return { error: err.message };
    }
  }
}