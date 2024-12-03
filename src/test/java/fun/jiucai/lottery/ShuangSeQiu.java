package fun.jiucai.lottery;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.zfoo.monitor.util.OSUtils;
import com.zfoo.protocol.util.JsonUtils;
import com.zfoo.protocol.util.StringUtils;
import org.jsoup.Jsoup;
import org.junit.Ignore;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

@Ignore
public class ShuangSeQiu {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SsqResponse {
        public int state;
        public String message;
        public int total;
        public int pageNum;
        public int pageSize;
        public List<SsqData> result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SsqData {
        public String red;
        public String blue;
        public String blue2;
        public String date;
    }


    @Test
    public void selectTest() throws Exception {
        var url = "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayEnd=&pageNo=1&pageSize=10000&week=&systemType=PC";

        var command = StringUtils.format("node {} {}", "./spider/spider.mjs", url);
        var responseBody = OSUtils.execCommand(command);
        var document = Jsoup.parse(responseBody);
        responseBody = document.getElementsByTag("pre").text();

        var ssqResponse = JsonUtils.string2Object(responseBody, SsqResponse.class);

        var ballList = new ArrayList<String>();
        var redMap = new HashMap<Integer, Integer>();
        var blueMap = new HashMap<Integer, Integer>();
        for (var i = 1; i <= 33; i++) {
            redMap.put(i, 0);
        }
        for (var i = 1; i <= 16; i++) {
            blueMap.put(i, 0);
        }
        for (var data : ssqResponse.result) {
            var ball = StringUtils.trim(data.red) + StringUtils.trim(data.blue);
            var reds = Arrays.stream(data.red.split(StringUtils.COMMA_REGEX)).map(it -> Integer.parseInt(it)).toList();
            var blue = Integer.parseInt(data.blue);

            if (ballList.contains(ball)) {
                throw new Exception("重复号码");
            }

            ballList.add(ball);
            reds.forEach(it -> redMap.put(it, redMap.get(it) + 1));
            blueMap.put(blue, blueMap.get(blue) + 1);

        }

        System.out.println("红色球：----------------------------------------------");
        redMap.entrySet().stream().sorted((a, b) -> a.getValue() - b.getValue()).forEach(it -> System.out.println(it.getKey() + " - " + it.getValue()));
        System.out.println("蓝色球：----------------------------------------------");
        blueMap.entrySet().stream().sorted((a, b) -> a.getValue() - b.getValue()).forEach(it -> System.out.println(it.getKey() + " - " + it.getValue()));

        var myChoices = List.of(
                "03,16,21,28,30,33,13",
                "03,16,21,28,29,33,10",
                "04,16,21,28,30,33,05",
                "03,16,21,28,31,33,11",
                "03,16,21,24,30,33,02"
        );
        for (var choice : myChoices) {
            var myBall = choice.replaceAll(StringUtils.COMMA_REGEX, StringUtils.EMPTY);
            System.out.println(myBall);
            if (ballList.contains(myBall)) {
                throw new Exception("自选是重复号码");
            }
        }

    }

}
