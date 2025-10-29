package fun.jiucai.stock.protocol;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockExchange {

    private double price;
    private long exchange;
    private long amount;
    private String date;

}
