const request = require('request');
const fs = require('fs');
let total_page = 100;
let page = 1;
let accessToken = '7175b07ea09b90e85a834e53218dbda6698e71d7';
let fullData = [];

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
            total_page = parseInt(data.total_count / 29) || 100;

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
                    fs.appendFileSync('./logs.txt', JSON.stringify(opt) + ',\n');
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
    for( ;page < total_page; ) {
        await getUsers();
    }
})()