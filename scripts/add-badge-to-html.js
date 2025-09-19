const fs = require('fs').promises;
const path = require('path');

async function walk(dir, fileList = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.badge-backups'].includes(entry.name)) continue;
      await walk(full, fileList);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      fileList.push(full);
    }
  }
  return fileList;
}

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

(async function main(){
  const scriptsDir = __dirname;
  const root = path.resolve(scriptsDir, '..');
  const backupRoot = path.join(root, '.badge-backups');
  await ensureDir(backupRoot);

  console.log('Scanning for HTML files under', root);
  const files = await walk(root);
  console.log('Found', files.length, 'HTML files');

  let modified = 0, skipped = 0, errors = 0;
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('badge.css') || content.includes('badge.js')) {
        skipped++;
        console.log('[skip]', path.relative(root, file));
        continue;
      }

      // Compute relative paths from the HTML file to the badge assets at repo root
      const dir = path.dirname(file);
      let relCss = path.relative(dir, path.join(root, 'badge.css'));
      let relJs = path.relative(dir, path.join(root, 'badge.js'));
      // Normalize to forward slashes for HTML
      relCss = relCss.split(path.sep).join('/');
      relJs = relJs.split(path.sep).join('/');

      // Make link and script tags
      const linkTag = `<link rel="stylesheet" href="${relCss}">`;
      const scriptTag = `<script src="${relJs}"></script>`;

      // Backup original file
      const relPath = path.relative(root, file);
      const backupPath = path.join(backupRoot, relPath + '.bak');
      await ensureDir(path.dirname(backupPath));
      await fs.writeFile(backupPath, content, 'utf8');

      let updated = content;
      if (/<\/head>/i.test(updated)) {
        updated = updated.replace(/<\/head>/i, `  ${linkTag}\n</head>`);
      } else {
        // no head tag - insert near top
        updated = `${linkTag}\n${updated}`;
      }

      if (/<\/body>/i.test(updated)) {
        updated = updated.replace(/<\/body>/i, `  ${scriptTag}\n</body>`);
      } else {
        // append to end
        updated = `${updated}\n${scriptTag}`;
      }

      // Write updated file
      await fs.writeFile(file, updated, 'utf8');
      modified++;
      console.log('[mod]', relPath, '->', relCss, relJs);
    } catch (e) {
      errors++;
      console.error('[err]', file, e && e.message);
    }
  }

  console.log('Done. Modified:', modified, 'Skipped:', skipped, 'Errors:', errors);
})();
