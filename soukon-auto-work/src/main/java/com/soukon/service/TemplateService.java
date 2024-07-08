package com.soukon.service;

import com.alibaba.fastjson.JSONObject;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.VOS.DataCellVO;

public interface TemplateService {
    ApiResponse<DataCellVO> execute(Long templateId, JSONObject params);
}
