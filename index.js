const path = require('path');
const fs = require('fs');
const request = require('request');
const ora = require('ora');
class FileToCdn {
    constructor(options) {
        this.url = options.url || '';
        this.extral = options.extral || {};
        this.dirName = options.dirName || 'dist';
        this.proxy = options.proxy || '';
        this.filesKey = options.filesKey || 'files';
    }
    apply(compiler) {
        compiler.plugin('done', (stats) => {
            const files = {};
            files[this.filesKey] = this.getFiles(this.dirName);
            this.fileUpload(files, this.url, this.proxy, this.extral);
        });
    }
    getFiles(dirName) {
        const resultFiles = [];
        const circle = (dirName) => {
            let files = fs.readdirSync(dirName, {
                withFileTypes: true,
            });
            for (const dirent of files) {
                if (dirent.isDirectory()) {
                    circle(path.join(dirName, dirent.name));
                } else {
                    const strem = fs.createReadStream(path.join(dirName, dirent.name));
                    resultFiles.push({ value: strem, options: { filepath: strem.path } });
                }

            }
        }
        try { circle(dirName); }
        catch (e) {
            console.log(e);
        }

        return resultFiles;
    }
    fileUpload(files, url, proxy, extral) {
        const spinner = ora('打包文件正在上传服务器').start();
        request.post({
            url: url, proxy: proxy, formData: {
                ...extral,
                ...files
            }
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                spinner.fail('上传失败' + err);
                return;
            }
            if (httpResponse.statusCode === 200) {
                spinner.succeed('上传成功！')
            } else {
                spinner.fail('上传失败:' + body);
            }

        })
    }

}

module.exports = FileToCdn;