package com.soukon.controller;

import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.service.DataCellService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DataCellController {
    @Autowired
    private DataCellService dataCellService;

    //    编辑数据模板
    @PostMapping("/template/data/edit")
    public ApiResponse<Object> templateDataEdit(@RequestBody List<DataCell> dataCells, @RequestParam("templateId") String templateId) {
        return dataCellService.templateDataEdit(dataCells, templateId);
    }


    //    编辑数据模板
    @PostMapping("/data/edit")
    public ApiResponse<Object> dataEdit(@RequestBody DataCell dataCell) {
        return dataCellService.dataEdit(dataCell);
    }

    //   删除数据模板
    @PostMapping("/data/del")
    public ApiResponse<Object> templateDataDel(@RequestParam("dataCellId") Long dataCellId) {
        return dataCellService.templateDataDel(dataCellId);
    }

    //   添加数据模板
    @PostMapping("/data/add")
    public ApiResponse<Object> templateDataAdd(@RequestBody DataCell dataCell, @RequestParam("templateId") Long templateId) {
        return dataCellService.templateDataAdd(dataCell, templateId);
    }

    //    查询数据模板详情
    @PostMapping("/data/get")
    public ApiResponse<DataCell> templateGet(@RequestParam("templateId") String templateId) {
        return dataCellService.templateGet(templateId);
    }

}
