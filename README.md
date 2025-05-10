[![Mirakurun](https://gist.githubusercontent.com/kanreisa/0ab27d7771e97edce5a24cc81b9b8ce6/raw/8e08d3d91390794b139ed593e3a834a8b41f651c/logo-mirakurun_2025-03-29.svg)](https://github.com/Chinachu/Mirakurun)

# Mirakurun

A Japanese digital TV tuner API server specifically designed for "Air" (code name of the app in development).

[![npm version][npm-img]][npm-url]
[![npm downloads][downloads-image]][downloads-url]
[![Linux Build][azure-pipelines-img]][azure-pipelines-url]
[![tip for next commit](https://tip4commit.com/projects/43158.svg)](https://tip4commit.com/github/Chinachu/Mirakurun)
[![Backers on Open Collective](https://opencollective.com/Mirakurun/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/Mirakurun/sponsors/badge.svg)](#sponsors)

[**CHANGELOG**](CHANGELOG.md) | [**Setup Guide**](doc/Platforms.md) | [**Configuration**](doc/Configuration.md)

[**English**](README.md) | [**日本語**](README.ja.md)

[**CHANGELOG**](CHANGELOG.md) | [**Setup Guide**](doc/Platforms.md) | [**Configuration**](doc/Configuration.md)

[**English**](README.md) | [**日本語**](README.ja.md)

---
## フォークにあたっての変更点など
> [!NOTE]
> こちらは開発ブランチです。正常な動作は保証しておりません。<br>
> 機能追加するときのテストをしています。<br>
> BonDriverごとに物理チャンネル番号等がずれてしまっている場合でも、<br>
> 効率よく選局ができるようになりました。(サービスストリームのみ)<br>
> [EPGStation devブランチ](https://github.com/stuayu/EPGStation/tree/dev)と[BonDriver_mirakc](https://github.com/stuayu/BonDriver_mirakc)のService_Split=1で動作することを確認済みです。<br>
> ※APIに変更が加わっているため、各種本家版のツールでは動作しません。<br>
> KonomiTVは本家版で動作することを確認済みです。<br>
> NodeJS v18/v20 LTS版でビルド、実行を確認しています。<br>

### インストール方法
  1. ダウンロード<br>
    Githubからクローンする
      ```powershell
      git clone https://github.com/stuayu/Mirakurun.git -b feature/4.0.0-windows # devブランチをチェックアウトする
      cd Mirakurun
      ```
  1. ビルド
      ```powershell
      npm install
      npm run build
      ```
  2. 起動
    管理者権限でターミナルを起動して以下のコマンドを実行
      ```powershell
      npm run start.win32
      ```

  3. 管理画面の確認<br>
    http://127.0.0.1:40772

  4. Windowsのサービス化<br>
      GUIからの再起動コマンドは現在動作しません。
      ```powershell
      npm run install-win-service # インストール実行
      npm run uninstall-win-service # アンインストール実行
      ```

### 利用方法の例
  * 各種チューナー -> (BonDriverProxyEx) -> Mirakurun -> EPGStation -> BonDriver_EPGStation -> TVTest<br>
  * 各種チューナー -> (BonDriverProxyEx) -> Mirakurun -> EPGStation -> [EPGStationの録画を見る](https://github.com/daig0rian/epcltvapp) -> 家庭のテレビ<br>
  * 各種チューナー -> (BonDriverProxyEx) -> Mirakurun -> [Kodi](https://kodi.tv/) -> 家庭のテレビ<br>
  * 各種チューナー -> (BonDriverProxyEx) -> Mirakurun -> BonDriver_mirakc(チャンネルストリーム) -> EDCB<br>
  * 各種チューナー -> (BonDriverProxyEx) -> Mirakurun -> BonDriver_mirakc(サービスストリーム) -> TVTest<br>
  * 各種チューナー -> (BonDriverProxyEx) -> Mirakurun -> KonomiTV<br>

---
以下本家版のドキュメントです。
## Docker

[![dockeri.co](https://dockeri.co/image/chinachu/mirakurun)][docker-url]

Reference: List of available [tags](https://hub.docker.com/r/chinachu/mirakurun/tags) (Docker Hub)

## Features

- HTTP RESTful API (Swagger / Open API 2.0)
- Advanced tuner process management
- Multiple stream broadcasting from a single tuning
- Stream priority
- MPEG-2 TS parser, filter
- Real-time EPG parser
- Support for various tuner devices and hybrid environments (chardev, DVB / ISDB-T, ISDB-S, DVB-S2)
- Automatic channel scanning
- Web UI
- IPTV server (M3U8 playlist, XMLTV)

#### Figure: Variety of the MPEG-2 TS Stream API

![](https://gist.githubusercontent.com/kanreisa/0ab27d7771e97edce5a24cc81b9b8ce6/raw/7409e229648e00b55404f9e8342dccb58bbb4ac4/mirakurun-fig-api-variety2.svg)

#### Figure: Stream Flow

![](https://gist.githubusercontent.com/kanreisa/0ab27d7771e97edce5a24cc81b9b8ce6/raw/7409e229648e00b55404f9e8342dccb58bbb4ac4/mirakurun-fig-flow-stream2.svg)

## Setup Guide

👉 [**Setup Guide**](doc/Platforms.md)

## Configuration

👉 [**Configuration**](doc/Configuration.md)

## Web UI

```sh
# Admin UI
http://_your_mirakurun_ip_:40772/

# Swagger UI
http://_your_mirakurun_ip_:40772/api/debug
```

## Client Implementations

- [Rivarun](https://github.com/Chinachu/Rivarun)
- [BonDriver_Mirakurun](https://github.com/Chinachu/BonDriver_Mirakurun)
- Mirakurun Client ([Built-in](https://github.com/Chinachu/Mirakurun/blob/master/src/client.ts))
  - "Air" (in development codename)
  - [Chinachu γ](https://github.com/Chinachu/Chinachu/wiki/Gamma-Installation-V2)
  - [EPGStation](https://github.com/l3tnun/EPGStation)

## Contributing

- [CONTRIBUTING.md](CONTRIBUTING.md)

## Donations

- [Tip4Commit](https://tip4commit.com/github/Chinachu/Mirakurun) (BTC) - Distributed to all committers
- [Open Collective](https://opencollective.com/Mirakurun) (USD) - Pool (purpose undecided)

## Discord Community

- Invitation: https://discord.gg/X7KU5W9

## Contributors

This project exists thanks to all the people who contribute.
<a href="https://github.com/Chinachu/Mirakurun/graphs/contributors"><img src="https://opencollective.com/Mirakurun/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/Mirakurun#backer)]

<a href="https://opencollective.com/Mirakurun#backers" target="_blank"><img src="https://opencollective.com/Mirakurun/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/Mirakurun#sponsor)]

<a href="https://opencollective.com/Mirakurun/sponsor/0/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/1/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/2/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/3/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/4/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/5/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/6/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/7/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/8/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/Mirakurun/sponsor/9/website" target="_blank"><img src="https://opencollective.com/Mirakurun/sponsor/9/avatar.svg"></a>

## Copyright / License

&copy; 2016- [kanreisa](https://github.com/kanreisa).

- Code: [Apache License, Version 2.0](LICENSE)
- Docs: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Logo: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

[npm-img]: https://img.shields.io/npm/v/mirakurun.svg
[npm-url]: https://npmjs.org/package/mirakurun
[downloads-image]: https://img.shields.io/npm/dm/mirakurun.svg?style=flat
[downloads-url]: https://npmjs.org/package/mirakurun
[azure-pipelines-img]: https://dev.azure.com/chinachu/Mirakurun/_apis/build/status/Chinachu.Mirakurun?branchName=master
[azure-pipelines-url]: https://dev.azure.com/chinachu/Mirakurun/_build/latest?definitionId=1&branchName=master
[docker-url]: https://hub.docker.com/r/chinachu/mirakurun
