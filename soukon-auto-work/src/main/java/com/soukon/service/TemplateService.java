package com.soukon.service;

import com.alibaba.fastjson.JSONObject;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.VOS.DataCellVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TemplateService {
    ApiResponse<DataCellVO> execute(Long templateId, JSONObject params);

    ApiResponse<Object> templateExecute(List<MultipartFile> files, String templateId, String params);
}
