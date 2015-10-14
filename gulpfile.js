﻿var gulp = require('gulp');
var requireDir = require('require-dir');

// specify game project paths for tasks.
global.paths = {
    src: './src',
    jsEntry: './index',
    outDir: './bin',
    outFile: 'cocos2d.js',

    test: {
        src: 'test/qunit/unit/**/*.js',
        runner: 'test/qunit/lib/qunit-runner.html',
        lib: [
            'bin/cocos2d.test.js',
        ]
    },

    get scripts() { return this.src + '/**/*.js'; },

    originCocos2dCompileDir: './tools',
    originCocos2d: './lib/cocos2d-js-v3.9-min.js',
    originSourcemap: './lib/cocos2d-js-v3.9-sourcemap',
    modularCocos2d: './bin/modular-cocos2d.js',
};

// require all tasks in gulp/tasks, including sub-folders
requireDir('./gulp/tasks', { recurse: true });

// default task
gulp.task('default', ['build']);
