const { z } = require('zod');
const bcrypt = require('bcrypt');
const pool = require('../../db');
const saltRounds = 10;

// METHOD FOR VALIDATING INPUT OBJECTS AND RETURNING QUERY FIELDS AND PARAMETERS
const parse_insert_params = async (data, schema, field_map) => {
	let validated_data;
	try {
		validated_data = schema.parse(data);
	} catch (err) {
		return {error: true, 
			msg: 'Validation failed', 
			issues: err.issues || err
		}
	}

	let fields = [];
	let values = [];

	for(const k of Object.keys(field_map)) {
		if (validated_data[k] == undefined) {
			continue;
		}

		let v = 
			k === 'password' 
			? await hash_password(validated_data[k]) 
			: validated_data[k];

		fields.push(field_map[k]);
		values.push(v);
	}

	if(fields.length == 0) {
		return {error: true, msg: 'No valid key-value pairs were provided'};
	}

	return {error: false, fields, values};
}

// SIMPLE HASHING UTILITY
const hash_password = async (password) => {
	const hash = await bcrypt.hash(password, saltRounds);
	return hash;
};

// DYNAMIC UTILITY FOR TRANSLATING USER DATA TO QUERY CONDITIONS
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
		return {res: 1, field: "usr_username", value: user_data.username};
	}
	
	return {res: -1, msg: "No username or user id provided in user_data input"};
}

// DYNAMIC UTILITY FOR TRANSLATING TASK DATA TO QUERY CONDITIONS
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

// METHOD: RETRIEVE USER
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

// DEFINE USER SCHEMA AND FIELD MAP FOR PARSE_INPUT_PARAMS METHOD
const user_schema = z.object({
	username: z.string().min(1, 'Username is required'), 
	password: z.string().min(1, 'Password is required'), 
	first: z.string().optional(), 
	last: z.string().optional(), 
	email: z.string().email('Invalid email format').optional()
});

const user_field_map = {
	username: 'usr_username', 
	password: 'usr_pwhash', 
	first: 'usr_first', 
	last: 'usr_last', 
	email: 'usr_email'
}

// METHOD: CREATE NEW USER
const create_user = async (user_data) => {
	const { error, msg, issues, fields, values } = await parse_insert_params (
		user_data, 
		user_schema, 
		user_field_map
	);

	if(error) {
		return {res: 0, msg, errors: issues};
	}

	await pool.execute('INSERT INTO tm_users ('+fields.join(', ')+') VALUES ('+fields.map((f) => '?').join(', ')+')', values);
	return {res: 1, msg: 'User created'};
};

// METHOD: RETRIEVE ONE OR MORE TASKS, DEPENDING ON PROVIDED TASK DATA
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

// DEFINE SCHEMA AND FIELD MAP FOR CREATING RECORDS OF CURRENTLY ACTIVE TASKS
const task_activation_schema = z.object({
	owner: z.number(),
	task_id: z.number(), 
	start_time: z.string(), 
	uid: z.number()
});

const task_activation_field_map = {
	owner: 'act_owner', 
	task_id: 'act_task_id', 
	start_time: 'act_start_time', 
	uid: 'act_uid'
};

// METHOD: CREATE DATABASE RECORD TO INDICATE TASK IS CURRENTLY ACTIVE
const activate_task = async (task_data) => {
	let { error, msg, issues, fields, values } = await parse_insert_params (
		task_data, 
		task_activation_schema, 
		task_activation_field_map
	);
	if(error) {
		return {res: 0, msg, errors: issues};
	}

	try {
		let query = `INSERT INTO activity (act_owner, act_task_id, act_start_time, act_uid)
				  VALUES (?, ?, ?, ?) 
		 ON DUPLICATE KEY UPDATE act_id = act_id`;
		const result = await pool.execute(query, values);

		return {res: 1, msg: `Task ${task_data.act_task_id} activated`, task: task_data, dbResult: result};
	} catch (err) {
		return {res: -1, msg: 'Task activation failed', err: err};
	}

	return {res: 0, msg: 'No returns caught', task: task_data};
}


// DEFINE SCHEMA AND FIELD MAP FOR CREATING RECORDS OF CURRENTLY ACTIVE TASKS
const task_deactivation_schema = z.object({
	task_id: z.number()
})

const task_deactivation_field_map = {task_id: 'act_task_id'};

// METHOD: CREATE DATABASE RECORD TO INDICATE TASK IS CURRENTLY ACTIVE
const deactivate_task = async (task_data) => {
	const { error, msg, issues, fields, values } = await parse_insert_params (
		task_data,
		task_deactivation_schema, 
		task_deactivation_field_map
	);
	if(error) {
		return {res: 0, msg, error: error}
	}
	try {
		let query = `UPDATE activity SET act_end_time = CURRENT_TIMESTAMP() WHERE act_task_id = ${task_data.task_id}`;
		const result = await pool.execute(query, []);


		return {res: 1, msg: `Task ${task_data.act_task_id} deactivated`, task: task_data, dbResult: result};
	} catch (err) {
		return {res: -1, msg: 'Task deactivation failed', err: err};
	}
}

module.exports = { get_user, create_user, get_tasks , activate_task, deactivate_task };
