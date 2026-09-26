# EDCB「録画開始処理に失敗しました」調査結果

調査日: 2026-07-18

## 結論

2026-07-18 01:00 の「[新]中二病でも恋がしたい! #1」は、録画ファイル名が
保存先ファイルシステムの上限を超えたため、`Write_Default.so` がファイルを作成
できず、EDCB が `録画開始処理に失敗しました` (`recStatus=12`) として終了した。

BonDriver や Mirakurun の選局失敗ではない。Mirakurun は対象の `CS/29024` を
HTTP 200 で開き、録画開始直前まで約5分間ストリームを提供できていた。

直接の原因は次の録画名マクロである。

```ini
Macro=$SDYYYY$$SDMM$$SDDD$_$Title$$SubTitle2$.ts
```

`$SubTitle2$` に長い番組内容が入ると、タイトルとの連結結果が Linux の1ファイル名
あたりの上限を超える。

## 直接の証拠

保存先 `/mnt/recording` の上限は次のとおり。

```console
$ getconf NAME_MAX /mnt/recording
255
```

同じ放送枠で正常録画できた #2 と #3 の実ファイル名は、どちらも上限直前の
254バイトだった。

```text
254 bytes  20260718_中二病でも恋がしたい! #2第1回京都アニメーション大賞の奨励賞受賞作をアニメ化。“中二病”を軸として、コミカルかつ切なく描く青春学園ラブコメディがTBSチャンネルに登場！.ts
254 bytes  20260718_中二病でも恋がしたい! #3第1回京都アニメーション大賞の奨励賞受賞作をアニメ化。“中二病”を軸として、コミカルかつ切なく描く青春学園ラブコメディがTBSチャンネルに登場！.ts
```

#1 の想定名には先頭の `[新]` が加わる。

```text
20260718_[新]中二病でも恋がしたい! #1第1回京都アニメーション大賞の奨励賞受賞作をアニメ化。“中二病”を軸として、コミカルかつ切なく描く青春学園ラブコメディがTBSチャンネルに登場！.ts
```

この名前は259バイトであり、`NAME_MAX=255` を4バイト超える。

EDCB の処理経路もこの結果と一致する。

1. `TunerBankCtrl.cpp` の `RecStart()` が録画名マクロを展開する。
2. `WriteTSFile.cpp` が `Write_Default.so` の `Start()` を呼ぶ。
3. `WriteMain.cpp` が対象パスを `UtilOpenFile()` で作成する。
4. 長すぎるファイル名では `ENAMETOOLONG` となり、全出力先の開始が失敗する。
5. `SendViewStartRec()` が成功せず、EDCB は `recStatus=12` を記録する。

`CheckFileName()` は使用禁止文字を置換するが、プラグインが生成した名前を
Linux のバイト数上限まで短縮しない。デフォルト録画名にはUnix向けの長さ制限が
あるが、`RecName_Macro.so` の結果には適用されない。

## ログの時系列

### EDCB

`/var/local/edcb/EpgTimerSrvNotify.log`:

```text
2026/07/18 00:54:51.872 [予約録画開始準備] BonDriver_LinuxMirakc_S.so
2026/07/18 00:59:26.169 [予約録画開始準備] ＴＢＳチャンネル２ ...
2026/07/18 00:59:45.222 [録画終了] ＴＢＳチャンネル２ ... 録画開始処理に失敗しました
2026/07/18 00:59:47.771 [予約録画開始準備] ＴＢＳチャンネル２ ...
2026/07/18 00:59:52.861 [録画終了] ＴＢＳチャンネル２ ... 録画開始処理に失敗しました
2026/07/18 00:59:55.431 [予約録画開始準備] ＴＢＳチャンネル２ ...
2026/07/18 01:00:00.471 [録画終了] ＴＢＳチャンネル２ ... 録画開始処理に失敗しました
```

3件の失敗は人為的な三重予約ではない。開始失敗で予約が削除された直後、EPG自動
予約が開始前の同一イベントを再追加したため、開始時刻まで約7秒間隔で再試行された。
`EpgTimerSrvDebugLog.txt` の `Start ReloadBankMap` とも時刻が一致する。

30分後の同一サービスは正常に録画できている。

```text
2026/07/18 01:29:45.378 [録画開始] ＴＢＳチャンネル２ ... 中二病でも恋がしたい! #2
2026/07/18 02:00:05.341 [録画終了] ＴＢＳチャンネル２ ... 録画終了
```

