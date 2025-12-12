import React, { useState } from 'react';
import './ExportPDFModal.css';

/**
 * ExportPDFModal Component
 * Modal for selecting date range before exporting analytics to PDF
 * 
 * @param {boolean} isOpen - Modal visibility state
 * @param {Function} onClose - Close modal callback
 * @param {Function} onExport - Export callback with selected date range
 * @param {string} sectionTitle - Title of the section being exported
 */
const ExportPDFModal = ({ isOpen, onClose, onExport, sectionTitle }) => {
    const [selectedRange, setSelectedRange] = useState('all');

    if (!isOpen) return null;

    const dateRangeOptions = [
        { value: '7', label: 'Last 7 Days' },
        { value: '30', label: 'Last 30 Days' },
        { value: '90', label: 'Last 90 Days' },
        { value: 'all', label: 'All Time' }
    ];

    const handleExport = () => {
        let startDate = '';
        const endDate = new Date().toISOString().split('T')[0];

        if (selectedRange !== 'all') {
            const days = parseInt(selectedRange);
            const start = new Date();
            start.setDate(start.getDate() - days);
            startDate = start.toISOString().split('T')[0];
        }

        onExport({ startDate, endDate, range: selectedRange });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="export-pdf-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <span className="modal-icon">📄</span>
                        Export to PDF
                    </h2>
                    <button className="modal-close" onClick={onClose}>✖️</button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        Select the date range for <strong>{sectionTitle}</strong> analytics export:
                    </p>

                    <div className="date-range-options">
                        {dateRangeOptions.map((option) => (
                            <label key={option.value} className="range-option">
                                <input
                                    type="radio"
                                    name="dateRange"
                                    value={option.value}
                                    checked={selectedRange === option.value}
                                    onChange={(e) => setSelectedRange(e.target.value)}
                                />
                                <span className="range-option-label">{option.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="modal-info">
                        <span className="info-icon">ℹ️</span>
                        <span>The PDF will include all data from the selected time period.</span>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary btn-export" onClick={handleExport}>
                        <span className="btn-icon">📥</span>
                        Export PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportPDFModal;
