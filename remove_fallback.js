const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const frontendSrc = path.join(__dirname, 'frontend', 'src');

walkDir(frontendSrc, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes('FallbackImage')) {
    // Remove import
    content = content.replace(/import\s+FallbackImage\s+from\s+['"]@\/components\/FallbackImage['"];\r?\n?/g, '');
    
    // Replace <FallbackImage ...> with <img ...>
    content = content.replace(/<FallbackImage(\s+[^>]*)>/g, '<img$1>');
    content = content.replace(/<\/FallbackImage>/g, '</img>');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Reverted', filePath);
    }
  }
});
