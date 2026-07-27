/**
 * @description Gulpfile for compiling SCSS to minified CSS, compiling TS to minified JS, and copying images and dependencies to the build/ directory
 */
import CLIReader, { CLIValueConfig } from './bin/utils/cli-reader.ts';
import beautifyCode from 'gulp-beautify-code';
import autoprefixer from 'gulp-autoprefixer';
import environments from 'gulp-environments';
import sourcemaps from 'gulp-sourcemaps';
import typescript from 'gulp-typescript';
import webpack from 'webpack-stream';
import cssnano from 'gulp-cssnano';
import replace from 'gulp-replace';
import gulpSass from 'gulp-sass';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import merge from 'merge-stream';
import clean from 'gulp-clean';
import * as sass from 'sass';
import crypto from 'crypto';
import gulp from 'gulp';
import path from 'path';
import url from 'url';
import fs from 'fs';

// Converted from CommonJS to ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.resolve(__dirname, 'src/client/ts/pages');
const GATEWAY_OPTIONS = fs.readdirSync(PAGES_DIR).filter((opt) => opt !== 'shared');

/**
 * @typedef {Object} GulpArgs
 * @property {('client'|'server'|'all')} STACK
 * @property {('public'|'admin'|'all')} GATEWAY
 * @property {boolean} WATCH
 */

/**
 * @type {GulpArgs}
 */
const ARGS = CLIReader.parseArgv([
    new CLIValueConfig({
        key: 'STACK',
        label: 'Stack',
        type: 'enum',
        flags: new Set(['--stack', '-s']),
        enumValues: new Set(['client', 'server', 'all']),
        defaultValue: 'all'
    }),
    new CLIValueConfig({
        key: 'GATEWAY',
        label: 'Gateway',
        type: 'enum',
        flags: new Set(['--gateway', '-g']),
        enumValues: new Set(['all', ...GATEWAY_OPTIONS]),
        defaultValue: 'all'
    }),
    new CLIValueConfig({
        key: 'WATCH',
        label: 'Watch',
        type: 'boolean',
        flags: new Set(['--watch', '-w'])
    })
]);

const SELECTED_GATEWAYS = ARGS.GATEWAY === 'all' ? GATEWAY_OPTIONS : [ARGS.GATEWAY];

// Define source directories
const SRC_DIR = path.resolve(__dirname, 'src');
const SRC_DIR_CLIENT = path.resolve(SRC_DIR, 'client');
const SRC_DIR_SERVER = path.resolve(SRC_DIR, 'server');

// Define output directories
const OUT_DIR = path.resolve(__dirname, 'dist');
const OUT_DIR_CLIENT = path.resolve(OUT_DIR, 'client');
const OUT_DIR_SERVER = path.resolve(OUT_DIR, 'server');

// Leaving these hardcoded since the paths of these files is arbitrary
const JWT_PRIVATE_KEY_FILENAME = 'private-key.pem';
const JWT_PUBLIC_KEY_FILENAME = 'public-key.pem';

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
}

// Configuration for beautifying code
const BEAUTIFY_CONFIG = Object.freeze({
    indent_size: 4,
    indent_char: ' '
});

// Used to refresh dynamic imports. e.g. import(`./script.js?${++cacheBuster}`)
let cacheBuster = 0;

/**
 * ----------------------------------------------
 * -------------- HELPER FUNCTIONS --------------
 * ----------------------------------------------
 */

/**
 * @description Awaits the end of a stream and executes a callback function
 * @param {NodeJS.ReadWriteStream} stream Stream to await
 * @param {function} callback Function to execute after stream ends
 * @returns {Promise<void>}
 */
async function awaitStream(stream, callback) {
    return new Promise((resolve) => {
        try {
            stream.addListener('end', (error) => {
                callback(error);
                resolve();
            });
        } catch (error) {
            callback(error);
            resolve();
        }
    });
}

// TODO : implement versioning in .env file: M.m.p-b increment build version each time this runs unless in production
function getNextVersionNumber() {
    return crypto.randomUUID().toString();
}

