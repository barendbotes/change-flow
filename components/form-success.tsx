import { CircleCheckBigIcon } from "lucide-react";

interface FormSuccessProps {
  message?: string;
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null;
  return (
    <div className="bg-success/15 p-3 rounded-lg flex items-center gap-x-2 text-sm text-success">
      <CircleCheckBigIcon className="w-4 h-4" />
      <p>{message}</p>
    </div>
  );
};
