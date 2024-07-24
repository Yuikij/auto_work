export const mergeArrays = (arr1, arr2) => {

// 先将两个数组合并到一起
    const combinedArray = [...arr1, ...arr2];

// 使用 reduce 方法根据 id 合并对象
    return combinedArray.reduce((acc, obj) => {
        // 查找是否已经存在具有相同 id 的对象
        const existingObj = acc.find(item => item.id === obj.id);
        if (existingObj) {
            // 如果存在，合并对象
            Object.assign(existingObj, obj);
        } else {
            // 如果不存在，添加新的对象
            acc.push({...obj});
        }
        return acc;
    }, []);
};