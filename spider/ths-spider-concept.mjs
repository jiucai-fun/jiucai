import {connect} from "puppeteer-real-browser";
import { loginThs } from './ths-utils.mjs';
import {delay} from './websocket.mjs';
import config from "./config.json" with { type: 'json' };


const concept = process.argv[2];

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

const spiderConcepts = async () => {
    // 记录函数开始时间
    let startTime = performance.now();
    const page = await browser.newPage();

    let i = 1;
    while (i < 888) {
        try {
            const url = concept.startsWith("3")
                ? `http://q.10jqka.com.cn/gn/detail/field/264648/order/desc/page/${i}/ajax/1/code/${concept}`
                : `http://q.10jqka.com.cn/thshy/detail/field/199112/order/desc/page/${i}/ajax/1/code/${concept}`;

            await page.goto(url, {waitUntil: 'networkidle0'});
            const outStocks = await page.evaluate(it => {
                const tbody = document.getElementsByTagName("tbody")[0];
                let innerStocks = [];
                for (let row of tbody.rows) {
                    innerStocks.push(row.children[1].firstElementChild.innerHTML);
                }
                return innerStocks;
            });
            // 已经爬完
            if (outStocks.length === 0) {
                break
            }
            outStocks.forEach(it => console.log(`${concept},${it}`));
            i++;
            await delay(1000);
        } catch (e) {
            console.error(e);
            await delay(5000);
        }
    }
}

try {
    await loginThs(page);

    // 爬取股票
    await spiderConcepts();
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    const pages = await browser.pages();
    pages.forEach(it => it.close());
    await browser.close();
}

process.exit(1);