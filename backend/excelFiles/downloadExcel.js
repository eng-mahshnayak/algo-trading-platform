
import User from '../models/userModel.js';
import AngelOneCredential from '../models/angelOneCredential.js';
import Order from '../models/orderModel.js';

import ExcelJS from "exceljs";



export const downloadUserExcelFile = async (req, res) => {
    try {

    const users = await User.findAll({});

     const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // 🧾 All columns from your model
    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Username", key: "username", width: 18 },
      { header: "Phone Number", key: "phoneNumber", width: 16 },
      { header: "Role", key: "role", width: 10 },
      { header: "Is Checked", key: "isChecked", width: 10 },
      { header: "AngelOne ID", key: "angeloneId", width: 18 },
      { header: "Auth Token", key: "authToken", width: 25 },
      { header: "Feed Token", key: "feedToken", width: 25 },
      { header: "Refresh Token", key: "refreshToken", width: 25 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Updated At", key: "updatedAt", width: 22 },
    ];

    // 🟢 Add all rows
    users.forEach((user) => {
      worksheet.addRow({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isChecked: user.isChecked,
        angeloneId: user.angeloneId,
        authToken: user.authToken,
        feedToken: user.feedToken,
        refreshToken: user.refreshToken,
        createdAt: user.createdAt?.toISOString().replace("T", " ").slice(0, 19),
        updatedAt: user.updatedAt?.toISOString().replace("T", " ").slice(0, 19),
      });
    });

    // Header bold
    worksheet.getRow(1).font = { bold: true };

    // 📦 Set download headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

    } catch (error) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};


export const downloadUserAngelOneCredential = async (req, res) => {
  try {
    // Fetch all credentials
    const credentials = await AngelOneCredential.findAll({ raw: true });

    // Create workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("AngelOneCredentials");

    // 🧾 Define columns matching your schema
    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "User ID", key: "userId", width: 10 },
      { header: "Client ID", key: "clientId", width: 20 },
      { header: "TOTP Secret", key: "totpSecret", width: 30 },
      { header: "Password", key: "password", width: 25 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Updated At", key: "updatedAt", width: 22 },
    ];

    // 🟢 Add all rows
    credentials.forEach((item) => {
      worksheet.addRow({
        id: item.id,
        userId: item.userId,
        clientId: item.clientId,
        totpSecret: item.totpSecret,
        password: item.password,
        createdAt: item.createdAt?.toISOString().replace("T", " ").slice(0, 19),
        updatedAt: item.updatedAt?.toISOString().replace("T", " ").slice(0, 19),
      });
    });

    // Bold header row
    worksheet.getRow(1).font = { bold: true };

    // 📦 Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=angelone_credentials.xlsx"
    );

    // Write and send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Excel export failed:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};



export const downloadOrderData = async (req, res) => {
  try {
    // 🟢 Fetch all orders
    const orders = await Order.findAll({ raw: true });

    // 🧾 Create workbook & sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // 🧱 Define all columns (based on your Order schema)
    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Variety", key: "variety", width: 12 },
      { header: "Order Type", key: "ordertype", width: 14 },
      { header: "Product Type", key: "producttype", width: 14 },
      { header: "Duration", key: "duration", width: 12 },
      { header: "Price", key: "price", width: 12 },
      { header: "Trigger Price", key: "triggerprice", width: 14 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Disclosed Quantity", key: "disclosedquantity", width: 18 },
      { header: "Square Off", key: "squareoff", width: 14 },
      { header: "Stop Loss", key: "stoploss", width: 14 },
      { header: "Trailing Stop Loss", key: "trailingstoploss", width: 18 },
      { header: "Trading Symbol", key: "tradingsymbol", width: 18 },
      { header: "Transaction Type", key: "transactiontype", width: 16 },
      { header: "Exchange", key: "exchange", width: 12 },
      { header: "Symbol Token", key: "symboltoken", width: 14 },
      { header: "Instrument Type", key: "instrumenttype", width: 14 },
      { header: "Strike Price", key: "strikeprice", width: 14 },
      { header: "Option Type", key: "optiontype", width: 14 },
      { header: "Expiry Date", key: "expirydate", width: 18 },
      { header: "Lot Size", key: "lotsize", width: 12 },
      { header: "Cancel Size", key: "cancelsize", width: 12 },
      { header: "Average Price", key: "averageprice", width: 14 },
      { header: "Filled Shares", key: "filledshares", width: 14 },
      { header: "Unfilled Shares", key: "unfilledshares", width: 16 },
      { header: "Order ID", key: "orderid", width: 16 },
      { header: "Text", key: "text", width: 25 },
      { header: "Status", key: "status", width: 14 },
      { header: "Order Status", key: "orderstatus", width: 16 },
      { header: "Update Time", key: "updatetime", width: 18 },
      { header: "Exchange Time", key: "exchtime", width: 18 },
      { header: "Exchange Order Update Time", key: "exchorderupdatetime", width: 24 },
      { header: "Fill ID", key: "fillid", width: 16 },
      { header: "Fill Time", key: "filltime", width: 16 },
      { header: "Parent Order ID", key: "parentorderid", width: 20 },
      { header: "Order Tag", key: "ordertag", width: 16 },
      { header: "Unique Order ID", key: "uniqueorderid", width: 20 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Updated At", key: "updatedAt", width: 22 },
    ];

    // 🟢 Add all rows to worksheet
    orders.forEach((order) => {
      worksheet.addRow({
        ...order,
        createdAt: order.createdAt
          ? order.createdAt.toISOString().replace("T", " ").slice(0, 19)
          : "",
        updatedAt: order.updatedAt
          ? order.updatedAt.toISOString().replace("T", " ").slice(0, 19)
          : "",
      });
    });

    // Bold header row
    worksheet.getRow(1).font = { bold: true };

    // 📦 Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=orders.xlsx"
    );

    // 📤 Write file to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Excel export failed:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};
