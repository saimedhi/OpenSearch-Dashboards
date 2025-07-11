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

import { actionServiceMock } from './services/action_service.mock';
import { columnServiceMock } from './services/column_service.mock';
import { serviceRegistryMock } from './services/service_registry.mock';
import { SavedObjectsManagementPluginSetup, SavedObjectsManagementPluginStart } from './plugin';

const createSetupContractMock = (): jest.Mocked<SavedObjectsManagementPluginSetup> => {
  const mock = {
    actions: actionServiceMock.createSetup(),
    columns: columnServiceMock.createSetup(),
    serviceRegistry: serviceRegistryMock.create(),
  };
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  return mock;
};

const createStartContractMock = (): jest.Mocked<SavedObjectsManagementPluginStart> => {
  const mock = {
    actions: actionServiceMock.createStart(),
    columns: columnServiceMock.createStart(),
  };
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  return mock;
};

export const savedObjectsManagementPluginMock = {
  createServiceRegistry: serviceRegistryMock.create,
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
};
