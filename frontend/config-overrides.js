const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add polyfills for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "process": require.resolve("process/browser.js"),
    "buffer": require.resolve("buffer"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util"),
    "crypto": false,
    "path": false,
    "fs": false,
    "net": false,
    "tls": false,
    "os": false,
    "http": false,
    "https": false,
    "zlib": false,
    "querystring": false,
    "url": false,
    "assert": false,
    "constants": false,
  };

  // Add webpack plugins for polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
