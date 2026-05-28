const fs = require('fs');
const path = require('path');

const pluginPath = path.resolve(__dirname, '../../.claude-plugin/plugin.json');

let plugin;
try {
  plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
} catch (e) {
  console.error(`Failed to read plugin.json: ${e.message}`);
  process.exit(1);
}

const errors = [];

if (typeof plugin.name !== 'string' || !plugin.name) {
  errors.push('name must be a non-empty string');
}
if (typeof plugin.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(plugin.version)) {
  errors.push('version must be semver (e.g. 1.0.0)');
}
if (typeof plugin.description !== 'string' || !plugin.description) {
  errors.push('description must be a non-empty string');
}
if (!plugin.author || typeof plugin.author.name !== 'string' || !plugin.author.name) {
  errors.push('author.name must be a non-empty string');
}

if (errors.length > 0) {
  console.error('plugin.json validation failed:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`plugin.json OK: ${plugin.name} v${plugin.version}`);
