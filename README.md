# ms-maps

## Installation

Run `./install` to clean and install the needed tools.
You will need to have Yarn installed.

## Building and Developing

Run `./build` to build the files, which just runs `node_modules/.bin/grunt`

Run `./serve` to start running the server,
which just runs `node_modules/.bin/grunt serve`

The entire project assumes the client browser is mostly compatibly with ES6.
To run the code in older browsers, apply Babel to the code to make it compatible.

## Testing

Run `./run-tests` to run the unit tests, which
just runs `node_modules/.bin/grunt test`
