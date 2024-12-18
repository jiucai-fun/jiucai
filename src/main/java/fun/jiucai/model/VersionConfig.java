package fun.jiucai.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.zfoo.protocol.util.StringUtils;
import lombok.Data;

/**
 * @author godotg
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class VersionConfig {

    private String version = StringUtils.EMPTY;
    private String updateUrl = StringUtils.EMPTY;

}
