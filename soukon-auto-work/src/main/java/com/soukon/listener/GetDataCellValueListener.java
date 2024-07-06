package com.soukon.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;

import java.util.Map;

public class GetDataCellValueListener extends AnalysisEventListener<Map<Integer, String>> {
    @Override
    public void invoke(Map<Integer, String> integerStringMap, AnalysisContext analysisContext) {

    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {

    }
}
