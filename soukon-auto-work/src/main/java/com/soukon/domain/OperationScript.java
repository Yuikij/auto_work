package com.soukon.domain;

import lombok.Data;

import java.util.List;

@Data
public class OperationScript {
    List<DataCell> dataCells;
    String script;
}
