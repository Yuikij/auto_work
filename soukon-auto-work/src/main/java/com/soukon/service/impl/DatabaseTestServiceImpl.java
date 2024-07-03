package com.soukon.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import com.soukon.domain.DatabaseTestBean;
import com.soukon.mapper.DataBaseTestMapper;
import com.soukon.service.DatabaseTestService;
import org.springframework.stereotype.Service;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

@Service
public class DatabaseTestServiceImpl extends ServiceImpl<DataBaseTestMapper, DatabaseTestBean> implements DatabaseTestService {

    public static void main(String[] args) throws ScriptException {
        ScriptEngineManager manager = new ScriptEngineManager();
        ScriptEngine engine = manager.getEngineByName("groovy");        JSONObject obj = new JSONObject();
        obj.put("f1",1.1);
        obj.put("f2",2);
        obj.put("f3",3);
        obj.forEach(engine::put);
        Object eval = engine.eval("f1+f2*f3");
        Double result = (Double) eval;
        System.out.println(result);
    }
}
