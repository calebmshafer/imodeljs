/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2017 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
"use strict";

const path = require("path");
const webpack = require("webpack");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const getClientEnvironment = require("./env");
const plugins = require("../scripts/utils/webpackPlugins");
const paths = require("./paths");
const helpers = require("./helpers");

//======================================================================================================================================
// This is the BASE configuration.
// It contains settings which are common to both PRODUCTION and DEVELOPMENT configs.
//======================================================================================================================================
module.exports = (publicPath) => {
  // `publicUrl` is just like `publicPath`, but we will provide it to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  const publicUrl = publicPath.slice(0, -1);
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(publicUrl);

  return {
    output: {
      // The build folder.
      // Next line is not used in dev but WebpackDevServer crashes without it:
      path: paths.appLibPublic,
      // This is the URL that app is served from. We use "/" in development.
      // In production, we inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: publicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: helpers.createDevToolModuleFilename,
    },
    resolve: {
      // This allows you to set a fallback for where Webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebookincubator/create-react-app/issues/253
      modules: ["node_modules", paths.appNodeModules, paths.appSrc].concat(
        // It is guaranteed to exist because we tweak it in `env.js`
        process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
      ),
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebookincubator/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: [
        ".web.ts",
        ".ts",
        ".web.tsx",
        ".tsx",
        ".web.js",
        ".js",
        ".json",
        ".web.jsx",
        ".jsx",
      ],
      alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        "react-native": "react-native-web",
      },
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.appSrc),
        // This is only for FRONTEND code - backend modules should be excluded from the bundle.
        new plugins.BanBackendImportsPlugin(),
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },

        // First, run the linter.
        // It's important to do this before Typescript runs.
        {
          test: /\.(ts|tsx)$/,
          loader: require.resolve("tslint-loader"),
          enforce: "pre",
          include: paths.appSrc,
        },
        {
          test: /\.js$/,
          loader: require.resolve("source-map-loader"),
          enforce: "pre",
          include: helpers.createBentleySourceMapsIncludePaths(),
        },
        // "sass" loader compiles SASS into CSS.
        {
          test: /\.scss$/,
          loader: require.resolve("sass-loader"),
          options: {
            includePaths: [paths.appNodeModules]
          },
          enforce: "pre",
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // "url" loader works just like "file" loader but it also embeds
            // assets smaller than specified size as data URLs to avoid requests.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve("url-loader"),
              options: {
                limit: 10000,
                name: "static/media/[name].[hash:8].[ext]",
              },
            },
            // Compile .tsx?
            {
              test: /\.(ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve("ts-loader"),
              options: {
                compilerOptions: {
                  // Replace $(iModelJs-Common) with @bentley/imodeljs-frontend when compiling typescript
                  paths: {"$(iModelJs-Common)/*": [ "../node_modules/@bentley/imodeljs-frontend/*"] } 
                },
                onlyCompileBundledFiles: true,
                logLevel: "warn",
              }
            },
            // Inline SVG icons
            {
              test: /\.svg$/,
              use: [
                {
                  loader: require.resolve("svg-sprite-loader"),
                  options: {
                    runtimeGenerator: require.resolve("./generateSvgUrl"),
                    extract: true,
                    spriteFilename: "sprite-[hash:6].svg"
                  },
                }
              ]
            },
            // "file" loader makes sure assets end up in the `lib` folder.
            // When you `import` an asset, you get its filename.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
              loader: require.resolve("file-loader"),
              options: {
                name: "static/media/[name].[hash:8].[ext]",
              },
            },
          ]
        }
        // ** STOP ** Are you adding a new loader?
        // Make sure to add the new loader(s) before the "file" loader.
      ],
    },
    
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      dgram: "empty",
      fs: "empty",
      net: "empty",
      tls: "empty",
    },

    // There are a number of plugins that are common to both configs
    plugins: [
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
      // In development, this will be an empty string.
      // In production, it will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new InterpolateHtmlPlugin(env.raw),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === "development") { ... }. See `./env.js`.
      // For a PRODUCTION build, it is absolutely essential that NODE_ENV was set to production here.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebookincubator/create-react-app/issues/240
      new CaseSensitivePathsPlugin(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new SpriteLoaderPlugin(),   
      // Automatically make React available
      new webpack.ProvidePlugin({
        React: "react",
      }),
      // Replace $(iModelJs-Common) with @bentley/imodeljs-frontend when resolving modules
      new webpack.NormalModuleReplacementPlugin(paths.imodeljsCommonRegex, (r) => {
        r.request = r.request.replace(paths.imodeljsCommonRegex, "@bentley/imodeljs-frontend");
      }),
    ],
  };
};
