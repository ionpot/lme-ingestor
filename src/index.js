const fetch = require("./fetch");
const parse = require("./parse");
const publish = require("./publish");

async function handler(event) {
	const { sid, parsed } = event || {};
	const values = parsed || await fetch(sid).then(parse);
	await publish(values);
}

module.exports = { handler };
