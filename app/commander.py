from models import *
from twilio.rest import TwilioRestClient
from time import gmtime, strftime
import urllib2
#import simplejson
import re
from logger import log
from lxml import html as lh
from lxml.cssselect import CSSSelector 
import time
from threading import Thread
from operator import itemgetter

CLIENT = TwilioRestClient(TWILIO_SID, TWILIO_AUTH)
MAX_TEXTS = 4 # max number before delaying into more

def clean(s):
  s = re.sub("\s+", " ", s)
  s = s.strip(" ")
  return s

class Commander(Thread):
  def __init__(self, fromNumber, cmd):
    self.num = fromNumber
    #print "commander number", fromNumber
    self.user = db.Users.find_one({"number":fromNumber})
    #print "commander user", self.user
    self.moreText = '(txt "more" to cont)'
    self.cmd = cmd
    Thread.__init__(self)

  def run(self):
		# parses command
    cmd = clean(self.cmd)
    cmd = cmd.lower()
    cmdHeader = cmd.split(' ')[0]
    if cmdHeader == 'more':
      self.processMsg('', False)
    else:
      res = self.performCustomCommand(cmd)
      if "error" in res:
        self.processMsg(res["error"])
      else:
        self.processMsg(res['success'])
      
  def performCustomCommand(self, cmd):
    cmdHeader = cmd.split(' ')[0]
    # look through custom commands
    customCmds = db.Commands.find({'cmd':cmdHeader}, {'_id':1})
    
    if customCmds.count() == 0:
      # if no results, error out
      return {'error':cmdHeader+' command not found.'} #TODO: add suggestions module?
    else:
      # grab the first returned result
      return self.customCommandHelper(list(customCmds)[0]['_id'], cmd)
    
  
  def customCommandHelper(self, cmdId, userCmd):
    cmd = db.Commands.find_one({'_id':cmdId})
    # parse out userCmd according to switch operators
    if len(cmd.switches) > 0:
      # there are switches, parse them
      
      switchLocs = []
      switches = []
      #print "switches", cmd.switches
      for s in cmd.switches:
        if s['switch']:
          if userCmd.find(s['switch']+'.') >= 0:
            switchLocs.append({'s':s['switch'], 'loc':userCmd.find(s['switch']+'.'), 'default': s['default']})
          elif  s['default'] != '':
            switches.append({'s':s['switch']+'='+s['default'], 'data':s['default']})
          else:
            return {'error':'Error:missing '+s['switch']+' switch. ex:'+cmd.example}
        
      #sort by locs
      switchLocs = sorted(switchLocs, key=itemgetter('loc'))
      for i in xrange(len(switchLocs)-1):
        s1 = switchLocs[i]
        s2 = switchLocs[i+1]
        data = clean(userCmd[s1['loc']+len(s1['s'])+1:s2['loc']]).replace(' ', '%20')
        if s['default'] != '':
          switches.append({'s':s1['s']+'='+s1['default'], 'data':data})
        else:
        	switches.append({'s':s1['s'], 'data':data})
      # append final one
      if len(switchLocs) > 0:
        data = clean(userCmd[switchLocs[-1]['loc']+len(switchLocs[-1]['s'])+1:]).replace(' ', '%20')
        if s['default'] != '':
        	switches.append({'s':switchLocs[-1]['s']+'='+switchLocs[-1]['default'],'data':data})
        else:
        	switches.append({'s':switchLocs[-1]['s'],'data':data})

      url = cmd.url
      #print switches
      #put together url with switches
      for s in switches:
        #print '{'+s['s']+'}', s['data']

        newUrl = url.replace('{'+s['s']+'}', s['data'])
        if newUrl == url:
          # something went wrong. a command didnt get replaced
          return {'error':"Error:couldn't find switch "+s['s']+""}
        else:
          url = newUrl
    else:
      url = cmd.url
    try:
      #print url
      request = urllib2.Request(url)
      request.add_header("User-Agent", 'Texatron/0.1')
      raw = urllib2.urlopen(request)
      msg = ''
      count = 1
      text = self.findHtmlElements(lh.parse(raw), cmd.selectors)
      
      for t in text:
        msg = msg + ' '+ str(t.encode('UTF-8', errors='replace'))
      #  count = count + 1
      return {'success':msg}
    except urllib2.HTTPError, e:
      return {"error": "HTTP error: %d" % e.code}
    except urllib2.URLError, e:
      return {"error": "Network error: %s" % e.reason.args[1]} 

  def findHtmlElements(self, eTree, css):
    sel = CSSSelector(css)
    
    foundText = [e.text_content() for e in sel(eTree)]
    #foundText.join('')
    return foundText

  def processMsg(self, msg, isNewMsg=True, cache=True):
    print "process Msg", msg
    if cache:
      cacheNumber = db.cache.find_one({'number':self.num})
      currDate = datetime.datetime.utcnow()
      index = 160*MAX_TEXTS-len(self.moreText)
      if cacheNumber and isNewMsg:
        # update cache
        db.cache.update({'number':self.num}, {'$set':{'data':msg, 'index':index, 'time':currDate}})
      elif not isNewMsg:
      	# old message, move cache index
        msg = cacheNumber['data']
        index = cacheNumber['index']
        if (index > len(msg)):
          return # break out
        msg = msg[index:]
        # move cache index to new place, send off message
        db.cache.update({'number':self.num}, {'$set':{'index':max(len(msg), index+160*MAX_TEXTS)}})
      else: 
      	# new cache for that number
        cache = db.Cache()      
        cache.number = unicode(self.num)
        cache.data = unicode(msg, errors='ignore')
        cache.index = index
        cache.time = currDate
        cache.save()
    i = 0
    while i*160 < len(msg) and i<MAX_TEXTS:
      print "sending msg"
      if i+1 >= MAX_TEXTS and len(msg) > (i+1)*160:
        CLIENT.sms.messages.create(to=self.num, from_=TWILIO_NUM, body = msg[i*160:(i+1)*160-len(self.moreText)]+self.moreText)
        #print self.msg[i*160:(i+1)*160-len(self.moreText)]+self.moreText
      elif (i+1)*160 <= len(msg):
        CLIENT.sms.messages.create(to=self.num, from_=TWILIO_NUM, body = msg[i*160:(i+1)*160])
        #print self.msg[i*160:(i+1)*160]
      else:
        CLIENT.sms.messages.create(to=self.num, from_=TWILIO_NUM, body = msg[i*160:])
        #print self.msg[i*160:]

      self.user.save()
      i = i + 1
      #sleep 1.5 seconds
      if i < len(msg):
        time.sleep(1.5)
        
    log('text', self.num+':'+str(unicode(msg, errors='ignore')))