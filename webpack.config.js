import path from "path";
import webpack from "webpack";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    "content/zeus-calendar": "./src/index.jsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    globalObject: "window"
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    // Content scripts can't load extra chunks: keep dynamic imports inside the
    // single bundle. They still run lazily, so only the selected interface's
    // CSS gets injected (see src/index.jsx).
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
  resolve: {
    extensions: [".js", ".jsx"],
  },
  // Don't bundle React for content scripts - we'll inject it
  optimization: {
    minimize: true,
  },
};
