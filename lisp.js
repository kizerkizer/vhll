const chalk = require('chalk');

const lg = console.log;

const fns = {
    'sum': (...xs) => xs.length === 0 ? 0 : xs[0] + fns['sum'](...xs.slice(1)),
    'range': (l, u) => makeRange(l, u),
};

function makeRange (l, u) {
    let array = [];
    for (let i = l; i < u; i++) array.push(i);
    return array;
}


/*class Range {
    
    constructor (l, u) {
        this.l = l;
        this.u = u;
    }

    *[Symbol.iterator] () {
        for (let i = this.l; i < this.u; i++) {
            yield i;
        }
    }

    toString () {
        return `Range [${this.l}, ${this.u})`;
    }
}*/

function fmt (list) {
    return '(' + list.map(x => Array.isArray(x) ? fmt([x[0], chalk.reset('...')]) : (typeof x === 'number' ? chalk.yellow(x) : chalk.green(x))).join(' ') + ')';
}

function eval (list, depth = 0) {
    lg('|   '.repeat(depth));
    lg(`${'|   '.repeat(depth)}${chalk.cyanBright('eval')}: ${fmt(list)}`);
    let args = [];
    let fn = fns[list[0]];
    let recursed = false;
    list.slice(1).forEach(x => {
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
    if (recursed) {
        lg('    '.repeat(depth) + '|');
    }
    lg(`${'|   '.repeat(depth)}|-- ${chalk.cyanBright('fn')}:\t${fmt([list[0]])}`);
    lg(`${'|   '.repeat(depth)}|-- ${chalk.cyanBright('args')}:\t${fmt(args)}`);
    lg(`${'|   '.repeat(depth)}|-- ${chalk.cyanBright.bold('result')}:\t${Array.isArray(result) ? chalk.bold(fmt(result)) : chalk.bold(fmt([result]))}`);
    return result;
}

const parse = source => 
    JSON.parse(source
        .replace(/\(/g, '[')
        .replace(/\)/g, ']')
        .replace(/([a-z]+)/g, '"$1"')
        .replace(/\s+/g, ', '));

/*let program = ['sum', 9, 9, 2, ['sum', 4, 4], 7];

eval(program);*/

let source = '(sum 9 9 (sum 5 5) 2 (range 2 5) 7)';
lg(source);
let parsed = parse(source);

let result = eval(parsed);
lg(result);
