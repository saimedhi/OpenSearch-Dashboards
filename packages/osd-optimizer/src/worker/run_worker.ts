/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { inspect } from 'util';

import * as Rx from 'rxjs';
import { take, mergeMap } from 'rxjs/operators';

import {
  parseBundles,
  parseWorkerConfig,
  WorkerMsg,
  isWorkerMsg,
  WorkerMsgs,
  BundleRefs,
} from '../common';

import { runCompilers } from './run_compilers';

/**
 **
 **
 ** Entry file for optimizer workers, this hooks into the process, handles
 ** sending messages to the parent, makes sure the worker exits properly
 ** and triggers all the compilers by calling runCompilers()
 **
 **
 **/

const workerMsgs = new WorkerMsgs();

if (!process.send) {
  throw new Error('worker process was not started with an IPC channel');
}

const send = (msg: WorkerMsg) => {
  if (!process.send) {
    // parent is gone
    process.exit(0);
  } else {
    process.send(msg);
  }
};

/**
 * set the exitCode and wait for the process to exit, if it
 * doesn't exit naturally do so forcibly and fail.
 */
const exit = (code: number) => {
  process.exitCode = code;
  setTimeout(() => {
    send(
      workerMsgs.error(
        new Error(
          `process did not automatically exit within 30 seconds (previous code: ${code}); forcing exit...`
        )
      )
    );
    process.exit(1);
  }, 30000).unref();
};

// check for connected parent on an unref'd timer rather than listening
// to "disconnect" since that listner prevents the process from exiting
setInterval(() => {
  if (!process.connected) {
    // parent is gone
    process.exit(0);
  }
}, 1000).unref();

function assertInitMsg(msg: unknown): asserts msg is { args: string[] } {
  if (typeof msg !== 'object' || !msg) {
    throw new Error(`expected init message to be an object: ${inspect(msg)}`);
  }

  const { args } = msg as Record<string, unknown>;
  if (!args || !Array.isArray(args) || !args.every((a) => typeof a === 'string')) {
    throw new Error(
      `expected init message to have an 'args' property that's an array of strings: ${inspect(msg)}`
    );
  }
}

Rx.defer(() => {
  process.send!('init');

  return Rx.fromEvent<[unknown]>(process as any, 'message').pipe(
    take(1),
    mergeMap(([msg]) => {
      assertInitMsg(msg);
      process.send!('ready');

      const workerConfig = parseWorkerConfig(msg.args[0]);
      const bundles = parseBundles(msg.args[1]);
      const bundleRefs = BundleRefs.parseSpec(msg.args[2]);

      // set BROWSERSLIST_ENV so that style/babel loaders see it before running compilers
      process.env.BROWSERSLIST_ENV = workerConfig.browserslistEnv;

      return runCompilers(workerConfig, bundles, bundleRefs);
    })
  );
}).subscribe(
  (msg) => {
    send(msg);
  },
  (error) => {
    if (isWorkerMsg(error)) {
      send(error);
    } else {
      send(workerMsgs.error(error));
    }

    exit(1);
  },
  () => {
    exit(0);
  }
);
