package fun.jiucai.stock;

import com.zfoo.monitor.util.OSUtils;
import org.junit.Ignore;
import org.junit.Test;

@Ignore
public class SpiderTest {

    @Test
    public void test() {
        var result = OSUtils.execCommand("node ./spider/playwright-spider.mjs https://www.bloomberg.com/asia proxy");
        System.out.println(result);
    }

}
