const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        demo1: path.resolve(__dirname, './index.ts'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        alias: {
            three: path.resolve('./node_modules/three'),
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../../dist/client'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './index.html'),
            filename: path.resolve(__dirname, '../../dist/client/index.html'),
            chunks: ['demo1'],
        }),
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, './models' ), to: path.resolve(__dirname, '../../dist/client/models' ) }
            ]
        })
    ],
}
