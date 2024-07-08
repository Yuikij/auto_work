package com.soukon.domain;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName(value = "data_cell", autoResultMap = true)
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
    //    数据集的某个值,优先级比start end高
    private Integer selectIndex;
    //    脚本的情况
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Script script;
    //   用于截取
    private Integer startIndex;
    private Integer endIndex;
    //    是否是最终结果
    private boolean isRes;
    //    所属的模板id
    private long templateId;
    //具体数值
    private double specificValue;
    //    参数名
    private String paramName;
    private int type;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    @TableField(fill = FieldFill.UPDATE)
    private LocalDateTime updatedTime;

}
