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

import React, { useEffect, useRef, useState } from 'react';
import { History } from 'history';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { Router } from 'react-router-dom';

import {
  EuiFieldText,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageHeader,
  EuiTitle,
} from '@elastic/eui';

import { CoreStart } from '../../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../../src/plugins/navigation/public';
import {
  connectToQueryState,
  syncQueryStateWithUrl,
  DataPublicPluginStart,
  IIndexPattern,
  QueryState,
  Filter,
  opensearchFilters,
  Query,
} from '../../../../../src/plugins/data/public';
import {
  BaseState,
  BaseStateContainer,
  createStateContainer,
  createStateContainerReactHelpers,
  IOsdUrlStateStorage,
  ReduxLikeStateContainer,
  syncState,
} from '../../../../../src/plugins/opensearch_dashboards_utils/public';
import { PLUGIN_ID, PLUGIN_NAME } from '../../../common';

interface StateDemoAppDeps {
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  history: History;
  osdUrlStateStorage: IOsdUrlStateStorage;
}

interface AppState {
  name: string;
  filters: Filter[];
  query?: Query;
}
const defaultAppState: AppState = {
  name: '',
  filters: [],
};
const {
  Provider: AppStateContainerProvider,
  useState: useAppState,
  useContainer: useAppStateContainer,
} = createStateContainerReactHelpers<ReduxLikeStateContainer<AppState>>();

const App = ({ navigation, data, history, osdUrlStateStorage }: StateDemoAppDeps) => {
  const appStateContainer = useAppStateContainer();
  const appState = useAppState();

  useGlobalStateSyncing(data.query, osdUrlStateStorage);
  useAppStateSyncing(appStateContainer, data.query, osdUrlStateStorage);

  const indexPattern = useIndexPattern(data);
  if (!indexPattern)
    return <div>No index pattern found. Please create an index patter before loading...</div>;

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router history={history}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            showSearchBar={true}
            indexPatterns={[indexPattern]}
            useDefaultBehaviors={true}
            showSaveQuery={true}
          />
          <EuiPage restrictWidth="1000px">
            <EuiPageBody component="main">
              <EuiPageHeader>
                <EuiTitle size="l">
                  <h1>
                    <FormattedMessage
                      id="stateContainerExamples.helloWorldText"
                      defaultMessage="{name}!"
                      values={{ name: PLUGIN_NAME }}
                    />
                  </h1>
                </EuiTitle>
              </EuiPageHeader>
              <EuiPageContent>
                <EuiFieldText
                  placeholder="Additional application state: My name is..."
                  value={appState.name}
                  onChange={(e) => appStateContainer.set({ ...appState, name: e.target.value })}
                  aria-label="My name"
                />
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};

export const StateDemoApp = (props: StateDemoAppDeps) => {
  const appStateContainer = useCreateStateContainer(defaultAppState);

  return (
    <AppStateContainerProvider value={appStateContainer}>
      <App {...props} />
    </AppStateContainerProvider>
  );
};

function useCreateStateContainer<State extends BaseState>(
  defaultState: State
): ReduxLikeStateContainer<State> {
  const stateContainerRef = useRef<ReduxLikeStateContainer<State> | null>(null);
  if (!stateContainerRef.current) {
    stateContainerRef.current = createStateContainer(defaultState);
  }
  return stateContainerRef.current;
}

function useIndexPattern(data: DataPublicPluginStart) {
  const [indexPattern, setIndexPattern] = useState<IIndexPattern>();
  useEffect(() => {
    const fetchIndexPattern = async () => {
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      if (defaultIndexPattern) {
        setIndexPattern(defaultIndexPattern);
      }
    };
    fetchIndexPattern();
  }, [data.indexPatterns]);

  return indexPattern;
}

function useGlobalStateSyncing(
  query: DataPublicPluginStart['query'],
  osdUrlStateStorage: IOsdUrlStateStorage
) {
  // setup sync state utils
  useEffect(() => {
    // sync global filters, time filters, refresh interval from data.query to url '_g'
    const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);
    return () => {
      stop();
    };
  }, [query, osdUrlStateStorage]);
}

function useAppStateSyncing<AppState extends QueryState>(
  appStateContainer: BaseStateContainer<AppState>,
  query: DataPublicPluginStart['query'],
  osdUrlStateStorage: IOsdUrlStateStorage
) {
  // setup sync state utils
  useEffect(() => {
    // sync app filters with app state container from data.query to state container
    const stopSyncingQueryAppStateWithStateContainer = connectToQueryState(
      query,
      appStateContainer,
      { filters: opensearchFilters.FilterStateStore.APP_STATE, query: true }
    );

    // sets up syncing app state container with url
    const { start: startSyncingAppStateWithUrl, stop: stopSyncingAppStateWithUrl } = syncState({
      storageKey: '_a',
      stateStorage: osdUrlStateStorage,
      stateContainer: {
        ...appStateContainer,
        // stateSync utils requires explicit handling of default state ("null")
        set: (state) => state && appStateContainer.set(state),
      },
    });

    // merge initial state from app state container and current state in url
    const initialAppState: AppState = {
      ...appStateContainer.get(),
      ...osdUrlStateStorage.get<AppState>('_a'),
    };
    // trigger state update. actually needed in case some data was in url
    appStateContainer.set(initialAppState);

    // set current url to whatever is in app state container
    osdUrlStateStorage.set<AppState>('_a', initialAppState);

    // finally start syncing state containers with url
    startSyncingAppStateWithUrl();

    return () => {
      stopSyncingQueryAppStateWithStateContainer();
      stopSyncingAppStateWithUrl();
    };
  }, [query, osdUrlStateStorage, appStateContainer]);
}
