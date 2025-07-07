package com.soukon.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.soukon.domain.AppConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AppConfigMapper extends BaseMapper<AppConfig> {
    
    /**
     * 根据配置键查询配置
     */
    @Select("SELECT * FROM app_config WHERE config_key = #{configKey} AND deleted = 0")
    AppConfig findByConfigKey(String configKey);
}