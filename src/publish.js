const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");

const { SHEET_ID } = require("./env");

/** @typedef {{ range: string, date: string }} Row */

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

/** @param {string} range
  * @returns {string} */
function previousRange(range) {
	const digits = range.match(/\d+/);
	if (digits) {
		const row = digits[0];
		return range.split(row).join(row - 1);
	}
	throw new Error(`Given range has no digits: ${range}`);
}

/** @param {string} a
  * @param {string} b
  * @returns {boolean} */
function sameDate(a, b) {
	const d = /\d+/g;
	return a.match(d)?.join("/") === b.match(d)?.join("/");
}

class Sheets {
	constructor() {
		const sheets = google.sheets({
			version: "v4",
			auth: new GoogleAuth({
				scopes: "https://www.googleapis.com/auth/spreadsheets",
			}),
		});
		this.service = sheets.spreadsheets;
	}
	/** @param {string} range
	  * @param {string} date
	  * @param {string} value
	  * @returns {Promise<Row>} */
	async append(range, date, value) {
		const { data } = await this.service.values.append({
			spreadsheetId: SHEET_ID,
			range,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [[date, value]] },
		});
		const { updatedRange } = data.updates || {};
		if (updatedRange) {
			console.log("Updated range:", updatedRange);
			return { range: updatedRange, date };
		}
		console.debug("data = %j", data);
		throw new Error(`Couldn't append to ${range}`);
	}
	/** @param {string[]} ranges
	 * @returns {Promise<Row[]>} */
	async batchGet(ranges) {
		const { data } = await this.service.values.batchGet({
			spreadsheetId: SHEET_ID,
			ranges,
		});
		/** @type {Row[]} */
		const rows = [];
		for (const item of data.valueRanges ?? []) {
			const { range, values = [] } = item;
			const date = values[0]?.[0];
			if (range && date) {
				rows.push({ range, date });
			}
		}
		return rows;
	}
	/** @param {string} range */
	async clear(range) {
		const { data } = await this.service.values.clear({
			spreadsheetId: SHEET_ID,
			range,
		});
		console.log("Cleared range:", data.clearedRange);
	}
}
