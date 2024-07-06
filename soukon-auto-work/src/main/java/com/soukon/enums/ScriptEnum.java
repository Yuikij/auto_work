package com.soukon.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ScriptEnum {
    GROUP(1,"分组"),
    FUNCTION(2,"函数"),
    OPERATION(3,"运算"),
    ;

    final int value;
    final String desc;
}
