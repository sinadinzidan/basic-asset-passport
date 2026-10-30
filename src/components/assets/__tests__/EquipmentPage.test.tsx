import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PassportTab } from '../../../enums/passportTab';
import type { FileSelection } from '../../../types/asset';
import { EquipmentPage } from '../EquipmentPage';

type QueryResponse = Awaited<ReturnType<CogniteClient['instances']['query']>>;

describe('EquipmentPage', () => {
  it('offers only Overview and Documents and never queries time series', async () => {
    const client = createClient();
    const query = vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => ('equipment' in request.with
      ? { items: { equipment: [{
        instanceType: 'node', space: 'asset_data', externalId: 'M-0', version: 1, createdTime: 0, lastUpdatedTime: 0,
        properties: { energy_dm: { 'EnergyEquipment/v1': { name: 'Motor one' } } },
      }] }, nextCursor: {} }
      : { items: { files: [] }, nextCursor: {} }));

    renderEquipmentPage(client);

    expect(await screen.findByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Overview', 'Documents0']));
    expect(query.mock.calls.filter(([request]) => 'timeSeries' in request.with)).toHaveLength(0);
  });

  it('shows no document count while the files are still loading, instead of a misleading 0', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => {
      if ('equipment' in request.with) {
        return { items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-0', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': { name: 'Motor one' } } },
        }] }, nextCursor: {} };
      }
      return new Promise<QueryResponse>(() => undefined);
    });

    renderEquipmentPage(client);

    await screen.findByRole('tab', { name: 'Overview' });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Overview', 'Documents']);
    expect(screen.getByText('Documents', { selector: 'dt' }).nextElementSibling).toHaveTextContent('Loading');
  });

  it('says so when the file limit may hide further files', async () => {
    const user = userEvent.setup();
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => ('equipment' in request.with
      ? { items: { equipment: [] }, nextCursor: {} }
      : { items: { files: Array.from({ length: 100 }, (_, index) => createFileNode(`DOC-${index}`, { name: `Sheet ${index}` })) }, nextCursor: {} }));

    renderEquipmentPage(client);

    await screen.findByText('No equipment linked to this asset');
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(await screen.findByText('Showing the first 100 files linked to the asset; more may exist.')).toBeInTheDocument();
  });

  it('shows a clear empty state when no equipment references the asset', async () => {
    const client = createClient();
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue({ items: { equipment: [] }, nextCursor: {} });

    renderEquipmentPage(client);

    expect(await screen.findByText('No equipment linked to this asset')).toBeInTheDocument();
    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      with: { equipment: expect.objectContaining({ limit: 25 }) },
    }));
  });

  it('renders linked equipment when available', async () => {
    const user = userEvent.setup();
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => ('equipment' in request.with
      ? { items: { equipment: [{
        instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
        properties: { energy_dm: { 'EnergyEquipment/v1': { name: 'Drive motor', description: 'Pump motor', tagNumber: '10-M-101' } } },
      }] }, nextCursor: {} }
      : { items: { files: [] }, nextCursor: {} }));

    renderEquipmentPage(client);

    expect(await screen.findByRole('heading', { name: /Drive motor/ })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Asset selection' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Search passports' })).not.toBeInTheDocument();
    expect(screen.getAllByText('10-M-101').length).toBeGreaterThan(0);
    expect(screen.getByText('Pump motor')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Maintenance' })).not.toBeInTheDocument();
    expect(screen.queryByText(/simulated/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(await screen.findByText('No files linked to this equipment or its asset')).toBeInTheDocument();
  });

  it('shows files linked to the selected equipment and its asset', async () => {
    const user = userEvent.setup();
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => {
      if ('equipment' in request.with) {
        return { items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': { name: 'Drive motor', files: [{ space: 'files', externalId: 'DOC-1' }] } } },
        }] }, nextCursor: {} };
      }
      return { items: { files: [createFileNode('DOC-A', { name: 'Plant P&ID', revision: 'C' })] }, nextCursor: {} };
    });
    vi.spyOn(client.instances, 'retrieve').mockResolvedValue({
      items: [createFileNode('DOC-1', { name: 'Motor datasheet', description: 'Rated power and speed' })],
    });

    const onFileSelect = vi.fn();
    renderEquipmentPage(client, onFileSelect);

    await user.click(await screen.findByRole('tab', { name: /^Documents/ }));
    expect(await screen.findByText('Motor datasheet')).toBeInTheDocument();
    expect(screen.getByText('Plant P&ID')).toBeInTheDocument();
    expect(screen.queryByText('Operation & maintenance manual')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Motor datasheet/ }));
    expect(onFileSelect).toHaveBeenLastCalledWith({ space: 'files', externalId: 'DOC-1', name: 'Motor datasheet' });
    await user.click(screen.getByRole('button', { name: /Plant P&ID/ }));
    expect(onFileSelect).toHaveBeenLastCalledWith({ space: 'files', externalId: 'DOC-A', name: 'Plant P&ID' });
  });

  it('lists asset files when the asset has no equipment', async () => {
    const user = userEvent.setup();
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => ('equipment' in request.with
      ? { items: { equipment: [] }, nextCursor: {} }
      : { items: { files: [createFileNode('DOC-A', { name: 'Plant P&ID', revision: 'C', issueDate: '2026-02-10T00:00:00.000Z' })] }, nextCursor: {} }));

    const onFileSelect = vi.fn();
    renderEquipmentPage(client, onFileSelect);

    expect(await screen.findByText('No equipment linked to this asset')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    const files = await screen.findByRole('region', { name: 'Files linked to Feedwater pump' });
    expect(files).toHaveTextContent('Plant P&ID');
    expect(files).toHaveTextContent('DOC-A · Rev C · 2026-02-10');
    await user.click(screen.getByRole('button', { name: /^Plant P&ID/ }));
    expect(onFileSelect).toHaveBeenCalledWith({ space: 'files', externalId: 'DOC-A', name: 'Plant P&ID' });
  });

  it('keeps equipment visible and reports file errors in the documents section', async () => {
    const user = userEvent.setup();
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockImplementation(async (request): Promise<QueryResponse> => {
      if ('equipment' in request.with) {
        return { items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': { name: 'Drive motor' } } },
        }] }, nextCursor: {} };
      }
      throw new Error('Files forbidden');
    });

    renderEquipmentPage(client);

    await user.click(await screen.findByRole('tab', { name: /^Documents/ }));
    expect(await screen.findByText('Failed to load files: Files forbidden')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Drive motor/ })).toBeInTheDocument();
  });

  it('shows equipment request errors instead of an empty state', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('Forbidden'));

    renderEquipmentPage(client);

    expect(await screen.findByText('Failed to load equipment: Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('No equipment linked to this asset')).not.toBeInTheDocument();
  });
});

