package com.soukon.service.impl;

import com.soukon.domain.DataCell;
import com.soukon.service.FileService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FileServiceImpl implements FileService {
    @Override
    public List<Double> getValue(DataCell dataCell) {
        return List.of();
    }
}
