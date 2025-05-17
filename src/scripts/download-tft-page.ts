import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Champion name from command line argument
const championName = process.argv[2] || 'Alistar';

// Convert champion name to URL format (lowercase, no spaces)
const formattedName = championName.toLowerCase().replace(/\s+/g, '-');
const url = `https://tftactics.gg/champions/${formattedName}/`;

async function downloadPage() {
  try {
    console.log(`Downloading HTML from ${url}`);
    
    const { data } = await axios.get(url);
    
    // Save the HTML to a file
    const outputPath = path.join(__dirname, '../../data/tft-page.html');
    fs.writeFileSync(outputPath, data);
    
    console.log(`HTML content saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error downloading page:`, error);
  }
}

downloadPage()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Error:', err)); 