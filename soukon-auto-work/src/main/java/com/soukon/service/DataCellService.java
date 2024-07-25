package com.soukon.service;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.extension.service.IService;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;

import java.util.List;

public interface DataCellService extends IService<DataCell> {
    List<Double> getValue(DataCell dataCell, JSONObject params);
    ApiResponse<Object> templateDataEdit(List<DataCell> dataCells, String templateId);

    ApiResponse<DataCell> templateGet(String templateId);

    ApiResponse<Object> templateDataDel(Long dataCellId);

    ApiResponse<Object> templateDataAdd(DataCell dataCell, Long templateId);

    ApiResponse<Object> dataEdit(DataCell dataCell);
}
