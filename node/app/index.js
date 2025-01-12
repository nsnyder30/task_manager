const path = require('path');
const cors = require('cors');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
//const rs = require('connect-redis').default;
const { createClient } = require('redis');
const rs = require('connect-redis');
const config = require('config');
const { get_user, create_user, get_tasks } = require('./datasources/task_manager');

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

app.post('/api/create', async (req, res) => {
        const {username, password } = req.body;

        try {
                await create_user({ username: username, password: password });
                res.redirect('/');

        } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'An error creating a new user occured' });
        }
});

app.get('/api/task/by_user/:user_id', (req, res) => {
	const user_id = Number(req.params.user_id);
console.log('fetch task by user triggered');

	get_tasks({ user_id: user_id })
	.then(result => {
console.log({msg: 'tasks returned', tasks: JSON.stringify(result, null, 2)});
		if(result.res == 1 && Array.isArray(result.tasks)) {
			res.json(result.tasks);
		} else {
			res.status(404).json({message: 'Non tasks found for the given user'});
		}
	}).catch(err => {
		console.error(`Unable to find tasks associated with user ${user_id}`);
		res.status(500).json({ error: 'Database query failed' });
	});
});

app.get('/api/task/by_task/:task_id', (req, res) => {
console.log('fetch task by task id triggered');
	const task_id = req.params.task_id;
	/* get_tasks NOT IMPLEMENTED YET
	 * const task = await get_tasks({task_id: task_id});
	 *
	 * if(task.res == -1) {
	 * console.error(`Unable to find task associated with task_id ${task_id}`);
	 * res.status(500).json({ error: 'Database query failed' });
	 * }
	*/
	res.json({task_id});
});

app.get('/api/hello', (req, res) => {
	res.json({message: 'Hello from Node.js!' });
});

app.get('*', (req, res) => {
console.log('catchall triggered');
	res.sendFile(path.join(angular_path, 'browser', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
