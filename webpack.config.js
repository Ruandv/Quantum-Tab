const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ANSI_ESCAPE_REGEX = /[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gu;

const patchStream = (stream) => {
  if (!stream || stream._webpackTimestampPatched) {
    return;
  }

  stream._webpackTimestampPatched = true;
  const originalWrite = stream.write.bind(stream);

  stream.write = (chunk, encoding, callback) => {
    const text = typeof chunk === 'string' ? chunk : chunk?.toString(encoding || 'utf8');

    if (text) {
      const sanitized = text.replace(ANSI_ESCAPE_REGEX, '');
      const normalized = sanitized.trimStart();
      if (/webpack \d/.test(normalized) && normalized.includes('compiled')) {
        const trimmed = text.replace(/\s+$/u, '');
        const suffix = ` [${new Date().toISOString()}]`;
        const needsNewline = !/\n$/.test(text);
        const updated = `${trimmed}${suffix}${needsNewline ? '\n' : ''}`;
        return originalWrite(updated, encoding, callback);
      }
    }

    return originalWrite(chunk, encoding, callback);
  };
};

const patchWebpackOutput = () => {
  patchStream(process.stdout);
  patchStream(process.stderr);
};

patchWebpackOutput();

module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    newtab: './src/newtab/index.tsx',
    background: './src/background/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  devtool: 'cheap-module-source-map', // CSP-friendly source maps
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json',
        },
        {
          from: 'public',
          to: '',
          noErrorOnMissing: true,
        },
        {
          from: 'docs',
          to: 'docs',
          noErrorOnMissing: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/newtab/newtab.html',
      filename: 'newtab.html',
      chunks: ['newtab'],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};