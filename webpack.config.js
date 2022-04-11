const path = require('path');

module.exports = {
  entry: {
    AgoraRtcWrapper: './src/IrisRtcEngine.ts',
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
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    library: 'IrisRtcEngine',
    libraryTarget: 'var',
    libraryExport: 'default',
    path: path.resolve(__dirname, 'dist'),
  },
};
