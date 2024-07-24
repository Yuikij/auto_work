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


    //    创建文件模板
    @PostMapping("/template/files/add")
    public ApiResponse<Object> filesAdd(@RequestBody Template template) {
        template.setType(1);
        return templateService.templateAdd(template);
    }

    //    编辑文件模板
    @PostMapping("/files/edit")
    public ApiResponse<Object> filesEdit(@RequestBody List<Files> files, @RequestParam("fileTemplateId") String templateId) {
        return fileService.templateEdit(files, templateId);
    }


    //    根据文件模板id查询文件模板详情
    @PostMapping("/files/get")
    public ApiResponse<Files> filesGet(@RequestParam("fileTemplateId") String fileTemplateId) {
        return fileService.filesGet(fileTemplateId);
    }



    //    查询模板列表
    @PostMapping("/template/list")
    public ApiResponse<Template> templateList(@RequestParam("type") int type,@RequestParam(value = "dataTemplateId",required = false) Long dataTemplateId) {
        return templateService.templateList(type,dataTemplateId);
    }

    //    编辑模板列表
    @PostMapping("/template/edit")
    public ApiResponse<Template> templateEdit(@RequestBody Template template) {
        return templateService.templateEdit(template);
    }

    @PostMapping("/template/del")
    public ApiResponse<Template> templateDel(@RequestParam("templateId") String templateId) {
        return templateService.templateDel(templateId);
    }

    //    创建数据模板
    @PostMapping("/template/add")
    public ApiResponse<Object> templateAdd(@RequestBody Template template) {
        return templateService.templateAdd(template);
    }

    //    执行模板
    @PostMapping("/template/execute")
    public ApiResponse<DataCellVO> templateExecute(@RequestParam(value = "files") List<MultipartFile> files, @RequestParam("templateId") String templateId, @RequestParam(value = "params") String params) {
        return templateService.templateExecute(files, templateId, params);
    }

}
