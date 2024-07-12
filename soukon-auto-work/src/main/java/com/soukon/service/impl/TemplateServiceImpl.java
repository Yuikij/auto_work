package com.soukon.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.soukon.auth.domain.UserBO;
import com.soukon.auth.service.TokenService;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.Files;
import com.soukon.domain.Template;
import com.soukon.domain.VOS.DataCellVO;
import com.soukon.mapper.TemplateMapper;
import com.soukon.service.DataCellService;
import com.soukon.service.FileService;
import com.soukon.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class TemplateServiceImpl extends ServiceImpl<TemplateMapper, Template> implements TemplateService {
    @Autowired
    private DataCellService dataCellService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private FileService fileService;

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
    public ApiResponse<DataCellVO> templateExecute(List<MultipartFile> files, String templateId, String params) {
        JSONObject jsonObject = JSONObject.parseObject(params);
        List<Files> list = fileService.list(Wrappers.lambdaQuery(Files.class).eq(Files::getTemplateId, templateId));
        fileService.getMapStream(files, list);
        return execute(Long.parseLong(templateId), jsonObject);
    }

    @Override
    public ApiResponse<Object> templateAdd(Template template) {
        UserBO user = tokenService.getUser();
        template.setUserId(user.getUserid());
        save(template);
        return ApiResponse.success("保存成功");
    }


    @Override
    public ApiResponse<Template> templateList(int type) {
        UserBO user = tokenService.getUser();
        LambdaQueryWrapper<Template> wrapper = Wrappers.lambdaQuery(Template.class);
        wrapper.eq(Template::getType, type).eq(Template::getUserId, user.getUserid());
        List<Template> list = list(wrapper);
        return ApiResponse.<Template>success().list(list);
    }

}
