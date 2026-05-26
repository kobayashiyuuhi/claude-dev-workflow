#!/usr/bin/env bash
set -euo pipefail

node -e "
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'settings.json');

let settings = {};
if (fs.existsSync(settingsPath)) {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

settings.extraKnownMarketplaces = settings.extraKnownMarketplaces || {};
settings.extraKnownMarketplaces['dev-workflow'] = {
  source: { source: 'github', repo: 'kobayashiyuuhi/claude-dev-workflow' }
};

settings.enabledPlugins = settings.enabledPlugins || {};
settings.enabledPlugins['dev-workflow@dev-workflow'] = true;

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('Done! Restart Claude Code to activate the plugin.');
"
