import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson2.JSON;
import com.soukon.Application;
import com.soukon.domain.Files;
import com.soukon.mapper.FilesMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest(classes = Application.class)
public class FileTests {

    @Autowired
    private FilesMapper filesMapper;

    @Test
    public void testFile(){
        List<Files> allByParentIdRecursively = filesMapper.findAllByParentIdRecursively(1L);
        System.out.println(JSON.toJSON(allByParentIdRecursively));

        System.out.println(allByParentIdRecursively);
    }
}
