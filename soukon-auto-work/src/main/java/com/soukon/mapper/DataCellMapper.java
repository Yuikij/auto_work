package com.soukon.mapper;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.soukon.domain.DataCell;
import com.soukon.domain.DatabaseTestBean;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface DataCellMapper extends BaseMapper<DataCell> {

}
