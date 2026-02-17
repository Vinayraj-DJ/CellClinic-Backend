import Brand from "../../database/models/catalog/brand.model.js";
import Device from "../../database/models/catalog/device.model.js";
import Service from "../../database/models/catalog/service.model.js";
import Inquiry from "../../database/models/inquiry.model.js";
import Contact from "../../database/models/contact.model.js";
import AdmZip from "adm-zip";
import xlsx from "xlsx";

// ==========================================
// 1. EXPORT ALL DATA (JSON Backup)
// ==========================================
export const exportAllData = async (req, res) => {
  try {
    console.log("📦 Starting Cell Clinic Backup...");

    const [brands, devices, services, inquiries] = await Promise.all([
      Brand.find({}),
      Device.find({}),
      Service.find({}),
      Inquiry.find({}),
    ]);

    const fullBackup = {
      system: "Cell Clinic Hyderabad",
      generatedAt: new Date(),
      stats: {
        brands: brands.length,
        devices: devices.length,
        services: services.length,
        orders: inquiries.length,
      },
      data: { brands, devices, services, inquiries },
    };

    const fileName = `CellClinic_Backup_${
      new Date().toISOString().split("T")[0]
    }.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.status(200).send(JSON.stringify(fullBackup, null, 2));
  } catch (error) {
    console.error("Backup Failed:", error);
    res.status(500).json({ message: "Backup Failed: " + error.message });
  }
};

// ==========================================
// 2. RESTORE DATA (Upload ZIP)
// ==========================================
export const restoreData = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No backup file uploaded" });

    console.log("♻️ Starting Restore Process...");

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    let dbEntry = zipEntries.find(
      (entry) =>
        entry.entryName.endsWith("database.json") ||
        entry.entryName.endsWith(".json")
    );

    if (!dbEntry) {
      return res
        .status(400)
        .json({ message: "Invalid Backup: No database.json found inside ZIP" });
    }

    const dbString = dbEntry.getData().toString("utf8");
    const dbData = JSON.parse(dbString);
    const data = dbData.data || dbData;

    const reconstructImages = (list) => {
      if (!list) return [];
      return list.map((item) => {
        if (
          item.image &&
          !item.image.startsWith("data:") &&
          !item.image.startsWith("http")
        ) {
          const imgFileName = item.image.split("/").pop();
          const imgEntry = zipEntries.find((e) =>
            e.entryName.includes(imgFileName)
          );
          if (imgEntry) {
            const ext = imgFileName.split(".").pop();
            const base64 = imgEntry.getData().toString("base64");
            item.image = `data:image/${ext};base64,${base64}`;
          }
        }
        return item;
      });
    };

    console.log("Cleaning existing data...");
    await Promise.all([
      Brand.deleteMany({}),
      Device.deleteMany({}),
      Service.deleteMany({}),
      Inquiry.deleteMany({}),
    ]);

    console.log("Inserting new data...");
    if (data.brands) await Brand.insertMany(reconstructImages(data.brands));
    if (data.devices) await Device.insertMany(reconstructImages(data.devices));
    if (data.services) await Service.insertMany(data.services);
    if (data.inquiries) await Inquiry.insertMany(data.inquiries);

    res
      .status(200)
      .json({ success: true, message: "System Restored Successfully!" });
  } catch (error) {
    console.error("Restore Failed:", error);
    res.status(500).json({ message: "Restore Failed: " + error.message });
  }
};

// ==========================================
// 3. EXPORT FULL PROJECT EXCEL (Report)
// ==========================================
export const exportExcel = async (req, res) => {
  try {
    console.log("📊 Starting Full Excel Export...");

    const [brands, devices, services, inquiries, contacts] = await Promise.all([
      Brand.find({}).lean(),
      Device.find({}).lean(),
      Service.find({}).lean(),
      Inquiry.find({}).lean(),
      Contact.find({}).lean(),
    ]);

    const workbook = xlsx.utils.book_new();

    const addSheet = (data, sheetName) => {
      if (data.length === 0) return;
      const cleanData = data.map((item) => {
        const row = { ...item };
        if (row._id) row._id = row._id.toString();
        if (row.brand) row.brand = row.brand.toString();
        if (row.device) row.device = row.device.toString();
        if (sheetName === "Inquiries" && Array.isArray(row.selectedServices)) {
          row.selectedServices = row.selectedServices
            .map((s) => `${s.name} ($${s.price})`)
            .join(", ");
        }
        if (row.createdAt)
          row.createdAt = new Date(row.createdAt).toISOString();
        if (row.updatedAt)
          row.updatedAt = new Date(row.updatedAt).toISOString();
        return row;
      });
      const worksheet = xlsx.utils.json_to_sheet(cleanData);
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    };

    addSheet(brands, "Brands");
    addSheet(devices, "Devices");
    addSheet(services, "Services");
    addSheet(inquiries, "Inquiries");
    addSheet(contacts, "Contacts");

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    const fileName = `CellClinic_Report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Excel Export Failed:", error);
    res.status(500).json({ message: "Excel Export Failed: " + error.message });
  }
};

