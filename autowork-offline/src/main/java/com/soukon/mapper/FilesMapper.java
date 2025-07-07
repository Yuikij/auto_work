package com.soukon.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.soukon.domain.Files;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FilesMapper extends BaseMapper<Files> {
    
    /**
     * 根据模板ID查询文件
     */
    @Select("SELECT * FROM files WHERE template_id = #{templateId} AND deleted = 0")
    List<Files> findByTemplateId(Long templateId);
    
    /**
     * 根据父ID查询子文件
     */
    @Select("SELECT * FROM files WHERE parent_id = #{parentId} AND deleted = 0")
    List<Files> findByParentId(Long parentId);
    
    /**
     * 查询根目录文件
     */
    @Select("SELECT * FROM files WHERE parent_id IS NULL AND deleted = 0")
    List<Files> findRootFiles();
}