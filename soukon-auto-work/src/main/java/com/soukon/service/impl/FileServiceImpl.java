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
import com.soukon.utils.HtmlParser;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.poifs.filesystem.FileMagic;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
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
    public static final ThreadLocal<Map<Long, byte[]>> threadLocalMap = ThreadLocal.withInitial(HashMap::new);

    //todo 支持压缩和结构化文件
    public void getMapStream(List<MultipartFile> multipartFiles, List<Files> files) {
        files.forEach(e -> {
            multipartFiles.forEach(multipartFile -> {
                if (e.getName().equals(multipartFile.getOriginalFilename())) {
                    try {
                        InputStream inputStream = multipartFile.getInputStream();
                        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                        try {
                            inputStream.transferTo(byteArrayOutputStream);
                            // Get the content as a byte array
                            byte[] content = byteArrayOutputStream.toByteArray();
                            threadLocalMap.get().put(e.getId(), content);
                        } catch (IOException ex) {
                            throw new RuntimeException(ex);
                        }


                    } catch (IOException ex) {
                        log.error("解析文件出错", ex);
                    }
                }
            });
        });
    }

    @Override
    public List<Double> getValue(DataCell dataCell) {
        Map<Long, byte[]> inputStreamMap = threadLocalMap.get();
        Long sourceId = dataCell.getSourceId();
        List<Double> res = new ArrayList<>();
        byte[] content = inputStreamMap.get(sourceId);
        // 获取文件头的前8个字节
        byte[] header = new byte[8];
        System.arraycopy(content, 0, header, 0, 8);
        String fileSignature = bytesToHex(header);
        log.info("fileSignature:{}",FileMagic.valueOf(header));
//        System.out.println(FileMagic.valueOf(header));
        // Create new input streams from the byte array
        InputStream inputStreamCopy = new ByteArrayInputStream(content);

        if (FileMagic.UNKNOWN.equals(FileMagic.valueOf(header))){
            HtmlParser htmlParser = new HtmlParser(dataCell, res);
            try {
                htmlParser.parseHtml(inputStreamCopy);
            } catch (IOException e) {
               log.error("解析文件失败");
            }
        }else {
            EasyExcel.read(inputStreamCopy, new GetDataCellValueListener(dataCell, res)).sheet(dataCell.getSheet()).doRead();

        }
          return res;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
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
