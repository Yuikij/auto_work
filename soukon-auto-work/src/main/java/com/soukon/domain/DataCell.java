package com.soukon.domain;

import lombok.Data;

@Data
//可以是文件的数据集或者数据集的数据值
public class DataCell {
    private Long sourceId;
    private int rowIndex;
    private int columnIndex;
    private int index;
}
