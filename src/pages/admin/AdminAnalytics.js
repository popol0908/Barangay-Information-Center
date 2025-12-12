import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import AdminNavbar from '../../components/AdminNavbar';
import KPISummary from '../../components/KPISummary';
import DateRangeFilter from '../../components/DateRangeFilter';
import AnalyticsTable from '../../components/AnalyticsTable';
import ExportPDFModal from '../../components/ExportPDFModal';
import {
    getAnnouncementsAnalytics,
    getEmergencyAlertsAnalytics,
    getResidentVerificationAnalytics,
    getVotingAnalytics,
    getEventsAnalytics,
    getFeedbackAnalytics,
    getAdminAccountsAnalytics,
    exportToPDF
} from '../../services/analyticsService';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
    const { showToast } = useToast();
    const [activeSection, setActiveSection] = useState('announcements');
    const [loading, setLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportingFullReport, setExportingFullReport] = useState(false);

    const sections = [
        { id: 'announcements', label: 'Announcements', icon: '📢' },
        { id: 'alerts', label: 'Emergency Alerts', icon: '🚨' },
        { id: 'residents', label: 'Resident Verification', icon: '✅' },
        { id: 'voting', label: 'Voting & Surveys', icon: '🗳️' },
        { id: 'events', label: 'Events & Programs', icon: '📅' },
        { id: 'feedback', label: 'Feedback & Concerns', icon: '💬' },
        { id: 'admins', label: 'Admin Accounts', icon: '⚙️' }
    ];

    useEffect(() => {
        loadSectionData();
        // eslint-disable-next-line
    }, [activeSection, dateRange]);

    const loadSectionData = async () => {
        setLoading(true);
        try {
            const filterParams = { ...dateRange };
            let data;

            switch (activeSection) {
                case 'announcements':
                    data = await getAnnouncementsAnalytics(filterParams);
                    break;
                case 'alerts':
                    data = await getEmergencyAlertsAnalytics(filterParams);
                    break;
                case 'residents':
                    data = await getResidentVerificationAnalytics(filterParams);
                    break;
                case 'voting':
                    data = await getVotingAnalytics(filterParams);
                    break;
                case 'events':
                    data = await getEventsAnalytics(filterParams);
                    break;
                case 'feedback':
                    data = await getFeedbackAnalytics(filterParams);
                    break;
                case 'admins':
                    data = await getAdminAccountsAnalytics(filterParams);
                    break;
                default:
                    data = { kpis: {}, data: [], raw: [] };
            }

            setAnalyticsData(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            showToast('Failed to load analytics data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!analyticsData || !analyticsData.data || analyticsData.data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        try {
            const sectionLabel = sections.find(s => s.id === activeSection)?.label || 'Analytics';
            exportToPDF(analyticsData.data, sectionLabel, analyticsData.kpis);
            showToast('PDF exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showToast('Failed to export PDF', 'error');
        }
    };

    const handleFullReportExport = async (exportParams) => {
        setExportingFullReport(true);
        setShowExportModal(false);

        try {
            // Calculate date range based on selection
            // exportParams can be either a string (legacy) or an object with { startDate, endDate, range }
            let filterParams = {};
            let dateRangeOption = typeof exportParams === 'string' ? exportParams : exportParams?.range || 'all';

            if (dateRangeOption !== 'all') {
                // If we have startDate and endDate from the modal, use them directly
                if (typeof exportParams === 'object' && exportParams.startDate && exportParams.endDate) {
                    filterParams = {
                        startDate: exportParams.startDate,
                        endDate: exportParams.endDate
                    };
                } else {
                    // Otherwise calculate from the range option
                    const days = parseInt(dateRangeOption, 10);
                    if (isNaN(days)) {
                        throw new Error('Invalid date range option');
                    }
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - days);

                    // Validate dates before converting to ISO string
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        throw new Error('Invalid date calculation');
                    }

                    filterParams = {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                    };
                }
            }

            showToast('Generating comprehensive report...', 'info');

            // Fetch all analytics data
            const allData = await Promise.all([
                getAnnouncementsAnalytics(filterParams),
                getEmergencyAlertsAnalytics(filterParams),
                getResidentVerificationAnalytics(filterParams),
                getVotingAnalytics(filterParams),
                getEventsAnalytics(filterParams),
                getFeedbackAnalytics(filterParams),
                getAdminAccountsAnalytics(filterParams)
            ]);

            // Generate comprehensive PDF
            const { jsPDF } = require('jspdf');
            const { applyPlugin } = require('jspdf-autotable');
            applyPlugin(jsPDF);

            // Check if first section with data is resident verification - need landscape from start
            let firstSectionIndex = -1;
            let firstSectionIsResident = false;
            for (let i = 0; i < sections.length; i++) {
                if (allData[i] && allData[i].data && allData[i].data.length > 0) {
                    firstSectionIndex = i;
                    firstSectionIsResident = sections[i].id === 'residents';
                    break;
                }
            }

            // Create document in landscape if first section is resident verification
            const doc = firstSectionIsResident ? new jsPDF('l') : new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 14;

            const periodText = dateRangeOption === 'all' ? 'All Time' : `Last ${dateRangeOption} Days`;

            // Add each section
            sections.forEach((section, index) => {
                const sectionData = allData[index];

                if (sectionData && sectionData.data && sectionData.data.length > 0) {
                    // Check if this is resident verification section - use landscape for wider tables
                    const isResidentSection = section.id === 'residents';

                    // Add new page for each section (except first)
                    if (index > 0) {
                        if (isResidentSection) {
                            // Add landscape page for resident verification
                            doc.addPage('l'); // 'l' for landscape
                        } else {
                            doc.addPage();
                        }
                    }

                    // Get current page dimensions (may be landscape for resident section)
                    let currentPageWidth = doc.internal.pageSize.getWidth();
                    let currentPageHeight = doc.internal.pageSize.getHeight();

                    let yPosition = margin;

                    // Header - Title (matching exportToPDF design)
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text(`Barangay ${section.label} Analytics`, margin, yPosition);
                    yPosition += 8;

                    // Subtitle
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text('Analytics Performance Report', margin, yPosition);
                    yPosition += 10;

                    // Generated info (right aligned)
                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0);
                    const generatedText = 'Generated by: Admin';
                    const dateText = `Date: ${new Date().toLocaleDateString()}`;
                    doc.text(generatedText, currentPageWidth - margin, 14, { align: 'right' });
                    doc.text(dateText, currentPageWidth - margin, 19, { align: 'right' });

                    // Divider line
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    doc.line(margin, yPosition, currentPageWidth - margin, yPosition);
                    yPosition += 8;

                    // KPI Statistics Section (matching exportToPDF design)
                    if (sectionData.kpis && Object.keys(sectionData.kpis).length > 0) {
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(0, 0, 0);
                        doc.setFillColor(0, 0, 0);
                        doc.rect(margin, yPosition, currentPageWidth - 2 * margin, 7, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.text('Overview Statistics', margin + 2, yPosition + 5);
                        yPosition += 10;

                        // KPI Table
                        const kpiData = Object.entries(sectionData.kpis).map(([key, value]) => [
                            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                            value
                        ]);

                        doc.autoTable({
                            startY: yPosition,
                            head: [['Metric', 'Value']],
                            body: kpiData,
                            theme: 'plain',
                            styles: { fontSize: 9, cellPadding: 3 },
                            headStyles: {
                                fillColor: [240, 240, 240],
                                textColor: [0, 0, 0],
                                fontStyle: 'bold',
                                lineWidth: 0.1,
                                lineColor: [200, 200, 200]
                            },
                            columnStyles: {
                                0: { cellWidth: currentPageWidth / 2 - margin - 5 },
                                1: { cellWidth: currentPageWidth / 2 - margin - 5, halign: 'right', fontStyle: 'bold' }
                            },
                            margin: { left: margin, right: margin }
                        });

                        yPosition = doc.lastAutoTable.finalY + 10;
                    }

                    // Detailed Data Table Section (matching exportToPDF design)
                    const tableData = sectionData.data.slice(0, 50);
                    if (tableData.length > 0) {
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(0, 0, 0);
                        doc.setFillColor(0, 0, 0);
                        doc.rect(margin, yPosition, currentPageWidth - 2 * margin, 7, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.text('Detailed Records', margin + 2, yPosition + 5);
                        yPosition += 10;

                        // Get headers from first object
                        const headers = Object.keys(tableData[0]);

                        // Prepare table data
                        const bodyData = tableData.map(row =>
                            headers.map(header => {
                                const value = row[header];
                                // Handle different data types
                                if (value === null || value === undefined) return 'N/A';
                                if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                                if (typeof value === 'object') return JSON.stringify(value);
                                return String(value);
                            })
                        );

                        // Format headers for display
                        const formattedHeaders = headers.map(h =>
                            h.replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .trim()
                        );

                        // Create column styles for specific sections
                        let columnStyles = {};

                        // For resident verification, set specific column widths to prevent cutoff
                        if (isResidentSection) {
                            // Map headers to column indices
                            const headerMap = {};
                            headers.forEach((header, idx) => {
                                headerMap[header] = idx;
                            });

                            // Set widths based on content type (landscape width ~= 297mm, with margins ~= 270mm)
                            if (headerMap['id'] !== undefined) columnStyles[headerMap['id']] = { cellWidth: 20 };
                            if (headerMap['fullName'] !== undefined) columnStyles[headerMap['fullName']] = { cellWidth: 30 };
                            if (headerMap['email'] !== undefined) columnStyles[headerMap['email']] = { cellWidth: 35 };
                            if (headerMap['contactNumber'] !== undefined) columnStyles[headerMap['contactNumber']] = { cellWidth: 20 };
                            if (headerMap['address'] !== undefined) columnStyles[headerMap['address']] = { cellWidth: 45 };
                            if (headerMap['status'] !== undefined) columnStyles[headerMap['status']] = { cellWidth: 10 };
                            if (headerMap['dateRegistered'] !== undefined) columnStyles[headerMap['dateRegistered']] = { cellWidth: 15 };
                            if (headerMap['dateVerified'] !== undefined) columnStyles[headerMap['dateVerified']] = { cellWidth: 15 };
                        }

                        // Create detailed table (matching exportToPDF design)
                        doc.autoTable({
                            startY: yPosition,
                            head: [formattedHeaders],
                            body: bodyData,
                            theme: 'grid',
                            styles: {
                                fontSize: 8,
                                cellPadding: 2,
                                overflow: 'linebreak',
                                cellWidth: 'wrap'
                            },
                            headStyles: {
                                fillColor: [0, 0, 0],
                                textColor: [255, 255, 255],
                                fontStyle: 'bold',
                                halign: 'center'
                            },
                            alternateRowStyles: {
                                fillColor: [245, 245, 245]
                            },
                            columnStyles: columnStyles,
                            margin: { left: margin, right: margin },
                            didDrawPage: function (data) {
                                // Footer (matching exportToPDF design)
                                // Get current page dimensions (may change if landscape)
                                const currentPageHeight = doc.internal.pageSize.getHeight();
                                const currentPageWidth = doc.internal.pageSize.getWidth();
                                const footerY = currentPageHeight - 10;
                                doc.setFontSize(8);
                                doc.setTextColor(150, 150, 150);
                                doc.text(
                                    `Page ${doc.internal.getNumberOfPages()}`,
                                    currentPageWidth / 2,
                                    footerY,
                                    { align: 'center' }
                                );
                                doc.text(
                                    '© Barangay System. All Rights Reserved.',
                                    margin,
                                    footerY
                                );
                            }
                        });

                        if (sectionData.data.length > 50) {
                            doc.setFontSize(8);
                            doc.setTextColor(100, 100, 100);
                            doc.text(
                                `Showing 50 of ${sectionData.data.length} records`,
                                margin,
                                doc.lastAutoTable.finalY + 5
                            );
                            doc.setTextColor(0, 0, 0);
                        }
                    }
                }
            });

            // Save PDF
            const fileName = `Barangay_Analytics_Report_${periodText.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            showToast('Comprehensive report exported successfully!', 'success');
        } catch (error) {
            console.error('Error generating full report:', error);
            showToast('Failed to generate full report', 'error');
        } finally {
            setExportingFullReport(false);
        }
    };

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
    };

    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
        setDateRange({ startDate: '', endDate: '' });
    };

    const renderKPIs = () => {
        if (!analyticsData || !analyticsData.kpis) return null;

        const { kpis } = analyticsData;

        switch (activeSection) {
            case 'announcements':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '📊', label: 'Total Announcements', value: kpis.total, color: 'blue' },
                            { icon: '📅', label: 'This Month', value: kpis.thisMonth, color: 'green' },
                            { icon: '✅', label: 'Active', value: kpis.active, color: 'cyan' },
                            { icon: '📦', label: 'Archived', value: kpis.archived, color: 'gray' }
                        ]}
                    />
                );

            case 'alerts':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '📊', label: 'Total Alerts', value: kpis.total, color: 'blue' },
                            { icon: '🔴', label: 'Active Now', value: kpis.active, color: 'green' },
                            { icon: '🔴', label: 'High Severity', value: kpis.high, color: 'red' },
                            { icon: '🟡', label: 'Medium', value: kpis.medium, color: 'orange' },
                            { icon: '🔵', label: 'Low', value: kpis.low, color: 'cyan' }
                        ]}
                    />
                );

            case 'residents':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '👥', label: 'Total Users', value: kpis.total, color: 'blue' },
                            { icon: '✅', label: 'Verified', value: kpis.verified, color: 'green' },
                            { icon: '⏳', label: 'Pending', value: kpis.pending, color: 'orange' },
                            { icon: '❌', label: 'Rejected', value: kpis.rejected, color: 'red' },
                            { icon: '📅', label: 'New (7 days)', value: kpis.newLast7Days, color: 'cyan' }
                        ]}
                    />
                );

            case 'voting':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '📊', label: 'Total Events', value: kpis.total, color: 'blue' },
                            { icon: '🟢', label: 'Active', value: kpis.active, color: 'green' },
                            { icon: '🔴', label: 'Closed', value: kpis.closed, color: 'gray' },
                            { icon: '🗳️', label: 'Avg Participation', value: kpis.avgParticipation, color: 'purple' }
                        ]}
                    />
                );

            case 'events':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '📅', label: 'Total Events', value: kpis.total, color: 'blue' },
                            { icon: '👥', label: 'Registrations (30d)', value: kpis.registrationsThisMonth, color: 'green' },
                            { icon: '🏆', label: 'Top Event', value: kpis.topEventTitle?.substring(0, 20) || 'N/A', color: 'purple' },
                            { icon: '🎯', label: 'Top Registrations', value: kpis.topEventCount, color: 'orange' }
                        ]}
                    />
                );

            case 'feedback':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '💬', label: 'Total Feedback', value: kpis.total, color: 'blue' },
                            { icon: '⏳', label: 'Pending', value: kpis.pending, color: 'orange' },
                            { icon: '👀', label: 'In Review', value: kpis.inReview, color: 'cyan' },
                            { icon: '✅', label: 'Resolved', value: kpis.resolved, color: 'green' },
                            { icon: '⏱️', label: 'Avg Response Time', value: kpis.avgResponseTime, color: 'purple' }
                        ]}
                    />
                );

            case 'admins':
                return (
                    <KPISummary
                        kpis={[
                            { icon: '👤', label: 'Total Admins', value: kpis.total, color: 'blue' },
                            { icon: '✅', label: 'Active', value: kpis.active, color: 'green' },
                            { icon: '⛔', label: 'Disabled', value: kpis.disabled, color: 'red' }
                        ]}
                    />
                );

            default:
                return null;
        }
    };

    const renderTable = () => {
        if (!analyticsData || !analyticsData.data) return null;

        let columns = [];

        switch (activeSection) {
            case 'announcements':
                columns = [
                    { header: 'ID', accessor: 'id', width: '80px' },
                    { header: 'Title', accessor: 'title' },
                    { header: 'Created By', accessor: 'createdBy' },
                    { header: 'Date Posted', accessor: 'datePosted' },
                    { header: 'Event Date', accessor: 'when' },
                    { header: 'Views', accessor: 'views', width: '80px' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value || 'active'}`}>{value || 'N/A'}</span>
                        )
                    }
                ];
                break;

            case 'alerts':
                columns = [
                    { header: 'ID', accessor: 'id', width: '80px' },
                    { header: 'Title', accessor: 'title' },
                    {
                        header: 'Severity',
                        accessor: 'severity',
                        formatter: (value) => (
                            <span className={`severity-badge severity-${value?.toLowerCase() || 'medium'}`}>
                                {value || 'N/A'}
                            </span>
                        )
                    },
                    { header: 'Date Posted', accessor: 'datePosted' },
                    { header: 'Effective Date', accessor: 'effectiveDate' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value?.toLowerCase() || 'active'}`}>
                                {value || 'N/A'}
                            </span>
                        )
                    },
                    { header: 'Created By', accessor: 'createdBy' },
                    { header: 'Audience', accessor: 'audience' }
                ];
                break;

            case 'residents':
                columns = [
                    { header: 'User ID', accessor: 'id', width: '100px' },
                    { header: 'Full Name', accessor: 'fullName' },
                    { header: 'Email', accessor: 'email' },
                    { header: 'Contact', accessor: 'contactNumber' },
                    { header: 'Address', accessor: 'address' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value || 'pending'}`}>{value || 'N/A'}</span>
                        )
                    },
                    { header: 'Registered', accessor: 'dateRegistered' },
                    { header: 'Verified/Rejected', accessor: 'dateVerified' }
                ];
                break;

            case 'voting':
                columns = [
                    { header: 'Event ID', accessor: 'id', width: '100px' },
                    { header: 'Title', accessor: 'title' },
                    {
                        header: 'Type',
                        accessor: 'type',
                        formatter: (value) => value === 'candidate' ? '🗳️ Candidate' : '📊 Survey'
                    },
                    { header: 'Start Date', accessor: 'startDate' },
                    { header: 'End Date', accessor: 'endDate' },
                    {
                        header: 'Locked',
                        accessor: 'locked',
                        formatter: (value) => value ? '🔒' : '🔓'
                    },
                    { header: 'Total Votes', accessor: 'totalVotes' },
                    { header: 'Participants', accessor: 'participants' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value || 'upcoming'}`}>{value || 'N/A'}</span>
                        )
                    }
                ];
                break;

            case 'events':
                columns = [
                    { header: 'Event ID', accessor: 'id', width: '100px' },
                    { header: 'Title', accessor: 'title' },
                    { header: 'Date & Time', accessor: 'dateTime' },
                    { header: 'Location', accessor: 'location' },
                    { header: 'Capacity', accessor: 'capacity' },
                    { header: 'Registered', accessor: 'registeredCount' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value || 'open'}`}>{value || 'N/A'}</span>
                        )
                    },
                    { header: 'Created By', accessor: 'createdBy' }
                ];
                break;

            case 'feedback':
                columns = [
                    { header: 'Feedback ID', accessor: 'id', width: '100px' },
                    {
                        header: 'Category',
                        accessor: 'category',
                        formatter: (value) => (
                            <span className="category-badge">{value || 'N/A'}</span>
                        )
                    },
                    { header: 'User Name', accessor: 'userName' },
                    { header: 'Message Preview', accessor: 'messagePreview' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                                {value || 'N/A'}
                            </span>
                        )
                    },
                    { header: 'Submitted At', accessor: 'submittedAt' },
                    { header: 'Responses', accessor: 'responseCount' }
                ];
                break;

            case 'admins':
                columns = [
                    { header: 'Admin UID', accessor: 'id', width: '120px' },
                    { header: 'Name', accessor: 'name' },
                    { header: 'Email', accessor: 'email' },
                    { header: 'Role', accessor: 'role' },
                    { header: 'Date Created', accessor: 'dateCreated' },
                    { header: 'Last Login', accessor: 'lastLogin' },
                    {
                        header: 'Status',
                        accessor: 'status',
                        formatter: (value) => (
                            <span className={`status-badge status-${value || 'active'}`}>{value || 'N/A'}</span>
                        )
                    }
                ];
                break;

            default:
                columns = [];
        }

        return (
            <AnalyticsTable
                columns={columns}
                data={analyticsData.data}
                onExport={handleExport}
                loading={loading}
                pageSize={15}
                emptyMessage="No data available for this section"
            />
        );
    };

    return (
        <>
            <AdminNavbar />
            <div className="admin-analytics-page">
                <aside className="analytics-sidebar">
                    <div className="sidebar-header">
                        <h2 className="sidebar-title">
                            <span className="title-icon">📊</span>
                            Analytics & Reports
                        </h2>
                    </div>
                    <nav className="sidebar-nav">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                className={`sidebar-nav-item ${activeSection === section.id ? 'active' : ''}`}
                                onClick={() => handleSectionChange(section.id)}
                            >
                                <span className="nav-item-icon">{section.icon}</span>
                                <span className="nav-item-label">{section.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="analytics-content">
                    <div className="content-header">
                        <div>
                            <h1 className="content-title">
                                {sections.find(s => s.id === activeSection)?.icon} {sections.find(s => s.id === activeSection)?.label}
                            </h1>
                            <p className="content-subtitle">
                                Detailed analytics andreporting for {sections.find(s => s.id === activeSection)?.label.toLowerCase()}
                            </p>
                        </div>
                        <button
                            className="full-report-btn"
                            onClick={() => setShowExportModal(true)}
                            disabled={exportingFullReport}
                            type="button"
                        >
                            {exportingFullReport ? (
                                <>⏳ Generating...</>
                            ) : (
                                <>📊 Export Full Report</>
                            )}
                        </button>
                    </div>

                    <DateRangeFilter
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onChange={handleDateRangeChange}
                    />

                    {renderKPIs()}

                    {renderTable()}
                </main>
            </div>

            {/* Export PDF Modal */}
            {showExportModal && (
                <ExportPDFModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    onExport={handleFullReportExport}
                />
            )}
        </>
    );
};

export default AdminAnalytics;
