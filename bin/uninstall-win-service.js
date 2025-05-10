const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
    name: 'Mirakurun',
    script: path.join(__dirname, '..', 'bin/init.win32.js')
});

svc.on('uninstall', () => {
    console.log('サービスをアンインストールしました。');
});

svc.uninstall();
