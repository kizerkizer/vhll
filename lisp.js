const fs = require('fs');

const chalk = require('chalk');

const lg = console.log,
    fns = {
        'program': x => x,
        '+': (...xs) => xs.length === 0 ? 0 : xs[0] + fns['+'](...xs.slice(1)),
        '-': (...xs) => xs.length === 0 ? 0 : xs[0] - fns['-'](...xs.slice(1)),
        '*': (...xs) => xs.length === 0 ? 1 : xs[0] * fns['*'](...xs.slice(1)),
        '/': (...xs) => xs.length === 0 ? 1 : xs[0] / fns['/'](...xs.slice(1)),
        '"': (atom) => atom,
        "len": (arg) => arg.length,
        'range': (l, u) => makeRange(l, u),
    };

let DEBUG = true;

function makeRange (l, u) {
    let array = [];
    for (let i = l; i < u; i++) array.push(i);
    return array;
}

function fmt (list) {
    return '(' + list.map(x => Array.isArray(x) ? fmt([x[0], chalk.reset('...')]) : (typeof x === 'number' ? chalk.yellow(x) : chalk.green(x))).join(' ') + ')';
}

function dbgBlank (depth) {
    lg('|   '.repeat(depth));
}

function dbgEval (depth, list) {
    lg(`${'|   '.repeat(depth)}${chalk.cyanBright('eval')}: ${fmt(list)}`);
}

function dbgProp (depth, prop, value) {
    lg(`${'|   '.repeat(depth)}|-- ${chalk.cyanBright(prop)}:\t${value}`);
}

function eval (list, depth = 0) {
    if (DEBUG) {
        dbgBlank(depth);
        dbgEval(depth, list);
    }
    let args = [],
        fn = fns[list[0]],
        recursed = false;
    if (!fn) throw new Error(`Unknown function or qualifier \`${list[0]}\``);
    list.slice(1).map(x => {
        if (Array.isArray(x)) {
            recursed = true;
            let subresult = eval(x, depth + 1);
            if (Array.isArray(subresult)) {
                args = [...args, ...subresult];
            } else {
                args.push(subresult);
            }
        } else {
            args.push(x);
        }
    });
    let result = fn(...args);
    if (DEBUG) {
        if (recursed) lg('    '.repeat(depth) + '|');
        dbgProp(depth, 'fn', fmt([list[0]]));
        dbgProp(depth, 'args', fmt(args));
        dbgProp(depth, 'result', Array.isArray(result) ? chalk.magenta(fmt(result)) : chalk.magenta(fmt([result])));
    }
    return result;
}

const parse = source => {
    let formatted = source
        .replace(/;.*\n/g, '') // comments
        .replace(/\s+/g, ' ') // collapse whitespace
        .trim() // to avoid empty list elements
        .replace(/\(/g, '[') // convert to JS square brackets
        .replace(/\)/g, ']')
        .replace(/\[ \[/g, '[[')
        .replace(/\] \]/g, ']]')
        .replace(/([a-z\+\-\*\/\"]+)/g, '"$1"') // double-quote atoms
        .replace(/\s([^\s\]])/g, ', $1') // make lists comma delimitted instead of space delimitted
        .replace(/"""/g, '"\\""'); // handle the " atom (escape it)
    DEBUG && console.log(formatted);
    return JSON.parse(formatted);
}

module.exports.registerFunction = function registerFunction (name, fn) {
    if (!fns[name]) {
        fns[name] = fn;
        return true;
    }
    return false;
}

module.exports.interpretFileSync = function interpretFileSync (path, debug = false) {
    DEBUG = debug;
    try {
        const source = fs.readFileSync(path, 'utf8');
        DEBUG && console.log(source);
        const parsed = parse(source);
        DEBUG && console.log(parsed);
        const result = eval(parsed);
        lg(chalk.magenta(result));
    } catch (e) {
        console.log(chalk.red(e.message));
    }
}

