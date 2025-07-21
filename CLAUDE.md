# Node-RED 専用 TPLINK TAPO PluginのAPI移植処理

## プロジェクトの概要

本プロジェクトは、Node-REDのTP-LinkのTapoデバイスを操作するためのカスタムノードである。

## Claude Codeによる移植プロジェクト

本プロジェクトのカスタムノードが利用するAPIは、新プロトコルであるKLAPに対応していないため、旧APIの「src/nodes/tplink_tapo_connect_wrapper/」のプロジェクトを、新API「src/nodes/tplink-tapo-connect/」のプロジェクトに移植を目的とする。

## 開発コマンド

### ビルド・テスト関連

- `npm run build` - TypeScriptをコンパイルし、dist/にファイルをコピーしてNode-REDにインストール
- `npm run test` - Mochaテストを実行
- `npm run tsc` - TypeScriptコンパイルのみ
- `npm run clean` - distディレクトリをクリーンアップ

### 開発・実行関連

- `npm run start` - Node-REDを起動 (http://localhost:1880)
- `npm run start:debug` - デバッグモードでNode-REDを起動

### コピー関連（build時に自動実行）

- `npm run copy` - すべてのアセットをコピー
- `npm run copy:html` - HTMLファイルをコピー
- `npm run copy:icons` - アイコンファイルをコピー
- `npm run copy:locales` - 多言語ファイルをコピー

## アーキテクチャ

### API移植の構造

- **旧API**: `src/nodes/tplink_tapo_connect_wrapper/` - 既存のAPI実装
- **新API**: `src/nodes/tplink-tapo-connect/` - KLAP対応の新API実装
- **ラッパー**: Node-REDノード側の変更を最小限に抑えるため、ラッパー関数を経由して実行

### Node-REDノード構成

プロジェクトは以下のNode-REDカスタムノードを提供：

- `tplink_toggle` - デバイスの電源ON/OFF切り替え
- `tplink_turn_on` - デバイス電源ON
- `tplink_turn_off` - デバイス電源OFF
- `tplink_brightness` - スマート電球の明度設定
- `tplink_colour` - スマート電球の色設定
- `tplink_command` - 汎用コマンド実行
- `tplink_custom_request` - カスタムリクエスト送信
- `tplink_status` - デバイス状態取得

### 対応デバイス

- **スマートプラグ**: P100, P105, P110, P115
- **スマート電球**: L510E, L530E
- **スマートストリップ**: L900-10

### ディレクトリ構造
```

src/nodes/
├── tplink-tapo-connect/          # 新API (KLAP対応)
│   ├── core/                     # 認証・暗号化・HTTP通信
│   ├── devices/                  # デバイス別実装
│   ├── types/                    # 型定義
│   ├── utils/                    # ユーティリティ
│   └── wrapper/                  # ラッパー実装
├── tplink_tapo_connect_wrapper/  # 旧API
└── *.ts/*.html                   # Node-REDノード実装
```

## 重要な実装ポイント

### ラッパーパターン

新旧API間のインターフェース統一のため、ラッパークラスを使用：

- `tplink_tapo_connect_wrapper.ts` (旧) → `tplink-tapo-connect-wrapper.ts` (新)
- Node-REDノード側のコード変更を最小限に抑制

### エネルギー使用量対応デバイス

P110, P115, KP125M等の特定モデルでエネルギー使用量取得が可能

### 認証方式

新APIではKLAP (Kasa Link Authentication Protocol) に対応

## 開発時の注意点

### TypeScript設定

- Node.js 18以上が必要
- TypeScriptコンパイルは`npm run tsc`または`npm run build`で実行

### テスト

- Mochaを使用
- テストファイルは`src/nodes/test/*_spec.js`に配置

### 多言語対応

- 英語 (`en-US`) と日本語 (`ja`) に対応
- ローカライゼーションファイルは`src/nodes/locales/`に配置
