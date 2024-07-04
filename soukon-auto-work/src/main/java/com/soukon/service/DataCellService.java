package com.soukon.service;

import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;

public interface DataCellService {
    ApiResponse<Object> saveDataCell(DataCell dataCell);
    ApiResponse<DataCell> listDataCell(Long templateId);
}
