package com.soukon.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("files")
public class Files {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId = 1L; // 离线版本固定用户ID
    private Long parentId;
    private Long templateId;
    private String name;
    private String path; // 文件路径
    private Integer type = 0;
    private Integer zipType = 0;
    private Long fileSize = 0L; // 文件大小
    
    @TableLogic
    private Boolean deleted = false;
    
    @TableField(exist = false)
    private List<Files> subFiles;
    
    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdTime;
    
    @TableField(fill = FieldFill.UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedTime;
}