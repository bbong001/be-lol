function isValidKicdoArticleLink(url: string): boolean {
  // Must be from kicdo.com domain
  if (!url.includes('kicdo.com')) {
    return false;
  }

  // Block external domains and spam sites
  const blockedDomains = [
    'castamira.com',
    'federicogarcialorca.net',
    'tai-xiu-online.net',
    'hi88com.biz',
    'shbetz.net',
    'max10.casino',
    'f8betht.baby',
    'johnverano.com',
    'lunguk.org',
    'taisunwin.claims',
    'sunwin.ke',
    'gamerikvip.site',
    'new888.rest',
    'sharesinv.com',
    'findkiely.com',
    'aiwinclub.app',
    'mb66ac.com',
    'jun88king.com',
    'okvip.io',
    '365ok.com.co',
    '33win100.com',
    '33win101.com',
    '789club63.com',
    'weatheroakales.co.uk',
    'elyantardepedraza.com',
    'go88z.dev',
    'f8betlv.com',
    '6686.express',
    'ahihi88.host',
    'hi8818.com',
  ];

  for (const domain of blockedDomains) {
    if (url.includes(domain)) {
      return false;
    }
  }

  // Block gambling/casino related keywords
  const blockedKeywords = [
    'casino',
    'bet',
    'game',
    'win',
    'club',
    'taixiu',
    'tài xỉu',
    'cakhia',
    'xoilac',
    'socolive',
    'rikvip',
    'go88',
    'new88',
    'sunwin',
    'iwin',
    'mb66',
    'jun88',
    'hello88',
    'sv388',
    'net88',
    'leo88',
    '77bet',
    'bet88',
    '8kbet',
    '789club',
    'kubet',
    'f8bet',
    '6686',
    'hitclub',
    'bj88',
    '99ok',
    'keonhacai',
    'soikeo',
    'banking',
    'casino',
    'poker',
    'bacara',
    'blackjack',
    'roulette',
    'slot',
    'fb88',
    'w88',
    'm88',
    'bancadoithuong',
    'dabet',
    'vn88',
    'bong88',
    'hb88',
    '8kbet',
    '68gamebai',
    'zbet',
    'alo789',
    'nhatvip',
    'fabet',
    '7club',
    'sin88',
    'qq88',
    'fc88',
    'sky88',
    'td88',
    'xocdia',
    'fun88',
  ];

  const urlLower = url.toLowerCase();
  for (const keyword of blockedKeywords) {
    if (urlLower.includes(keyword)) {
      return false;
    }
  }

  // Only allow kicdo.com articles with specific patterns
  const validPatterns = [
    '/tin-lol-',
    '/tin-tuc-',
    '/bai-viet-',
    '/news-',
    '/lmht-',
    '/lien-minh-',
    '-ns', // kicdo article pattern like ns287, ns168
    '/vai-tro-',
    '/tuong-lol-',
    '/trang-bi-',
    '/huong-dan-',
    '/bang-ngoc-',
  ];

  return validPatterns.some((pattern) => url.includes(pattern));
}

function testLinkFilter() {
  console.log('🧪 Testing link filter against spam/ads links...');
  console.log('');

  // Test spam links (should be blocked)
  const spamLinks = [
    'https://www.castamira.com/',
    'https://federicogarcialorca.net/',
    'https://tai-xiu-online.net',
    'https://hi88com.biz/',
    'https://shbetz.net/',
    'https://max10.casino',
    'https://f8betht.baby/',
    'https://www.johnverano.com/',
    'https://www.lunguk.org/',
    'https://taisunwin.claims/',
    'https://sunwin.ke',
    'https://gamerikvip.site/',
    'https://new888.rest/',
    'https://sharesinv.com/',
    'https://findkiely.com/',
  ];

  // Test valid kicdo links (should be allowed)
  const validLinks = [
    'https://kicdo.com/vai-tro-cac-vi-tri-trong-game-lien-minh-huyen-thoai-top-mid-jungle-adc-support-ns287',
    'https://kicdo.com/tuong-lol-ho-tro-duoc-chon-choi-nhieu-nhat-ns168',
    'https://kicdo.com/tin-lol-moi-nhat-hom-nay',
    'https://kicdo.com/tin-tuc-lien-minh-huyen-thoai-update',
    'https://kicdo.com/bai-viet-huong-dan-choi-game',
    'https://kicdo.com/lmht-tin-tuc-moi-nhat',
    'https://kicdo.com/bang-ngoc-bo-tro-cho-ad-ap-sp-tank-rung-ns124',
  ];

  console.log('❌ SPAM LINKS (should be BLOCKED):');
  spamLinks.forEach((link) => {
    const isValid = isValidKicdoArticleLink(link);
    console.log(`${isValid ? '❌ FAILED' : '✅ BLOCKED'}: ${link}`);
  });

  console.log('');
  console.log('✅ VALID LINKS (should be ALLOWED):');
  validLinks.forEach((link) => {
    const isValid = isValidKicdoArticleLink(link);
    console.log(`${isValid ? '✅ ALLOWED' : '❌ BLOCKED'}: ${link}`);
  });

  console.log('');

  const spamBlocked = spamLinks.filter(
    (link) => !isValidKicdoArticleLink(link),
  ).length;
  const validAllowed = validLinks.filter((link) =>
    isValidKicdoArticleLink(link),
  ).length;

  console.log('📊 RESULTS:');
  console.log(`- Spam links blocked: ${spamBlocked}/${spamLinks.length}`);
  console.log(`- Valid links allowed: ${validAllowed}/${validLinks.length}`);

  if (spamBlocked === spamLinks.length && validAllowed === validLinks.length) {
    console.log('🎉 Filter working perfectly!');
  } else {
    console.log('⚠️ Filter needs adjustment!');
  }
}

testLinkFilter();