/**
 * ----------------------------------------------
 * -------------- STACK COMPILERS ---------------
 * ----------------------------------------------
 */

class StackBuilder {
    gateway = 'public';
    rootSrcDir;
    rootOutDir;
    constructor(gateway) {
        this.gateway = gateway;
    }

    get srcDir() {
        if (!this.rootSrcDir) {
            throw new Error(`Root src dir not defined for ${this.constructor.name} ${this.gateway} stack builder`);
        }
        return path.resolve(this.rootSrcDir, this.gateway);
    }

    get outDir() {
        if (!this.rootOutDir) {
            throw new Error(`Root out dir not defined for ${this.constructor.name} ${this.gateway} stack builder`);
        }
        return path.resolve(this.rootOutDir, this.gateway);
    }

    get tasks() {
        // Implement in child class
        return [];
    }
}

class ClientBuilder extends StackBuilder {
    rootSrcDir = path.resolve(SRC_DIR_CLIENT, 'ts/pages');
    rootOutDir = OUT_DIR_CLIENT;

    get outDirAssets() {
        return path.resolve(this.outDir, 'assets');
    }

    get tasks() {
        const tasks = [
            this.initialClean,
            this.copyImages,
            this.copyTemplates,
            this.copyDependencies,
            this.compileSass,
            this.minifyCss,
            this.compileTs,
            this.minifyJs,
            this.cleanArtifacts
        ];
        if (environments.production()) {
            tasks.push(this.cleanNonMinifiedCode);
        }
        if (ARGS.WATCH) {
            tasks.push(this.watch);
        }
        return tasks.map((task) => task.bind(this));
    }

