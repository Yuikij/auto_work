package com.soukon.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.DatabaseTestBean;

import java.util.List;

public interface DataCellService extends IService<DataCell> {
    List<Double> getValue(DataCell dataCell);
    ApiResponse<Object> saveDataCell(DataCell dataCell);
    ApiResponse<DataCell> listDataCell(Long templateId);
}
