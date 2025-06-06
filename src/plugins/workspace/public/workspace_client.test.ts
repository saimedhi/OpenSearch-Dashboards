/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock, workspacesServiceMock } from '../../../core/public/mocks';
import { WorkspaceClient } from './workspace_client';

const getWorkspaceClient = () => {
  const httpSetupMock = httpServiceMock.createSetupContract();
  const workspaceMock = workspacesServiceMock.createSetupContract();
  return {
    httpSetupMock,
    workspaceMock,
    workspaceClient: new WorkspaceClient(httpSetupMock, workspaceMock),
  };
};

describe('#WorkspaceClient', () => {
  it('#init', async () => {
    const { workspaceClient, httpSetupMock, workspaceMock } = getWorkspaceClient();
    await workspaceClient.init();
    expect(workspaceMock.initialized$.getValue()).toEqual(true);
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
      }),
    });
  });

  it('#enterWorkspace', async () => {
    const { workspaceClient, httpSetupMock, workspaceMock } = getWorkspaceClient();
    httpSetupMock.fetch.mockResolvedValue({
      success: false,
    });
    const result = await workspaceClient.enterWorkspace('foo');
    expect(result.success).toEqual(false);
    httpSetupMock.fetch.mockResolvedValue({
      success: true,
    });
    const successResult = await workspaceClient.enterWorkspace('foo');
    expect(workspaceMock.currentWorkspaceId$.getValue()).toEqual('foo');
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/foo', {
      method: 'GET',
    });
    expect(successResult.success).toEqual(true);
  });

  it('#getCurrentWorkspaceId', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch.mockResolvedValue({
      success: true,
    });
    await workspaceClient.enterWorkspace('foo');
    expect(workspaceClient.getCurrentWorkspaceId()).toEqual({
      success: true,
      result: 'foo',
    });
  });

  it('#getCurrentWorkspace', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch.mockResolvedValue({
      success: true,
      result: {
        name: 'foo',
      },
    });
    await workspaceClient.enterWorkspace('foo');
    expect(await workspaceClient.getCurrentWorkspace()).toEqual({
      success: true,
      result: {
        name: 'foo',
      },
    });
  });

  it('#create', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch
      .mockResolvedValueOnce({
        success: true,
        result: {
          name: 'foo',
          workspaces: [],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        result: {
          workspaces: [],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        result: {
          workspaces: [],
        },
      });
    await workspaceClient.create({ name: 'foo' }, {});

    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        attributes: {
          name: 'foo',
        },
        settings: {},
      }),
    });

    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
      }),
    });

    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
        permissionModes: ['library_write'],
      }),
    });
  });

  it('#delete', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch.mockResolvedValue({
      success: true,
      result: {
        name: 'foo',
        workspaces: [],
      },
    });
    await workspaceClient.delete('foo');
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/foo', {
      method: 'DELETE',
    });
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
      }),
    });
  });

  it('#list', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch.mockResolvedValue({
      success: true,
      result: {
        workspaces: [],
      },
    });
    await workspaceClient.list({
      perPage: 999,
    });
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
      }),
    });
  });

  it('#get', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    await workspaceClient.get('foo');
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/foo', {
      method: 'GET',
    });
  });

  it('#update', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch
      .mockResolvedValueOnce({
        success: true,
        result: {
          name: 'foo',
          workspaces: [],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        result: {
          workspaces: [],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        result: {
          workspaces: [],
        },
      });

    await workspaceClient.update('foo', { name: 'foo' }, {});

    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/foo', {
      method: 'PUT',
      body: JSON.stringify({
        attributes: {
          name: 'foo',
        },
        settings: {},
      }),
    });

    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
      }),
    });

    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_list', {
      method: 'POST',
      body: JSON.stringify({
        perPage: 999,
        permissionModes: ['library_write'],
      }),
    });
  });

  it('#update with list gives error', async () => {
    const { workspaceClient, httpSetupMock, workspaceMock } = getWorkspaceClient();
    let callTimes = 0;
    httpSetupMock.fetch.mockImplementation(async () => {
      callTimes++;
      if (callTimes > 1) {
        return {
          success: false,
          error: 'Something went wrong',
        };
      }

      return {
        success: true,
      };
    });
    await workspaceClient.update('foo', { name: 'foo' }, {});
    expect(workspaceMock.workspaceList$.getValue()).toEqual([]);
  });

  it('#copy', async () => {
    const { workspaceClient, httpSetupMock } = getWorkspaceClient();
    httpSetupMock.fetch.mockResolvedValue({
      success: true,
      successCount: 1,
    });
    const body = JSON.stringify({
      objects: [{ id: 'url_id', type: 'url' }],
      targetWorkspace: 'workspace-1',
      includeReferencesDeep: false,
    });
    await workspaceClient.copy([{ id: 'url_id', type: 'url' }], 'workspace-1', false);
    expect(httpSetupMock.fetch).toBeCalledWith('/api/workspaces/_duplicate_saved_objects', {
      body,
      method: 'POST',
    });
  });

  it('#init with resultWithWritePermission is not success ', async () => {
    const { workspaceClient, httpSetupMock, workspaceMock } = getWorkspaceClient();
    httpSetupMock.fetch
      .mockResolvedValueOnce({
        success: true,
        result: {
          workspaces: [
            {
              id: 'foo',
              name: 'foo',
            },
          ],
          total: 1,
          per_page: 999,
          page: 1,
        },
      })
      .mockResolvedValueOnce({
        success: false,
      });
    await workspaceClient.init();
    expect(workspaceMock.workspaceList$.getValue()).toEqual([]);
  });
});
