import React from 'react';
import {Button, Card, Dropdown, Tree} from 'antd';

const {DirectoryTree} = Tree;
const items = [
    {
        label: '添加文件夹',
        key: '1',
    },
    {
        label: '添加文件',
        key: '2',
    }
];

const TreeTitle = ({text}) => {
    return <Dropdown
        menu={{items,}}
        trigger={['contextMenu']}
    >
        <span>{text}</span>
    </Dropdown>
}


const demo =
    [{"id": 1, "name": "a", "type": 0, "zipType": 0}, {
        "id": 2,
        "name": "b",
        "parentId": 1,
        "type": 0,
        "zipType": 0
    }, {"id": 3, "name": "c", "parentId": 1, "type": 0, "zipType": 0}, {
        "id": 4,
        "name": "d",
        "parentId": 2,
        "type": 0,
        "zipType": 0
    }, {"id": 5, "name": "f", "parentId": 4, "type": 0, "zipType": 0}]


const toTree = (list) => {
    const root = [];
    const dataMap = {}
    list.forEach(e => {
        e.parentId = e.parentId || -1;
        dataMap[e.parentId] = [...dataMap[e.parentId] || [], e];
    })
    root.push(...dataMap[-1])
    Object.entries(dataMap).forEach(([k, v]) => {
        v.forEach(e => {
            e.subFiles = dataMap[e.id]
        })
    })
    return root;
}

const FileTree = () => {
    const treeData = [
        {
            title: <TreeTitle text={'parent 0'}/>,
            key: '0-0',
            children: [
                {
                    title:
                        <TreeTitle text={'leaf 0-0'}/>,
                    key: '0-0-0',
                    isLeaf: true,
                },
                {
                    title: 'leaf 0-1',
                    key: '0-0-1',
                    isLeaf: true,
                },
            ],
        },
        {
            title: 'parent 1',
            key: '0-1',
            children: [
                {
                    title: 'leaf 1-0',
                    key: '0-1-0',
                    isLeaf: true,
                },
                {
                    title: 'leaf 1-1',
                    key: '0-1-1',
                    isLeaf: true,
                },
            ],
        },
    ];
    toTree(demo);
    const onSelect = (keys, info) => {
        console.log('Trigger Select', keys, info);
    };
    const onExpand = (keys, info) => {
        console.log('Trigger Expand', keys, info);
    };
    return (
        <Card title="文件列表"
            // extra={<a href="#">More</a>}
              style={{
                  width: '300px',
              }}>
            {/*<Button>添加文件</Button>*/}
            <DirectoryTree
                multiple
                expandAction={false}
                defaultExpandAll
                onSelect={onSelect}
                onExpand={onExpand}
                treeData={treeData}
            />
        </Card>

    );
};
export default FileTree;