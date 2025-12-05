import * as XLSX from 'xlsx-js-style';
import axiosInstance from '../axiosInstance';

interface UserMetrics {
  referrals: {
    referralsGiven: number;
    referralsReceived: number;
  };
  tyfcb: {
    givenCount: number;
    receivedCount: number;
    givenAmount: number;
    receivedAmount: number;
    totalAmount: number;
  };
  meetups: number;
  visitorInvitations: number;
  memberReferrals: number;
}

interface AreaMetrics {
  bizWinTransactions: {
    total: number;
    given: number;
    received: number;
    totalAmount: number;
    givenAmount: number;
    receivedAmount: number;
  };
  bizConnectMeetups: {
    total: number;
    given: number;
    received: number;
  };
  meetups: {
    total: number;
  };
  visitorInvitations: {
    total: number;
  };
  memberReferrals: {
    total: number;
  };
  userCount: number;
}

/**
 * Generate user-specific metrics report with 2 sheets:
 * - Summary: Overview of metrics
 * - Details: Detailed transaction breakdown
 */
export const generateUserMetricsReport = async (
  userId: string,
  userName: string,
  userMetrics: UserMetrics,
  membershipType: string,
  dateRange?: { startDate: string; endDate: string }
) => {
  const workbook = XLSX.utils.book_new();
  const filename = `${userName}_metrics.xlsx`;

  // ===== SHEET 1: SUMMARY =====
  const summaryData: any[] = [
    [`Metrics Report for ${userName}`],
    [""],
    ["visitor invitations", userMetrics.visitorInvitations || 0],
    ["Meetups", userMetrics.meetups],
  ];

  if (membershipType !== "Digital Membership") {
    summaryData.push(["Member Referrals", userMetrics.memberReferrals || 0]);
  }

  summaryData.push(
    [""],
    ["", "Received", "Given"],
    ["BizConnect", userMetrics.referrals.referralsReceived, userMetrics.referrals.referralsGiven],
    ["BizWin", userMetrics.tyfcb.receivedAmount, userMetrics.tyfcb.givenAmount]
  );

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Apply styling to Summary sheet
  // Title with dark purple gradient effect
  summarySheet['A1'].s = {
    fill: { fgColor: { rgb: 'FF2E4053' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 16 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'FF1A252F' } },
      bottom: { style: 'medium', color: { rgb: 'FF1A252F' } },
      left: { style: 'medium', color: { rgb: 'FF1A252F' } },
      right: { style: 'medium', color: { rgb: 'FF1A252F' } }
    }
  };

  // Style header row (Received/Given) with teal background
  const headerRow = summaryData.length - 3;
  ['A', 'B', 'C'].forEach(col => {
    const cellRef = `${col}${headerRow + 1}`;
    if (summarySheet[cellRef]) {
      summarySheet[cellRef].s = {
        fill: { fgColor: { rgb: 'FF17A2B8' } },
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: 'FF138496' } },
          bottom: { style: 'medium', color: { rgb: 'FF138496' } },
          left: { style: 'medium', color: { rgb: 'FF138496' } },
          right: { style: 'medium', color: { rgb: 'FF138496' } }
        }
      };
    }
  });

  // Style metric labels (visitor invitations, Meetups, etc.) with light gray background
  for (let row = 3; row <= headerRow; row++) {
    const cellRef = `A${row}`;
    if (summarySheet[cellRef] && summarySheet[cellRef].v) {
      summarySheet[cellRef].s = {
        fill: { fgColor: { rgb: 'FFF8F9FA' } },
        font: { bold: true, sz: 10 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
          bottom: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
          left: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
          right: { style: 'thin', color: { rgb: 'FFDEE2E6' } }
        }
      };
    }

    // Style metric values with white background
    const valueCellRef = `B${row}`;
    if (summarySheet[valueCellRef]) {
      summarySheet[valueCellRef].s = {
        fill: { fgColor: { rgb: 'FFFFFFFF' } },
        font: { sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
          bottom: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
          left: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
          right: { style: 'thin', color: { rgb: 'FFDEE2E6' } }
        }
      };
    }
  }

  // Style BizConnect and BizWin data rows with alternating colors
  ['A', 'B', 'C'].forEach(col => {
    // BizConnect row (greenish background)
    const bizConnectRef = `${col}${headerRow + 2}`;
    if (summarySheet[bizConnectRef]) {
      summarySheet[bizConnectRef].s = {
        fill: { fgColor: { rgb: 'FFD4EDDA' } },
        font: { bold: col === 'A', sz: 10 },
        alignment: { horizontal: col === 'A' ? 'left' : 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'FFC3E6CB' } },
          bottom: { style: 'thin', color: { rgb: 'FFC3E6CB' } },
          left: { style: 'thin', color: { rgb: 'FFC3E6CB' } },
          right: { style: 'thin', color: { rgb: 'FFC3E6CB' } }
        }
      };
    }

    // BizWin row (yellowish background)
    const bizWinRef = `${col}${headerRow + 3}`;
    if (summarySheet[bizWinRef]) {
      summarySheet[bizWinRef].s = {
        fill: { fgColor: { rgb: 'FFFFEAA7' } },
        font: { bold: col === 'A', sz: 10 },
        alignment: { horizontal: col === 'A' ? 'left' : 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'FFFDCB6E' } },
          bottom: { style: 'thin', color: { rgb: 'FFFDCB6E' } },
          left: { style: 'thin', color: { rgb: 'FFFDCB6E' } },
          right: { style: 'thin', color: { rgb: 'FFFDCB6E' } }
        }
      };
    }
  });

  // Set column widths for Summary sheet
  summarySheet['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
  ];

  // Set row heights for better spacing
  summarySheet['!rows'] = [
    { hpt: 30 }, // Title row height
  ];

  // Merge title cell
  summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // ===== SHEET 2: DETAILS =====
  try {
    const response = await axiosInstance.get(`/dashboard/user-detailed-stats/${userId}`, {
      params: dateRange,
    });

    const detailsData = response.data.data;

    const detailRows: any[] = [
      [`Detailed Transaction Report - ${userName}`],
      [""],
      ["Category", "Type", "Date", "With Whom", "Referral Name", "Contact", "Amount", "Status/Notes"]
    ];

    let currentRow = 3;

    // BizWin Given
    if (detailsData.bizWin.given.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== BIZWIN GIVEN ===", "", "", "", "", "", "", ""]);
      detailsData.bizWin.given.forEach((txn: any) => {
        currentRow++;
        detailRows.push([
          "BizWin",
          "Given",
          new Date(txn.createdAt).toLocaleDateString(),
          `${txn.to?.fname || ''} ${txn.to?.lname || ''}`,
          "-",
          "-",
          txn.amount?.toLocaleString() || 0,
          txn.comments || "-"
        ]);
      });
    }

    // BizWin Received
    if (detailsData.bizWin.received.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== BIZWIN RECEIVED ===", "", "", "", "", "", "", ""]);
      detailsData.bizWin.received.forEach((txn: any) => {
        currentRow++;
        detailRows.push([
          "BizWin",
          "Received",
          new Date(txn.createdAt).toLocaleDateString(),
          `${txn.from?.fname || ''} ${txn.from?.lname || ''}`,
          "-",
          "-",
          txn.amount?.toLocaleString() || 0,
          txn.comments || "-"
        ]);
      });
    }

    // BizConnect Given
    if (detailsData.bizConnect.given.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== BIZCONNECT GIVEN ===", "", "", "", "", "", "", ""]);
      detailsData.bizConnect.given.forEach((txn: any) => {
        currentRow++;
        detailRows.push([
          "BizConnect",
          "Given",
          new Date(txn.createdAt).toLocaleDateString(),
          `${txn.to?.fname || ''} ${txn.to?.lname || ''}`,
          txn.referral || "N/A",
          txn.telephone || "N/A",
          "-",
          txn.status || "N/A"
        ]);
      });
    }

    // BizConnect Received
    if (detailsData.bizConnect.received.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== BIZCONNECT RECEIVED ===", "", "", "", "", "", "", ""]);
      detailsData.bizConnect.received.forEach((txn: any) => {
        currentRow++;
        detailRows.push([
          "BizConnect",
          "Received",
          new Date(txn.createdAt).toLocaleDateString(),
          `${txn.from?.fname || ''} ${txn.from?.lname || ''}`,
          txn.referral || "N/A",
          txn.telephone || "N/A",
          "-",
          txn.status || "N/A"
        ]);
      });
    }

    // Meetups Created
    if (detailsData.meetups.created.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== MEETUPS CREATED ===", "", "", "", "", "", "", ""]);
      detailsData.meetups.created.forEach((meetup: any) => {
        currentRow++;
        detailRows.push([
          "Meetup",
          "Created",
          new Date(meetup.date).toLocaleDateString(),
          meetup.title,
          "-",
          "-",
          "-",
          "-"
        ]);
      });
    }

    // Meetups Attended
    if (detailsData.meetups.attended.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== MEETUPS ATTENDED ===", "", "", "", "", "", "", ""]);
      detailsData.meetups.attended.forEach((meetup: any) => {
        currentRow++;
        detailRows.push([
          "Meetup",
          "Attended",
          new Date(meetup.date).toLocaleDateString(),
          meetup.title,
          "-",
          "-",
          "-",
          "-"
        ]);
      });
    }

    // Visitor Invitations
    if (detailsData.visitorInvitations.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== VISITOR INVITATIONS ===", "", "", "", "", "", "", ""]);
      detailsData.visitorInvitations.forEach((inv: any) => {
        currentRow++;
        detailRows.push([
          "Visitor",
          "Invitation",
          new Date(inv.createdAt).toLocaleDateString(),
          inv.name,
          "-",
          inv.mobile || "N/A",
          "-",
          `${inv.email || 'N/A'} | ${inv.status || "Pending"}`
        ]);
      });
    }

    // Member Referrals
    if (detailsData.memberReferrals.length > 0) {
      currentRow++;
      detailRows.push(["", "", "", "", "", "", "", ""]);
      currentRow++;
      detailRows.push(["=== MEMBER REFERRALS ===", "", "", "", "", "", "", ""]);
      detailsData.memberReferrals.forEach((ref: any) => {
        currentRow++;
        detailRows.push([
          "Member",
          "Referral",
          new Date(ref.createdAt).toLocaleDateString(),
          `${ref.fname} ${ref.lname}`,
          "-",
          "-",
          "-",
          `${ref.email} | ${ref.membershipType}`
        ]);
      });
    }

    const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);

    // Apply styling to Details sheet
    // Title with dark purple gradient effect
    detailSheet['A1'].s = {
      fill: { fgColor: { rgb: 'FF2E4053' } },
      font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 16 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'medium', color: { rgb: 'FF1A252F' } },
        bottom: { style: 'medium', color: { rgb: 'FF1A252F' } },
        left: { style: 'medium', color: { rgb: 'FF1A252F' } },
        right: { style: 'medium', color: { rgb: 'FF1A252F' } }
      }
    };

    // Column headers (row 3) with teal background
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'].forEach(cellRef => {
      if (detailSheet[cellRef]) {
        detailSheet[cellRef].s = {
          fill: { fgColor: { rgb: 'FF17A2B8' } },
          font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: 'FF138496' } },
            bottom: { style: 'medium', color: { rgb: 'FF138496' } },
            left: { style: 'medium', color: { rgb: 'FF138496' } },
            right: { style: 'medium', color: { rgb: 'FF138496' } }
          }
        };
      }
    });

    // Track current section for color coding and section header rows for merging
    let currentSection = '';
    const sectionHeaderRows: number[] = []; // Track section header row numbers
    const sectionColors: { [key: string]: string } = {
      'BIZWIN GIVEN': 'FFFFE6E6',       // Light red
      'BIZWIN RECEIVED': 'FFE6F9FF',    // Light blue
      'BIZCONNECT GIVEN': 'FFFFE6F2',   // Light pink
      'BIZCONNECT RECEIVED': 'FFE6FFE6', // Light green
      'MEETUPS CREATED': 'FFF9F3E6',    // Light orange
      'MEETUPS ATTENDED': 'FFF3E6FF',   // Light purple
      'VISITOR INVITATIONS': 'FFFFF3E6', // Light yellow
      'MEMBER REFERRALS': 'FFE6F3FF'    // Light cyan
    };

    // Section headers and data rows styling
    for (let i = 4; i <= detailRows.length; i++) {
      const cellRef = `A${i}`;

      // Section headers (=== BIZWIN GIVEN === etc.)
      if (detailSheet[cellRef] && detailSheet[cellRef].v && String(detailSheet[cellRef].v).startsWith('===')) {
        const sectionText = String(detailSheet[cellRef].v).replace(/===/g, '').trim();
        currentSection = sectionText;

        // Track this row for merging later
        sectionHeaderRows.push(i - 1); // -1 because row numbers are 0-indexed in merges

        // Different colors for different sections
        let sectionColor = 'FFFF6B6B'; // Default red
        if (sectionText.includes('BIZWIN GIVEN')) sectionColor = 'FFFF6B6B';
        else if (sectionText.includes('BIZWIN RECEIVED')) sectionColor = 'FF4ECDC4';
        else if (sectionText.includes('BIZCONNECT GIVEN')) sectionColor = 'FFFF8B94';
        else if (sectionText.includes('BIZCONNECT RECEIVED')) sectionColor = 'FF95E1D3';
        else if (sectionText.includes('MEETUPS CREATED')) sectionColor = 'FFFFA502';
        else if (sectionText.includes('MEETUPS ATTENDED')) sectionColor = 'FFB589D6';
        else if (sectionText.includes('VISITOR')) sectionColor = 'FFFFD93D';
        else if (sectionText.includes('MEMBER')) sectionColor = 'FF6BCB77';

        // Style section header with bold colors
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
          const secCellRef = `${col}${i}`;
          if (detailSheet[secCellRef]) {
            detailSheet[secCellRef].s = {
              fill: { fgColor: { rgb: sectionColor } },
              font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 12 },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: 'FF2C3E50' } },
                bottom: { style: 'medium', color: { rgb: 'FF2C3E50' } },
                left: { style: 'medium', color: { rgb: 'FF2C3E50' } },
                right: { style: 'medium', color: { rgb: 'FF2C3E50' } }
              }
            };
          }
        });
      }
      // Data rows with alternating colors based on section
      else if (detailSheet[cellRef] && detailSheet[cellRef].v && String(detailSheet[cellRef].v).trim() !== '') {
        const rowColor = sectionColors[currentSection] || 'FFFFFFFF';
        const isEvenRow = (i % 2 === 0);
        const bgColor = isEvenRow ? rowColor : 'FFFFFFFF';

        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
          const dataCellRef = `${col}${i}`;
          if (detailSheet[dataCellRef]) {
            detailSheet[dataCellRef].s = {
              fill: { fgColor: { rgb: bgColor } },
              font: { sz: 10 },
              alignment: {
                horizontal: ['A', 'B', 'C'].includes(col) ? 'center' : 'left',
                vertical: 'center'
              },
              border: {
                top: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
                bottom: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
                left: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
                right: { style: 'thin', color: { rgb: 'FFDEE2E6' } }
              }
            };
          }
        });
      }
    }

    // Set column widths for Details sheet
    detailSheet['!cols'] = [
      { wch: 14 }, // Category
      { wch: 14 }, // Type
      { wch: 14 }, // Date
      { wch: 22 }, // With Whom
      { wch: 22 }, // Referral Name
      { wch: 17 }, // Contact
      { wch: 17 }, // Amount
      { wch: 35 }, // Status/Notes
    ];

    // Set row heights
    detailSheet['!rows'] = [
      { hpt: 30 }, // Title row
      { hpt: 15 }, // Empty row
      { hpt: 25 }, // Header row
    ];

    // Merge title cell and section headers
    detailSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title row
      ...sectionHeaderRows.map(rowIndex => ({
        s: { r: rowIndex, c: 0 },
        e: { r: rowIndex, c: 7 }
      }))
    ];

    XLSX.utils.book_append_sheet(workbook, detailSheet, "Details");

  } catch (err) {
    console.error("Error fetching detailed stats:", err);
  }

  // Write file with styles
  XLSX.writeFile(workbook, filename);
};

