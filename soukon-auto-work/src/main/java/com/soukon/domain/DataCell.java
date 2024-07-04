package com.soukon.domain;

import lombok.Data;

import java.util.List;

@Data
// script和sourceId只会存在一种
public class DataCell {
    private long id;
    private String name;
    //    通过sourceId找到对应的文件或者数据集
    //    文件直接读
    //    数据集或数据值的话，先计算
    private Long sourceId;
    //    文件的情况
    private int rowIndex;
    private int columnIndex;
    private String sheet;
    //    数据集的某个值
    private int index;
    //    脚本的情况
    private Script script;
    private String scriptJsonStr;
    //   用于截取
    private int startIndex;
    private int endIndex;
    private boolean isRes;
    private long templateId;


    public List<Long> getValueBeGetIndex() {
        if (this.script != null) {
            return this.script.execute();
        }
        return null;
    }

    public List<Long> getValueBeSub() {
        if (this.script != null) {
            return this.script.execute();
        }
        return null;
    }

    public List<Long> getValue() {
        if (this.script != null) {
            return this.script.execute();
        }
        return null;
    }
}
