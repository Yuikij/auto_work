package com.soukon.domain;

import lombok.Data;

import java.util.List;

@Data

public class DataSet {
   private List<Long> sourceIds;
//   可以数据集或者某列某行或者具体的值
//    1. "A.sum(c2->r4:r5),B.C3:C6"
//    2. "A.c2*B.c3+B.c5r6+D.1"
   private String script;
//   聚合还是函数
   private int type;
}
