## 数据单元
```json
{
  "name":"聚合表1",
  "script": {
    "dataCells": [
      {
        "type": 2,
        "script": {
          "dataCells": [
            {
              "type": 1
            },
            {
              "type": 3
            }
          ],
          "scriptType": 2,
          "operationScript": "*"
        }
      },
      {
        "type": 3
      }
    ],
    "scriptType": 2,
    "operationScript": "+"
  },
  "type": 2
}
```


## 文件结构

```json
{
  "id":123,
  "name": "folder1",
  "zipType": "zip",
  "subFiles": {
    "id":111,
    "name": "file1.xlsx",
    "type": "file"
  },
  "type": "folder"
}
```