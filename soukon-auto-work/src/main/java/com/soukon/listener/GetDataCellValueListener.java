package com.soukon.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.soukon.domain.DataCell;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class GetDataCellValueListener extends AnalysisEventListener<Map<Integer, String>> {

    private final DataCell dataCell;
    private final ReentrantLock lock;
    private final Condition condition;
    private final List<Double> res;

    public GetDataCellValueListener(DataCell dataCell, ReentrantLock lock, Condition condition, List<Double> res) {
        this.dataCell = dataCell;
        this.lock = lock;
        this.condition = condition;
        this.res = res;
    }

    @Override
    public void invoke(Map<Integer, String> data, AnalysisContext analysisContext) {
        if (dataCell.getColumnIndex() != null && dataCell.getRowIndex() != null) {
            Integer rowIndex = analysisContext.readRowHolder().getRowIndex();
            if (Objects.equals(rowIndex, dataCell.getRowIndex())) {
                res.add(Double.parseDouble(data.get(dataCell.getColumnIndex())));
                returnRes();
            }
            return;
        }

        if (dataCell.getColumnIndex() != null) {
            if (dataCell.getEndIndex() != null && dataCell.getStartIndex() != null) {
                Integer rowIndex = analysisContext.readRowHolder().getRowIndex();
                if (rowIndex >= dataCell.getStartIndex() - 1 && rowIndex < dataCell.getEndIndex()) {
                    res.add(Double.parseDouble(data.get(dataCell.getColumnIndex())));
                }
            } else {
                res.add(Double.parseDouble(data.get(dataCell.getColumnIndex())));
            }
            return;
        }

        if (dataCell.getRowIndex() != null) {
            Integer rowIndex = analysisContext.readRowHolder().getRowIndex();
            if (Objects.equals(rowIndex, dataCell.getRowIndex())) {
                if (dataCell.getEndIndex() != null && dataCell.getStartIndex() != null) {
                    data.forEach((k,v)->{
                        if (k >= dataCell.getStartIndex() - 1 && k < dataCell.getEndIndex()) {
                            res.add(Double.parseDouble(v));
                        }
                    });
                }else {
                    res.addAll(data.values().stream().map(Double::parseDouble).toList());

                }
                returnRes();
            }
        }
    }

    private void returnRes() {
        lock.lock();
        try {
            condition.signal();
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        returnRes();
    }
}
