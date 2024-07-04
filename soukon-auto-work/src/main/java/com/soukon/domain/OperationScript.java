package com.soukon.domain;

import lombok.Data;

import java.util.List;
//公式求值
@Data
public class OperationScript implements Script{
    List<DataCell> dataCells;
    String script;

    @Override
    public List<Long> execute() {
        return List.of();
    }
}
