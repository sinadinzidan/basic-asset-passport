import { FileViewerType } from '../enums/fileViewerType';

import { DefaultError, DefaultLoading, DefaultUnsupported } from './DefaultStates';
import { ImageRenderer } from './ImageRenderer';
import { getViewerType } from './mimeTypes';
import { PdfRenderer } from './PdfRenderer';
import { TextRenderer } from './TextRenderer';
import type { CogniteFileViewerProps } from './types';
import { useFileResolver } from './useFileResolver';

export const CogniteFileViewer = (props: CogniteFileViewerProps) => {
  const {
    source,
    client,
    renderLoading,
    renderError,
    renderUnsupported,
    className,
    style,
  } = props;

  const {
    url,
    mimeType,
    instanceId,
    isLoading,
    error,
  } = useFileResolver(source, client);

  const viewerType = getViewerType(mimeType);
  const rotation = props.rotation ?? 0;

  // -- Loading --
  if (isLoading) {
    return (
      <div className={className} style={style}>
        {renderLoading ? renderLoading() : <DefaultLoading />}
      </div>
    );
  }

  // -- Error --
  if (error || !url) {
    return (
      <div className={className} style={style}>
        {renderError
          ? renderError(error ?? new Error('No URL resolved'))
          : <DefaultError error={error ?? new Error('No URL resolved')} />}
      </div>
    );
  }

  // -- Render by type --
  const renderContent = () => {
    switch (viewerType) {
      case FileViewerType.PDF:
        return <PdfRenderer key={url} {...props} url={url} instanceId={instanceId} rotation={rotation} />;
      case FileViewerType.IMAGE:
        return <ImageRenderer key={url} {...props} url={url} rotation={rotation} />;
      case FileViewerType.TEXT:
        return <TextRenderer key={url} url={url} renderLoading={renderLoading} renderError={renderError} />;
      default:
        return renderUnsupported ? renderUnsupported(mimeType) : <DefaultUnsupported mimeType={mimeType} />;
    }
  };

  return (
    <div className={className} style={style}>
      {renderContent()}
    </div>
  );
};
