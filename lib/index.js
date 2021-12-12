'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('node:fs');
var merge2 = require('merge2');
var fastGlob = require('fast-glob');
var dirGlob = require('dir-glob');
var process = require('node:process');
var node_util = require('node:util');
var path = require('node:path');
var gitIgnore = require('ignore');
var node_stream = require('node:stream');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var merge2__default = /*#__PURE__*/_interopDefaultLegacy(merge2);
var fastGlob__default = /*#__PURE__*/_interopDefaultLegacy(fastGlob);
var dirGlob__default = /*#__PURE__*/_interopDefaultLegacy(dirGlob);
var process__default = /*#__PURE__*/_interopDefaultLegacy(process);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var gitIgnore__default = /*#__PURE__*/_interopDefaultLegacy(gitIgnore);

function slash(path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

const DEFAULT_IGNORE = [
	'**/node_modules/**',
	'**/flow-typed/**',
	'**/coverage/**',
	'**/.git',
];

const readFileP = node_util.promisify(fs__default["default"].readFile);

const mapGitIgnorePatternTo = base => ignore => {
	if (ignore.startsWith('!')) {
		return '!' + path__default["default"].posix.join(base, ignore.slice(1));
	}

	return path__default["default"].posix.join(base, ignore);
};

const parseGitIgnore = (content, options) => {
	const base = slash(path__default["default"].relative(options.cwd, path__default["default"].dirname(options.fileName)));

	return content
		.split(/\r?\n/)
		.filter(Boolean)
		.filter(line => !line.startsWith('#'))
		.map(mapGitIgnorePatternTo(base));
};

const reduceIgnore = files => {
	const ignores = gitIgnore__default["default"]();
	for (const file of files) {
		ignores.add(parseGitIgnore(file.content, {
			cwd: file.cwd,
			fileName: file.filePath,
		}));
	}

	return ignores;
};

const ensureAbsolutePathForCwd = (cwd, p) => {
	cwd = slash(cwd);
	if (path__default["default"].isAbsolute(p)) {
		if (slash(p).startsWith(cwd)) {
			return p;
		}

		throw new Error(`Path ${p} is not in cwd ${cwd}`);
	}

	return path__default["default"].join(cwd, p);
};

const getIsIgnoredPredicate = (ignores, cwd) => p => ignores.ignores(slash(path__default["default"].relative(cwd, ensureAbsolutePathForCwd(cwd, p.path || p))));

const getFile = async (file, cwd) => {
	const filePath = path__default["default"].join(cwd, file);
	const content = await readFileP(filePath, 'utf8');

	return {
		cwd,
		filePath,
		content,
	};
};

const getFileSync = (file, cwd) => {
	const filePath = path__default["default"].join(cwd, file);
	const content = fs__default["default"].readFileSync(filePath, 'utf8');

	return {
		cwd,
		filePath,
		content,
	};
};

const normalizeOptions = ({
	ignore = [],
	cwd = slash(process__default["default"].cwd()),
} = {}) => ({ignore, cwd});

const isGitIgnored = async options => {
	options = normalizeOptions(options);

	const paths = await fastGlob__default["default"]('**/.gitignore', {
		ignore: [
			...DEFAULT_IGNORE,
			...options.ignore,
		],
		cwd: options.cwd,
	});

	const files = await Promise.all(paths.map(file => getFile(file, options.cwd)));
	const ignores = reduceIgnore(files);

	return getIsIgnoredPredicate(ignores, options.cwd);
};

const isGitIgnoredSync = options => {
	options = normalizeOptions(options);

	const paths = fastGlob__default["default"].sync('**/.gitignore', {
		ignore: [
			...DEFAULT_IGNORE,
			...options.ignore,
		],
		cwd: options.cwd,
	});

	const files = paths.map(file => getFileSync(file, options.cwd));
	const ignores = reduceIgnore(files);

	return getIsIgnoredPredicate(ignores, options.cwd);
};

class ObjectTransform extends node_stream.Transform {
	constructor() {
		super({
			objectMode: true,
		});
	}
}

class FilterStream extends ObjectTransform {
	constructor(filter) {
		super();
		this._filter = filter;
	}

	_transform(data, encoding, callback) {
		if (this._filter(data)) {
			this.push(data);
		}

		callback();
	}
}

class UniqueStream extends ObjectTransform {
	constructor() {
		super();
		this._pushed = new Set();
	}

	_transform(data, encoding, callback) {
		if (!this._pushed.has(data)) {
			this.push(data);
			this._pushed.add(data);
		}

		callback();
	}
}

const arrayUnion = (...arguments_) => [...new Set(arguments_.flat())];

const DEFAULT_FILTER = () => false;

const isNegative = pattern => pattern[0] === '!';

const assertPatternsInput = patterns => {
	if (!patterns.every(pattern => typeof pattern === 'string')) {
		throw new TypeError('Patterns must be a string or an array of strings');
	}
};

const checkCwdOption = (options = {}) => {
	if (!options.cwd) {
		return;
	}

	let stat;
	try {
		stat = fs__default["default"].statSync(options.cwd);
	} catch {
		return;
	}

	if (!stat.isDirectory()) {
		throw new Error('The `cwd` option must be a path to a directory');
	}
};

const getPathString = p => p.stats instanceof fs__default["default"].Stats ? p.path : p;

const generateGlobTasks = (patterns, taskOptions) => {
	patterns = arrayUnion([patterns].flat());
	assertPatternsInput(patterns);
	checkCwdOption(taskOptions);

	const globTasks = [];

	taskOptions = {
		ignore: [],
		expandDirectories: true,
		...taskOptions,
	};

	for (const [index, pattern] of patterns.entries()) {
		if (isNegative(pattern)) {
			continue;
		}

		const ignore = patterns
			.slice(index)
			.filter(pattern => isNegative(pattern))
			.map(pattern => pattern.slice(1));

		const options = {
			...taskOptions,
			ignore: [...taskOptions.ignore, ...ignore],
		};

		globTasks.push({pattern, options});
	}

	return globTasks;
};

const globDirectories = (task, fn) => {
	let options = {};
	if (task.options.cwd) {
		options.cwd = task.options.cwd;
	}

	if (Array.isArray(task.options.expandDirectories)) {
		options = {
			...options,
			files: task.options.expandDirectories,
		};
	} else if (typeof task.options.expandDirectories === 'object') {
		options = {
			...options,
			...task.options.expandDirectories,
		};
	}

	return fn(task.pattern, options);
};

const getPattern = (task, fn) => task.options.expandDirectories ? globDirectories(task, fn) : [task.pattern];

const getFilterSync = options => options && options.gitignore
	? isGitIgnoredSync({cwd: options.cwd, ignore: options.ignore})
	: DEFAULT_FILTER;

const globToTask = task => async glob => {
	const {options} = task;
	if (options.ignore && Array.isArray(options.ignore) && options.expandDirectories) {
		options.ignore = await dirGlob__default["default"](options.ignore);
	}

	return {
		pattern: glob,
		options,
	};
};

const globToTaskSync = task => glob => {
	const {options} = task;
	if (options.ignore && Array.isArray(options.ignore) && options.expandDirectories) {
		options.ignore = dirGlob__default["default"].sync(options.ignore);
	}

	return {
		pattern: glob,
		options,
	};
};

const globby = async (patterns, options) => {
	const globTasks = generateGlobTasks(patterns, options);

	const getFilter = async () => options && options.gitignore
		? isGitIgnored({cwd: options.cwd, ignore: options.ignore})
		: DEFAULT_FILTER;

	const getTasks = async () => {
		const tasks = await Promise.all(globTasks.map(async task => {
			const globs = await getPattern(task, dirGlob__default["default"]);
			return Promise.all(globs.map(globToTask(task)));
		}));

		return arrayUnion(...tasks);
	};

	const [filter, tasks] = await Promise.all([getFilter(), getTasks()]);
	const paths = await Promise.all(tasks.map(task => fastGlob__default["default"](task.pattern, task.options)));

	return arrayUnion(...paths).filter(path_ => !filter(getPathString(path_)));
};

const globbySync = (patterns, options) => {
	const globTasks = generateGlobTasks(patterns, options);

	const tasks = [];
	for (const task of globTasks) {
		const newTask = getPattern(task, dirGlob__default["default"].sync).map(globToTaskSync(task));
		tasks.push(...newTask);
	}

	const filter = getFilterSync(options);

	let matches = [];
	for (const task of tasks) {
		matches = arrayUnion(matches, fastGlob__default["default"].sync(task.pattern, task.options));
	}

	return matches.filter(path_ => !filter(path_));
};

const globbyStream = (patterns, options) => {
	const globTasks = generateGlobTasks(patterns, options);

	const tasks = [];
	for (const task of globTasks) {
		const newTask = getPattern(task, dirGlob__default["default"].sync).map(globToTaskSync(task));
		tasks.push(...newTask);
	}

	const filter = getFilterSync(options);
	const filterStream = new FilterStream(p => !filter(p));
	const uniqueStream = new UniqueStream();

	return merge2__default["default"](tasks.map(task => fastGlob__default["default"].stream(task.pattern, task.options)))
		.pipe(filterStream)
		.pipe(uniqueStream);
};

const isDynamicPattern = (patterns, options) => [patterns].flat()
	.some(pattern => fastGlob__default["default"].isDynamicPattern(pattern, options));

exports.generateGlobTasks = generateGlobTasks;
exports.globby = globby;
exports.globbyStream = globbyStream;
exports.globbySync = globbySync;
exports.isDynamicPattern = isDynamicPattern;
exports.isGitIgnored = isGitIgnored;
exports.isGitIgnoredSync = isGitIgnoredSync;
