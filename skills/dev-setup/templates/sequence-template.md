# シーケンス図: {機能名}

```mermaid
sequenceDiagram
    actor User
    User->>UI: アクション
    UI->>API: リクエスト
    API->>DB: クエリ
    DB-->>API: 結果
    API-->>UI: レスポンス
    UI-->>User: 表示
```