### Mirakurun

`/usr/local/var/log/mirakurun.stdout.log`:

```text
2026-07-18T00:54:51.381+09:00 TunerDevice#4 process has spawned by command `recpt1 --device /dev/px4video4 29024 - -`
2026-07-18T00:54:51.382+09:00 TunerDevice#4 streaming to user `unix:...` (priority=102)
2026-07-18T00:59:45.213+09:00 TunerDevice#4 end streaming to user `unix:...` (priority=102)
2026-07-18T00:59:45.213+09:00 GET /api/channels/CS/29024/stream?decode=1 HTTP/1.0 200
```

Mirakurun のストリーム終了時刻 `00:59:45.213` は、EDCB の録画開始失敗
`00:59:45.222` の9ミリ秒前である。HTTP失敗やチューナープロセス異常終了ではなく、
EDCB/BonDriver側が録画保存開始の失敗に伴って正常な接続を閉じた動きである。

30分後は同じ `TunerDevice#4`、同じ `/dev/px4video4`、同じ `CS/29024` で
01:24:51から02:30:05までストリームが維持され、#2と#3を正常録画している。
したがって、物理チューナー#4も今回の直接原因ではない。

## 解決策

`/var/local/edcb/RecName_Macro.so.ini` のマクロにUTF-8バイト数制限を加える。

推奨設定:

```ini
[SET]
Macro=$SDYYYY$$SDMM$$SDDD$_$HeadC230~(($Title$$SubTitle2$))$.ts
```

`HeadC` はUTF-8換算のバイト数で切り詰める。230バイトにする理由は、日付と
アンダースコアの9バイト、`.ts` の3バイト、および同名ファイル存在時に
`Write_Default.so` が付加する `-(999)` まで考慮しても255バイト以内に収めるため。
省略時は末尾に `~` が付く。

番組内容をファイル名に含める必要がなければ、より単純な設定でもよい。

```ini
[SET]
Macro=$SDYYYY$$SDMM$$SDDD$_$HeadC230~(Title)$.ts
```

設定変更後は、今後の予約一覧に表示される「録画予定ファイル名」が短縮されている
ことを確認する。通常はEDCBサービスの再起動は不要だが、表示が更新されない場合は
予約の再読み込みまたはEDCBサービスの再起動後に再確認する。

## 過去の同種失敗

次の失敗も、Mirakurunでは対象ストリームがHTTP 200で開いていた一方、EDCBは録画
ファイルを一度も作成できず、同じ自動予約再追加を繰り返している。

- 2026-07-03 14:30 `[映]レインマン（字幕版）[SS]`
- 2026-07-05 23:00 `[新]君のことが大大大大大好きな100人の彼女 第3期 ...`

いずれも長いタイトルまたは番組内容を `$Title$$SubTitle2$` で連結する条件に合う。
今回の259バイトの事例で原因を直接再現できるため、同じ長さ超過による失敗と判断
できる。

## 別件: Mirakurunの例外

Mirakurun APIの累積値には、調査時点で次の異常があった。

```text
uncaughtException=893
tunerDeviceRespawn=50
decoderRespawn=2
```

stderrには以下が繰り返し出ている。

```text
TypeError: Cannot read properties of null (reading 'stdin')
    at .../DMirakurun/src/Mirakurun/TunerDevice.ts:319:46
```

これはBS4K用`mmtsDecoder`プロセスの終了ハンドラで
`this._mmtsDecoderProcess.stdin.end()`をnull確認なしに呼ぶ別件の不具合である。
今回のCS録画はこの経路を通らず、失敗時にもCSストリームは継続していたため、
今回の録画開始失敗の原因ではない。ただしMirakurun側で別途修正すべきである。

## 調査時の補足

- `/mnt/recording` は約17TB空き、inode使用率1%であり、容量不足ではない。
- `/usr/local/lib/edcb/BonDriver_LinuxMirakc*.so` はプロジェクト内バイナリと
  SHA-256が一致した。
- BonDriver設定のUnixソケット、優先度102、B25デコード設定はMirakurunログと一致した。
- `RetryOtherTuners=1` はチューナーオープン失敗用であり、今回の
  `REC_END_STATUS_ERR_RECSTART` には適用されない。
