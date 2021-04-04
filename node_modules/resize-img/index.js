'use strict';
const fileType = require('file-type');
const Jimp = require('jimp');

const supportedFormats = {
	bmp: Jimp.MIME_BMP,
	jpg: Jimp.MIME_JPEG,
	png: Jimp.MIME_PNG
};

module.exports = async (buffer, options = {}) => {
	if (!Buffer.isBuffer(buffer)) {
		throw new TypeError(
			`Expected \`buffer\` to be of type \`Buffer\` but received type \`${typeof buffer}\``
		);
	}

	const type = fileType(buffer);

	if (!type || !Object.keys(supportedFormats).includes(type.ext)) {
		throw new Error('Image format not supported');
	}

	if (!Number.isFinite(options.width) && !Number.isFinite(options.height)) {
		throw new TypeError('You need to set either `width` or `height` options');
	}

	const image = await Jimp.read(buffer);
	const mime = supportedFormats[options.format] || Jimp.AUTO;

	if (typeof options.width !== 'number') {
		options.width = Math.trunc(image.bitmap.width * (options.height / image.bitmap.height));
	}

	if (typeof options.height !== 'number') {
		options.height = Math.trunc(image.bitmap.height * (options.width / image.bitmap.width));
	}

	return image
		.resize(options.width, options.height)
		.getBufferAsync(mime);
};
