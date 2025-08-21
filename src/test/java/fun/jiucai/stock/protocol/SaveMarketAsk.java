package fun.jiucai.stock.protocol;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author jaysunxiao
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveMarketAsk {

    private List<Market> markets;

}
