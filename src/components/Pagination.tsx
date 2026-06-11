interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-8 mt-16 mb-8">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`relative text-xs tracking-[0.2em] uppercase transition-colors duration-300 ${
            currentPage === page
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {page}
          {currentPage === page && (
            <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
