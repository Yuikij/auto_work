package com.soukon.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.soukon.bean.DatabaseTestBean;
import com.soukon.mapper.DataBaseTestMapper;
import com.soukon.service.DatabaseTestService;
import org.springframework.stereotype.Service;

@Service
public class DatabaseTestServiceImpl extends ServiceImpl<DataBaseTestMapper, DatabaseTestBean> implements DatabaseTestService {
}