    /** @return {typescript.Project} */
    getTsProject() {
        const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json').toString());
        tsconfig.include = ['./src/client/ts/pages/shared/'];
        tsconfig.include.push(`./src/client/ts/pages/${this.gateway}`);
        tsconfig.exclude.push('./src/server/');
        tsconfig.compilerOptions.target = 'ES6';
        tsconfig.compilerOptions.lib = ['ES6', 'DOM'];
        tsconfig.compilerOptions.moduleResolution = 'bundler';
        const tsconfigFile = path.resolve('tsconfig.client.json');
        fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig));
        const tsproject = typescript.createProject(tsconfigFile);
        //fs.rmSync(tsconfigFile);
        return tsproject;
    }

    initialClean() {
        return gulp.src(this.outDir, { read: false, allowEmpty: true }).pipe(clean());
    }

    /**
     * @description Copies all images from the source directory to the output directory
     * @returns {NodeJS.ReadWriteStream}
     */
    copyImages() {
        return gulp
            .src([path.resolve(SRC_DIR_CLIENT, 'images/**/*'), `!${path.resolve(SRC_DIR_CLIENT, 'images/*.d.ts')}`])
            .pipe(gulp.dest(path.resolve(this.outDirAssets, 'images')));
    }

    /**
     * @description Copies all images from the source directory to the output directory
     * @returns {NodeJS.ReadWriteStream}
     */
    copyTemplates() {
        return gulp
            .src([
                path.resolve(SRC_DIR_CLIENT, 'templates/**/*'),
                `!${path.resolve(SRC_DIR_CLIENT, 'templates/*.d.ts')}`
            ])
            .pipe(gulp.dest(this.outDir));
    }

    /**
     * @description Copies all dependencies from the source directory to the output directory
     * @returns {NodeJS.ReadWriteStream}
     */
    copyDependencies() {
        return gulp
            .src([path.resolve(SRC_DIR_CLIENT, 'deps/**/*'), `!${path.resolve(SRC_DIR_CLIENT, 'deps/*.d.ts')}`])
            .pipe(gulp.dest(path.resolve(this.outDirAssets, 'deps')));
    }

    /**
     * @description Compiles all SCSS files to CSS
     * @returns {NodeJS.ReadWriteStream}
     */
    compileSass() {
        return gulp
            .src(path.resolve(SRC_DIR_CLIENT, 'scss/*.scss'))
            .pipe(gulpSass(sass)())
            .pipe(
                autoprefixer({
                    cascade: false,
                    remove: false
                })
            )
            .pipe(beautifyCode(BEAUTIFY_CONFIG))
            .pipe(gulp.dest(path.resolve(this.outDirAssets, 'css')));
    }

    /**
     * @description Compiles admin TS files to JS and bundles react dependencies using webpack
     * @see tsconfig.json for TypeScript configuration
     * @see webpack.config.js for Webpack configuration
     * @param {function} callback - Callback function to execute after compilation
     * @returns {Promise<void>}
     */
    async compileTs(callback) {
        process.env.GATEWAY = this.gateway;
        const webpackConfig = await import(`./webpack.config.js?${cacheBuster++}`);
        const tsproject = this.getTsProject();
        const stream = tsproject
            .src()
            .pipe(tsproject())
            .js.pipe(webpack(webpackConfig.default))
            .pipe(beautifyCode(BEAUTIFY_CONFIG))
            .pipe(gulp.dest(path.resolve(this.outDirAssets, 'js')));
        return awaitStream(stream, callback);
    }

    /**
     * ----------------------------------------------
     * ---------------- MINIFIERS -------------------
     * ----------------------------------------------
     */

    /**
     * @description Minifies all CSS files
     * @returns {NodeJS.ReadWriteStream}
     */
    minifyCss() {
        return gulp
            .src([
                path.resolve(this.outDirAssets, 'css/**/*.css'),
                `!${path.resolve(this.outDirAssets, 'css/**/*.min.css')}`
            ])
            .pipe(sourcemaps.init())
            .pipe(
                cssnano({
                    autoprefixer: {
                        remove: false
                    }
                })
            )
            .pipe(
                rename({
                    suffix: '.min'
                })
            )
            .pipe(sourcemaps.write('maps'))
            .pipe(gulp.dest(path.resolve(this.outDirAssets, 'css')));
    }

    /**
     * @description Minifies all JS files
     * @returns {NodeJS.ReadWriteStream}
     */
    minifyJs() {
        return gulp
            .src([
                path.resolve(this.outDirAssets, 'js/**/*.js'),
                `!${path.resolve(this.outDirAssets, 'js/**/*.min.js')}`,
                `!${path.resolve(this.outDirAssets, 'js/lib/*.js')}`
            ])
            .pipe(environments.development(sourcemaps.init()))
            .pipe(environments.production(uglify()))
            .pipe(
                rename({
                    suffix: '.min'
                })
            )
            .pipe(environments.development(sourcemaps.write('maps')))
            .pipe(gulp.dest(path.resolve(this.outDirAssets, 'js')));
    }

    /**
     * @description Cleans the output directory of all files except minified files
     * @returns {NodeJS.ReadWriteStream}
     */
    cleanNonMinifiedCode() {
        return gulp
            .src(
                [
                    path.resolve(this.outDirAssets, 'js/**/*.js'),
                    path.resolve(this.outDirAssets, 'css/**/*.css'),
                    `!${path.resolve(this.outDirAssets, 'js/**/*.min.js')}`,
                    `!${path.resolve(this.outDirAssets, 'css/**/*.min.css')}`
                ],
                { allowEmpty: true }
            )
            .pipe(clean());
    }

    cleanArtifacts() {
        return gulp.src(path.resolve(this.outDirAssets, 'js/src')).pipe(clean());
    }

    /**
     * ----------------------------------------------
     * ------- LOCAL DEVELOPMENT ENVIRONMENT --------
     * ----------------------------------------------
     */

    /**
     * @description Watches for changes in the source directory and runs the appropriate task
     */
    watch() {
        gulp.watch(
            [
                path.resolve(this.outDirAssets, 'css/**/*.css'),
                `!${path.resolve(this.outDirAssets, 'css/**/*.min.css')}`
            ],
            this.minifyCss
        );
        gulp.watch(
            [path.resolve(this.outDirAssets, 'js/**/*.js'), `!${path.resolve(this.outDirAssets, 'js/**/*.min.js')}`],
            this.minifyJs
        );
        gulp.watch([path.resolve(this.srcDir, 'ts/**/*'), 'webpack.config.js'], this.compileTs);
        gulp.watch([path.resolve(this.srcDir, 'scss/**/*.scss')], this.compileSass);
        gulp.watch([path.resolve(this.srcDir, 'images/**/*')], this.copyImages);
        gulp.watch([path.resolve(this.srcDir, 'templates/**/*')], this.copyTemplates);
    }
}

