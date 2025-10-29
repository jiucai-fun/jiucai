package fun.jiucai.stock;

import com.zfoo.monitor.util.OSUtils;
import com.zfoo.net.NetContext;
import com.zfoo.net.core.HostAndPort;
import com.zfoo.net.core.websocket.WebsocketSslClient;
import com.zfoo.protocol.collection.ArrayListLong;
import com.zfoo.protocol.util.FileUtils;
import com.zfoo.protocol.util.JsonUtils;
import com.zfoo.protocol.util.StringUtils;
import com.zfoo.protocol.util.ThreadUtils;
import com.zfoo.scheduler.util.TimeUtils;
import fun.jiucai.stock.protocol.Market;
import fun.jiucai.stock.protocol.SaveMarketAnswer;
import fun.jiucai.stock.protocol.SaveMarketAsk;
import io.netty.handler.codec.http.websocketx.WebSocketClientProtocolConfig;
import org.junit.Ignore;
import org.junit.Test;
import org.springframework.context.support.ClassPathXmlApplicationContext;

import java.io.File;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;

/**
 * @author jaysunxiao
 */
@Ignore
public class MarketTest {

    private static final String MARKET_CSV_FILE_DIR = "./stocks";

    public long toPrice(String price) {
        var p = 0L;
        if (price.endsWith("万")) {
            p = (long) (Double.parseDouble(StringUtils.substringBeforeFirst(price, "万")) * 1_0000);
        } else if (price.endsWith("亿")) {
            p = (long) (Double.parseDouble(StringUtils.substringBeforeFirst(price, "亿")) * 1_0000_0000);
        }
        return p;
    }

