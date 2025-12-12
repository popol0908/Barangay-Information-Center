import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

/**
 * Analytics Service
 * Handles data aggregation, KPI calculations, and PDF export for admin analytics
 */

// Helper to format date for display
const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return new Date(dateValue.toDate()).toLocaleDateString();
    }
    if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString();
    }
    if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
    }
    return 'N/A';
};

const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return new Date(dateValue.toDate()).toLocaleString();
    }
    if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleString();
    }
    if (dateValue instanceof Date) {
        return dateValue.toLocaleString();
    }
    return 'N/A';
};

// Helper to apply date range filter
const filterByDateRange = (items, startDate, endDate, dateField = 'createdAt') => {
    if (!startDate && !endDate) return items;

    return items.filter(item => {
        const itemDate = item[dateField];
        if (!itemDate) return false;

        let date;
        if (itemDate.toDate && typeof itemDate.toDate === 'function') {
            date = itemDate.toDate();
        } else if (typeof itemDate === 'string') {
            date = new Date(itemDate);
        } else if (itemDate instanceof Date) {
            date = itemDate;
        } else {
            return false;
        }

        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
    });
};

/**
 * Get Announcements Analytics
 */
export const getAnnouncementsAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'announcements');
        const snapshot = await getDocs(collectionRef);
        let announcements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            announcements = filterByDateRange(announcements, filters.startDate, filters.endDate, 'datePosted');
        }

        // Calculate KPIs
        const total = announcements.length;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const thisMonth = announcements.filter(a => {
            const date = a.datePosted?.toDate ? a.datePosted.toDate() : new Date(a.datePosted);
            return date >= thirtyDaysAgo;
        }).length;

        const active = announcements.filter(a => a.status !== 'archived').length;
        const archived = announcements.filter(a => a.status === 'archived').length;

        // Format data for table
        const tableData = announcements.map(a => ({
            id: a.id,
            title: a.title || 'Untitled',
            createdBy: a.createdBy || 'Unknown',
            datePosted: formatDate(a.datePosted),
            when: formatDate(a.when),
            views: a.views || 0,
            status: a.status || 'active'
        }));

        return {
            kpis: {
                total,
                thisMonth,
                active,
                archived
            },
            data: tableData,
            raw: announcements
        };
    } catch (error) {
        console.error('Error fetching announcements analytics:', error);
        throw error;
    }
};

/**
 * Get Emergency Alerts Analytics
 */
export const getEmergencyAlertsAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'emergencyAlerts');
        const snapshot = await getDocs(collectionRef);
        let alerts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            alerts = filterByDateRange(alerts, filters.startDate, filters.endDate, 'datePosted');
        }

        // Calculate KPIs
        const total = alerts.length;
        const activeAlerts = alerts.filter(a => a.status === 'Active').length;
        const high = alerts.filter(a => a.severity === 'High').length;
        const medium = alerts.filter(a => a.severity === 'Medium').length;
        const low = alerts.filter(a => a.severity === 'Low').length;

        // Format data for table
        const tableData = alerts.map(a => ({
            id: a.id,
            title: a.title || 'Untitled',
            severity: a.severity || 'Medium',
            datePosted: formatDate(a.datePosted),
            effectiveDate: formatDate(a.effectiveDate),
            status: a.status || 'Active',
            createdBy: a.createdBy || 'Admin',
            audience: a.audience || 'public'
        }));

        return {
            kpis: {
                total,
                active: activeAlerts,
                high,
                medium,
                low
            },
            data: tableData,
            raw: alerts
        };
    } catch (error) {
        console.error('Error fetching emergency alerts analytics:', error);
        throw error;
    }
};

/**
 * Get Resident Verification Analytics
 */
export const getResidentVerificationAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'users');
        const snapshot = await getDocs(collectionRef);
        let users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            users = filterByDateRange(users, filters.startDate, filters.endDate);
        }

        // Calculate KPIs
        const total = users.length;
        const verified = users.filter(u => u.status === 'verified').length;
        const pending = users.filter(u => u.status === 'pending').length;
        const rejected = users.filter(u => u.status === 'declined').length;

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const newLast7Days = users.filter(u => {
            const date = u.verifiedAt?.toDate ? u.verifiedAt.toDate() : new Date(u.verifiedAt);
            return u.status === 'verified' && date >= sevenDaysAgo;
        }).length;

        // Format data for table
        const tableData = users.map(u => ({
            id: u.id,
            fullName: u.fullName || 'N/A',
            email: u.email || 'N/A',
            contactNumber: u.contactNumber || 'N/A',
            address: u.address || 'N/A',
            status: u.status || 'pending',
            dateRegistered: formatDate(u.createdAt),
            dateVerified: u.verifiedAt ? formatDate(u.verifiedAt) : 'N/A'
        }));

        return {
            kpis: {
                total,
                verified,
                pending,
                rejected,
                newLast7Days
            },
            data: tableData,
            raw: users
        };
    } catch (error) {
        console.error('Error fetching resident verification analytics:', error);
        throw error;
    }
};

