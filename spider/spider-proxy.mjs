import {connect} from "puppeteer-real-browser";
import {KnownDevices} from "puppeteer";
import config from "./config.json" with { type: 'json' };

const url = process.argv[2];
const mobile = process.argv[3];

const iPhone = KnownDevices['iPhone 15 Pro'];
let {browser, page} = await connect({
    headless: false,

    args: ['--start-maximized', '--no-sandbox', '--proxy-server=127.0.0.1:10809'],

    customConfig: {
        userDataDir: config.userDataDir
    },

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

if (mobile) {
    await page.emulate(iPhone);
}

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