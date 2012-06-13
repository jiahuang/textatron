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

########################################################################
# Static routes
########################################################################

########################################################################
# Entry
########################################################################
if __name__ == '__main__':
  app.run(port=9000)