package fun.jiucai.stock;

import com.zfoo.protocol.collection.ArrayListLong;
import com.zfoo.protocol.util.FileUtils;
import com.zfoo.protocol.util.StringUtils;
import org.junit.Ignore;
import org.junit.Test;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;

@Ignore
public class SelectStockTest {

    @Test
    public void test() throws Exception {
        var files = FileUtils.getAllReadableFiles(new File("./stocks"))
                .stream()
                .filter(it -> !it.getPath().contains("abnormal"))
                .sorted((a, b) -> b.compareTo(a))
                .toList();

        var map = new HashMap<String, ArrayListLong>();
        var codeNameMap = new HashMap<String, String>();
        for (var file : files) {
            var stocks = FileUtils.readFileToString(file);
            var splits = stocks.split(FileUtils.LS_REGEX);

            for (int i = 1; i < splits.length; i++) {
                var row = splits[i];
                var cols = row.split(StringUtils.COMMA_REGEX);
                var code = StringUtils.trim(cols[0]);
                var name = cols[1];
                var stockExchange = toPrice(cols[5]);
                var list = map.computeIfAbsent(code, it -> new ArrayListLong(files.size()));
                list.add(stockExchange);
                codeNameMap.put(code, name);
            }
        }

        var result = new ArrayList<String>();
        for (var entry : map.entrySet()) {
            var code = entry.getKey();
            var list = entry.getValue();
            var size = list.size();
            if (size < 10) {
                continue;
            }
            var average = (long) ((list.get(1) + list.get(2) + list.get(3)) / 3.0F);
            var last = list.get(0);
            if ((last - average) / (float) average > 2F) {
                result.add(code);
            }
        }

        for (var code : result.stream().sorted().toList()) {
            var name = codeNameMap.get(code);
            System.out.println(StringUtils.format("{}   {}", code, name));
        }
    }

    public long toPrice(String price) {
        var p = 0L;
        if (price.endsWith("万")) {
            p = (long) (Double.parseDouble(StringUtils.substringBeforeFirst(price, "万")) * 1_0000);
        } else if (price.endsWith("亿")) {
            p = (long) (Double.parseDouble(StringUtils.substringBeforeFirst(price, "亿")) * 1_0000_0000);
        }
        return p;
    }

}
