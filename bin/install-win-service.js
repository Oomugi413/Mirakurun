const path = require('path');
const fs = require('fs');
const { Service } = require('node-windows');

// サービス定義
const svc = new Service({
    name: 'Mirakurun',
    description: 'Mirakurun EPG and Stream Server',
    script: path.resolve(__dirname, '..', 'bin/init.win32.js'),
    startType: 'auto',
    env: [
        {
            name: 'USERPROFILE',
            value: process.env.USERPROFILE
        },
        {
            name: 'LOCALAPPDATA',
            value: process.env.LOCALAPPDATA
        }
    ],
});

// イベント定義
svc.on('install', () => {
    console.log('サービスをインストールしました。起動します...');
    svc.start();
});

svc.on('alreadyinstalled', () => {
    console.log('サービスは既にインストールされています。');
});

svc.on('invalidinstallation', () => {
    console.error('無効なインストールです。');
});

svc.on('error', (err) => {
    console.error('サービスのインストール中にエラーが発生しました:', err);
});

// サービスインストール
svc.install();
