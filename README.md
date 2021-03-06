cwfm
====

# Clockwork.FM

A social music player that uses node.js to manage music rooms.

## Requirements
 - [npm](https://www.npmjs.org/)
 - [node.js](http://nodejs.org/)
 - [bower](http://bower.io/)
 - [mongodb](http://www.mongodb.org/)
 - [ffmpeg](http://ffmpeg.org/)

## Installation

1. install [node.js](http://nodejs.org) >= 0.10
1. `brew install ffmpeg`
1. `brew install mongodb`
1. `sudo npm install -g bower`
1. `git clone git@github.com:ClockworkNet/cwfm.git cwfm`
1. `cd cwfm`
1. `npm install`
1. `bower install`
1. `sudo mkdir -p ./cwfm/data/db`
1. `sudo chown `id -u` ./cwfm/data/db`
1. `cp ./cwfm/config-example.js ./cwfm/config.js`
1. Configure your `config.js` file.

## Running
1. `mongod`
2. `node app.js`

## Development @todo
 - Scoring
 - Admin features
 - Room notifications in chat
 - Drag drop for queue
 - Crossfade
 - Authentication audit