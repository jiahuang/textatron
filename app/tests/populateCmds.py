import sys
sys.path.append("../")
from models import *

def makeUser():
	user = db.Users()
 	user.number = u'+19193971139'
	req = {'time':datetime.datetime.utcnow(), 'msg':u'populate'}
	user.requests = [req]
	user.save()

def populate():
	# populate custom commands table
  cmds = [u'hn', u'woot', u'reddit', u'gh', u'amzn']
  urls = [u'http://news.ycombinator.com', u'http://www.woot.com', u'http://www.reddit.com', u'https://github.com/{u=twitter}/{p=bootstrap}', u'http://www.amazon.com/s/?field-keywords={p}']
  switches = [[], [], [], [{'switch':u'u', 'default':u'twitter'}, {'switch':u'p', 'default':u'bootstrap'}], [{'switch':u'p', 'default':u'television'}]]
  cssSelectors = [u'td.title', u'h2.fn, h3.price', u'a.title', u'article.markdown-body entry-content', u'span.lrg.bold, span.bld.red.lrg']

  for i in xrange(len(cmds)):
  	custom = db.Commands()
  	custom.cmd = cmds[i]
  	custom.url = urls[i]
  	custom.selectors = cssSelectors[i]
  	custom.switches = switches[i]
  	custom.save()

def main(name):
  makeUser()
  populate()
  
if __name__ == '__main__':
  main(*sys.argv)