const http = require('http');

exports.hitokoto = function() {
    return new Promise((resolve, reject) => {

            let options = {
                host: 'v1.hitokoto.cn',
                method: 'POST',
            }
            let body = '';
            let req = http.request(options, (res) => {
                res.on('data', (chuck) => {
                    body += chuck;
                }).on('end', () => {
                    if (body != '') {
                        resolve(JSON.parse(body));
                    } else {
                        reject('fail');
                    }

                })
            });

            req.on('error', (e) => {
                reject(e)
            });
            req.end();

        })
        .then((sentence) => {
            let results = {
                content: sentence.hitokoto,
                provenance: sentence.from,
                author: sentence.from_who,
                source: 'hitokoto',
                para: {
                    type: sentence.type,
                    uuid: sentence.uuid,
                },
            }
            return results;
        });
}