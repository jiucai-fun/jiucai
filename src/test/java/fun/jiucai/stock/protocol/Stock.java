package fun.jiucai.stock.protocol;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class Stock {

    private String code;
    private String name;
    private List<StockExchange> exchanges = new ArrayList<StockExchange>();

    public Stock(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
