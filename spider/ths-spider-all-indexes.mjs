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

const spiderOptions = async (optionIndex, date) => {
    const page = await browser.newPage();

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
        console.log(resultIF);

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
        console.log(resultIC);

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
        console.log(resultIH);

        await page.close();

        let array = resultIF.concat(resultIC);
        array = array.concat(resultIH);

        return array;
    } catch (e) {
        console.error(e);
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

    await spiderIndexes("2501", formatTime);
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(1);