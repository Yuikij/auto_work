package com.soukon.domain;

import lombok.Data;

import java.util.List;

@Data
public class FunctionScript {
    private int functionType;
    private List<DataCell> dataCells;
    private int startIndex;
    private int endIndex;
}
