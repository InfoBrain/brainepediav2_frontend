import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function getPageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= 1) return totalPages > 0 ? [1] : [];
  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function ServerPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1 && page <= 1) return null;
  const pages = getPageNumbers(page, totalPages);

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={page === 1}
          />
        </PaginationItem>
        {pages.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              isActive={pageNumber === page}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(pageNumber);
              }}
              className="cursor-pointer"
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={page >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function totalPagesFrom(total: number, pageSize: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}
