const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

module.exports = (fromFile, targetDir) => {

  return new Promise((resolve, rej) => {
    yauzl.open(fromFile, {
      lazyEntries: false
    }, (e, zipfile) => {
      if (e) {
        rej(e);
        return;
      }
      const filesPromise = [];
      zipfile.on("entry", function(entry) {
        console.log(entry.fileName);
        // 提前创建文件夹
        if (/\/$/.test(entry.fileName)) {
          const dir = path.join(targetDir, entry.fileName);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }
        } else {
          // 迁移文件
          filesPromise.push(new Promise((resolve) => {
            zipfile.openReadStream(entry, function(err, readStream) {
              if (err) {
                resolve({
                  message: err.message,
                  entry,
                  error: err,
                });
              } else {
                const targetFile = path.join(targetDir, entry.fileName);
                const ws = fs.createWriteStream(targetFile);
                ws.on('close', () => {
                  resolve();
                });
                readStream.pipe(ws);
              }
            });
          }));
        }
      });

      zipfile.once('end', () => {

        Promise.all(filesPromise).then((result) => {
          resolve(result.filter(_ => _));
        });
      });
    });
  });
}
