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