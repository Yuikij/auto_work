package com.soukon.service;

import com.soukon.domain.Script;

import java.util.List;

public interface ScriptService {
    List<Double> execute(Script script);
}
