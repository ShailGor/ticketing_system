import express, { Application } from 'express';
import fileUpload from 'express-fileupload';
import i18n from './i18n';

export default (app: Application) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(i18n.init);
    i18n.setLocale('en');

    app.use(
        fileUpload({
            parseNested: true,
            createParentPath: true,
        })
    );

    app.use(express.static('public'));
};
