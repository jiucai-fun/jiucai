package fun.jiucai.lottery;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.zfoo.monitor.util.OSUtils;
import com.zfoo.protocol.util.JsonUtils;
import com.zfoo.protocol.util.StringUtils;
import lombok.*;
import org.jsoup.Jsoup;
import org.junit.Assert;
import org.junit.Ignore;
import org.junit.Test;

import java.util.*;

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

    @Data
    @ToString
    @EqualsAndHashCode
    @NoArgsConstructor
    public static class SsqSimpleData {
        public List<Integer> reds = new ArrayList<>();
        public int blue;

        public SsqSimpleData(List<Integer> reds, int blue) {
            this.reds.addAll(reds);
            this.blue = blue;
            Collections.sort(this.reds);
        }

        public void addSort(int red) {
            reds.add(red);
            Collections.sort(reds);
        }

        public int duplicate(SsqSimpleData other) {
            var count = 0;
            for (var red : reds) {
                if (other.reds.contains(red)) {
                    count++;
                }
            }
            if (blue == other.blue) {
                count++;
            }
            return count;
        }
    }

    @AllArgsConstructor
    @ToString
    public static class SsqRank {
        public int number;
        public int count;
        public int rank;
    }


    @Test
    public void selectTest() throws Exception {
        // 爬取历史所有开奖记录
        var url = "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayEnd=&pageNo=1&pageSize=10000&week=&systemType=PC";

        var command = StringUtils.format("node {} {}", "./spider/spider.mjs", url);
        var responseBody = OSUtils.execCommand(command);
        var document = Jsoup.parse(responseBody);
        responseBody = document.getElementsByTag("pre").text();

        var ssqResponse = JsonUtils.string2Object(responseBody, SsqResponse.class);

        var redMap = new HashMap<Integer, SsqRank>();
        var blueMap = new HashMap<Integer, SsqRank>();
        // 将开奖结果转为数字int
        var ssqSimpleDataList = new ArrayList<SsqSimpleData>();
        // 统计红球出现的概率
        for (var i = 1; i <= 33; i++) {
            redMap.put(i, new SsqRank(i, 0, 0));
        }
        // 统计蓝球出现的概率
        for (var i = 1; i <= 16; i++) {
            blueMap.put(i, new SsqRank(i, 0, 0));
        }
        SsqSimpleData firstSsqSimpleData = null;
        for (var ssq : ssqResponse.result) {
            var reds = Arrays.stream(ssq.red.split(StringUtils.COMMA_REGEX)).map(it -> Integer.parseInt(it)).toList();
            var blue = Integer.parseInt(ssq.blue);

            // 统计是否有重复的开奖记录，大概率是没有的
            var ssqSimpleData = new SsqSimpleData(reds, blue);
            if (ssqSimpleDataList.contains(ssqSimpleData)) {
                throw new Exception("重复号码");
            }
            ssqSimpleDataList.add(ssqSimpleData);

            if (firstSsqSimpleData == null) {
                firstSsqSimpleData = ssqSimpleData;
            }

            for(var red : reds) {
                var redSsqData = redMap.get(red);
                redSsqData.count++;
            }

            var blueSsqData = blueMap.get(blue);
            blueSsqData.count++;
        }
        var redSortList = redMap.entrySet().stream().sorted((a, b) -> a.getValue().count - b.getValue().count).map(it -> it.getValue()).toList();
        var blueSortList = blueMap.entrySet().stream().sorted((a, b) -> a.getValue().count - b.getValue().count).map(it -> it.getValue()).toList();
        for (int i = 0; i < redSortList.size(); i++) {
            redSortList.get(i).rank = i + 1;
        }
        for (int i = 0; i < blueSortList.size(); i++) {
            blueSortList.get(i).rank = i + 1;
        }

        // 最近一次开奖的号码和上一次开奖有重复的次数
        var duplicate1 = 0;
        // 最近一次开奖的号码和前两次开奖有重复的次数
        var duplicate2 = 0;
        // 最近一次开奖的号码和前三次开奖有重复的次数
        var duplicate3 = 0;
        for (int i = 0; i < ssqSimpleDataList.size() - 3; i++) {
            var current = ssqSimpleDataList.get(i);
            var last1 = ssqSimpleDataList.get(i + 1);
            var last2 = ssqSimpleDataList.get(i + 2);
            var last3 = ssqSimpleDataList.get(i + 3);
            duplicate1 += current.duplicate(last1);
            duplicate2 += current.duplicate(last1);
            duplicate2 += current.duplicate(last2);
            duplicate3 += current.duplicate(last1);
            duplicate3 += current.duplicate(last2);
            duplicate3 += current.duplicate(last3);
        }
        System.out.println("最近一次开奖的号码和最近开奖有重复的次数：----------------------------------------------");
        System.out.println(StringUtils.format("总次数[{}]", ssqSimpleDataList.size()));
        System.out.println(StringUtils.format("最近一次[{}]", duplicate1));
        System.out.println(StringUtils.format("最近两次[{}]", duplicate2));
        System.out.println(StringUtils.format("最近三次[{}]", duplicate3));

        System.out.println("红色球出现次数：----------------------------------------------");
        redMap.entrySet().stream().sorted((a, b) -> a.getValue().count - b.getValue().count).forEach(it -> System.out.println(it.getKey() + " - " + it.getValue()));
        System.out.println("蓝色球出现次数：----------------------------------------------");
        blueMap.entrySet().stream().sorted((a, b) -> a.getValue().count - b.getValue().count).forEach(it -> System.out.println(it.getKey() + " - " + it.getValue()));

        // 移除最上一期的数字，小概率出现两期同样的号码
        var firstReds = firstSsqSimpleData.reds;
        var firstBlue = firstSsqSimpleData.blue;
        var selectReds = redSortList.stream().filter(it -> !firstReds.contains(it.number)).toList();
        var selectBlue = blueSortList.stream().filter(it -> it.number != firstBlue).toList();

        var myChoices = new ArrayList<SsqSimpleData>();
        for (int i = 0, select = 0; i < 5; i++, select++) {
            // 选择一个红色球
            var red1 = selectReds.get(select).number;
            var red2 = selectReds.get(select + 1).number;
            var red3 = selectReds.get(select + 2).number;
            var red4 = selectReds.get(select + 3).number;
            var red5 = selectReds.get(select + 4).number;
            var red6 = selectReds.get(select + 5).number;
            var blue = selectBlue.get(select).number;
            var ssqSimpleData = new SsqSimpleData(List.of(red1, red2, red3, red4, red5, red6), blue);
            myChoices.add(ssqSimpleData);
        }

        System.out.println(JsonUtils.object2StringPrettyPrinter(myChoices));
    }

    @Test
    public void selectTest2() throws Exception {
        var a = new SsqSimpleData(List.of(1, 100, Integer.MAX_VALUE), 3);
        var b = new SsqSimpleData(List.of(1, 100, Integer.MAX_VALUE, 2), 3);
        a.addSort(2);
        Assert.assertEquals(a, b);

        var list = List.of(a);
        Assert.assertTrue(list.contains(b));
    }

}
