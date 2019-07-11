const request = require('request');
const fs = require('fs');
const { parse } = require('json2csv');

let total_page = 100;
let page = 1;
let accessToken = 'd3062a23d6cc777ccf6b1894591cf2280cf639bb'; //若不可用请更新这里
let fullData = [];
let waitTime = 0;

let oldFile = fs.readFileSync('./GitHub-Chinese-Users.json', 'utf8');
let oldArr = JSON.parse('[' + oldFile.slice(0, oldFile.length - 2) + ']');
if(oldArr.length > 0) {
    fullData = oldArr;
}
if(oldFile) {
    let lastPage = oldFile.split(`"id"`).length - 1;
    if(lastPage > 0) {
        page = parseInt(lastPage / 29) + 1; 
        console.log('断点续传: 从第 ' + page + ' 页开始');
    }
}

async function getUsers() {
    return new Promise(resolve => {
        let opt;
        request.get({
            url: `https://api.github.com/search/users?q=location:china&page=${page}&access_token=${accessToken}`,
            headers: {
                "User-Agent": "Awesome-Octocat-App",
                "Content-Type": "application/json ;charset=UTF-8",
                "Accept": "application/json"
            }
        }, async (error, response, body) => {
            let data = JSON.parse(body);
            total_page = parseInt(data.total_count / 29) + 1 || 100;
            console.log('共' + total_page + '页');

            for (var i = 0; i < data.items.length; i++) {
                console.log('正在获取第 ' + (i + 1) + ' 个用户');
                console.log(data.items[i].login);
                console.log(data.items[i].avatar_url);
                let t = await getEmail(data.items[i].login);
                //console.log(t);
                let mail;
                try {
                    mail = t[0];
                } catch (err) {
                    mail = '邮箱获取失败'
                } finally {
                    console.log(mail);
                    opt = {
                        id: (page - 1) * 29 + (i + 1),
                        email: mail,
                        nickname: data.items[i].login,
                        avatar: data.items[i].avatar_url
                    }
                    fullData.push(opt);
                    var fuck = parse(
                        fullData, {
                            fields: [
                                'id', 'email', 'nickname', 'avatar'
                            ]
                        });
                    fs.writeFileSync('./GitHub-Chinese-Users.csv', fuck);
                    fs.appendFileSync('./GitHub-Chinese-Users.json', JSON.stringify(opt) + ',\n');
                }
            }
            if (page < total_page) {
                page++;
            }
            resolve(opt)
        })
    })

}

async function getEmail(name) {
    return new Promise(resolve => {
        waitTime = 0;
        request.get({
            url: `https://api.github.com/users/${name}/events?access_token=${accessToken}`,
            headers: {
                "User-Agent": "Awesome-Octocat-App",
                "Content-Type": "application/json ;charset=UTF-8",
                "Accept": "application/json"
            }
        }, (error, response, body) => {
            resolve(new RegExp(/[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/).exec(body))
        })
    })
}



(async () => {
    setTimeout(() => {
        waitTime = waitTime + 1000;
        if (waitTime >= 10000) {
            throw 'stop';
        }
    }, 1000);
    for (; page < total_page;) {
        await getUsers();
    }
})()