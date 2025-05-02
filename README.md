[![Mirakurun](https://gist.githubusercontent.com/kanreisa/0ab27d7771e97edce5a24cc81b9b8ce6/raw/e50683f1c4e7d1a13e9ef468f8cc945b0dbc853c/logo-mirakurun.svg)](https://github.com/Chinachu/Mirakurun)

# Mirakurun

DVR Tuner Server for Japanese TV which designed for the "Air" (in development codename).

[![npm version][npm-img]][npm-url]
[![npm downloads][downloads-image]][downloads-url]
[![Linux Build][azure-pipelines-img]][azure-pipelines-url]
[![tip for next commit](https://tip4commit.com/projects/43158.svg)](https://tip4commit.com/github/Chinachu/Mirakurun)
[![Backers on Open Collective](https://opencollective.com/Mirakurun/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/Mirakurun/sponsors/badge.svg)](#sponsors)

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
      git clone https://github.com/stuayu/Mirakurun.git -b dev # devブランチをチェックアウトする
      cd Mirakurun
      ```
  1. ビルド
      ```powershell
      npm run install
      npm run build
      ```
  2. サービス登録<br>
    管理者権限でターミナルを起動して以下のコマンドを実行
      ```powershell
      npm run postinstall -g
      ```
  3. サービス起動の確認<br>
    Windowsはタスクマネージャーからmirakurunのサービスが登録されて、実行中になっていることを確認してください。<br>
    2.のサービス登録で登録が失敗したら、コマンドプロンプト(管理者)で<br>`SC stop mirakurun`と`SC delete mirakurun`を実行したのち、2.を再実行してください。<br><br>
    Linuxの場合は`pm2 status mirakurun-server`で起動できているか確認してください。

  4. 管理画面の確認<br>
    http://127.0.0.1:40772

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

see: available [Tags](https://hub.docker.com/r/chinachu/mirakurun/tags) (Docker Hub)

### Quick Install

```sh
mkdir ~/mirakurun/
cd ~/mirakurun/
wget https://raw.githubusercontent.com/Chinachu/Mirakurun/master/docker/docker-compose.yml
docker-compose pull
docker-compose run --rm -e SETUP=true mirakurun
docker-compose up -d
```

see: [doc/Platforms.md](doc/Platforms.md)

## Features

* RESTful API (Open API) - has designed like HTTP version of Spinel
* Unix Sockets / TCP
* Advanced Tuner Process Management
* Priority Management
* Tuner Device Pooling
* Integrated MPEG-2 TS Parser, Filter
* Realtime EPG Parser
* Supports most Tuner Devices (chardev, DVB / ISDB-T, ISDB-S, DVB-S2)
* Channel Scan
* IPv6 Support
* [Multiplexing Mirakuruns](doc/Mirakuruns.md)
* Web UI
* IPTV Server (M3U8 Playlist, XMLTV)

#### Figure: Variety of the MPEG-2 TS Stream API

![](https://gist.githubusercontent.com/kanreisa/0ab27d7771e97edce5a24cc81b9b8ce6/raw/e50683f1c4e7d1a13e9ef468f8cc945b0dbc853c/mirakurun-fig-api-variety.svg)

#### Figure: Stream Flow

![](https://gist.githubusercontent.com/kanreisa/0ab27d7771e97edce5a24cc81b9b8ce6/raw/e50683f1c4e7d1a13e9ef468f8cc945b0dbc853c/mirakurun-fig-flow-stream.svg)

## Requirements / Supported Platforms

* [Node.js](http://nodejs.org/) 14, 16
* Linux w/ [PM2](http://pm2.keymetrics.io/) or [Docker](https://hub.docker.com/r/chinachu/mirakurun)

see: [doc/Platforms.md](doc/Platforms.md)

## **Install / Update / Uninstall / CLI**

see: [doc/Platforms.md](doc/Platforms.md)

## Web UI

```sh
# Admin UI
http://_your_mirakurun_ip_:40772/

# Swagger UI
http://_your_mirakurun_ip_:40772/api/debug
```

## PM2 Plus (Keymetrics)

You can use PM2 Plus to realtime monitoring if running by PM2.

* [PM2 Plus](https://pm2.io/plus/) (Keymetrics)

## Client Implementations

* [Rivarun](https://github.com/Chinachu/Rivarun)
* [BonDriver_Mirakurun](https://github.com/Chinachu/BonDriver_Mirakurun)
* Mirakurun Client ([Built-in](https://github.com/Chinachu/Mirakurun/blob/master/src/client.ts))
  * "Air" (in development codename)
  * [Chinachu γ](https://github.com/Chinachu/Chinachu/wiki/Gamma-Installation-V2)
  * [EPGStation](https://github.com/l3tnun/EPGStation)

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md)

## Supporting

* [Tip4Commit](https://tip4commit.com/github/Chinachu/Mirakurun) (BTC) - to Every Committers
* [Open Collective](https://opencollective.com/Mirakurun) (USD) - Pool (TBD)

## Discord Community

* Invitation: https://discord.gg/X7KU5W9

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

* Code: [Apache License, Version 2.0](LICENSE)
* Docs: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
* Logo: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

**Commercial License / Support** is provided by [Pixely LLC](https://pixely.jp/).

[npm-img]: https://img.shields.io/npm/v/mirakurun.svg
[npm-url]: https://npmjs.org/package/mirakurun
[downloads-image]: https://img.shields.io/npm/dm/mirakurun.svg?style=flat
[downloads-url]: https://npmjs.org/package/mirakurun
[azure-pipelines-img]: https://dev.azure.com/chinachu/Mirakurun/_apis/build/status/Chinachu.Mirakurun?branchName=master
[azure-pipelines-url]: https://dev.azure.com/chinachu/Mirakurun/_build/latest?definitionId=1&branchName=master
[docker-url]: https://hub.docker.com/r/chinachu/mirakurun
