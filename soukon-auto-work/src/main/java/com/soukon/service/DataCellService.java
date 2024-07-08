package com.soukon.service;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.extension.service.IService;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;

import java.util.List;

public interface DataCellService extends IService<DataCell> {
    List<Double> getValue(DataCell dataCell, JSONObject params);
    ApiResponse<Object> saveDataCell(DataCell dataCell);
    ApiResponse<DataCell> listDataCell(Long templateId);
}
