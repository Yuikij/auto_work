package com.soukon.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("script")
public class Script {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Integer operatorType = 0; // 操作类型
    private Long leftId;  // 左操作数ID
    private Long rightId; // 右操作数ID
    private Double leftValue;  // 左操作数值
    private Double rightValue; // 右操作数值
    private String operator; // 操作符
    
    @TableLogic
    private Boolean deleted = false;
    
    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    
    @TableField(fill = FieldFill.UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;
}