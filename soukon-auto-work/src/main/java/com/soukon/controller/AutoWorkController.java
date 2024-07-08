package com.soukon.controller;

import com.soukon.core.http.ApiResponse;
import com.soukon.domain.Files;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AutoWorkController {
    @PostMapping("/files/add")
    public ApiResponse<Object> filesAdd(@RequestBody List<Files> files) {
        return ApiResponse.success();
    }
}
