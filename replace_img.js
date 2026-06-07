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

  // Simple check for <img
  if (content.includes('<img ') || content.includes('<img\n') || content.includes('<img\r\n')) {
    // Add import if not present
    if (!content.includes('FallbackImage')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import .*$/gm)];
      if (importMatches.length > 0) {
        const lastMatch = importMatches[importMatches.length - 1];
        const insertPos = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, insertPos) + '\nimport FallbackImage from "@/components/FallbackImage";' + content.slice(insertPos);
      } else {
        content = 'import FallbackImage from "@/components/FallbackImage";\n' + content;
      }
    }

    // Replace <img ...> with <FallbackImage ...>
    content = content.replace(/<img(\s+[^>]*)>/g, '<FallbackImage$1>');
    content = content.replace(/<\/img>/g, '</FallbackImage>');
    
    // Remove eslint disable for img
    content = content.replace(/\/\*\s*eslint-disable-next-line @next\/next\/no-img-element\s*\*\/\r?\n\s*/g, '');
    content = content.replace(/\/\/\s*eslint-disable-next-line @next\/next\/no-img-element\s*\r?\n\s*/g, '');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
