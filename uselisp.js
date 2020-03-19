const chalk = require('chalk');

const { registerFunction, interpretFileSync } = require('./lisp.js');

registerFunction('log', (...args) => {
    console.log(...args.map(arg => chalk.magenta(arg)));
});

interpretFileSync('program.kzlisp', true);
