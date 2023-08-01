export const arrToObj = (arr) => {
    return Object.assign({}, arr);
}

export const objToArr = (obj) => {
    return Object.values(obj);
}

export const getIndexedObjectFromArray = (arr) => {
    return arr.reduce((acc, item) => {
        return {
            ...acc,
            [item.id]: item,
        }
    }, {});
};

export const getArrayFromIndexedObject = (indexedObj) => {
    return Object.values(indexedObj);
};
