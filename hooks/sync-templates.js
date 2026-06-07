const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const homeDir = process.env.HOME || process.env.USERPROFILE || '';

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Sync templates to ~/.claude/skills/dev-setup/templates/
const srcTemplates = path.join(pluginRoot, 'skills', 'dev-setup', 'templates');
const destTemplates = path.join(homeDir, '.claude', 'skills', 'dev-setup', 'templates');
copyDir(srcTemplates, destTemplates);

// Sync rules to ~/.claude/skills/dev-setup/rules/
const srcRules = path.join(pluginRoot, 'rules');
const destRulesCache = path.join(homeDir, '.claude', 'skills', 'dev-setup', 'rules');
copyDir(srcRules, destRulesCache);
