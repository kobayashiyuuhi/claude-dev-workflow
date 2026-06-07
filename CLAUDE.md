# dev-workflow プラグイン 開発ルール

## ブランチ戦略

```
main      ← リリースのみ（直接コミット禁止）
develop   ← 統合ブランチ
  └── feature/*  ← 機能開発
  └── fix/*      ← バグ修正
```

- **main への直接コミット・プッシュ禁止** — develop からのマージのみ
- **作業は必ず develop から feature/* または fix/* を切って行う**
- PR は develop に向けて作成する
- develop → main のマージ時にバージョンバンプ + タグを打つ

## バージョン管理

- `.claude-plugin/plugin.json` の `version` を更新してからリリース
- main へのマージ = リリース = `chore(release): vX.Y.Z` コミット + タグ + GitHub Release 作成
- GitHub Release は必ず作成する: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..." --latest`

## plugin.json コンフリクト防止

main に直接コミットすると plugin.json でコンフリクトが発生しやすい。
必ず develop 経由でマージすること。
