package com.soukon.service;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.extension.service.IService;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.Template;
import com.soukon.domain.VOS.DataCellVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TemplateService extends IService<Template> {
    ApiResponse<DataCellVO> execute(Long templateId, JSONObject params);

    ApiResponse<DataCellVO> templateExecute(List<MultipartFile> files, String templateId, String params);

    ApiResponse<Object> templateAdd(Template template);


    ApiResponse<Template> templateList(int type);

    ApiResponse<Template> templateEdit(Template template);

    ApiResponse<Template> templateDel(String templateId);
}