// ==========================================
// 4. EXPORT BRAND REPORT (ReadOnly)
// ==========================================
export const exportBrandExcel = async (req, res) => {
  try {
    const { brandId } = req.params;
    const brand = await Brand.findById(brandId).lean();
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const devices = await Device.find({ brand: brandId }).lean();
    const deviceIds = devices.map((d) => d._id);
    const services = await Service.find({ device: { $in: deviceIds } })
      .populate("device", "name")
      .lean();

    const workbook = xlsx.utils.book_new();

    const brandData = [
      {
        ID: brand._id.toString(),
        Name: brand.name,
        Image: brand.image,
        Active: brand.isActive,
      },
    ];
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.json_to_sheet(brandData),
      "Brand Details"
    );

    const deviceData = devices.map((d) => ({
      ID: d._id.toString(),
      Name: d.name,
      Type: d.type,
      Image: d.image,
      Active: d.isActive,
    }));
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.json_to_sheet(deviceData),
      "Devices"
    );

    const serviceData = services.map((s) => ({
      ID: s._id.toString(),
      DeviceName: s.device?.name || "Unknown",
      Title: s.title,
      Price: s.price,
      Description: s.description || "",
      Active: s.isActive,
    }));
    xlsx.utils.book_append_sheet(
      workbook,
      xlsx.utils.json_to_sheet(serviceData),
      "Services"
    );

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    const cleanName = brand.name.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Brand_Report_${cleanName}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Brand Export Failed:", error);
    res.status(500).json({ message: "Export Failed: " + error.message });
  }
};

// ==========================================
// 5. GLOBAL EDITABLE EXCEL (For Bulk Import)
// ==========================================
export const exportEditableExcel = async (req, res) => {
  try {
    console.log("📝 Starting Editable Excel Export (Global)...");

    const [brands, devices, services] = await Promise.all([
      Brand.find({}).lean(),
      Device.find({}).lean(),
      Service.find({}).lean(),
    ]);

    const rows = buildEditableRows(brands, devices, services);

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Bulk Import Data");

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    const fileName = `Editable_Catalog_ALL_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Editable Export Failed:", error);
    res.status(500).json({ message: "Export Failed: " + error.message });
  }
};

// ==========================================
// 6. BRAND EDITABLE EXCEL (For Brand Import)
// ==========================================
export const exportBrandEditableExcel = async (req, res) => {
  try {
    const { brandId } = req.params;
    console.log(`📝 Starting Editable Excel Export for Brand: ${brandId}`);

    const brand = await Brand.findById(brandId).lean();
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Fetch only this brand's devices
    const devices = await Device.find({ brand: brandId }).lean();

    // Fetch only services for those devices
    const deviceIds = devices.map((d) => d._id);
    const services = await Service.find({ device: { $in: deviceIds } }).lean();

    // Re-use the helper to build rows
    const rows = buildEditableRows([brand], devices, services);

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Brand Import Data");

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    const cleanName = brand.name.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Editable_Brand_${cleanName}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Brand Editable Export Failed:", error);
    res.status(500).json({ message: "Export Failed: " + error.message });
  }
};

// ==========================================
// HELPER FUNCTION (FIXED)
// ==========================================
function buildEditableRows(brands, devices, services) {
  const rows = [];

  for (const brand of brands) {
    // FIX 1: Add optional chaining ?.toString() to prevent crash if d.brand is missing
    const brandDevices = devices.filter(
      (d) => d.brand?.toString() === brand._id.toString()
    );

    if (brandDevices.length === 0) {
      rows.push({
        Brand_Name: brand.name,
        Brand_Image: brand.image,
        Brand_Title: brand.title || "",
        Brand_Subtitle: brand.subtitle || "",
        Brand_Hero_Text: brand.heroText || "",
        Brand_Hero_Desc: brand.heroDesc || "",
      });
      continue;
    }

    for (const device of brandDevices) {
      // FIX 2: Add optional chaining ?.toString() here too
      const deviceServices = services.filter(
        (s) => s.device?.toString() === device._id.toString()
      );

      if (deviceServices.length === 0) {
        rows.push({
          Brand_Name: brand.name,
          Brand_Image: brand.image,
          Brand_Title: brand.title || "",
          Brand_Subtitle: brand.subtitle || "",
          Brand_Hero_Text: brand.heroText || "",
          Brand_Hero_Desc: brand.heroDesc || "",
          Device_Name: device.name,
          Device_Type: device.type,
          Device_Image: device.image,
        });
        continue;
      }

      for (const service of deviceServices) {
        rows.push({
          Brand_Name: brand.name,
          Brand_Image: brand.image,
          Brand_Title: brand.title || "",
          Brand_Subtitle: brand.subtitle || "",
          Brand_Hero_Text: brand.heroText || "",
          Brand_Hero_Desc: brand.heroDesc || "",
          Device_Name: device.name,
          Device_Type: device.type,
          Device_Image: device.image,
          Service_Title: service.title,
          Service_Price: service.price,
          Service_Desc: service.description || "",
        });
      }
    }
  }
  return rows;
}
