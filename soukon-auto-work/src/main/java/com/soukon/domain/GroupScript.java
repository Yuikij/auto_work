package com.soukon.domain;

import lombok.Data;

import java.util.List;

//重组，得到的是long数组
@Data
public class GroupScript implements Script{
    private List<DataCell> dataCells;

    @Override
    public List<Long> execute() {
        return List.of();
    }
}
