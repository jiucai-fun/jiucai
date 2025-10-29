package fun.jiucai.stock;

import com.zfoo.protocol.collection.ArrayListLong;
import com.zfoo.protocol.util.FileUtils;
import com.zfoo.protocol.util.NumberUtils;
import com.zfoo.protocol.util.StringUtils;
import fun.jiucai.stock.protocol.Stock;
import fun.jiucai.stock.protocol.StockExchange;
import org.junit.Ignore;
import org.junit.Test;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;

@Ignore
public class SelectStockTest {

    // 选择放量过后首次缩量的个股
    @Test
    public void test() throws Exception {
        var files = FileUtils.getAllReadableFiles(new File("./stocks"))
                .stream()
                .filter(it -> !it.getPath().contains("abnormal"))
                .sorted((a, b) -> b.compareTo(a))
                .toList();

        var stockMap = new HashMap<String, Stock>();
        for (var file : files) {
            var stocks = FileUtils.readFileToString(file);
            var splits = stocks.split(FileUtils.LS_REGEX);
            var fileName = file.getName();
            var date = StringUtils.substringBeforeLast(fileName, ".");

            for (int i = 1; i < splits.length; i++) {
                var row = splits[i];
                var cols = row.split(StringUtils.COMMA_REGEX);
                var code = StringUtils.trim(cols[0]);
                var name = cols[1];
                var price = cols[2];
                var exchange = toPrice(cols[5]);
                var amount = toPrice(cols[6]);
                if (price.equals("--")) {
                    continue;
                }
                var stock = stockMap.computeIfAbsent(code, it -> new Stock(code, name));
                stock.getExchanges().add(new StockExchange(Double.parseDouble(price), exchange, amount, date));
            }
        }

        var result = new ArrayList<String>();
        var startDay = 23;
        for (var entry : stockMap.entrySet()) {
            var code = entry.getKey();
            var stock = entry.getValue();
            var name = stock.getName();
            var stockExchanges = stock.getExchanges();
            var size = stockExchanges.size();

            // 排除北交所
            if (code.startsWith("9") || code.startsWith("8")) {
                continue;
            }
            // 排除ST
            if (name.toUpperCase().contains("ST")) {
                continue;
            }
            if (size < 60) {
                continue;
            }

            var exchanges = stockExchanges.stream().map(it -> it.getExchange()).toList();

            var average = (long) ((exchanges.get(startDay + 0) + exchanges.get(startDay + 2) + exchanges.get(startDay + 3)) / 3.0F);
            var last = exchanges.get(startDay + 1);
            if ((last - average) / (float) average > 2F) {
                result.add(code);
            }
        }

        System.out.println(files.get(startDay).getName());
        for (var code : result.stream().sorted().toList()) {
            var stock = stockMap.get(code);
            var name = stock.getName();
            var stockExchanges = stock.getExchanges();
            var exchanges = stockExchanges.stream().map(it -> it.getExchange()).toList();
            var priceBuilder = new StringBuilder();
            for (int i = startDay + 1; i > startDay - 10; i--) {
                if (i < 0) {
                    break;
                }
                var stockExchange = stockExchanges.get(i);
                var price = stockExchange.getPrice();
                priceBuilder.append(NumberUtils.decimalFormat("#.00", price)).append(StringUtils.SPACE);
            }

            System.out.println(StringUtils.format("{}   {}  {}", code, name, priceBuilder.toString()));
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
