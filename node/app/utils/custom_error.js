class CustomError extends Error {
	constructor(message, statusCode = 500, context = {}) {
		super(message);
		this.statusCode = statusCode;
		this.context = context;
	}
}

module.exports = CustomError;
