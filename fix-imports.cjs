const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.includes('.test.')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      const relativeFromTestes = path.relative('src/testes', path.dirname(fullPath)).replace(/\\/g, '/');

      const regex = /from\s+['"](\.\/[^'"]+)['"]/g;
      content = content.replace(regex, (match, p1) => {
        const cleanName = p1.replace('./', '');
        const newPath = relativeFromTestes === '' ? `@/${cleanName}` : `@/${relativeFromTestes}/${cleanName}`;
        return `from '${newPath}'`;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src/testes');
console.log('Done!');
