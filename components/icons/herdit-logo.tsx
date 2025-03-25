import { cn } from "@/lib/utils";

interface CorpLogoProps {
  className?: string;
}

const CorpLogo = ({ className }: CorpLogoProps) => {
  return (
    <svg
      version="1.1"
      id="Capa_1"
      x="0px"
      y="0px"
      viewBox="0 0 50 50"
      width="50"
      height="50"
      className={cn(className)}
    >
      <g>
        <path d="M 0.59444833,36.803809 9.5539613,21.285483 H 26.458333 l 4.479756,7.759166 H 24.962695 L 23.469442,26.45825 H 12.540464 l -4.8798725,8.452183 3.2794105,1.893376 h 31.036677 l 3.279396,-1.893361 -10.852879,-18.797742 -7.944863,-5.17e-4 -1.493645,2.587066 H 18.98936 L 23.469112,10.9401 H 37.3897 l 14.932518,25.863709 -8.959472,5.172757 H 9.5539336 Z" />
      </g>
    </svg>
  );
};

export default CorpLogo;
