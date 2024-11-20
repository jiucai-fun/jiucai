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
        console.warn("请登录同花顺账号");
        await delay(5 * 1000)
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
            await delay(3000);
        } catch (e) {
            console.error(e);
        }
    }
    console.log(`爬取成功 count:[${stocks.length}]`);

    // 年月日
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const dateString = year + '-' + month + '-' + day;

    const csv = Papa.unparse(stocks);
    fs.writeFileSync(`../stocks/${dateString}.csv`, csv);
    console.log(`写入文件->${stocks.length}`)

    // 记录函数结束时间
    let endTime = performance.now();
    // 计算函数运行时间
    let runTime = endTime - startTime;
    console.log(`Function execution time: ${runTime} milliseconds`);
}


try {
    await loginThs();
    await spiderStocks();
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(1);