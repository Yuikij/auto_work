package com.soukon.domain;

import lombok.Data;

@Data
public class DataValue {
    private Long id;
//  只能选择具体的值或者函数
//   可以数据集或者某列某行或者具体的值
//    1. "A.sum(c2->r4:r5),B.C3:C6"
//    2. "A.c2*B.c3+B.c5r6+D.1"

//    1. "A.sum(c2->r4:r5)+B.C3:C6"
//    2. "A.c2*B.c3+B.c5r6+D.1"
    private Script script;
    private String name;

}
