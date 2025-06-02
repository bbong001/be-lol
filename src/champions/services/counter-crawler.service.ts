import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CounterService } from './counter.service';
import { CreateCounterDto } from '../dto/counter.dto';

@Injectable()
export class CounterCrawlerService {
  constructor(private readonly counterService: CounterService) {}

  /**
   * Crawl counter data from kicdo.com for a specific champion and role
   */
  async crawlCounterData(
    championName: string,
    role: string,
    patch?: string,
    rank?: string,
  ): Promise<any> {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    let retryCount = 0;
    const maxRetries = 3;
    let rawHtmlContent = '';
    let rawResponseData = '';
    const errors: string[] = [];

    while (retryCount <= maxRetries) {
      try {
        console.log(
          `🔍 Crawling counter data for ${championName} (${role}) - Attempt ${retryCount + 1}`,
        );

        // Create Axios instance with config
        const axiosInstance = axios.create({
          timeout: 30000,
          headers: {
            'User-Agent': userAgent,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
        });

        // Make request to kicdo.com
        const url = `https://kicdo.com/counter/${championName.toLowerCase()}`;
        const response = await axiosInstance.get(url);

        // Store raw data
        rawHtmlContent = response.data;
        rawResponseData = JSON.stringify({
          status: response.status,
          headers: response.headers,
          url: response.config.url,
        });

        // Parse HTML
        const $ = cheerio.load(rawHtmlContent);

        // Extract counter data
        const counterData = this.parseCounterData($);

        // Extract formatted content
        const formattedContent = this.extractFormattedContent($);
        const contentSections = this.extractContentSections($);

        if (Object.keys(counterData).length === 0) {
          throw new Error('No counter data found on the page');
        }

        // Create and save counter data
        try {
          // Create counter DTO with all the data (bỏ rawHtmlContent và rawResponseData để tiết kiệm dung lượng)
          const createCounterDto: CreateCounterDto = {
            championId: championName,
            championName: championName,
            role: role,
            ...counterData,
            patch: patch || '15.10',
            rank: rank || 'Emerald+',
            region: 'World',
            formattedContent: formattedContent,
            ...contentSections,
            additionalData: this.extractAdditionalData($),
          };

          // Save to database
          const result = await this.counterService.create(createCounterDto);
          console.log(
            `✅ Successfully crawled and saved counter data for ${championName} (${role})`,
          );

          // Log thông tin debug nếu cần (không lưu vào DB)
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `📄 Raw HTML size: ${rawHtmlContent.length} characters`,
            );
            console.log(
              `📊 Raw response data: ${rawResponseData.substring(0, 200)}...`,
            );
          }

          return result;
        } catch (saveError) {
          console.error('❌ Error saving counter data:', saveError.message);
          throw saveError;
        }
      } catch (error) {
        if (retryCount >= maxRetries) {
          console.error(
            `❌ Failed to crawl counter data after ${maxRetries + 1} attempts:`,
            error.message,
          );
          // Return a basic counter object even if crawling fails
          return {
            championId: championName,
            championName: championName,
            role: role,
            patch: patch || '15.10',
            rank: rank || 'Emerald+',
            region: 'World',
            overallWinRate: 0,
            pickRate: 0,
            banRate: 0,
            strongAgainst: [],
            weakAgainst: [],
            bestLaneCounters: [],
            worstLaneCounters: [],
            errors: errors,
          };
        } else {
          retryCount++;
          const errorMessage = `Attempt ${retryCount} failed: ${error.message}`;
          errors.push(errorMessage);
          console.warn(errorMessage);

          if (retryCount > maxRetries) {
            throw error;
          }

          // Wait before retry (exponential backoff)
          await this.sleep(Math.pow(2, retryCount) * 1000);
        }
      }
    }
  }

  /**
   * Parse counter data from the HTML content
   */
  private parseCounterData($: cheerio.CheerioAPI): any {
    const counterData: any = {
      overallWinRate: 0,
      pickRate: 0,
      banRate: 0,
      strongAgainst: [],
      weakAgainst: [],
      bestLaneCounters: [],
      worstLaneCounters: [],
    };

    try {
      // Extract champion stats từ text patterns
      $('*').each((_, element) => {
        const text = $(element).text().toLowerCase();

        // Tìm win rate
        if (text.includes('tỷ lệ thắng') || text.includes('winrate')) {
          const winRateMatch = text.match(/(\d+(?:\.\d+)?)%/);
          if (winRateMatch && !counterData.overallWinRate) {
            counterData.overallWinRate = parseFloat(winRateMatch[1]) || 0;
          }
        }
      });

      // Crawl counter champions từ hình ảnh và sections
      this.extractCounterChampionsFromPage($, counterData);

      // Sort arrays by effectiveness
      counterData.weakAgainst.sort((a, b) => b.winRate - a.winRate);
      counterData.strongAgainst.sort((a, b) => a.winRate - b.winRate);
    } catch (error) {
      console.warn('Warning: Error parsing counter data:', error.message);
    }

    return counterData;
  }

  /**
   * Extract counter champions từ trang web
   */
  private extractCounterChampionsFromPage(
    $: cheerio.CheerioAPI,
    counterData: any,
  ): void {
    try {
      // Tìm các section headers cụ thể từ HTML structure
      this.extractChampionsBySection($, counterData);

      // Fallback context analysis nếu cần (không dựa vào totalChampions nữa)
      const needsFallback = counterData.weakAgainst.length === 0;

      if (needsFallback) {
        console.log(
          `⚠️ Running fallback analysis - WeakAgainst: ${counterData.weakAgainst.length}`,
        );

        // Detect target champion name from page
        const pageTitle = $('title').text().toLowerCase();
        const h1Text = $('h1').first().text().toLowerCase();
        let targetChampionName = '';

        // Extract champion name from URL pattern or title
        const urlMatch = pageTitle.match(/counter\/([a-z']+)/);
        if (urlMatch) {
          targetChampionName = urlMatch[1];
        } else {
          // Try to extract from title or h1
          const words = (pageTitle + ' ' + h1Text).split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && /^[a-z']+$/.test(word)) {
              targetChampionName = word;
              break;
            }
          }
        }

        this.analyzeAndReclassifyChampions($, counterData, targetChampionName);
      }
    } catch (error) {
      console.warn(
        'Warning: Error extracting counter champions from page:',
        error.message,
      );
    }
  }

  /**
   * Extract champions dựa trên section headers
   */
  private extractChampionsBySection(
    $: cheerio.CheerioAPI,
    counterData: any,
  ): void {
    console.log('🔍 Looking for section headers...');

    // Tìm tất cả section headers và lưu thông tin về chúng
    const sectionInfo: Array<{
      element: any;
      $header: cheerio.Cheerio<any>;
      headerText: string;
      sectionType: string;
      champCount: number;
      $sectionRow: any;
    }> = [];

    // Tìm tất cả các section với header và content riêng biệt
    $('.chu_vang, h1, h2, h3, h4, p.chu_vang').each((_, headerElement) => {
      const $header = $(headerElement);
      const headerText = $header.text().toLowerCase().trim();

      console.log(`📋 Found header: "${headerText}"`);

      let sectionType = '';

      // Phân loại section dựa trên header text cụ thể
      if (headerText.includes('tướng khắc chế')) {
        // "Tướng khắc chế Zeri" - Champions that counter Zeri (Zeri is weak against)
        sectionType = 'weakAgainst';
        console.log(`✅ Identified as weakAgainst section: "${headerText}"`);
      } else if (headerText.includes('tướng yếu hơn')) {
        // "Tướng yếu hơn Zeri" - Champions weaker than Zeri (strongAgainst)
        sectionType = 'strongAgainst';
        console.log(`✅ Identified as strongAgainst section: "${headerText}"`);
      } else if (
        headerText.includes('tỷ lệ thắng cao') ||
        headerText.includes('tỷ lệ thắng cao khi đối đầu')
      ) {
        // "Tướng có tỷ lệ thắng cao khi đối đầu Zeri"
        sectionType = 'bestLaneCounters';
        console.log(
          `✅ Identified as bestLaneCounters section: "${headerText}"`,
        );
      } else {
        console.log(`❌ Unknown section type: "${headerText}"`);
      }

      if (sectionType) {
        // Tìm row ngay tiếp theo chỉ thuộc về section này
        let $sectionRow = null;

        // Phương pháp 1: Tìm row ngay sau header trong DOM sequence
        let $next = $header.next();
        while (
          $next.length &&
          !$next.hasClass('row') &&
          !$next.find('.row').length
        ) {
          $next = $next.next();
        }

        if ($next.hasClass('row')) {
          $sectionRow = $next;
        } else if ($next.find('.row').length) {
          $sectionRow = $next.find('.row').first();
        }

        // Phương pháp 2: Nếu không tìm thấy, tìm trong nextAll với điều kiện
        if (
          !$sectionRow ||
          !$sectionRow.length ||
          !$sectionRow.find('.list_champ').length
        ) {
          // Tìm tất cả .row sau header và kiểm tra xem row nào gần nhất với header này
          const allRowsAfter = $header.nextAll('.row');
          if (allRowsAfter.length > 0) {
            // Lấy row đầu tiên làm candidate
            $sectionRow = allRowsAfter.first();

            // Kiểm tra xem có header khác giữa header hiện tại và row này không
            const elementsBetween = $header.nextUntil($sectionRow);
            const hasOtherHeaderBetween =
              elementsBetween.filter('.chu_vang, h1, h2, h3, h4, p.chu_vang')
                .length > 0;

            if (hasOtherHeaderBetween) {
              console.log(
                `   ⚠️ Found other header between ${sectionType} header and row, row might belong to different section`,
              );
              $sectionRow = null;
            }
          }
        }

        // Đếm số champions thực tế
        const champCount =
          $sectionRow && $sectionRow.length
            ? $sectionRow.find('.list_champ img').length
            : 0;

        // Chỉ thêm vào sectionInfo nếu thực sự có champions
        if (champCount > 0) {
          sectionInfo.push({
            element: headerElement,
            $header,
            headerText,
            sectionType,
            champCount,
            $sectionRow,
          });

          console.log(
            `📦 Section "${headerText}" has ${champCount} champions for ${sectionType}`,
          );
        } else {
          console.log(`⚠️ Section "${headerText}" has NO champions - skipping`);
        }
      }
    });

    // Xử lý sections theo thứ tự ưu tiên - strongAgainst và bestLaneCounters trước, weakAgainst cuối
    const prioritizedSections = sectionInfo
      .filter((section) => section.champCount > 0) // Chỉ lấy section có champions
      .sort((a, b) => {
        // Ưu tiên xử lý strongAgainst và bestLaneCounters trước, weakAgainst cuối
        const typeOrder = {
          strongAgainst: 1,
          bestLaneCounters: 2,
          weakAgainst: 3, // Xử lý cuối cùng
        };
        if (typeOrder[a.sectionType] !== typeOrder[b.sectionType]) {
          return typeOrder[a.sectionType] - typeOrder[b.sectionType];
        }

        // Với cùng loại section, ưu tiên header ngắn hơn (cụ thể hơn)
        return a.headerText.length - b.headerText.length;
      });

    console.log(
      `📊 Processing ${prioritizedSections.length} sections with champions...`,
    );

    // Xử lý từng section theo thứ tự ưu tiên
    for (const section of prioritizedSections) {
      // Kiểm tra xem category này đã có data chưa
      let hasExistingData = false;
      if (
        section.sectionType === 'weakAgainst' &&
        counterData.weakAgainst.length > 0
      ) {
        hasExistingData = true;
      } else if (
        section.sectionType === 'strongAgainst' &&
        counterData.strongAgainst.length > 0
      ) {
        hasExistingData = true;
      } else if (
        section.sectionType === 'bestLaneCounters' &&
        counterData.bestLaneCounters.length > 0
      ) {
        hasExistingData = true;
      }

      if (hasExistingData) {
        console.log(
          `⏭️ Skipping section "${section.headerText}" - ${section.sectionType} already has data`,
        );
        continue;
      }

      console.log(
        `🔍 Processing section: ${section.sectionType} - "${section.headerText}" with ${section.champCount} champions`,
      );

      // Process this section with the verified $sectionRow
      this.processSectionContent(section, $, counterData);
    }
  }

  /**
   * Process section content để extract champions
   */
  private processSectionContent(
    section: {
      element: any;
      $header: cheerio.Cheerio<any>;
      headerText: string;
      sectionType: string;
      champCount: number;
      $sectionRow: any;
    },
    $: cheerio.CheerioAPI,
    counterData: any,
  ): void {
    const { sectionType, headerText, $sectionRow } = section;

    // Sử dụng $sectionRow đã được verify từ extractChampionsBySection
    if ($sectionRow && $sectionRow.length) {
      const champCount = $sectionRow.find('.list_champ img').length;
      console.log(
        `📦 Processing verified section row with ${champCount} champions for ${sectionType}`,
      );

      if (champCount > 0) {
        $sectionRow.find('.list_champ').each((_, champElement) => {
          const $champDiv = $(champElement);
          const $img = $champDiv.find('img').first();

          if ($img.length) {
            const alt = $img.attr('alt') || '';
            const src = $img.attr('src') || '';
            const title = $img.attr('title') || '';

            if (this.isChampionImage(alt, src, title)) {
              const championName = this.extractChampionNameFromImage(
                alt,
                src,
                title,
              );

              if (championName && championName.length > 2) {
                console.log(
                  `🎯 Found champion: ${championName} in ${sectionType}`,
                );

                // Kiểm tra trùng lặp - chỉ trong category hiện tại
                let existsInCurrentCategory = false;

                if (sectionType === 'weakAgainst') {
                  existsInCurrentCategory = counterData.weakAgainst.find(
                    (c) => c.championName === championName,
                  );
                } else if (sectionType === 'strongAgainst') {
                  existsInCurrentCategory = counterData.strongAgainst.find(
                    (c) => c.championName === championName,
                  );
                } else if (sectionType === 'bestLaneCounters') {
                  existsInCurrentCategory = counterData.bestLaneCounters.find(
                    (c) => c.championName === championName,
                  );
                }

                // Chỉ kiểm tra trùng lặp trong cùng category
                if (!existsInCurrentCategory) {
                  const championData = this.createChampionCounterData(
                    championName,
                    $img,
                  );

                  // Thêm vào đúng category
                  if (sectionType === 'weakAgainst') {
                    counterData.weakAgainst.push(championData);
                    console.log(`   ✅ Added to weakAgainst: ${championName}`);
                  } else if (sectionType === 'strongAgainst') {
                    counterData.strongAgainst.push(championData);
                    console.log(
                      `   ✅ Added to strongAgainst: ${championName}`,
                    );
                  } else if (sectionType === 'bestLaneCounters') {
                    counterData.bestLaneCounters.push(championData);
                    console.log(
                      `   ✅ Added to bestLaneCounters: ${championName}`,
                    );
                  }
                } else {
                  console.log(
                    `   ⚠️ Champion ${championName} already exists in ${sectionType}, skipping duplicate`,
                  );
                }
              }
            }
          }
        });
      } else {
        console.log(
          `   ❌ No champion images found in section row for ${sectionType}`,
        );
      }
    } else {
      console.log(`   ❌ No verified section row available for ${sectionType}`);
    }

    console.log(
      `📊 Section "${headerText}" processed - ${sectionType}: ${
        sectionType === 'weakAgainst'
          ? counterData.weakAgainst.length
          : sectionType === 'strongAgainst'
            ? counterData.strongAgainst.length
            : sectionType === 'bestLaneCounters'
              ? counterData.bestLaneCounters.length
              : 0
      } champions`,
    );
  }

  /**
   * Fallback: Extract champions từ images nếu không tìm thấy section rõ ràng
   */
  private extractChampionsFromImages(
    $: cheerio.CheerioAPI,
    counterData: any,
  ): void {
    console.log('🔍 Extracting champions from images with context analysis...');

    // Tìm tất cả hình ảnh champion
    $('img').each((_, imgElement) => {
      const $img = $(imgElement);
      const alt = $img.attr('alt') || '';
      const src = $img.attr('src') || '';
      const title = $img.attr('title') || '';

      // Kiểm tra xem có phải hình champion không
      if (this.isChampionImage(alt, src, title)) {
        const championName = this.extractChampionNameFromImage(alt, src, title);
        if (championName && championName.length > 2) {
          // Kiểm tra xem đã có champion này chưa
          const existsInAny =
            counterData.weakAgainst.find(
              (c) => c.championName === championName,
            ) ||
            counterData.strongAgainst.find(
              (c) => c.championName === championName,
            ) ||
            counterData.bestLaneCounters.find(
              (c) => c.championName === championName,
            ) ||
            counterData.worstLaneCounters.find(
              (c) => c.championName === championName,
            );

          if (!existsInAny) {
            const championData = this.createChampionCounterData(
              championName,
              $img,
            );

            // Phân tích context chi tiết để xác định loại counter
            const context = this.getImageContext($, $img);
            const parentText = $img
              .closest('div, section, article')
              .text()
              .toLowerCase();
            const nearbyText = $img.parent().text().toLowerCase();

            console.log(`🔍 Analyzing ${championName}:`);
            console.log(`   Context: "${context.substring(0, 100)}..."`);
            console.log(`   Parent text: "${parentText.substring(0, 100)}..."`);
            console.log(`   Nearby text: "${nearbyText.substring(0, 100)}..."`);

            // Logic phân loại dựa trên context với dynamic champion name
            const targetChampLower = championName.toLowerCase();

            // Kiểm tra trùng lặp trước khi phân loại
            const isWeakAgainstCandidate =
              context.includes(`khắc chế ${targetChampLower}`) ||
              context.includes(`counter ${targetChampLower}`) ||
              parentText.includes(`tướng khắc chế ${targetChampLower}`) ||
              nearbyText.includes(`khắc chế ${targetChampLower}`) ||
              context.includes('tướng khắc chế') ||
              parentText.includes('counter') ||
              nearbyText.includes('khắc chế');

            const isStrongAgainstCandidate =
              context.includes(`${targetChampLower} khắc chế`) ||
              context.includes(`${targetChampLower} counter`) ||
              parentText.includes(`${targetChampLower} khắc chế`) ||
              nearbyText.includes(`${targetChampLower} khắc chế`) ||
              context.includes('yếu hơn') ||
              context.includes('weak') ||
              context.includes('tướng yếu');

            const isBestLaneCountersCandidate =
              context.includes('tỷ lệ thắng cao') ||
              context.includes('thắng cao') ||
              context.includes('có lợi thế') ||
              context.includes('win rate') ||
              parentText.includes('tỷ lệ thắng') ||
              nearbyText.includes('thống kê');

            // Ưu tiên strongAgainst và bestLaneCounters trước
            if (isStrongAgainstCandidate) {
              // Kiểm tra trùng lặp chỉ trong strongAgainst
              const existsInStrongAgainst = counterData.strongAgainst.find(
                (c) => c.championName === championName,
              );
              if (!existsInStrongAgainst) {
                counterData.strongAgainst.push(championData);
                console.log(`   ✅ Added to strongAgainst: ${championName}`);
              }
            } else if (isBestLaneCountersCandidate) {
              // Kiểm tra trùng lặp chỉ trong bestLaneCounters
              const existsInBestLane = counterData.bestLaneCounters.find(
                (c) => c.championName === championName,
              );
              if (!existsInBestLane) {
                counterData.bestLaneCounters.push(championData);
                console.log(`   ✅ Added to bestLaneCounters: ${championName}`);
              }
            } else if (isWeakAgainstCandidate) {
              // Kiểm tra trùng lặp chỉ trong weakAgainst
              const existsInWeakAgainst = counterData.weakAgainst.find(
                (c) => c.championName === championName,
              );
              if (!existsInWeakAgainst) {
                counterData.weakAgainst.push(championData);
                console.log(`   ✅ Added to weakAgainst: ${championName}`);
              }
            } else {
              // Phân tích thêm dựa trên vị trí trong trang
              const allImages = $('img').toArray();
              const imgIndex = allImages.indexOf(imgElement);
              const totalImages = allImages.length;

              if (imgIndex < totalImages * 0.3) {
                // Kiểm tra trùng lặp chỉ trong weakAgainst
                const existsInWeakAgainst = counterData.weakAgainst.find(
                  (c) => c.championName === championName,
                );
                if (!existsInWeakAgainst) {
                  counterData.weakAgainst.push(championData);
                  console.log(
                    `   ✅ Added to weakAgainst (position-based): ${championName}`,
                  );
                }
              } else if (imgIndex > totalImages * 0.7) {
                // Kiểm tra trùng lặp chỉ trong strongAgainst
                const existsInStrongAgainst = counterData.strongAgainst.find(
                  (c) => c.championName === championName,
                );
                if (!existsInStrongAgainst) {
                  counterData.strongAgainst.push(championData);
                  console.log(
                    `   ✅ Added to strongAgainst (position-based): ${championName}`,
                  );
                }
              } else {
                // Kiểm tra trùng lặp chỉ trong bestLaneCounters
                const existsInBestLane = counterData.bestLaneCounters.find(
                  (c) => c.championName === championName,
                );
                if (!existsInBestLane) {
                  counterData.bestLaneCounters.push(championData);
                  console.log(
                    `   ✅ Added to bestLaneCounters (position-based): ${championName}`,
                  );
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 Final distribution:`);
    console.log(
      `   - Weak Against: ${counterData.weakAgainst.length} champions`,
    );
    console.log(
      `   - Strong Against: ${counterData.strongAgainst.length} champions`,
    );
    console.log(
      `   - Best Lane Counters: ${counterData.bestLaneCounters.length} champions`,
    );
    console.log(
      `   - Worst Lane Counters: ${counterData.worstLaneCounters.length} champions`,
    );
  }

  /**
   * Kiểm tra xem có phải hình champion không
   */
  private isChampionImage(alt: string, src: string, title: string): boolean {
    // Danh sách champion names để check
    const validChampions = [
      'Aatrox',
      'Ahri',
      'Akali',
      'Alistar',
      'Amumu',
      'Anivia',
      'Annie',
      'Ashe',
      'Azir',
      'Bard',
      'Blitzcrank',
      'Brand',
      'Braum',
      'Caitlyn',
      'Camille',
      'Cassiopeia',
      "Cho'Gath",
      'Corki',
      'Darius',
      'Diana',
      'Draven',
      'Ekko',
      'Elise',
      'Evelynn',
      'Ezreal',
      'Fiddlesticks',
      'Fiora',
      'Fizz',
      'Galio',
      'Gangplank',
      'Garen',
      'Gnar',
      'Gragas',
      'Graves',
      'Gwen',
      'Hecarim',
      'Heimerdinger',
      'Irelia',
      'Ivern',
      'Janna',
      'Jarvan',
      'Jax',
      'Jayce',
      'Jhin',
      'Jinx',
      "Kai'Sa",
      'Kalista',
      'Karma',
      'Karthus',
      'Kassadin',
      'Katarina',
      'Kayle',
      'Kayn',
      'Kennen',
      "Kha'Zix",
      'Kindred',
      'Kled',
      "Kog'Maw",
      'LeBlanc',
      'Lee Sin',
      'Leona',
      'Lillia',
      'Lissandra',
      'Lucian',
      'Lulu',
      'Lux',
      'Malphite',
      'Malzahar',
      'Maokai',
      'Master Yi',
      'Miss Fortune',
      'Mordekaiser',
      'Morgana',
      'Nami',
      'Nasus',
      'Nautilus',
      'Neeko',
      'Nidalee',
      'Nocturne',
      'Nunu',
      'Olaf',
      'Orianna',
      'Ornn',
      'Pantheon',
      'Poppy',
      'Pyke',
      'Qiyana',
      'Quinn',
      'Rakan',
      'Rammus',
      "Rek'Sai",
      'Renekton',
      'Rengar',
      'Riven',
      'Rumble',
      'Ryze',
      'Samira',
      'Sejuani',
      'Senna',
      'Seraphine',
      'Sett',
      'Shaco',
      'Shen',
      'Shyvana',
      'Singed',
      'Sion',
      'Sivir',
      'Skarner',
      'Sona',
      'Soraka',
      'Swain',
      'Sylas',
      'Syndra',
      'Tahm Kench',
      'Taliyah',
      'Talon',
      'Taric',
      'Teemo',
      'Thresh',
      'Tristana',
      'Trundle',
      'Tryndamere',
      'Twisted Fate',
      'Twitch',
      'Udyr',
      'Urgot',
      'Varus',
      'Vayne',
      'Veigar',
      "Vel'Koz",
      'Vi',
      'Viktor',
      'Vladimir',
      'Volibear',
      'Warwick',
      'Wukong',
      'Xayah',
      'Xerath',
      'Xin Zhao',
      'Yasuo',
      'Yone',
      'Yorick',
      'Yuumi',
      'Zac',
      'Zed',
      'Ziggs',
      'Zilean',
      'Zoe',
      'Zyra',
      'Akshan',
      "Bel'Veth",
      'Briar',
      'Nilah',
      'Renata',
      'Vex',
      'Viego',
      'Zeri',
    ];

    // Kiểm tra alt text có phải champion name không
    if (
      alt &&
      validChampions.some(
        (champion) => champion.toLowerCase() === alt.toLowerCase().trim(),
      )
    ) {
      return true;
    }

    // Kiểm tra src có chứa champion name không
    if (src) {
      const srcLower = src.toLowerCase();
      if (
        validChampions.some((champion) =>
          srcLower.includes(
            champion.toLowerCase().replace(/\s+/g, '').replace(/'/g, ''),
          ),
        )
      ) {
        return true;
      }
    }

    // Kiểm tra title
    if (
      title &&
      validChampions.some(
        (champion) => champion.toLowerCase() === title.toLowerCase().trim(),
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Kiểm tra xem tên champion có hợp lệ không
   */
  private isValidChampionName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 20) {
      return false;
    }

    // Chỉ chấp nhận chữ cái, khoảng trắng và dấu nháy đơn
    return /^[A-Za-z\s']+$/.test(name.trim());
  }

  /**
   * Extract champion name from image attributes
   */
  private extractChampionNameFromImage(
    alt: string,
    src: string,
    title: string,
  ): string {
    // Ưu tiên alt text nếu có và hợp lệ
    if (alt && this.isValidChampionName(alt)) {
      return alt;
    }

    // Thử title nếu alt không có
    if (title && this.isValidChampionName(title)) {
      return title;
    }

    // Cuối cùng thử extract từ src path
    if (src) {
      // Extract filename from path (ví dụ: /images/caitlyn.jpg -> caitlyn)
      const matches = src.match(/([a-zA-Z']+)\.(?:jpg|jpeg|png|gif|webp)$/i);
      if (matches && matches[1]) {
        const nameFromSrc = matches[1];

        // Capitalize first letter để consistent với champion names
        const capitalizedName =
          nameFromSrc.charAt(0).toUpperCase() +
          nameFromSrc.slice(1).toLowerCase();

        if (this.isValidChampionName(capitalizedName)) {
          return capitalizedName;
        }
      }
    }

    return '';
  }

  /**
   * Lấy context của hình ảnh để xác định loại counter
   */
  private getImageContext($: cheerio.CheerioAPI, $img: any): string {
    try {
      let context = '';
      let current = $img.parent();

      // Kiểm tra parent elements
      for (let i = 0; i < 3 && current.length; i++) {
        const text = current.text().toLowerCase();
        context += ' ' + text;
        current = current.parent();
      }

      // Kiểm tra siblings
      $img.siblings().each((_, sibling) => {
        context += ' ' + $(sibling).text().toLowerCase();
      });

      return context;
    } catch {
      return '';
    }
  }

  /**
   * Tạo champion counter data object với imageUrl
   */
  private createChampionCounterData(championName: string, $img: any): any {
    const championData = {
      championId: championName.replace(/\s+/g, ''),
      championName: championName,
      winRate: 50, // Default win rate
      counterRating: 5,
      gameCount: 100, // Default game count
      goldDifferentialAt15: 0,
      difficulty: 'Medium',
      tips: this.generateTips(championName, 50),
      patch: '15.10',
      rank: 'Emerald+',
      imageUrl: '', // Thêm link hình ảnh
    };

    // Thêm link hình ảnh nếu có
    if ($img) {
      let imageUrl = $img.attr('src') || '';

      // Xử lý relative URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://kicdo.com' + imageUrl;
        }
      }

      championData.imageUrl = imageUrl;
    }

    return championData;
  }

  /**
   * Extract champion names từ text
   */
  private extractChampionNamesFromText(text: string): string[] {
    const championNames: string[] = [];

    // Danh sách champion names để match (chỉ những tên thực sự)
    const validChampions = [
      'Aatrox',
      'Ahri',
      'Akali',
      'Alistar',
      'Amumu',
      'Anivia',
      'Annie',
      'Ashe',
      'Azir',
      'Bard',
      'Blitzcrank',
      'Brand',
      'Braum',
      'Caitlyn',
      'Camille',
      'Cassiopeia',
      "Cho'Gath",
      'Corki',
      'Darius',
      'Diana',
      'Draven',
      'Ekko',
      'Elise',
      'Evelynn',
      'Ezreal',
      'Fiddlesticks',
      'Fiora',
      'Fizz',
      'Galio',
      'Gangplank',
      'Garen',
      'Gnar',
      'Gragas',
      'Graves',
      'Gwen',
      'Hecarim',
      'Heimerdinger',
      'Irelia',
      'Ivern',
      'Janna',
      'Jarvan',
      'Jax',
      'Jayce',
      'Jhin',
      'Jinx',
      "Kai'Sa",
      'Kalista',
      'Karma',
      'Karthus',
      'Kassadin',
      'Katarina',
      'Kayle',
      'Kayn',
      'Kennen',
      "Kha'Zix",
      'Kindred',
      'Kled',
      "Kog'Maw",
      'LeBlanc',
      'Lee Sin',
      'Leona',
      'Lillia',
      'Lissandra',
      'Lucian',
      'Lulu',
      'Lux',
      'Malphite',
      'Malzahar',
      'Maokai',
      'Master Yi',
      'Miss Fortune',
      'Mordekaiser',
      'Morgana',
      'Nami',
      'Nasus',
      'Nautilus',
      'Neeko',
      'Nidalee',
      'Nocturne',
      'Nunu',
      'Olaf',
      'Orianna',
      'Ornn',
      'Pantheon',
      'Poppy',
      'Pyke',
      'Qiyana',
      'Quinn',
      'Rakan',
      'Rammus',
      "Rek'Sai",
      'Renekton',
      'Rengar',
      'Riven',
      'Rumble',
      'Ryze',
      'Samira',
      'Sejuani',
      'Senna',
      'Seraphine',
      'Sett',
      'Shaco',
      'Shen',
      'Shyvana',
      'Singed',
      'Sion',
      'Sivir',
      'Skarner',
      'Sona',
      'Soraka',
      'Swain',
      'Sylas',
      'Syndra',
      'Tahm Kench',
      'Taliyah',
      'Talon',
      'Taric',
      'Teemo',
      'Thresh',
      'Tristana',
      'Trundle',
      'Tryndamere',
      'Twisted Fate',
      'Twitch',
      'Udyr',
      'Urgot',
      'Varus',
      'Vayne',
      'Veigar',
      "Vel'Koz",
      'Vi',
      'Viktor',
      'Vladimir',
      'Volibear',
      'Warwick',
      'Wukong',
      'Xayah',
      'Xerath',
      'Xin Zhao',
      'Yasuo',
      'Yone',
      'Yorick',
      'Yuumi',
      'Zac',
      'Zed',
      'Ziggs',
      'Zilean',
      'Zoe',
      'Zyra',
      'Akshan',
      "Bel'Veth",
      'Briar',
      'Nilah',
      'Renata',
      'Vex',
      'Viego',
      'Zeri',
    ];

    // Tìm exact match cho champion names
    validChampions.forEach((champion) => {
      // Tìm exact word match (không phải substring)
      const regex = new RegExp(`\\b${champion.replace(/'/g, "\\'")}\\b`, 'i');
      if (regex.test(text)) {
        championNames.push(champion);
      }
    });

    return [...new Set(championNames)]; // Remove duplicates
  }

  /**
   * Extract formatted content from the HTML content
   */
  private extractFormattedContent($: cheerio.CheerioAPI): string {
    let formattedContent = '';

    try {
      // Chỉ lấy content sau các thẻ h2, không lấy toàn bộ trang
      $('h2').each((_, h2Element) => {
        const $h2 = $(h2Element);
        const h2Text = $h2.text().trim();

        // Bỏ qua các h2 không liên quan đến counter
        if (
          !h2Text.includes('khắc chế') &&
          !h2Text.includes('Trang bị') &&
          !h2Text.includes('Điểm yếu') &&
          !h2Text.includes('Chiến thuật') &&
          !h2Text.includes('đối đầu') &&
          !h2Text.includes('mẹo')
        ) {
          return; // Skip this h2
        }

        // Thêm h2 vào content
        formattedContent += `<h2>${h2Text}</h2>`;

        // Lấy tất cả content sau h2 cho đến h2 tiếp theo hoặc hết section
        let currentElement = $h2.next();

        while (currentElement.length && !currentElement.is('h2')) {
          const tagName = currentElement.prop('tagName')?.toLowerCase();

          // Chỉ lấy các thẻ có nội dung hữu ích
          if (
            tagName === 'p' ||
            tagName === 'div' ||
            tagName === 'ul' ||
            tagName === 'ol' ||
            tagName === 'blockquote' ||
            tagName === 'h3' ||
            tagName === 'h4'
          ) {
            const elementText = currentElement.text().trim();

            // Bỏ qua các element rỗng hoặc chỉ chứa whitespace
            if (elementText.length > 10) {
              // Bỏ qua ads, scripts, và các element không cần thiết
              if (
                !currentElement.hasClass('adsbygoogle') &&
                !currentElement.hasClass('ad_sidebar') &&
                !currentElement.find('script').length &&
                !elementText.includes('Google tag') &&
                !elementText.includes('gtag')
              ) {
                formattedContent += currentElement.prop('outerHTML') || '';
              }
            }
          }

          currentElement = currentElement.next();
        }
      });

      // Nếu không tìm thấy h2 nào, fallback để tìm content trong main article
      if (!formattedContent) {
        const mainContent = $('main, article, .detail_con, .content').first();
        if (mainContent.length) {
          // Tìm content sau h2 đầu tiên trong main content
          const firstH2 = mainContent.find('h2').first();
          if (firstH2.length) {
            let currentElement = firstH2.next();
            formattedContent += `<h2>${firstH2.text()}</h2>`;

            while (currentElement.length && !currentElement.is('h2')) {
              const tagName = currentElement.prop('tagName')?.toLowerCase();

              if (
                tagName === 'p' ||
                tagName === 'div' ||
                tagName === 'ul' ||
                tagName === 'ol' ||
                tagName === 'blockquote'
              ) {
                const elementText = currentElement.text().trim();
                if (
                  elementText.length > 10 &&
                  !currentElement.hasClass('adsbygoogle') &&
                  !elementText.includes('Google tag')
                ) {
                  formattedContent += currentElement.prop('outerHTML') || '';
                }
              }

              currentElement = currentElement.next();
            }
          }
        }
      }

      // Clean up the content
      if (formattedContent) {
        // Remove scripts, styles, và ads
        formattedContent = formattedContent.replace(
          /<script[^>]*>[\s\S]*?<\/script>/gi,
          '',
        );
        formattedContent = formattedContent.replace(
          /<style[^>]*>[\s\S]*?<\/style>/gi,
          '',
        );
        formattedContent = formattedContent.replace(
          /<div[^>]*class="[^"]*adsbygoogle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          '',
        );

        // Clean up extra whitespace
        formattedContent = formattedContent.replace(/\s+/g, ' ').trim();

        // Wrap in a container
        formattedContent = `<div class="champion-formatted-content">${formattedContent}</div>`;
      }
    } catch (error) {
      console.warn(
        'Warning: Error extracting formatted content:',
        error.message,
      );
    }

    return formattedContent;
  }

  private extractContentSections($: cheerio.CheerioAPI): any {
    const contentSections: any = {
      weaknessesContent: '',
      counterItemsContent: '',
      strategiesContent: '',
      additionalTipsContent: '',
    };

    try {
      // Tìm và extract content từ các h2 sections
      $('h2').each((_, h2Element) => {
        const $h2 = $(h2Element);
        const h2Text = $h2.text().trim().toLowerCase();

        let sectionContent = '';
        let currentElement = $h2.next();

        // Lấy content sau h2 cho đến h2 tiếp theo
        while (currentElement.length && !currentElement.is('h2')) {
          const tagName = currentElement.prop('tagName')?.toLowerCase();

          if (
            tagName === 'p' ||
            tagName === 'div' ||
            tagName === 'ul' ||
            tagName === 'ol' ||
            tagName === 'blockquote' ||
            tagName === 'h3'
          ) {
            const elementText = currentElement.text().trim();
            if (
              elementText.length > 10 &&
              !currentElement.hasClass('adsbygoogle') &&
              !elementText.includes('Google tag')
            ) {
              sectionContent += currentElement.prop('outerHTML') || '';
            }
          }

          currentElement = currentElement.next();
        }

        // Phân loại content dựa trên h2 title
        if (h2Text.includes('điểm yếu') || h2Text.includes('yếu điểm')) {
          contentSections.weaknessesContent = this.cleanContent(sectionContent);
        } else if (h2Text.includes('trang bị') || h2Text.includes('item')) {
          contentSections.counterItemsContent =
            this.cleanContent(sectionContent);
        } else if (
          h2Text.includes('chiến thuật') ||
          h2Text.includes('cách') ||
          h2Text.includes('đối đầu') ||
          h2Text.includes('khắc chế')
        ) {
          contentSections.strategiesContent = this.cleanContent(sectionContent);
        } else if (
          h2Text.includes('mẹo') ||
          h2Text.includes('lưu ý') ||
          h2Text.includes('bổ sung')
        ) {
          contentSections.additionalTipsContent =
            this.cleanContent(sectionContent);
        }
      });

      // Fallback: tìm content dựa trên text patterns nếu không có h2
      if (!contentSections.weaknessesContent) {
        $('p, div').each((_, element) => {
          const text = $(element).text().toLowerCase();
          if (
            (text.includes('điểm yếu') || text.includes('yếu điểm')) &&
            text.length > 50 &&
            text.length < 1000
          ) {
            contentSections.weaknessesContent = this.cleanContent(
              $(element).prop('outerHTML') || '',
            );
            return false;
          }
        });
      }

      if (!contentSections.counterItemsContent) {
        $('p, div').each((_, element) => {
          const text = $(element).text().toLowerCase();
          if (
            (text.includes('trang bị') || text.includes('item')) &&
            text.length > 50 &&
            text.length < 1000
          ) {
            contentSections.counterItemsContent = this.cleanContent(
              $(element).prop('outerHTML') || '',
            );
            return false;
          }
        });
      }

      if (!contentSections.strategiesContent) {
        $('p, div').each((_, element) => {
          const text = $(element).text().toLowerCase();
          if (
            (text.includes('chiến thuật') ||
              text.includes('cách') ||
              text.includes('đối đầu') ||
              text.includes('khắc chế')) &&
            text.length > 50 &&
            text.length < 1000
          ) {
            contentSections.strategiesContent = this.cleanContent(
              $(element).prop('outerHTML') || '',
            );
            return false;
          }
        });
      }
    } catch (error) {
      console.warn(
        'Warning: Error extracting content sections:',
        error.message,
      );
    }

    return contentSections;
  }

  /**
   * Clean HTML content
   */
  private cleanContent(content: string): string {
    if (!content) return '';

    // Remove scripts and styles
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Clean up extra whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return content;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Batch crawl multiple champions and roles
   */
  async batchCrawlCounters(
    champions: Array<{ name: string; roles: string[] }>,
    patch?: string,
    rank?: string,
  ): Promise<void> {
    console.log(`🚀 Starting batch crawl for ${champions.length} champions...`);

    for (const champion of champions) {
      console.log(`\n📊 Crawling ${champion.name}...`);

      for (const role of champion.roles) {
        try {
          console.log(`  - ${role} role...`);
          await this.crawlCounterData(champion.name, role, patch, rank);

          // Delay between requests to be respectful
          await this.sleep(2000);
        } catch (error) {
          console.error(
            `❌ Failed to crawl ${champion.name} ${role}:`,
            error.message,
          );
          continue;
        }
      }
    }

    console.log('\n✅ Batch crawl completed!');
  }

  /**
   * Extract additional structured data
   */
  private extractAdditionalData($: cheerio.CheerioAPI): any {
    const additionalData: any = {};

    try {
      // Extract item build recommendations
      const coreItems = [];
      $('.core-items .item, .recommended-items .item').each((_, element) => {
        const itemName = $(element).attr('alt') || $(element).text().trim();
        if (itemName) coreItems.push(itemName);
      });
      if (coreItems.length > 0) {
        additionalData.itemBuildRecommendations = { core: coreItems };
      }

      // Extract rune recommendations
      const primaryRune = $('.primary-rune, .keystone').first().text().trim();
      if (primaryRune) {
        additionalData.runeRecommendations = { primary: primaryRune };
      }

      // Extract play style recommendations
      const playStyle = $('.playstyle, .strategy, .tips').first().text().trim();
      if (playStyle) {
        additionalData.playStyle = playStyle;
      }
    } catch (error) {
      console.warn('Warning: Error extracting additional data:', error.message);
    }

    return additionalData;
  }

  /**
   * Calculate counter rating based on win rate and game count
   */
  private calculateCounterRating(winRate: number, gameCount: number): number {
    if (gameCount < 50) return 5; // Not enough data

    if (winRate >= 60) return 9 + (winRate - 60) * 0.1;
    if (winRate >= 55) return 7 + (winRate - 55) * 0.4;
    if (winRate >= 50) return 5 + (winRate - 50) * 0.4;
    if (winRate >= 45) return 3 + (winRate - 45) * 0.4;
    if (winRate >= 40) return 1 + (winRate - 40) * 0.4;

    return 0.5;
  }

  /**
   * Calculate difficulty based on win rate and counter rating
   */
  private calculateDifficulty(winRate: number, counterRating: number): string {
    if (counterRating >= 8 || winRate >= 58) return 'Hard';
    if (counterRating >= 6 || winRate >= 53) return 'Medium';
    return 'Easy';
  }

  /**
   * Generate tips based on champion matchup
   */
  private generateTips(enemyChampionName: string, winRate: number): string {
    if (winRate > 55) {
      return `${enemyChampionName} has significant advantages in this matchup. Play defensively and look for team fight opportunities.`;
    } else if (winRate < 45) {
      return `You have good chances against ${enemyChampionName}. Look for aggressive plays and early advantages.`;
    } else {
      return `Fairly balanced matchup against ${enemyChampionName}. Focus on macro play and positioning.`;
    }
  }

  /**
   * Analyze and reclassify champions based on context analysis
   */
  private analyzeAndReclassifyChampions(
    $: cheerio.CheerioAPI,
    counterData: any,
    targetChampionName?: string,
  ): void {
    console.log('🔍 Analyzing and reclassifying champions...');

    if (!targetChampionName) {
      targetChampionName = 'unknown';
    }

    console.log(`🎯 Target champion detected: ${targetChampionName}`);

    // Tìm tất cả hình ảnh champion
    $('img').each((_, imgElement) => {
      const $img = $(imgElement);
      const alt = $img.attr('alt') || '';
      const src = $img.attr('src') || '';
      const title = $img.attr('title') || '';

      // Kiểm tra xem có phải hình champion không
      if (this.isChampionImage(alt, src, title)) {
        const championName = this.extractChampionNameFromImage(alt, src, title);
        if (championName && championName.length > 2) {
          // Kiểm tra xem đã có champion này chưa
          const existsInAny =
            counterData.weakAgainst.find(
              (c) => c.championName === championName,
            ) ||
            counterData.strongAgainst.find(
              (c) => c.championName === championName,
            ) ||
            counterData.bestLaneCounters.find(
              (c) => c.championName === championName,
            ) ||
            counterData.worstLaneCounters.find(
              (c) => c.championName === championName,
            );

          if (!existsInAny) {
            const championData = this.createChampionCounterData(
              championName,
              $img,
            );

            // Phân tích context chi tiết để xác định loại counter
            const context = this.getImageContext($, $img);
            const parentText = $img
              .closest('div, section, article')
              .text()
              .toLowerCase();
            const nearbyText = $img.parent().text().toLowerCase();

            console.log(`🔍 Analyzing ${championName}:`);
            console.log(`   Context: "${context.substring(0, 100)}..."`);
            console.log(`   Parent text: "${parentText.substring(0, 100)}..."`);
            console.log(`   Nearby text: "${nearbyText.substring(0, 100)}..."`);

            // Logic phân loại dựa trên context với dynamic champion name
            const targetChampLower = targetChampionName.toLowerCase();

            // Kiểm tra trùng lặp trước khi phân loại
            const isWeakAgainstCandidate =
              context.includes(`khắc chế ${targetChampLower}`) ||
              context.includes(`counter ${targetChampLower}`) ||
              parentText.includes(`tướng khắc chế ${targetChampLower}`) ||
              nearbyText.includes(`khắc chế ${targetChampLower}`) ||
              context.includes('tướng khắc chế') ||
              parentText.includes('counter') ||
              nearbyText.includes('khắc chế');

            const isStrongAgainstCandidate =
              context.includes(`${targetChampLower} khắc chế`) ||
              context.includes(`${targetChampLower} counter`) ||
              parentText.includes(`${targetChampLower} khắc chế`) ||
              nearbyText.includes(`${targetChampLower} khắc chế`) ||
              context.includes('yếu hơn') ||
              context.includes('weak') ||
              context.includes('tướng yếu');

            const isBestLaneCountersCandidate =
              context.includes('tỷ lệ thắng cao') ||
              context.includes('thắng cao') ||
              context.includes('có lợi thế') ||
              context.includes('win rate') ||
              parentText.includes('tỷ lệ thắng') ||
              nearbyText.includes('thống kê');

            // Ưu tiên strongAgainst và bestLaneCounters trước
            if (isStrongAgainstCandidate) {
              // Kiểm tra trùng lặp chỉ trong strongAgainst
              const existsInStrongAgainst = counterData.strongAgainst.find(
                (c) => c.championName === championName,
              );
              if (!existsInStrongAgainst) {
                counterData.strongAgainst.push(championData);
                console.log(`   ✅ Added to strongAgainst: ${championName}`);
              }
            } else if (isBestLaneCountersCandidate) {
              // Kiểm tra trùng lặp chỉ trong bestLaneCounters
              const existsInBestLane = counterData.bestLaneCounters.find(
                (c) => c.championName === championName,
              );
              if (!existsInBestLane) {
                counterData.bestLaneCounters.push(championData);
                console.log(`   ✅ Added to bestLaneCounters: ${championName}`);
              }
            } else if (isWeakAgainstCandidate) {
              // Kiểm tra trùng lặp chỉ trong weakAgainst
              const existsInWeakAgainst = counterData.weakAgainst.find(
                (c) => c.championName === championName,
              );
              if (!existsInWeakAgainst) {
                counterData.weakAgainst.push(championData);
                console.log(`   ✅ Added to weakAgainst: ${championName}`);
              }
            } else {
              // Phân tích thêm dựa trên vị trí trong trang
              const allImages = $('img').toArray();
              const imgIndex = allImages.indexOf(imgElement);
              const totalImages = allImages.length;

              if (imgIndex < totalImages * 0.3) {
                // Kiểm tra trùng lặp chỉ trong weakAgainst
                const existsInWeakAgainst = counterData.weakAgainst.find(
                  (c) => c.championName === championName,
                );
                if (!existsInWeakAgainst) {
                  counterData.weakAgainst.push(championData);
                  console.log(
                    `   ✅ Added to weakAgainst (position-based): ${championName}`,
                  );
                }
              } else if (imgIndex > totalImages * 0.7) {
                // Kiểm tra trùng lặp chỉ trong strongAgainst
                const existsInStrongAgainst = counterData.strongAgainst.find(
                  (c) => c.championName === championName,
                );
                if (!existsInStrongAgainst) {
                  counterData.strongAgainst.push(championData);
                  console.log(
                    `   ✅ Added to strongAgainst (position-based): ${championName}`,
                  );
                }
              } else {
                // Kiểm tra trùng lặp chỉ trong bestLaneCounters
                const existsInBestLane = counterData.bestLaneCounters.find(
                  (c) => c.championName === championName,
                );
                if (!existsInBestLane) {
                  counterData.bestLaneCounters.push(championData);
                  console.log(
                    `   ✅ Added to bestLaneCounters (position-based): ${championName}`,
                  );
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 Final distribution:`);
    console.log(
      `   - Weak Against: ${counterData.weakAgainst.length} champions`,
    );
    console.log(
      `   - Strong Against: ${counterData.strongAgainst.length} champions`,
    );
    console.log(
      `   - Best Lane Counters: ${counterData.bestLaneCounters.length} champions`,
    );
    console.log(
      `   - Worst Lane Counters: ${counterData.worstLaneCounters.length} champions`,
    );
  }
}
