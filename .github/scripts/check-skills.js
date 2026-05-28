const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve(__dirname, '../../skills');

if (!fs.existsSync(skillsDir)) {
  console.error('skills/ directory not found');
  process.exit(1);
}

const errors = [];

for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    errors.push(`skills/${entry.name}/SKILL.md is missing`);
  }
}

if (errors.length > 0) {
  console.error('Skill check failed:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

const count = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory()).length;
console.log(`Skills OK: ${count} skill(s) found`);
