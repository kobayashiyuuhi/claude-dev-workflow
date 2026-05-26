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
const srcTemplates = path.join(pluginRoot, 'templates');
const destTemplates = path.join(homeDir, '.claude', 'skills', 'dev-setup', 'templates');
copyDir(srcTemplates, destTemplates);

// Sync rules/03-development.md to ~/.claude/rules/
const srcRule = path.join(pluginRoot, 'rules', '03-development.md');
const destRules = path.join(homeDir, '.claude', 'rules');
const destRule = path.join(destRules, '03-development.md');
if (fs.existsSync(srcRule) && !fs.existsSync(destRule)) {
  fs.mkdirSync(destRules, { recursive: true });
  fs.copyFileSync(srcRule, destRule);
}
