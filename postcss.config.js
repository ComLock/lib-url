const env = require('./util/env');

const isProd = env.prod;

const plugins = Object.assign(
    {
        "postcss-normalize": {},
        autoprefixer: {},
        "css-mqpacker": {}
    },
    isProd ? {cssnano: {}} : {}
);

module.exports = {plugins};
