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
        await delay(5 * 1000)
    }
}

const spiderStocks = async () => {
    const page = await browser.newPage();

    try {
        const url = `https://data.10jqka.com.cn/gzqh/`;
        await page.goto(url, {waitUntil: 'networkidle0'});
        const ddIFTBody = await page.$('>>> [class="gzqh-block fl"]');
        const option = await page.evaluate(it => {
            const doudanTbody = document.getElementsByClassName("gzqh-block fl")[4].getElementsByTagName("tbody");
            console.log(doudanTbody)
            const longIF = doudanTbody.rows[doudanTbody.rows.length - 1].firstElementChild.innerHTML;
            console.log(longIF);
            return {
                longIf: longIF
            };
        });
    } catch (e) {
        console.error(e);
    }

}
try {
    await loginThs();
    await spiderStocks();
    console.log("-----------------------------------------------------------------------------------------------------");
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(1);