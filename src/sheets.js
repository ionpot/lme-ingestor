const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");

const { SHEET_ID } = require("./env");

/** @typedef {{ range: string, date: string }} Row */

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

module.exports = { Sheets };
