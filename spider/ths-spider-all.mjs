import {connect} from "puppeteer-real-browser";
import Papa from 'papaparse';
import fs from 'fs';


import {delay} from './websocket.mjs';

const loginUrl = "https://q.10jqka.com.cn/";

// Launch the browser and open a new blank page

let {browser, page} = await connect({
    headless: false,
    args: ['--start-maximized', '--no-sandbox'],
    customConfig: {
        chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        userDataDir: "C:\\Users\\sunquanxiao\\AppData\\Local\\Google\\Chrome\\User Data"
    },

    turnstile: true,

    connectOption: {
        defaultViewport: null,
    },

    disableXvfb: false,
    ignoreAllFlags: false,
    // proxy:{
    //     host:'<proxy-host>',
    //     port:'<proxy-port>',
    //     username:'<proxy-username>',
    //     password:'<proxy-password>'
    // }
});
const context = browser.defaultBrowserContext();
await context.overridePermissions(loginUrl, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
// 登录同花顺
const loginThs = async () => {
    await page.goto(loginUrl, {waitUntil: 'networkidle0'});

    // 如果是周一记得提示重新登录，因为同花顺的cookie有效期1周
    const date = new Date();
    if (date.getDay() === 1) {
        for (let i = 0; i < 18; i++) {
            console.warn("同花顺的cookie有效期1周，周一记得重新登录同花顺账号");
            await delay(1000);
        }
    }

    // 如果没有登录按钮则表示已经登录成功
    while (true) {
        const loginHideButton = await page.$('>>> [class="login-box hide"]');
        if (loginHideButton != null) {
            console.warn("同花顺账号已登录！！！！！！！");
            return;
        }
        console.error("请登录同花顺账号");
        await delay(5 * 1000);
    }
}

const spiderStocks = async () => {
    // 记录函数开始时间
    let startTime = performance.now();
    const page = await browser.newPage();

    const stocks = [];
    let i = 1;
    while (i < 888) {
        try {
            const url = `https://q.10jqka.com.cn/index/index/board/all/field/dm/order/desc/page/${i}/ajax/1/`;
            await page.goto(url, {waitUntil: 'networkidle0'});
            const outStocks = await page.evaluate(it => {
                const tbody = document.getElementsByTagName("tbody")[0];
                let innerStocks = [];
                for (let row of tbody.rows) {
                    innerStocks.push({
                        code: row.children[1].firstElementChild.innerHTML,
                        name: row.children[2].firstElementChild.innerHTML,
                        price: row.children[3].innerHTML,
                        rise: row.children[4].innerHTML,
                        change: row.children[5].innerHTML,
                        exchange: row.children[10].innerHTML,
                        amount: row.children[12].innerHTML,
                    });
                }
                console.log(innerStocks);
                return innerStocks;
            });
            // 已经爬完
            if (outStocks.length === 0) {
                break
            }
            outStocks.forEach(it => stocks.push(it));
            console.log(`进度->${stocks.length}`);
            i++;
            await delay(1000);
        } catch (e) {
            console.error(e);
            await delay(5000);
        }
    }
    console.log(`股票爬取成功 count:[${stocks.length}]`);

    // 年月日
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const dateString = year + '-' + month + '-' + day;

    const csv = Papa.unparse(stocks);
    fs.writeFileSync(`../stocks/${dateString}.csv`, csv);
    console.log(`写入文件股票->${stocks.length}`)

    // 记录函数结束时间
    let endTime = performance.now();
    // 计算函数运行时间
    let runTime = endTime - startTime;
    console.log(`Function execution time: ${runTime} milliseconds`);
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
const spiderIndexes = async (optionIndex, date) => {
    // 记录函数开始时间
    let startTime = performance.now();
    const page = await browser.newPage();

    const stocks = await spiderOptions(optionIndex, date);
    let i = 1;
    while (i < 100) {
        try {
            const url = `https://q.10jqka.com.cn/zs/index/field/indexcode/order/asc/page/${i}/ajax/1/`;
            await page.goto(url, {waitUntil: 'networkidle0'});
            const outStocks = await page.evaluate(it => {
                const tbody = document.getElementsByTagName("tbody")[0];
                let innerStocks = [];
                for (let row of tbody.rows) {
                    innerStocks.push({
                        code: row.children[1].firstElementChild.innerHTML,
                        name: row.children[2].firstElementChild.innerHTML,
                        index: row.children[3].innerHTML,
                    });
                }
                console.log(innerStocks);
                return innerStocks;
            });
            // 已经爬完
            if (outStocks.length === 0) {
                break
            }
            outStocks.forEach(it => stocks.push(it));
            console.log(`进度->${stocks.length}`);
            i++;
            await delay(1000);
        } catch (e) {
            console.error(e);
            await delay(5000);
        }
    }
    console.log(`指数爬取成功 count:[${stocks.length}]`);

    // 年月日
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const dateString = year + '-' + month + '-' + day;

    const csv = Papa.unparse(stocks);
    fs.writeFileSync(`../indexes/${dateString}.csv`, csv);
    console.log(`写入文件指数->${stocks.length}`)

    // 记录函数结束时间
    let endTime = performance.now();
    // 计算函数运行时间
    let runTime = endTime - startTime;
    console.log(`Function execution time: ${runTime} milliseconds`);
}


const spiderOptions = async (optionIndex, date) => {
    const page = await browser.newPage();

    while (true)
    {
        try {
            const urlIF = `https://data.10jqka.com.cn/gzqh/index/instrumentId/IF${optionIndex}`;
            await page.goto(urlIF, {waitUntil: 'networkidle0'});
            const resultIF = await page.evaluate(it => {
                const ifDivs = document.getElementsByClassName("gzqh-block");

                const ddDiv = ifDivs[4];
                const ddName = ddDiv.querySelector(".hd").innerText;
                console.log(ddName)
                const ddRows = ddDiv.querySelector("tbody").rows;
                const ddCount = ddRows[ddRows.length - 2].querySelector("span").innerText;
                console.log(ddCount);

                const kdDiv = ifDivs[5];
                const kdName = kdDiv.querySelector(".hd").innerText;
                console.log(kdName)
                const kdRows = kdDiv.querySelector("tbody").rows;
                const kdCount = kdRows[kdRows.length - 2].querySelector("span").innerText;
                console.log(kdCount);
                return [
                    {
                        code: 777000,
                        name: ddName,
                        index: ddCount
                    },
                    {
                        code: 777001,
                        name: kdName,
                        index: kdCount
                    }
                ]
            });
            if (resultIF[0].index == "")
            {
                console.log(`${new Date()}-等待10分钟，重新爬取期权`);
                await page.goto("https://www.bing.com", {waitUntil: 'networkidle0'});
                await delay(10 * 60 * 1000);
                continue;
            }

            const urlIC = `https://data.10jqka.com.cn/gzqh/index/instrumentId/IC${optionIndex}`;
            await page.goto(urlIC, {waitUntil: 'networkidle0'});
            const resultIC = await page.evaluate(it => {
                const ifDivs = document.getElementsByClassName("gzqh-block");

                const ddDiv = ifDivs[4];
                const ddName = ddDiv.querySelector(".hd").innerText;
                console.log(ddName)
                const ddRows = ddDiv.querySelector("tbody").rows;
                const ddCount = ddRows[ddRows.length - 2].querySelector("span").innerText;
                console.log(ddCount);

                const kdDiv = ifDivs[5];
                const kdName = kdDiv.querySelector(".hd").innerText;
                console.log(kdName)
                const kdRows = kdDiv.querySelector("tbody").rows;
                const kdCount = kdRows[kdRows.length - 2].querySelector("span").innerText;
                console.log(kdCount);
                return [
                    {
                        code: 777010,
                        name: ddName,
                        index: ddCount
                    },
                    {
                        code: 777011,
                        name: kdName,
                        index: kdCount
                    }
                ]
            });

            const urlIH = `https://data.10jqka.com.cn/gzqh/index/instrumentId/IH${optionIndex}`;
            await page.goto(urlIH, {waitUntil: 'networkidle0'});
            const resultIH = await page.evaluate(it => {
                const ifDivs = document.getElementsByClassName("gzqh-block");

                const ddDiv = ifDivs[4];
                const ddName = ddDiv.querySelector(".hd").innerText;
                console.log(ddName)
                const ddRows = ddDiv.querySelector("tbody").rows;
                const ddCount = ddRows[ddRows.length - 2].querySelector("span").innerText;
                console.log(ddCount);

                const kdDiv = ifDivs[5];
                const kdName = kdDiv.querySelector(".hd").innerText;
                console.log(kdName)
                const kdRows = kdDiv.querySelector("tbody").rows;
                const kdCount = kdRows[kdRows.length - 2].querySelector("span").innerText;
                console.log(kdCount);
                return [
                    {
                        code: 777020,
                        name: ddName,
                        index: ddCount
                    },
                    {
                        code: 777021,
                        name: kdName,
                        index: kdCount
                    }
                ]
            });

            for (const result of resultIH) {
                console.log(`上证50-${result.name}: ${result.index}`);
            }
            for (const result of resultIF) {
                console.log(`沪深300-${result.name}: ${result.index}`);
            }
            for (const result of resultIC) {
                console.log(`中证500-${result.name}: ${result.index}`);
            }

            await page.close();

            let array = resultIH.concat(resultIF);
            array = array.concat(resultIC);

            return array;
        } catch (e) {
            console.error(e);
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------


try {
    await loginThs();

    // 爬取股票
    await spiderStocks();

    // 爬取指数
    // --------------------------------------------------------------------------
    let today = new Date();
    let year = today.getFullYear();
    let day = today.getDate();
    let month = today.getMonth() + 1;

    // +1是因为getMonth()函数返回的月份是从0开始的，所以需要加1
    // '0'这里是确保如果某位数小于10时，他前面会自动补0， 如：假设日期是10号，new String(-).padStart(2, '0')后变为"010"，完成空位的补全
    month = month.toString().padStart(2, '0');
    day = day.toString().padStart(2, '0');
    let formatTime = year + month + day;
    // let formatTime = "20250115";
    await spiderIndexes("2507", formatTime);
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(1);