function createClient(): CogniteClient {
  return new CogniteClient({ appId: 'test', project: 'test-project', oidcTokenProvider: async () => 'test-token' });
}

function createFileNode(externalId: string, properties: Record<string, string>) {
  return {
    instanceType: 'node' as const, space: 'files', externalId, version: 1, createdTime: 0, lastUpdatedTime: 0,
    properties: { energy_dm: { 'EnergyFile/v1': properties } },
  };
}

function renderEquipmentPage(
  client: CogniteClient,
  onFileSelect: (file: FileSelection | undefined) => void = vi.fn()
): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const api = {
    getProject: async () => 'test-project',
    getBaseUrl: async () => 'https://cdf.test',
    getAccessToken: async () => 'test-token',
    getAppId: async () => 'test',
  } as Partial<HostAppAPI> as HostAppAPI;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CogniteSdkProvider deps={{ connectToHostApp: async () => ({ api }), createClient: () => client }}>
          {children}
        </CogniteSdkProvider>
      </QueryClientProvider>
    );
  }

  render(
    <Wrapper>
      <TabbedEquipmentPage onFileSelect={onFileSelect} />
    </Wrapper>
  );
}

function TabbedEquipmentPage({ onFileSelect }: { onFileSelect: (file: FileSelection | undefined) => void }) {
  const [passportTab, setPassportTab] = useState<PassportTab>(PassportTab.OVERVIEW);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>();
  return (
    <EquipmentPage
      selectedAsset={{ space: 'asset_data', externalId: 'P-101', name: 'Feedwater pump' }}
      passportTab={passportTab}
      onPassportTabChange={setPassportTab}
      selectedEquipmentId={selectedEquipmentId}
      onEquipmentSelect={setSelectedEquipmentId}
      onFileSelect={onFileSelect}
    />
  );
}
