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

## このforkについて
Forked from otya128/MMirakurun

MMT/TLV対応のforkであり、EPGの収集、チャンネルスキャン、ロゴ収集、イベントid指定のストリーミングなどに対応しています。
サービス別のストリームについては現在1TLV1サービスで運用されており必要がないため実装しておらず、どのAPIでも無加工のTLVストリームが出力されます。
チャンネル種別には`BS4K`が追加されています。

MMT/TLVの解析は<https://github.com/otya128/arib-mmt-tlv-ts>を用いて実装しています。

### 設定

Linux上で<https://github.com/otya128/tbs6812_drv>と<https://github.com/otya128/recdvb>で動作を確認しています。

`dvbv5-zap`と`dvbDevicePath`の設定でも動作しますが、設定の管理が二重になりチャンネルスキャンもできないため推奨しません。

Windowsでは`BonRecTest`で動く可能性はありますが動作は確認していません。

`tuners.yml`の設定例:
```yml
- name: adapter0
  types:
    - GR
    - BS
    - CS
    - BS4K
  command: recdvb --dev 0 <channel> - -
- name: adapter1
  types:
    - GR
    - BS
    - CS
    - BS4K
  command: recdvb --dev 1 <channel> - -
```

複数のDVBデバイスを用いる場合は全てのモジュールパラメータに`adapter_nr=<n>`を指定してアダプタ番号が固定されるようにすることを推奨します。

起動後次のコマンドでチャンネルスキャンできます。
左旋を無効にする設定は未実装なため、受信できない場合は手動で無効にしてください。 (`4518x`, `4528x`)

```
curl -X PUT "http://localhost:40772/api/config/channels/scan?type=BS4K&refresh=true"
```

### 追加機能

`useTSId: true`を`server.yml`に設定すると相対TS番号の代わりにTSIDとデフォルトTSを使うようになるためBSとCSのチャンネルスキャンがすぐに終わるようになります。

TSIDによる指定に対応しているDVBデバイスと併用する場合は問題ありませんが、chardevチューナーと併用する場合はTSID指定に対応しているドライバと対応している`recpt1`を用いる必要があります。

* ドライバ
  * <https://github.com/otya128/px4_drv>
  * <https://github.com/tsukumijima/px4_drv>
* recpt1
  * <https://github.com/otya128/recpt1>

## Docker

[![dockeri.co](https://dockeri.co/image/chinachu/mirakurun)][docker-url]

[**English**](README.md) | [**日本語**](README.ja.md)

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
