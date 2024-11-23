const { Sheets } = require("./sheets");

/** @typedef {import("./sheets").Row} Row */

/** @param {import("./parse").Parsed} values */
module.exports = async (values) => {
	console.log("Publishing values: %j", values);
	const sheets = new Sheets();
	const { eur, gbp, alum } = values;
	const rows = [
		await sheets.append("'EXCH RATE'!A:B", eur.date, eur.rate),
		await sheets.append("'EXCH RATE'!D:E", gbp.date, gbp.rate),
		await sheets.append("LMECASH!A:B", alum.date, alum.cash),
		await sheets.append("LME3M!A:B", alum.date, alum.m3),
	];
	await clearIfDuplicate(rows, sheets);
};

/** @param {Row[]} rows
  * @param {Sheets} sheets */
async function clearIfDuplicate(rows, sheets) {
	/** @type {Map<string, Row>} */
	const rowMap = new Map();
	for (const row of rows) {
		rowMap.set(previousRange(row.range), row);
	}
	const previousRanges = [...rowMap.keys()];
	const previousRows = await sheets.batchGet(previousRanges);
	for (const previous of previousRows) {
		const row = rowMap.get(previous.range);
		if (row && sameDate(row.date, previous.date)) {
			console.log(`Same date: ${previous.range} == ${row.range}`);
			await sheets.clear(row.range);
		}
	}
}

const digits = /\d+/g;

/** @param {string} range
  * @returns {string} */
function previousRange(range) {
	const matched = range.match(digits);
	if (matched) {
		const row = matched.at(-1);
		return range.split(row).join(row - 1);
	}
	throw new Error(`Given range has no digits: ${range}`);
}

/** @param {string} a
  * @param {string} b
  * @returns {boolean} */
function sameDate(a, b) {
	a = a.match(digits)?.join("/");
	b = b.match(digits)?.join("/");
	return a === b;
}
