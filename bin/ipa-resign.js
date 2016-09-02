#!/usr/bin/env node
'use strict';

const colors = require('colors');
const Applesign = require('../');
const conf = require('minimist')(process.argv.slice(2), {
  boolean: [
    'r', 'replace',
    'L', 'identities',
    'v', 'verify-twice',
    'E', 'entry-entitlement',
    'f', 'without-fairplay',
    'p', 'parallel',
    'w', 'without-watchapp',
    'u', 'unfair',
    'f', 'force-family',
    's', 'single',
    'S', 'self-signed-provision',
    'c', 'clone-entitlements',
    'u', 'unsigned-provision'
  ]
});

const options = {
  file: conf._[0] || 'undefined',
  outfile: conf.output || conf.o,
  entitlement: conf.entitlement || conf.e,
  entry: conf['entry-entitlement'] || conf.E,
  bundleid: conf.bundleid || conf.b,
  identity: conf.identity || conf.i,
  mobileprovision: conf.mobileprovision || conf.m,
  cloneEntitlements: conf.c || conf['clone-entitlements'],
  replaceipa: conf.replace || conf.r,
  withoutWatchapp: !!conf['without-watchapp'] || !!conf.w,
  keychain: conf.keychain || conf.k,
  parallel: conf.parallel || conf.p,
  verifyTwice: conf.verifyTwice || !!conf.v,
  unfairPlay: conf.unfair || conf.u,
  forceFamily: conf['force-family'] || conf.f,
  single: conf.single || conf.s,
  selfSignedProvision: conf.S || conf['self-signed-provision']
};

colors.setTheme({
  error: 'red',
  warn: 'green',
  msg: 'yellow'
});

const cs = new Applesign(options);

if (conf.identities || conf.L) {
  cs.getIdentities((err, ids) => {
    if (err) {
      console.error(colors.error(err));
    } else {
      ids.forEach((id) => {
        console.log(id.hash, id.name);
      });
    }
  });
} else if (conf.h || conf.help || conf._.length === 0) {
  const cmd = process.argv[1].split('/').pop();
  console.error(
`Usage:

  ${cmd} [--options ...] [input-ipafile]

  -b, --bundleid [BUNDLEID]     Change the bundleid when repackaging
  -c, --clone-entitlements      Clone the entitlements from the provisioning to the bin
  -e, --entitlements [ENTITL]   Specify entitlements file (EXPERIMENTAL)
  -E, --entry-entitlement       Use generic entitlement (EXPERIMENTAL)
  -f, --force-family            Force UIDeviceFamily in Info.plist to be iPhone
  -i, --identity [1C4D1A..]     Specify hash-id of the identity to use
  -k, --keychain [KEYCHAIN]     Specify alternative keychain file
  -L, --identities              List local codesign identities
  -m, --mobileprovision [FILE]  Specify the mobileprovision file to use
  -o, --output [APP.IPA]        Path to the output IPA filename
  -p, --parallel                Run layered signing dependencies in parallel
  -r, --replace                 Replace the input IPA file with the resigned one
  -s, --single                  Sign a single file instead of an IPA
  -S, --self-sign-provision     Self-sign mobile provisioning (EXPERIMENTAL)
  -u, --unfair                  Resign encrypted applications
  -v, --verify-twice            Verify after signing every file and at the end
  -w, --without-watchapp        Remove the WatchApp from the IPA before resigning
  [input-ipafile]               Path to the IPA file to resign

Example:

  ${cmd} -L # enumerate codesign identities, grab one and use it with -i
  ${cmd} -i AD71EB42BC289A2B9FD3C2D5C9F02D923495A23C test-app.ipa
`);
} else {
  const target = (conf.s || conf.single) ? 'signFile' : 'signIPA';
  const session = cs[target](options.file, (error, data) => {
    if (error) {
      console.error(error, data);
      process.exit(1);
    }
    console.log('Target is now signed:', session.config.outfile || options.file);
  }).on('message', (msg) => {
    console.log(colors.msg(msg));
  }).on('warning', (msg) => {
    console.error(colors.error('error'), msg);
  }).on('error', (msg) => {
    console.error(colors.msg(msg));
  });
}