    @Test
    public void saveMarket() throws Exception {
        var result = OSUtils.execCommand("node ths-spider-all.mjs", "./spider");
        System.out.println(result);
        System.out.println("------------------------------------------------------------------------------------------");
        ThreadUtils.sleep(3000);

        var context = new ClassPathXmlApplicationContext("application-test.xml");
        var webSocketClientProtocolConfig = WebSocketClientProtocolConfig.newBuilder().webSocketUri("wss://ws.xxx.com").build();
        var client = new WebsocketSslClient(HostAndPort.valueOf("ws.xxx.com:443"), webSocketClientProtocolConfig);

//        var webSocketClientProtocolConfig = WebSocketClientProtocolConfig.newBuilder().webSocketUri("ws://127.0.0.1:19001/websocket").build();
//        var client = new WebsocketClient(HostAndPort.valueOf("127.0.0.1:19001"), webSocketClientProtocolConfig);

        var session = client.start();

        var files = FileUtils.getAllReadableFiles(new File(MARKET_CSV_FILE_DIR))
                .stream()
                .filter(it -> !"abnormal".equals(it.getParentFile().getName()))
                .toList();
        var markets = new ArrayList<Market>();
        for (var file : files) {
            var stocks = FileUtils.readFileToString(file);
            var splits = stocks.split(FileUtils.LS_REGEX);

            var date = TimeUtils.dayStringToDate(StringUtils.substringBeforeLast(file.getName(), ".csv"));
            var stockNum = splits.length - 1;
            var stockNum0 = 0;
            var stockNumNeg005 = 0;
            var stockNumNeg10 = 0;
            var totalPrice = 0L;
            var marketIndex = 0L;
            var shMarketIndex = 0L;
            var kcMarketIndex = 0L;
            var szMarketIndex = 0L;
            var cyMarketIndex = 0L;
            var bjMarketIndex = 0L;
            var exchange = 0L;
            var amount = 0L;
            var shExchange = 0L;
            var shAmount = 0L;
            var kcExchange = 0L;
            var kcAmount = 0L;
            var szExchange = 0L;
            var szAmount = 0L;
            var cyExchange = 0L;
            var cyAmount = 0L;
            var bjExchange = 0L;
            var bjAmount = 0L;

            for (int i = 1; i < splits.length; i++) {
                var row = splits[i];
                var cols = row.split(StringUtils.COMMA_REGEX);
                var code = StringUtils.trim(cols[0]);
                var name = cols[1];
                var stockAmount = toPrice(cols[6]);
                amount += stockAmount;

                if (code.startsWith("60")) {
                    shAmount += stockAmount;
                } else if (code.startsWith("688")) {
                    kcAmount += stockAmount;
                } else if (code.startsWith("8") || code.startsWith("9")) {
                    bjAmount += stockAmount;
                } else if (code.startsWith("0")) {
                    szAmount += stockAmount;
                } else if (code.startsWith("3")) {
                    cyAmount += stockAmount;
                }

                if (!name.contains("银行")) {
                    marketIndex += stockAmount;
                    if (code.startsWith("60")) {
                        shMarketIndex += stockAmount;
                    } else if (code.startsWith("688")) {
                        kcMarketIndex += stockAmount;
                    } else if (code.startsWith("8") || code.startsWith("9")) {
                        bjMarketIndex += stockAmount;
                    } else if (code.startsWith("0")) {
                        szMarketIndex += stockAmount;
                    } else if (code.startsWith("3")) {
                        cyMarketIndex += stockAmount;
                    }
                }

                if (cols[2].contains("--")) {
                    stockNum0++;
                    continue;
                }

                var stockPrice = Integer.parseInt(cols[2].replaceAll(StringUtils.PERIOD_REGEX, StringUtils.EMPTY));
                var rise = Float.parseFloat(cols[3]);
                var change = Float.parseFloat(cols[4]);
                var stockExchange = toPrice(cols[5]);

                if (rise >= 0) {
                    stockNum0++;
                    stockNumNeg005++;
                    stockNumNeg10++;
                } else if (rise >= -0.5) {
                    stockNumNeg005++;
                    stockNumNeg10++;
                } else if (rise >= -1) {
                    stockNumNeg10++;
                }

                totalPrice += stockPrice;
                exchange += stockExchange;

                if (code.startsWith("60")) {
                    shExchange += stockExchange;
                } else if (code.startsWith("688")) {
                    kcExchange += stockExchange;
                } else if (code.startsWith("8") || code.startsWith("9")) {
                    bjExchange += stockExchange;
                } else if (code.startsWith("0")) {
                    szExchange += stockExchange;
                } else if (code.startsWith("3")) {
                    cyExchange += stockExchange;
                }
            }

            var market = new Market(date.getTime(), stockNum, stockNum0, stockNumNeg005, stockNumNeg10, totalPrice
                    , marketIndex, shMarketIndex, kcMarketIndex, szMarketIndex, cyMarketIndex, bjMarketIndex
                    , exchange, amount
                    , shExchange, shAmount, kcExchange, kcAmount, szExchange, szAmount, cyExchange, cyAmount, bjExchange, bjAmount);
            markets.add(market);
        }

        System.out.println(StringUtils.format("total size:[{}]", markets.size()));


        var myMarkets = markets.stream().sorted(Comparator.comparingLong(Market::getDate)).toList();
        var answer = NetContext.getRouter().syncAsk(session, new SaveMarketAsk(myMarkets), SaveMarketAnswer.class, null).packet();
        System.out.println(JsonUtils.object2String(answer));

        ThreadUtils.sleep(3000);
    }


