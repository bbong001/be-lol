import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterService } from '../services/counter.service';

async function createSampleCounterData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterService = app.get(CounterService);

  try {
    // Sample counter data for Briar in Jungle role (based on kicdo.com structure)
    const briarJungleCounterData = {
      championId: 'Yasuo',
      championName: 'Yasuo',
      role: 'mid',
      overallWinRate: 52.2,
      pickRate: 90.0,
      banRate: 15.3,
      patch: '15.10',
      rank: 'Emerald+',
      region: 'World',

      // Raw HTML content for debugging and re-parsing
      rawHtmlContent: `
        <div class="counter-data">
          <div class="champion-stats">
            <span class="win-rate">52.2%</span>
            <span class="pick-rate">90.0%</span>
            <span class="ban-rate">15.3%</span>
          </div>
          <div class="counters">
            <div class="counter-item">
              <img src="/champions/reksai.png" alt="Rek'Sai">
              <span class="counter-wr">57.14%</span>
              <span class="games">203</span>
              <span class="gd15">-66</span>
            </div>
            <!-- More counter items... -->
          </div>
        </div>
      `,

      rawResponseData: JSON.stringify({
        success: true,
        data: {
          champion: 'Briar',
          role: 'jungle',
          stats: { winRate: 52.2, pickRate: 90.0, banRate: 15.3 },
          counters: [
            { id: 'RekSai', name: "Rek'Sai", wr: 57.14, games: 203, gd15: -66 },
          ],
        },
      }),

      formattedContent: `
        <div class="champion-formatted-content">
          <div class="champion-weaknesses">
            <h3>Điểm yếu chí mạng của Briar?</h3>
            <p>Dù sở hữu lượng hồi phục "trâu bò", Briar vẫn có những điểm yếu cố hữu:</p>
            <ul>
              <li><strong>Dễ bị thả diều:</strong> Briar thiếu kĩ năng tiếp cận cứng, dễ dàng bị thả diều bởi các vị tướng cơ động.</li>
              <li><strong>Mù quáng trong cơn cuồng huyết:</strong> Khi kích hoạt W - Cuồng Bạo, Briar không thể phân biệt địch - ta, dễ bị "dắt mũi" bởi các chiêu thức khống chế.</li>
              <li><strong>Phụ thuộc vào chiêu cuối:</strong> Khả năng mở giao tranh của Briar phụ thuộc rất nhiều vào chiêu cuối R - Bắt Giấc Ngủ. Nếu chiêu cuối bị chặn hoặc hụt, Briar sẽ khó tiếp cận đội hình địch.</li>
            </ul>
          </div>
          
          <div class="counter-items">
            <h3>Trang bị khắc chế "cứng" Briar?</h3>
            <ul>
              <li><strong>Giáp Gai:</strong> Hiệu ứng phản sát thương từ Giáp Gai khiến cho khả năng hồi phục "trâu bò" của Briar trở nên vô dụng.</li>
              <li><strong>Dây Chuyền Iron Solari:</strong> Lá chắn từ Dây Chuyền Iron Solari giúp chống lại một lượng lớn sát thương dồn của Briar trong giao tranh.</li>
              <li><strong>Tim Băng:</strong> Giảm tốc độ đánh đến từ Tim Băng khiến Briar "mất ăn" đáng kể.</li>
            </ul>
          </div>
          
          <div class="counter-strategies">
            <h3>Chiến thuật đối đầu "cao tay"?</h3>
            <ul>
              <li><strong>Chọn tướng cơ động, cấu rỉa từ xa:</strong> Hãy ưu tiên các vị tướng như Vayne, Ezreal, Kai'sa để dễ dàng thả diều Briar.</li>
              <li><strong>Khống chế cứng khi Briar lao vào:</strong> "Hạ gục" Briar bằng các hiệu ứng khống chế cứng như choáng, hất tung, trói khi cô ta mất kiểm soát trong W - Cuồng Bạo.</li>
              <li><strong>Né tránh chiêu cuối bằng mọi giá:</strong> Hãy giữ khoảng cách an toàn và sử dụng các chiêu thức dịch chuyển để né tránh chiêu cuối R - Bắt Giấc Ngủ của Briar.</li>
            </ul>
          </div>
          
          <div class="detailed-tips">
            <h3>Bên cạnh đó:</h3>
            <ul>
              <li>Tập trung hạ gục Briar trước khi cô ta kịp hồi phục với nội tại.</li>
              <li>Kêu gọi đồng đội hỗ trợ, bởi 1vs1 với Briar là một lựa chọn "tự sát".</li>
            </ul>
            <p>Nắm vững những điểm yếu và chiến thuật trên, Briar sẽ không còn là nỗi ám ảnh của bạn nữa. Chúc bạn leo rank thành công!</p>
          </div>
        </div>
      `,

      // Separate content sections for better organization
      weaknessesContent: `
        <p>Dù sở hữu lượng hồi phục "trâu bò", Briar vẫn có những điểm yếu cố hữu:</p>
        <ul>
          <li><strong>Dễ bị thả diều:</strong> Briar thiếu kĩ năng tiếp cận cứng, dễ dàng bị thả diều bởi các vị tướng cơ động.</li>
          <li><strong>Mù quáng trong cơn cuồng huyết:</strong> Khi kích hoạt W - Cuồng Bạo, Briar không thể phân biệt địch - ta, dễ bị "dắt mũi" bởi các chiêu thức khống chế.</li>
          <li><strong>Phụ thuộc vào chiêu cuối:</strong> Khả năng mở giao tranh của Briar phụ thuộc rất nhiều vào chiêu cuối R - Bắt Giấc Ngủ. Nếu chiêu cuối bị chặn hoặc hụt, Briar sẽ khó tiếp cận đội hình địch.</li>
        </ul>
      `,

      counterItemsContent: `
        <ul>
          <li><strong>Giáp Gai:</strong> Hiệu ứng phản sát thương từ Giáp Gai khiến cho khả năng hồi phục "trâu bò" của Briar trở nên vô dụng.</li>
          <li><strong>Dây Chuyền Iron Solari:</strong> Lá chắn từ Dây Chuyền Iron Solari giúp chống lại một lượng lớn sát thương dồn của Briar trong giao tranh.</li>
          <li><strong>Tim Băng:</strong> Giảm tốc độ đánh đến từ Tim Băng khiến Briar "mất ăn" đáng kể.</li>
        </ul>
      `,

      strategiesContent: `
        <ul>
          <li><strong>Chọn tướng cơ động, cấu rỉa từ xa:</strong> Hãy ưu tiên các vị tướng như Vayne, Ezreal, Kai'sa để dễ dàng thả diều Briar.</li>
          <li><strong>Khống chế cứng khi Briar lao vào:</strong> "Hạ gục" Briar bằng các hiệu ứng khống chế cứng như choáng, hất tung, trói khi cô ta mất kiểm soát trong W - Cuồng Bạo.</li>
          <li><strong>Né tránh chiêu cuối bằng mọi giá:</strong> Hãy giữ khoảng cách an toàn và sử dụng các chiêu thức dịch chuyển để né tránh chiêu cuối R - Bắt Giấc Ngủ của Briar.</li>
        </ul>
      `,

      additionalTipsContent: `
        <ul>
          <li>Tập trung hạ gục Briar trước khi cô ta kịp hồi phục với nội tại.</li>
          <li>Kêu gọi đồng đội hỗ trợ, bởi 1vs1 với Briar là một lựa chọn "tự sát".</li>
        </ul>
        <p>Nắm vững những điểm yếu và chiến thuật trên, Briar sẽ không còn là nỗi ám ảnh của bạn nữa. Chúc bạn leo rank thành công!</p>
      `,

      additionalData: {
        matchupDetails: {
          lanePhase: 'Briar has strong early clear but vulnerable to invades',
          teamFight: 'Strong engage but needs followup from team',
        },
        itemBuildRecommendations: {
          core: ['Kraken Slayer', "Sterak's Gage", "Death's Dance"],
          situational: ['Guardian Angel', 'Maw of Malmortius'],
        },
        runeRecommendations: {
          primary: 'Conqueror',
          secondary: 'Triumph, Legend: Alacrity, Last Stand',
          shards: ['Attack Speed', 'Adaptive Force', 'Health'],
        },
        skillOrder: 'Q > W > E (Max Q first for clear speed)',
        playStyle: 'Aggressive early game, look for ganks after level 3',
      },

      // Best picks against Briar (Champions that counter Briar well)
      weakAgainst: [
        {
          championId: 'RekSai',
          championName: "Rek'Sai",
          winRate: 57.14,
          counterRating: 8.5,
          gameCount: 203,
          goldDifferentialAt15: -66,
          difficulty: 'Hard',
          tips: "Rek'Sai can interrupt Briar's abilities with her knock-up and has superior early game presence.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Trundle',
          championName: 'Trundle',
          winRate: 56.44,
          counterRating: 8.2,
          gameCount: 225,
          goldDifferentialAt15: -287,
          difficulty: 'Medium',
          tips: "Trundle can steal Briar's stats and sustain through her damage with his passive.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'DrMundo',
          championName: 'Dr. Mundo',
          winRate: 56.04,
          counterRating: 8.0,
          gameCount: 298,
          goldDifferentialAt15: -263,
          difficulty: 'Easy',
          tips: 'Dr. Mundo outscales Briar and can tank through her damage in team fights.',
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Ivern',
          championName: 'Ivern',
          winRate: 54.45,
          counterRating: 7.8,
          gameCount: 292,
          goldDifferentialAt15: -512,
          difficulty: 'Medium',
          tips: "Ivern can shield and protect teammates from Briar's burst damage.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Gwen',
          championName: 'Gwen',
          winRate: 53.6,
          counterRating: 7.5,
          gameCount: 347,
          goldDifferentialAt15: -272,
          difficulty: 'Medium',
          tips: "Gwen's W can negate Briar's engage and she outscales in team fights.",
          patch: '15.10',
          rank: 'Emerald+',
        },
      ],

      // Worst picks against Briar (Champions Briar is strong against)
      strongAgainst: [
        {
          championId: 'Rengar',
          championName: 'Rengar',
          winRate: 43.91,
          counterRating: 3.0,
          gameCount: 624,
          goldDifferentialAt15: -50,
          difficulty: 'Easy',
          tips: "Briar can out-sustain Rengar's burst and match his early game aggression.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Nidalee',
          championName: 'Nidalee',
          winRate: 44.93,
          counterRating: 2.8,
          gameCount: 414,
          goldDifferentialAt15: -102,
          difficulty: 'Easy',
          tips: 'Briar can gap close on Nidalee and sustain through her poke damage.',
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Diana',
          championName: 'Diana',
          winRate: 45.18,
          counterRating: 4.4,
          gameCount: 664,
          goldDifferentialAt15: -185,
          difficulty: 'Medium',
          tips: "Briar can match Diana's engage potential while having better sustain.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Zed',
          championName: 'Zed',
          winRate: 45.89,
          counterRating: 4.6,
          gameCount: 887,
          goldDifferentialAt15: -24,
          difficulty: 'Medium',
          tips: "Briar's healing can negate Zed's burst damage and she can follow his mobility.",
          patch: '15.10',
          rank: 'Emerald+',
        },
      ],

      // Best early game counters based on Gold Differential at 15 minutes
      bestLaneCounters: [
        {
          championId: 'Karthus',
          championName: 'Karthus',
          winRate: 52.04,
          counterRating: 6.0,
          gameCount: 319,
          goldDifferentialAt15: 135,
          difficulty: 'Medium',
          tips: 'Karthus has superior early clear and can farm safely against Briar.',
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Hecarim',
          championName: 'Hecarim',
          winRate: 49.82,
          counterRating: 5.5,
          gameCount: 845,
          goldDifferentialAt15: 132,
          difficulty: 'Medium',
          tips: "Hecarim can match Briar's mobility and has better team fight potential.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'BelVeth',
          championName: "Bel'Veth",
          winRate: 50.45,
          counterRating: 5.0,
          gameCount: 333,
          goldDifferentialAt15: 130,
          difficulty: 'Hard',
          tips: "Bel'Veth can outscale Briar if she avoids early fights.",
          patch: '15.10',
          rank: 'Emerald+',
        },
      ],

      // Worst early game matchups
      worstLaneCounters: [
        {
          championId: 'Rammus',
          championName: 'Rammus',
          winRate: 48.67,
          counterRating: 4.6,
          gameCount: 339,
          goldDifferentialAt15: -738,
          difficulty: 'Hard',
          tips: "Rammus struggles in early clear speed against Briar's fast clear.",
          patch: '15.10',
          rank: 'Emerald+',
        },
        {
          championId: 'Sejuani',
          championName: 'Sejuani',
          winRate: 46.79,
          counterRating: 4.2,
          gameCount: 374,
          goldDifferentialAt15: -702,
          difficulty: 'Hard',
          tips: "Sejuani has slow clear and can't match Briar's early game tempo.",
          patch: '15.10',
          rank: 'Emerald+',
        },
      ],
    };

    // Create the counter data
    console.log('Creating Yasuo mid counter data...');
    const result = await counterService.create(briarJungleCounterData);
    console.log('✅ Counter data created successfully:', (result as any)._id);

    // Example of creating counter data for another role
    const briarTopCounterData = {
      championId: 'Briar',
      championName: 'Briar',
      role: 'top',
      overallWinRate: 48.5,
      pickRate: 12.0,
      banRate: 8.2,
      patch: '15.10',
      rank: 'Emerald+',
      region: 'World',

      weakAgainst: [
        {
          championId: 'Fiora',
          championName: 'Fiora',
          winRate: 58.2,
          counterRating: 8.8,
          gameCount: 156,
          goldDifferentialAt15: 45,
          difficulty: 'Hard',
          tips: "Fiora can parry Briar's key abilities and outscale her in split push.",
          patch: '15.10',
          rank: 'Emerald+',
        },
      ],

      strongAgainst: [
        {
          championId: 'Garen',
          championName: 'Garen',
          winRate: 42.1,
          counterRating: 2.5,
          gameCount: 98,
          goldDifferentialAt15: -35,
          difficulty: 'Easy',
          tips: 'Briar can kite Garen and sustain through his damage.',
          patch: '15.10',
          rank: 'Emerald+',
        },
      ],

      bestLaneCounters: [],
      worstLaneCounters: [],
    };

    console.log('Creating Briar top counter data...');
    const topResult = await counterService.create(briarTopCounterData);
    console.log(
      '✅ Counter data created successfully:',
      (topResult as any)._id,
    );

    // Test some queries
    console.log('\n=== Testing Counter Service Methods ===');

    // Get best counters against Briar jungle
    console.log('\n1. Best counters against Briar jungle:');
    const bestCounters = await counterService.getBestCountersAgainst(
      'Briar',
      'jungle',
      '15.10',
      'Emerald+',
      'World',
    );
    console.log(`Found ${bestCounters.bestCounters.length} counters`);
    bestCounters.bestCounters.forEach((counter, index) => {
      console.log(
        `${index + 1}. ${counter.championName}: ${counter.winRate}% WR, Rating: ${counter.counterRating}`,
      );
    });

    // Get champion stats
    console.log('\n2. Briar jungle stats:');
    const stats = await counterService.getChampionStats(
      'Briar',
      'jungle',
      '15.10',
      'Emerald+',
      'World',
    );
    console.log(`Win Rate: ${stats.overallWinRate}%`);
    console.log(`Pick Rate: ${stats.pickRate}%`);
    console.log(`Ban Rate: ${stats.banRate}%`);

    // Get early game matchups
    console.log('\n3. Best early game matchups:');
    const earlyGame = await counterService.getBestEarlyGameMatchups(
      'Briar',
      'jungle',
      '15.10',
      'Emerald+',
      'World',
    );
    earlyGame.bestEarlyGameMatchups.forEach((matchup, index) => {
      console.log(
        `${index + 1}. ${matchup.championName}: +${matchup.goldDifferentialAt15} gold at 15min`,
      );
    });

    // Search champions
    console.log('\n4. Search for champions with "Bri" in name:');
    const searchResults = await counterService.searchChampionsForCounter('Bri');
    searchResults.forEach((champion) => {
      console.log(
        `${champion.championName} (${champion.roles.length} roles available)`,
      );
    });

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

// Run the script
if (require.main === module) {
  createSampleCounterData()
    .then(() => {
      console.log('✅ Sample counter data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to create sample counter data:', error);
      process.exit(1);
    });
}

export { createSampleCounterData };