/**
 * Get Voting & Surveys Analytics
 */
export const getVotingAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'voting');
        const snapshot = await getDocs(collectionRef);
        let votingEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Get all votes for participation calculation
        const votesRef = collection(db, 'userVotes');
        const votesSnapshot = await getDocs(votesRef);
        const allVotes = votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            votingEvents = filterByDateRange(votingEvents, filters.startDate, filters.endDate, 'startDate');
        }

        // Calculate KPIs
        const total = votingEvents.length;
        const now = new Date();
        const active = votingEvents.filter(v => {
            const start = new Date(v.startDate);
            const end = new Date(v.endDate);
            return now >= start && now <= end;
        }).length;
        const closed = votingEvents.filter(v => {
            const end = new Date(v.endDate);
            return now > end;
        }).length;

        // Calculate average participation
        let totalParticipation = 0;
        votingEvents.forEach(event => {
            const eventVotes = allVotes.filter(v => v.eventId === event.id);
            const uniqueVoters = new Set(eventVotes.map(v => v.userId)).size;
            totalParticipation += uniqueVoters;
        });
        const avgParticipation = votingEvents.length > 0 ? Math.round(totalParticipation / votingEvents.length) : 0;

        // Format data for table
        const tableData = votingEvents.map(v => {
            const eventVotes = allVotes.filter(vote => vote.eventId === v.id);
            const uniqueVoters = new Set(eventVotes.map(vote => vote.userId)).size;
            const totalVotes = v.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;

            const start = new Date(v.startDate);
            const end = new Date(v.endDate);
            let status = 'upcoming';
            if (now > end) status = 'closed';
            else if (now >= start) status = 'active';

            return {
                id: v.id,
                title: v.title || 'Untitled',
                type: v.type || 'candidate',
                startDate: formatDate(v.startDate),
                endDate: formatDate(v.endDate),
                locked: v.locked || false,
                totalVotes,
                participants: uniqueVoters,
                status
            };
        });

        return {
            kpis: {
                total,
                active,
                closed,
                avgParticipation
            },
            data: tableData,
            raw: votingEvents
        };
    } catch (error) {
        console.error('Error fetching voting analytics:', error);
        throw error;
    }
};

/**
 * Get Events & Programs Analytics
 */
export const getEventsAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'events');
        const snapshot = await getDocs(collectionRef);
        let events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            events = filterByDateRange(events, filters.startDate, filters.endDate, 'when');
        }

        // Calculate KPIs
        const total = events.length;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let registrationsThisMonth = 0;
        events.forEach(event => {
            const eventDate = event.when?.toDate ? event.when.toDate() : new Date(event.when);
            if (eventDate >= thirtyDaysAgo) {
                registrationsThisMonth += (event.registrations?.length || 0);
            }
        });

        // Top events by registration
        const sortedByReg = [...events].sort((a, b) =>
            (b.registrations?.length || 0) - (a.registrations?.length || 0)
        );
        const topEvent = sortedByReg[0];

        // Format data for table
        const tableData = events.map(e => ({
            id: e.id,
            title: e.title || 'Untitled',
            dateTime: formatDateTime(e.when),
            location: e.where || 'TBA',
            capacity: e.capacity || 'Unlimited',
            registeredCount: e.registrations?.length || 0,
            status: e.status || 'open',
            createdBy: e.createdBy || 'Admin'
        }));

        return {
            kpis: {
                total,
                registrationsThisMonth,
                topEventTitle: topEvent?.title || 'N/A',
                topEventCount: topEvent?.registrations?.length || 0
            },
            data: tableData,
            raw: events
        };
    } catch (error) {
        console.error('Error fetching events analytics:', error);
        throw error;
    }
};

/**
 * Get Feedback & Concerns Analytics
 */
