import {connect} from "puppeteer-real-browser";
import Papa from 'papaparse';
import fs from 'fs';
import { loginThs } from './ths-utils.mjs';
import {delay} from './websocket.mjs';
import config from "./config.json" with { type: 'json' };


// Launch the browser and open a new blank page

let {browser, page} = await connect({
    headless: false,
    args: ['--start-maximized', '--no-sandbox'],
    customConfig: {
        userDataDir: config.userDataDir,
        logLevel: 'verbose'
    },

    turnstile: true,

    connectOption: {
        defaultViewport: null,
    },

    disableXvfb: false,
    ignoreAllFlags: false,
});

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
const spiderIndexes = async () => {
    while (true) {
        const now = new Date();
        const hour = now.getHours(); // 获取小时 (0 - 23)
        if (hour >= 17) {
            console.log("已经超过下午 5 点");
            break;
        } else {
            console.log(`${new Date()}-等待到下午5点钟，重新爬取期权`);
            await delay(10 * 60 * 1000);
            continue;
        }
    }

    // 记录函数开始时间
    let startTime = performance.now();
    const page = await browser.newPage();

    const stocks = await spiderOptions();
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
            const urlIF = `https://data.10jqka.com.cn/gzqh`;
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
            for (const result of resultIF) {
                console.log(`沪深300-${result.name}: ${result.index}`);
            }

            await page.close();
            return resultIF;
        } catch (e) {
            console.error(e);
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------


try {
    await loginThs(page);

    // 爬取股票
    await spiderStocks();

    // 爬取指数
    await spiderIndexes();
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(0);