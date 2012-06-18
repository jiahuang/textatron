import datetime
from logger import log
from globalConfigs import *
import string

@connection.register
class Users(Document):
  __collection__ = 'users'
  __database__ = DATABASE_TEXT
  structure = {
    'number' : unicode,
    'requests' : [{	
      'time' : datetime.datetime,
      'message' : unicode,
    }],
    'cmds' : [pymongo.objectid.ObjectId]
  }
  # ensuring unique numbers
  indexes = [{ 
    'fields' : ['number'], 
    'unique' : True, 
  }]
  use_dot_notation = True 
  required_fields = ['number']

@connection.register
class Cache(Document):
  __collection__ = 'cache'
  __database__ = DATABASE_TEXT
  structure = {
    'number' : unicode, 
    'data' : unicode,
    'index' : int, # index of data that user has been sent
    'time' : datetime.datetime # time cached
  }
  default_values = {
    'time' : datetime.datetime.utcnow()
  }
  use_dot_notation = True 

@connection.register
class Commands(Document): #user generated commands
  use_schemaless = True
  __collection__ = 'commands'
  __database__ = DATABASE_GLAD
  structure = {
    'cmd' : unicode, 
    'url': unicode,
    'switches' : [{
    	'switch' : unicode,
    	'default': unicode
    }],
    'selectors' : unicode,
    'dateUpdated' : datetime.datetime
  }
  indexes = [{ 
    'fields' : ['cmd'],
  }]
  default_values = {
    'switches': [],
    'selectors':[],
    'dateUpdated':datetime.datetime.utcnow()
  }
  use_dot_notation = True 
