package com.soukon.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("a")
public class DatabaseTestBean {
    int f1;
    int f2;
    String  test;
}
