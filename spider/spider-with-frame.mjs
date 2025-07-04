import {connect} from "puppeteer-real-browser";

const url = process.argv[2];

let {browser, page} = await connect({
    headless: false,

    args: ['--start-maximized'],

    customConfig: {},

    turnstile: true,

    connectOption: {},

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
await context.overridePermissions(url, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
await page.setViewport({
    width: 1920,
    height: 1080
});

try {
    await page.goto(url, {waitUntil: 'networkidle0'});
} catch (error) {
    console.log('zfoo_error wait', error);
}

try {
    let html = await page.content(); // serialized HTML of page DOM.
    // 遍历所有 iframe，提取它们的内容
    if (page.frames()) {
        for (let iframe of page.frames()) {
            const frameContent = await iframe.content();
            if (frameContent) {
                html += frameContent;
            }
        }
    }
    console.log(html);
} catch (error) {
    console.log('zfoo_error', error);
}

await page.close();
await browser.close();