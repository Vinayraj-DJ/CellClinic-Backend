import Brand from "../../database/models/catalog/brand.model.js";
import Device from "../../database/models/catalog/device.model.js";
import Service from "../../database/models/catalog/service.model.js";
import xlsx from "xlsx";

// --- HELPER: Convert Buffer to Base64 String ---
const bufferToBase64 = (mimetype, buffer) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

// ==========================================
// 1. PUBLIC READ APIs
// ==========================================

export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true });
    res.status(200).json({ success: true, data: brands });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDevicesByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    // Sort by _id descending to show newest devices first
    // This preserves Excel upload order within each batch
    const devices = await Device.find({ brand: brandId, isActive: true }).sort({ _id: -1 });
    res.status(200).json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getServicesByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const services = await Service.find({ device: deviceId, isActive: true });
    res.status(200).json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Global Search API
export const searchCatalog = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json({ success: true, data: [] });

    const regex = new RegExp(query, "i");

    // 1. Search Brands
    const brands = await Brand.find({ name: regex, isActive: true }).limit(5);

    // 2. Search Devices (Smart Search: Brand + Model)
    // We use aggregation to join brand name so we can search "Apple iPhone"
    const devices = await Device.aggregate([
      {
        $lookup: {
          from: "brands", // Collection name is usually lowercase plural
          localField: "brand",
          foreignField: "_id",
          as: "brandInfo",
        },
      },
      { $unwind: "$brandInfo" },
      {
        $addFields: {
          fullName: {
            $cond: {
              if: {
                $eq: [
                  {
                    $indexOfCP: [
                      { $toLower: "$name" },
                      { $toLower: "$brandInfo.name" },
                    ],
                  },
                  0,
                ],
              },
              then: "$name",
              else: { $concat: ["$brandInfo.name", " ", "$name"] },
            },
          },
        },
      },
      {
        $match: {
          isActive: true,
          $or: [{ name: regex }, { fullName: regex }],
        },
      },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          fullName: 1,
          brandName: "$brandInfo.name",
        },
      },
    ]);

    const results = [
      ...brands.map((b) => ({
        type: "brand",
        id: b._id,
        name: b.name,
        fullName: b.name,
        image: b.image,
        brandName: b.name,
      })),
      ...devices.map((d) => ({
        type: "device",
        id: d._id,
        name: d.name,
        fullName: d.fullName,
        image: d.image,
        brandName: d.brandName,
      })),
    ];

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Search API Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 2. ADMIN WRITE APIs (MANUAL)
// ==========================================

