package com.soukon.domain;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.List;


@Data
@Slf4j
public class Script {
    private int scriptType;
    private List<String> operationScript;
    private List<DataCell> dataCells;

}
