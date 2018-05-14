/*
 * - This is a curses program to interact with the lightning network daemon
 * -
 * - I'll add more here later........
 * -
 * -
 * -
 * -
 * -
 * -
 */

// Two required configuration files
const settings = require('../deps/_settings.json'); // Overall settings
const command_list = require('../deps/_lightning_command_list.json'); // JSON list of lightning command line options

// Required libraries
const blessed = require('blessed');
const {
	exec
} = require('child_process');
const prettyjson = require('prettyjson');

var prettyjson_options = {
	noColor: false,
	numberColor: 'white'
};

// Blessed screen layout
var screen = blessed.screen({
	dockBorders: true
});

var info = blessed.box({
	parent: screen
	, hidden: true
	, top: 'center'
	, left: 'center'
	, tags: true
	, height: 'shrink'
	, width: 'shrink'
	, border: {
		type: 'ascii'
	}
, });

var commands = blessed.list({
	top: 0
	, left: 0
	, height: '100%-8'
	, width: 20
	, mouse: true
	, alwaysScroll: true
	, scrollable: true
	, label: " Command "
	, border: {
		type: 'line'
		, fg: '#ffffff'
	}
	, scrollbar: {
		ch: '='
		, bg: 'red'
	},

	selectedBg: 'green'
	, selectedFg: 'black',

	// Allow key support (arrow keys + enter)
	keys: true,

	// Use vi built-in keys
	vi: true
});

var body = blessed.box({
	top: 0
	, left: 20
	, height: '100%-8'
	, width: '100%-20'
	, keys: false
	, mouse: true
	, tags: true
	, alwaysScroll: true
	, scrollable: true
	, label: " Command Output "
	, border: {
		type: 'line'
		, fg: '#ffff00'
	}
	, scrollbar: {
		ch: '|'
		, bg: 'red'
	}
});

var feedbackBar = blessed.textbox({
	bottom: 3
	, left: 0
	, height: 5
	, width: '100%'
	, keys: false
	, mouse: false
	, inputOnFocus: false
	, border: {
		type: 'none'
		, fg: '#ffffff'
	}
	, style: {
		fg: 'white'
	}
});

var inputBar = blessed.textbox({
	bottom: 0
	, left: 0
	, height: 3
	, width: '100%'
	, keys: true
	, mouse: true
	, inputOnFocus: true
	, border: {
		type: 'line'
		, fg: '#ffffff'
	}
	, style: {
		fg: 'black'
	}
});

// Add body to blessed screen
screen.append(commands);
screen.append(body);
screen.append(feedbackBar);
screen.append(inputBar);

// Set up key Bindings

// Close the example on Escape, Q, or Ctrl+C
screen.key(['escape', 'q', 'C-c'], (ch, key) => (process.exit(0)));
screen.key(['?'], (ch, key) => (showHelp()));

// Handling inputs
inputBar.on('submit', (text) => {
	runCommand(inputBar.value);

	inputBar.clearValue();
	inputBar.style.bg = "";
	screen.render();
});

inputBar.key('escape', () => {
	inputBar.clearValue();
	inputBar.style.bg = "";
	screen.render();
	commands.focus();
});

commands.key('enter', (ch, key) => {
	let chosen_command = commands.getItem(commands.selected).content;

	if (command_list[chosen_command].args !== "") {
		inputBar.setValue(chosen_command + ' ');
		inputBar.style.bg = "lightgreen";
		inputBar.focus();
		screen.render();
	} else {
		runCommand(chosen_command);
	}
});

commands.key(['up', 'down'], function (ch, key) {
	let command_desc = command_list[commands.getItem(commands.selected).content].desc;

	feedbackBar.setContent(command_desc);
	screen.render();
});

// End Key Bindings

// Determine if input is JSON
const isJsonString = (str) => {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

// Add text to body (replacement for console.log), also I added an append option
const log = (text, append = 0) => {
	if (!append) body.setContent('');

	if (isJsonString(text)) {
		var text_line = prettyjson.render(JSON.parse(text), prettyjson_options);
		body.pushLine(text_line);
	} else {
		body.pushLine(text);
	}
	screen.render();
}

// Show some help
const showHelp = () => {
	var helptext = '{center}{green-fg}{bold}Welcome to Lightning Curse{/bold}{/}\n\n'
		+ 'Use the up and down arrows to select a lightning command on the left to see a description below.\n'
		+ 'Hit enter to run the selected command or be prompted to enter required parameters.\n\n'
		+ 'Press {green-fg}Escape{/} or {green-fg}q{/} to exit.\n'
		+ 'Press {green-fg}?{/} to view this help screen at any time.\n'
		+ '\n\n\n\nnote: to select text you may need to hold the shift or option key.';

	log(helptext);
}

// Execute the command with any extra options
const runCommand = (command_option) => {
	exec(settings.cli_command + ' ' + command_option, (err, stdout, stderr) => {
		if (err) {
			// node couldn't execute the command
			log(stderr);
		} else {
			log(stdout);
		}
	});
	return;
}

// Get things started up
const initCommands = () => {
	commands.focus();
	commands.setItems(getCommandList(settings.user_level));

	screen.render();

	showHelp();
}

// Get the list of commands from the config for use in the command list
const getCommandList = (level) => {
	let commandList = [];

	for (const c in command_list) {
		if (command_list[c].user_level <= level) {
			commandList.push(c);
		}
	}

	return commandList;
}

// Now that everything is ready. Initialize things.
if (settings.cli_command !== "") {
	initCommands();
} else {
	log("\n\n\n{center}{green-fg}{bold}You need to edit the dep/_settings.json file to indicate the location of the lightning-cli.{/bold}{/}{/}");
}
