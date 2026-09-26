# Mirakurun 例外・再起動カウンター調査

調査日: 2026-07-18
Codex Session ID: 019f72fc-60ef-7721-bb23-f2228dc4daae

## 結論

主要な異常は、BS4K 用 `mmtsDecoder` の終了処理にある競合条件である。
`TunerDevice._kill()` または `_release()` が
`this._mmtsDecoderProcess` を `null` にした後、同じ子プロセスの `exit`
イベントが発火すると、終了ハンドラーが可変フィールドを再参照して例外になる。

```text
TypeError: Cannot read properties of null (reading 'stdin')
    at .../src/Mirakurun/TunerDevice.ts:319:46
```

これは BS4K ストリームを閉じるたびに発生し得る Mirakurun の不具合である。
調査のきっかけになった CS 録画開始失敗とは経路が異なり、同件の原因ではない。

追加点検では、次の2項目も確認した。

1. `TSDecoder` の無応答処理が同じ障害を二重に処理し、再起動とフォールバックが
   重複する。
2. チューナー用の外部コマンドが `exit code=1` で終了し、利用者が残ったまま
   Mirakurun が50回再起動している。再起動処理自体は意図された回復動作だが、
   外部コマンド終了の原因は別途調査が必要である。

## 調査時の状態

2026-07-18 11:17 頃の `/api/status` は次のとおりだった。

```text
uncaughtException=908
unhandledRejection=0
bufferOverflow=0
tunerDeviceRespawn=50
decoderRespawn=2
```

最初に別調査で確認した `uncaughtException=893` から、点検中にも15回増加した。
同時刻には BS4K の EPG 取得が継続しており、例外が現在も再発している。

保持されている `mirakurun.stderr*.log` を改行とキャリッジリターンの両方で
分割して調べると、例外の種類は次の1種類だけだった。

```text
TypeError: Cannot read properties of null (reading 'stdin')
```

保持ログ全体には同じスタックが1500件以上ある。ただし stderr のローテーション
ファイルには現在の Node.js プロセスより前の内容も含まれるため、現在の累積値
`908` と単純比較はできない。

## 1. `mmtsDecoder` 終了時の `uncaughtException`

### 発生箇所

`src/Mirakurun/TunerDevice.ts` の BS4K 分岐では、生成したプロセスをフィールドへ
格納し、イベントハンドラーからそのフィールドを参照している。

```ts
this._mmtsDecoderProcess = child_process.spawn(parsed.command, parsed.args);

this._mmtsDecoderProcess.once("exit", () => {
    this._mmtsDecoderProcess.stdin.end();
});
```

一方、`_kill()` と `_release()` は次の順序で同じフィールドを破棄する。

```ts
this._mmtsDecoderProcess.stdin.end();
this._mmtsDecoderProcess.kill("SIGTERM");
this._mmtsDecoderProcess = null;
```

実際の順序は次のようになる。

1. BS4K の要求または EPG 取得が終了する。
2. `_kill()` がデコーダーへ `SIGTERM` を送り、フィールドを `null` にする。
3. 子プロセスの終了が非同期で通知され、登録済みの `exit` ハンドラーが動く。
4. ハンドラーが現在値 `null` のフィールドから `.stdin` を読んで
   `TypeError` を送出する。
5. `src/server.ts` の `uncaughtException` ハンドラーがカウンターを増やすため、
   サーバーは直ちには終了しないが、通常の終了コールバックは途中で中断される。

`null` なのは `ChildProcess.stdin` ではなく
`this._mmtsDecoderProcess` そのものである。既定の `spawn()` の標準入力は pipe
なので、この実行条件では生成直後の `stdin` は存在する。

### 影響

- BS4K の視聴、EPG取得、切り替えの終了ごとに未捕捉例外が発生し得る。
- グローバルの `uncaughtException` が握りつぶすためプロセスは継続するが、
  イベント処理の残りが保証されず、内部状態の不整合を隠す。
- stderr は `dantto4k` の進捗表示と大量のスタックトレースで急速に増え、
  調査時には短時間ごとに約10 MiBのローテーションが発生していた。
- CS/BS/地デジ用チューナーは `mmtsDecoder` 分岐を通らないため、この例外は
  CS 録画開始失敗の直接原因ではない。

