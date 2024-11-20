/** @typedef {{
  *		eur: { date: string, rate: string };
  *		gbp: { date: string, rate: string };
  *		alum: { date: string, cash: string, m3: string };
  *	}} Parsed
  */

/** @type {Parsed | null} */
let parsed = null;

/** @param {string} input
  * @returns {Parsed} */
module.exports = (input) => {
	console.log("Parsing values...");
	parsed = null;
	const calls = new Set(input.match(/\w+\(/g));
	if (calls.size === 1 && calls.has("dataLoaded(")) {
		eval(input);
		if (parsed) return parsed;
		console.debug("Input:", input);
		throw new Error("dataLoaded() was not called.");
	}
	if (calls.has("invalidSession(")) {
		throw new Error("Invalid session.");
	}
	console.debug("Calls:", calls);
	console.debug("Input:", input);
	throw new Error("Bad input.");
};

/** @param {Record<string, string>} o */
function dataLoaded(o) { // called by eval()
	parsed = {
		eur: {
			date: findDate(9384, o, "EUR/USD date"),
			rate: find(9351, o, "EUR/USD rate"),
		},
		gbp: {
			date: findDate(9448, o, "GBP/USD date"),
			rate: find(9415, o, "GBP/USD rate"),
		},
		alum: {
			date: findDate(21288, o, "ALUM date"),
			cash: find(21256, o, "ALUM cash ask"),
			m3: find(21960, o, "ALUM 3M ask"),
		},
	};
}

/** @param {number} id
  * @param {Record<string, string>} o
  * @param {string} description
  * @returns {string} */
function find(id, o, description) {
	const value = o[id];
	if (value) {
		return value;
	}
	throw new Error(`Id ${id} (${description}) has no value.`);
}

/** @param {number} id
  * @param {Record<string, string>} o
  * @param {string} description
  * @returns {string} */
function findDate(id, o, description) {
	const value = find(id, o, description);
	const [d, m, y] = value.split("/");
	if (d && m && y) {
		const n = Date.parse(`${y} ${m} ${d}`);
		if (n) {
			return value;
		}
	}
	throw new Error(`Id ${id} (${description}) is not a date: ${value}`);
}
