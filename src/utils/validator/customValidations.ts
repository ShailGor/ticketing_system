export const isString = (value: string | object) => {
    return typeof value === 'string' || value instanceof String;
};

export const isNumber = (value: any) => {
    const number = value;
    const myRegEx = /^(\s*[0-9]+\s*)+$/;
    const isValid = myRegEx.test(number);
    if (isValid) {
        return true;
    } else {
        return false;
    }
};

export const isEmpty = (value: any) => {
    if (
        value === undefined ||
        value === null ||
        value == 0 ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0)
    ) {
        return true;
    } else {
        return false;
    }
};

export const isEmail = (value: string) => {
    const email = value;
    const myRegEx =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isValid = myRegEx.test(email);
    if (isValid) {
        return true;
    } else {
        return false;
    }
};

export let checkImageSize = (image: any) => {
    if (image) {
        if (image.size > 5 * 1024 * 1024) {
            return false;
        }
    }
};

export let checkImageType = (image: any) => {
    if (image) {
        if (image.mimetype !== 'image/jpg' && image.mimetype !== 'image/jpeg' && image.mimetype !== 'image/png') {
            return false;
        }
    }
};