/**
 * Generate area-wide metrics report
 */
export const generateAreaMetricsReport = (
  areaName: string,
  metrics: AreaMetrics
) => {
  const workbook = XLSX.utils.book_new();
  const filename = `${areaName}_metrics.xlsx`;

  const areaData = [
    [`${areaName} - Metrics Report`],
    [""],
    ["Metric", "Total", "Given", "Received"],
    ["Meetups", metrics.meetups.total, "-", "-"],
    ["BizConnect", metrics.bizConnectMeetups.total, metrics.bizConnectMeetups.given, metrics.bizConnectMeetups.received],
    ["BizWin (Amount)", metrics.bizWinTransactions.totalAmount, metrics.bizWinTransactions.givenAmount, metrics.bizWinTransactions.receivedAmount],
    ["Visitor Invitations", metrics.visitorInvitations.total, "-", "-"],
    ["Member Referrals", metrics.memberReferrals.total, "-", "-"],
    ["Total Members", metrics.userCount, "-", "-"],
  ];

  const areaSheet = XLSX.utils.aoa_to_sheet(areaData);

  // Apply styling
  // Title with dark purple gradient effect
  areaSheet['A1'].s = {
    fill: { fgColor: { rgb: 'FF2E4053' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 16 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'FF1A252F' } },
      bottom: { style: 'medium', color: { rgb: 'FF1A252F' } },
      left: { style: 'medium', color: { rgb: 'FF1A252F' } },
      right: { style: 'medium', color: { rgb: 'FF1A252F' } }
    }
  };

  // Column headers with teal background
  ['A3', 'B3', 'C3', 'D3'].forEach(cellRef => {
    if (areaSheet[cellRef]) {
      areaSheet[cellRef].s = {
        fill: { fgColor: { rgb: 'FF17A2B8' } },
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: 'FF138496' } },
          bottom: { style: 'medium', color: { rgb: 'FF138496' } },
          left: { style: 'medium', color: { rgb: 'FF138496' } },
          right: { style: 'medium', color: { rgb: 'FF138496' } }
        }
      };
    }
  });

  // Data rows with alternating colors
  const rowColors = [
    'FFFFE6E6', // Light red for Meetups
    'FFE6FFE6', // Light green for BizConnect
    'FFFFEAA7', // Light yellow for BizWin
    'FFE6F9FF', // Light blue for Visitor Invitations
    'FFFFF3E6', // Light peach for Member Referrals
    'FFE6F3FF'  // Light cyan for Total Members
  ];

  for (let row = 4; row <= 9; row++) {
    const colorIndex = row - 4;
    const isEvenRow = ((row - 4) % 2 === 0);
    const bgColor = isEvenRow ? rowColors[colorIndex] : 'FFFFFFFF';

    ['A', 'B', 'C', 'D'].forEach(col => {
      const cellRef = `${col}${row}`;
      if (areaSheet[cellRef]) {
        areaSheet[cellRef].s = {
          fill: { fgColor: { rgb: bgColor } },
          font: { bold: col === 'A', sz: 10 },
          alignment: {
            horizontal: col === 'A' ? 'left' : 'center',
            vertical: 'center'
          },
          border: {
            top: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
            bottom: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
            left: { style: 'thin', color: { rgb: 'FFDEE2E6' } },
            right: { style: 'thin', color: { rgb: 'FFDEE2E6' } }
          }
        };
      }
    });
  }

  // Set column widths
  areaSheet['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];

  // Set row heights
  areaSheet['!rows'] = [
    { hpt: 30 }, // Title row
    { hpt: 15 }, // Empty row
    { hpt: 25 }, // Header row
  ];

  // Merge title cell
  areaSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  XLSX.utils.book_append_sheet(workbook, areaSheet, "Area Summary");

  // Write file with styles
  XLSX.writeFile(workbook, filename);
};

