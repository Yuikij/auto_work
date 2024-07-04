import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.alibaba.excel.util.ListUtils;
import com.alibaba.fastjson.JSON;
import com.soukon.Application;
import com.soukon.domain.DataCell;
import com.soukon.domain.DataValue;
import com.soukon.domain.FunctionScript;
import com.soukon.domain.Script;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.util.Lists;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

@SpringBootTest(classes = Application.class)
public class ApplicationTests {

    @Slf4j
    public static class NoModelDataListener extends AnalysisEventListener<Map<Integer, String>> {
        /**
         * 每隔5条存储数据库，实际使用中可以100条，然后清理list ，方便内存回收
         */
        private static final int BATCH_COUNT = 5;
        private List<Map<Integer, String>> cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);

        @Override
        public void invoke(Map<Integer, String> data, AnalysisContext context) {

            log.info("解析到一条数据:{}", JSON.toJSONString(data));
            cachedDataList.add(data);
            if (cachedDataList.size() >= BATCH_COUNT) {
                saveData();
                cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);
            }
        }

        @Override
        public void invokeHeadMap(Map<Integer, String> headMap, AnalysisContext context) {
            log.info("解析到一条数据:{}", JSON.toJSONString(headMap));
        }

        @Override
        public void doAfterAllAnalysed(AnalysisContext context) {
            saveData();
            log.info("所有数据解析完成！");
        }

        /**
         * 加上存储数据库
         */
        private void saveData() {
            log.info("{}条数据，开始存储数据库！", cachedDataList.size());
            log.info("存储数据库成功！");
        }
    }

    @Test
    public void testExcel() {
        String fileName = "E:\\\\文档\\WeChat Files\\wxid_gcqt9cwcpxad21\\FileStorage\\File\\2024-06\\重大慢病过早死亡概率+心脑血管标化死亡率+70以下慢性呼吸死亡率\\重大慢病过早死亡概率+心脑血管标化死亡率+70以下慢性呼吸死亡率\\1、原始数据\\常住人口（分母）\\常住人口年龄别数据（20XX ）.xls";
        // 这里 需要指定读用哪个class去读，然后读取第一个sheet 文件流会自动关闭
        EasyExcel.read(fileName, new NoModelDataListener()).sheet().doRead();
    }

    @Test
    public void testData(){
//    1. "A.sum(c2->r4:r5),B.C3:C6"
//    2. "A.c2*B.c3+B.c5r6+D.1"

//    1. "A.sum(c2->r4:r5)+B.C3:C6"
//    2. "A.c2*B.c3+B.c5r6+D.1"
        DataCell dataCell1 = new DataCell();

        dataCell1.setSourceId(1L);
        dataCell1.setColumnIndex(2);
        dataCell1.setStartIndex(4);
        dataCell1.setEndIndex(5);

        FunctionScript functionScript = new FunctionScript();
        functionScript.setDataCells(Lists.list(dataCell1));
        DataCell dataCell2 = new DataCell();
        dataCell2.setScript(functionScript);

        DataCell dataCell = new DataCell();
        dataCell.getValue();
    }

}
