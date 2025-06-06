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

export * from './code_editor';
export * from './exit_full_screen_button';
export * from './context';
export * from './overview_page';
export * from './overlays';
export * from './ui_settings';
export * from './field_icon';
export * from './field_button';
export * from './table_list_view';
export * from './split_panel';
export * from './react_router_navigate';
export * from './state_management';
export { ValidatedDualRange, Value } from './validated_range';
export * from './notifications';
export { Markdown, MarkdownSimple } from './markdown';
export { reactToUiComponent, uiToReactComponent } from './adapters';
export { useUrlTracker } from './use_url_tracker';
export { toMountPoint, MountPointPortal } from './util';
export { RedirectAppLinks } from './app_links';
import { Branding } from 'opensearch-dashboards/public';

/** Custom branding configurations for opensearch dashboards react plugin */
export type ReactPluginBranding = Branding;

/** dummy plugin, we just want opensearchDashboardsReact to have its own bundle */
export function plugin() {
  return new (class OpenSearchDashboardsReactPlugin {
    setup() {}
    start() {}
  })();
}
