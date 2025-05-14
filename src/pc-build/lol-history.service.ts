import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class LolHistoryService {
  async getHistory(name: string, tag: string) {
    const encodedName = encodeURIComponent(name);
    const url = `https://www.leagueofgraphs.com/vn/summoner/vn/${encodedName}-${tag}`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    // TODO: Parse dữ liệu lịch sử đấu thực tế ở đây
    // Ví dụ trả về url và tiêu đề trang
    const title = $('title').text();

    return {
      url,
      title,
      // Thêm các trường lịch sử đấu thực tế sau khi parse
    };
  }
}
