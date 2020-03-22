const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = env => {
  const isProd = env === "production";
  const CSSExtract = new ExtractTextPlugin("styles.css");

  return {
    entry: ["babel-polyfill", "./src/index.js"],
    mode: isProd ? "production" : "development",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "public", "dist")
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: { loader: "raw-loader" }
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: { loader: "babel-loader" }
        },
        {
          test: /\.s?css$/,
          use: CSSExtract.extract({
            use: [
              {
                loader: "css-loader",
                options: {
                  sourceMap: true
                }
              },
              {
                loader: "sass-loader",
                options: {
                  sourceMap: true
                }
              }
            ]
          })
        }
      ]
    },
    plugins: [CSSExtract],
    devtool: isProd ? "source-map" : "inline-source-map",
    devServer: {
      contentBase: path.resolve(__dirname, "public"),
      historyApiFallback: true,
      publicPath: "/dist/"
    }
  };
};
