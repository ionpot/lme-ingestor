const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");

const { SHEET_ID } = require("./env");

/** @param {import("./parse").Parsed} values */
module.exports = async (values) => {
	console.log("Publishing values: %j", values);
	const sheets = new Sheets();
	const { eur, gbp, alum } = values;
	console.log("Writing EUR/USD...");
	await sheets.append("'EXCH RATE'!A:B", eur.date, eur.rate);
	console.log("Writing GBP/USD...");
	await sheets.append("'EXCH RATE'!D:E", gbp.date, gbp.rate);
	console.log("Writing ALUM CASH...");
	await sheets.append("LMECASH!A:B", alum.date, alum.cash);
	console.log("Writing ALUM 3M...");
	await sheets.append("LME3M!A:B", alum.date, alum.m3);
};

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
	  * @param {string} value */
	async append(range, date, value) {
		const result = await this.service.values.append({
			spreadsheetId: SHEET_ID,
			range,
			valueInputOption: "USER_ENTERED",
			requestBody: { values: [[date, value]] },
		});
		console.log("Updated range:", result.data.updates?.updatedRange);
	}
}
