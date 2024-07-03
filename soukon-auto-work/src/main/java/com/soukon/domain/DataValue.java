package com.soukon.domain;

import lombok.Data;

@Data
public class DataValue {
    private Long id;
//  只能选择具体的值或者函数
    private String script;
    private String name;
}
