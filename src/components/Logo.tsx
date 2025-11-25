import { Link, useLocation } from "react-router-dom";

interface LogoProps {
  onClick?: () => void;
}

export const Logo = ({ onClick }: LogoProps) => {
  const location = useLocation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If we're already on the home page and there's an onClick handler, call it
    if (location.pathname === "/" && onClick) {
      e.preventDefault();
      onClick();
    }
    // Otherwise, let the Link handle navigation normally
  };

  return (
    <Link 
      to="/" 
      onClick={handleClick}
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      {/* Logo SVG: Molecule + Data points */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Central atom/node */}
        <circle cx="20" cy="20" r="4" fill="#1e3a8a" />
        
        {/* Connected atoms/nodes forming a molecule structure */}
        <circle cx="20" cy="8" r="3" fill="#1e40af" />
        <circle cx="32" cy="20" r="3" fill="#1e40af" />
        <circle cx="20" cy="32" r="3" fill="#1e40af" />
        <circle cx="8" cy="20" r="3" fill="#1e40af" />
        <circle cx="28" cy="10" r="2.5" fill="#3b82f6" />
        <circle cx="30" cy="30" r="2.5" fill="#3b82f6" />
        <circle cx="10" cy="30" r="2.5" fill="#3b82f6" />
        <circle cx="12" cy="10" r="2.5" fill="#3b82f6" />
        
        {/* Bonds/connections between atoms */}
        <line x1="20" y1="20" x2="20" y2="8" stroke="#1e3a8a" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="32" y2="20" stroke="#1e3a8a" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="20" y2="32" stroke="#1e3a8a" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="8" y2="20" stroke="#1e3a8a" strokeWidth="1.5" />
        <line x1="20" y1="8" x2="28" y2="10" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="32" y1="20" x2="30" y2="30" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="20" y1="32" x2="10" y2="30" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="8" y1="20" x2="12" y2="10" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,2" />
      </svg>
      
      <h1 className="text-xl font-semibold text-foreground tracking-tight">OpenChemFacts</h1>
    </Link>
  );
};
