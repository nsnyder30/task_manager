const path = require('path');
const cors = require('cors');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { createClient } = require('redis');
const rs = require('connect-redis');
const config = require('config');
const { get_user, create_user, get_tasks, activate_task, deactivate_task } = require('./datasources/task_manager');
const errorHandler = require('./utils/error_handler');
const CustomError = require('./utils/custom_error');

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
		throw new CustomError(`An error occured while creating a new record`, 400, {}, err);
        }
});

app.get('/api/task/by_user/:user_id', (req, res) => {
	const user_id = Number(req.params.user_id);

	get_tasks({ user_id: user_id })
	.then(result => {
		const tasks = Array.isArray(result.tasks) ? result.tasks : {};
		res.json( tasks );
	}).catch(err => {
		throw new CustomError(`Unable to find tasks associated with user ${user_id}`, 400, { user_id }, err);
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
		throw new CustomError(`Task activation failed`, 400, { method: 'Task activation api endpoint'}, err);
	});
});

app.post('/api/task/deactivate/', (req, res) => {
	const task_id = Number(req.body.task_id);
	deactivate_task({ task_id: task_id })
	.then(result => {
		return res.json(result.task);
	}).catch(err => {
		throw new CustomError(`Failed to deactivate task ${task_id}`, 400, { task_id }, err);
	});
});

app.get('/api/hello', (req, res) => {
	res.json({message: 'Hello from Node.js!' });
});

app.get('*', (req, res) => {
	res.sendFile(path.join(angular_path, 'browser', 'index.html'));
});

app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