class ServerBuilder extends StackBuilder {
    static sharedModules = ['constants', 'models'];
    rootSrcDir = SRC_DIR_SERVER;
    rootOutDir = OUT_DIR_SERVER;

    get outDirSecrets() {
        return path.resolve(this.outDir, '.secrets');
    }

    get tasks() {
        const tasks = [
            this.initalClean,
            this.compileTs,
            this.moveSharedFilesIntoServerDir,
            this.removeSharedFiles,
            this.resolveServerImports,
            this.portEnvironmentVariables,
            this.generateSecrets
        ];
        if (ARGS.WATCH) {
            tasks.push(this.watch);
        }
        return tasks.map((task) => task.bind(this));
    }

    /** @return {typescript.Project} */
    getTsProject() {
        const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json').toString());
        tsconfig.include = ['./src/constants', './src/models'];
        fs.readdirSync(path.resolve(this.rootSrcDir))
            .filter((dirname) => !GATEWAY_OPTIONS.includes(dirname) || dirname === this.gateway)
            .forEach((dirname) => tsconfig.include.push(`./src/server/${dirname}`));
        tsconfig.exclude.push('./src/client/**/*');
        tsconfig.compilerOptions.lib = ['ES2020'];
        tsconfig.compilerOptions.moduleResolution = 'bundler';
        tsconfig.compilerOptions.module = 'preserve';
        tsconfig.compilerOptions.target = 'es2022';
        const tsconfigFile = path.resolve('tsconfig.server.json');
        fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig));
        const tsproject = typescript.createProject(tsconfigFile);
        fs.rmSync(tsconfigFile);
        return tsproject;
    }

    initalClean() {
        if (!fs.existsSync(this.rootOutDir)) {
            return gulp.src(this.srcDir);
        }
        const filesToClean = fs
            .readdirSync(this.rootOutDir)
            .map((dir) => path.resolve(dir))
            .filter((dir) => !dir.includes(OUT_DIR_CLIENT));
        return gulp.src(filesToClean, { read: false, allowEmpty: true }).pipe(clean());
    }

    // Task to compile TypeScript
    compileTs() {
        const tsproject = this.getTsProject();
        return tsproject.src().pipe(tsproject()).js.pipe(gulp.dest(OUT_DIR));
    }

    moveSharedFilesIntoServerDir() {
        return merge(
            ServerBuilder.sharedModules.map((sharedModule) =>
                gulp
                    .src(path.resolve(OUT_DIR, sharedModule, '**/*'))
                    .pipe(gulp.dest(path.resolve(this.rootOutDir, sharedModule)))
            )
        );
    }

    removeSharedFiles() {
        return gulp
            .src(ServerBuilder.sharedModules.map((sharedModule) => path.resolve(OUT_DIR, sharedModule)))
            .pipe(clean());
    }

    // Task to change all import aliases to relative paths
    resolveServerImports() {
        const tsproject = this.getTsProject();
        const pathAliases = Object.keys(tsproject.options.paths);

        // Regex "if" block. e.g. api|database|utils|models
        const pathAliasesRegexSearch = pathAliases.map((p) => p.replace(/^@(.*?)(\/\*)?$/g, '$1')).join('|');

        // $1: Import variable name (keep)
        // $2: Path alias (replace)
        // $3: Relative path (keep)
        const variableImportRegex = new RegExp(`import (.*?) from '@(${pathAliasesRegexSearch})(.*?)?'`, 'g');
        const staticImportRegex = new RegExp(`import '@(${pathAliasesRegexSearch})(.*?)?'`, 'g');

        /**
         * @description Modify the file path to have a .js file ending. Replaces .ts with .js, else appends .js
         * @param {string} filePath
         * @returns {string} File path with .js file ending
         */
        const addDotJS = (filePath) => {
            if (!filePath?.length) {
                return '';
            }
            filePath = filePath.replace(/\.ts$/g, '.js');
            if (!filePath.endsWith('.js')) {
                filePath += '.js';
            }
            return filePath;
        };
        console.log('Resolving server imports', this.outDir);

        /**
         * @description Convert a path alias to a relative local path based on the path of the file where the alias originates from
         * @param {string} rawAlias
         * @param {string} filePath
         * @returns {string} Relative local path
         */
        const getLocalPath = (rawAlias, filePath) => {
            // Raw alias should always be unique (i.e. "api", "database", "constants", "utils", etc.)
            const pathAlias = pathAliases.find((alias) => alias.includes(rawAlias));
            if (!pathAlias) {
                return '';
            }
            // Assume each alias only maps to one local path. Remove tailing slash and/or wildcard from this path
            const srcRelativePath = tsproject.options.paths[pathAlias]?.[0]
                ?.replace(/(\/\*|\/|\*)$/g, '') // Remove trailing /*
                ?.replace(/^\.\//, '') // Remove starting ./
                ?.replace(/src\/(server\/)?/, ''); //remove src/server/
            if (!srcRelativePath) {
                return '';
            }
            console.log('getting local path ', rawAlias, filePath);
            console.log('--prefix to remove', this.rootOutDir);
            const modulePathPrefix = path
                .dirname(filePath)
                .replace(this.rootOutDir, '')
                .split('/')
                .map((x, i) => (i === 0 ? './' : '../'))
                .join('');
            console.log('--modulePathPrefix:', modulePathPrefix);
            console.log('--srcRelativePath', srcRelativePath);
            const fullPath = modulePathPrefix + srcRelativePath;
            const fullPathAll = path.resolve(path.dirname(filePath), fullPath);
            return fullPath;
        };

        /**
         * @description Replace the path alias in an import statement with the full relative path
         * @param {string | null} variableName
         * @param {string} rawAlias
         * @param {string} moduleProjectPath
         * @param {string} fileAbsolutePath
         * @returns {string} Import call with relative path
         */
        const handleReplace = (variableName, rawAlias, moduleProjectPath, fileAbsolutePath) => {
            //moduleProjectPath = addDotJS(moduleProjectPath);
            let localPath = getLocalPath(rawAlias, fileAbsolutePath);
            console.log('Initial local path:', localPath);
            if (!localPath) {
                // Original value with "@" stripped
                return variableName
                    ? `import ${variableName} from '${rawAlias}${moduleProjectPath}'`
                    : `import '${rawAlias}${moduleProjectPath}'`;
            }
            if (moduleProjectPath) {
                localPath += moduleProjectPath;
            }
            if (!fs.existsSync(localPath)) {
                let localPathTmp = addDotJS(localPath);
                let fullPathTmp = path.resolve(path.dirname(fileAbsolutePath), localPathTmp);
                if (fs.existsSync(fullPathTmp)) {
                    localPath = localPathTmp;
                } else {
                    localPathTmp = localPath + '/index.js';
                    fullPathTmp = path.resolve(path.dirname(fileAbsolutePath), localPathTmp);
                    if (fs.existsSync(fullPathTmp)) {
                        localPath = localPathTmp;
                    } else {
                        throw new Error('Unable to locate local path for ' + fullPathTmp);
                    }
                }
            }
            return variableName ? `import ${variableName} from '${localPath}'` : `import '${localPath}'`;
        };

        // Replace all imports across all js files in the out dir
        return gulp
            .src([path.resolve(this.rootOutDir, './**/*.js'), `!${OUT_DIR_CLIENT}`])
            .pipe(
                replace(variableImportRegex, function (match, variableName, rawAlias, moduleProjectPath = '') {
                    return handleReplace(variableName, rawAlias, moduleProjectPath, this.file.path);
                })
            )
            .pipe(
                replace(staticImportRegex, function (match, rawAlias, moduleProjectPath = '') {
                    return handleReplace(null, rawAlias, moduleProjectPath, this.file.path);
                })
            )
            .pipe(gulp.dest(this.rootOutDir));
    }

    // Task to ensure .env file exists for current environment, and copy .env file over to destination folder
    async portEnvironmentVariables() {
        const dotEnvName = `.env.${this.gateway}.${process.env.NODE_ENV}`;
        const dotEnvFile = path.resolve(__dirname, dotEnvName);
        if (!fs.existsSync(dotEnvFile)) {
            throw new Error(`${dotEnvName} file not found. Please run "npm run configure"`);
        }
        fs.cpSync(dotEnvFile, path.resolve(this.outDir, '.env'));
    }

    async generateSecrets() {
        const jwtKeysDir = path.resolve(this.outDirSecrets, 'jwt');
        const jwtPublicKeyFile = path.resolve(jwtKeysDir, JWT_PUBLIC_KEY_FILENAME);
        const jwtPrivateKeyFile = path.resolve(jwtKeysDir, JWT_PRIVATE_KEY_FILENAME);
        if (!fs.existsSync(jwtKeysDir)) {
            fs.mkdirSync(jwtKeysDir, {
                recursive: true
            });
        }
        if (fs.existsSync(jwtPublicKeyFile)) {
            return;
        }
        const keyPair = crypto.generateKeyPairSync('ec', {
            namedCurve: 'P-256',
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'sec1',
                format: 'pem'
            }
        });
        fs.writeFileSync(jwtPublicKeyFile, keyPair.publicKey);
        fs.writeFileSync(jwtPrivateKeyFile, keyPair.privateKey);
    }

    /**
     * ----------------------------------------------
     * ------- LOCAL DEVELOPMENT ENVIRONMENT --------
     * ----------------------------------------------
     */

    /**
     * @description Watches for changes in the source directory and runs the appropriate task
     */
    watch() {
        gulp.watch(
            [this.srcDir, path.resolve(SRC_DIR, 'constants'), path.resolve(SRC_DIR, 'models')],
            gulp.series([this.compileTs, this.resolveServerImports])
        );
    }
}

