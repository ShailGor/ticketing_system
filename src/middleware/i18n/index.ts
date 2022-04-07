import { I18n } from 'i18n';
import path from 'path';

class i18nClass {
    public i18n = new I18n();
    constructor() {
        this.i18n.configure({
            // locales: ['en', 'de'],
            // directory: path.join(__dirname, '/locales'),
            staticCatalog: {
                en: require('../../../locales/en.json'),
                // guj: require('../../../locales/guj.json'),
                // ja: require('../../../locales/ja.json'),
            },
            objectNotation: true,
            defaultLocale: 'en',
        });
    }
}

export default new i18nClass().i18n;
