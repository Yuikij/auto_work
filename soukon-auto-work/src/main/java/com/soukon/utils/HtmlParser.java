package com.soukon.utils;

import com.soukon.domain.DataCell;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

public class HtmlParser {

    private final com.soukon.domain.DataCell dataCell;
    //    private final ReentrantLock lock;
//    private final Condition condition;
    private final List<Double> res;

    public HtmlParser(com.soukon.domain.DataCell dataCell, List<Double> res) {
        this.dataCell = dataCell;
        this.res = res;
    }

    public void parseHtml(InputStream file) throws IOException {
        Document doc = Jsoup.parse(file, "UTF-8","");
        Elements rows = doc.select("table tr");

        for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
            Element row = rows.get(rowIndex);
            Elements cells = row.select("td, th");

            // 创建一个临时的 Map 来存储当前行的数据
            Map<Integer, String> data = new HashMap<>();
            for (int colIndex = 0; colIndex < cells.size(); colIndex++) {
                Element cell = cells.get(colIndex);
                data.put(colIndex, cell.text());
            }

            // 调用你的逻辑处理方法
            invoke(data, rowIndex);
        }
    }

    public void invoke(Map<Integer, String> data, int rowIndex) {
        if (dataCell.getColumnIndex() != null && dataCell.getRowIndex() != null) {
            if (Objects.equals(rowIndex, dataCell.getRowIndex() - 1)) {
                res.add(Double.parseDouble(data.get(dataCell.getColumnIndex() - 1)));
                returnRes();
            }
            return;
        }

        if (dataCell.getColumnIndex() != null) {
            if (dataCell.getEndIndex() != null && dataCell.getStartIndex() != null) {
                if (rowIndex >= dataCell.getStartIndex() - 1 && rowIndex < dataCell.getEndIndex()) {
                    res.add(Double.parseDouble(data.get(dataCell.getColumnIndex() - 1)));
                }
            } else {
                res.add(Double.parseDouble(data.get(dataCell.getColumnIndex() - 1)));
            }
            return;
        }

        if (dataCell.getRowIndex() != null) {
            if (Objects.equals(rowIndex, dataCell.getRowIndex() - 1)) {
                if (dataCell.getEndIndex() != null && dataCell.getStartIndex() != null) {
                    data.forEach((k, v) -> {
                        if (k >= dataCell.getStartIndex() - 1 && k < dataCell.getEndIndex()) {
                            res.add(Double.parseDouble(v));
                        }
                    });
                } else {
                    res.addAll(data.values().stream().map(Double::parseDouble).toList());
                }
                returnRes();
            }
        }
    }

    private void returnRes() {
        // 实现你的返回逻辑
        System.out.println("Result: " + res);
    }

}