    @Test
    public void compare() throws Exception {
        var files = FileUtils.getAllReadableFiles(new File(MARKET_CSV_FILE_DIR));
        var markets = new ArrayList<Market>();
        for (var file : files) {
            var stocks = FileUtils.readFileToString(file);
            var splits = stocks.split(FileUtils.LS_REGEX);

            var date = TimeUtils.dayStringToDate(StringUtils.substringBeforeLast(file.getName(), ".csv"));
            var stockNum = splits.length - 1;
            var stockNum0 = 0;
            var stockNumNeg005 = 0;
            var stockNumNeg10 = 0;
            var totalPrice = 0L;
            var marketIndex = 0L;
            var shMarketIndex = 0L;
            var kcMarketIndex = 0L;
            var szMarketIndex = 0L;
            var cyMarketIndex = 0L;
            var bjMarketIndex = 0L;
            var exchange = 0L;
            var amount = 0L;
            var shExchange = 0L;
            var shAmount = 0L;
            var kcExchange = 0L;
            var kcAmount = 0L;
            var szExchange = 0L;
            var szAmount = 0L;
            var cyExchange = 0L;
            var cyAmount = 0L;
            var bjExchange = 0L;
            var bjAmount = 0L;

            for (int i = 1; i < splits.length; i++) {
                var row = splits[i];
                var cols = row.split(StringUtils.COMMA_REGEX);
                var code = StringUtils.trim(cols[0]);
                var name = cols[1];
                var stockAmount = toPrice(cols[6]);
                amount += stockAmount;

                if (code.startsWith("60")) {
                    shAmount += stockAmount;
                } else if (code.startsWith("688")) {
                    kcAmount += stockAmount;
                } else if (code.startsWith("8") || code.startsWith("9")) {
                    bjAmount += stockAmount;
                } else if (code.startsWith("0")) {
                    szAmount += stockAmount;
                } else if (code.startsWith("3")) {
                    cyAmount += stockAmount;
                }

                if (!name.contains("银行")) {
                    marketIndex += stockAmount;
                    if (code.startsWith("60")) {
                        shMarketIndex += stockAmount;
                    } else if (code.startsWith("688")) {
                        kcMarketIndex += stockAmount;
                    } else if (code.startsWith("8") || code.startsWith("9")) {
                        bjMarketIndex += stockAmount;
                    } else if (code.startsWith("0")) {
                        szMarketIndex += stockAmount;
                    } else if (code.startsWith("3")) {
                        cyMarketIndex += stockAmount;
                    }
                }

                if (cols[2].contains("--")) {
                    stockNum0++;
                    continue;
                }

                var stockPrice = Integer.parseInt(cols[2].replaceAll(StringUtils.PERIOD_REGEX, StringUtils.EMPTY));
                var rise = Float.parseFloat(cols[3]);
                var change = Float.parseFloat(cols[4]);
                var stockExchange = toPrice(cols[5]);

                if (rise >= 0) {
                    stockNum0++;
                    stockNumNeg005++;
                    stockNumNeg10++;
                } else if (rise >= -0.5) {
                    stockNumNeg005++;
                    stockNumNeg10++;
                } else if (rise >= -1) {
                    stockNumNeg10++;
                }

                totalPrice += stockPrice;
                exchange += stockExchange;

                if (code.startsWith("60")) {
                    shExchange += stockExchange;
                } else if (code.startsWith("688")) {
                    kcExchange += stockExchange;
                } else if (code.startsWith("8") || code.startsWith("9")) {
                    bjExchange += stockExchange;
                } else if (code.startsWith("0")) {
                    szExchange += stockExchange;
                } else if (code.startsWith("3")) {
                    cyExchange += stockExchange;
                }
            }

            var market = new Market(date.getTime(), stockNum, stockNum0, stockNumNeg005, stockNumNeg10, totalPrice
                    , marketIndex, shMarketIndex, kcMarketIndex, szMarketIndex, cyMarketIndex, bjMarketIndex
                    , exchange, amount
                    , shExchange, shAmount, kcExchange, kcAmount, szExchange, szAmount, cyExchange, cyAmount, bjExchange, bjAmount);
            markets.add(market);
        }

        System.out.println(StringUtils.format("total size:[{}]", markets.size()));

        var webSocketClientProtocolConfig = WebSocketClientProtocolConfig.newBuilder().webSocketUri("wss://ws.jiucai.fun/").build();
        var client = new WebsocketSslClient(HostAndPort.valueOf("ws.jiucai.fun:443"), webSocketClientProtocolConfig);

//        var webSocketClientProtocolConfig = WebSocketClientProtocolConfig.newBuilder().webSocketUri("ws://127.0.0.1:19001/websocket").build();
//        var client = new WebsocketClient(HostAndPort.valueOf("127.0.0.1:19001"), webSocketClientProtocolConfig);

        var session = client.start();

        var myMarkets = markets.stream().sorted(Comparator.comparingLong(Market::getDate)).toList();
        var answer = NetContext.getRouter().syncAsk(session, new SaveMarketAsk(myMarkets), SaveMarketAnswer.class, null).packet();
        System.out.println(JsonUtils.object2String(answer));

        ThreadUtils.sleep(3000);
    }

}
