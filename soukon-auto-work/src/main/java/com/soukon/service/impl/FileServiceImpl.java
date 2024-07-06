package com.soukon.service.impl;

import com.soukon.domain.DataCell;
import com.soukon.service.FileService;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class FileServiceImpl implements FileService {
    @Override
    public List<Double> getValue(DataCell dataCell) {
        return List.of();
    }

    public List<Double> getValue(DataCell dataCell, Map<Long, InputStream> inputStreamMap) {
        Long sourceId = dataCell.getSourceId();
        InputStream inputStream = inputStreamMap.get(sourceId);
        return List.of();
    }
}
