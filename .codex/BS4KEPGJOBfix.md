# BS4K EPG ジョブのチューナー待ち修正

調査・修正日: 2026-08-06

Codex session ID (`CODEX_THREAD_ID`): `019fd509-9cc7-7453-b571-5c9cbc2a7557`

## 結論

BS4K の EPG Gather ジョブがチューナー数を超えて `running` になり、一部が失敗
していた原因は、BS4K 用 `readyFn` が `service.epgReady === false` の場合に
チューナー空き確認を行わず、`undefined` を返していたことだった。

Job 管理側は `readyFn` の戻り値が明示的な `false` の場合だけジョブをスキップする。
`undefined` は実行可能として扱われるため、BS4K ジョブは `readyForJob()` を通らずに
実行状態へ進んでいた。

さらに BS4K はネットワーク単位ではなくサービス単位でジョブを生成するため、
ネットワーク11では `EPG.Gather.NID.11.SID.1100***` のジョブがサービス数分作られる。
ジョブの `maxRunning` はチューナー数ではなく、既定では論理 CPU 数の半分である。

実行環境では BS4K 対応チューナーが2台、`nproc` は20だったため、ジョブ管理側は
最大10ジョブを `running` にできた。一方、実際に BS4K を取得できるチューナーは
同時に2台だけだった。

## 実際に確認した事象

2026-08-06 13:20:26、次のBS4Kジョブがほぼ同時に開始した。

```text
Network#11 Service#1100171
Network#11 Service#1100151
Network#11 Service#1100161
Network#11 Service#1100101
Network#11 Service#1100181
Network#11 Service#1100102
```

最初の2件は `TunerDevice#8` と `TunerDevice#9` を取得した。その直後に開始した
4件は実チューナーを取得できず、約12.2秒後に `no available tuners` で失敗した。

- 通常ログ: `/usr/local/var/log/mirakurun.stdout.log:26094-26135`
- チューナー取得リトライ: `src/Mirakurun/Tuner.ts:321-330`

地上波ジョブは、現在のサービス状態では `epgReady === true` なので
`readyForJob()` が呼ばれ、チューナーが空くまで `queued` または `standby` に残る。
したがって、`queued` の件数がチューナー数を超えること自体は異常ではなく、
キューはチューナー数とは別に保持される。

なお、同じ `readyFn` の構造は地上波側にも存在するため、地上波サービスが
`epgReady === false` になった場合は同じ問題が起こり得る。今回 BS4K で顕在化したのは、
ネットワーク11の未取得サービスが `epgReady === false` だったためである。

## 修正内容

`src/Mirakurun/Channel.ts` の `addBS4KEPGJob()` に、既存の地上波処理と同じ
チューナー待ちを追加した。

```ts
if (service.epgReady === true) {
    // EPG更新不要・放送休止などの判定
    return _.tuner.readyForJob(service.channel);
}

return _.tuner.readyForJob(service.channel);
```

これにより、次の動作になる。

1. EPG更新をスキップすべき場合は、従来どおり明示的な `false` でスキップする。
2. EPG取得が必要な場合は、ジョブ本体を実行する前に `readyForJob()` でチューナーを待つ。
3. 実チューナー数を超える BS4K ジョブが、同時に `getEPG()` へ進まない。

## 検証結果

- `npm run build`: 成功
- `npm test`: 成功（3ファイル、3テストスイート）
- Mirakurun の再起動: 実施していない
- 録画中の番組: 中断していない

`npm run build` により、PM2 が実行する `lib/server.js` と関連するビルド出力は更新済みで
ある。ただし、現在実行中の Node.js プロセスは再起動していないため、修正が有効になるのは
次回の Mirakurun 再起動後である。

## 再起動可能になった後の反映方法

現在の構成は `processes.json` で `lib/server.js` を起動する PM2 構成である。
録画・視聴など、チューナーを使用中の処理がないことを確認してから、プロジェクトディレクトリ
で次を実行する。

```sh
cd /home/oomugi413/git/DMirakurun
npm run build
pm2 restart mirakurun-server
pm2 status
```

`pm2 restart` は実行中のストリームや録画を切断し得るため、録画終了後に実行する。
再起動後は、次でプロセスが起動し直したことを確認できる。

```sh
pm2 logs mirakurun-server --lines 100
```

ログに異常がなければ、Web UI の Jobs または `/api/jobs` で
`EPG.Gather.NID.11.SID.1100***` のジョブを確認する。BS4Kジョブがチューナー数を超えて
`running` に集中せず、空き待ちになることが期待される。
