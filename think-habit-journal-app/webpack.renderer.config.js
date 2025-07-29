// webpack.renderer.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    target: "web",
    entry: "./src/renderer/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist/renderer"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      clean: true,
      publicPath: "./",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx"],
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "src/shared"),
      },
    },
    externals: {
      'better-sqlite3': 'commonjs better-sqlite3',
      'uuid': 'commonjs uuid',
      'electron': 'commonjs electron',
      'fs': 'commonjs fs',
      'path': 'commonjs path',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "src/renderer/index.html"),
        filename: "index.html",
        minify: isProduction,
      }),
      new (require("webpack").DefinePlugin)({
        "process.env": JSON.stringify({
          NODE_ENV: isProduction ? "production" : "development",
          REACT_APP_VERSION: "1.0.0-web",
        }),
      }),
    ],
    devServer: {
      port: 9001,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, "dist/renderer"),
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      open: false,
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};
