package com.soukon.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.Files;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService extends IService<Files> {
    List<Double> getValue(DataCell dataCell);

    ApiResponse<Files> filesGet(String templateId);

    ApiResponse<Object> templateEdit(List<Files> files, String templateId);

   void getMapStream(List<MultipartFile> multipartFiles, List<Files> files);
}
