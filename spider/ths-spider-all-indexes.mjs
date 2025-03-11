import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Papa from 'papaparse';
import fs from 'fs';


import {delay} from './websocket.mjs';

const loginUrl = "https://q.10jqka.com.cn/";

puppeteer.use(StealthPlugin());

// Launch the browser and open a new blank page
const browser = await puppeteer.launch(
    {
        headless: false,
        userDataDir: './userData/mybrowser'
    }
);

const context = browser.defaultBrowserContext();
await context.overridePermissions(loginUrl, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

// 登录同花顺
const loginThs = async () => {
    const pages = await browser.pages();
    const page = pages[0];
    await page.goto(loginUrl, {waitUntil: 'networkidle0'});

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

function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，需要加1
    const day = now.getDate().toString().padStart(2, '0');

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}年${month}月${day}日 ${hours}时${minutes}分${seconds}秒`;
}

const spiderOptions = async (optionIndex, date) => {
    const page = await browser.newPage();

    while (true)
    {
        try {
            const urlIF = `https://data.10jqka.com.cn/gzqh/index/instrumentId/IF${optionIndex}/maxDate/${date}/`;
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

            const urlIC = `https://data.10jqka.com.cn/gzqh/index/instrumentId/IC${optionIndex}/maxDate/${date}/`;
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

            const urlIH = `https://data.10jqka.com.cn/gzqh/index/instrumentId/IH${optionIndex}/maxDate/${date}/`;
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


try {
    await loginThs();

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

    await spiderIndexes("2503", formatTime);
    console.log("任务结束时间：" + new Date())
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(1);