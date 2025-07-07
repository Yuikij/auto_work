package com.soukon.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.soukon.domain.Template;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TemplateMapper extends BaseMapper<Template> {
    
    /**
     * 根据类型查询模板
     */
    @Select("SELECT * FROM template WHERE type = #{type} AND deleted = 0 ORDER BY created_time DESC")
    List<Template> findByType(Integer type);
    
    /**
     * 查询所有可用模板
     */
    @Select("SELECT * FROM template WHERE status = 1 AND deleted = 0 ORDER BY created_time DESC")
    List<Template> findAllActive();
}