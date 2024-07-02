package com.soukon.domain;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("files")
public class Files {
    private Long id;
    private Long userId;
    private Long parentId;
    private String name;
    @TableField(exist = false)
    private List<Files> subFiles;
    private int type;
    private int zipType;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    @TableField(fill = FieldFill.UPDATE)
    private LocalDateTime updatedTime;
}
