package com.soukon.domain;

import lombok.Data;

import java.util.List;

@Data
public class Template {
    private Long id;
    private Long userId;
    private String name;
    //    文件1数据2
    private int type;
    private Long fileTemplateId;
    private Long dataTemplateId;
}
