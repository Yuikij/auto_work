package com.soukon.domain;

import lombok.Data;

import java.util.List;

@Data
public class Template {
    private Long id;
    private Long userId;
    private String name;
    private List<DataCell> dataCells;
}
