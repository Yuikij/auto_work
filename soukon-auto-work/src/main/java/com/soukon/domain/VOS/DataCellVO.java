package com.soukon.domain.VOS;

import com.soukon.domain.Script;
import lombok.Data;

import java.util.List;

@Data

public class DataCellVO {
    private Long id;
    private String name;
    private List<Double> value;

}
