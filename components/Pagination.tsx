interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="pagination">
      <div className="pagination-info">
        <span className="total-count">{totalItems}</span>件
        ({startItem}〜{endItem}件を表示)
      </div>
      
      <ul className="pagination-list">
        {currentPage > 1 && (
          <li className="prev">
            <button onClick={() => onPageChange(currentPage - 1)}>
              前へ
            </button>
          </li>
        )}
        
        {getPageNumbers().map((page) => (
          <li key={page} className={currentPage === page ? "active" : ""}>
            <button onClick={() => onPageChange(page)}>{page}</button>
          </li>
        ))}
        
        {currentPage < totalPages && (
          <li className="next">
            <button onClick={() => onPageChange(currentPage + 1)}>
              次へ
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}


