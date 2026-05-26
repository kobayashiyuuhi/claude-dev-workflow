# プロジェクト検証機構セットアップスキル

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

- 利点: フックで完結・スクリーンショット保存可
- 欠点: テスト作成コストが高い・UI変更で壊れやすい
- 設定: `playwright.config.ts` に `headless: true`、`webServer` でdev起動を自動化

#### 対策B: Agent hook で LLM 検証

`type: "agent"` の hook を使い、Haiku 等のサブエージェントに UI 確認を委ねる：

```json
{
  "type": "agent",
  "prompt": "プロジェクトのdev serverを起動し、Playwright MCPで主要ページを開いてスクリーンショットを取得。UIの崩れ・コンソールエラーがないか確認し、問題があれば exit 1 相当のエラーを返す。",
  "timeout": 600
}
```

- 利点: 視覚的判断ができる・柔軟
- 欠点: トークンコスト・実行時間長い・ Playwright MCP 等の事前設定要

#### 対策C: CLAUDE.md に手動検証チェックリストを記載

フック自動化が困難・コストに合わない場合、Claude 自身に「停止前に確認すべき項目」を CLAUDE.md で指示：

```markdown
## 検証チェックリスト（Claude が停止前に必ず確認）

UI変更を伴うタスクでは、以下を確認してから停止すること：
- [ ] dev server を起動し、変更箇所のページが表示されること
- [ ] ブラウザコンソールにエラーが無いこと
- [ ] 主要ブレークポイント（375px / 768px / 1280px）で崩れが無いこと
- [ ] 該当機能のユーザーフローが動作すること

手動で確認できない場合はその旨を明記し、ユーザーに最終チェックを依頼する。
```

- 利点: ゼロコスト・ Claude が能動的に確認
- 欠点: フックほど強制力なし（Claude の遵守に依存）

#### 対策D: ユーザー確認待ち（Notification 経由）

危険な変更や不可逆操作を含む場合、Stop hook で必ずユーザーに最終確認を求める：

```bash
echo '{"continue": false, "stopReason": "UI変更の最終確認をお願いします（dev server 起動済み）"}'
```

- 利点: 重大ミス防止
- 欠点: 自動化が止まる

#### 提案ロジック

検出結果に応じて推奨対策を提示：

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

選択された対策に応じて、以下を書き込む。

#### 4-A: command hook（基本検証 + Playwright E2E）

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

タイムアウトはテスト規模に応じて調整（デフォルト300秒、長いテストは600秒等）。

#### 4-B: agent hook（LLM検証）

`.claude/settings.json` の Stop 配列に追加：

```json
{
  "hooks": [
    {
      "type": "agent",
      "prompt": "プロジェクトのUI検証を行う。dev serverが起動していなければ起動し、Playwright MCP（または手動でcurl）で主要ルートをチェック。HTTPステータス・コンソールエラー・基本的な要素表示を確認。問題があれば具体的に報告して exit 1 相当のフィードバックを返す。",
      "timeout": 600,
      "model": "claude-haiku-4-5-20251001",
      "statusMessage": "🤖 UI検証中（agent）..."
    }
  ]
}
```

注意: Playwright MCPサーバーが事前に設定されている必要がある場合あり。

#### 4-C: CLAUDE.md にチェックリスト追記

プロジェクトルートの `CLAUDE.md` に以下セクションを追加（既存内容を保持してマージ）：

```markdown
## 検証チェックリスト（停止前必須）

UI変更を伴うタスクでは、停止前に必ず以下を確認すること：

- [ ] dev server を起動し、変更箇所のページが正常表示されること
- [ ] ブラウザコンソールにエラーが無いこと
- [ ] 主要ブレークポイント（375px / 768px / 1280px）で崩れが無いこと
- [ ] 該当機能のユーザーフローが動作すること
- [ ] type-check / lint / build が通ること

手動確認できない項目があれば停止せず、その旨をユーザーに報告して指示を仰ぐ。
```

#### 4-D: ユーザー確認待ち（高リスク領域用）

`.claude/settings.json` の Stop 配列に追加（特定条件のみ）：

```json
{
  "hooks": [
    {
      "type": "command",
      "command": "echo '{\"continue\": false, \"stopReason\": \"⚠️ UI/重大変更の最終確認をお願いします。dev server 起動済み・該当ページで動作確認後に承認してください。\"}'",
      "shell": "bash"
    }
  ]
}
```

これは Stop を一旦ブロックしてユーザーに確認を促す。常用は非推奨、認証・決済等のクリティカル領域のみ推奨。

### Step 5: .gitignore 確認

- `.claude/settings.json` → コミット対象（チーム共有）
- `.claude/settings.local.json` → `.gitignore` に追加推奨（個人設定上書き用）

`.gitignore` に `.claude/settings.local.json` が無ければ追加。

### Step 6: 動作確認案内

設定した対策の組み合わせをユーザーに報告：

```
✅ 検証機構セットアップ完了

設定された検証層:
- [対策A] command hook: <検証コマンド>
- [対策B] agent hook: UI検証エージェント有効
- [対策C] CLAUDE.md チェックリスト追記
- [対策D] ユーザー確認待ち（高リスク領域用）

仕組み:
- Claudeが停止しようとすると上記層が順次実行される
- 失敗時: Claudeが失敗内容を見て自動修正ループ
- 成功時: 通常通り停止（または対策Dなら最終確認待ち）

設定反映: /hooks コマンドを開くか Claude Code を再起動

編集箇所:
- 検証コマンド: .claude/settings.json
- チェックリスト: CLAUDE.md
- タイムアウト: settings.json の "timeout" フィールド（秒）
```

## 注意事項

### 全般
- **無限ループ対策**: 修正不可能なバグでループが続く場合に備え、タイムアウトは必須。
- **既存hookとの共存**: 通知系hookなど既存Stop hookは保持してマージする。
- **検証コマンドが無いプロジェクト**: テストが未整備のフェーズではこのスキルを呼ばない選択も可。

### command hook（対策A）
- **ネットワーク依存テスト**: Claude Code 終了時にハングする可能性あり。スタブ・モック推奨。
- **dev server 起動依存テスト**: Playwright の `webServer` 設定で自動起動・停止させる。

### agent hook（対策B）
- **トークンコスト**: Stop毎に呼ぶと累積する。実装フェーズ後半・PR前のみ有効化等の運用推奨。
- **MCP事前設定**: Playwright MCP / Browser MCP 等の事前セットアップが必要。
- **モデル選択**: Haiku（速い・安い）で十分なケースが多い。複雑判定が必要なら Sonnet。

### CLAUDE.md（対策C）
- **強制力なし**: Claude が遵守するかはプロンプト依存。重要案件には対策A/Bと併用推奨。
- **メンテナンス**: チェック項目は陳腐化するので定期的に見直し。

### ユーザー確認待ち（対策D）
- **常用非推奨**: 自動化の意味を失う。クリティカル領域のみ。
- **通常の Stop と分離**: 全タスクではなく特定条件（feature/auth ブランチ等）のみ発火させる工夫が必要。

### フロント特有の罠
- **CSSの視覚崩れ**: type-check / lint では検出不可。スクリーンショット比較（Percy / Chromatic）または対策Bが必要。
- **アニメーション・タイミング**: E2Eでも flaky になりやすい。固定 timeout より状態待ちで対処。
- **ブラウザ差分**: Playwright で複数ブラウザ並列実行可（headless時）。
