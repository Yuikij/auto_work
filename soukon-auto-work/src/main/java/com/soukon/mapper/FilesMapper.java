package com.soukon.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.soukon.domain.Files;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public interface FilesMapper extends BaseMapper<Files> {
    List<Files> findAllByParentIdRecursively(@Param("id") Long parentId);

    void insertBatch(@Param("list") List<Files> files);
}
