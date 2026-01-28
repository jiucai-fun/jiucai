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
});


const page = await context.newPage();

try {
    await page.goto(url, {
        timeout: 30_000,
        waitUntil: 'domcontentloaded'
    });
} catch (error) {
}


// 反爬策略
try {
    await page.waitForLoadState('networkidle');
} catch (error) {
}
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


try {
    let html = await page.content(); // serialized HTML of page DOM.
    console.log(html);
} catch (error) {
    console.log('zfoo_error', error);
}

// Teardown
await page.close();
await context.close();
await browser.close();