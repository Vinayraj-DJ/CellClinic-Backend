import Brand from "../../database/models/catalog/brand.model.js";
import Device from "../../database/models/catalog/device.model.js";
import Service from "../../database/models/catalog/service.model.js";

// This function takes the HUGE JSON object from frontend and puts it into MongoDB
export const seedDatabase = async (req, res) => {
  try {
    const brandsData = req.body; // This expects the object you pasted above

    if (!brandsData || Object.keys(brandsData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No data provided" });
    }

    const results = { brands: 0, devices: 0, services: 0 };

    console.log("🚀 Starting Seed Process...");

    // Loop through each brand key (apple, samsung, ipad, etc.)
    for (const [key, data] of Object.entries(brandsData)) {
      // 1. Determine Type based on key
      let type = "mobile";
      if (key === "ipad" || key.includes("tablet")) type = "tablet";
      if (key === "macbook" || key.includes("laptop")) type = "laptop";
      if (key === "smartwatch" || key.includes("watch")) type = "smartwatch";

      console.log(`Processing Brand: ${data.name} (${type})`);

      // 2. Create or Update Brand
      const brand = await Brand.findOneAndUpdate(
        { name: data.name },
        {
          name: data.name,
          image: data.image || "https://via.placeholder.com/150", // Fallback image
        },
        { upsert: true, new: true }
      );
      results.brands++;

      // 3. Create Devices (Models)
      if (data.models && data.models.length > 0) {
        for (const model of data.models) {
          const device = await Device.findOneAndUpdate(
            { name: model.name },
            {
              name: model.name,
              image: model.img || "https://via.placeholder.com/150",
              brand: brand._id,
              type: type,
            },
            { upsert: true, new: true }
          );
          results.devices++;

          // 4. Create Services for this specific Device
          // (Since your JSON defines services at the Brand level, we apply them to ALL devices of that brand)
          if (data.services && data.services.length > 0) {
            for (const srv of data.services) {
              await Service.findOneAndUpdate(
                { title: srv.title, device: device._id },
                {
                  title: srv.title,
                  description: srv.desc,
                  price: 0, // Default price (Admin can update later via Dashboard)
                  originalPrice: 0,
                  discount: "0%",
                  device: device._id,
                },
                { upsert: true }
              );
              results.services++;
            }
          }
        }
      }
    }

    console.log("✅ Seeding Complete:", results);

    return res.status(200).json({
      success: true,
      message: "Database Seeded Successfully!",
      stats: results,
    });
  } catch (error) {
    console.error("Seeding Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
