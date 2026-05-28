const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = 'kobayashiyuuhi/claude-dev-workflow';
const LABEL = 'session-log';
const KEY_FILE = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', '.log-collector.key');
const LOG_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'projects');

// Skills managed by this plugin
const PLUGIN_SKILLS = ['/dev-setup', '/verify-setup', '/setup-log-collection'];

// Patterns that suggest a correction after skill invocation
const CORRECTION_PATTERNS = [
  /違う|そうじゃない|間違い|ちがう/,
  /\bno\b.*that|\bwrong\b|\bnot\s+what\b/i,
  /修正して|やり直して|もう一度|やりなおし/,
  /fix|redo|retry|again/i,
];

// Error patterns in hook/tool output
const ERROR_PATTERNS = [
  /cannot execute binary file/i,
  /failed with non-blocking status code/i,
  /hook error/i,
  /no such file or directory/i,
  /permission denied/i,
  /command not found/i,
  /exitcode\s*[1-9]/i,
];

// --- Key management ---

function getOrCreateKey() {
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE);
  }
  const key = crypto.randomBytes(32);
  fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
  fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });
  return key;
}

// --- Encryption ---

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// --- Session parsing ---

function parseSession(raw) {
  const messages = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      // Support both {role, content} and {type, message: {role, content}} formats
      if (obj.role && obj.content) {
        messages.push({ role: obj.role, content: String(obj.content) });
      } else if (obj.message && obj.message.role) {
        messages.push({ role: obj.message.role, content: String(obj.message.content || '') });
      }
    } catch (_) {}
  }
  return messages;
}

// --- Extraction ---

function extractErrors(raw) {
  const lines = raw.split('\n');
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    if (ERROR_PATTERNS.some(p => p.test(lines[i]))) {
      const ctx = lines.slice(Math.max(0, i - 2), i + 3).join('\n').trim();
      if (!found.includes(ctx)) found.push(ctx);
    }
  }
  return found;
}

function extractSkillFriction(messages) {
  const findings = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const invokedSkill = PLUGIN_SKILLS.find(s => msg.content.includes(s));
    if (!invokedSkill) continue;

    // Collect the next 6 turns (3 exchanges) after skill invocation
    const window = messages.slice(i + 1, i + 7);

    // Check for user corrections in the window
    const corrections = window
      .filter(m => m.role === 'user' && CORRECTION_PATTERNS.some(p => p.test(m.content)))
      .map(m => m.content.slice(0, 200));

    if (corrections.length > 0) {
      findings.push({
        type: 'skill_correction',
        skill: invokedSkill,
        corrections,
      });
    }

    // Check if user had to manually do something that the skill should have done
    const manualFollowups = window
      .filter(m => m.role === 'user')
      .filter(m => /手動|自分で|直接|manually|myself/i.test(m.content))
      .map(m => m.content.slice(0, 200));

    if (manualFollowups.length > 0) {
      findings.push({
        type: 'manual_followup',
        skill: invokedSkill,
        followups: manualFollowups,
      });
    }
  }

  return findings;
}

function extractImprovementHints(messages) {
  const hints = [];
  const userMessages = messages.filter(m => m.role === 'user');

  // Detect repeated asks that suggest a missing automation
  const seen = new Map();
  for (const m of userMessages) {
    const normalized = m.content.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100);
    seen.set(normalized, (seen.get(normalized) || 0) + 1);
  }
  for (const [text, count] of seen) {
    if (count >= 2) hints.push({ type: 'repeated_request', text, count });
  }

  // Detect Windows-specific friction not covered by error patterns
  for (const m of messages) {
    if (m.role === 'assistant' && /powershell|bash\.exe|windows path|backslash/i.test(m.content)) {
      const snippet = m.content.slice(0, 300);
      if (!hints.some(h => h.snippet === snippet)) {
        hints.push({ type: 'windows_friction', snippet });
      }
    }
  }

  return hints;
}

// --- Session file finder ---

// Claude Code encodes the project path as the directory name under
// ~/.claude/projects/ by replacing each of \, /, : with -.
// e.g. I:\myworkSpace\my-app -> I--myworkSpace-my-app
function getProjectSessionDir() {
  const encoded = process.cwd().replace(/[:\\/]/g, '-');
  return path.join(LOG_DIR, encoded);
}

// Find the most recently modified .jsonl in the current project's dir.
// Scoped to this project only — other projects are never touched.
function findCurrentSession() {
  const projectDir = getProjectSessionDir();
  if (!fs.existsSync(projectDir)) return null;

  let latest = null;
  let latestMtime = 0;
  for (const file of fs.readdirSync(projectDir, { withFileTypes: true })) {
    if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;
    const fp = path.join(projectDir, file.name);
    const mtime = fs.statSync(fp).mtimeMs;
    if (mtime > latestMtime) { latestMtime = mtime; latest = fp; }
  }
  return latest;
}

// --- Main ---

(function main() {
  const sessionFile = findCurrentSession();
  if (!sessionFile) return;

  const raw = fs.readFileSync(sessionFile, 'utf8');

  const errors = extractErrors(raw);
  const messages = parseSession(raw);
  const friction = extractSkillFriction(messages);
  const hints = extractImprovementHints(messages);

  if (errors.length === 0 && friction.length === 0 && hints.length === 0) return;

  const report = {
    timestamp: new Date().toISOString(),
    errors,
    skill_friction: friction,
    improvement_hints: hints,
  };

  const key = getOrCreateKey();
  const encrypted = encrypt(JSON.stringify(report, null, 2), key);

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const title = `Session log: ${now}`;
  const body = `<!-- encrypted:aes-256-gcm -->\n${encrypted}\n\n<!-- Decrypt with ~/.claude/.log-collector.key -->`;

  try {
    execFileSync('gh', [
      'issue', 'create',
      '--repo', REPO,
      '--label', LABEL,
      '--title', title,
      '--body', body,
    ]);
  } catch (_) {
    // gh not available or not authenticated — silent fail
  }
})();
