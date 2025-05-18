import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function downloadWrPage() {
  try {
    console.log('Downloading Wild Rift page from wildriftfire.com...');
    const url = 'https://www.wildriftfire.com';
    const response = await axios.get(url);
    const htmlContent = response.data;
    
    // Save the HTML content to a file
    const filePath = path.resolve(process.cwd(), 'wildrift-page.html');
    fs.writeFileSync(filePath, htmlContent);
    
    console.log(`Successfully downloaded and saved HTML to ${filePath}`);
    console.log(`File size: ${(htmlContent.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('Error downloading Wild Rift page:', error.message);
  }
}

downloadWrPage(); 