export const getFeedbackAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'feedback');
        const snapshot = await getDocs(collectionRef);
        let feedback = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            feedback = filterByDateRange(feedback, filters.startDate, filters.endDate);
        }

        // Calculate KPIs
        const total = feedback.length;
        const pending = feedback.filter(f => f.status === 'Pending' || !f.status).length;
        const inReview = feedback.filter(f => f.status === 'In Review').length;
        const resolved = feedback.filter(f => f.status === 'Resolved').length;

        // Calculate average response time (for items with replies)
        let totalResponseTime = 0;
        let respondedCount = 0;
        feedback.forEach(f => {
            if (f.replies && f.replies.length > 0) {
                const submittedDate = f.createdAt?.toDate ? f.createdAt.toDate() : new Date(f.createdAt);
                const firstReply = f.replies[0];
                const replyDate = firstReply.createdAt ? new Date(firstReply.createdAt) : null;
                if (replyDate) {
                    const diff = (replyDate - submittedDate) / (1000 * 60 * 60); // hours
                    totalResponseTime += diff;
                    respondedCount++;
                }
            }
        });
        const avgResponseTime = respondedCount > 0 ? Math.round(totalResponseTime / respondedCount) : 0;

        // Format data for table
        const tableData = feedback.map(f => ({
            id: f.id,
            category: f.category || 'General',
            userName: f.fullName || 'Anonymous',
            messagePreview: f.message ? f.message.substring(0, 50) + '...' : 'No message',
            status: f.status || 'Pending',
            submittedAt: formatDateTime(f.createdAt),
            responseCount: f.replies?.length || 0
        }));

        return {
            kpis: {
                total,
                pending,
                inReview,
                resolved,
                avgResponseTime: `${avgResponseTime}h`
            },
            data: tableData,
            raw: feedback
        };
    } catch (error) {
        console.error('Error fetching feedback analytics:', error);
        throw error;
    }
};

/**
 * Get Admin Accounts Analytics
 */
export const getAdminAccountsAnalytics = async (filters = {}) => {
    try {
        const collectionRef = collection(db, 'users');
        const q = query(collectionRef, where('role', '==', 'admin'));
        const snapshot = await getDocs(q);
        let admins = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            admins = filterByDateRange(admins, filters.startDate, filters.endDate);
        }

        // Calculate KPIs
        const total = admins.length;
        const active = admins.filter(a => a.status === 'verified' || a.status === 'active').length;
        const disabled = admins.filter(a => a.status === 'disabled' || a.status === 'suspended').length;

        // Format data for table
        const tableData = admins.map(a => ({
            id: a.id,
            name: a.fullName || a.displayName || 'N/A',
            email: a.email || 'N/A',
            role: a.role || 'admin',
            dateCreated: formatDate(a.createdAt),
            lastLogin: a.lastLoginAt ? formatDateTime(a.lastLoginAt) : 'Never',
            status: a.status || 'active'
        }));

        return {
            kpis: {
                total,
                active,
                disabled
            },
            data: tableData,
            raw: admins
        };
    } catch (error) {
        console.error('Error fetching admin accounts analytics:', error);
        throw error;
    }
};

/**
 * Export data to PDF
 */
export const exportToPDF = (data, sectionTitle, kpis = {}) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Apply the autoTable plugin to jsPDF
    applyPlugin(jsPDF);

    const doc = new jsPDF();

    // Set up document properties
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPosition = margin;

    // Header - Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Barangay ${sectionTitle} Analytics`, margin, yPosition);
    yPosition += 8;

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Analytics Performance Report', margin, yPosition);
    yPosition += 10;

    // Generated info (right aligned)
    doc.setFontSize(9);
    const generatedText = 'Generated by: Admin';
    const dateText = `Date: ${new Date().toLocaleDateString()}`;
    doc.text(generatedText, pageWidth - margin, 14, { align: 'right' });
    doc.text(dateText, pageWidth - margin, 19, { align: 'right' });

    // Divider line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // KPI Statistics Section
    if (kpis && Object.keys(kpis).length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(0, 0, 0);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Overview Statistics', margin + 2, yPosition + 5);
        yPosition += 10;

        // KPI Table
        const kpiData = Object.entries(kpis).map(([key, value]) => [
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
                0: { cellWidth: pageWidth / 2 - margin - 5 },
                1: { cellWidth: pageWidth / 2 - margin - 5, halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: margin, right: margin }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Detailed Data Table Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Detailed Records', margin + 2, yPosition + 5);
    yPosition += 10;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Prepare table data
    const tableData = data.map(row =>
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

    // Create detailed table
    doc.autoTable({
        startY: yPosition,
        head: [formattedHeaders],
        body: tableData,
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
        margin: { left: margin, right: margin },
        didDrawPage: function (data) {
            // Footer
            const footerY = pageHeight - 10;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${doc.internal.getNumberOfPages()}`,
                pageWidth / 2,
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

    // Save the PDF
    const fileName = `${sectionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
