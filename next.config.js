/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Use webpack 5's built-in web worker support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: 'static/[contenthash].worker.js',
          publicPath: '/_next/',
        },
      },
    });
    
    // Prevent webpack from trying to polyfill 'fs' module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
}

module.exports = nextConfig
