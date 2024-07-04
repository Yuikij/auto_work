package com.soukon.domain;

import lombok.Data;

import java.util.List;

//聚合函数求值，得到的是具体的值
@Data
public class FunctionScript implements Script{
    private int functionType;
    private List<DataCell> dataCells;



    public List<Long> execute() {
        dataCells.forEach(e -> {

        });
        return null;
    }
}