### 実施した修正

この問題は、次のコミットで修正済みである。

- コミット: `a721e39` (`fix: guard mmtsDecoder process cleanup`)
- 変更ファイル: `src/Mirakurun/TunerDevice.ts`
- 変更関数: `private _spawn()`
- 回帰テスト追加: `test/tuner-device.spec.js` の `TunerDevice mmtsDecoder cleanup`

`_spawn()` の BS4K 用 `mmtsDecoder` 終了処理について、生成時の子プロセスを
イベントハンドラーが参照し、古いプロセスのイベントが現在の状態へ作用しないよう
修正した。問題のある `exit` ハンドラーを削除し、非同期の終了処理で発生した
エラーもログへ渡すようにしている。

## 2. `TSDecoder` の無応答処理の二重実行

### ログ

2026-07-18 05:26:53 に `TSDecoder#353` が作られた後、デコーダーから1.5秒間
出力がなく、次の順で処理された。

```text
05:26:55.624 process will force killed because no respond
05:26:55.625 unexpected dead
05:26:55.626 unexpected dead
05:26:57.125 respawning because dead (count=2)
05:26:58.648 unexpected dead
05:26:58.650 unexpected dead
05:26:58.650 fallback into pass-through stream
05:27:00.149 respawning because dead (count=4)
05:27:01.667 unexpected dead
05:27:01.668 unexpected dead
05:27:01.667-01.668 fallback into pass-through stream (3回)
```

APIの `decoderRespawn=2`、ログの再生成2回、強制終了3回、フォールバック3回が
一致する。

### 原因

`TSDecoder._dead()` は次の両方から呼ばれる。

- 1.5秒の無応答タイマー
- `ChildProcess` の `close` イベント

タイマー側の `_dead()` が `_kill()` すると、その `SIGKILL` によって `close` が
発火し、同じ子プロセスについて `_dead()` がもう一度実行される。このため
`_deadCount` は1障害につき2増え、再生成タイマーも重複する。

さらに、フォールバックへ移行しても既に予約済みの再生成タイマーを無効化しない。
その結果、pass-through へ切り替えた後に新しいデコーダーが再生成され、再び
フォールバック処理が走っている。

このときの入力は `BS/18130`、チューナーは `TunerDevice#5` であり、
BS4K用 `mmtsDecoder` の例外とは別の経路である。

### 導入コミットと Oomugi413 の考察

無応答タイマーと `ChildProcess` の `close` イベントからそれぞれ `_dead()` を
呼び出す処理は、次のコミットで `TSDecoder` の初期実装として同時に追加された。

- コミット: `350e4b5c7c558ff46354e5e7509dbbab484a2d5b`
- 日付: 2021-01-07
- Author / Committer: `kanreisa <re@pixely.jp>`
- 件名: `Add TSDecoder - command auto heal, path-through fallback implemented`
- URL: https://github.com/Chinachu/Mirakurun/commit/350e4b5c7c558ff46354e5e7509dbbab484a2d5b

このコミットはマージコミットではなく、`TSDecoder.ts` を新規追加した通常の
コミットである。無応答タイマーからの `_dead()`、`close` イベントからの
`_dead()`、`_deadCount` の加算、再生成、pass-through へのフォールバックは、
いずれも `kanreisa` によって同じ初期実装へ含められている。後続履歴にも、
`nekohkr` または `Oomugi413` がこの二重呼び出しを追加した形跡や、マージ競合の
解消時に混入した形跡は確認されなかった。

Oomugi413 は、二つの `_dead()` 呼び出しがどちらも同じ設計者によって同時に
実装されていることから、1回の無応答に対して `_dead()` が2回実行される挙動も、
設計者が意図した実装である可能性が高いと考察している。したがって、二重実行を
直ちに不具合と断定せず、`_deadCount`、再生成回数およびフォールバック条件を
設計者がどの単位で数える意図だったかを確認する必要がある。

### 推奨修正

- `_dead(proc)` のように障害元のプロセスを渡し、現在の
  `this._process` と一致しない古い `close` は無視する。
- 最初に現在プロセスの参照を解除してから kill し、同じプロセスの障害処理を
  一度だけにする。
