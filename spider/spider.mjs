import {connect} from "puppeteer-real-browser";
import {KnownDevices} from 'puppeteer';
import config from "./config.json" with { type: 'json' };
const iPhone = KnownDevices['iPhone 15 Pro'];



const url = process.argv[2];
const mobile = process.argv[3];
const frame = process.argv[4];

let {browser, page} = await connect({
    headless: false,

    args: ['--start-maximized', '--no-sandbox'],

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
// await context.overridePermissions(url, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

try {
    await page.goto(url, {waitUntil: 'networkidle0'});
} catch (error) {
    console.log('zfoo_error wait', error);
}

try {
    let html = await page.content(); // serialized HTML of page DOM.

    // 遍历所有 iframe，提取它们的内容
    if (frame) {
        if (page.frames()) {
            for (let iframe of page.frames()) {
                const frameContent = await iframe.content();
                if (frameContent) {
                    html += frameContent;
                }
            }
        }
    }

    console.log(html);
} catch (error) {
    console.log('zfoo_error', error);
}

await page.close();
await browser.close();