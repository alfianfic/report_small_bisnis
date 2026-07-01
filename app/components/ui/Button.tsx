// app/components/ui/Button.tsx

'use client';

interface ButtonProps {
  onClick: () => void;
  isOpen: boolean;
  children?: React.ReactNode;
}

export default function Button({ 
  onClick, 
  isOpen,
  children
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
      </svg>
      {children || (isOpen ? 'Sembunyikan' : 'Lihat')}
    </button>
  );
}