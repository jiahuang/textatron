import sys
sys.path.append("../")
from models import *
from commander import Commander
import time

class CommanderTest:
  def __init__(self):
    self.c = Commander('+19193971139', 'test')

  def printResults(self, cmd, res, good=True, printRes=False):
    if good:
      if "error" in res:
        # error out
        testRes = "Broke on: "+cmd+"\n Res:"+str(res)+'\n'
        print testRes
      if printRes:
        print 'success: ' + res['success']
    else:
      if "error" not in res:
        # error out
        testRes = "Broke on: "+cmd+"\n Res:"+str(res)+'\n'
        print testRes
      if printRes:
        print 'success ' + res['error']
        
  def customCommandTest(self):
    print "=== start of custom command test ===\n"
    # assumes that commands are populated with things in populateCmds.py
    badCmds = ["sdf", 'woo']
    for badCmd in badCmds:
      res = self.c.performCustomCommand(badCmd)
      self.printResults(badCmd, res, False, True)

    cmds = ['woot', 'reddit', 'hn', 'gh p.hireAnOliner u.jiahuang', 'gh u.jiahuang p.hireAnOliner', 'gh']
    for cmd in cmds:
      res = self.c.performCustomCommand(cmd)
      #print res
      self.printResults(cmd, res, True, True)

    print "=== end of custom command test ===\n"

def main(name):
  tester = CommanderTest()
  tester.customCommandTest()

if __name__ == '__main__':
  main(*sys.argv)

'''
curl test

curl -d 'cmd=test&url=http://en.wikipedia.org/wiki/Bird&css=H1#firstHeading.firstHeading' http://127.0.0.1:9000/command/new

curl -d 'From=19193971139&Body=test' http://127.0.0.1:9000/requests
'''