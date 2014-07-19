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
1. `sudo mkdir -p ./data/db`
1. `sudo chown $(id -u) ./data/db`
1. `cp ./config-example.js ./config.js`
1. Configure your `config.js` file.

## Running
1. `mongod --dbpath=./data/db`
2. `node app.js`

## Index MP3 Files

In order for users to be able to add songs to their playlist the songs need to be added to the database first. Right now this is done via a python script that recursively scans a directory of MP3 files, reads there ID3 tags and then enters the info into a database.

Use the following to run the included MP3 indexer.

`pip install pymongo`
`pip install mutagen`
`./bin/scan_library.py`

## Development @todo
 - Scoring
 - Admin features
 - Drag drop for queue
 - Crossfade?
