import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Interfaces
interface BuildItem {
  name: string;
  imageUrl: string;
}

interface BuildSpell {
  name: string;
  imageUrl: string;
}

interface BuildRune {
  name: string;
  imageUrl: string;
}

interface ChampionBuild {
  championId: string;
  startingItems: BuildItem[];
  coreItems: BuildItem[];
  finalBuildItems: BuildItem[];
  boots: BuildItem[];
  enchantments: BuildItem[];
  situationalItems: BuildItem[];
  spells: BuildSpell[];
  runes: BuildRune[];
  situationalRunes: BuildRune[];
  skillOrder: string[];
  buildType: string;
  sourceUrl: string;
}

/**
 * Formats image URL to be absolute
 * @param relativeUrl Relative URL from the website
 * @returns Absolute URL
 */
function formatImageUrl(relativeUrl: string): string {
  if (!relativeUrl) return '';

  // If already an absolute URL, return as is
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }

  // Make sure relative URL starts with /
  const cleanRelativeUrl = relativeUrl.startsWith('/')
    ? relativeUrl
    : `/${relativeUrl}`;

  return `https://www.wildriftfire.com${cleanRelativeUrl}`;
}

/**
 * Save HTML to file for debugging purposes
 */
function saveHtmlForDebug(html: string, championName: string) {
  const debugDir = path.resolve(process.cwd(), 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }
  const filePath = path.resolve(
    debugDir,
    `${championName.toLowerCase()}_build.html`,
  );
  fs.writeFileSync(filePath, html);
  console.log(`Saved HTML to ${filePath} for debugging`);
}

/**
 * Crawl champion build data from WildRiftFire
 */
