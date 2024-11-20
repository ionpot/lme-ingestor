const http = require("http");
const qs = require("querystring");

const { MM_USER, MM_PASS } = require("./env");

const hostname = "www.metalsmarket.net";

/** @param {string?} sessionId
  * @returns {Promise<string>} */
module.exports = async (sessionId) => {
	return getData(
		sessionId
		|| await postCredentials().then(grabCookies).then(findSessionId)
	);
};

/** @returns {Promise<http.IncomingMessage>} */
function postCredentials() {
	console.log("Logging in to", hostname);
	const body = new URLSearchParams({
		username: MM_USER,
		password: MM_PASS,
		login: "Log in",
	});
	const req = http.request({
		hostname,
		path: "/login.php",
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
	return new Promise((done, fail) => {
		req.on("response", res => {
			res.on("end", () => done(res));
			res.on("error", fail);
			res.resume(); // discard response body
		});
		req.on("error", fail);
		req.end(body.toString());
	});
}

/** @param {http.IncomingMessage} res
  * @returns {string[]} */
function grabCookies(res) {
	if (res.statusCode === 302) {
		return res.headers["set-cookie"] || [];
	}
	console.debug("Status code:", res.statusCode);
	console.debug("Headers:", res.headers);
	throw new Error("Login failed.");
}

/** @param {string[]} cookies
  * @returns {string} */
function findSessionId(cookies) {
	const token = "datamet_sid=";
	for (const text of cookies) {
		if (text.startsWith(token)) {
			return text.replace(token, "").trim();
		}
	}
	console.debug("Cookies:", cookies);
	throw new Error(`Cookie "${token}" not found.`);
}

/** @param {string} sessionId
  * @returns {Promise<string>} */
function getData(sessionId) {
	console.log("Fetching data using sid:", sessionId);
	const req = http.request({
		hostname,
		path: "/get_data.php?" + qs.stringify({
			"ms": 0,
			"rand": new Date().getTime(),
			"sid": sessionId,
		}),
	});
	return new Promise((done, fail) => {
		req.on("response", res => {
			let body = "";
			res.on("data", chunk => { body += chunk; });
			res.on("end", () => {
				const code = res.statusCode;
				if (code === 200) {
					return done(body);
				}
				console.debug("Status code:", code);
				console.debug("Headers:", res.headers);
				console.debug("Body:", body);
				return fail(new Error(`get_data.php returned ${code}.`));
			});
			res.on("error", fail);
		});
		req.on("error", fail);
		req.end();
	});
}
