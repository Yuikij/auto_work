package com.soukon.domain;

import lombok.Data;

import java.util.List;

//重组，得到的是long数组
@Data
public class Script {
    private int scriptType;
    private String operationScript;
    private List<DataCell> dataCells;


    public List<Long> execute() {
        return List.of();
    }
}
