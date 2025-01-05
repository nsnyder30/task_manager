const path = require('path');
const cors = require('cors');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
//const rs = require('connect-redis').default;
const { createClient } = require('redis');
const rs = require('connect-redis');
const config = require('config');

console.log(config.redisStore.url);

const app = express();
const angular_path = path.join(__dirname, '..', 'node_modules', 'angular_build');
const redisClient = createClient({
	url: config.redisStore.url, 
	password: config.redisStore.password
});

require('./authentication').init(app);

redisClient.connect().catch(console.error);
// const RedisStore = rs(session);
app.use(session({
	store: new rs.RedisStore({
		client: redisClient
	}), 
	password: config.redisStore.password, 
	secret: config.redisStore.secret, 
	resave: false, 
	saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(angular_path, 'browser')));

/*
app.post('/login', (req, res, next) => {
	console.log({msg: 'login page called', req: req});
	const { username, password } = req.body;
	res.json({message: 'You have reached the login page'});
})
*/
/* EXAMPLE OF CUSTOM LOGIC FOR LOGIN METHOD THAT STIL INCORPORATES PASSPORT AUTHENTICATION
app.post('/login', (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if (err) return next(err);
		if (!user) return res.redirect('');
		req.login(user, (err) => {
			if (err) return next(err);
			return res.redirect('/dashboard');
		});
	})(req, res, next);
})
*/
app.post('/login', passport.authenticate('local', {
	successRedirect: '/test', 
	failureRedirect: ''
}));

app.get('/api/hello', (req, res) => {
	console.log('api/hello triggered');
	res.json({message: 'Hello from Node.js!' });
});

app.get('*', (req, res) => {
	console.log('Catchall triggered');
	res.sendFile(path.join(angular_path, 'browser', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
