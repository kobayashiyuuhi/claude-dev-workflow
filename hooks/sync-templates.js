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

// Sync templates to .claude/skills/dev-setup/templates/ in the current project
const srcTemplates = path.join(pluginRoot, 'skills', 'dev-setup', 'templates');
const destTemplates = path.join(process.cwd(), '.claude', 'skills', 'dev-setup', 'templates');
copyDir(srcTemplates, destTemplates);

// Sync rules/03-development.md to ~/.claude/rules/ (always overwrite to propagate updates)
const srcRule = path.join(pluginRoot, 'rules', 'development.md');
const destRules = path.join(homeDir, '.claude', 'rules');
const destRule = path.join(destRules, '03-development.md');
if (fs.existsSync(srcRule)) {
    fs.mkdirSync(destRules, { recursive: true });
    fs.copyFileSync(srcRule, destRule);
}

// Add @rules/03-development.md to ~/.claude/CLAUDE.md if not present
const claudeMdPath = path.join(homeDir, '.claude', 'CLAUDE.md');
const ruleRef = '@rules/03-development.md';
let claudeMd = fs.existsSync(claudeMdPath) ? fs.readFileSync(claudeMdPath, 'utf8') : '';
if (!claudeMd.includes(ruleRef)) {
    claudeMd = claudeMd.trimEnd() + '\n' + ruleRef + '\n';
    fs.writeFileSync(claudeMdPath, claudeMd);
}