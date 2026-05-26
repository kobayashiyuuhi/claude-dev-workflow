---
name: verify-setup
description: >
  プロジェクト検証機構セットアップスキル。技術スタックを自動検出して Stop フックに適切な検証コマンド（test / lint / typecheck）を設定する。
  /verify-setup と呼び出されたとき、または「検証フック」「テストフック」「Stop フック設定」と言われたときに使う。
---

プロジェクトの技術スタックを検出して、Stop フックに適切な検証コマンド（test / lint / typecheck）を設定するスキル。

## 用途・仕組み

`/dev-setup` の後、または既存プロジェクトに後付けで検証機構を追加する。

```
Claudeがタスク完了で停止しようとする
    ↓
[Stop hook] 検証コマンドを実行（プロジェクトに合わせたコマンド）
    ├── 失敗 (exit ≠ 0) → 失敗内容がClaudeにフィードバック → 自動修正ループ
    └── 成功 (exit 0)  → Claudeが通常停止
```

## 手順

### Step 1: プロジェクト種別検出

カレントディレクトリのマーカーファイルから検出する：

| マーカーファイル | 種別 |
|---------|------|
| `package.json` | Node.js (TypeScript / JavaScript) |
| `pyproject.toml` / `requirements.txt` / `setup.py` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pom.xml` / `build.gradle` | Java / Kotlin |
| `Gemfile` | Ruby |
| `composer.json` | PHP |
| `Packages/manifest.json` + `Assets/` | Unity |
| `mix.exs` | Elixir |

**フロントエンド・UIフレームワークの追加検出**（package.json の `dependencies` を確認）：

| 依存パッケージ | フレームワーク種別 |
|------------|----------------|
| `next` | Next.js (SSR/SSG) |
| `nuxt` | Nuxt.js |
| `react` (Next.js なし) | React SPA |
| `vue` | Vue.js |
| `svelte` / `@sveltejs/kit` | SvelteKit |
| `astro` | Astro |
| `vite` | Vite ベース |
| `expo` / `react-native` | React Native (モバイル) |
| `electron` | Electron デスクトップ |

**E2Eテストツールの検出**：

| 依存 | ツール |
|------|------|
| `@playwright/test` | Playwright |
| `cypress` | Cypress |
| `puppeteer` | Puppeteer |
| `@testing-library/*` | Testing Library |

複数のマーカーがある場合は主要なものを優先（モノレポはユーザーに確認）。
`document/tech-stack.md` があれば追加情報として参照。

### Step 2: 検証コマンド提案

検出した種別に基づき推奨コマンドを提示する。

**Node.js:**
- パッケージマネージャ判定: `pnpm-lock.yaml` → pnpm / `yarn.lock` → yarn / 既定 npm
- `package.json` の `scripts` を読み、存在するスクリプトのみ採用
- 推奨: `<pm> run typecheck && <pm> run lint && <pm> test`（TypeScript時はtypecheck含む）

**Python:**
- 推奨: `pytest && ruff check . && mypy .`（型注釈時）
- 簡易版: `pytest`

**Rust:**
- 推奨: `cargo fmt --check && cargo clippy -- -D warnings && cargo test`

**Go:**
- 推奨: `go vet ./... && go test ./...`

**Unity:**
- 推奨: Unity CLI test runner（`Unity.exe -batchmode -runTests -projectPath . -testResults results.xml`）

**Java (Maven):**
- 推奨: `mvn test`

**Java (Gradle):**
- 推奨: `gradle test`

**Next.js / Nuxt / SvelteKit など SSR/SSG フレームワーク:**
- 推奨: `<pm> run typecheck && <pm> run lint && <pm> run build && <pm> test`
- `build` を入れることでルーティング・コンパイル時エラーを検出
- E2E がある場合は `<pm> run test:e2e`（Playwright headless 等）も追加

**React SPA / Vue SPA / Vite:**
- 推奨: `<pm> run typecheck && <pm> run lint && <pm> run build`
- Storybook がある場合: `<pm> run build-storybook` も追加

ユーザーに「このコマンドで設定してよいか」確認する。カスタムコマンド指定も受け付ける。

### Step 2.5: フックだけで検証しきれない領域の対策

以下のケースは Stop hook の単純な exit code 検証だけでは不十分：

- **UI の見た目** — レンダリング結果・崩れ・配置
- **インタラクションフロー** — ボタン押下後の遷移、状態遷移
- **CSS / レスポンシブ** — ブレークポイント・メディアクエリ
- **アニメーション・タイミング**
- **ブラウザ固有の挙動** — Chrome / Safari / Firefox 差分
- **外部API連携** — モックでは追えない実環境動作

これらに対して、以下の **多層検証戦略** から適切なものをユーザーに提案する：

#### 対策A: Playwright headless E2E（推奨・自動化可能）

`@playwright/test` を導入し、主要フローを E2E テスト化。Stop hook で実行可能：

```bash
<pm> run test:e2e
```

#### 対策B: Agent hook で LLM 検証

`type: "agent"` の hook を使い、Haiku 等のサブエージェントに UI 確認を委ねる：

```json
{
  "type": "agent",
  "prompt": "プロジェクトのdev serverを起動し、Playwright MCPで主要ページを開いてスクリーンショットを取得。UIの崩れ・コンソールエラーがないか確認し、問題があれば exit 1 相当のエラーを返す。",
  "timeout": 600
}
```

#### 対策C: CLAUDE.md に手動検証チェックリストを記載

#### 対策D: ユーザー確認待ち（高リスク領域用）

```bash
echo '{"continue": false, "stopReason": "UI変更の最終確認をお願いします（dev server 起動済み）"}'
```

#### 提案ロジック

| 検出状況 | 推奨対策 |
|---------|---------|
| Playwright/Cypress 既導入 | A（既存テスト活用） |
| フロントだがE2Eなし・予算あり | A（Playwright導入提案） + C |
| フロントだがE2Eなし・予算なし | C（CLAUDE.mdチェックリスト） |
| 高リスク領域（決済・認証等） | B または D を追加 |
| バックエンドのみ | 対策不要（Step 2 のhookで十分） |

ユーザーに対策の組み合わせを確認する（複数選択可）。

### Step 3: 既存 .claude/settings.json 確認

プロジェクトルートの `.claude/settings.json` を読み込む。

- ファイルが無い → 新規作成
- ファイルがあるが `hooks.Stop` が無い → Stop セクション追加
- ファイルがあり `hooks.Stop` がある → 既存配列に追記（重複検出時はユーザーに確認）

### Step 4: 検証層の書き込み

#### 4-A: command hook

`.claude/settings.json` に追加（既存設定とマージ）：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "<検証コマンド>",
            "shell": "bash",
            "timeout": 300,
            "statusMessage": "🧪 検証実行中..."
          }
        ]
      }
    ]
  }
}
```

### Step 5: .gitignore 確認

`.gitignore` に `.claude/settings.local.json` が無ければ追加。

### Step 6: 動作確認案内

設定反映: `/hooks` コマンドを開くか Claude Code を再起動
