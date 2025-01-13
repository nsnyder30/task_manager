const bcrypt = require('bcrypt');
const pool = require('../../db');
const saltRounds = 10;

const hash_password = async (password) => {
	const hash = await bcrypt.hash(password, saltRounds);
	return hash;
};

const user_condition = async (user_data) => {
	let params = null;

	if(typeof user_data == 'string') {
		user_data = {username: user_data};
	} else if (typeof user_data == 'number') {
		user_data = {user_id: user_data};
	}

	if(typeof user_data != 'object') {
		return {res: -1, msg: "'Incorrect data type provided for user_data. Expected 'object' but got '"+(typeof user_data)+"'"};
	}

	if(typeof user_data.user_id == 'number') {
		return {res: 1, field: "usr_id", value: user_data.user_id};
	} else if (typeof user_data.username == 'string') {
		return {res: 1, field: "usr_username", value: "'"+user_data.username+"'"};
	}
	
	return {res: -1, msg: "No username or user id provided in user_data input"};
}

const task_condition = async (task_data) => {
	if(typeof task_data == 'number') {
		task_data = {task_id: task_data};
	}
	if(typeof task_data.task_id == 'number') {
		return {res: 1, field: 'tsk_id', value: task_data.task_id};
	}

	const user_params = user_condition(task_data);
	if(user_params.res == -1) {
		return {res: -1, msg: "No task id provided in task_data input"};
	}

	return user_params;
}

const get_user = async (user_data) => {
	const params = await user_condition(user_data);

	if(params.res == -1) {
		return params;
	}

	try {
		const query = `SELECT usr_id AS user_id, usr_username AS username, usr_email AS email,                                                                                                                                                usr_first AS firstname, usr_last AS lastname, usr_pwhash AS passwordHash
				 FROM tm_users
				WHERE ${params.field} = ?`;
		const [recs] = await pool.execute(query, [params.value]);


		if (recs.length == 0) {
			return {res: 0, msg: 'No data returned'};
		}

		return {res: 1, user: recs[0]};
	} catch (err) {
		console.error(err);
		return {res: -1, msg: err};
	}
};

// This method can probably be abstracted to a general INSERT command
// passing field map as an input argument
const create_user = async (user_data) => {
	const passthrough_keys = {
		username: {type: 'string', required: true, field: 'usr_username'}, 
		password: {type: 'string', required: true, field: 'usr_pwhash'}, 
		first: {type: 'string', required: false, field: 'usr_first'}, 
		last: {type: 'string', required: false, field: 'usr_last'}, 
		email: {type: 'string', required: false, field: 'usr_email'}
	};

	let missing_keys = Object.keys(passthrough_keys).filter(function(k) {
		return passthrough_keys[k].required && !(k in user_data && typeof user_data[k] == passthrough_keys[k].type);
	});

	if(missing_keys.length > 0) {
		return {res: 0, msg: 'The following keys were missing from the supplied user data: '+missing_keys.join(', ')};
	}

	let input_params = Object.keys(passthrough_keys).filter(function(k) {
		return k in user_data && typeof user_data[k] == passthrough_keys[k].type;
	}).map(function(k) {
		let v = k == 'password' ? hash_password(user_data[k]) : user_data[k];
		return {field: passthrough_keys[k].field, value: v};
	});

	let fields = input_params.map((p) => p.field);
	let values = input_params.map((p) => p.value);
	await pool.execute('INSERT INTO tm_users ('+fields.join(', ')+') VALUES ('+fields.map((f) => '?').join(', ')+')', values);
	return {res: 1, msg: 'User created'};
};

const get_tasks = async (task_data) => {
	const params = await task_condition(task_data);
	if(params.res == -1) {
		return params;
	}

	try {
		let query = `SELECT tsk_id, tsk_name, tsk_status, tsk_owner, tsk_parent, tsk_level 
			   FROM tasks 
   		     INNER JOIN tm_users ON usr_id = tsk_owner 
			  WHERE ${params.field} = ?`;
		let [tasks] = await pool.execute(query, [params.value]);

		
		let task_list = {};
		for(tsk of tasks) {
			tsk.activities = [];
			tsk.active = false;
			task_list[tsk.tsk_id] = tsk;
		}
		

		query = `SELECT act_id, act_owner, act_task_id, act_start_time, act_end_time, act_uid, 
				    act_recurrence, act_interval, act_frequency, act_weekdays, act_monthdates, 
				    act_start_date, act_end_date, act_status 
			       FROM activity 
			 INNER JOIN tasks ON tsk_id = act_task_id 
			 INNER JOIN tm_users ON usr_id = tsk_owner 
			      WHERE ${params.field} = ?`;
		let [activities] = await pool.execute(query, [params.value]);
		
		for(act of activities) {
			if(act.act_task_id in task_list) {
				task_list[act.act_task_id].activities.push(act);
				task_list[act.act_task_id].active = task_list[act.act_task_id].active || (act.act_start_time && !act.act_end_time);
			}
		}
		
		tasks = Object.keys(task_list).map(function(k){return task_list[k];});

		if (tasks.length == 0) {
			return {res: 0, msg: 'No data returned'};
		}
		return {res: 1, tasks: tasks, activities: activities};
	} catch (err) {
		console.error(err);
		return {res: -1, msg: err};
	}
}

module.exports = { get_user, create_user, get_tasks };
