const bcrypt = require('bcrypt');
const pool = require('../../db');
const saltRounds = 10;

const hash_password = async (password) => {
	const hash = await bcrypt.hash(password, saltRounds);
	return hash;
};

const get_user = async (user_data) => {
	let params = null;
	if(typeof user_data.id == 'number') {
		params = {field: 'usr_id', value: user_data.id};
	} else if (typeof user_data.username == 'string') {
		params = {field: 'usr_username', value: user_data.username};
	}

	if(!params) {
		return {res: -1, msg: 'No username or user id provided in user_data object'};
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

module.exports = { get_user, create_user }
