package fun.jiucai.packet;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author godotg
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorChatAnswer {

    private long requestId;

    private String simulator;

    private String markdown;

}
