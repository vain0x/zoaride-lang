// webpack の設定
// 参考: https://github.com/microsoft/monaco-editor-samples/tree/master/browser-esm-webpack-typescript

const path = require("path")

module.exports = {
    context: __dirname,

    entry: {
        main: path.resolve("src/index.ts"),
        "editor.worker": "monaco-editor/esm/vs/editor/editor.worker.js",
        "json.worker": "monaco-editor/esm/vs/language/json/json.worker",
        "css.worker": "monaco-editor/esm/vs/language/css/css.worker",
        "html.worker": "monaco-editor/esm/vs/language/html/html.worker",
        "ts.worker": "monaco-editor/esm/vs/language/typescript/ts.worker",
    },

    output: {
        globalObject: "self",
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },

    module: {
        rules: [
            // TypeScript のソースコードをロード (import/require) できるようにします。
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            },

            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader",
                ],
            },

            // source-map 機能を有効化します。
            // ソースコードの実行位置として、生成された JavaScript のものではなく、
            // 元のソースコードの位置が表示されるようになります。
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
            },
        ],
    },

    // React のコードをバンドルに含めません。(script タグを使ってロードしているため。)
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
    },

    // webpack-dev-server の設定
    devServer: {
        contentBase: "dist",
        compress: true,
        port: 8080,
    },
}