/**
 * Generate detailed zone report with separate sheets for each user
 */
export const generateZoneDetailedExcel = async (
  zoneId: string,
  zoneName: string,
  dateRange?: { startDate: string; endDate: string }
) => {
  const workbook = XLSX.utils.book_new();
  const filename = `${zoneName}_Detailed_Report.xlsx`;

  try {
    const response = await axiosInstance.get('/franchise/mf/zone-detailed-report', {
      params: {
        zoneId,
        ...dateRange
      }
    });

    const reportData = response.data.data;

    if (!reportData || reportData.length === 0) {
      alert("No data found for this zone.");
      return;
    }

    // Create a Summary Sheet first
    const summaryRows = [
      [`Detailed Report for ${zoneName}`],
      [""],
      ["User Name", "Email", "Membership", "BizWin Given", "BizWin Received", "BizConnect Given", "BizConnect Received", "Meetups"]
    ];

    reportData.forEach((item: any) => {
      const { user, stats } = item;

      // Calculate totals for summary
      const bizWinGivenTotal = stats.bizWin.given.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const bizWinReceivedTotal = stats.bizWin.received.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const bizConnectGivenCount = stats.bizConnect.given.length;
      const bizConnectReceivedCount = stats.bizConnect.received.length;
      const meetupsCount = stats.meetups.created.length + stats.meetups.attended.length;

      summaryRows.push([
        `${user.fname} ${user.lname}`,
        user.email,
        user.membershipType || "N/A",
        bizWinGivenTotal.toLocaleString(),
        bizWinReceivedTotal.toLocaleString(),
        bizConnectGivenCount,
        bizConnectReceivedCount,
        meetupsCount
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

    // Style Summary Sheet
    summarySheet['A1'].s = {
      fill: { fgColor: { rgb: 'FF2E4053' } },
      font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 16 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // Header row style
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'].forEach(cellRef => {
      if (summarySheet[cellRef]) {
        summarySheet[cellRef].s = {
          fill: { fgColor: { rgb: 'FF17A2B8' } },
          font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    });

    // Column widths
    summarySheet['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
    ];

    summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Zone Summary");

    // Create Individual User Sheets
    reportData.forEach((item: any) => {
      const { user, stats } = item;
      const userName = `${user.fname} ${user.lname}`;
      // Sheet names must be unique and < 31 chars. 
      // We'll use First Name + partial Last Name + partial ID if needed, but for now simple truncation
      let sheetName = userName.slice(0, 30);

      // Ensure unique sheet name (simple check, though collisions rare with small zones)
      let counter = 1;
      while (workbook.Sheets[sheetName]) {
        sheetName = userName.slice(0, 28) + `_${counter}`;
        counter++;
      }

      const detailRows: any[] = [
        [`Detailed Report - ${userName}`],
        [`Email: ${user.email} | Membership: ${user.membershipType || 'N/A'}`],
        [""],
        ["Category", "Type", "Date", "With Whom", "Referral Name", "Contact", "Amount", "Status/Notes"]
      ];

      let currentRow = 4;

      // Helper to add section
      const addSection = (title: string, data: any[], type: string, category: string) => {
        if (data.length > 0) {
          currentRow++;
          detailRows.push(["", "", "", "", "", "", "", ""]);
          currentRow++;
          detailRows.push([`=== ${title} ===`, "", "", "", "", "", "", ""]);

          data.forEach((txn: any) => {
            currentRow++;
            let rowData: any[] = [];

            if (category === "BizWin") {
              rowData = [
                category,
                type,
                new Date(txn.createdAt).toLocaleDateString(),
                type === "Given"
                  ? `${txn.to?.fname || ''} ${txn.to?.lname || ''}`
                  : `${txn.from?.fname || ''} ${txn.from?.lname || ''}`,
                "-",
                "-",
                txn.amount?.toLocaleString() || 0,
                txn.comments || "-"
              ];
            } else if (category === "BizConnect") {
              rowData = [
                category,
                type,
                new Date(txn.createdAt).toLocaleDateString(),
                type === "Given"
                  ? `${txn.to?.fname || ''} ${txn.to?.lname || ''}`
                  : `${txn.from?.fname || ''} ${txn.from?.lname || ''}`,
                txn.referral || "N/A",
                txn.telephone || "N/A",
                "-",
                txn.status || "N/A"
              ];
            } else if (category === "Meetup") {
              rowData = [
                category,
                type,
                new Date(txn.date).toLocaleDateString(),
                txn.title,
                "-",
                "-",
                "-",
                "-"
              ];
            } else if (category === "Visitor") {
              rowData = [
                category,
                type,
                new Date(txn.createdAt).toLocaleDateString(),
                txn.name,
                "-",
                txn.mobile || "N/A",
                "-",
                `${txn.email || 'N/A'} | ${txn.status || "Pending"}`
              ];
            } else if (category === "Member") {
              rowData = [
                category,
                type,
                new Date(txn.createdAt).toLocaleDateString(),
                `${txn.fname} ${txn.lname}`,
                "-",
                "-",
                "-",
                `${txn.email} | ${txn.membershipType}`
              ];
            }

            detailRows.push(rowData);
          });
        }
      };

      addSection("BIZWIN GIVEN", stats.bizWin.given, "Given", "BizWin");
      addSection("BIZWIN RECEIVED", stats.bizWin.received, "Received", "BizWin");
      addSection("BIZCONNECT GIVEN", stats.bizConnect.given, "Given", "BizConnect");
      addSection("BIZCONNECT RECEIVED", stats.bizConnect.received, "Received", "BizConnect");
      addSection("MEETUPS CREATED", stats.meetups.created, "Created", "Meetup");
      addSection("MEETUPS ATTENDED", stats.meetups.attended, "Attended", "Meetup");
      addSection("VISITOR INVITATIONS", stats.visitorInvitations, "Invitation", "Visitor");
      addSection("MEMBER REFERRALS", stats.memberReferrals, "Referral", "Member");

      const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);

      // Apply basic styling (simplified for brevity, can copy full styling if needed)
      detailSheet['A1'].s = { font: { bold: true, sz: 14 } };
      detailSheet['!cols'] = [
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 17 }, { wch: 17 }, { wch: 35 }
      ];
      detailSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ];

      XLSX.utils.book_append_sheet(workbook, detailSheet, sheetName);
    });

    XLSX.writeFile(workbook, filename);

  } catch (err) {
    console.error("Error generating zone detailed report:", err);
    alert("Failed to generate report. Please try again.");
  }
};
