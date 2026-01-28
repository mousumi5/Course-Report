
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ActivityReport, CourseType } from "../types";

export const pdfService = {
  generateCourseReport: async (courseId: CourseType, reports: ActivityReport[], aiAnalysis?: string | null) => {
    const doc = new jsPDF();
    const title = `${courseId.toUpperCase()} - STRATEGIC TRAINING REPORT`;
    
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("PERSONNEL PULSE", 14, 22);
    doc.setFontSize(10);
    doc.text(title, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 150, 30);

    const grandTotal = reports.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.text(`Total Personnel Strength: ${grandTotal}`, 14, 52);

    if (aiAnalysis) {
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text("AI Strategic Insights", 14, 70);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const splitAnalysis = doc.splitTextToSize(aiAnalysis, 180);
      doc.text(splitAnalysis, 14, 78);
    }

    doc.save(`${courseId.replace(/ /g, '_')}_Report.pdf`);
  }
};

/**
 * UPDATED GOOGLE APPS SCRIPT
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete existing code and paste this.
 * 4. Deploy as Web App (Execute as: Me, Who has access: Anyone).
 */
/*
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = data.action;

    // --- PERSONNEL DATA LOGIC ---
    if (action === 'saveStaff' || action === 'updateStaff') {
      const tabName = 'Personnel Data';
      let sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        sheet = ss.insertSheet(tabName);
        const headers = ["ID", "S.No", "CISF No", "Rank", "Name", "DOB", "DOA", "Qualification", "Course From", "Course To", "ASTI Name", "Reg No", "EBCAS ID", "Aadhar", "AEP No", "ID Card No", "Mobile", "Email", "Status", "Timestamp"];
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
      }
      
      const values = [
        data.id, data.sNo, data.cisfNo, data.rank, data.name, data.dob, data.doa, 
        data.qualification, data.courseFrom, data.courseTo, data.astiName, 
        data.regNo, data.ebcasId, data.aadharNo, data.aepNo, data.idCardNo, 
        data.mobileNo, data.emailId, data.status, data.timestamp
      ];

      if (action === 'updateStaff') {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][2] == data.cisfNo) { // Column index 2 is CISF No
            sheet.getRange(i + 1, 1, 1, values.length).setValues([values]);
            return ContentService.createTextOutput(JSON.stringify({ status: "updated" })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      sheet.appendRow(values);
      return ContentService.createTextOutput(JSON.stringify({ status: "saved" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteStaff') {
      const sheet = ss.getSheetByName('Personnel Data');
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === data.id) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "deleted" })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTIVITY REPORTS LOGIC ---
    if (action === 'saveReport') {
      const tabName = 'Activity Reports';
      let sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        sheet = ss.insertSheet(tabName);
        const headers = ["ID", "CourseId", "Date", "From", "To", "Topics", "Instructor", "Location", "GOs", "SOsM", "SOsF", "ORsM", "ORsF", "TotalM", "TotalF", "GrandTotal", "Remarks", "Timestamp"];
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      }
      sheet.appendRow([
        data.id, data.courseId, data.date, data.timeFrom, data.timeTo, data.topics, 
        data.instructor, data.location, data.gos, data.sosMale, data.sosFemale, 
        data.orsMale, data.orsFemale, data.totalMale, data.totalFemale, 
        data.grandTotal, data.remarks, data.timestamp
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteReport') {
      const sheet = ss.getSheetByName('Activity Reports');
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === data.id) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "deleted" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  
  if (action === 'getStaff') {
    const sheet = ss.getSheetByName('Personnel Data');
    if (!sheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    const rows = sheet.getDataRange().getValues();
    rows.shift();
    const allStaff = rows.map(r => ({
      id: r[0], sNo: r[1], cisfNo: r[2], rank: r[3], name: r[4], dob: r[5], doa: r[6],
      qualification: r[7], courseFrom: r[8], courseTo: r[9], astiName: r[10],
      regNo: r[11], ebcasId: r[12], aadharNo: r[13], aepNo: r[14], idCardNo: r[15],
      mobileNo: r[16], emailId: r[17], status: r[18], timestamp: r[19]
    }));
    return ContentService.createTextOutput(JSON.stringify(allStaff)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getReports') {
    const sheet = ss.getSheetByName('Activity Reports');
    if (!sheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    const rows = sheet.getDataRange().getValues();
    rows.shift();
    const reports = rows.map(r => ({
      id: r[0], courseId: r[1], date: r[2], timeFrom: r[3], timeTo: r[4], topics: r[5],
      instructor: r[6], location: r[7], gos: r[8], totalMale: r[13], totalFemale: r[14],
      grandTotal: r[15], remarks: r[16], timestamp: r[17]
    }));
    return ContentService.createTextOutput(JSON.stringify(reports)).setMimeType(ContentService.MimeType.JSON);
  }
}
*/
