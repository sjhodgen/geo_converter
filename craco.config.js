const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Provide polyfills for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "buffer": require.resolve("buffer/"),
        "stream": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "util": require.resolve("util/"),
        "crypto": require.resolve("crypto-browserify"),
        "fs": false,
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib"),
      };

      // Add plugins
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );

      return webpackConfig;
    },
  },
};