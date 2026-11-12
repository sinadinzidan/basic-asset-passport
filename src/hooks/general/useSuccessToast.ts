import { toast } from '@cognite/aura/components/sonner-toast';
import { createContext, useContext } from 'react';

export type ShowSuccessToast = (message: string) => void;

const showSuccessToast: ShowSuccessToast = (message) => {
  toast.success(message);
};

export const SuccessToastContext = createContext<ShowSuccessToast>(showSuccessToast);

export function useSuccessToast(): ShowSuccessToast {
  return useContext(SuccessToastContext);
}
