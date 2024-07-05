package com.soukon.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DataCellEnum {
    FILE(1,"文件"),
    SCRIPT(2,"计算"),
    DATA(3,"数据单元"),
    ;

    final int value;
    final String desc;

}
