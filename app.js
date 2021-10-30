//Importing REquired packages
const fs = require("fs");
const express = require("express");
const readline = require("readline");
const { google } = require("googleapis");
const app = express();
let authen;
let from;
let to;
let subject;
let body;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// If modifying these scopes, delete token.json.
const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.modify",
	"https://www.googleapis.com/auth/gmail.compose",
	"https://www.googleapis.com/auth/gmail.send",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
	if (err) return console.log("Error loading client secret file:", err);
	// Authorize a client with credentials, then call the Gmail API.
	authorize(JSON.parse(content), listLabels);
});

//this function is used to check the credential of user
function authorize(credentials, callback) {
	const { client_secret, client_id, redirect_uris } = credentials.install;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0],
	);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});
}

//this function generates new token by giving a token link and field to enter it
function getNewToken(oAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	console.log("Authorize this app by visiting this url:", authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question("Enter the code from that page here: ", (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error("Error retrieving access token", err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log("Token stored to", TOKEN_PATH);
			});
			callback(oAuth2Client);
		});
	});
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
	authen = auth;
	const gmail = google.gmail({
		version: "v1",
		auth,
	});
	gmail.users.labels.list(
		{
			userId: "me",
		},
		(err, res) => {
			if (err) return console.log("The API returned an error: " + err);
			const labels = res.data.labels;
			if (labels.length) {
				console.log("Labels:");
				labels.forEach((label) => {
					console.log(`- ${label.name}`);
				});
				authen = auth;
			} else {
				console.log("No labels found.");
			}
		},
	);
}
// call this route with all the keys
app.post("/compose", function (req, res) {
	from = req.body.from;
	to = req.body.to;
	subject = req.body.subject;
	body = req.body.body;
	getAuth(authen);
	res.send("mail saved");
});
function getAuth(auth) {
	var Mail = require("./mail.js");
	var obj = new Mail(auth, from, to, subject, body, "mail");
	//'mail' is the task, if not passed it will save the message as draft.
	//attachmentSrc array is optional.
	console.log("run");
	obj.makeBody();
	//This will send the mail to the recipent.
}

let port = process.env.PORT || 3000;

//port configuration
app.listen(port, () => {
	console.log(`Server is up and listening at ${port}`);
});
