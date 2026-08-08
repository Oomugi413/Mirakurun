# 依存パッケージ / 更新メモ

このドキュメントは、依存パッケージの更新時に踏んだ破壊的変更と、`package.json` の `overrides` を外してはいけない理由をまとめたものです。同じ調査を繰り返さないための備忘録です。

## 目次

- [overrides の意図](#overrides-の意図)
- [更新時に対応した破壊的変更](#更新時に対応した破壊的変更)
- [意図的に更新していないもの](#意図的に更新していないもの)
- [更新後の検証手順](#更新後の検証手順)

## overrides の意図

`package.json` の `overrides` は 4 つとも意図があります。**動作確認せずに外さないでください。**

### `express-openapi > glob: ^7.0.0`

⚠️ **これを外すと Windows で API ルートが一切登録されなくなります。**

`express-openapi` → `openapi-framework` → `fs-routes` は、glob の結果をそのまま URL パスに使います。

```js
// node_modules/fs-routes/dist/index.js
glob.sync(options.glob, { cwd: dir })
    .map(file => ({ path: path.resolve(dir, file), route: '/' + file.replace(...) }))
```

そのルート文字列を `express-openapi` が `/` で分割し、`{param}` → `:param` に変換して Express に登録します。

```js
// node_modules/express-openapi/dist/index.js
ctx.path.substring(1).split('/').map(toExpressParams).join('/')
```

glob は **v9 以降、Windows でパス区切りが `\` になりました**（`/` で返すには `posix: true` が必要）。`fs-routes` はこのオプションを渡さないため、Windows では `channels\{type}.js` のような文字列になり `split('/')` が機能しません。glob v7 は常に `/` 区切りで返すため、v7 に固定してあります。

`fs-routes` 側にオプションが無いので、設定では回避できません。glob を上げるなら `patch-package` で `fs-routes` に `posix: true` を渡すパッチを当てる必要があります。

なお `fs-routes` の glob 依存宣言は `"*"` です。固定を外すと、たまたま同居している他パッケージの glob@7 と重複排除されて動いているように見えることがありますが、それに依存してはいけません（tslint を削除すると glob@13 に解決されて壊れます）。

### `brace-expansion: ^5.0.8`

DoS 脆弱性 [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) の対応です。パッチは **5.0.8 のみ**で、1.x / 2.x / 4.x への backport がありません。そのため全体を 5.0.8 に寄せています。

⚠️ **既知の副作用**: `brace-expansion` v5 は名前付きエクスポートに変わったため、`brace-expansion@^1` 前提の `minimatch@3`（tslint と express-openapi の glob@7 が依存）と非互換です。`{}` を含む glob パターンを渡すと `TypeError: expand is not a function` で落ちます。

現状問題になっていないのは、`minimatch` が波括弧を含まないパターンでは展開処理をスキップするためです。実際に使われるパターンは `**/*.js` などで波括弧を含みません（`src/Mirakurun/api/` 配下の `{type}.js` 等はファイル名側なので影響しません）。潜在的な地雷ではあるので、glob パターンを追加する際は注意してください。

### `@redocly/openapi-core > js-yaml: ^4.3.0`

`redoc` が依存する `@redocly/openapi-core` の js-yaml に脆弱性 [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m)（YAML merge key による CPU の二次爆発）があるための対応です。トップレベルの js-yaml は 5.x なので、redoc 配下だけをスコープ指定して 4.3.0 以上に上げています。

### `uuid: ^11.1.1`

既存の固定です。

## 更新時に対応した破壊的変更

### eventemitter3 v4 → v5

`import EventEmitter = require("eventemitter3")` 形式が使えなくなったため、名前付き import に変更しました。

```ts
import { EventEmitter } from "eventemitter3";
```

### ip-num v1.3 → v1.6

- サブパス import (`ip-num/Validator` 等) が廃止されたため `from "ip-num"` に統合。
- `IPv4Prefix` / `IPv6Prefix` のコンストラクタ引数が `bigint` になったため `new IPv4Prefix(32n)` に変更。

### Express v4 → v5

- **`req.query` が null プロトタイプのオブジェクトになりました。** `sift` はコンストラクタを参照するため `TypeError` で 500 を返します。`sift({ ...req.query })` のように展開して渡してください（`src/Mirakurun/api/channels.ts` 他）。
- `req.params` の型が `string | string[]` になったため、`as string` のキャストが必要な箇所があります。
- `{type}` → `:type` の変換は `express-openapi` が行うため、path-to-regexp v8 の波括弧構文とは衝突しません。

### React v18 → v19

- **グローバルの `JSX` 名前空間が廃止**されました。`JSX.Element` → `React.JSX.Element` に置換。
- `useRef<T>()` の初期値が必須になりました（`useRef<T>(null)`）。
- ルートの生成は `react-dom/client` の `createRoot` を使用（v18 の時点で対応済み）。

### React Router v7 → v8

`react-router-dom` は v7 時点で `export * from "react-router"` だけの薄い再エクスポートになっており、**v8 では発行されていません**。依存を `react-router` に変更し、import 元を差し替えています。

```ts
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router";
```

### Blueprint v5 → v6

⚠️ **CSS クラスの接頭辞が `bp5-` → `bp6-` に変わりました。** 型チェックでは検出できず、ビルドは通るのにスタイルだけ壊れます。`src/ui/**/*.sass` と、`Classes` を使わず文字列でクラス名を指定している箇所（`document.body.classList.toggle("bp6-dark", dark)` 等）を一括で置換しています。

### TypeScript v5 → v6

- **`rootDir` の明示が必須**になりました（`TS5011`）。未設定のまま `tsc` を実行すると `lib/src/` に二重出力される副作用もあります。
- **`strict` が既定で有効**になりました。既存コードで 378 件のエラーが出るため、`tsconfig.json` と `src/ui/tsconfig.json` の両方で `"strict": false` を明示しています。将来的に段階導入する余地はあります。
- `esModuleInterop: false` が非推奨になりました（TS 7 で機能停止）。UI 側の指定を削除しています。`allowSyntheticDefaultImports: true` があるため import の書き方は変更不要でした。
- 新チェック `TS2882` により、副作用 import に型宣言が必要になりました。`src/ui/custom.d.ts` に `*.sass` / `*.scss` / `*.css` の宣言を追加しています。

### dotenv v8 → v17

起動時にバナーを出力するようになったため、`require("dotenv").config({ quiet: true })` を指定しています。

## 意図的に更新していないもの

| パッケージ | 現状 | 理由 |
| --- | --- | --- |
| typescript | 6.x | **7.0 は tslint と非互換。** Go 実装への移行で Compiler API が変わり、`tslint --project` が `TypeError: Cannot read properties of undefined (reading 'readFile')` で起動しません。上げるには ESLint (typescript-eslint) への移行が前提です |
| tslint | 6.1.3 | 非推奨パッケージですが、`latest` タグは現行より古い 5.20.1 を指しているため据え置き。ESLint への移行が本筋です |
| glob (express-openapi 配下) | 7.x | [上記の Windows パス問題](#express-openapi--glob-700)。セキュリティ上の動機も `brace-expansion` の override で解消済み |
| @types/node | 24.x | `engines.node` に合わせています。26 系は Node 26 向け |
| express-openapi | 12.1.3 | 上流が更新停止。`fs-routes` / `openapi-framework` も同様 |

### tslint → ESLint 移行の位置づけ

以下がまとめて解決するため、着手する価値があります。

- TypeScript 7 への更新がブロック解除される
- glob@7 / minimatch@3 が 1 系統減り、`brace-expansion` v5 との非互換リスクが下がる
- 非推奨パッケージの解消

ただし `express-openapi` 配下の glob@7 固定は移行後も**必須のまま**です（むしろ重複排除が外れるため、より重要になります）。

## 更新後の検証手順

型チェックだけでは Blueprint のクラス名変更のような問題を検出できないため、実行時の確認まで行ってください。

```sh
npm install
npm audit          # high が 0 件であること
npm run build      # tslint + tsc + webpack
npm test
```

さらに、サーバーを起動して主要なエンドポイントに疎通確認を行います。パラメータ付きのネストしたルートは、`express-openapi` のパス変換が壊れていないかの確認になります。

```sh
npm start
# 別のシェルで
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:40772/api/version
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:40772/api/channels
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:40772/api/channels/GR
curl -s http://127.0.0.1:40772/api/channels/GR/16
```

チャンネル未設定の環境では 404 が返りますが、**ボディが JSON (`{"code":404,...}`) ならルートは正しく登録されています**。Express の HTML エラーページ (`Cannot GET ...`) が返る場合はルート登録に失敗しています。

UI は型チェックとビルドだけでは表示崩れを検出できないため、ブラウザでの目視確認を行ってください。
