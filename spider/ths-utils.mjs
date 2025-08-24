import {connect} from "puppeteer-real-browser";
import {delay} from './websocket.mjs';

const loginUrl = "https://q.10jqka.com.cn/";

// 登录同花顺
export const loginThs = async (page) => {
    await page.goto(loginUrl, {waitUntil: 'networkidle0'});

    // 如果是周一记得提示重新登录，因为同花顺的cookie有效期1周
    const date = new Date();
    if (date.getDay() === 1) {
        for (let i = 0; i < 18; i++) {
            console.warn("同花顺的cookie有效期1周，周一记得重新登录同花顺账号");
            await delay(1000);
        }
    }

    // 如果没有登录按钮则表示已经登录成功
    while (true) {
        const loginHideButton = await page.$('>>> [class="login-box hide"]');
        if (loginHideButton != null) {
            console.info("同花顺账号已登录！！！！！！！");
            return;
        }
        console.error("请登录同花顺账号");
        await delay(5 * 1000);
    }
}