- stdout の最初のデータ、障害処理、`_close()` のすべてで無応答タイマーを
  `clearTimeout()` する。
- 再生成用タイマーをフィールドで1つだけ管理し、フォールバックと `_close()` で
  必ず解除する。
- フォールバックを終端状態として記録し、その後の `_spawn()` を拒否する。

テストでは「無出力で timeout → SIGKILL → close」の1系列に対し、
`_deadCount` が1だけ増えること、再生成が1回だけであること、規定回数後の
フォールバックも1回だけであることを確認する。

## 3. `tunerDeviceRespawn=50`

### 観測内容

stderr にある次の警告は50件で、APIカウンターと一致した。

```text
TunerDevice#N respawning because request has not closed
```

内訳は次のとおり。

```text
TunerDevice#8: 37
TunerDevice#2: 5
TunerDevice#9: 4
TunerDevice#0: 4
```

これは `TunerDevice._release()` で、チューナー用外部プロセスが閉じた時点でも
利用者が残り、明示的な close 処理中でない場合に行う回復動作である。ログでは
主に `recdvb` / `recpt1` が `exit code=1` で終了し、同じコマンドを再生成している。

最大のまとまりは 2026-07-17 11:31:36 からの BS4K EPG 取得である。

```text
recdvb --dev 1 45280 - -
```

このコマンドが約3.1秒おきに終了と再生成を繰り返し、`TunerDevice#8` の
カウンターの大半を占めた。地デジ `recpt1 --device /dev/px4video2 26 - -` や
BS `recpt1 --device /dev/px4video0 16400 - -` にも短い連続失敗がある。

### 判断と解決策

再生成は Mirakurun の意図された継続処理であり、50という値だけから
Mirakurun内部のバグとは断定できない。直接の異常は外部コマンドの非ゼロ終了である。

現在の `logLevel: 2` では、外部コマンドの stderr を受ける箇所が `log.debug()`
なので、終了理由がログに保存されていない。まず一時的に DEBUG ログを有効にするか、
非ゼロ終了時だけ直前の子プロセス stderr を WARN/ERROR で記録し、次を確認する。

- `recdvb` のデバイスオープン、ロック、受信、チャンネル指定のエラー
- `recpt1` のデバイス競合、チューナー初期化、受信エラー
- `/dev/px4video*` と TBS6812 デバイスのカーネルログ
- 同時刻に別プロセスが同じデバイスを使用していないか

恒久的には、連続失敗へ短い固定間隔で無制限に再生成するのではなく、
指数バックオフ、一定回数後の要求終了、直近 stderr を含む明確なエラー応答を
検討する。ただしこれは可用性の方針を変えるため、まず外部コマンドの終了原因を
特定してから判断する。

## 4. その他の警告

2026-07-18 09:07:37 の BS4K EPG 取得終了時、`TunerDevice#9` の `recdvb` が
`SIGTERM` で終了せず、6秒後に `SIGKILL` された。

```text
TunerDevice#9 will force killed because SIGTERM timed out
```

これは `uncaughtException` とは別で、`recdvb` が終了要求へ応答しなかった事象で
ある。頻発はしておらず、保持ログでは1件だった。再発する場合は `recdvb` /
ドライバー側の停止処理を調べる。Mirakurun側では、強制終了後も `_release()` が
一度だけ行われることをテストする。

調査範囲では `unhandledRejection` と `bufferOverflow` は0であり、stderr の例外
見出しにも `mmtsDecoder` の `TypeError` 以外の JavaScript 例外はなかった。

## 修正の優先順位

1. `TunerDevice` の `mmtsDecoder` イベントハンドラーを生成時のローカル参照へ変更し、
   終了処理を冪等化する。
2. `TSDecoder._dead()` をプロセス単位で一度だけ処理し、再生成タイマーと
   フォールバック状態を一元管理する。
3. 非ゼロ終了時の tuner stderr を保存できるようにし、
   `tunerDeviceRespawn=50` の外部要因を特定する。
4. 必要なら tuner 再生成へバックオフと上限を設ける。

いずれの修正でも `npm run build` 後に `npm test` を実行し、実機依存部分は
子プロセスを模したテストと、BS4K EPG取得・ストリーム終了の実機確認で補う。
