import {chromium} from 'playwright';

const url = process.argv[2];

const options = {
    args: ['--start-maximized'],
    channel: 'chrome',
    headless: false
}

if (process.argv[3]) {
    options.proxy = {
        server: 'http://127.0.0.1:10809'
    };
}

// Setup
const browser = await chromium.launch(options);

const context = await browser.newContext({
    viewport: null,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
});


const page = await context.newPage();
await page.goto(url);


// 反爬策略
await page.waitForLoadState('networkidle');
await page.waitForTimeout(300 + Math.random() * 700);

// 接受cookie
try {
    const cookieButton = await page.$('.accept-all');
    if (cookieButton != null) {
        await cookieButton.click();
        await page.waitForTimeout(300 + Math.random() * 700);
    }
} catch (error) {
}

await page.mouse.wheel(0, 600);


const html = await page.content(); // serialized HTML of page DOM.
console.log(html);

// Teardown
await page.close();
await context.close();
await browser.close();