const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const pluginPath = path.resolve(__dirname, '../../.claude-plugin/plugin.json');
const raw = fs.readFileSync(pluginPath, 'utf8');
const plugin = JSON.parse(raw);

const [major, minor, patch] = plugin.version.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

// Skip if tag already exists (manual minor/major bump case)
try {
  const tags = execFileSync('git', ['tag', '-l'], { encoding: 'utf8' });
  if (tags.split('\n').includes(`v${newVersion}`)) {
    console.log(`Tag v${newVersion} already exists — skipping bump`);
    process.exit(0);
  }
} catch (_) {
  // git not available, proceed
}

plugin.version = newVersion;
fs.writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n');
console.log(`Bumped: ${major}.${minor}.${patch} → ${newVersion}`);
