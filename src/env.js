/** @param {string} name */
function env(name) {
	const value = process.env[name] || "";
	if (value) {
		return value;
	}
	throw new Error(`${name} has no value.`);
}

exports.MM_USER = env("MM_USER");
exports.MM_PASS = env("MM_PASS");
exports.SHEET_ID = env("SHEET_ID");
