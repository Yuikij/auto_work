package com.soukon.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.soukon.domain.DataCell;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DataCellMapper extends BaseMapper<DataCell> {
    
    /**
     * 查找孤立的数据单元（模板已删除）
     */
    @Select("SELECT dc.* FROM data_cell dc LEFT JOIN template t ON dc.template_id = t.id WHERE dc.template_id IS NOT NULL AND (t.id IS NULL OR t.deleted = 1)")
    List<DataCell> findOrphanCells();
    
    /**
     * 根据模板ID删除数据单元
     */
    @Select("UPDATE data_cell SET deleted = 1 WHERE template_id = #{templateId}")
    int deleteByTemplateId(Long templateId);
    
    /**
     * 根据模板ID查询数据单元
     */
    @Select("SELECT * FROM data_cell WHERE template_id = #{templateId} AND deleted = 0")
    List<DataCell> findByTemplateId(Long templateId);
}