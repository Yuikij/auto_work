package com.soukon.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.soukon.constant.AutoConstants;
import com.soukon.domain.DataCell;
import com.soukon.domain.Script;
import com.soukon.enums.ScriptEnum;
import com.soukon.service.DataCellService;
import com.soukon.service.ScriptService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ScriptServiceImpl implements ScriptService {

    @Autowired
    @Lazy
    private DataCellService dataCellService;


    @Override
    public List<Double> execute(Script script) {
        int scriptType = script.getScriptType();
        if (ScriptEnum.GROUP.getValue() == scriptType) {
            return executeGroup(script);
        } else if (ScriptEnum.FUNCTION.getValue() == scriptType) {
            return executeFunction(script);
        } else if (ScriptEnum.OPERATION.getValue() == scriptType) {
            return executeOperation(script);
        }
        return List.of();
    }

    public List<Double> executeOperation(Script script) {
        ScriptEngineManager manager = new ScriptEngineManager();
        List<DataCell> dataCells = script.getDataCells();
        String operationScript = String.join("", script.getOperationScript());
        ScriptEngine engine = manager.getEngineByName("groovy");
        List<Double> res = new ArrayList<>();
        List<List<Double>> tmp = new ArrayList<>();
        AtomicInteger size = new AtomicInteger(1);
        dataCells.forEach(dataCell -> {
            List<Double> values = dataCellService.getValue(dataCell, null);
            if (values.size() > 1) {
                if (size.get() > 1 && values.size() != size.get()) {
                    log.error("运算符表达式的数据集大小不一致");
                }
                size.set(values.size());
            }
            tmp.add(values);
        });
        Double[][] tmpForExecute = new Double[size.get()][dataCells.size()];
        for (int i = 0; i < tmp.size(); i++) {
            List<Double> doubles = tmp.get(i);
            if (doubles.size() == 1) {
                for (int j = 0; j < size.get(); j++) {
                    tmpForExecute[j][i] = doubles.get(0);
                }
            } else {
                for (int j = 0; j < size.get(); j++) {
                    tmpForExecute[j][i] = doubles.get(j);
                }
            }
        }
        for (Double[] doubles : tmpForExecute) {
            Double v = executeOperation(doubles, operationScript, engine);
            res.add(v);
        }
        return res;
    }

    private Double executeOperation(Double[] data, String operationScript, ScriptEngine engine) {
        JSONObject obj = new JSONObject();
        for (int i = 0; i < data.length; i++) {
            obj.put(AutoConstants.PLACEHOLDER + i, data[i]);
        }
        obj.forEach(engine::put);
        Object eval = null;
        try {
            eval = engine.eval(operationScript);
        } catch (ScriptException e) {
            log.error("运算失败,{},{}", obj.toJSONString(), operationScript, e);
            return 0.0;
        }
        return (Double) eval;
    }

    public List<Double> executeGroup(Script script) {
        List<DataCell> dataCells = script.getDataCells();
        List<Double> res = new ArrayList<>();
        dataCells.forEach(dataCell -> res.addAll(dataCellService.getValue(dataCell, null)));
        return res;
    }

    public List<Double> executeFunction(Script script) {
        String operationScript = String.join("", script.getOperationScript());
        List<Double> numbers = executeGroup(script);
        Double res = 0.0;
        if ("+".equals(operationScript)) {
            res = numbers.stream().reduce(0.0, Double::sum);
        } else if ("*".equals(operationScript)) {
            res = numbers.stream().reduce(1.0, (a, b) -> a * b);
        }
        return List.of(res);
    }
}
