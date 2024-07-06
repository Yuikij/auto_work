package com.soukon.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.soukon.core.http.ApiResponse;
import com.soukon.domain.DataCell;
import com.soukon.domain.Script;
import com.soukon.enums.DataCellEnum;
import com.soukon.mapper.DataCellMapper;
import com.soukon.service.DataCellService;
import com.soukon.service.FileService;
import com.soukon.service.ScriptService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class DataCellServiceImpl extends ServiceImpl<DataCellMapper, DataCell> implements DataCellService {

    @Autowired
    private ScriptService scriptService;

    @Autowired
    private FileService fileService;

    @Override
    public List<Double> getValue(DataCell dataCell) {
        int type = dataCell.getType();
        Script script = dataCell.getScript();
        if (DataCellEnum.FILE.getValue() == type) {
            return fileService.getValue(dataCell);
        } else if (DataCellEnum.SCRIPT.getValue() == type) {
            return scriptService.execute(script);
        } else if (DataCellEnum.DATA.getValue() == type) {
            return getDataValue(dataCell);
//            todo
        } else if (DataCellEnum.PARAM.getValue() == type) {
            return List.of(1.0);
        } else if (DataCellEnum.VAL.getValue() == type) {
            return List.of(dataCell.getSpecificValue());
        }
        return List.of();
    }

    public List<Double> getDataValue(DataCell dataCell) {
        Long sourceId = dataCell.getSourceId();
        DataCell data = getById(sourceId);
        List<Double> value = getValue(data);
        if (data.getSelectIndex() != null) {
            return Collections.singletonList(value.get(data.getSelectIndex()));
        }
        if (data.getStartIndex() != null && data.getEndIndex() != null) {
            return value.subList(data.getStartIndex() - 1, data.getEndIndex());
        }
        return value;
    }

    @Override
    public ApiResponse<Object> saveDataCell(DataCell dataCell) {
        return null;
    }

    @Override
    public ApiResponse<DataCell> listDataCell(Long templateId) {
        return null;
    }

    public ApiResponse<DataCell> oneDataCell(Long dataCellId) {
        return ApiResponse.success(new DataCell());
    }
}