/**
 * ----------------------------------------------
 * ------------ TASK QUEUING LOGIC --------------
 * ----------------------------------------------
 */

// Set environment variables
if (!process.env.NODE_ENV) {
    console.warn('WARNING: Environment not set. Defaulting to "development"');
    process.env.NODE_ENV = 'development';
}
if (!environments[process.env.NODE_ENV]) {
    console.warn('WARNING: Environment does not exist:', process.env.NODE_ENV);
    console.warn('Creating environment:', process.env.NODE_ENV);
    environments.make(process.env.NODE_ENV);
}
environments.current(environments[process.env.NODE_ENV]);

// Define tasks for all environments
/** @type {Array<StackBuilder>} */
const builders = [];
if (ARGS.STACK === 'client' || ARGS.STACK === 'all') {
    SELECTED_GATEWAYS.forEach((gateway) => builders.push(new ClientBuilder(gateway)));
}
if (ARGS.STACK === 'server' || ARGS.STACK === 'all') {
    SELECTED_GATEWAYS.forEach((gateway) => builders.push(new ServerBuilder(gateway)));
}
console.log('Builders:', builders);
const tasks = builders.reduce((allTasks, builder) => allTasks.concat(builder.tasks), []);

// Evaluate all tasks for gulp to execute & set the default task as a series of all tasks that need to be executed for this environment
tasks.forEach(gulp.task);
gulp.task('default', gulp.series(tasks));
