var request = require('request');
var cheerio = require('cheerio');

const feildStudentName = ['stt', 'mssv', 'fullname', 'class', 'phone'];

var url = 'http://daotao.dut.udn.vn/sv/G_LopSH_DSach2.aspx';

const getStudentsByClassName = (className) => Promise.resolve()
    .then(() => loadDataGetBodyDataAndCookies())
    .then(postToGetAllClass)
    .then((options) => {
        return getStudents(options, className)
    })

function getStudents({ bodyData, cookies, $ }, className) {
    return new Promise((resolve, reject) => {
        const arrBodyData = [];

        $('#MainContent_Grid1 tr').filter((key, value) => {
            if (key == 0) return;
            if (~$(value).text().indexOf(className)) {
                value.children.forEach((value, key) => {
                    if (value.name == 'td') {
                        if (value.children[0].children[1] && value.children[0].children[1].name == 'a') {
                            const href = value.children[0].children[1] && value.children[0].children[1].attribs.href;
                            const eventTarget = href.split('\'')[1];
                            bodyData = {
                                ...bodyData,
                                "__EVENTTARGET": eventTarget,
                                "__EVENTARGUMENT": "",
                                "ctl00$MainContent$ScriptManager1": "ctl00$MainContent$UpdatePanel1|" + eventTarget,
                            }
                            delete bodyData['ctl00$MainContent$BTloadData'];
                            arrBodyData.push({ ...bodyData });
                        }
                    }
                })
            }
        })

        if (arrBodyData.length > 0) {
            Promise.all(arrBodyData.map(bodyData => postDsachLop({ bodyData, cookies })))
            .then(resolve)
            .catch(reject)
        } else {
            reject({
                message: "No data for that className"
            })
        }
    })
}

function postDsachLop({ bodyData, cookies }) {
    return new Promise((resolve, reject) => {
        request(
            {
                url: "http://daotao.dut.udn.vn/sv/G_LopSH_DSach2.aspx",
                method: 'POST',
                headers: {
                    "Cookie": cookies,
                },
                formData: bodyData
            },
            (err, res, html) => {
                if (err) return reject(err);
                request(
                    {
                        url: "http://daotao.dut.udn.vn/sv/G_DSachLopSH2.aspx",
                        method: "GET",
                        headers: {
                            "Cookie": cookies,
                        },
                    },
                    (err, res, html) => {
                        if (err) return reject(err);
                        const $ = cheerio.load(html);
                        const users = [];
                        $('#MainContent_Grid1 tr').filter((key, value) => {
                            const user = {};
                            if (key == 0) return;
                            let dem = 0;
                            value.children.forEach((ele) => {
                                if (ele.name == 'td') {
                                    if (ele.children[0].children[0] && ele.children[0].children[0].type == 'text') {
                                        user[feildStudentName[dem]] = ele.children[0].children[0].data;
                                        dem++;
                                    }
                                }
                            })
                            users.push(user);
                        })

                        resolve(users);
                    }
                )
            }
        )
    })
}

function postToGetAllClass({ bodyData, cookies }) {
    return new Promise((resolve, reject) => {
        request(
            {
                url,
                method: 'POST',
                headers: {
                    "Cookie": cookies,
                },
                formData: bodyData
            },
            (error, res, html) => {
                if (error) return reject(error);
                const $ = cheerio.load(html);
                $('input[type=hidden]').filter((key, value) => {
                    bodyData = {
                        ...bodyData,
                        [value.attribs.name]: value.attribs.value
                    }
                })

                resolve({
                    bodyData,
                    cookies,
                    $,
                })
            }
        );
    })
}

function loadDataGetBodyDataAndCookies() {
    return new Promise((resolve, reject) => {
        request(url, function (error, response, html) {
            if (error) return reject(error);
            const $ = cheerio.load(html);
            let bodyData = {};
            $('input[type=hidden]').filter((key, value) => {
                bodyData = {
                    ...bodyData,
                    [value.attribs.name]: value.attribs.value
                }
            })

            bodyData = {
                ...bodyData,
                "ctl00$MainContent$DDkhoa": "Tất cả",
                "ctl00$MainContent$ScriptManager1": "ctl00$MainContent$UpdatePanel1|ctl00$MainContent$BTloadData",
                "ctl00$MainContent$CB1": "on",
                // "__ASYNCPOST": "true",
                "ctl00$MainContent$BTloadData": "Dữ liệu",
            };

            const cookies = response.headers['set-cookie'][0];

            resolve({
                bodyData,
                cookies
            })
        })
    })
}

module.exports = {
    getStudentsByClassName
}