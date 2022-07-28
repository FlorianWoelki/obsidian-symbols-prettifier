import fs from 'fs/promises';

const copyFilesPlugin = (options = {}) => ({
	name: 'copy-files',
	setup(build) {
		build.onEnd(async () => {
			await Promise.all(
				Object.entries(options).map(([_, target]) =>
					fs.writeFile(target, '')
				)
			);

			const ops = Object.entries(options).map(async ([source, target]) =>
				fs.cp(source, target)
			);
			await Promise.all(ops);
		});
	},
});

export default copyFilesPlugin;
