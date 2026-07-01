/**
 * @description Webpack config to bundle React libs into js files
 */
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from 'path';
import url from 'url';
import fs from 'fs';

// Converted from CommonJS to ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source, dependencies, and output directories. Output and dependencies directory should be gitignored
const SRC_DIR = path.resolve(__dirname, 'src/client/ts/pages');
const SRC_DIR_ADMIN = path.resolve(__dirname, 'src/client/ts/admin-pages');

// Dynamic entry map to pull in all files from the src directory and map them to relative paths in the output directory
const entryMap = {
    'header/index': path.resolve(__dirname, 'src/client/ts/header/index.tsx')
};

/**
 * @description Recursively check for "index" files in the src directory and add them to the entry map
 * @param {string} rootDir Root directory where entries lie
 * @param {string} fileName File path, relative to the SRC_DIR
 */
function applyToEntries(rootDir, fileName) {
    console.log('Applying to entries:', rootDir, fileName);
    const absoluteFilePath = path.resolve(rootDir, fileName);
    if (fs.lstatSync(absoluteFilePath).isDirectory()) {
        fs.readdirSync(absoluteFilePath).forEach((subFileName) =>
            applyToEntries(rootDir, path.join(fileName, subFileName))
        );
    } else if (fileName.match(/index\.(ts|tsx)$/)) {
        const entry = path.basename(rootDir) + '/' + fileName.replace(/\.[^/.]+$/, '');
        if (entry?.length) {
            entryMap[entry] = absoluteFilePath;
        }
    }
}
fs.readdirSync(SRC_DIR).forEach((fileName) => applyToEntries(SRC_DIR, fileName));
fs.readdirSync(SRC_DIR_ADMIN).forEach((fileName) => applyToEntries(SRC_DIR_ADMIN, fileName));

console.log(entryMap);

export default {
    mode: process.env.NODE_ENV || 'development',
    devtool: false,
    entry: entryMap,
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
        plugins: [new TsConfigPathsPlugin({ configFile: path.resolve(__dirname, 'tsconfig.json') })]
    },
    output: {
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/env', '@babel/react', '@babel/preset-typescript'],
                            plugins: ['@babel/plugin-transform-typescript']
                        }
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve(__dirname, 'tsconfig.json')
                        }
                    }
                ]
            },
            {
                test: /\.css?$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
            },
            {
                test: /\.scss$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }]
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            emitFile: false,
                            name: '[name].[ext]?[contenthash]',
                            publicPath: '/assets/images'
                        }
                    }
                ]
            }
        ]
    }
};
