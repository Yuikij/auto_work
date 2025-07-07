package com.soukon.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("template")
public class Template {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String name;
    private String description;
    private Integer type = 0; // 0-数据模板, 1-文件模板
    private String content; // 模板内容，存储为JSON字符串
    private Integer status = 1; // 状态：1-正常，0-禁用
    
    @TableLogic
    private Boolean deleted = false;
    
    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    
    @TableField(fill = FieldFill.UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;
}