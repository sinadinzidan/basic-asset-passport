import { GeneralButton } from './GeneralButton';

type ShowMoreButtonProps = {
  label: string;
  isLoading: boolean;
  onShowMore: () => void;
};

export function ShowMoreButton({ label, isLoading, onShowMore }: ShowMoreButtonProps) {
  return (
    <div className="flex justify-center">
      <GeneralButton disabled={isLoading} onClick={onShowMore} variant="outline">
        {isLoading ? 'Loading...' : label}
      </GeneralButton>
    </div>
  );
}
