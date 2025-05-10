const plugin = require('tailwindcss/plugin');

module.exports = {
    content: [
        './src/**/*.{js,ts,vue}',
        './node_modules/@churchtools/styleguide/dist/churchtools-styleguide.umd.js',
        './node_modules/@churchtools/styleguide/dist/churchtools-styleguide.es.js',
    ],
};
