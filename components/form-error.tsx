import { TriangleAlertIcon } from "lucide-react";

interface FormErrorProps {
  message?: string;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;
  return (
    <div className="bg-destructive/15 dark:bg-destructive/30 p-3 rounded-lg flex items-center gap-x-2 text-sm text-destructive">
      <TriangleAlertIcon className="w-4 h-4" />
      <p>{message}</p>
    </div>
  );
};