// --- BRAND ---
export const createBrand = async (req, res) => {
  try {
    let imageUrl = req.body.image;
    // NEW (Fixed)
    if (req.file) {
      imageUrl = req.file.path;
    }

    if (!req.body.name || !imageUrl) {
      return res.status(400).json({ message: "Name and Image are required" });
    }

    const brand = await Brand.create({ ...req.body, image: imageUrl });
    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// File: src/modules/catalog/catalog.controller.js

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    let imageUrl = req.body.image;

    // --- FIX: Use req.file.path (Cloudinary URL) ---
    if (req.file) {
      imageUrl = req.file.path;
    }
    // -----------------------------------------------

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      { ...req.body, ...(imageUrl && { image: imageUrl }) },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedBrand });
  } catch (err) {
    // This catches the error and sends it to the frontend
    console.error("Update Brand Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    await Brand.findByIdAndDelete(id);
    await Device.deleteMany({ brand: id }); // Cascade delete
    res.status(200).json({ success: true, message: "Brand deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- DEVICE ---
export const createDevice = async (req, res) => {
  try {
    let imageUrl = req.body.image;

    // --- CHANGE ONLY THIS BLOCK ---
    if (req.file) {
      // OLD: imageUrl = bufferToBase64(req.file.mimetype, req.file.buffer);
      // NEW: Cloudinary automatically puts the URL in 'path'
      imageUrl = req.file.path;
    }
    // -----------------------------

    const device = await Device.create({ ...req.body, image: imageUrl });
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    let imageUrl = req.body.image;

    // --- CHANGE ONLY THIS BLOCK ---
    if (req.file) {
      // OLD: imageUrl = bufferToBase64(req.file.mimetype, req.file.buffer);
      // NEW:
      imageUrl = req.file.path;
    }
    // -----------------------------

    const updatedDevice = await Device.findByIdAndUpdate(
      id,
      { ...req.body, ...(imageUrl && { image: imageUrl }) },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedDevice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await Device.findByIdAndDelete(id);
    await Service.deleteMany({ device: id }); // Cascade delete
    res.status(200).json({ success: true, message: "Device deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- SERVICE ---
export const createService = async (req, res) => {
  try {
    const { title, price, device, description } = req.body;
    const service = await Service.create({
      title,
      price,
      description,
      device,
      isActive: true,
    });
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await Service.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json({ success: true, data: updatedService });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 3. EXCEL UPLOAD APIs (SMART LOGIC ADDED)
// ==========================================

// Global Bulk Upload
export const bulkUploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let stats = { brands: 0, devices: 0, services: 0 };

    // --- SMART MEMORY FOR "FILL DOWN" ---
    let lastBrand = null;
    let lastDevice = null;

    for (const row of data) {
      // 1. BRAND HANDLING (Fill Down Logic)
      // If row has Brand_Name, use it and update memory. If blank, use lastBrand.
      const brandName = row.Brand_Name?.trim() || lastBrand?.name;

      if (!brandName) continue; // Skip if no brand found at all

      // Only hit DB if brand changed from last row (Optimization)
      if (
        !lastBrand ||
        lastBrand.name.toLowerCase() !== brandName.toLowerCase()
      ) {
        let brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${brandName}$`, "i") },
        });

        const brandData = {
          name: brandName,
          image: row.Brand_Image || "https://placehold.co/100",
          title: row.Brand_Title,
          subtitle: row.Brand_Subtitle,
          heroText: row.Brand_Hero_Text,
          heroDesc: row.Brand_Hero_Desc,
        };

        if (!brand) {
          brand = await Brand.create(brandData);
          stats.brands++;
        } else if (row.Brand_Hero_Text) {
          // Update details if provided on this row
          await Brand.updateOne({ _id: brand._id }, brandData);
        }
        lastBrand = brand; // Update Memory
        lastDevice = null; // Reset device memory when brand changes
      }

      // 2. DEVICE HANDLING (Fill Down Logic)
      const deviceName = row.Device_Name?.trim() || lastDevice?.name;

      if (deviceName) {
        if (
          !lastDevice ||
          lastDevice.name.toLowerCase() !== deviceName.toLowerCase()
        ) {
          let device = await Device.findOne({
            name: { $regex: new RegExp(`^${deviceName}$`, "i") },
            brand: lastBrand._id,
          });

          if (!device) {
            device = await Device.create({
              name: deviceName,
              brand: lastBrand._id,
              type: row.Device_Type?.toLowerCase() || "mobile",
              image: row.Device_Image || "https://placehold.co/150",
            });
            stats.devices++;
          }
          lastDevice = device; // Update Memory
        }

        // 3. SERVICE HANDLING (Comma Separation Logic)
        const rawServices = row.Service_Title
          ? row.Service_Title.toString().split(",")
          : [];
        const rawPrices = row.Service_Price
          ? row.Service_Price.toString().split(",")
          : [];

        // Loop through comma-separated services
        for (let i = 0; i < rawServices.length; i++) {
          const serviceTitle = rawServices[i].trim();
          const price = rawPrices[i] ? parseFloat(rawPrices[i].trim()) : 0;

          if (serviceTitle) {
            await Service.findOneAndUpdate(
              { title: serviceTitle, device: lastDevice._id },
              {
                title: serviceTitle,
                description: row.Service_Desc || "", // Description usually applies to all if comma separated, or just basic
                price: price,
                device: lastDevice._id,
                isActive: true,
              },
              { upsert: true }
            );
            stats.services++;
          }
        }
      }
    }
    res.status(200).json({
      success: true,
      message: `Processed ${stats.brands} Brands, ${stats.devices} Devices, ${stats.services} Services.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Excel failed: " + err.message });
  }
};

// Brand Specific Upload (With same smart logic)
export const uploadBrandExcel = async (req, res) => {
  try {
    const { id: brandId } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let stats = { devices: 0, services: 0 };
    let lastDevice = null;

    for (const row of data) {
      // 1. Device (Fill Down)
      const deviceName = row.Device_Name?.trim() || lastDevice?.name;

      if (!deviceName) continue;

      if (
        !lastDevice ||
        lastDevice.name.toLowerCase() !== deviceName.toLowerCase()
      ) {
        let device = await Device.findOne({
          name: { $regex: new RegExp(`^${deviceName}$`, "i") },
          brand: brandId,
        });
        if (!device) {
          device = await Device.create({
            name: deviceName,
            brand: brandId,
            type: row.Device_Type?.toLowerCase() || "mobile",
            image: row.Device_Image || "https://placehold.co/150",
          });
          stats.devices++;
        }
        lastDevice = device;
      }

      // 2. Services (Comma Separated)
      const rawServices = row.Service_Title
        ? row.Service_Title.toString().split(",")
        : [];
      const rawPrices = row.Service_Price
        ? row.Service_Price.toString().split(",")
        : [];

      for (let i = 0; i < rawServices.length; i++) {
        const serviceTitle = rawServices[i].trim();
        const price = rawPrices[i] ? parseFloat(rawPrices[i].trim()) : 0;

        if (serviceTitle) {
          await Service.findOneAndUpdate(
            { title: serviceTitle, device: lastDevice._id },
            {
              title: serviceTitle,
              description: row.Service_Desc || "",
              price: price,
              device: lastDevice._id,
              isActive: true,
            },
            { upsert: true }
          );
          stats.services++;
        }
      }
    }
    res.status(200).json({
      success: true,
      message: `Imported to ${brand.name}: ${stats.devices} Devices, ${stats.services} Services.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Excel failed: " + err.message });
  }
};
