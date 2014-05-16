#!/usr/bin/python

import os
import sys
import argparse
import datetime
from pymongo import MongoClient
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3

def directory(path):
    if not(os.path.exists(path) and os.path.isdir(path)):
        raise argparse.ArgumentTypeError('Invalid directory path')
    return path

parser = argparse.ArgumentParser()

parser.add_argument("rootdir", type=directory, help="the directory to scan for mp3 files")
parser.add_argument("--reset", action="store_true", help="remove all song data before scanning")

args = parser.parse_args()
rootdir = args.rootdir

if not(os.path.isabs(rootdir)):
    rootdir = os.path.abspath(rootdir)

client = MongoClient('localhost', 27017)
db = client.cwfm

if (args.reset):
    print 'resetting'
    db.songs.drop()
else:
    db.songs.remove({'path': {'$regex': '^' + rootdir}})

success_count = 0
error_count = 0
print 'removing, then importing data for ' + rootdir
for root, subFolders, files in os.walk(rootdir):

    for filename in files:
        filePath = os.path.join(root, filename)
        name, extension = os.path.splitext(filePath)
        if (extension == '.mp3'):
            try:
                audio = MP3(filePath, ID3=EasyID3)
                song = {"duration" : audio.info.length,
                        "album" : "",
                        "title" : [audio["title"][0]],
                        "path" : filePath,
                        "modified" : datetime.datetime.utcnow(),
                        "added" : datetime.datetime.utcnow(),
                        "genre" : [],
                        "albumartist" : [],
                        "artist" : [audio["artist"][0]]}
                db.songs.insert(song)
                success_count += 1
            except KeyError:
                print "unable to import: %s" % (filePath)
                error_count += 1

print "Scan Complete"
print "songs imported: %d" % (success_count)
if (error_count):
    print "number of errors: %d" % (error_count)
