const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const authenticationMiddleware = require('./middleware');
const saltRounds = 10;
const ptPass = 'hashword';
const salt = bcrypt.genSaltSync(saltRounds);
const passwordHash = bcrypt.hashSync(ptPass, salt);

const user = {
	username: 'test-user',
	passwordHash: passwordHash, 
	id: 1
}

// app.get('/profile', passport.authenticationMiddleware(), renderProfile);

function findUser(username, callback) {
	if ( username === user.username ) {
		return callback(null, user);
	}
	return callback(null);
}

passport.serializeUser(function (user, cb) {
	cb(null, user.username);
});

passport.deserializeUser(function (username, cb) {
	findUser(username, cb);
});

function initPassport () {
	passport.use(new LocalStrategy(
		(username, password, done) => {
			findUser(username, (err, user) => {
				if (err) {
					return done(err)
				}

				// User not found
				if (!user) {
					return done(null, false)
				}

				// Always used hashed passwords and fixed time comparison
				bcrypt.compare(password, user.passwordHash, (err, isValid) => {
					if (err) {
						return done(err)
					}

					if(!isValid) {
						return done(null, false)
					}

					return done(null, user)
				})
			})
		}
	))

	passport.authenticationMiddleware = authenticationMiddleware;
}

module.exports = initPassport;
