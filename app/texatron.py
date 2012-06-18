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
import simplejson
from urlparse import urlparse

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
	request.form.get('')
	return json_res({'success': 'Sweet, your command has been added. Try texting '+cmd+' to '+TEXATRON_NUMBER})

@app.route('/requests', methods=["POST"])
def requests():
  print "REACHED: /request\n"
  # this request should only be accessed through twilio
  fromNumber = request.form.get('From', None)
  msg = clean(request.form.get('Body', None).lower())
  log('access', 'REQUEST: '+fromNumber+' '+msg)

  currDate = datetime.datetime.utcnow()
  user = db.users.find_one({'number': fromNumber})
  req = {'time':currDate, 'message':msg}
    
  db.users.update({'number':fromNumber}, {'$push':{'requests':req}})
  log('access', "REACHED: new request "+msg+" from "+fromNumber)
  Commander(fromNumber, msg).start()

  return json_res({'success': 'hit requests'})

########################################################################
# Static routes
########################################################################
@app.route('/', methods=['GET'])
def main():
  if "logged_in" in session and session['logged_in']:
    return render_template('settings.html')
  else:
    return render_template('main.html')

########################################################################
# Entry
########################################################################
if __name__ == '__main__':
  app.run(port=9000)