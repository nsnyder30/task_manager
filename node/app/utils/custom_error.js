class CustomError extends Error {
	constructor(message, statusCode = 500, context = {}, err = null) {
		super(message);
		this.statusCode = statusCode;
		this.context = context;
		if(err?.stack) {
			this.originalStack = this.stack;
			this.stack = `${this.stack}\nCaused by: ${err.stack}`;
		}
	}
}

module.exports = CustomError;
