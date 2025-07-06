import {connect} from "puppeteer-real-browser";

const url = process.argv[2];

let {browser, page} = await connect({
    headless: false,

    args: ['--start-maximized', '--no-sandbox', '--proxy-server=127.0.0.1:10809'],

    customConfig: {},

    turnstile: true,

    connectOption: {
        defaultViewport: null,
    },

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

try {
    await page.goto(url, {waitUntil: 'networkidle0'});
} catch (error) {
    console.log('zfoo_error wait', error);
}

try {
    const html = await page.content(); // serialized HTML of page DOM.
    console.log(html);
} catch (error) {
    console.log('zfoo_error', error);
}

await page.close();
await browser.close();