const path = require('path')
const util = require('util')
const fs = require('fs')

const Promise = require('bluebird')
const exif = require('fast-exif')
const totlog = require('totlog')

const EventEmitter = require('events').EventEmitter

const JpegImporter = require('./jpeg-importer')
const MovImporter = require('./mov-importer')

const lpadz = require('./lpadz')
const uniq = require('./uniq')

const readdir = Promise.promisify(fs.readdir)
const stat = Promise.promisify(fs.stat)
const mkdirp = Promise.promisify(require('mkdirp'))

const concurrency = require('os').cpus().length*2

module.exports = ({ source, destination }) => new Importer(source, destination).run()

class UnknownEntryTypeError extends Error {
	constructor (path, stat) {
		super('Cannot determine directory entry type.')
		Object.assign(this, { path, stat })
	}
}

class BadExifError extends Error {
	constructor (path, exif) {
		super('Exif does not contain required information.')
		Object.assign(this, { path, exif })
	}
}

class Importer extends EventEmitter {
	constructor (destinationPath) {
		this.entryHandlers = {
			dir: info => this.importDirectory(info),
			jpg: info => new JpegImporter(destinationPath).run(info),
			mov: info => new MovImporter(destinationPath).run(info),
		}
	}
	run (sourcePath) {
		this.importEntry(sourcePath)
		return this
	}
	async importEntry (entryPath) {
		try {
			const info = await this.getEntryInfo(entryPath)
			const handler = this.entryHandlers[info.type]
			if (handler) {
				await handler(info)
			} else {
				log.warn('no handler for entry', info)
			}
		} catch (error) {
			log.warn('ignoring entry %s due to', entryPath, error)
		}
	}
	async getEntryInfo (entryPath) {
		const info = await stat(entryPath)
		if (info.isDirectory()) {
			return { path: entryPath, type: 'dir' }
		} else if (info.isFile()) {
			if (/\.(jpe?g|JPE?G)$/.test(entryPath)) {
				return { path: entryPath, type: 'jpg', size: info.size }
			} else if (/\.(mov|MOV)$/.test(entryPath)) {
				return { path: entryPath, type: 'mov' }
			}
		}
		throw new UnknownEntryTypeError(entryPath, info)
	}
	async importDirectory (info) {
		try {
			const entryNames = await readdir(info.path)
			const entryPaths = entryNames.map(it => path.join(info.path, it))
			for (let p of entryPaths) {
				await importEntry(p)
			}
		} catch (error) {
			log.warn('omitting directory %s due to', info.path, error)
		}
	}
function getDestination (source) {
		return exif.read(source.path, 16)
			.then(exif => {
				var originalDate = exif.exif && exif.exif.DateTimeOriginal;
				var modifyDate = exif.image.ModifyDate;
				var date = originalDate || modifyDate;
				var make = exif.image.Make.split(/\s+/);
				var model = exif.image.Model.split(/\s+/);
				var camera = uniq(make.concat(model)).join('-').replace(/[^\w\d\-]+/g, '');
				return path.join(
					output,
					date.getFullYear().toString(),
					util.format('%s-%s', lpadz(date.getMonth() + 1), lpadz(date.getDate())),
					util.format('%s-%s-%s-%s.jpg', lpadz(date.getHours()), lpadz(date.getMinutes()), lpadz(date.getSeconds()), camera)
				);
			})
			.then(destinationPath => 
				Promise.join(
					mkdirp(path.dirname(destinationPath)),
					stat(destinationPath)
						.then(info => ({ path: destinationPath, size: info.size }))
						.catch({ code: 'ENOENT' }, error => ({ path: destinationPath, size: 0 })),
					(it, info) => info
				)
			);
	}
	}
	async importMov (info) {

	}
	async getDestination ()

			isDirectory: info.isDirectory(),
			isFile: info.isFile(),
			type: ,
			isMov: 
		return {
			path: entryPath,
			type: 
			size: info.size
		}
		.then(info => ({
		}))
		.catch({ code: 'ENOENT' }, error => ({}))
		.catch({ code: 'EACCES' }, error => ({}))
		.catch({ code: 'ELOOP' }, error => ({}));

	}
}

function run (options) {
	var output = options.output;
	var emitter = options.emitter || new EventEmitter();

	return walk(options.input);
}

function walk (sourcePath) {
	return readdir(sourcePath)
		.catch({ code: 'EACCES' }, error => [])
		.then(entries => entries.map(it => path.join(sourcePath, it)))
		.map(classify, { concurrency })
		.then(entries => {
			var directories = entries.filter(it => it.isDirectory).map(it => it.path);
			var files = entries.filter(it => it.isFile).map(it => ({ path: it.path, size: it.size }));
			return Promise
				.resolve(files)
				.map(understand, { concurrency })
				.map(execute, { concurrency })
				.return(directories)
				.map(walk, { concurrency: 1 });
		});
}


	function understand (source) {
		return getDestination(source)
			.then(destination => ({ source, destination, command: source.size > destination.size ? 'copy' : 'skip' }))
			.catch(error => ({ source, error, command: error.message.includes('Exif') ? 'omit' : 'fail' }));
	}

	function execute (it) {
		var command = it.command;
		delete it.command;
		switch (command) {
			case 'fail': return emitter.emit('failed', it);
			case 'omit': return emitter.emit('omitted', it);
			case 'skip': return emitter.emit('skipped', it);
			case 'copy': return pipe(it.source.path, it.destination.path)
				.then(() => emitter.emit('succeeded', it));
			default: throw new Error('Unknown command!');
		}
	}

	function getDestination (source) {
		return exif.read(source.path, 16)
			.then(exif => {
				if (!exif || !exif.image || !exif.image.ModifyDate || !exif.image.Make || !exif.image.Model) {
					throw new Error('Bad Exif!');
				}
				var originalDate = exif.exif && exif.exif.DateTimeOriginal;
				var modifyDate = exif.image.ModifyDate;
				var date = originalDate || modifyDate;
				var make = exif.image.Make.split(/\s+/);
				var model = exif.image.Model.split(/\s+/);
				var camera = uniq(make.concat(model)).join('-').replace(/[^\w\d\-]+/g, '');
				return path.join(
					output,
					date.getFullYear().toString(),
					util.format('%s-%s', lpadz(date.getMonth() + 1), lpadz(date.getDate())),
					util.format('%s-%s-%s-%s.jpg', lpadz(date.getHours()), lpadz(date.getMinutes()), lpadz(date.getSeconds()), camera)
				);
			})
			.then(destinationPath => 
				Promise.join(
					mkdirp(path.dirname(destinationPath)),
					stat(destinationPath)
						.then(info => ({ path: destinationPath, size: info.size }))
						.catch({ code: 'ENOENT' }, error => ({ path: destinationPath, size: 0 })),
					(it, info) => info
				)
			);
	}
};

function classify (entryPath) {
	return stat(entryPath)
		.then(info => ({
			path: entryPath,
			isDirectory: info.isDirectory(),
			isFile: info.isFile() && /\.(jpg|JPG)$/.test(entryPath),
			size: info.size
		}))
		.catch({ code: 'ENOENT' }, error => ({}))
		.catch({ code: 'EACCES' }, error => ({}))
		.catch({ code: 'ELOOP' }, error => ({}));
}

function copyFile (sourceFilename, destinationFilename) {
	return new Promise(function (resolve, reject) {
		var readable = fs.createReadStream(sourceFilename);
		readable.on('error', reject);

		var writable = fs.createWriteStream(destinationFilename);
		writable.on('error', reject);
		writable.on('finish', resolve);
		
		readable.pipe(writable);
	});
}


