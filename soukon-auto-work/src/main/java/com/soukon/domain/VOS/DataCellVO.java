package com.soukon.domain.VOS;

import com.soukon.domain.Script;
import lombok.Data;

import java.util.List;

@Data

public class DataCellVO {
    private long id;
    private String name;
    private List<Long> value;

}
