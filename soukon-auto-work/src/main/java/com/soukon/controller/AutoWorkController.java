package com.soukon.controller;

import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.Files;
import com.soukon.domain.Template;
import com.soukon.domain.VOS.DataCellVO;
import com.soukon.domain.VOS.FilesTemplateVO;
import com.soukon.domain.VOS.FilesVO;
import com.soukon.service.DataCellService;
import com.soukon.service.FileService;
import com.soukon.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class AutoWorkController {

    @Autowired
    private TemplateService templateService;
    @Autowired
    private FileService fileService;
    @Autowired
    private DataCellService dataCellService;

    //    创建文件模板
    @PostMapping("/files/add")
    public ApiResponse<Object> filesAdd(@RequestBody Template template) {
        template.setType(1);
        return templateService.templateAdd(template);
    }

    //    编辑文件模板
    @PostMapping("/files/edit")
    public ApiResponse<Object> filesEdit(@RequestBody List<Files> files, @RequestParam("templateId") String templateId) {
        return fileService.templateEdit(files, templateId);
    }

    //    查询模板列表
    @PostMapping("/template/list")
    public ApiResponse<Template> templateList(@RequestParam("type") int type) {
        return templateService.templateList(type);
    }

    //    查询文件模板详情
    @PostMapping("/files/get")
    public ApiResponse<Files> filesGet(@RequestParam("templateId") String templateId) {
        return fileService.filesGet(templateId);
    }

    //    创建数据模板
    @PostMapping("/template/add")
    public ApiResponse<Object> templateAdd(@RequestBody Template template) {
        template.setType(2);
        return templateService.templateAdd(template);
    }

    //    编辑数据模板
    @PostMapping("/template/edit")
    public ApiResponse<Object> templateEdit(@RequestBody List<DataCell> dataCells, @RequestParam("templateId") String templateId) {
        return dataCellService.templateEdit(dataCells, templateId);
    }

    //    查询数据模板
    @PostMapping("/template/get")
    public ApiResponse<DataCell> templateGet(@RequestParam("templateId") String templateId) {
        return dataCellService.templateGet(templateId);
    }

    //    执行数据模板
    @PostMapping("/template/execute")
    public ApiResponse<DataCellVO> templateExecute(@RequestParam(value = "files") List<MultipartFile> files, @RequestParam("templateId") String templateId, @RequestParam(value = "params") String params) {
        return templateService.templateExecute(files, templateId, params);
    }

}
