import React, { useState, useMemo } from 'react';
import './AnalyticsTable.css';

/**
 * AnalyticsTable Component
 * Reusable table with sorting, pagination, search, and export
 * 
 * @param {Array} columns - Column definitions [{ header, accessor, sortable, formatter, width }]
 * @param {Array} data - Data array
 * @param {Function} onExport - Export callback
 * @param {boolean} loading - Loading state
 * @param {number} pageSize - Rows per page (default: 10)
 * @param {string} emptyMessage - Message when no data
 */
const AnalyticsTable = ({
    columns = [],
    data = [],
    onExport,
    loading = false,
    pageSize = 10,
    emptyMessage = 'No data available'
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');

    // Filter data by search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return data;

        return data.filter(row => {
            return columns.some(col => {
                const value = row[col.accessor];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchQuery.toLowerCase());
            });
        });
    }, [data, searchQuery, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        const sorted = [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            // Try numeric comparison
            const aNum = Number(aValue);
            const bNum = Number(bValue);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // String comparison
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();
            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (accessor) => {
        setSortConfig(prev => ({
            key: accessor,
            direction: prev.key === accessor && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    if (loading) {
        return (
            <div className="analytics-table-container">
                <div className="table-skeleton">
                    <div className="skeleton-row skeleton-header"></div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-row"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-table-container">
            {/* Table Controls */}
            <div className="table-controls">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search table..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                </div>
                {onExport && data.length > 0 && (
                    <button
                        className="export-btn"
                        onClick={onExport}
                        type="button"
                    >
                        <span className="export-icon">📄</span>
                        Export PDF
                    </button>
                )}
            </div>

            {/* Table */}
            {sortedData.length === 0 ? (
                <div className="table-empty-state">
                    <div className="empty-icon">📊</div>
                    <p>{searchQuery ? 'No results found for your search' : emptyMessage}</p>
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    {columns.map((col, index) => (
                                        <th
                                            key={index}
                                            onClick={() => col.sortable !== false && handleSort(col.accessor)}
                                            className={col.sortable !== false ? 'sortable' : ''}
                                            style={{ width: col.width }}
                                        >
                                            <div className="th-content">
                                                <span>{col.header}</span>
                                                {col.sortable !== false && (
                                                    <span className="sort-indicator">
                                                        {sortConfig.key === col.accessor ? (
                                                            sortConfig.direction === 'asc' ? '▲' : '▼'
                                                        ) : (
                                                            '⇅'
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {columns.map((col, colIndex) => {
                                            const value = row[col.accessor];
                                            const displayValue = col.formatter ? col.formatter(value, row) : value;

                                            return (
                                                <td key={colIndex} style={{ width: col.width }}>
                                                    {displayValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="table-pagination">
                            <div className="pagination-info">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    type="button"
                                >
                                    Previous
                                </button>
                                <div className="page-numbers">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                                                onClick={() => handlePageChange(pageNum)}
                                                type="button"
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    className="page-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    type="button"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsTable;
