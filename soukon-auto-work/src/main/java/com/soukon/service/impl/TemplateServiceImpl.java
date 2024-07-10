package com.soukon.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.VOS.DataCellVO;
import com.soukon.service.DataCellService;
import com.soukon.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class TemplateServiceImpl implements TemplateService {
    @Autowired
    private DataCellService dataCellService;

    @Override
    public ApiResponse<DataCellVO> execute(Long templateId, JSONObject params) {
        LambdaQueryWrapper<DataCell> wrapper = Wrappers.lambdaQuery(DataCell.class);
        wrapper.eq(DataCell::getTemplateId, templateId).eq(DataCell::isRes, true);
        List<DataCell> list = dataCellService.list(wrapper);
        List<DataCellVO> res = list.stream().map(e -> {
            List<Double> value = dataCellService.getValue(e, params);
            DataCellVO dataCellVO = new DataCellVO();
            dataCellVO.setId(e.getId());
            dataCellVO.setName(e.getName());
            dataCellVO.setValue(value);
            return dataCellVO;
        }).toList();
        DataCellServiceImpl.threadLocalMap.remove();
        return ApiResponse.<DataCellVO>success().list(res);
    }

    @Override
    public ApiResponse<Object> templateExecute(List<MultipartFile> files, String templateId, String params) {
        return null;
    }
}
