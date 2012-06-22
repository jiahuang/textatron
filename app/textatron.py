# 
# Textatron
# Jialiya Huang
# 2012
# Twilio new hire project
#

########################################################################
# Imports
########################################################################

import flask
import shutil
from flask import Flask, request, session, g, redirect, url_for, \
	abort, render_template, flash, Response	
from contextlib import closing
import os
import datetime, sys, json, time, uuid, subprocess
from models import *
import twilio.twiml
from logger import log
#import simplejson
from urlparse import urlparse
from commander import *

########################################################################
# Configuration
########################################################################

DEBUG = True
# create app
app = Flask(__name__)
app.config.from_object(__name__)

########################################################################
# Helper functions
########################################################################
def json_res(obj):
  # convert datetimes to miliseconds since epoch
  dthandler = lambda obj: time.mktime(obj.timetuple())*1000 if isinstance(obj, datetime.datetime) else None
  return Response(json.dumps(obj, default=dthandler), mimetype='application/json')

########################################################################
# Routes
########################################################################
@app.route('/command', methods=["GET"])
def command():
  # given a web page url, gets all the commands that other people 
  # have made off of it
  return

@app.route('/command/new', methods=["POST"])
def newCommand():
  #cmd = json.loads(request.form.get('cmd', ''))
  url = request.form.get('url', '');
  urlparts = urlparse(url)
  if not urlparts.scheme:
    url = 'http://'+url
  newCmd = db.Commands()
  newCmd.cmd = request.form.get('cmd', '').lower()
  newCmd.url = url
  # parsing for switches
  #switches = re.findall(r"(?<={)[^{|}]+(?=})", newCmd['url'])
  parsedSwitches = [{'switch':switch.split('=')[0], 'default':switch.split('=')[1] if len(switch.split('=')) > 1 else ''} for switch in re.findall(r"(?<={)[^{|}]+(?=})", url)]
  # parsing css selectors
  # parsedCSS = [clean(selector) for selector in cmd['css'].split(',') if selector != '']
  newCmd.switches = parsedSwitches
  newCmd.selectors = request.form.get('css', '')
  newCmd.save()
  return json_res({'success': 'Sweet, your command has been added. Try texting '+newCmd.cmd+' to '+TEXTATRON_NUM})

@app.route('/requests', methods=["POST"])
def requests():
  print "REACHED: /request\n"
  # this request should only be accessed through twilio
  fromNumber = request.form.get('From', '')
  msg = clean(request.form.get('Body', '').lower())

  log('access', 'REQUEST: '+fromNumber+' '+msg)

  currDate = datetime.datetime.utcnow()
  #user = db.users.find_one({'number': fromNumber})
  req = {'time':currDate, 'message':msg}
    
  db.users.update({'number':fromNumber}, {'$push':{'requests':req}}, True) # upsert
  log('access', "REACHED: new request "+msg+" from "+fromNumber)
  Commander(fromNumber, msg).start()

  return json_res({'success': 'hit requests'})

########################################################################
# Static routes
########################################################################
@app.route('/', methods=['GET'])
def main():
  return render_template('main.html')

########################################################################
# Entry
########################################################################
if __name__ == '__main__':
  app.run(port=9000)