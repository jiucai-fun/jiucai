import puppeteer from 'puppeteer';

const url = process.argv[2];


// Launch the browser and open a new blank page
const browser = await puppeteer.launch(
    {
        headless: true,
        args: ['--no-sandbox', '--proxy-server=127.0.0.1:10809'] // ubuntu环境需要这个配置
    }
);

const context = browser.defaultBrowserContext();
await context.overridePermissions(url, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
const pages = await browser.pages();

try {
    const page = pages[0];
    await page.goto(url, {waitUntil: 'networkidle0'});
    const html = await page.content(); // serialized HTML of page DOM.
    console.log(html);
} catch (error) {
    console.log('zfoo_error', error);
} finally {
    await browser.close();
}