package com.soukon.service.impl;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.Files;
import com.soukon.listener.GetDataCellValueListener;
import com.soukon.mapper.FilesMapper;
import com.soukon.service.FileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

@Service
@Slf4j
public class FileServiceImpl extends ServiceImpl<FilesMapper, Files> implements FileService {
    public static final ThreadLocal<Map<Long, InputStream>> threadLocalMap = ThreadLocal.withInitial(HashMap::new);

    //todo 支持压缩和结构化文件
    public void getMapStream(List<MultipartFile> multipartFiles, List<Files> files) {
        files.forEach(e -> {
            multipartFiles.forEach(multipartFile -> {
                if (e.getName().equals(multipartFile.getOriginalFilename())) {
                    try {
                        threadLocalMap.get().put(e.getId(), multipartFile.getInputStream());
                    } catch (IOException ex) {
                        log.error("解析文件出错", ex);
                    }
                }
            });
        });
    }

    @Override
    public List<Double> getValue(DataCell dataCell) {
        Map<Long, InputStream> inputStreamMap = threadLocalMap.get();
        Long sourceId = dataCell.getSourceId();
        List<Double> res = new ArrayList<>();
//        ReentrantLock lock = new ReentrantLock();
//        Condition condition = lock.newCondition();
//        try {
//            lock.lock();
//            condition.await();
//        } catch (InterruptedException e) {
//            log.error("等待解析文件出错", e);
//        } finally {
//            lock.unlock();
//        }
        InputStream inputStream = inputStreamMap.get(sourceId);
        EasyExcel.read(inputStream, new GetDataCellValueListener(dataCell, res)).sheet(dataCell.getSheet()).doRead();
        return res;
    }

    @Override
    public ApiResponse<Files> filesGet(String templateId) {
        List<Files> list = list(Wrappers.lambdaQuery(Files.class).eq(Files::getTemplateId, templateId));
        return ApiResponse.<Files>success("查询成功").list(list);
    }

    @Override
    public ApiResponse<Object> templateEdit(List<Files> files, String templateId) {
        remove(Wrappers.lambdaQuery(Files.class).eq(Files::getTemplateId, templateId));
        files.forEach(file -> {
            file.setTemplateId(Long.parseLong(templateId));
        });
        saveBatch(files);
        return ApiResponse.success("修改成功");
    }
}