async function crawlChampionBuild(
  championId: string,
  championName: string,
  championUrl = 'https://www.wildriftfire.com/guide/aatrox',
): Promise<ChampionBuild[]> {
  try {
    console.log(
      `Crawling build data for ${championName} from ${championUrl}...`,
    );

    const response = await axios.get(championUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Save HTML for debugging
    saveHtmlForDebug(html, championName);

    // All builds on the page
    const builds: ChampionBuild[] = [];

    // Find all build sections
    const buildSections = $('.wf-champion__data__items');
    console.log(`Found ${buildSections.length} build sections`);

    // For each build section, extract build data
    buildSections.each((i, buildSection) => {
      // Determine build type (Solo Lane, Jungle, etc.)
      let buildType = '';

      // Try to find build type from nearby elements
      const guideId = $(buildSection).attr('data-guide-id');
      const buildsForRole = $(`.guide-tab-list li[data-guide-id="${guideId}"]`)
        .text()
        .trim();

      if (buildsForRole.includes('Solo')) {
        buildType = 'Solo Lane';
      } else if (buildsForRole.includes('Jungle')) {
        buildType = 'Jungle';
      } else if (buildsForRole.includes('Mid')) {
        buildType = 'Mid Lane';
      } else if (
        buildsForRole.includes('ADC') ||
        buildsForRole.includes('Dragon')
      ) {
        buildType = 'Dragon Lane';
      } else if (buildsForRole.includes('Support')) {
        buildType = 'Support';
      }

      console.log(`Processing ${buildType || 'Default'} build`);

      // Initialize build
      const build: ChampionBuild = {
        championId,
        buildType,
        startingItems: [],
        coreItems: [],
        finalBuildItems: [],
        boots: [],
        enchantments: [],
        situationalItems: [],
        spells: [],
        runes: [],
        situationalRunes: [],
        skillOrder: [],
        sourceUrl: championUrl,
      };

      // Extract starting items
      $(buildSection)
        .find('.section.starting .ico-holder')
        .each((i, el) => {
          const name = $(el).find('.name').text().trim();
          const imgSrc = $(el).find('img').attr('src') || '';

          if (name && imgSrc) {
            build.startingItems.push({
              name,
              imageUrl: formatImageUrl(imgSrc),
            });
          }
        });

      // Extract core items
      $(buildSection)
        .find('.section.core .ico-holder')
        .each((i, el) => {
          const name = $(el).find('.name').text().trim();
          const imgSrc = $(el).find('img').attr('src') || '';

          if (name && imgSrc) {
            build.coreItems.push({
              name,
              imageUrl: formatImageUrl(imgSrc),
            });
          }
        });

      // Extract boots
      $(buildSection)
        .find('.section.boots .ico-holder')
        .each((i, el) => {
          const name = $(el).find('.name').text().trim();
          const imgSrc = $(el).find('img').attr('src') || '';
          const isEnchant = $(el).find('.img-bg.enchant').length > 0;

          if (name && imgSrc) {
            if (isEnchant) {
              build.enchantments.push({
                name,
                imageUrl: formatImageUrl(imgSrc),
              });
            } else {
              build.boots.push({
                name,
                imageUrl: formatImageUrl(imgSrc),
              });
            }
          }
        });

      // Extract final build items
      $(buildSection)
        .find('.section.final .ico-holder')
        .not('.boots-wrap .ico-holder')
        .each((i, el) => {
          const name = $(el).find('.name').text().trim();
          const imgSrc = $(el).find('img').attr('src') || '';
          const isEnchant = $(el).find('.img-bg.enchant').length > 0;

          if (name && imgSrc && !isEnchant) {
            build.finalBuildItems.push({
              name,
              imageUrl: formatImageUrl(imgSrc),
            });
          }
        });

      // Find corresponding spell section using the same guide ID
      const spellSection = $(
        `.wf-champion__data__spells[data-guide-id="${guideId}"]`,
      );

      // Extract summoner spells
      spellSection.find('.section.spells .ico-holder').each((i, el) => {
        const name = $(el).find('.name').text().trim();
        const imgSrc = $(el).find('img').attr('src') || '';

        if (name && imgSrc) {
          build.spells.push({
            name,
            imageUrl: formatImageUrl(imgSrc),
          });
        }
      });

      // Extract runes
      spellSection.find('.section.runes .ico-holder').each((i, el) => {
        const name = $(el).find('.name').text().trim();
        const imgSrc = $(el).find('img').attr('src') || '';

        if (name && imgSrc) {
          build.runes.push({
            name,
            imageUrl: formatImageUrl(imgSrc),
          });
        }
      });

      // Extract situational items
      const situationalItemsSection = $(
        `.wf-champion__data__situational.runes[data-guide-id="${guideId}"]`,
      );

      situationalItemsSection
        .find('.section.situation .ico-holder')
        .each((i, el) => {
          const name = $(el).find('.name').text().trim();
          const imgSrc = $(el).find('img').attr('src') || '';

          if (name && imgSrc) {
            // Check if this item is already in our situational items list
            const isDuplicate = build.situationalItems.some(
              (item) => item.name === name,
            );

            if (!isDuplicate) {
              build.situationalItems.push({
                name,
                imageUrl: formatImageUrl(imgSrc),
              });
            }
          }
        });

      // Extract situational runes
      const situationalRunesSection = $(
        `.wf-champion__data__situational-runes.runes[data-guide-id="${guideId}"]`,
      );

      situationalRunesSection
        .find('.section.situation .ico-holder')
        .each((i, el) => {
          const name = $(el).find('.name').text().trim();
          const imgSrc = $(el).find('img').attr('src') || '';

          if (name && imgSrc) {
            // Check if this rune is already in our situational runes list
            const isDuplicate = build.situationalRunes.some(
              (rune) => rune.name === name,
            );

            if (!isDuplicate) {
              build.situationalRunes.push({
                name,
                imageUrl: formatImageUrl(imgSrc),
              });
            }
          }
        });

      // Extract skill order
      const skillsSection = $(
        `.wf-champion__data__skills[data-guide-id="${guideId}"]`,
      );

      // Extract from Quick Skill Order section
      skillsSection
        .find('.skills-mod__quick__order .ico-holder')
        .each((i, el) => {
          const abilityName = $(el).find('img').attr('alt');

          if (abilityName) {
            build.skillOrder.push(abilityName);
          }
        });

      // Add build to list
      builds.push(build);
    });

    console.log(`Extracted ${builds.length} builds for ${championName}`);
    return builds;
  } catch (error) {
    console.error(`Error crawling champion build data: ${error.message}`);
    console.error(error.stack);
    return [];
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting to crawl Wild Rift champion build data...');

    // Get the models
    const championModel = app.get(getModelToken('WrChampion'));
    const buildModel = app.get(getModelToken('WrChampionBuild'));

    // Get one champion to test or process all
    const championName = process.argv[2];
    let champions;

    if (championName) {
      champions = await championModel.find({ name: championName }).lean();
      console.log(
        `Found ${champions.length} champions with name "${championName}"`,
      );
    } else {
      champions = await championModel.find().lean();
      console.log(`Found ${champions.length} champions in total`);
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each champion
    for (const champion of champions) {
      try {
        console.log(`\nProcessing ${champion.name}`);

        // Format champion name for URL
        const championNameForUrl = champion.name
          .replace(/\s+/g, '-')
          .replace(/[.']/g, '')
          .toLowerCase();

        const url = `https://www.wildriftfire.com/guide/${championNameForUrl}`;

        // Add a small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Crawl build data
        const builds = await crawlChampionBuild(
          champion._id.toString(),
          champion.name,
          url,
        );

        // Save each build
        for (const build of builds) {
          // Try to find existing build for this champion with the same type
          const existingBuild = await buildModel.findOne({
            championId: champion._id,
            buildType: build.buildType,
          });

          if (existingBuild) {
            console.log(
              `Updating existing ${build.buildType || 'Default'} build for ${champion.name}`,
            );
            await buildModel.findByIdAndUpdate(existingBuild._id, build);
          } else {
            console.log(
              `Creating new ${build.buildType || 'Default'} build for ${champion.name}`,
            );
            await buildModel.create(build);
          }
        }

        successCount++;
        console.log(`Successfully processed ${champion.name}`);
      } catch (error) {
        console.error(`Error processing ${champion.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(
      `\nFinished crawling champion build data: Success: ${successCount}, Errors: ${errorCount}`,
    );
  } catch (error) {
    console.error('Error in bootstrap function:', error);
  } finally {
    await app.close();
  }
}

// Execute the script
bootstrap();
