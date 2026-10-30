import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FileRecord } from '../../../types/asset';
import type { PassportDocument } from '../../../types/passport';
import { AssetFilesCard } from '../../assets/AssetFilesCard';
import { DocumentsCard } from '../DocumentsCard';

// In real CDF data the file name is often also its id and its description.
const NAME = 'PH-ME-P-0003-001.pdf';

describe('file lists', () => {
  it('shows a document name once when its id repeats it', () => {
    const document: PassportDocument = {
      id: NAME, title: NAME, revision: '—', date: '2026-06-12', origin: 'Equipment file', instanceId: { space: 'energy_instances', externalId: NAME },
    };
    render(<DocumentsCard documents={[document]} emptyMessage="No documents available" onFileSelect={vi.fn()} />);
    expect(screen.getAllByText(NAME)).toHaveLength(1);
    expect(screen.getByText('Rev — · 2026-06-12 · Equipment file')).toBeInTheDocument();
  });

  it('shows an asset file name once when its id and description repeat it, but keeps a real description', () => {
    const files: FileRecord[] = [
      { id: 'a', space: 'energy_instances', externalId: NAME, name: NAME, description: NAME, date: '2026-06-12' },
      { id: 'b', space: 'energy_instances', externalId: 'DOC-2', name: 'Lube oil drawing', description: 'Main lube oil pump' },
    ];
    render(<AssetFilesCard assetName="VPH-23-PC-9101" files={files} onFileSelect={vi.fn()} />);
    expect(screen.getAllByText(NAME)).toHaveLength(1);
    expect(screen.getByText('Rev — · 2026-06-12')).toBeInTheDocument();
    expect(screen.getByText('DOC-2 · Rev — · —')).toBeInTheDocument();
    expect(screen.getByText('Main lube oil pump')).toBeInTheDocument();
  });
});
