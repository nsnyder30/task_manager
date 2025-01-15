const path = require('path');
const cors = require('cors');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { createClient } = require('redis');
const rs = require('connect-redis');
const config = require('config');
const { get_user, create_user, get_tasks, activate_task, deactivate_task } = require('./datasources/task_manager');

const app = express();
const angular_path = path.join(__dirname, '..', 'node_modules', 'angular_build');
const redisClient = createClient({
	url: config.redisStore.url, 
	password: config.redisStore.password
});

require('./authentication').init(app);

redisClient.connect().catch(console.error);
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

	get_tasks({ user_id: user_id })
	.then(result => {
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

app.post('/api/task/activate', (req, res) => {
	let { task_id, owner, uid, start_time } = req.body;
	task_id = Number(task_id);
	owner = Number(owner);
	uid = Number(uid);

	activate_task({ task_id: task_id, owner: owner, uid: uid, start_time: start_time })
	.then(result => {
		return res.json(result.task);
	}).catch(err => {
		console.error({msg: `Failed to activate task ${task_id}`, err: err});
		res.status(500).json({ error: 'Task activation failed' });
	});
});

app.post('/api/task/deactivate/', (req, res) => {
	const task_id = Number(req.body.task_id);
	deactivate_task({ task_id: task_id })
	.then(result => {
		return res.json(result.task);
	}).catch(err => {
		console.error(`Failed to deactivate task ${task_id}`);
		res.status(500).json({ error: 'Task deactivation failed' });
	});
});

	app.get('/api/hello', (req, res) => {
	res.json({message: 'Hello from Node.js!' });
});

app.get('*', (req, res) => {
	res.sendFile(path.join(angular_path, 'browser', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
