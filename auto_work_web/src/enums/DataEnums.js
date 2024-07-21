export const operationEnum = [
        {key: "+", label: "+"},
        {key: "-", label: "-"},
        {key: "*", label: "*"},
        {key: "/", label: "/"},
        {key: "(", label: "("},
        {key: ")", label: ")"},
        {key: "group", label: "分组"},
        {key: "sum", label: "连加"},
        {key: "multi", label: "连乘"},
        {key: "data", label: "选择数据单元"},
    ]
;

export const dataTypeList = [
    {value: 1, label: '文件'},
    // {value: 2, label: '计算'},
    {value: 3, label: '其他数据单元'},
    {value: 4, label: '参数'},
    {value: 5, label: '具体值'},
]

export const dataTypeMap = {
    1: '文件',
    2: '计算',
    3: '其他数据单元',
    4: '参数',
    5: '具体值',
}

export const ScriptTypes = {
    GROUP: 1,
    FUNCTION: 2,
    OPERATION: 3
}

export const ScriptTypesLabel = {
    1: "分组",
    2: "函数",
    3: "运算"
}

